import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import {
  CANONICAL_HEADERS,
  DATE_COL_REGEX,
  HEADER_ALIASES,
} from "@/constants/headers";
import type { ParsedDispo } from "@/types";
import { requireLogin } from "@/lib/auth";
import { appendLog } from "@/lib/activityLog";

function extractDate(cellValue: unknown): string {
  if (!cellValue) return "";
  const str = String(cellValue);
  // Try to find a date pattern like DD.MM.YYYY or YYYY-MM-DD
  const match =
    str.match(/\d{2}\.\d{2}\.\d{4}/) ||
    str.match(/\d{4}-\d{2}-\d{2}/) ||
    str.match(/\d{2}\/\d{2}\/\d{4}/);
  return match ? match[0] : str.slice(0, 50);
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"];

function normaliseHeader(h: unknown): string {
  if (h instanceof Date) {
    const month = MONTH_NAMES[h.getUTCMonth()];
    const year = h.getUTCFullYear();
    return `${month}-${year}`;
  }
  const str = String(h ?? "").trim();
  // Normalise MonYY → Mon-YYYY (e.g. Nov25 → Nov-2025, Sep25 → Sep-2025)
  const shortDate = str.match(
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)(\d{2})$/i
  );
  if (shortDate) {
    const mon = shortDate[1].charAt(0).toUpperCase() + shortDate[1].slice(1).toLowerCase();
    const year = 2000 + parseInt(shortDate[2], 10);
    return `${mon}-${year}`;
  }
  return str;
}

function resolveHeader(raw: string): string {
  const lower = raw.toLowerCase();
  return HEADER_ALIASES[lower] ?? raw;
}

function isDateColumn(h: string): boolean {
  return DATE_COL_REGEX.test(h.trim());
}

function isRowBlank(row: unknown[]): boolean {
  return row.every((c) => {
    if (c === null || c === undefined) return true;
    if (c instanceof Date) return false; // date values are not blank
    return String(c).trim() === "";
  });
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requireLogin(req);
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to 2D array (raw)
    const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
      blankrows: true,
    });

    if (!raw.length) return NextResponse.json({ error: "Sheet is empty" }, { status: 400 });

    // Capture A1 date before any stripping
    const sourceDate = extractDate(raw[0]?.[0]);

    // Find header row: first row where any cell contains "VENDOR" (case-insensitive)
    let headerRowIdx = -1;
    for (let i = 0; i < raw.length; i++) {
      if (raw[i].some((c) => String(c ?? "").trim().toUpperCase() === "VENDOR")) {
        headerRowIdx = i;
        break;
      }
    }
    if (headerRowIdx === -1) {
      return NextResponse.json({ error: "Could not find VENDOR header row" }, { status: 400 });
    }

    // Slice from header row down
    const sliced = raw.slice(headerRowIdx);

    // Raw headers (row 0 of sliced)
    const rawHeaders = (sliced[0] as unknown[]).map(normaliseHeader);

    // Find first non-blank column offset (to handle col B start)
    const colOffset = rawHeaders.findIndex((h) => h !== "");

    // Data rows (row 1+), remove blank rows and "Records Displayed" rows
    const dataRows = sliced.slice(1).filter((row) => {
      if (isRowBlank(row as unknown[])) return false;
      if ((row as unknown[]).some((c) => String(c ?? "").includes("Records Displayed"))) return false;
      return true;
    });

    // Build column list from non-blank header positions only
    const colIndices: number[] = [];
    const headersRaw: string[] = [];
    for (let i = colOffset; i < rawHeaders.length; i++) {
      const h = rawHeaders[i];
      // Keep if header exists OR column has any data
      const hasData = dataRows.some((row) => {
        const v = (row as unknown[])[i];
        return v !== null && v !== undefined && String(v).trim() !== "";
      });
      if (h === "" && !hasData) continue; // totally blank — skip
      colIndices.push(i);
      headersRaw.push(h);
    }

    // Resolve header aliases and normalise
    const resolvedHeaders = headersRaw.map(resolveHeader);

    // Identify date columns
    const dateColumns = resolvedHeaders.filter(isDateColumn);

    // Identify unknown headers (not in canonical list and not a date column)
    const canonicalSet = new Set(CANONICAL_HEADERS.map((h) => h.toLowerCase()));
    const unknownHeaders = resolvedHeaders.filter(
      (h) => h !== "" && !canonicalSet.has(h.toLowerCase()) && !isDateColumn(h)
    );

    // Identify missing canonical headers (date cols excluded from check)
    const resolvedSet = new Set(resolvedHeaders.map((h) => h.toLowerCase()));
    const missingHeaders = CANONICAL_HEADERS.filter(
      (h) => !resolvedSet.has(h.toLowerCase())
    );

    // Build row objects — serialize Date objects to ISO strings
    const rows: Record<string, unknown>[] = dataRows.map((row) => {
      const obj: Record<string, unknown> = {};
      colIndices.forEach((ci, idx) => {
        const header = resolvedHeaders[idx] || `__col_${ci}`;
        const val = (row as unknown[])[ci];
        obj[header] = val instanceof Date ? val.toISOString() : val ?? null;
      });
      return obj;
    });

    // Extract unique vendors
    const vendorSet = new Set<string>();
    rows.forEach((row) => {
      const v = row["Vendor"];
      if (v !== null && v !== undefined && String(v).trim() !== "") {
        vendorSet.add(String(v).trim());
      }
    });
    const vendors = Array.from(vendorSet).sort();

    // Build vendor name map — numeric vendors only, first Name value found per vendor
    const vendorNames: Record<string, string> = {};
    for (const vendor of vendors) {
      if (/^\d+$/.test(vendor)) {
        const vendorRow = rows.find((r) => String(r["Vendor"] ?? "").trim() === vendor);
        if (vendorRow) {
          vendorNames[vendor] = String(vendorRow["Name"] ?? "").trim().toUpperCase();
        }
      }
    }

    const result: ParsedDispo = {
      sourceDate,
      headers: resolvedHeaders.filter((h) => h !== ""),
      rows,
      vendors,
      vendorNames,
      unknownHeaders: [...new Set(unknownHeaders)],
      missingHeaders,
    };

    await appendLog({
      userId: user.id,
      userEmail: user.email,
      userName: `${user.name} ${user.surname}`,
      action: "upload",
      details: file.name,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    const userOrRes = await requireLogin(req).catch(() => null);
    if (userOrRes && !(userOrRes instanceof NextResponse)) {
      appendLog({
        userId: userOrRes.id,
        userEmail: userOrRes.email,
        userName: `${userOrRes.name} ${userOrRes.surname}`,
        action: "error",
        details: err instanceof Error ? err.message : "Parse failed",
      }).catch(() => {});
    }
    return NextResponse.json({ error: "Failed to parse file" }, { status: 500 });
  }
}

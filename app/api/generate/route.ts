import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import {
  CANONICAL_HEADERS,
  DATE_COL_INSERT_AFTER,
  DATE_COL_BEFORE,
  DATE_COL_REGEX,
} from "@/constants/headers";
import type { GenerateRequest, GeneratedFile } from "@/types";
import { requireLogin } from "@/lib/auth";
import { appendLog } from "@/lib/activityLog";

const isDC = (vendor: string) => /[a-zA-Z]/.test(vendor);

function buildFinalHeaders(
  presentHeaders: string[],
  headerMapping: Record<string, string | null>
): string[] {
  // Apply user mappings; null = skip column
  const mappedHeaders = presentHeaders
    .map((h) => (h in headerMapping ? headerMapping[h] : h))
    .filter((h): h is string => h !== null);

  const dateCols = mappedHeaders.filter((h) => DATE_COL_REGEX.test(h));
  const presentSet = new Set(mappedHeaders.map((h) => h.toLowerCase()));
  const insertIdx = CANONICAL_HEADERS.indexOf(DATE_COL_INSERT_AFTER);

  const finalOrder: string[] = [];
  const used = new Set<string>();

  // Walk canonical list — only emit headers present in the file
  for (const h of CANONICAL_HEADERS) {
    if (presentSet.has(h.toLowerCase()) && !used.has(h.toLowerCase())) {
      finalOrder.push(h);
      used.add(h.toLowerCase());
    }
    if (h === DATE_COL_INSERT_AFTER) {
      for (const dc of dateCols) {
        if (!used.has(dc.toLowerCase())) {
          finalOrder.push(dc);
          used.add(dc.toLowerCase());
        }
      }
    }
    if (h === DATE_COL_BEFORE && insertIdx === -1) {
      for (const dc of dateCols) {
        if (!used.has(dc.toLowerCase())) {
          finalOrder.push(dc);
          used.add(dc.toLowerCase());
        }
      }
    }
  }

  // Safety net: append any present headers not in canonical
  for (const h of mappedHeaders) {
    if (!used.has(h.toLowerCase()) && !DATE_COL_REGEX.test(h)) {
      finalOrder.push(h);
      used.add(h.toLowerCase());
    }
  }

  return finalOrder;
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requireLogin(req);
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes;

    const body: GenerateRequest = await req.json();
    const { headers, rows, groups, headerMapping, week, channel } = body;

    const finalHeaders = buildFinalHeaders(headers, headerMapping);
    const files: GeneratedFile[] = [];

    for (const group of groups) {
      // Step 1: collect Articles from the selected real vendors
      const vendorArticles = new Set<string>();
      rows.forEach((row) => {
        const vendor = String(row["Vendor"] ?? "").trim();
        if (group.vendors.includes(vendor)) {
          const article = String(row["Article"] ?? "").trim();
          if (article) vendorArticles.add(article);
        }
      });

      // Step 2: filter rows — include selected vendor rows + DC rows whose Article matches
      const groupRows = rows.filter((row) => {
        const vendor = String(row["Vendor"] ?? "").trim();
        if (group.vendors.includes(vendor)) return true;
        if (isDC(vendor)) {
          const article = String(row["Article"] ?? "").trim();
          return vendorArticles.has(article);
        }
        return false;
      });

      // Step 3: build sheet data
      const sheetData: unknown[][] = [finalHeaders];
      for (const row of groupRows) {
        const rowArr = finalHeaders.map((h) => {
          const originalKey = Object.keys(headerMapping).find(
            (k) => headerMapping[k] === h
          );
          return row[h] ?? (originalKey ? row[originalKey] : null) ?? null;
        });
        sheetData.push(rowArr);
      }

      // Step 4: file naming — VD {VendorName} ({vendorNumber}-{week}) {channel} - CLEANED
      const numericVendors = group.vendors.filter((v) => /^\d+$/.test(v));
      const vendorNumber = numericVendors.join("_");

      // Get vendor name from first matching row's Name field
      const firstVendorRow = rows.find((r) =>
        numericVendors.includes(String(r["Vendor"] ?? "").trim())
      );
      const vendorName = firstVendorRow
        ? String(firstVendorRow["Name"] ?? "").trim().toUpperCase()
        : vendorNumber;

      const fileLabel = vendorName || vendorNumber;
      const filename = `VD ${fileLabel} (${vendorNumber}-${week}) ${channel} - CLEANED.xlsx`;
      const sheetName = vendorNumber.slice(0, 31);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const buf = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      files.push({ filename, base64: buf });
    }

    await appendLog({
      userId: user.id,
      userEmail: user.email,
      userName: `${user.name} ${user.surname}`,
      action: "generate",
      details: `${files.length} file(s): ${files.map((f) => f.filename).join(", ")}`,
    });

    return NextResponse.json({ files });
  } catch (err) {
    console.error(err);
    const userOrRes2 = await requireLogin(req).catch(() => null);
    if (userOrRes2 && !(userOrRes2 instanceof NextResponse)) {
      appendLog({
        userId: userOrRes2.id,
        userEmail: userOrRes2.email,
        userName: `${userOrRes2.name} ${userOrRes2.surname}`,
        action: "error",
        details: err instanceof Error ? err.message : "Generate failed",
      }).catch(() => {});
    }
    return NextResponse.json({ error: "Failed to generate files" }, { status: 500 });
  }
}

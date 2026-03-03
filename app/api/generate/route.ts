import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import {
  CANONICAL_HEADERS,
  DATE_COL_INSERT_AFTER,
  DATE_COL_BEFORE,
  DATE_COL_REGEX,
} from "@/constants/headers";
import type { GenerateRequest, GeneratedFile } from "@/types";

function numericOnly(vendors: string[]): string {
  const numeric = vendors.filter((v) => /^\d+$/.test(v));
  return numeric.length > 0 ? numeric.join("_") : "COMBINED";
}

function buildFinalHeaders(
  presentHeaders: string[],
  headerMapping: Record<string, string | null>
): string[] {
  // Apply any user header mappings
  const mappedHeaders = presentHeaders.map((h) => headerMapping[h] ?? h);

  // Separate date cols from the rest
  const dateCols = mappedHeaders.filter((h) => DATE_COL_REGEX.test(h));

  // Build canonical order with date cols inserted in the right slot
  const insertIdx = CANONICAL_HEADERS.indexOf(DATE_COL_INSERT_AFTER);
  const finalOrder: string[] = [];

  for (let i = 0; i < CANONICAL_HEADERS.length; i++) {
    const h = CANONICAL_HEADERS[i];
    finalOrder.push(h);
    if (h === DATE_COL_INSERT_AFTER) {
      finalOrder.push(...dateCols);
    }
    if (h === DATE_COL_BEFORE && insertIdx === -1) {
      // Fallback if DATE_COL_INSERT_AFTER not found
      finalOrder.push(...dateCols);
    }
  }

  return finalOrder;
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json();
    const { sourceDate, headers, rows, groups, headerMapping } = body;

    const finalHeaders = buildFinalHeaders(headers, headerMapping);
    const files: GeneratedFile[] = [];

    for (const group of groups) {
      // Filter rows for this vendor group
      const groupRows = rows.filter((row) => {
        const vendor = String(row["Vendor"] ?? "").trim();
        return group.vendors.includes(vendor);
      });

      // Build sheet data
      const sheetData: unknown[][] = [finalHeaders];
      for (const row of groupRows) {
        const rowArr = finalHeaders.map((h) => {
          // Find value — may be under original or mapped key
          const originalKey = Object.keys(headerMapping).find(
            (k) => headerMapping[k] === h
          );
          return row[h] ?? (originalKey ? row[originalKey] : null) ?? null;
        });
        sheetData.push(rowArr);
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      const sheetName = numericOnly(group.vendors).slice(0, 31); // Excel sheet name limit
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const fileBase = numericOnly(group.vendors);
      const filename = `${fileBase}_CLEANED-DISPO_${sourceDate}.xlsx`;

      const buf = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      files.push({ filename, base64: buf });
    }

    return NextResponse.json({ files });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate files" }, { status: 500 });
  }
}

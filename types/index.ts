export interface ParsedDispo {
  parseId: string;              // blob key for stored row data
  sourceDate: string;           // extracted from A1 before stripping
  headers: string[];            // final cleaned header list
  rowCount: number;             // number of data rows (rows stored server-side in blob)
  vendors: string[];            // unique values from VENDOR column (all — real + DCs)
  vendorNames: Record<string, string>; // numeric vendor → Name field value
  unknownHeaders: string[];     // headers in file not in canonical list or date pattern
  missingHeaders: string[];     // canonical headers not found in file (excluding date cols)
  vendorNumber: string | null;  // numeric prefix from sheet name (e.g. "2667")
  vendorNameFromSheet: string | null; // full sheet name for display
}

/** Full parsed data stored server-side in blob (not sent to client) */
export interface StoredParseData {
  headers: string[];
  rows: Record<string, unknown>[];
}

export interface HeaderMapping {
  [originalHeader: string]: string | null; // null = skip this column
}

export interface VendorGroup {
  id: string;
  vendors: string[];
}

export interface GenerateRequest {
  parseId: string;
  groups: VendorGroup[];
  headerMapping: HeaderMapping;
  week: string;
  channel: string;
  vendorNumber?: string;
}

export interface GeneratedFile {
  filename: string;
  base64: string;
}

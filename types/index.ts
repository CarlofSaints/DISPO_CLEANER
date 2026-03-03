export interface ParsedDispo {
  sourceDate: string;           // extracted from A1 before stripping
  headers: string[];            // final cleaned header list
  rows: Record<string, unknown>[];  // data rows keyed by header
  vendors: string[];            // unique values from VENDOR column
  unknownHeaders: string[];     // headers in file not in canonical list or date pattern
  missingHeaders: string[];     // canonical headers not found in file (excluding date cols)
}

export interface HeaderMapping {
  [originalHeader: string]: string | null; // null = skip this column
}

export interface VendorGroup {
  id: string;
  vendors: string[];
}

export interface GenerateRequest {
  sourceDate: string;
  headers: string[];
  rows: Record<string, unknown>[];
  groups: VendorGroup[];
  headerMapping: HeaderMapping;
}

export interface GeneratedFile {
  filename: string;
  base64: string;
}

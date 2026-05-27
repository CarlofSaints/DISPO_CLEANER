// Output column order — exact labels as they appear in the cleaned file.
// Only columns present in the input will appear in the output.
// Date columns (Mon-YYYY or MM-YYYY format) are dynamic and slot between Order Unit and Curr Y/S.
export const CANONICAL_HEADERS = [
  "Vendor",            // A — vendor NUMBER
  "Name",              // B — vendor name
  "Vendor Prod Code",  // C
  "P Term",            // D
  "Article",           // E
  "Article Desc",      // G
  "Barcode",           // H
  "BMC",               // I
  "BMC Description",   // J
  "PBC",               // K
  "Order Unit",        // L
  // DATE COLUMNS GO HERE (dynamic — e.g. Dec-2025 … May-2026, May-2025)
  "Curr Y/S",          // T (after dates)
  "UOM",               // U
  "Compo",             // V
  "Site",              // W
  "Site Name",         // X
  "Status",            // Y
  "RP",                // Z
  "SOH",               // AA
  "SOO",               // AB
  "SIT",               // AC
  "PR QTY",            // AD
  "MAC",               // AE
  "Stock Margin",      // AF
  "List Price",        // AG
  "Nett Cost",         // AH
  "End Date",          // AI
  "Product Margin",    // AJ
  "Planned Margin",    // AK
  "Incl SP",           // AL
  "Prom SP",           // AM
  "SB",                // AN
  "TB",                // AO
  "Ret Ord",           // AP
  "Plan DSC",          // AQ
  "Act DSC",           // AR
  "RR",                // AS
  "Last Recv",         // AT
  "Last Sold",         // AU
  "Dist.Prof.",        // AV
];

// Date columns are inserted after "Order Unit"
export const DATE_COL_INSERT_AFTER = "Order Unit";
export const DATE_COL_BEFORE = "Curr Y/S";

// Known header aliases: key = lower-cased name found in file, value = output label.
// Handles both MB and Makro DISPO formats.
export const HEADER_ALIASES: Record<string, string> = {
  // Vendor / Name
  "vendor name": "Name",            // DISPO "Vendor Name" → output "Name"

  // Article description variants
  "article description": "Article Desc",
  "article desc": "Article Desc",
  descriptio: "Article Desc",

  // Vendor product code
  "vend prod": "Vendor Prod Code",
  "vendor prod code": "Vendor Prod Code",

  // Payment term
  payt: "P Term",
  "p term": "P Term",

  // UOM variants
  uom: "UOM",
  "uoм": "UOM",
  "sell uom": "UOM",
  "sell uoм": "UOM",

  // Comp / Compo
  comp: "Compo",
  compo: "Compo",

  // Status (MB uses "PR ST", Makro uses "Status")
  "pr st": "Status",
  status: "Status",

  // SIT (MB uses "SiT")
  sit: "SIT",

  // Stock Margin (MB uses "Stk Margin")
  "stk margin": "Stock Margin",
  "stock margin": "Stock Margin",

  // Product Margin (MB uses "Prod Marg")
  "prod marg": "Product Margin",
  "product margin": "Product Margin",

  // Promo price variants
  promotional: "Prom SP",
  proms: "Prom SP",
  pro: "Prom SP",
  promo: "Prom SP",

  // Nett Cost variants
  "net cost": "Nett Cost",

  // Receipt / Sold dates (MB uses "Lst Recpt" / "Lst Sold")
  "lst recpt": "Last Recv",
  "last recv": "Last Recv",
  "lst sold": "Last Sold",
  "last sold": "Last Sold",

  // Distribution profile
  "dist. prof.": "Dist.Prof.",
  "dist prof": "Dist.Prof.",

  // Future promo (not in standard output — will land in overflow if present)
  "future pro": "Future Promo",
};

// Regex to detect date-style columns:
//   Mon-YYYY format: Nov-2025, Sept-2025
//   MonYY format:    Nov25, Sep25       (normalised to Mon-YYYY in parse route)
//   MM-YYYY format:  09-2025, 01-2026
export const DATE_COL_REGEX = /^([A-Za-z]+-\d{4}|\d{2}-\d{4})$/;

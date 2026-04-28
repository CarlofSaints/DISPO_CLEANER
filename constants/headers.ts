// Canonical ordered header list
// Covers both MB and Makro formats — buildFinalHeaders only outputs headers present in the file
// Date columns (Mon-YYYY or MM-YYYY format) are dynamic and slot between Stk Margin and Curr Y/S
export const CANONICAL_HEADERS = [
  "Vendor",
  "Name",
  "Article",
  "Article Description",
  "Site",
  "Site Name",       // Makro
  "PR ST",
  "Status",          // Makro alias target
  "RP",
  "SOH",
  "SOO",
  "STO",
  "SiT",
  "PR QTY",          // Makro
  "Free Stock",      // Makro
  "Ret Ord",         // Makro
  "MAC",
  "Nett Cost",
  "List Price",      // Makro
  "Incl SP",
  "Prom SP",
  "SB",              // Makro
  "TB",              // Makro
  "Curr",
  "Stk Margin",
  // DATE COLUMNS GO HERE (dynamic)
  "Curr Y/S",
  "Prod Marg",
  "Planned Margin",  // Makro
  "CoCd",
  "PayT",
  "Description",
  "Vend Prod",
  "BMC",
  "BMC Description", // Makro
  "Class",           // Makro
  "PBC",             // Makro
  "R. Profile",
  "MTyp",
  "Stock In U",
  "0 VAT Rate",
  "Barcode",
  "KMC",
  "EMT",
  "Buyer",
  "Comp in BU",
  "Order Unit",
  "BUoM",
  "SS",
  "Seq No",          // Makro
  "Exp Ind",
  "ABC",
  "UoM",
  "Comp",
  "OUn",
  "Curr",
  "End Date",
  "Excl SP",
  "Curr",
  "Tally",
  "Future Promo",    // Makro (also "Future Pro" in some MB files)
  "Plan DSC",        // Makro
  "Act DSC",
  "RR",              // Makro
  "Lst Recpt",
  "Lst Sold",
  "Dist.Prof.",      // Makro
];

// Index where date columns are inserted (after "Stk Margin")
export const DATE_COL_INSERT_AFTER = "Stk Margin";
export const DATE_COL_BEFORE = "Curr Y/S";

// Known header aliases: key = lower-cased name found in file, value = correct canonical name
export const HEADER_ALIASES: Record<string, string> = {
  // MB aliases
  promotional: "Prom SP",
  proms: "Prom SP",
  pro: "Prom SP",
  promo: "Prom SP",
  "net cost": "Nett Cost",
  "vendor name": "Vendor",
  "sell uom": "UoM",
  "sell uoм": "UoM",
  descriptio: "Description",

  // Makro aliases
  "vendor prod code": "Vend Prod",
  "p term": "PayT",
  "article desc": "Article Description",
  "article description": "Article Description",
  uom: "UoM",
  compo: "Comp",
  status: "PR ST",
  sit: "SiT",
  "stock margin": "Stk Margin",
  "product margin": "Prod Marg",
  "last recv": "Lst Recpt",
  "last sold": "Lst Sold",
  "future pro": "Future Promo",
  "dist. prof.": "Dist.Prof.",
  "dist prof": "Dist.Prof.",
};

// Regex to detect date-style columns:
//   Mon-YYYY format: Nov-2025, Sept-2025
//   MonYY format:    Nov25, Sep25       (normalised to Mon-YYYY in parse route)
//   MM-YYYY format:  09-2025, 01-2026
export const DATE_COL_REGEX = /^([A-Za-z]+-\d{4}|\d{2}-\d{4})$/;

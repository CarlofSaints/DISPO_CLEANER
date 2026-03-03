// Canonical ordered header list
// Date columns (Mon-YYYY format) are dynamic and slot between Stk Margin and Curr Y/S
export const CANONICAL_HEADERS = [
  "Vendor",
  "Name",
  "Article",
  "Article Description",
  "Site",
  "PR ST",
  "RP",
  "SOH",
  "SOO",
  "STO",
  "MAC",
  "Nett Cost",
  "Incl SP",
  "Prom SP",
  "Curr",
  "Stk Margin",
  // DATE COLUMNS GO HERE (dynamic)
  "Curr Y/S",
  "Prod Marg",
  "CoCd",
  "PayT",
  "Descriptio",
  "Vend Prod",
  "BMC",
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
  "Exp Ind",
  "ABC",
  "UoM",
  "Comp",
  "OUn",
  "SiT",
  "Curr",
  "End Date",
  "Excl SP",
  "Curr",
  "Tally",
  "Act DSC",
  "Lst Recpt",
  "Lst Sold",
];

// Index where date columns are inserted (after "Stk Margin")
export const DATE_COL_INSERT_AFTER = "Stk Margin";
export const DATE_COL_BEFORE = "Curr Y/S";

// Known header aliases: key = incorrect name found in file, value = correct canonical name
export const HEADER_ALIASES: Record<string, string> = {
  promotional: "Prom SP",
  proms: "Prom SP",
  pro: "Prom SP",
  promo: "Prom SP",
  "net cost": "Nett Cost",
  "vendor name": "Vendor",
  "sell uom": "UoM",
  "sell uoм": "UoM",
};

// Regex to detect date-style columns (e.g. Sept-2025, Oct-2025, Jan-2026)
export const DATE_COL_REGEX = /^[A-Za-z]+-\d{4}$/;

export type RuleDefinition = {
  id: string;
  label: string;
  sourceType: "regulation" | "market-data" | "judgment" | "calculation";
  rationale: string;
  unknownBehavior: string;
  sourceUrl?: string;
  asOf?: string;
};

export const RULES: RuleDefinition[] = [
  {
    id: "INC-01",
    label: "Lender-recognized income",
    sourceType: "judgment",
    rationale: "Separates evidenced income from turnover and unsupported future income.",
    unknownBehavior: "Creates a wider interval; it never inserts zero as a fact.",
  },
  {
    id: "LEND-01",
    label: "Market-practice FOIR envelope",
    sourceType: "judgment",
    rationale: "Models an indicative lender ceiling by income stability, not an RBI mandate.",
    unknownBehavior: "Uses the full applicable interval.",
  },
  {
    id: "SAFE-01",
    label: "Borrower-safe debt-service ratio",
    sourceType: "judgment",
    rationale: "Leaves more room for essentials, volatility, and shocks than the lender envelope.",
    unknownBehavior: "Unknown savings widen the safe-ratio interval by five percentage points.",
  },
  {
    id: "SAFE-02",
    label: "Cash-flow reserve",
    sourceType: "judgment",
    rationale: "Keeps 10% of conservative monthly income outside essential costs and debt service.",
    unknownBehavior: "Upcoming outflows are requested; unknowns reduce confidence.",
  },
  {
    id: "STOP-01",
    label: "Recent unresolved delinquency and debt stacking",
    sourceType: "judgment",
    rationale: "Avoids adding an EMI while several high-cost debts and a live payment problem coexist.",
    unknownBehavior: "Does not trigger solely because delinquency detail is unknown.",
  },
  {
    id: "ROUTE-01",
    label: "Purpose and collateral routing",
    sourceType: "market-data",
    rationale: "Matches the need to the asset or collateral before considering unsecured credit.",
    unknownBehavior: "Returns a broad recommendation and asks the next material routing question.",
  },
  {
    id: "PRICE-01",
    label: "Fair nominal-rate band",
    sourceType: "market-data",
    rationale: "Local bank/NBFC disclosures are stored as ranges with source and date metadata.",
    unknownBehavior: "Uses the full product envelope instead of penalising an unknown score.",
    asOf: "2026-09-07",
  },
  {
    id: "APR-01",
    label: "APR from cash flows",
    sourceType: "regulation",
    rationale: "Includes mandatory upfront and routed third-party charges in the effective annual cost.",
    unknownBehavior: "Shows a fee-driven APR interval.",
    sourceUrl: "https://rbi.org.in/Scripts/NotificationUser.aspx?Id=12663&Mode=0",
  },
  {
    id: "STRESS-01",
    label: "Primary stress shock",
    sourceType: "judgment",
    rationale: "Tests one legible adverse case: a 20% income drop or a two-point floating-rate rise.",
    unknownBehavior: "Uses the conservative income edge.",
  },
  {
    id: "RBI-MFI-01",
    label: "Low-income-household repayment ceiling",
    sourceType: "regulation",
    rationale: "The 50% ceiling is informational here and only applies to qualifying household loans up to ₹3 lakh annual household income.",
    unknownBehavior: "Never treated as binding without household-income qualification.",
    sourceUrl: "https://www.rbi.org.in/Scripts/FAQDisplay.aspx?Id=147",
  },
];

export const RULE_BY_ID = Object.fromEntries(RULES.map((rule) => [rule.id, rule]));


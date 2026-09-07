import type { AssessmentInput } from "./types";

export type QuestionField = {
  id: string;
  label: string;
  outputDependencies: string[];
};

export type QuestionModule = {
  id: string;
  title: string;
  why: string;
  priority: "hard-stop" | "routing" | "range" | "burden";
  applies: (input: Partial<AssessmentInput>) => boolean;
  fields: QuestionField[];
};

const field = (id: string, label: string, ...outputDependencies: string[]): QuestionField => ({
  id,
  label,
  outputDependencies,
});

export const CORE_QUESTIONS: QuestionField[] = [
  field("purpose", "What is the money for?", "product route", "alternatives"),
  field("requestedAmount", "How much do you want to borrow?", "verdict", "requested EMI"),
  field("consideredProduct", "Which loan are you considering?", "product mismatch", "rate band"),
  field("age", "How old are you?", "maximum tenure", "amount range"),
  field("incomeType", "How do you earn?", "income recognition", "FOIR", "safe ratio"),
  field("monthlyIncome", "What is your recurring monthly take-home income?", "lender amount", "safe amount"),
  field("currentDebtPayments", "What do you repay on all current debts each month?", "EMI headroom", "verdict"),
  field("essentialExpenses", "What are essential household expenses, including rent?", "safe EMI", "stress result"),
  field("creditStatus", "What is your credit status?", "rate range", "confidence"),
  field("recentPaymentIssue", "Any late, bounced, or overdue payment in the last 12 months?", "hard stop", "next action"),
];

export const ADAPTIVE_MODULES: QuestionModule[] = [
  {
    id: "employment-continuity",
    title: "Employment continuity",
    why: "Changes how much salary is recognized and whether a stable-income stress is appropriate.",
    priority: "range",
    applies: (input) => input.incomeType === "salaried" || input.incomeType === "mixed",
    fields: [
      field("employmentStatus", "Employment status", "recognized income", "stress"),
      field("employmentMonths", "Months in current employment", "confidence", "tenure guidance"),
    ],
  },
  {
    id: "business-vintage",
    title: "Business continuity",
    why: "Separates established trading history from a new, less-evidenced business.",
    priority: "range",
    applies: (input) => input.incomeType === "self-employed" || input.incomeType === "mixed",
    fields: [field("businessVintageMonths", "Months in business", "confidence", "lender range")],
  },
  {
    id: "profit-not-turnover",
    title: "Turnover versus take-home profit",
    why: "Prevents sales from being mistaken for income available to repay debt.",
    priority: "range",
    applies: (input) => input.incomeType === "self-employed" || input.incomeType === "mixed",
    fields: [
      field("monthlyTurnover", "Monthly sales or turnover range", "income explanation"),
      field("monthlyNetProfit", "Monthly net profit/take-home range", "recognized income", "capacity"),
    ],
  },
  {
    id: "variable-income",
    title: "Income variability",
    why: "Moves the conservative income edge and lender-recognized variable pay.",
    priority: "range",
    applies: (input) => input.incomeType !== undefined,
    fields: [
      field("variableIncomeShare", "Share of income that varies", "recognized income", "stress type"),
      field("lowestRecentIncome", "Lowest recent month", "safe amount", "stress"),
    ],
  },
  {
    id: "documented-income",
    title: "Income visible to a lender",
    why: "Tightens a self-employed or mixed lender-income interval without treating turnover as income.",
    priority: "range",
    applies: (input) => input.incomeType === "self-employed" || input.incomeType === "mixed",
    fields: [
      field("itrAnnualIncome", "Latest ITR annual income", "recognized income", "lender amount"),
      field("bankVisibleMonthlyIncome", "Bank-visible monthly income range", "recognized income", "confidence"),
    ],
  },
  {
    id: "informal-continuity",
    title: "Informal work continuity",
    why: "Annualizes seasonal work conservatively and distinguishes frequency from a headline month.",
    priority: "range",
    applies: (input) => input.incomeType === "informal" || input.incomeType === "mixed",
    fields: [
      field("informalActiveMonths", "Active earning months in the last year", "safe income", "safe amount"),
      field("informalPaidDaysPerMonth", "Typical paid days per month", "confidence", "income range"),
    ],
  },
  {
    id: "household-load",
    title: "Household load",
    why: "Makes shared income and household responsibility visible in the cash-flow explanation.",
    priority: "burden",
    applies: () => true,
    fields: [
      field("otherHouseholdIncome", "Other household income not used as co-applicant income", "cash-flow context"),
      field("dependants", "Number of dependants", "confidence", "next action"),
    ],
  },
  {
    id: "co-applicant",
    title: "Co-applicant",
    why: "Adds only documented, willing net contribution after their own obligations.",
    priority: "range",
    applies: () => true,
    fields: [
      field("coApplicant.willing", "Is the co-applicant willing?", "recognized income", "route"),
      field("coApplicant.documented", "Is their income documented?", "recognized income", "confidence"),
      field("coApplicant.monthlyIncome", "Co-applicant monthly income", "capacity"),
      field("coApplicant.monthlyObligations", "Co-applicant monthly obligations", "capacity"),
    ],
  },
  {
    id: "emergency-savings",
    title: "Emergency savings",
    why: "Moves the safe debt ratio by zero, 2.5, or 5 percentage points.",
    priority: "range",
    applies: () => true,
    fields: [field("emergencySavingsMonths", "Months of essential expenses saved", "safe ratio", "safe amount")],
  },
  {
    id: "upcoming-expense",
    title: "Upcoming committed expense",
    why: "Reserves the monthly amount needed before the due date.",
    priority: "hard-stop",
    applies: () => true,
    fields: [
      field("upcomingExpense.amount", "Amount of unavoidable expense", "safe EMI", "verdict"),
      field("upcomingExpense.monthsUntilDue", "Months until it is due", "monthly reserve", "safe amount"),
    ],
  },
  {
    id: "debt-schedule",
    title: "Current debt schedule",
    why: "Reconciles the EMI total and reveals high-cost debt or a near-term payoff.",
    priority: "hard-stop",
    applies: (input) => (input.currentDebtPayments ?? 0) > 0,
    fields: [
      field("activeDebts.balance", "Outstanding balance", "next action"),
      field("activeDebts.emi", "Monthly EMI", "EMI reconciliation", "capacity"),
      field("activeDebts.annualRate", "Annual rate", "high-cost debt count", "hard stop"),
      field("activeDebts.monthsLeft", "Remaining months", "wait alternative", "action"),
    ],
  },
  {
    id: "card-behaviour",
    title: "Credit-card behaviour",
    why: "High utilisation or revolving balances changes the debt-cleanup action.",
    priority: "hard-stop",
    applies: () => true,
    fields: [
      field("cardUtilisationPercent", "Credit-card utilisation", "action", "confidence"),
      field("cardPaidInFull", "Paid in full each month?", "high-cost debt status", "verdict"),
    ],
  },
  {
    id: "delinquency-detail",
    title: "Payment issue status",
    why: "A resolved old issue is different from a current unpaid amount.",
    priority: "hard-stop",
    applies: (input) => input.recentPaymentIssue === true,
    fields: [
      field("delinquency.monthsAgo", "Months since the issue", "action", "confidence"),
      field("delinquency.unresolvedAmount", "Amount still unresolved", "hard stop", "verdict"),
      field("delinquency.resolved", "Is it resolved?", "hard stop", "verdict"),
    ],
  },
  {
    id: "collateral",
    title: "Available collateral",
    why: "Changes both product route and the asset-value cap without assuming willingness to pledge.",
    priority: "routing",
    applies: (input) => ["business", "lap", "gold", "not-sure"].includes(input.consideredProduct ?? ""),
    fields: [
      field("collateral.type", "Collateral type", "product route"),
      field("collateral.value", "Estimated value", "LTV cap", "amount"),
      field("collateral.ownedByApplicant", "Owned by applicant?", "eligibility", "route"),
      field("collateral.encumbered", "Already pledged?", "eligibility", "route"),
      field("collateral.essentialAsset", "Essential home/business asset?", "risk warning"),
      field("collateral.willingToPledge", "Willing to pledge it?", "product route"),
    ],
  },
  {
    id: "vehicle",
    title: "Vehicle details",
    why: "Class, use, condition and contribution select a materially different product and amount cap.",
    priority: "routing",
    applies: (input) => Boolean(input.purpose?.toLowerCase().includes("vehicle") || input.purpose?.toLowerCase().includes("scooter") || input.purpose?.toLowerCase().includes("car") || input.consideredProduct === "two-wheeler" || input.consideredProduct === "car" || input.consideredProduct === "commercial-vehicle"),
    fields: [
      field("vehicle.class", "Vehicle class", "product route", "rate band"),
      field("vehicle.use", "Primary use", "product route", "upside treatment"),
      field("vehicle.condition", "New or used", "rate band", "LTV cap"),
      field("vehicle.price", "Invoice price", "amount cap"),
      field("vehicle.downPayment", "Down payment", "amount cap", "requested finance"),
    ],
  },
  {
    id: "property-purchase",
    title: "Home or property purchase",
    why: "Purchase price and own contribution cap the home-loan amount.",
    priority: "routing",
    applies: (input) => Boolean(input.consideredProduct === "home" || input.purpose?.toLowerCase().includes("home")),
    fields: [
      field("propertyPurchase.price", "Purchase price", "LTV cap"),
      field("propertyPurchase.downPayment", "Down payment", "amount cap"),
    ],
  },
  {
    id: "business-split",
    title: "Split the business need",
    why: "Routes stock and vehicle portions separately while preserving one shared EMI ceiling.",
    priority: "routing",
    applies: (input) => Boolean(input.consideredProduct === "business" || input.purpose?.toLowerCase().includes("stock") || input.purpose?.toLowerCase().includes("business")),
    fields: [
      field("businessSplit.workingCapital", "Working-capital amount", "component route", "blended EMI"),
      field("businessSplit.equipment", "Equipment amount", "component route", "blended EMI"),
      field("businessSplit.vehicle", "Vehicle amount", "commercial-vehicle route", "blended EMI"),
    ],
  },
  {
    id: "income-upside",
    title: "Expected income uplift",
    why: "Shows productive upside without allowing uncertain future income into base affordability.",
    priority: "burden",
    applies: (input) => Boolean(input.vehicle?.use === "income-generating" || input.purpose?.toLowerCase().includes("business") || input.purpose?.toLowerCase().includes("stock")),
    fields: [
      field("expectedNetIncomeUplift", "Expected net monthly uplift", "upside scenario"),
      field("upliftEvidence", "Evidence quality", "upside confidence"),
    ],
  },
];

const priorityOrder: Record<QuestionModule["priority"], number> = {
  "hard-stop": 0,
  routing: 1,
  range: 2,
  burden: 3,
};

export const activeAdaptiveModules = (input: Partial<AssessmentInput>) =>
  ADAPTIVE_MODULES.filter((module) => module.applies(input)).sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );

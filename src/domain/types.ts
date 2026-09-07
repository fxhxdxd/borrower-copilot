export type Interval = { min: number; max: number };

export type IncomeType = "salaried" | "self-employed" | "informal" | "mixed";
export type ProductId =
  | "not-sure"
  | "personal"
  | "home"
  | "lap"
  | "gold"
  | "two-wheeler"
  | "business"
  | "car"
  | "commercial-vehicle";

export type Verdict = "BORROW" | "BORROW_LESS" | "DONT_BORROW";
export type CreditStatus =
  | { kind: "exact"; score: number }
  | { kind: "band"; band: "excellent" | "good" | "fair" | "low" }
  | { kind: "no-history" }
  | { kind: "unknown" };

export type VehicleDetails = {
  class: "two-wheeler" | "car" | "three-wheeler-lcv";
  use: "personal" | "income-generating" | "business";
  condition: "new" | "used";
  price: number;
  downPayment: number;
};

export type ActiveDebt = {
  label: string;
  balance: number;
  emi: number;
  annualRate?: number;
  monthsLeft?: number;
  highCost?: boolean;
};

export type AssessmentInput = {
  name?: string;
  city?: string;
  purpose: string;
  requestedAmount: number;
  consideredProduct: ProductId;
  age: number;
  incomeType: IncomeType;
  monthlyIncome: Interval;
  currentDebtPayments: number;
  debtZeroConfirmed: boolean;
  essentialExpenses: number;
  creditStatus: CreditStatus;
  recentPaymentIssue: boolean;

  employmentStatus?: "permanent" | "contract" | "probation" | "between-jobs";
  employmentMonths?: number;
  businessVintageMonths?: number;
  monthlyTurnover?: Interval;
  monthlyNetProfit?: Interval;
  variableIncomeShare?: number;
  lowestRecentIncome?: number;
  itrAnnualIncome?: number;
  bankVisibleMonthlyIncome?: Interval;
  informalActiveMonths?: number;
  informalPaidDaysPerMonth?: number;
  otherHouseholdIncome?: number;
  dependants?: number;
  coApplicant?: {
    monthlyIncome: number;
    documented: boolean;
    monthlyObligations: number;
    willing: boolean;
  };
  emergencySavingsMonths?: number;
  upcomingExpense?: { amount: number; monthsUntilDue: number };
  activeDebts?: ActiveDebt[];
  cardUtilisationPercent?: number;
  cardPaidInFull?: boolean;
  delinquency?: {
    monthsAgo: number;
    unresolvedAmount: number;
    resolved: boolean;
  };
  collateral?: {
    type: "property" | "gold" | "other";
    value: number;
    ownedByApplicant: boolean;
    encumbered: boolean;
    essentialAsset: boolean;
    willingToPledge: boolean;
  };
  vehicle?: VehicleDetails;
  propertyPurchase?: { price: number; downPayment: number };
  businessSplit?: { workingCapital: number; equipment: number; vehicle: number };
  expectedNetIncomeUplift?: number;
  upliftEvidence?: "none" | "weak" | "strong";
};

export type Reason = {
  ruleId: string;
  title: string;
  calculation: string;
};

export type ProductRoute = {
  product: ProductId;
  label: string;
  amount?: number;
  rationale: string;
};

export type StressResult = {
  kind: "income-drop" | "low-month-drop" | "rate-rise";
  label: string;
  normalResidual: number;
  stressedResidual: number;
  normalDebtRatio: number;
  stressedDebtRatio: number;
  status: "pass" | "tight" | "fail";
};

export type AssessmentResult = {
  verdict: Verdict;
  immediateAction: string;
  lenderRecognizedIncome: Interval;
  lenderNewEmi: Interval;
  lenderAmount: Interval;
  safeIncome: Interval;
  safeRatio: Interval;
  safeNewEmi: Interval;
  safeAmount: Interval;
  useAmount: number;
  requestedEmi: number;
  recommendedTenureMonths: number;
  rateBand: Interval;
  aprBand: Interval;
  routes: ProductRoute[];
  productMismatch?: string;
  bindingConstraint: string;
  stress: StressResult;
  confidence: "high" | "medium" | "low";
  missingEvidence: string[];
  reasons: Reason[];
  borrowerCopy: string;
  negotiationLine: string;
  upsideScenario?: { monthlyIncomeUplift: number; plausibleRange: Interval; note: string };
};

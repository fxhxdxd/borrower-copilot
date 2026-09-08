import type { AssessmentInput } from "./types";

export type AssessmentIssue = {
  field: string;
  message: string;
};

export function validateAssessment(input: AssessmentInput): AssessmentIssue[] {
  const issues: AssessmentIssue[] = [];

  if (input.purposeUses.length === 0) issues.push({ field: "purposeUses", message: "Select at least one use for the money." });
  if (!input.purpose.trim()) issues.push({ field: "purpose", message: "Add the borrowing purpose." });
  if (!Number.isFinite(input.requestedAmount) || input.requestedAmount <= 0) issues.push({ field: "requestedAmount", message: "Requested amount must be greater than zero." });
  if (!Number.isFinite(input.age) || input.age < 18 || input.age > 80) issues.push({ field: "age", message: "Age must be between 18 and 80." });
  if (!Number.isFinite(input.monthlyIncome.min) || input.monthlyIncome.min <= 0) issues.push({ field: "monthlyIncome.min", message: "Reliable monthly income must be greater than zero." });
  if (!Number.isFinite(input.monthlyIncome.max) || input.monthlyIncome.max < input.monthlyIncome.min) issues.push({ field: "monthlyIncome.max", message: "The high income edge cannot be below the low edge." });
  if (!Number.isFinite(input.currentDebtPayments) || input.currentDebtPayments < 0) issues.push({ field: "currentDebtPayments", message: "Current repayments cannot be negative." });
  if (input.currentDebtPayments === 0 && !input.debtZeroConfirmed) issues.push({ field: "debtZeroConfirmed", message: "Confirm that zero current repayments really means zero." });
  if (!Number.isFinite(input.essentialExpenses) || input.essentialExpenses <= 0) issues.push({ field: "essentialExpenses", message: "Essential monthly expenses must be greater than zero." });
  if (input.creditStatus.kind === "exact" && (input.creditStatus.score < 300 || input.creditStatus.score > 900)) issues.push({ field: "creditStatus", message: "Credit score must be between 300 and 900." });

  if (input.upcomingExpense) {
    if (input.upcomingExpense.amount < 0) issues.push({ field: "upcomingExpense.amount", message: "Upcoming expense cannot be negative." });
    if (input.upcomingExpense.amount > 0 && input.upcomingExpense.monthsUntilDue < 1) issues.push({ field: "upcomingExpense.monthsUntilDue", message: "An upcoming expense needs a valid due month." });
  }

  if (input.vehicle) {
    if (input.vehicle.price <= 0) issues.push({ field: "vehicle.price", message: "Add a valid vehicle invoice price." });
    if (input.vehicle.downPayment < 0 || input.vehicle.downPayment > input.vehicle.price) issues.push({ field: "vehicle.downPayment", message: "Vehicle down payment must be between zero and the invoice price." });
    const vehicleNeed = input.businessSplit?.vehicle ?? input.requestedAmount;
    if (vehicleNeed > input.vehicle.price - input.vehicle.downPayment) issues.push({ field: "vehicle.finance", message: "Vehicle finance cannot exceed invoice price minus down payment." });
  }

  if (input.propertyPurchase) {
    if (input.propertyPurchase.price <= 0) issues.push({ field: "propertyPurchase.price", message: "Add a valid property price." });
    if (input.propertyPurchase.downPayment < 0 || input.propertyPurchase.downPayment > input.propertyPurchase.price) issues.push({ field: "propertyPurchase.downPayment", message: "Property down payment must be between zero and the purchase price." });
    if (input.requestedAmount > input.propertyPurchase.price - input.propertyPurchase.downPayment) issues.push({ field: "propertyPurchase.finance", message: "Home finance cannot exceed price minus down payment." });
  }

  if (input.businessSplit) {
    const parts = [input.businessSplit.workingCapital, input.businessSplit.equipment, input.businessSplit.vehicle];
    if (parts.some((value) => !Number.isFinite(value) || value < 0)) issues.push({ field: "businessSplit", message: "Business components cannot be negative." });
    const total = parts.reduce((sum, value) => sum + value, 0);
    if (Math.abs(total - input.requestedAmount) > 1) issues.push({ field: "businessSplit", message: `Business components must add up to the ₹${input.requestedAmount.toLocaleString("en-IN")} request.` });
  }

  if (input.activeDebts?.some((debt) => debt.balance < 0 || debt.emi < 0 || (debt.annualRate ?? 0) < 0 || (debt.monthsLeft ?? 1) < 1)) {
    issues.push({ field: "activeDebts", message: "Debt balances, EMIs, rates, and remaining months cannot be negative or invalid." });
  }
  const declaredCardDebt = input.activeDebts?.some((debt) => debt.type === "credit-card" || debt.type === "bnpl");
  if (input.hasCreditCardOrBnpl === false && (declaredCardDebt || input.cardUtilisationPercent !== undefined || input.cardPaidInFull !== undefined)) {
    issues.push({ field: "cardBehaviour", message: "The card/BNPL answer conflicts with the debt details; reconcile them before continuing." });
  }

  return issues;
}

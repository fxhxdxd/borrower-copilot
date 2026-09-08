import { describe, expect, it } from "vitest";
import { WALKTHROUGH_INPUTS } from "./presets";
import { validateAssessment } from "./validation";

describe("assessment validation", () => {
  it.each(Object.entries(WALKTHROUGH_INPUTS))("accepts the complete %s walkthrough", (_name, input) => {
    expect(validateAssessment(input)).toEqual([]);
  });

  it("rejects impossible core values together", () => {
    const issues = validateAssessment({
      ...WALKTHROUGH_INPUTS.priya,
      purpose: "",
      purposeUses: [],
      requestedAmount: -1,
      age: 17,
      monthlyIncome: { min: 0, max: -1 },
      currentDebtPayments: -1,
      essentialExpenses: 0,
      creditStatus: { kind: "exact", score: 901 },
    });
    expect(issues.map((issue) => issue.field)).toEqual(expect.arrayContaining([
      "purpose",
      "purposeUses",
      "requestedAmount",
      "age",
      "monthlyIncome.min",
      "monthlyIncome.max",
      "currentDebtPayments",
      "essentialExpenses",
      "creditStatus",
    ]));
  });

  it("requires explicit confirmation when declared repayments are zero", () => {
    const issues = validateAssessment({ ...WALKTHROUGH_INPUTS.ravi, debtZeroConfirmed: false });
    expect(issues).toContainEqual(expect.objectContaining({ field: "debtZeroConfirmed" }));
  });

  it("rejects a business split that does not equal the request", () => {
    const issues = validateAssessment({
      ...WALKTHROUGH_INPUTS.ravi,
      businessSplit: { workingCapital: 900_000, equipment: 0, vehicle: 500_000 },
    });
    expect(issues).toContainEqual(expect.objectContaining({ field: "businessSplit" }));
  });

  it("rejects negative business components", () => {
    const issues = validateAssessment({
      ...WALKTHROUGH_INPUTS.ravi,
      businessSplit: { workingCapital: 1_100_000, equipment: -100_000, vehicle: 500_000 },
    });
    expect(issues).toContainEqual(expect.objectContaining({ field: "businessSplit", message: expect.stringContaining("negative") }));
  });

  it("rejects vehicle finance above invoice less contribution", () => {
    const issues = validateAssessment({
      ...WALKTHROUGH_INPUTS.anita,
      requestedAmount: 160_000,
    });
    expect(issues).toContainEqual(expect.objectContaining({ field: "vehicle.finance" }));
  });

  it("rejects a vehicle down payment above its invoice price", () => {
    const issues = validateAssessment({
      ...WALKTHROUGH_INPUTS.anita,
      vehicle: { ...WALKTHROUGH_INPUTS.anita.vehicle!, downPayment: 200_000 },
    });
    expect(issues).toContainEqual(expect.objectContaining({ field: "vehicle.downPayment" }));
  });

  it("rejects invalid home contribution and requested finance", () => {
    const issues = validateAssessment({
      ...WALKTHROUGH_INPUTS.priya,
      purpose: "Home purchase",
      consideredProduct: "home",
      requestedAmount: 4_500_000,
      propertyPurchase: { price: 5_000_000, downPayment: 1_000_000 },
    });
    expect(issues).toContainEqual(expect.objectContaining({ field: "propertyPurchase.finance" }));
  });

  it("rejects invalid debt schedules and due dates", () => {
    const issues = validateAssessment({
      ...WALKTHROUGH_INPUTS.priya,
      upcomingExpense: { amount: 10_000, monthsUntilDue: 0 },
      activeDebts: [{ label: "Impossible", balance: -1, emi: 1_000, monthsLeft: 0 }],
    });
    expect(issues.map((issue) => issue.field)).toEqual(expect.arrayContaining(["upcomingExpense.monthsUntilDue", "activeDebts"]));
  });

  it("rejects stale card details after the borrower confirms no card or BNPL", () => {
    const issues = validateAssessment({
      ...WALKTHROUGH_INPUTS.priya,
      hasCreditCardOrBnpl: false,
      cardUtilisationPercent: 80,
      cardPaidInFull: false,
    });
    expect(issues).toContainEqual(expect.objectContaining({ field: "cardBehaviour" }));
  });

  it("rejects a no-card answer that contradicts the debt schedule", () => {
    const issues = validateAssessment({
      ...WALKTHROUGH_INPUTS.ravi,
      currentDebtPayments: 2_000,
      debtZeroConfirmed: false,
      hasCreditCardOrBnpl: false,
      activeDebts: [{ label: "Card balance", type: "credit-card", balance: 20_000, emi: 2_000 }],
    });
    expect(issues).toContainEqual(expect.objectContaining({ field: "cardBehaviour" }));
  });
});

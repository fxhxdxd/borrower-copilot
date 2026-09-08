import { describe, expect, it } from "vitest";
import { assessBorrower, availableTenureMonths, rateBandFor, recognizeIncome } from "./engine";
import { formatCompactRupees, formatRupees } from "./format";
import { annualPercentageRate, aprForLoan, emiForPrincipal, principalForEmi, roundTo } from "./math";
import { WALKTHROUGH_INPUTS } from "./presets";
import type { AssessmentInput } from "./types";

const priya = WALKTHROUGH_INPUTS.priya;
const ravi = WALKTHROUGH_INPUTS.ravi;
const anita = WALKTHROUGH_INPUTS.anita;

describe("tricky finance math", () => {
  it("increases EMI as rate rises and decreases it as tenure grows", () => {
    expect(emiForPrincipal(500_000, 18, 36)).toBeGreaterThan(emiForPrincipal(500_000, 12, 36));
    expect(emiForPrincipal(500_000, 12, 36)).toBeGreaterThan(emiForPrincipal(500_000, 12, 60));
  });

  it("increases principal capacity with EMI or tenure and reduces it with rate", () => {
    expect(principalForEmi(20_000, 12, 60)).toBeGreaterThan(principalForEmi(10_000, 12, 60));
    expect(principalForEmi(10_000, 12, 60)).toBeGreaterThan(principalForEmi(10_000, 12, 36));
    expect(principalForEmi(10_000, 12, 60)).toBeGreaterThan(principalForEmi(10_000, 20, 60));
  });

  it("makes APR monotonic with mandatory upfront and recurring charges", () => {
    const noFee = aprForLoan(300_000, 12, 36, 0);
    const smallFee = aprForLoan(300_000, 12, 36, 1);
    const largeFee = aprForLoan(300_000, 12, 36, 2, 2_000, 100);
    expect(noFee).toBeLessThan(smallFee);
    expect(smallFee).toBeLessThan(largeFee);
  });

  it("returns zero APR for incomplete or invalid cash-flow series", () => {
    expect(annualPercentageRate([])).toBe(0);
    expect(annualPercentageRate([-10_000, 1_000])).toBe(0);
  });

  it("rounds monetary values without creating negatives", () => {
    expect(roundTo(10_449, 1_000)).toBe(10_000);
    expect(roundTo(-100, 1_000)).toBe(0);
  });

  it("keeps negative stressed cash visible in formatting", () => {
    expect(formatRupees(-12_924)).toContain("12,924");
    expect(formatRupees(-12_924)).toContain("-");
    expect(formatCompactRupees(-150_000)).toBe("−₹1.5L");
  });

  it("stays finite across the product rate and tenure range", () => {
    for (const principal of [10_000, 150_000, 800_000, 5_000_000]) {
      for (const rate of [0, 7.25, 12.5, 22.99, 25]) {
        for (const months of [6, 12, 36, 60, 240]) {
          const emi = emiForPrincipal(principal, rate, months);
          expect(Number.isFinite(emi)).toBe(true);
          expect(emi).toBeGreaterThan(0);
          expect(principalForEmi(emi, rate, months)).toBeCloseTo(principal, 2);
        }
      }
    }
  });
});

describe("age and tenure boundaries", () => {
  it("shortens unsecured tenure close to the modeled end age", () => {
    expect(availableTenureMonths("personal", { ...priya, age: 59 }, "max")).toBe(12);
    expect(assessBorrower({ ...priya, age: 59 }).lenderAmount.max).toBeLessThan(assessBorrower(priya).lenderAmount.max);
  });

  it("allows longer secured-property tenure than unsecured tenure at the same age", () => {
    const older = { ...priya, age: 62 };
    expect(availableTenureMonths("lap", older, "max")).toBeGreaterThan(availableTenureMonths("personal", older, "max"));
  });

  it("stops a product when no modeled repayment tenure remains", () => {
    const result = assessBorrower({ ...priya, age: 65 });
    expect(result.verdict).toBe("DONT_BORROW");
    expect(result.lenderAmount).toEqual({ min: 0, max: 0 });
    expect(result.bindingConstraint).toBe("age and available product tenure");
  });
});

describe("debt and delinquency edge cases", () => {
  it("uses the larger of declared repayments and itemized EMIs", () => {
    const declaredHigh = assessBorrower({ ...priya, currentDebtPayments: 20_000, activeDebts: [{ label: "Car", balance: 300_000, emi: 14_000 }] });
    const itemizedHigh = assessBorrower({ ...priya, currentDebtPayments: 5_000, activeDebts: [{ label: "Car", balance: 300_000, emi: 20_000 }] });
    expect(itemizedHigh.safeNewEmi).toEqual(declaredHigh.safeNewEmi);
  });

  it("does not let a smaller itemized schedule erase declared debt", () => {
    const declared = assessBorrower({ ...priya, currentDebtPayments: 20_000, activeDebts: undefined });
    const reconciled = assessBorrower({ ...priya, currentDebtPayments: 20_000, activeDebts: [{ label: "Known part", balance: 1_000, emi: 1_000 }] });
    expect(reconciled.safeAmount).toEqual(declared.safeAmount);
  });

  it("does not hard-stop one high-cost debt by itself when cash flow is safe", () => {
    const input = comfortableDistressCase();
    expect(assessBorrower(input).verdict).not.toBe("DONT_BORROW");
  });

  it("hard-stops two active high-cost debts with a recent unresolved payment", () => {
    const input = comfortableDistressCase();
    const result = assessBorrower({
      ...input,
      activeDebts: [
        ...input.activeDebts!,
        { label: "Second", balance: 8_000, emi: 1_000, annualRate: 30 },
      ],
    });
    expect(result.verdict).toBe("DONT_BORROW");
  });

  it("does not apply the distress hard stop after the payment is resolved", () => {
    const input = comfortableDistressCase();
    const result = assessBorrower({
      ...input,
      activeDebts: [
        ...input.activeDebts!,
        { label: "Second", balance: 8_000, emi: 1_000, annualRate: 30 },
      ],
      delinquency: { monthsAgo: 1, unresolvedAmount: 0, resolved: true },
    });
    expect(result.verdict).not.toBe("DONT_BORROW");
  });

  it("does not count a repaid zero-balance high-cost account as active", () => {
    const input = comfortableDistressCase();
    const result = assessBorrower({
      ...input,
      activeDebts: [
        ...input.activeDebts!,
        { label: "Closed", balance: 0, emi: 0, annualRate: 40 },
      ],
    });
    expect(result.verdict).not.toBe("DONT_BORROW");
  });
});

describe("recognition and unknown-data boundaries", () => {
  it("never treats turnover as take-home income", () => {
    const normal = recognizeIncome(ravi);
    const hugeTurnover = recognizeIncome({ ...ravi, monthlyTurnover: { min: 10_000_000, max: 20_000_000 } });
    expect(hugeTurnover).toEqual(normal);
  });

  it("adds only willing and documented co-applicant net income", () => {
    const base = recognizeIncome(ravi);
    const unwilling = recognizeIncome({ ...ravi, coApplicant: { monthlyIncome: 50_000, monthlyObligations: 0, willing: false, documented: true } });
    const undocumented = recognizeIncome({ ...ravi, coApplicant: { monthlyIncome: 50_000, monthlyObligations: 0, willing: true, documented: false } });
    const netNegative = recognizeIncome({ ...ravi, coApplicant: { monthlyIncome: 20_000, monthlyObligations: 30_000, willing: true, documented: true } });
    const eligible = recognizeIncome({ ...ravi, coApplicant: { monthlyIncome: 50_000, monthlyObligations: 10_000, willing: true, documented: true } });
    expect(unwilling).toEqual(base);
    expect(undocumented).toEqual(base);
    expect(netNegative).toEqual(base);
    expect(eligible.min).toBe(base.min + 40_000);
  });

  it("treats no credit history like unknown evidence, not a penalty", () => {
    const noHistory = rateBandFor("personal", { ...priya, creditStatus: { kind: "no-history" } });
    const unknown = rateBandFor("personal", { ...priya, creditStatus: { kind: "unknown" } });
    expect(noHistory).toEqual(unknown);
    expect(noHistory).toEqual({ min: 10, max: 22 });
  });

  it("honors exact credit-tier boundaries", () => {
    expect(rateBandFor("personal", { ...priya, creditStatus: { kind: "exact", score: 750 } })).toEqual({ min: 10, max: 12.5 });
    expect(rateBandFor("personal", { ...priya, creditStatus: { kind: "exact", score: 749 } })).toEqual({ min: 11.5, max: 16.5 });
    expect(rateBandFor("personal", { ...priya, creditStatus: { kind: "exact", score: 649 } })).toEqual({ min: 15, max: 22 });
  });

  it("makes missing savings widen the range and lower confidence", () => {
    const known = assessBorrower(priya);
    const unknown = assessBorrower({ ...priya, emergencySavingsMonths: undefined });
    expect(unknown.safeAmount.min).toBeLessThan(known.safeAmount.min);
    expect(unknown.safeAmount.max).toBe(known.safeAmount.max);
    expect(unknown.confidence).toBe("medium");
  });
});

describe("routing, caps, verdicts, and stress", () => {
  it("keeps vehicle price and contribution outside borrower affordability", () => {
    const highIncome = { ...anita, monthlyIncome: { min: 300_000, max: 300_000 }, essentialExpenses: 20_000, currentDebtPayments: 0, activeDebts: [], recentPaymentIssue: false, delinquency: undefined, emergencySavingsMonths: 6 };
    const withoutFundingDetails = assessBorrower(highIncome);
    const priceOnly = assessBorrower({
      ...highIncome,
      vehicle: { ...highIncome.vehicle!, price: 100_000 },
    });
    const contribution = assessBorrower({
      ...highIncome,
      vehicle: { ...highIncome.vehicle!, price: 200_000, downPayment: 100_000 },
    });
    for (const variant of [priceOnly, contribution]) {
      expect(variant.lenderAmount).toEqual(withoutFundingDetails.lenderAmount);
      expect(variant.safeAmount).toEqual(withoutFundingDetails.safeAmount);
      expect(variant.requestedEmi).toEqual(withoutFundingDetails.requestedEmi);
      expect(variant.verdict).toEqual(withoutFundingDetails.verdict);
      expect(variant.productFeasibilityWarning).toContain("does not change borrower-safe capacity");
    }
    expect(withoutFundingDetails.productFeasibilityWarning).toBeUndefined();
  });

  it("uses different new and used commercial-vehicle envelopes", () => {
    const fresh = rateBandFor("commercial-vehicle", ravi);
    const used = rateBandFor("commercial-vehicle", { ...ravi, vehicle: { ...ravi.vehicle!, condition: "used" } });
    expect(used.min).toBeGreaterThan(fresh.min);
    expect(used.max).toBeGreaterThan(fresh.max);
  });

  it("reports a considered-product mismatch separately", () => {
    const result = assessBorrower({ ...anita, consideredProduct: "personal" });
    expect(result.routes[0].product).toBe("two-wheeler");
    expect(result.productMismatch).toContain("Personal loan");
    expect(result.verdict).toBe("DONT_BORROW");
  });

  it("selects an income shock for fixed-rate salary, low-month shock for gig, and rate shock for LAP", () => {
    expect(assessBorrower(priya).stress.kind).toBe("income-drop");
    expect(assessBorrower(anita).stress.kind).toBe("low-month-drop");
    expect(assessBorrower(ravi).stress.kind).toBe("rate-rise");
  });

  it("raises only the floating component in Ravi's mixed-product stress", () => {
    const result = assessBorrower(ravi);
    const vehicle = ravi.businessSplit!.vehicle;
    const stock = ravi.businessSplit!.workingCapital;
    const expectedStressedDebt =
      emiForPrincipal(vehicle, rateBandFor("commercial-vehicle", ravi).max, availableTenureMonths("commercial-vehicle", ravi)) +
      emiForPrincipal(stock, rateBandFor("lap", ravi).max + 2, availableTenureMonths("lap", ravi));
    const expectedResidual = ravi.monthlyIncome.min - ravi.essentialExpenses - expectedStressedDebt;
    expect(result.stress.stressedResidual).toBeCloseTo(expectedResidual, 6);
  });

  it("keeps future income uplift outside both base capacity views", () => {
    const withUplift = assessBorrower({ ...anita, expectedNetIncomeUplift: 100_000, upliftEvidence: "strong" });
    const without = assessBorrower({ ...anita, expectedNetIncomeUplift: undefined });
    expect(withUplift.lenderAmount).toEqual(without.lenderAmount);
    expect(withUplift.safeAmount).toEqual(without.safeAmount);
  });

  it("borrows at the conservative boundary and borrows less one rupee above it", () => {
    const capacity = assessBorrower(priya).safeAmount.min;
    expect(assessBorrower({ ...priya, requestedAmount: capacity }).verdict).toBe("BORROW");
    expect(assessBorrower({ ...priya, requestedAmount: capacity + 1 }).verdict).toBe("BORROW_LESS");
  });

  it("does not add capacities for Ravi's two facilities", () => {
    const result = assessBorrower(ravi);
    const sharedCapacity = result.safeNewEmi.min / (result.requestedEmi / ravi.requestedAmount);
    expect(result.safeAmount.min).toBeCloseTo(roundTo(sharedCapacity, 1_000), -4);
    expect(result.safeAmount.min).toBeLessThan(result.routes.reduce((sum, route) => sum + (route.amount ?? 0), 0));
  });

  it("preserves monotonicity across a grid of debt and expense increases", () => {
    for (const debt of [0, 5_000, 10_000, 20_000, 30_000]) {
      for (const expenses of [20_000, 35_000, 50_000, 70_000]) {
        const base = assessBorrower({ ...priya, currentDebtPayments: debt, activeDebts: undefined, essentialExpenses: expenses });
        const moreDebt = assessBorrower({ ...priya, currentDebtPayments: debt + 1_000, activeDebts: undefined, essentialExpenses: expenses });
        const moreExpense = assessBorrower({ ...priya, currentDebtPayments: debt, activeDebts: undefined, essentialExpenses: expenses + 1_000 });
        expect(moreDebt.safeAmount.max).toBeLessThanOrEqual(base.safeAmount.max);
        expect(moreExpense.safeAmount.max).toBeLessThanOrEqual(base.safeAmount.max);
      }
    }
  });

  it("keeps ordinary scenario outputs finite and ordered", () => {
    for (const input of [priya, ravi, anita]) {
      const result = assessBorrower(input);
      for (const range of [result.lenderAmount, result.safeAmount, result.lenderNewEmi, result.safeNewEmi, result.rateBand, result.aprBand]) {
        expect(Number.isFinite(range.min)).toBe(true);
        expect(Number.isFinite(range.max)).toBe(true);
        expect(range.min).toBeLessThanOrEqual(range.max);
      }
    }
  });
});

function comfortableDistressCase(): AssessmentInput {
  return {
    ...priya,
    requestedAmount: 100_000,
    monthlyIncome: { min: 150_000, max: 150_000 },
    essentialExpenses: 30_000,
    currentDebtPayments: 1_000,
    activeDebts: [{ label: "First", balance: 10_000, emi: 1_000, annualRate: 30 }],
    recentPaymentIssue: true,
    delinquency: { monthsAgo: 1, unresolvedAmount: 5_000, resolved: false },
  };
}

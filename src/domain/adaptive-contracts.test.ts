import { describe, expect, it } from "vitest";
import { assessBorrower, recognizeIncome, routeProducts } from "./engine";
import { WALKTHROUGH_INPUTS } from "./presets";
import type { AssessmentInput } from "./types";

const priya = WALKTHROUGH_INPUTS.priya;
const ravi = WALKTHROUGH_INPUTS.ravi;
const anita = WALKTHROUGH_INPUTS.anita;

describe("adaptive module counterfactual contracts", () => {
  it("employment continuity moves recognized income", () => {
    expect(recognizeIncome({ ...priya, employmentStatus: "probation", variableIncomeShare: 0.2 }).min)
      .toBeLessThan(recognizeIncome({ ...priya, employmentStatus: "permanent", variableIncomeShare: 0.2 }).min);
  });

  it("business vintage moves the documented income edge", () => {
    expect(recognizeIncome({ ...ravi, businessVintageMonths: 12 }).min)
      .toBeLessThan(recognizeIncome({ ...ravi, businessVintageMonths: 168 }).min);
  });

  it("net profit—not turnover—moves lender capacity", () => {
    const lowProfit = assessBorrower({ ...ravi, monthlyNetProfit: { min: 25_000, max: 35_000 } }).lenderAmount.max;
    const highProfit = assessBorrower({ ...ravi, monthlyNetProfit: { min: 50_000, max: 70_000 } }).lenderAmount.max;
    expect(highProfit).toBeGreaterThan(lowProfit);
  });

  it("the lowest variable-income month moves safe capacity", () => {
    expect(assessBorrower({ ...priya, lowestRecentIncome: 70_000 }).safeAmount.min)
      .toBeLessThan(assessBorrower(priya).safeAmount.min);
  });

  it("ITR and bank-visible income tighten lender recognition", () => {
    const sparse = recognizeIncome({ ...ravi, itrAnnualIncome: undefined, monthlyNetProfit: undefined, bankVisibleMonthlyIncome: undefined });
    const evidenced = recognizeIncome({ ...ravi, bankVisibleMonthlyIncome: { min: 45_000, max: 55_000 } });
    expect(evidenced.max - evidenced.min).toBeLessThan(sparse.max - sparse.min);
  });

  it("informal active months and paid-day frequency move safe capacity", () => {
    const continuous = assessBorrower({ ...anita, recentPaymentIssue: false, delinquency: undefined, activeDebts: [], currentDebtPayments: 0, essentialExpenses: 10_000 });
    const seasonal = assessBorrower({ ...continuousInput(anita), informalActiveMonths: 6, informalPaidDaysPerMonth: 13 });
    expect(seasonal.safeNewEmi.min).toBeLessThan(continuous.safeNewEmi.min);
  });

  it("household income is context, never silently co-applicant capacity", () => {
    const without = assessBorrower({ ...ravi, otherHouseholdIncome: 0 }).safeAmount;
    const withIncome = assessBorrower({ ...ravi, otherHouseholdIncome: 100_000 }).safeAmount;
    expect(withIncome).toEqual(without);
  });

  it("a willing documented co-applicant moves both capacities", () => {
    const without = assessBorrower(ravi);
    const withApplicant = assessBorrower({ ...ravi, coApplicant: { monthlyIncome: 30_000, documented: true, monthlyObligations: 5_000, willing: true } });
    expect(withApplicant.safeAmount.max).toBeGreaterThan(without.safeAmount.max);
    expect(withApplicant.lenderAmount.max).toBeGreaterThan(without.lenderAmount.max);
  });

  it("emergency savings moves the safe ratio", () => {
    const none = assessBorrower({ ...priya, emergencySavingsMonths: 0 });
    const funded = assessBorrower({ ...priya, emergencySavingsMonths: 3 });
    expect(funded.safeRatio.min).toBeGreaterThan(none.safeRatio.min);
  });

  it("an upcoming committed expense can change the verdict", () => {
    const base = assessBorrower(priya);
    const upcoming = assessBorrower({ ...priya, upcomingExpense: { amount: 600_000, monthsUntilDue: 6 } });
    expect(base.verdict).toBe("BORROW");
    expect(upcoming.verdict).toBe("DONT_BORROW");
  });

  it("the debt schedule reconciles an understated core EMI", () => {
    const understated = { ...priya, currentDebtPayments: 1_000 };
    expect(assessBorrower({ ...understated, activeDebts: [{ label: "Car", balance: 300_000, emi: 14_000 }] }).safeAmount.max)
      .toBeLessThan(assessBorrower({ ...understated, activeDebts: undefined }).safeAmount.max);
  });

  it("revolving high-utilisation card debt can activate a hard stop", () => {
    const base = delinquencyTestInput();
    expect(assessBorrower(base).verdict).not.toBe("DONT_BORROW");
    expect(assessBorrower({ ...base, cardUtilisationPercent: 90, cardPaidInFull: false }).verdict).toBe("DONT_BORROW");
  });

  it("delinquency recency and resolution change the hard-stop decision", () => {
    const base = delinquencyTestInput();
    expect(assessBorrower({ ...base, delinquency: { monthsAgo: 1, unresolvedAmount: 5_000, resolved: false }, activeDebts: [
      { label: "One", balance: 10_000, emi: 1_000, annualRate: 30 },
      { label: "Two", balance: 10_000, emi: 1_000, annualRate: 30 },
    ] }).verdict).toBe("DONT_BORROW");
    expect(assessBorrower({ ...base, delinquency: { monthsAgo: 1, unresolvedAmount: 0, resolved: true } }).verdict).not.toBe("DONT_BORROW");
  });

  it("collateral type, ownership, encumbrance and willingness change routing", () => {
    const base = { ...ravi, businessSplit: undefined, vehicle: undefined, consideredProduct: "not-sure" as const };
    expect(routeProducts({ ...base, collateral: { ...ravi.collateral!, type: "property" } })[0].product).toBe("lap");
    expect(routeProducts({ ...base, collateral: { ...ravi.collateral!, type: "gold" } })[0].product).toBe("gold");
    expect(routeProducts({ ...base, collateral: { ...ravi.collateral!, encumbered: true } })[0].product).toBe("business");
  });

  it("vehicle class and use change the product route", () => {
    expect(routeProducts(anita)[0].product).toBe("two-wheeler");
    expect(routeProducts({ ...anita, vehicle: { ...anita.vehicle!, class: "three-wheeler-lcv", use: "business" } })[0].product).toBe("commercial-vehicle");
  });

  it("property price and down payment cap home-loan capacity", () => {
    const home: AssessmentInput = { ...priya, purpose: "Buy a home", consideredProduct: "home", requestedAmount: 5_000_000, propertyPurchase: { price: 5_500_000, downPayment: 500_000 } };
    const largerDownPayment = assessBorrower({ ...home, propertyPurchase: { price: 5_500_000, downPayment: 2_500_000 } });
    expect(largerDownPayment.lenderAmount.max).toBeLessThanOrEqual(3_000_000);
  });

  it("business split produces component routes without adding EMI capacities", () => {
    const result = assessBorrower(ravi);
    expect(result.routes).toHaveLength(2);
    expect(result.safeNewEmi.min).toBeLessThan(result.requestedEmi);
  });

  it("uplift evidence changes only the upside range, never base capacity", () => {
    const weak = assessBorrower({ ...anita, upliftEvidence: "weak" });
    const strong = assessBorrower({ ...anita, upliftEvidence: "strong" });
    expect(strong.upsideScenario!.plausibleRange.min).toBeGreaterThan(weak.upsideScenario!.plausibleRange.min);
    expect(strong.safeAmount).toEqual(weak.safeAmount);
  });
});

function continuousInput(input: AssessmentInput): AssessmentInput {
  return { ...input, recentPaymentIssue: false, delinquency: undefined, activeDebts: [], currentDebtPayments: 0, essentialExpenses: 10_000 };
}

function delinquencyTestInput(): AssessmentInput {
  return {
    ...priya,
    monthlyIncome: { min: 150_000, max: 150_000 },
    essentialExpenses: 30_000,
    requestedAmount: 100_000,
    currentDebtPayments: 2_000,
    activeDebts: [{ label: "One", balance: 10_000, emi: 2_000, annualRate: 30 }],
    recentPaymentIssue: true,
    delinquency: { monthsAgo: 1, unresolvedAmount: 5_000, resolved: false },
  };
}

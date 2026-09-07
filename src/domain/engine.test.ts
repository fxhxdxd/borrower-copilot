import { describe, expect, it } from "vitest";
import { assessBorrower, rateBandFor, recognizeIncome, routeProducts } from "./engine";
import { WALKTHROUGH_INPUTS } from "./presets";

describe("golden borrower decisions", () => {
  it("lets Priya borrow the requested amount without anchoring to lender maximum", () => {
    const result = assessBorrower(WALKTHROUGH_INPUTS.priya);
    expect(result.verdict).toBe("BORROW");
    expect(result.useAmount).toBe(800_000);
    expect(result.lenderAmount.max).toBeGreaterThan(result.useAmount);
    expect(result.safeNewEmi.min).toBeCloseTo(24_500, -1);
  });

  it("routes Ravi's components but applies one shared safe ceiling", () => {
    const result = assessBorrower(WALKTHROUGH_INPUTS.ravi);
    expect(result.verdict).toBe("BORROW_LESS");
    expect(result.routes.map((route) => route.product)).toEqual(["commercial-vehicle", "lap"]);
    expect(result.safeAmount.max).toBeLessThan(1_500_000);
    expect(result.routes[0].rationale).toContain("shop");
  });

  it("stops Anita from stacking another EMI", () => {
    const result = assessBorrower(WALKTHROUGH_INPUTS.anita);
    expect(result.verdict).toBe("DONT_BORROW");
    expect(result.useAmount).toBe(0);
    expect(result.bindingConstraint).toContain("payment issue");
    expect(result.upsideScenario?.note).toContain("excluded");
  });
});

describe("monotonicity and unknown handling", () => {
  it("never increases capacity when expenses rise", () => {
    const base = WALKTHROUGH_INPUTS.priya;
    const lower = assessBorrower(base).safeAmount.max;
    const higherExpenses = assessBorrower({ ...base, essentialExpenses: base.essentialExpenses + 20_000 }).safeAmount.max;
    expect(higherExpenses).toBeLessThanOrEqual(lower);
  });

  it("never increases capacity when existing debt rises", () => {
    const base = WALKTHROUGH_INPUTS.priya;
    const lower = assessBorrower(base).safeAmount.max;
    const moreDebt = assessBorrower({ ...base, currentDebtPayments: base.currentDebtPayments + 10_000 }).safeAmount.max;
    expect(moreDebt).toBeLessThanOrEqual(lower);
  });

  it("unknown savings widen rather than narrow the safe interval", () => {
    const known = assessBorrower(WALKTHROUGH_INPUTS.priya).safeAmount;
    const unknown = assessBorrower({ ...WALKTHROUGH_INPUTS.priya, emergencySavingsMonths: undefined }).safeAmount;
    expect(unknown.min).toBeLessThanOrEqual(known.min);
    expect(unknown.max).toBeGreaterThanOrEqual(known.max);
  });

  it("unknown credit uses the full product envelope without adding a risk penalty", () => {
    const known = rateBandFor("personal", WALKTHROUGH_INPUTS.priya);
    const unknownInput = { ...WALKTHROUGH_INPUTS.priya, creditStatus: { kind: "unknown" } as const };
    const unknown = rateBandFor("personal", unknownInput);
    expect(unknown.min).toBeLessThanOrEqual(known.min);
    expect(unknown.max).toBeGreaterThanOrEqual(known.max);
  });
});

describe("routing and income recognition", () => {
  it("keeps future asset income outside base recognition", () => {
    const base = WALKTHROUGH_INPUTS.anita;
    const withoutUplift = recognizeIncome({ ...base, expectedNetIncomeUplift: undefined });
    const withUplift = recognizeIncome(base);
    expect(withUplift).toEqual(withoutUplift);
  });

  it("routes a personal income-generating scooter to two-wheeler finance", () => {
    expect(routeProducts(WALKTHROUGH_INPUTS.anita)[0].product).toBe("two-wheeler");
  });

  it("changes commercial vehicle rates for new and used assets", () => {
    const fresh = rateBandFor("commercial-vehicle", WALKTHROUGH_INPUTS.ravi);
    const used = rateBandFor("commercial-vehicle", {
      ...WALKTHROUGH_INPUTS.ravi,
      vehicle: { ...WALKTHROUGH_INPUTS.ravi.vehicle!, condition: "used" },
    });
    expect(used.max).toBeGreaterThan(fresh.max);
  });
});


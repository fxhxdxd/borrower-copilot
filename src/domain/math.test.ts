import { describe, expect, it } from "vitest";
import { annualPercentageRate, aprForLoan, emiForPrincipal, principalForEmi } from "./math";

describe("loan mathematics", () => {
  it("round-trips principal and EMI", () => {
    const emi = emiForPrincipal(800_000, 11.25, 48);
    expect(principalForEmi(emi, 11.25, 48)).toBeCloseTo(800_000, 2);
  });

  it("handles a zero-rate loan", () => {
    expect(emiForPrincipal(120_000, 0, 12)).toBe(10_000);
    expect(principalForEmi(10_000, 0, 12)).toBe(120_000);
  });

  it("reproduces the RBI KFS worked APR example", () => {
    const apr = annualPercentageRate([19_600, ...Array(24).fill(-970)]);
    expect(apr).toBeCloseTo(17.07, 1);
  });

  it("shows that mandatory upfront fees raise APR", () => {
    expect(aprForLoan(500_000, 12, 48, 2)).toBeGreaterThan(12);
  });
});


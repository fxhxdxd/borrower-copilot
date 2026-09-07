import type { Interval } from "./types";

export const interval = (min: number, max = min): Interval => ({
  min: Math.min(min, max),
  max: Math.max(min, max),
});

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function emiForPrincipal(
  principal: number,
  annualRatePercent: number,
  months: number,
) {
  if (principal <= 0 || months <= 0) return 0;
  const rate = annualRatePercent / 1200;
  if (rate === 0) return principal / months;
  return (principal * rate * (1 + rate) ** months) / ((1 + rate) ** months - 1);
}

export function principalForEmi(
  emi: number,
  annualRatePercent: number,
  months: number,
) {
  if (emi <= 0 || months <= 0) return 0;
  const rate = annualRatePercent / 1200;
  if (rate === 0) return emi * months;
  return (emi * ((1 + rate) ** months - 1)) / (rate * (1 + rate) ** months);
}

function npv(rate: number, cashflows: number[]) {
  return cashflows.reduce((sum, cashflow, index) => sum + cashflow / (1 + rate) ** index, 0);
}

export function annualPercentageRate(cashflows: number[]) {
  if (cashflows.length < 2 || cashflows[0] <= 0) return 0;
  let low = 0;
  let high = 1;
  for (let i = 0; i < 160; i += 1) {
    const midpoint = (low + high) / 2;
    if (npv(midpoint, cashflows) > 0) high = midpoint;
    else low = midpoint;
  }
  return ((low + high) / 2) * 12 * 100;
}

export function aprForLoan(
  principal: number,
  annualRatePercent: number,
  months: number,
  upfrontFeePercent: number,
  fixedUpfrontCharges = 0,
  recurringMonthlyCharge = 0,
) {
  if (principal <= 0) return 0;
  const netDisbursal = principal - principal * (upfrontFeePercent / 100) - fixedUpfrontCharges;
  const instalment = emiForPrincipal(principal, annualRatePercent, months) + recurringMonthlyCharge;
  return annualPercentageRate([netDisbursal, ...Array(months).fill(-instalment)]);
}

export const roundTo = (value: number, increment = 100) =>
  Math.max(0, Math.round(value / increment) * increment);

import type { Interval, ProductId } from "./types";

export type RateTier = "strong" | "standard" | "elevated" | "uncertain";

export type ProductConfig = {
  id: ProductId;
  label: string;
  rateBands: Partial<Record<RateTier, Interval>>;
  feePercent: Interval;
  tenureMonths: { prudent: number; max: number };
  maxLtv?: number;
  rateType: "fixed" | "floating";
  asOf: string;
  sources: { label: string; url: string }[];
};

const source = (label: string, url: string) => ({ label, url });

export const MARKET_AS_OF = "7 September 2026";

export const PRODUCT_CONFIG: Record<Exclude<ProductId, "not-sure">, ProductConfig> = {
  personal: {
    id: "personal",
    label: "Personal loan",
    rateBands: {
      strong: { min: 10, max: 12.5 },
      standard: { min: 11.5, max: 16.5 },
      elevated: { min: 15, max: 22 },
    },
    feePercent: { min: 0.5, max: 2 },
    tenureMonths: { prudent: 48, max: 60 },
    rateType: "fixed",
    asOf: MARKET_AS_OF,
    sources: [
      source("ICICI personal-loan rates", "https://www.icici.bank.in/personal-banking/loans/personal-loan/personal-loan-interest-rates"),
      source("Axis personal-loan rates", "https://www.axis.bank.in/loans/personal-loan/interest-rates-charges"),
    ],
  },
  lap: {
    id: "lap",
    label: "Loan against property",
    rateBands: {
      strong: { min: 9.15, max: 10.5 },
      standard: { min: 10, max: 12.25 },
      uncertain: { min: 11, max: 13.5 },
    },
    feePercent: { min: 0.5, max: 2 },
    tenureMonths: { prudent: 120, max: 180 },
    maxLtv: 0.6,
    rateType: "floating",
    asOf: MARKET_AS_OF,
    sources: [
      source("Axis LAP rates", "https://www.axis.bank.in/loans/loan-against-property/interest-rate-on-loans"),
      source("ICICI LAP rates", "https://www.icici.bank.in/personal-banking/loans/home-loan/loan-against-property/interest-rates"),
    ],
  },
  "two-wheeler": {
    id: "two-wheeler",
    label: "Two-wheeler finance",
    rateBands: {
      strong: { min: 10.5, max: 16 },
      standard: { min: 15, max: 21 },
      elevated: { min: 20, max: 25 },
    },
    feePercent: { min: 1, max: 2.5 },
    tenureMonths: { prudent: 36, max: 48 },
    rateType: "fixed",
    asOf: MARKET_AS_OF,
    sources: [source("Axis two-wheeler rates", "https://www.axis.bank.in/loans/two-wheeler-loans/interest-rates")],
  },
  business: {
    id: "business",
    label: "Unsecured business loan",
    rateBands: {
      strong: { min: 13, max: 16 },
      standard: { min: 15, max: 19.25 },
      elevated: { min: 18, max: 22.99 },
    },
    feePercent: { min: 1, max: 3 },
    tenureMonths: { prudent: 48, max: 60 },
    rateType: "fixed",
    asOf: MARKET_AS_OF,
    sources: [
      source("ICICI business-loan rates", "https://www.icici.bank.in/personal-banking/loans/personal-loan/business-instalment-loan/interest-rate"),
      source("IndusInd business-loan rates", "https://www.indusind.com/in/en/business/loans/unsecured-business-loans.html"),
    ],
  },
  "commercial-vehicle": {
    id: "commercial-vehicle",
    label: "Commercial-vehicle finance",
    rateBands: {
      strong: { min: 7.25, max: 10 },
      standard: { min: 9, max: 12.6 },
      uncertain: { min: 11, max: 18 },
    },
    feePercent: { min: 1, max: 2 },
    tenureMonths: { prudent: 60, max: 60 },
    rateType: "fixed",
    asOf: MARKET_AS_OF,
    sources: [
      source("Axis commercial-vehicle disclosure", "https://www.axis.bank.in/docs/default-source/default-document-library/commercial_vehicle_construction_equipment_new.pdf?sfvrsn=5d1c920c_5"),
      source("IIFL market overview", "https://www.iifl.com/blogs/other/commercial-vehicle-loan-india"),
    ],
  },
  home: {
    id: "home",
    label: "Home loan",
    rateBands: { uncertain: { min: 7.25, max: 11.9 } },
    feePercent: { min: 0.25, max: 1 },
    tenureMonths: { prudent: 240, max: 360 },
    maxLtv: 0.8,
    rateType: "floating",
    asOf: MARKET_AS_OF,
    sources: [
      source("SBI home-loan rates", "https://sbi.bank.in/web/interest-rates/interest-rates/loan-schemes-interest-rates/home-loans-interest-rates-current"),
      source("Axis home-loan rates", "https://www.axis.bank.in/loans/home-loan/interest-rates-charges"),
    ],
  },
  gold: {
    id: "gold",
    label: "Gold loan",
    rateBands: { uncertain: { min: 9.15, max: 17 } },
    feePercent: { min: 0.25, max: 1 },
    tenureMonths: { prudent: 24, max: 36 },
    maxLtv: 0.75,
    rateType: "fixed",
    asOf: MARKET_AS_OF,
    sources: [source("SBI gold-loan rates", "https://sbi.bank.in/web/personal-banking/loans/gold-loan/personal-gold-loans")],
  },
  car: {
    id: "car",
    label: "Car finance",
    rateBands: {
      strong: { min: 8.7, max: 9.35 },
      standard: { min: 9.15, max: 11.7 },
      uncertain: { min: 8.7, max: 15.6 },
    },
    feePercent: { min: 0.5, max: 2 },
    tenureMonths: { prudent: 60, max: 84 },
    rateType: "fixed",
    asOf: MARKET_AS_OF,
    sources: [
      source("SBI auto-loan rates", "https://sbi.bank.in/web/interest-rates/interest-rates/loan-schemes-interest-rates/auto-loans"),
      source("Axis car-loan rates", "https://www.axis.bank.in/loans/car-loan/interest-rates-charges"),
    ],
  },
};

export function commercialVehicleConfig(condition: "new" | "used" | "unknown" = "unknown") {
  const base = PRODUCT_CONFIG["commercial-vehicle"];
  if (condition === "new") return base;
  if (condition === "used") return {
    ...base,
    rateBands: {
      strong: { min: 8.4, max: 11 },
      standard: { min: 10, max: 15 },
      uncertain: { min: 13, max: 22 },
    },
  } satisfies ProductConfig;
  return {
    ...base,
    rateBands: { uncertain: { min: 7.25, max: 22 } },
  } satisfies ProductConfig;
}

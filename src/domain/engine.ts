import {
  MARKET_AS_OF,
  PRODUCT_CONFIG,
  commercialVehicleConfig,
  type ProductConfig,
  type RateTier,
} from "./marketData";
import { annualPercentageRate, clamp, emiForPrincipal, roundDownTo, roundTo } from "./math";
import type {
  AssessmentInput,
  AssessmentResult,
  Interval,
  ProductId,
  ProductRoute,
  Reason,
  StressResult,
} from "./types";

const FOIR: Record<AssessmentInput["incomeType"], Interval> = {
  salaried: { min: 0.5, max: 0.55 },
  "self-employed": { min: 0.4, max: 0.5 },
  mixed: { min: 0.35, max: 0.45 },
  informal: { min: 0.3, max: 0.4 },
};

const SAFE_RATIO: Record<AssessmentInput["incomeType"], number> = {
  salaried: 0.35,
  "self-employed": 0.3,
  informal: 0.25,
  mixed: 0.27,
};

const productLabel = (product: ProductId) =>
  product === "not-sure" ? "Not sure" : PRODUCT_CONFIG[product].label;

function fullBand(config: ProductConfig): Interval {
  const bands = Object.values(config.rateBands).filter(Boolean) as Interval[];
  return {
    min: Math.min(...bands.map((band) => band.min)),
    max: Math.max(...bands.map((band) => band.max)),
  };
}

export function creditTier(input: AssessmentInput): RateTier | "unknown" {
  const credit = input.creditStatus;
  if (credit.kind === "unknown") return "unknown";
  if (credit.kind === "no-history") return "unknown";
  if (credit.kind === "band") {
    if (credit.band === "excellent" || credit.band === "good") return "strong";
    if (credit.band === "fair") return "standard";
    return "elevated";
  }
  if (credit.score >= 750) return "strong";
  if (credit.score >= 650) return "standard";
  return "elevated";
}

function configFor(product: ProductId, input: AssessmentInput): ProductConfig {
  if (product === "not-sure") return PRODUCT_CONFIG.personal;
  if (product === "commercial-vehicle") {
    return commercialVehicleConfig(input.vehicle?.condition ?? "unknown");
  }
  return PRODUCT_CONFIG[product];
}

function modeledEndAge(product: ProductId, input: AssessmentInput) {
  if (product === "home" || product === "lap") return 70;
  if (product === "gold") return 75;
  return input.incomeType === "salaried" ? 60 : 65;
}

export function availableTenureMonths(
  product: ProductId,
  input: AssessmentInput,
  kind: "prudent" | "max" = "prudent",
) {
  const config = configFor(product, input);
  const ageLimitedMonths = Math.floor((modeledEndAge(product, input) - input.age) * 12);
  if (ageLimitedMonths < 6) return 0;
  return Math.min(config.tenureMonths[kind], ageLimitedMonths);
}

export function rateBandFor(product: ProductId, input: AssessmentInput): Interval {
  const config = configFor(product, input);
  const tier = creditTier(input);
  if (tier === "unknown") return fullBand(config);
  const selected = config.rateBands[tier];
  if (selected) return selected;
  if (tier === "elevated") return config.rateBands.uncertain ?? fullBand(config);
  if (tier === "uncertain") return config.rateBands.standard ?? config.rateBands.uncertain ?? fullBand(config);
  return fullBand(config);
}

function isUsableCollateral(input: AssessmentInput) {
  const asset = input.collateral;
  return Boolean(
    asset &&
      asset.ownedByApplicant &&
      !asset.encumbered &&
      asset.willingToPledge,
  );
}

export function routeProducts(input: AssessmentInput): ProductRoute[] {
  const uses = new Set(input.purposeUses);
  const businessIntent = input.consideredProduct === "business" || uses.has("working-capital") || uses.has("equipment");
  const vehicleIntent = uses.has("vehicle") || ["two-wheeler", "car", "commercial-vehicle"].includes(input.consideredProduct) || (businessIntent && (input.businessSplit?.vehicle ?? 0) > 0);

  if (businessIntent && input.businessSplit && input.businessSplit.vehicle + input.businessSplit.workingCapital + input.businessSplit.equipment > 0) {
    const routes: ProductRoute[] = [];
    if (input.businessSplit.vehicle > 0) {
      routes.push({
        product: "commercial-vehicle",
        label: "Commercial-vehicle finance",
        amount: input.businessSplit.vehicle,
        rationale: "The delivery vehicle secures its own facility, so the shop need not secure this portion.",
      });
    }
    const stockAndEquipment = input.businessSplit.workingCapital + input.businessSplit.equipment;
    if (stockAndEquipment > 0) {
      const secured = isUsableCollateral(input);
      routes.push({
        product: secured ? "lap" : "business",
        label: secured ? "Secured stock finance / LAP" : "Business working-capital loan",
        amount: stockAndEquipment,
        rationale: secured
          ? "Use the property only for the stock and equipment portion that documented cash flow supports."
          : "No willing, unencumbered collateral is confirmed, so this remains an unsecured business route.",
      });
    }
    return routes;
  }

  if (vehicleIntent && input.vehicle) {
    if (input.vehicle.class === "two-wheeler") {
      return [{
        product: "two-wheeler",
        label: "Two-wheeler finance",
        amount: input.requestedAmount,
        rationale: input.vehicle.use === "income-generating"
          ? "The scooter is retail two-wheeler finance; expected gig income stays outside base affordability."
          : "The vehicle class determines the retail two-wheeler rate table.",
      }];
    }
    if (input.vehicle.class === "car" && input.vehicle.use === "personal") {
      return [{
        product: "car",
        label: "Car finance",
        amount: input.requestedAmount,
        rationale: "A personal-use car routes to retail car finance.",
      }];
    }
    return [{
      product: "commercial-vehicle",
      label: input.vehicle.condition === "used"
        ? "Used commercial-vehicle finance"
        : input.vehicle.condition === "new"
          ? "New commercial-vehicle finance"
          : "Commercial-vehicle finance",
      amount: input.requestedAmount,
      rationale: "A three-wheeler or LCV used for business is financed against the vehicle.",
    }];
  }

  let product: ProductId = input.consideredProduct;
  if (product === "not-sure") {
    if (uses.has("home-purchase")) product = "home";
    else if (businessIntent) {
      product = isUsableCollateral(input) && input.collateral?.type === "property"
        ? "lap"
        : isUsableCollateral(input) && input.collateral?.type === "gold"
          ? "gold"
          : "business";
    } else if (isUsableCollateral(input) && input.collateral?.type === "gold") product = "gold";
    else product = "personal";
  }
  const unresolvedVehicleRoute = vehicleIntent && !input.vehicle;
  return [{
    product,
    label: unresolvedVehicleRoute ? "Vehicle finance — details needed" : productLabel(product),
    amount: input.requestedAmount,
    rationale: unresolvedVehicleRoute
      ? "Vehicle use is confirmed, but class and use are still needed before selecting a retail or commercial vehicle product. The current amount uses a conservative fallback envelope."
      : `The structured use and available security route this need to ${productLabel(product).toLowerCase()}.`,
  }];
}

export function recognizeIncome(input: AssessmentInput): Interval {
  const reported = input.monthlyIncome;
  const coApplicantNet = input.coApplicant?.willing && input.coApplicant.documented
    ? Math.max(0, input.coApplicant.monthlyIncome - input.coApplicant.monthlyObligations)
    : 0;

  if (input.incomeType === "salaried") {
    const variableShare = clamp(input.variableIncomeShare ?? 0, 0, 1);
    const recognitionFactor = 1 - variableShare * 0.5;
    const continuityFactor = input.employmentStatus === "probation" || input.employmentStatus === "contract" ? 0.9 : 1;
    return {
      min: reported.min * recognitionFactor * continuityFactor + coApplicantNet,
      max: reported.max * recognitionFactor + coApplicantNet,
    };
  }

  if (input.incomeType === "self-employed") {
    const documented: number[] = [];
    if (input.itrAnnualIncome !== undefined) documented.push(input.itrAnnualIncome / 12);
    if (input.bankVisibleMonthlyIncome) {
      documented.push(input.bankVisibleMonthlyIncome.min, input.bankVisibleMonthlyIncome.max);
    }
    if (input.monthlyNetProfit) documented.push(input.monthlyNetProfit.min, input.monthlyNetProfit.max);
    const vintageFactor = input.businessVintageMonths === undefined
      ? 1
      : input.businessVintageMonths < 24 ? 0.8
        : input.businessVintageMonths < 36 ? 0.9 : 1;
    if (documented.length > 0) {
      return {
        min: Math.max(0, Math.min(...documented)) * vintageFactor + coApplicantNet,
        max: Math.min(reported.max, Math.max(...documented)) + coApplicantNet,
      };
    }
    return { min: reported.min * 0.5 * vintageFactor + coApplicantNet, max: reported.max + coApplicantNet };
  }

  if (input.incomeType === "informal") {
    const frequencyFactor = input.informalPaidDaysPerMonth === undefined
      ? 1
      : clamp(input.informalPaidDaysPerMonth / 26, 0.5, 1);
    if (input.bankVisibleMonthlyIncome) {
      return {
        min: Math.min(reported.min, input.bankVisibleMonthlyIncome.min) * frequencyFactor + coApplicantNet,
        max: Math.min(reported.max, input.bankVisibleMonthlyIncome.max) + coApplicantNet,
      };
    }
    return { min: coApplicantNet, max: reported.min * frequencyFactor + coApplicantNet };
  }

  const evidenceFactor = input.bankVisibleMonthlyIncome ? 0.9 : 0.7;
  return {
    min: reported.min * evidenceFactor + coApplicantNet,
    max: reported.max + coApplicantNet,
  };
}

function conservativeIncome(input: AssessmentInput): Interval {
  let min = input.monthlyIncome.min;
  let max = input.monthlyIncome.max;
  if (input.lowestRecentIncome !== undefined) {
    min = Math.min(min, input.lowestRecentIncome);
  }
  if (input.employmentStatus === "between-jobs") min = 0;
  if (input.informalActiveMonths !== undefined && input.informalActiveMonths < 9) {
    min *= input.informalActiveMonths / 12;
  }
  if (input.informalPaidDaysPerMonth !== undefined && input.incomeType === "informal") {
    min *= clamp(input.informalPaidDaysPerMonth / 26, 0.5, 1);
  }
  if (input.coApplicant?.willing && input.coApplicant.documented) {
    const contribution = Math.max(0, input.coApplicant.monthlyIncome - input.coApplicant.monthlyObligations);
    min += contribution;
    max += contribution;
  }
  return { min, max };
}

function safeRatioFor(input: AssessmentInput): Interval {
  const base = SAFE_RATIO[input.incomeType];
  if (input.emergencySavingsMonths === undefined) return { min: Math.max(0, base - 0.05), max: base };
  if (input.emergencySavingsMonths === 0) return { min: Math.max(0, base - 0.05), max: Math.max(0, base - 0.05) };
  if (input.emergencySavingsMonths < 3) return { min: base - 0.025, max: base - 0.025 };
  return { min: base, max: base };
}

function upcomingMonthly(input: AssessmentInput) {
  if (!input.upcomingExpense || input.upcomingExpense.amount <= 0) return 0;
  return input.upcomingExpense.amount / Math.max(1, input.upcomingExpense.monthsUntilDue);
}

function effectiveDebtPayments(input: AssessmentInput) {
  const scheduled = input.activeDebts?.reduce((sum, debt) => sum + Math.max(0, debt.emi), 0) ?? 0;
  return Math.max(input.currentDebtPayments, scheduled);
}

function safeEmiFor(input: AssessmentInput, income: Interval, ratio: Interval, existingDebt: number): Interval {
  const committed = upcomingMonthly(input);
  const calculate = (monthlyIncome: number, safeRatio: number) => Math.max(0, Math.min(
    safeRatio * monthlyIncome - existingDebt,
    monthlyIncome - input.essentialExpenses - existingDebt - monthlyIncome * 0.1 - committed,
  ));
  return {
    min: calculate(income.min, ratio.min),
    max: calculate(income.max, ratio.max),
  };
}

function capByAsset(amount: number, input: AssessmentInput, routes: ProductRoute[]) {
  let cap = Number.POSITIVE_INFINITY;
  if (routes.length === 1) {
    const product = routes[0].product;
    const config = configFor(product, input);
    if (product === "home" && input.propertyPurchase) {
      cap = Math.min(
        input.propertyPurchase.price - input.propertyPurchase.downPayment,
        input.propertyPurchase.price * (config.maxLtv ?? 1),
      );
    }
    if (product === "lap" && input.collateral) cap = input.collateral.value * (config.maxLtv ?? 1);
    if (product === "gold" && input.collateral?.type === "gold") cap = input.collateral.value * (config.maxLtv ?? 1);
  }
  return Math.max(0, Math.min(amount, cap));
}

function routeWeights(routes: ProductRoute[], requestedAmount: number) {
  const statedTotal = routes.reduce((sum, route) => sum + (route.amount ?? 0), 0);
  return routes.map((route) => ({
    route,
    weight: statedTotal > 0 ? (route.amount ?? 0) / statedTotal : 1 / routes.length,
    requested: route.amount ?? requestedAmount / routes.length,
  }));
}

function paymentPerRupee(
  input: AssessmentInput,
  routes: ProductRoute[],
  rateEdge: "low" | "high",
  tenureKind: "prudent" | "max",
) {
  return routeWeights(routes, input.requestedAmount).reduce((sum, item) => {
    const band = rateBandFor(item.route.product, input);
    const months = availableTenureMonths(item.route.product, input, tenureKind);
    if (months === 0) return Number.POSITIVE_INFINITY;
    return sum + item.weight * emiForPrincipal(1, band[rateEdge === "low" ? "min" : "max"], months);
  }, 0);
}

function capacityFromEmi(
  emi: number,
  input: AssessmentInput,
  routes: ProductRoute[],
  rateEdge: "low" | "high",
  tenureKind: "prudent" | "max",
) {
  const factor = paymentPerRupee(input, routes, rateEdge, tenureKind);
  return factor > 0 ? capByAsset(emi / factor, input, routes) : 0;
}

function emiForRequest(input: AssessmentInput, routes: ProductRoute[]) {
  return routeWeights(routes, input.requestedAmount).reduce((sum, item) => {
    const rate = rateBandFor(item.route.product, input).max;
    const months = availableTenureMonths(item.route.product, input, "prudent");
    return sum + (months === 0 ? Number.POSITIVE_INFINITY : emiForPrincipal(item.requested, rate, months));
  }, 0);
}

function combinedRateBand(input: AssessmentInput, routes: ProductRoute[]): Interval {
  const weighted = routeWeights(routes, input.requestedAmount);
  return weighted.reduce(
    (band, item) => {
      const rate = rateBandFor(item.route.product, input);
      return { min: band.min + item.weight * rate.min, max: band.max + item.weight * rate.max };
    },
    { min: 0, max: 0 },
  );
}

function aprForRoutes(input: AssessmentInput, routes: ProductRoute[], edge: "min" | "max") {
  const items = routeWeights(routes, input.requestedAmount).map((item) => {
    const config = configFor(item.route.product, input);
    return {
      principal: item.requested,
      rate: rateBandFor(item.route.product, input)[edge],
      feePercent: config.feePercent[edge],
      months: availableTenureMonths(item.route.product, input, "prudent"),
    };
  });
  if (items.some((item) => item.months === 0)) return 0;
  const maxMonths = Math.max(...items.map((item) => item.months));
  const cashflows = Array(maxMonths + 1).fill(0) as number[];
  cashflows[0] = items.reduce((sum, item) => sum + item.principal * (1 - item.feePercent / 100), 0);
  for (const item of items) {
    const emi = emiForPrincipal(item.principal, item.rate, item.months);
    for (let month = 1; month <= item.months; month += 1) cashflows[month] -= emi;
  }
  return annualPercentageRate(cashflows);
}

function aprBandFor(input: AssessmentInput, routes: ProductRoute[]): Interval {
  return { min: aprForRoutes(input, routes, "min"), max: aprForRoutes(input, routes, "max") };
}

function missingEvidence(input: AssessmentInput, routes: ProductRoute[]) {
  const missing: string[] = [];
  if (input.emergencySavingsMonths === undefined) missing.push("emergency savings");
  if (!input.activeDebts && input.currentDebtPayments > 0) missing.push("debt balances, rates and remaining tenures");
  if (input.incomeType === "salaried" && (!input.employmentStatus || input.employmentMonths === undefined)) missing.push("employment continuity");
  if (input.incomeType === "self-employed" && input.itrAnnualIncome === undefined && !input.bankVisibleMonthlyIncome) missing.push("ITR or bank-visible income");
  if (input.incomeType === "informal" && !input.bankVisibleMonthlyIncome) missing.push("bank-visible income");
  if (input.recentPaymentIssue && !input.delinquency) missing.push("payment-issue status");
  if (routes.some((route) => route.product === "lap") && !input.collateral) missing.push("property ownership and encumbrance");
  if ((input.purposeUses.includes("vehicle") || routes.some((route) => ["two-wheeler", "car", "commercial-vehicle"].includes(route.product))) && !input.vehicle) missing.push("vehicle class and use");
  return missing;
}

function vehicleFeasibilityWarning(input: AssessmentInput, routes: ProductRoute[]) {
  if (!input.vehicle?.price) return undefined;
  const vehicleRoute = routes.find((route) => ["two-wheeler", "car", "commercial-vehicle"].includes(route.product));
  if (!vehicleRoute) return undefined;
  const vehicleLoanAmount = vehicleRoute.amount ?? input.requestedAmount;
  const contribution = input.vehicle.downPayment ?? 0;
  const amountAfterContribution = Math.max(0, input.vehicle.price - contribution);
  if (vehicleLoanAmount <= amountAfterContribution) return undefined;
  const excess = vehicleLoanAmount - amountAfterContribution;
  return `The ₹${vehicleLoanAmount.toLocaleString("en-IN")} vehicle-loan portion is ₹${excess.toLocaleString("en-IN")} above the stated price after contribution. This does not change borrower-safe capacity; confirm the funding requirement and lender terms.`;
}

function confidenceFor(missing: string[]) {
  if (missing.length === 0) return "high" as const;
  if (missing.length <= 3) return "medium" as const;
  return "low" as const;
}

function stressFor(
  input: AssessmentInput,
  routes: ProductRoute[],
  safeIncome: Interval,
  requestedEmi: number,
  existingDebt: number,
): StressResult {
  const totalDebt = existingDebt + requestedEmi;
  const normalIncome = safeIncome.min;
  const normalResidual = normalIncome - input.essentialExpenses - totalDebt;
  const floating = routes.some((route) => configFor(route.product, input).rateType === "floating");
  let kind: StressResult["kind"];
  let label: string;
  let stressedDebt = totalDebt;
  let stressedIncome = normalIncome;

  if (floating) {
    kind = "rate-rise";
    label = "Rates rise 2 percentage points";
    stressedDebt = existingDebt + routeWeights(routes, input.requestedAmount).reduce((sum, item) => {
      const config = configFor(item.route.product, input);
      const rate = rateBandFor(item.route.product, input).max + (config.rateType === "floating" ? 2 : 0);
      const months = availableTenureMonths(item.route.product, input, "prudent");
      return sum + (months === 0 ? Number.POSITIVE_INFINITY : emiForPrincipal(item.requested, rate, months));
    }, 0);
  } else if (input.incomeType === "informal" || input.incomeType === "mixed" || input.variableIncomeShare) {
    kind = "low-month-drop";
    label = "Conservative low month falls another 20%";
    stressedIncome *= 0.8;
  } else {
    kind = "income-drop";
    label = "Reliable income falls 20% for three months";
    stressedIncome *= 0.8;
  }

  const stressedResidual = stressedIncome - input.essentialExpenses - stressedDebt;
  const stressedRatio = stressedIncome > 0 ? stressedDebt / stressedIncome : 1;
  const status = stressedResidual < 0 ? "fail" : stressedResidual < stressedIncome * 0.1 || stressedRatio > 0.5 ? "tight" : "pass";
  return {
    kind,
    label,
    normalResidual,
    stressedResidual,
    normalDebtRatio: normalIncome > 0 ? totalDebt / normalIncome : 1,
    stressedDebtRatio: stressedRatio,
    status,
  };
}

function copyFor(input: AssessmentInput, verdict: AssessmentResult["verdict"], routes: ProductRoute[]) {
  if (input.name?.toLowerCase() === "priya") {
    return "You can carry the ₹8L request, but a lender may offer much more. Do not let approval size become your borrowing target.";
  }
  if (input.name?.toLowerCase() === "ravi") {
    return "Split the need. Finance the delivery vehicle against the vehicle; use secured business funding only for the stock amount your documented cash flow can support.";
  }
  if (input.name?.toLowerCase() === "anita") {
    return "The scooter may improve income, but another EMI is unsafe until the bounced payment and app-loan burden are resolved.";
  }
  if (verdict === "DONT_BORROW") return "Pause this loan. Resolve the payment issue or cash-flow gap first, then reassess with updated statements.";
  if (verdict === "BORROW_LESS") return "The purpose may be reasonable, but the requested amount is above your safe range. Reduce the amount or wait until an existing obligation ends.";
  return `The request fits the current safety checks. Keep the borrowing at the amount needed and use the ${routes[0].label.toLowerCase()} rate band when negotiating.`;
}

export function assessBorrower(input: AssessmentInput): AssessmentResult {
  const routes = routeProducts(input);
  const existingDebt = effectiveDebtPayments(input);
  const recognized = recognizeIncome(input);
  const foir = FOIR[input.incomeType];
  const lenderEmi = {
    min: Math.max(0, recognized.min * foir.min - existingDebt),
    max: Math.max(0, recognized.max * foir.max - existingDebt),
  };
  const lenderAmount = {
    min: capacityFromEmi(lenderEmi.min, input, routes, "high", "max"),
    max: capacityFromEmi(lenderEmi.max, input, routes, "low", "max"),
  };
  const safeIncome = conservativeIncome(input);
  const safeRatio = safeRatioFor(input);
  const safeEmi = safeEmiFor(input, safeIncome, safeRatio, existingDebt);
  const safeAmount = {
    min: capacityFromEmi(safeEmi.min, input, routes, "high", "prudent"),
    max: capacityFromEmi(safeEmi.max, input, routes, "high", "prudent"),
  };
  const safeAmountRounded = {
    min: roundDownTo(safeAmount.min, 1_000),
    max: roundDownTo(safeAmount.max, 1_000),
  };
  const requestedEmi = emiForRequest(input, routes);
  const noAvailableTenure = routes.some((route) => availableTenureMonths(route.product, input, "max") === 0);
  const unresolved = Boolean(input.delinquency && !input.delinquency.resolved && input.delinquency.unresolvedAmount > 0);
  const cardUseConfirmed = input.hasCreditCardOrBnpl === true || input.activeDebts?.some((debt) => debt.type === "credit-card" || debt.type === "bnpl");
  const revolvingCardRisk = Boolean(cardUseConfirmed && input.cardUtilisationPercent !== undefined && input.cardUtilisationPercent >= 75 && input.cardPaidInFull === false);
  const highCostCount = (input.activeDebts?.filter((debt) => debt.balance > 0 && (debt.highCost || (debt.annualRate ?? 0) >= 24)).length ?? 0) + (revolvingCardRisk ? 1 : 0);
  const recentUnresolved = unresolved && (input.delinquency?.monthsAgo ?? 12) <= 3;
  const hardStop = noAvailableTenure || safeEmi.min <= 0 ||
    input.essentialExpenses + existingDebt >= safeIncome.min ||
    (input.recentPaymentIssue && recentUnresolved && highCostCount >= 2);
  const verdict = hardStop
    ? "DONT_BORROW"
    : input.requestedAmount > safeAmountRounded.min
      ? "BORROW_LESS"
      : "BORROW";
  const useAmount = verdict === "DONT_BORROW" ? 0 : Math.min(input.requestedAmount, safeAmountRounded.min);
  const recommendedTenureMonths = routes.length > 1
    ? Math.min(...routes.map((route) => availableTenureMonths(route.product, input, "prudent")))
    : availableTenureMonths(routes[0].product, input, "prudent");
  const recommendedTenureLabel = routes.length > 1
    ? routes.map((route) => {
        const months = availableTenureMonths(route.product, input, "prudent");
        return `${route.label}: ${months === 0 ? "not available" : `${months / 12} years`}`;
      }).join(" · ")
    : recommendedTenureMonths === 0 ? "No modeled tenure" : `${recommendedTenureMonths / 12} years`;
  const rateBand = combinedRateBand(input, routes);
  const aprBand = aprBandFor(input, routes);
  const missing = missingEvidence(input, routes);
  const stress = stressFor(input, routes, safeIncome, requestedEmi, existingDebt);
  const mismatch = input.consideredProduct !== "not-sure" &&
    !routes.some((route) => route.product === input.consideredProduct)
    ? `${productLabel(input.consideredProduct)} does not match the recommended ${routes.map((route) => route.label).join(" + ")} route.`
    : undefined;
  const feasibilityWarning = vehicleFeasibilityWarning(input, routes);
  const bindingConstraint = hardStop
    ? noAvailableTenure ? "age and available product tenure"
      : recentUnresolved && highCostCount >= 2 ? "unresolved payment issue and stacked high-cost debt" : "monthly cash flow"
    : safeEmi.min < lenderEmi.min ? "borrower-safe EMI ceiling" : "lender-recognized income";

  const reasons: Reason[] = [
    {
      ruleId: "LEND-01",
      title: "Indicative lender EMI headroom",
      calculation: `${Math.round(lenderEmi.min).toLocaleString("en-IN")}–${Math.round(lenderEmi.max).toLocaleString("en-IN")} = recognized income × ${(foir.min * 100).toFixed(0)}–${(foir.max * 100).toFixed(0)}% − ₹${existingDebt.toLocaleString("en-IN")} existing repayments.`,
    },
    {
      ruleId: "SAFE-01",
      title: "Borrower-safe EMI headroom",
      calculation: `₹${Math.round(safeEmi.min).toLocaleString("en-IN")}–₹${Math.round(safeEmi.max).toLocaleString("en-IN")} uses ${(safeRatio.min * 100).toFixed(1)}–${(safeRatio.max * 100).toFixed(1)}% of conservative income and the tighter 10% cash-reserve check.`,
    },
    {
      ruleId: "PRICE-01",
      title: "Fair rate range",
      calculation: `${rateBand.min.toFixed(2)}–${rateBand.max.toFixed(2)}% is the matched product/profile band; unknown credit uses the full envelope, not a penalty.`,
    },
  ];

  const endingSoon = input.activeDebts?.filter((debt) => debt.monthsLeft !== undefined && debt.monthsLeft <= 3).sort((a, b) => (a.monthsLeft ?? 99) - (b.monthsLeft ?? 99))[0];
  const immediateAction = verdict === "DONT_BORROW"
    ? noAvailableTenure
      ? "This product has no modeled repayment tenure at your age; confirm age eligibility or consider a non-debt alternative."
      : "Pause the new application; clear the live payment issue and reduce high-cost debt before reassessing."
    : verdict === "BORROW_LESS"
      ? endingSoon
        ? `Wait ${endingSoon.monthsLeft} month${endingSoon.monthsLeft === 1 ? "" : "s"} for ${endingSoon.label} to end, then reassess before adding a new EMI.`
        : `Cap the plan near ₹${safeAmountRounded.min.toLocaleString("en-IN")} or reduce the scope.`
      : "The request fits the conservative amount; compare KFS documents before choosing a lender.";

  return {
    verdict,
    immediateAction,
    lenderRecognizedIncome: recognized,
    lenderNewEmi: lenderEmi,
    lenderAmount: { min: roundTo(lenderAmount.min, 1_000), max: roundTo(lenderAmount.max, 1_000) },
    safeIncome,
    safeRatio,
    safeNewEmi: safeEmi,
    safeAmount: safeAmountRounded,
    useAmount,
    requestedEmi,
    recommendedTenureMonths,
    recommendedTenureLabel,
    rateBand,
    aprBand,
    routes,
    productMismatch: mismatch,
    productFeasibilityWarning: feasibilityWarning,
    bindingConstraint,
    stress,
    confidence: confidenceFor(missing),
    missingEvidence: missing,
    reasons,
    borrowerCopy: copyFor(input, verdict, routes),
    negotiationLine: `“I’m comparing KFS documents. This profile should price around ${rateBand.min.toFixed(1)}–${rateBand.max.toFixed(1)}% nominal; please show the APR and every mandatory charge.”`,
    upsideScenario: input.expectedNetIncomeUplift && input.expectedNetIncomeUplift > 0
      ? {
          monthlyIncomeUplift: input.expectedNetIncomeUplift,
          plausibleRange: input.upliftEvidence === "strong"
            ? { min: input.expectedNetIncomeUplift * 0.75, max: input.expectedNetIncomeUplift }
            : input.upliftEvidence === "weak"
              ? { min: 0, max: input.expectedNetIncomeUplift * 0.5 }
              : { min: 0, max: input.expectedNetIncomeUplift },
          note: "Shown as upside only. The evidence-adjusted range is excluded from lender and borrower-safe base capacity.",
        }
      : undefined,
  };
}

export { MARKET_AS_OF };

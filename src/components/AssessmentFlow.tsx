import { useMemo, useState } from "react";
import { activeAdaptiveModules } from "../domain/questions";
import type { ActiveDebt, AssessmentInput, BorrowingUse, CreditStatus, ProductId } from "../domain/types";
import type { PersonaPreset } from "../domain/presets";
import { validateAssessment } from "../domain/validation";

type Props = {
  initialInput?: AssessmentInput;
  persona?: PersonaPreset;
  onBack: () => void;
  onComplete: (input: AssessmentInput) => void;
};

const EMPTY_INPUT: AssessmentInput = {
  purpose: "",
  purposeUses: [],
  requestedAmount: 0,
  consideredProduct: "not-sure",
  age: 0,
  incomeType: "salaried",
  monthlyIncome: { min: 0, max: 0 },
  currentDebtPayments: 0,
  debtZeroConfirmed: false,
  essentialExpenses: 0,
  creditStatus: { kind: "unknown" },
  recentPaymentIssue: false,
};

const STEPS = ["Your need", "Monthly picture", "Credit record", "Sharpen the answer"];

const productOptions: { value: ProductId; label: string }[] = [
  { value: "not-sure", label: "Not sure — recommend one" },
  { value: "personal", label: "Personal loan" },
  { value: "home", label: "Home loan" },
  { value: "lap", label: "Loan against property" },
  { value: "gold", label: "Gold loan" },
  { value: "two-wheeler", label: "Two-wheeler finance" },
  { value: "car", label: "Car finance" },
  { value: "commercial-vehicle", label: "Commercial-vehicle finance" },
  { value: "business", label: "Business loan" },
];

const purposeOptions: { value: BorrowingUse; label: string }[] = [
  { value: "personal-expense", label: "Personal expense" },
  { value: "debt-consolidation", label: "Consolidate debt" },
  { value: "working-capital", label: "Stock / working capital" },
  { value: "equipment", label: "Business equipment" },
  { value: "vehicle", label: "Vehicle" },
  { value: "home-purchase", label: "Home purchase" },
  { value: "other", label: "Other" },
];

const debtTypeOptions: { value: NonNullable<ActiveDebt["type"]>; label: string }[] = [
  { value: "personal-loan", label: "Personal loan" },
  { value: "vehicle-loan", label: "Vehicle loan" },
  { value: "home-loan", label: "Home loan" },
  { value: "business-loan", label: "Business loan" },
  { value: "app-loan", label: "App loan" },
  { value: "credit-card", label: "Credit card" },
  { value: "bnpl", label: "BNPL" },
  { value: "informal-loan", label: "Informal loan" },
  { value: "other", label: "Other" },
];

function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  min = 0,
  max,
  step = 1,
  hint,
}: {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="input-shell">
        {prefix && <span className="affix">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
        />
        {suffix && <span className="affix suffix">{suffix}</span>}
      </span>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function YesNo({ label, value, onChange }: { label: string; value?: boolean; onChange: (value: boolean) => void }) {
  return (
    <fieldset className="choice-field">
      <legend>{label}</legend>
      <div className="segmented compact">
        {[true, false].map((option) => (
          <button
            type="button"
            className={value === option ? "active" : ""}
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            key={String(option)}
          >
            {option ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ModuleFields({
  moduleId,
  input,
  update,
}: {
  moduleId: string;
  input: AssessmentInput;
  update: (patch: Partial<AssessmentInput>) => void;
}) {
  switch (moduleId) {
    case "employment-continuity":
      return <div className="field-grid two">
        <SelectField
          label="Employment status"
          value={input.employmentStatus ?? "permanent"}
          options={[
            { value: "permanent", label: "Permanent" },
            { value: "contract", label: "Contract" },
            { value: "probation", label: "On probation" },
            { value: "between-jobs", label: "Between jobs" },
          ]}
          onChange={(employmentStatus) => update({ employmentStatus })}
        />
        <NumberField label="Months in current employment" value={input.employmentMonths} onChange={(employmentMonths) => update({ employmentMonths })} />
      </div>;
    case "business-vintage":
      return <NumberField label="Months in business" value={input.businessVintageMonths} onChange={(businessVintageMonths) => update({ businessVintageMonths })} />;
    case "profit-not-turnover":
      return <div className="field-grid two">
        <NumberField label="Monthly turnover — low" prefix="₹" value={input.monthlyTurnover?.min} onChange={(value) => update({ monthlyTurnover: { min: value ?? 0, max: input.monthlyTurnover?.max ?? value ?? 0 } })} />
        <NumberField label="Monthly turnover — high" prefix="₹" value={input.monthlyTurnover?.max} onChange={(value) => update({ monthlyTurnover: { min: input.monthlyTurnover?.min ?? value ?? 0, max: value ?? 0 } })} />
        <NumberField label="Net take-home — low" prefix="₹" value={input.monthlyNetProfit?.min} onChange={(value) => update({ monthlyNetProfit: { min: value ?? 0, max: input.monthlyNetProfit?.max ?? value ?? 0 } })} />
        <NumberField label="Net take-home — high" prefix="₹" value={input.monthlyNetProfit?.max} onChange={(value) => update({ monthlyNetProfit: { min: input.monthlyNetProfit?.min ?? value ?? 0, max: value ?? 0 } })} />
      </div>;
    case "variable-income":
      return <div className="field-grid two">
        <NumberField label="Income that varies" suffix="%" min={0} max={100} value={input.variableIncomeShare === undefined ? undefined : input.variableIncomeShare * 100} onChange={(value) => update({ variableIncomeShare: value === undefined ? undefined : value / 100 })} />
        <NumberField label="Lowest recent month" prefix="₹" value={input.lowestRecentIncome} onChange={(lowestRecentIncome) => update({ lowestRecentIncome })} />
      </div>;
    case "documented-income":
      return <div className="field-grid two">
        <NumberField label="Latest ITR annual income" prefix="₹" value={input.itrAnnualIncome} onChange={(itrAnnualIncome) => update({ itrAnnualIncome })} />
        <div className="range-cluster">
          <span className="field-label">Bank-visible monthly income</span>
          <div className="field-grid two">
            <NumberField label="Low" prefix="₹" value={input.bankVisibleMonthlyIncome?.min} onChange={(value) => update({ bankVisibleMonthlyIncome: { min: value ?? 0, max: input.bankVisibleMonthlyIncome?.max ?? value ?? 0 } })} />
            <NumberField label="High" prefix="₹" value={input.bankVisibleMonthlyIncome?.max} onChange={(value) => update({ bankVisibleMonthlyIncome: { min: input.bankVisibleMonthlyIncome?.min ?? value ?? 0, max: value ?? 0 } })} />
          </div>
        </div>
      </div>;
    case "informal-continuity":
      return <div className="field-grid two">
        <NumberField label="Active earning months last year" min={0} max={12} value={input.informalActiveMonths} onChange={(informalActiveMonths) => update({ informalActiveMonths })} />
        <NumberField label="Typical paid days each month" min={0} max={31} value={input.informalPaidDaysPerMonth} onChange={(informalPaidDaysPerMonth) => update({ informalPaidDaysPerMonth })} />
      </div>;
    case "household-load":
      return <div className="field-grid two">
        <NumberField label="Other household income" prefix="₹" value={input.otherHouseholdIncome} onChange={(otherHouseholdIncome) => update({ otherHouseholdIncome })} hint="Context only unless that person becomes a documented co-applicant." />
        <NumberField label="Dependants" min={0} max={20} value={input.dependants} onChange={(dependants) => update({ dependants })} />
      </div>;
    case "co-applicant": {
      const current = input.coApplicant ?? { monthlyIncome: 0, documented: false, monthlyObligations: 0, willing: false };
      return <div className="stack-sm">
        <YesNo label="Will a co-applicant join the loan?" value={current.willing} onChange={(willing) => update({ coApplicant: { ...current, willing } })} />
        {current.willing && <>
          <YesNo label="Is their income documented?" value={current.documented} onChange={(documented) => update({ coApplicant: { ...current, documented } })} />
          <div className="field-grid two">
            <NumberField label="Co-applicant monthly income" prefix="₹" value={current.monthlyIncome} onChange={(value) => update({ coApplicant: { ...current, monthlyIncome: value ?? 0 } })} />
            <NumberField label="Their monthly obligations" prefix="₹" value={current.monthlyObligations} onChange={(value) => update({ coApplicant: { ...current, monthlyObligations: value ?? 0 } })} />
          </div>
        </>}
      </div>;
    }
    case "emergency-savings":
      return <NumberField label="Months of essential expenses saved" value={input.emergencySavingsMonths} onChange={(emergencySavingsMonths) => update({ emergencySavingsMonths })} hint="Unknown is allowed. It widens the safe range." />;
    case "upcoming-expense": {
      const current = input.upcomingExpense ?? { amount: 0, monthsUntilDue: 1 };
      return <div className="field-grid two">
        <NumberField label="Unavoidable amount" prefix="₹" value={current.amount || undefined} onChange={(value) => update({ upcomingExpense: { ...current, amount: value ?? 0 } })} />
        <NumberField label="Due in how many months?" min={1} value={current.monthsUntilDue} onChange={(value) => update({ upcomingExpense: { ...current, monthsUntilDue: value ?? 1 } })} />
      </div>;
    }
    case "debt-schedule":
      return <div className="debt-list">
        {(input.activeDebts ?? []).map((debt, index) => <div className="debt-row" key={`${debt.label}-${index}`}>
          <SelectField label="Debt type" value={debt.type ?? "other"} options={debtTypeOptions} onChange={(type) => {
            const debts = [...(input.activeDebts ?? [])]; debts[index] = { ...debt, type }; update({ activeDebts: debts });
          }} />
          <input aria-label={`Debt ${index + 1} name`} value={debt.label} onChange={(event) => {
            const debts = [...(input.activeDebts ?? [])];
            debts[index] = { ...debt, label: event.target.value };
            update({ activeDebts: debts });
          }} />
          <NumberField label="Balance" prefix="₹" value={debt.balance} onChange={(value) => {
            const debts = [...(input.activeDebts ?? [])]; debts[index] = { ...debt, balance: value ?? 0 }; update({ activeDebts: debts });
          }} />
          <NumberField label="EMI" prefix="₹" value={debt.emi} onChange={(value) => {
            const debts = [...(input.activeDebts ?? [])]; debts[index] = { ...debt, emi: value ?? 0 }; update({ activeDebts: debts });
          }} />
          <NumberField label="Rate" suffix="%" value={debt.annualRate} onChange={(value) => {
            const debts = [...(input.activeDebts ?? [])]; debts[index] = { ...debt, annualRate: value, highCost: (value ?? 0) >= 24 }; update({ activeDebts: debts });
          }} />
          <NumberField label="Months left" value={debt.monthsLeft} onChange={(value) => {
            const debts = [...(input.activeDebts ?? [])]; debts[index] = { ...debt, monthsLeft: value }; update({ activeDebts: debts });
          }} />
        </div>)}
        <button type="button" className="text-button" onClick={() => update({ activeDebts: [...(input.activeDebts ?? []), { label: `Debt ${(input.activeDebts?.length ?? 0) + 1}`, type: "other", balance: 0, emi: 0 }] })}>+ Add a debt</button>
      </div>;
    case "card-behaviour":
      return <div className="stack-sm">
        <YesNo label="Do you currently use a credit card or BNPL?" value={input.hasCreditCardOrBnpl} onChange={(hasCreditCardOrBnpl) => update({
          hasCreditCardOrBnpl,
          ...(hasCreditCardOrBnpl ? {} : { cardUtilisationPercent: undefined, cardPaidInFull: undefined }),
        })} />
        {input.hasCreditCardOrBnpl && <div className="field-grid two">
          <NumberField label="Credit-card utilisation" suffix="%" min={0} max={100} value={input.cardUtilisationPercent} onChange={(cardUtilisationPercent) => update({ cardUtilisationPercent })} />
          <YesNo label="Paid in full each month?" value={input.cardPaidInFull} onChange={(cardPaidInFull) => update({ cardPaidInFull })} />
        </div>}
      </div>;
    case "delinquency-detail": {
      const current = input.delinquency ?? { monthsAgo: 1, unresolvedAmount: 0, resolved: false };
      return <div className="field-grid three">
        <NumberField label="Months ago" min={0} max={12} value={current.monthsAgo} onChange={(value) => update({ delinquency: { ...current, monthsAgo: value ?? 0 } })} />
        <NumberField label="Amount unresolved" prefix="₹" value={current.unresolvedAmount} onChange={(value) => update({ delinquency: { ...current, unresolvedAmount: value ?? 0 } })} />
        <YesNo label="Fully resolved?" value={current.resolved} onChange={(resolved) => update({ delinquency: { ...current, resolved } })} />
      </div>;
    }
    case "collateral": {
      const current = input.collateral ?? { type: "property" as const, value: 0, ownedByApplicant: true, encumbered: false, essentialAsset: false, willingToPledge: false };
      return <div className="stack-sm">
        <div className="field-grid two">
          <SelectField label="Collateral type" value={current.type} options={[{ value: "property", label: "Property" }, { value: "gold", label: "Gold" }, { value: "other", label: "Other" }]} onChange={(type) => update({ collateral: { ...current, type } })} />
          <NumberField label="Estimated value" prefix="₹" value={current.value || undefined} onChange={(value) => update({ collateral: { ...current, value: value ?? 0 } })} />
        </div>
        <div className="yesno-grid">
          <YesNo label="Owned by you?" value={current.ownedByApplicant} onChange={(ownedByApplicant) => update({ collateral: { ...current, ownedByApplicant } })} />
          <YesNo label="Already pledged?" value={current.encumbered} onChange={(encumbered) => update({ collateral: { ...current, encumbered } })} />
          <YesNo label="Essential home/business asset?" value={current.essentialAsset} onChange={(essentialAsset) => update({ collateral: { ...current, essentialAsset } })} />
          <YesNo label="Willing to pledge?" value={current.willingToPledge} onChange={(willingToPledge) => update({ collateral: { ...current, willingToPledge } })} />
        </div>
      </div>;
    }
    case "vehicle": {
      const current = input.vehicle ?? { class: "two-wheeler" as const, use: "personal" as const, condition: "unknown" as const };
      return <div className="field-grid two">
        <SelectField label="Vehicle class" value={current.class} options={[{ value: "two-wheeler", label: "Two-wheeler" }, { value: "car", label: "Car" }, { value: "three-wheeler-lcv", label: "Three-wheeler / LCV" }]} onChange={(vehicleClass) => update({ vehicle: { ...current, class: vehicleClass } })} />
        <SelectField label="Primary use" value={current.use} options={[{ value: "personal", label: "Personal only" }, { value: "income-generating", label: "Personal, used to earn" }, { value: "business", label: "Business / commercial" }]} onChange={(use) => update({ vehicle: { ...current, use } })} />
        <SelectField label="Condition" value={current.condition} options={[{ value: "unknown", label: "Not sure" }, { value: "new", label: "New" }, { value: "used", label: "Used" }]} onChange={(condition) => update({ vehicle: { ...current, condition } })} />
        <NumberField label="Vehicle price — optional" prefix="₹" value={current.price} onChange={(price) => update({ vehicle: { ...current, price } })} hint="Used only to flag a possible funding gap; it never changes affordability." />
        <NumberField label="Your contribution — optional" prefix="₹" value={current.downPayment} onChange={(downPayment) => update({ vehicle: { ...current, downPayment } })} hint="Leave blank if the requested loan amount is already net of your contribution." />
      </div>;
    }
    case "property-purchase": {
      const current = input.propertyPurchase ?? { price: input.requestedAmount, downPayment: 0 };
      return <div className="field-grid two">
        <NumberField label="Purchase price" prefix="₹" value={current.price || undefined} onChange={(value) => update({ propertyPurchase: { ...current, price: value ?? 0 } })} />
        <NumberField label="Down payment" prefix="₹" value={current.downPayment || undefined} onChange={(value) => update({ propertyPurchase: { ...current, downPayment: value ?? 0 } })} />
      </div>;
    }
    case "business-split": {
      const current = input.businessSplit ?? { workingCapital: input.requestedAmount, equipment: 0, vehicle: 0 };
      return <div className="field-grid three">
        <NumberField label="Working capital / stock" prefix="₹" value={current.workingCapital || undefined} onChange={(value) => update({ businessSplit: { ...current, workingCapital: value ?? 0 } })} />
        <NumberField label="Equipment" prefix="₹" value={current.equipment || undefined} onChange={(value) => update({ businessSplit: { ...current, equipment: value ?? 0 } })} />
        <NumberField label="Vehicle" prefix="₹" value={current.vehicle || undefined} onChange={(value) => update({ businessSplit: { ...current, vehicle: value ?? 0 } })} />
      </div>;
    }
    case "income-upside":
      return <div className="field-grid two">
        <NumberField label="Expected net monthly uplift" prefix="₹" value={input.expectedNetIncomeUplift} onChange={(expectedNetIncomeUplift) => update({ expectedNetIncomeUplift })} hint="Never included in base affordability." />
        <SelectField label="Evidence quality" value={input.upliftEvidence ?? "none"} options={[{ value: "none", label: "No evidence yet" }, { value: "weak", label: "Early indication" }, { value: "strong", label: "Orders / contracts support it" }]} onChange={(upliftEvidence) => update({ upliftEvidence })} />
      </div>;
    default:
      return null;
  }
}

export function AssessmentFlow({ initialInput, persona, onBack, onComplete }: Props) {
  const [input, setInput] = useState<AssessmentInput>(initialInput ?? EMPTY_INPUT);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const update = (patch: Partial<AssessmentInput>) => setInput((current) => ({ ...current, ...patch }));
  const activeModules = useMemo(() => activeAdaptiveModules(input), [input]);

  const validate = () => {
    if (step === 0 && (input.purposeUses.length === 0 || !input.purpose.trim() || input.requestedAmount <= 0 || input.age < 18 || input.age > 80)) {
      return "Select at least one use, add a short purpose, a valid amount, and an age between 18 and 80.";
    }
    if (step === 1 && (input.monthlyIncome.min <= 0 || input.monthlyIncome.max < input.monthlyIncome.min || input.essentialExpenses <= 0)) {
      return "Add an honest income range and essential monthly expenses.";
    }
    if (step === 1 && input.currentDebtPayments === 0 && !input.debtZeroConfirmed) {
      return "Please confirm that zero current repayments really means zero.";
    }
    if (step === 2 && input.creditStatus.kind === "exact" && (input.creditStatus.score < 300 || input.creditStatus.score > 900)) {
      return "A credit score must be between 300 and 900.";
    }
    if (step === STEPS.length - 1) {
      return validateAssessment(input)[0]?.message ?? "";
    }
    return "";
  };

  const next = () => {
    const message = validate();
    if (message) { setError(message); return; }
    setError("");
    if (step === STEPS.length - 1) onComplete(input);
    else { setStep((current) => current + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  const setCreditKind = (kind: string) => {
    let creditStatus: CreditStatus;
    if (kind === "exact") creditStatus = { kind: "exact", score: input.creditStatus.kind === "exact" ? input.creditStatus.score : 750 };
    else if (kind.startsWith("band:")) creditStatus = { kind: "band", band: kind.split(":")[1] as "excellent" | "good" | "fair" | "low" };
    else creditStatus = { kind: kind as "no-history" | "unknown" };
    update({ creditStatus });
  };

  const creditValue = input.creditStatus.kind === "band" ? `band:${input.creditStatus.band}` : input.creditStatus.kind;

  return (
    <main className="assessment-page">
      <header className="assessment-header">
        <button className="brand-button" onClick={onBack} type="button" aria-label="Back to home">
          <span className="brand-mark">bc</span><span>Borrower Copilot</span>
        </button>
        <span className="quiet-label">Private by design · nothing is saved</span>
      </header>

      <div className="assessment-layout">
        <aside className="step-rail" aria-label="Assessment progress">
          <p className="eyebrow">Assessment</p>
          <ol>
            {STEPS.map((label, index) => <li className={index === step ? "current" : index < step ? "done" : ""} key={label}>
              <span>{index < step ? "✓" : index + 1}</span>{label}
            </li>)}
          </ol>
          <div className="rail-note">
            <strong>Why ranges?</strong>
            <p>Real incomes and offers move. We keep uncertainty visible instead of inventing precision.</p>
          </div>
        </aside>

        <section className="form-panel">
          <div className="mobile-progress"><span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
          {persona && <div className="assumption-banner">
            <span>Guided {persona.facts.name} case</span>
            <p>Brief facts are loaded. Example-only assumptions: {persona.assumptionLabels.join(" · ")}</p>
          </div>}

          <div className="form-heading">
            <p className="step-count">Step {step + 1} of {STEPS.length}</p>
            <h1>{STEPS[step]}</h1>
            <p>{step === 0 && "Start with the decision you are actually making."}{step === 1 && "Use take-home cash, not CTC, turnover, or hoped-for earnings."}{step === 2 && "No history and unknown are valid answers. Neither is treated as a bad score."}{step === 3 && `${activeModules.length} follow-up modules earned their place from your answers. All are optional; skipping them widens the result.`}</p>
          </div>

          {step === 0 && <div className="form-body stack-lg">
            <fieldset className="choice-field">
              <legend>1. What will the money be used for? Select all that apply.</legend>
              <div className="choice-cards four">
                {purposeOptions.map((option) => {
                  const selected = input.purposeUses.includes(option.value);
                  return <button
                    key={option.value}
                    type="button"
                    className={selected ? "active" : ""}
                    aria-pressed={selected}
                    onClick={() => update({
                      purposeUses: selected
                        ? input.purposeUses.filter((use) => use !== option.value)
                        : [...input.purposeUses, option.value],
                    })}
                  >{option.label}</button>;
                })}
              </div>
            </fieldset>
            <label className="field">
              <span className="field-label">Brief purpose</span>
              <textarea value={input.purpose} onChange={(event) => update({ purpose: event.target.value })} placeholder="For example, wedding expenses or a second stock line" rows={3} />
              <span className="field-hint">This note helps explain your answer. Product routing uses only the selections above.</span>
            </label>
            <div className="field-grid two">
              <NumberField label="2. Requested amount" prefix="₹" step={5_000} value={input.requestedAmount || undefined} onChange={(requestedAmount) => update({ requestedAmount: requestedAmount ?? 0 })} />
              <SelectField label="3. Product being considered" value={input.consideredProduct} options={productOptions} onChange={(consideredProduct) => update({ consideredProduct })} />
              <NumberField label="4. Your age" value={input.age || undefined} min={18} max={80} onChange={(age) => update({ age: age ?? 0 })} />
            </div>
          </div>}

          {step === 1 && <div className="form-body stack-lg">
            <fieldset className="choice-field">
              <legend>5. How do you earn?</legend>
              <div className="choice-cards four">
                {(["salaried", "self-employed", "informal", "mixed"] as const).map((type) => <button key={type} type="button" className={input.incomeType === type ? "active" : ""} onClick={() => update({ incomeType: type })} aria-pressed={input.incomeType === type}>{type === "informal" ? "Informal / gig" : type.replace("-", " ")}</button>)}
              </div>
            </fieldset>
            <div className="range-cluster">
              <span className="field-label">6. Recurring monthly take-home</span>
              <p className="field-hint">Use the same number twice if it is fixed.</p>
              <div className="field-grid two">
                <NumberField label="Reliable low month" prefix="₹" value={input.monthlyIncome.min || undefined} onChange={(value) => update({ monthlyIncome: { ...input.monthlyIncome, min: value ?? 0 } })} />
                <NumberField label="Typical high month" prefix="₹" value={input.monthlyIncome.max || undefined} onChange={(value) => update({ monthlyIncome: { ...input.monthlyIncome, max: value ?? 0 } })} />
              </div>
            </div>
            <div className="field-grid two">
              <NumberField label="7. Current monthly debt repayments" prefix="₹" value={input.currentDebtPayments} onChange={(currentDebtPayments) => update({ currentDebtPayments: currentDebtPayments ?? 0, debtZeroConfirmed: currentDebtPayments === 0 ? input.debtZeroConfirmed : false })} />
              <NumberField label="8. Essential household expenses" prefix="₹" value={input.essentialExpenses || undefined} onChange={(essentialExpenses) => update({ essentialExpenses: essentialExpenses ?? 0 })} hint="Include rent, food, utilities, school, medicine and transport." />
            </div>
            {input.currentDebtPayments === 0 && <label className="check-row"><input type="checkbox" checked={input.debtZeroConfirmed} onChange={(event) => update({ debtZeroConfirmed: event.target.checked })} /><span>I confirm I have no current EMI, app-loan, card, BNPL, or informal debt payment.</span></label>}
          </div>}

          {step === 2 && <div className="form-body stack-lg">
            <SelectField label="9. What is your credit status?" value={creditValue} options={[
              { value: "exact", label: "I know the exact score" },
              { value: "band:excellent", label: "Excellent (roughly 800+)" },
              { value: "band:good", label: "Good (roughly 750–799)" },
              { value: "band:fair", label: "Fair (roughly 650–749)" },
              { value: "band:low", label: "Below 650" },
              { value: "no-history", label: "No formal credit history" },
              { value: "unknown", label: "Unknown" },
            ]} onChange={setCreditKind} />
            {input.creditStatus.kind === "exact" && <NumberField label="Credit score" min={300} max={900} value={input.creditStatus.score} onChange={(score) => update({ creditStatus: { kind: "exact", score: score ?? 750 } })} />}
            <YesNo label="10. Any late, bounced, or overdue payment in the last 12 months?" value={input.recentPaymentIssue} onChange={(recentPaymentIssue) => update({ recentPaymentIssue })} />
            <div className="honesty-note"><span>Unknown is not zero.</span><p>If you skip evidence, the result stays useful—but its range gets wider and confidence gets lower.</p></div>
          </div>}

          {step === 3 && <div className="adaptive-list">
            {activeModules.map((module, index) => <details className="adaptive-module" key={module.id} open={index < 3 || Boolean(persona)}>
              <summary>
                <span className={`priority-dot ${module.priority}`} />
                <span><strong>{module.title}</strong><small>{module.why}</small></span>
                <span className="optional-tag">Optional</span>
              </summary>
              <div className="adaptive-content"><ModuleFields moduleId={module.id} input={input} update={update} /></div>
            </details>)}
          </div>}

          {error && <p className="form-error" role="alert">{error}</p>}
          <footer className="form-actions">
            <button type="button" className="button secondary" onClick={() => step === 0 ? onBack() : setStep((current) => current - 1)}>Back</button>
            <button type="button" className="button primary" onClick={next}>{step === STEPS.length - 1 ? "See my answer" : "Continue"}<span aria-hidden="true">→</span></button>
          </footer>
        </section>
      </div>
    </main>
  );
}

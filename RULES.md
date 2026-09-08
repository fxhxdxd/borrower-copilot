# Borrower Copilot V1 — Rules and evidence

## Reading this document

Borrower Copilot is deterministic decision support, not underwriting, a sanction, or financial advice. The engine deliberately separates:

- **Regulation** — a rule stated by RBI within its actual scope.
- **Market data** — a lender/NBFC disclosure used to form a reference range.
- **Our judgment** — a transparent borrower-safety or modeling choice.
- **Calculation** — arithmetic derived from answered facts and the preceding rules.

Every result carries rule IDs from this document. All money is in Indian rupees. Market data is current to **7 September 2026** unless a source states an earlier effective date.

## Decision architecture

The engine is interval-first. A low/high answer remains an interval through income recognition, EMI headroom, principal capacity, pricing, and APR. Missing information never becomes a factual zero.

Decision order:

1. `DON'T BORROW` if the conservative safe EMI is zero; essentials plus existing repayments consume conservative income; or a payment problem from the last three months remains unresolved while at least two high-cost debts are active.
2. `BORROW LESS` when there is no hard stop but the request exceeds the conservative edge of safe capacity.
3. `BORROW` when the request fits the conservative edge and there is no hard stop.
4. A product mismatch is reported separately. It never changes a verdict through a hidden score.

Purpose changes routing and alternatives, not moral judgment.

## Income recognition

### `INC-01` Lender-recognized income — our judgment

- Salaried: fixed net monthly income plus 50% of recurring variable income. Contract or probation status applies a 10% lower-edge continuity adjustment.
- Self-employed: use the interval evidenced by ITR, bank-visible income, and stated net profit/take-home. Turnover is never treated as income. A business under 24 months applies an 80% lower-edge continuity factor; 24–35 months applies 90%.
- Informal/gig: documented and self-reported cash flow stay distinct. Without bank-visible evidence the recognized range begins at zero and ends at the conservative self-reported month; this represents lender uncertainty, not an assertion that income is zero.
- Mixed: 70% of the self-reported lower edge is recognized without bank evidence, 90% with it; the reported upper edge remains the ceiling.
- Co-applicant income enters only when willingness and documentation are both confirmed, net of that person's monthly obligations.
- Expected income from a financed asset is never added to base lender or safe capacity.

Business continuity and informal paid-day frequency are V1 judgment parameters, not universal lender policy. They are isolated in pure functions so the live follow-up can change them without altering UI code.

## Lender view

### `LEND-01` Market-practice FOIR envelope — our judgment

These are indicative FOIR-style market-practice envelopes, **not RBI mandates**:

| Income profile | Total EMI / recognized income |
|---|---:|
| Stable salaried | 50–55% |
| Documented self-employed | 40–50% |
| Mixed | 35–45% |
| Informal / variable | 30–40% |

Formula:

```text
new lender EMI headroom = lender-recognized income × FOIR − current repayments
```

The engine reconciles the core repayment answer against itemized debt EMIs and uses the larger total. Product tenure, loan-to-value, purchase price, down payment, and collateral then cap principal. The displayed binding constraint is one of cash flow, borrower-safe EMI, lender-recognized income, asset contribution, collateral, tenure, or unresolved debt distress.

### `TENURE-01` Modeled age-at-loan-end guardrail — our judgment

Advertised maximum tenure is capped by age at the modeled end of the loan:

- Home/LAP: age 70.
- Gold: age 75.
- Other products: age 60 for salaried income and 65 for other income types.

If fewer than six modeled repayment months remain, the product has no modeled tenure and the result is `DON'T BORROW`. These are conservative V1 modeling boundaries—not universal lender eligibility rules. Actual lender retirement-age, succession, pension, co-applicant, and product policies differ.

## Borrower-safe view

### `SAFE-01` Safe debt-service ratio — our judgment

| Income profile | Base safe total debt-service ratio |
|---|---:|
| Stable salaried | 35% |
| Self-employed | 30% |
| Informal / gig | 25% |
| Mixed | 27%, intentionally weighted toward the less stable source |

Emergency-savings adjustment:

- 0 months: −5 percentage points.
- More than 0 but less than 3 months: −2.5 points.
- 3+ months: no reduction.
- Unknown: use an interval from base minus 5 points to the base ratio and lower confidence.

### `SAFE-02` Cash-flow reserve — our judgment

```text
safe new EMI = max(
  0,
  min(
    adjusted safe ratio × conservative income − existing EMI,
    conservative income − essentials − existing EMI − 10% reserve − upcoming monthly outflow
  )
)
```

An upcoming unavoidable amount is divided by the months until due. Safe principal uses the high edge of the fair rate and the prudent borrower tenure. **“You should use” is always the conservative edge, capped at the amount actually requested.**

## Hard stop

### `STOP-01` Recent unresolved delinquency with stacked high-cost debt — our judgment

The distress hard stop requires all of the following:

- a payment issue within the last 12 months was disclosed;
- an unpaid amount from the last 3 months remains unresolved; and
- two or more high-cost debts are active.

V1 marks debt at 24%+ as high cost. A revolving card balance with 75%+ utilization counts as one high-cost exposure. Independently, zero safe EMI or essentials plus current debt consuming conservative income is enough to stop.

“Don't borrow yet” always supplies a next action: cure the live payment issue, reduce high-cost debt, preserve essential cash flow, and then reassess.

## Product routing

### `ROUTE-01` Match purpose and security before pricing — market data plus our judgment

Routing uses the structured “money will be used for” selections and confirmed adaptive answers. The free-text purpose note is explanation only: keywords in it never activate a module or select a product. For a mixed business need, the business split is asked first; a positive vehicle component then reveals vehicle class, use, condition, price, and contribution.

- Wedding/general consumption → personal loan.
- Home purchase → home loan, capped by purchase price, down payment, and reference LTV.
- Business stock/equipment with a willing, unencumbered property → secured stock finance / LAP.
- Business stock without usable collateral → unsecured business loan.
- Eligible gold security → gold loan.
- Two-wheeler, including a personally owned scooter used for gig income → retail two-wheeler finance.
- Personal car → car finance.
- Three-wheeler/LCV for business → commercial-vehicle finance, secured by that vehicle.

For a split business request, each component retains its product, rate, and tenure, but a weighted payment factor applies **one shared EMI ceiling**. Capacities are never added as though the facilities were independent.

Ravi's V1 route therefore uses commercial-vehicle finance for the vehicle and secured stock finance/LAP only for inventory. This avoids pledging the shop for the vehicle portion when the vehicle can secure itself.

## Pricing configuration

### `PRICE-01` Fair nominal-rate ranges — market data

Ranges overlap deliberately. A known score/profile can narrow a band. An unknown score or no formal history uses the complete product envelope; it does not apply an invented risk surcharge.

| Product | Strong | Standard | Elevated / uncertain |
|---|---:|---:|---:|
| Personal | 10–12.5% | 11.5–16.5% | 15–22% |
| LAP | 9.15–10.5% | 10–12.25% | 11–13.5% |
| Two-wheeler | 10.5–16% | 15–21% | 20–25% |
| Unsecured business | 13–16% | 15–19.25% | 18–22.99% |
| New commercial vehicle | 7.25–10% | 9–12.6% | 11–18% |
| Used commercial vehicle | 8.4–11% | 10–15% | 13–22% |
| Home, lightweight V1 support | 7.25–11.9% full envelope | — | — |
| Gold, lightweight V1 support | 9.15–17% full envelope | — | — |
| Personal car | 8.7–9.35% | 9.15–11.7% | 8.7–15.6% full new/used envelope |

Reference LTV caps used in V1: home 80%, LAP 60%, gold 75%, new vehicle 90%, used commercial vehicle 80%. These are model caps, not promises of lender eligibility.

### Primary rate sources

- Personal: [ICICI](https://www.icici.bank.in/personal-banking/loans/personal-loan/personal-loan-interest-rates), [Axis](https://www.axis.bank.in/loans/personal-loan/interest-rates-charges).
- LAP: [Axis](https://www.axis.bank.in/loans/loan-against-property/interest-rate-on-loans), [ICICI](https://www.icici.bank.in/personal-banking/loans/home-loan/loan-against-property/interest-rates).
- Two-wheeler: [Axis](https://www.axis.bank.in/loans/two-wheeler-loans/interest-rates).
- Business: [ICICI](https://www.icici.bank.in/personal-banking/loans/personal-loan/business-instalment-loan/interest-rate), [IndusInd](https://www.indusind.com/in/en/business/loans/unsecured-business-loans.html).
- Commercial vehicle: [Axis quarterly disclosure](https://www.axis.bank.in/docs/default-source/default-document-library/commercial_vehicle_construction_equipment_new.pdf?sfvrsn=5d1c920c_5), with [IIFL's wider market overview](https://www.iifl.com/blogs/other/commercial-vehicle-loan-india) preserved at the uncertain edge.
- Home: [SBI](https://sbi.bank.in/web/interest-rates/interest-rates/loan-schemes-interest-rates/home-loans-interest-rates-current), [Axis](https://www.axis.bank.in/loans/home-loan/interest-rates-charges).
- Gold: [SBI](https://sbi.bank.in/web/personal-banking/loans/gold-loan/personal-gold-loans).
- Car: [SBI](https://sbi.bank.in/web/interest-rates/interest-rates/loan-schemes-interest-rates/auto-loans), [Axis](https://www.axis.bank.in/loans/car-loan/interest-rates-charges).

## APR

### `APR-01` IRR over actual cash flows — RBI regulation plus calculation

[RBI's KFS circular](https://rbi.org.in/Scripts/NotificationUser.aspx?Id=12663&Mode=0) defines APR as the annual cost of credit including interest and other charges. V1 computes monthly IRR from:

- time 0: sanctioned principal minus mandatory upfront lender charges and routed third-party charges;
- later periods: EMIs plus recurring mandatory charges.

For split facilities, V1 builds one combined cash-flow series: each component contributes its own fee, rate, EMI, and actual prudent term. It does not calculate APR from a blended rate over an invented common tenure.

GST is shown separately when applicable because the exact taxable charge is unknown during assessment. The unit test reproduces RBI's worked example—₹20,000 sanctioned, ₹400 upfront, ₹970 × 24 payments—at approximately **17.07% APR**.

## Stress

### `STRESS-01` Exactly one primary shock — our judgment

- Fixed-rate loan: reliable income falls 20% for three months.
- Informal/variable income: the already conservative low month falls another 20%.
- Floating home/LAP: nominal rate increases by 2 percentage points with the EMI ceiling unchanged.

Output shows normal and stressed residual cash, total debt ratio, and `pass`, `tight`, or `fail`. The shock sizes are explicitly judgment, not regulation.

## RBI scope precision

### `RBI-MFI-01` Low-income household ceiling — regulation, informational here

[RBI's microfinance FAQ](https://www.rbi.org.in/Scripts/FAQDisplay.aspx?Id=147) limits a household's monthly loan-repayment outflow to 50% of monthly household income for loans to qualifying low-income households with annual household income up to ₹3 lakh. It is **not a universal FOIR rule**. None of the three supplied profiles is treated as clearly within that threshold, so V1 displays it only as regulatory context and never as a binding constraint in their walkthroughs.

The same FAQ says expected income from the asset/activity financed is excluded from microfinance household-income assessment. Borrower Copilot's decision to exclude expected future asset income from **all** base affordability is therefore labeled **our borrower-safety judgment, consistent with RBI's microfinance treatment**, not a universal RBI mandate.

## Question-to-output contracts

The ten core questions can always produce the four required outputs, although missing evidence may create a wide range. Adaptive ordering is `hard stop → routing → largest range reduction → lowest burden`.

| Adaptive module | Why it earns a place | Output moved/tested |
|---|---|---|
| Employment continuity | Contract/probation changes recognition | recognized income, lender amount, stress choice |
| Business vintage | Newer evidence receives a lower continuity edge | recognized income range |
| Turnover vs net take-home | Prevents sales from becoming repayment income | lender amount; turnover itself remains excluded |
| Variable share + lowest month | Identifies the conservative base | lender recognition, safe amount, stress |
| ITR + bank-visible income | Replaces a wide self-reported envelope with evidence | lender income and confidence |
| Informal continuity/frequency | Annualizes seasonal or low-frequency work | conservative income and safe EMI |
| Household earners/dependants | Tests household context without silently adding income | regulatory/context checks; never capacity unless co-applicant rules pass |
| Co-applicant | Adds only documented, willing net contribution | lender and safe amount |
| Emergency savings | Applies explicit 0/2.5/5-point adjustment | safe ratio and amount |
| Upcoming expense | Reserves cash before the due date | safe EMI and verdict |
| Debt schedule | Reconciles EMI, captures debt type, and finds near payoff/high cost | both capacities, follow-up routing, hard stop, next action |
| Card or BNPL behavior | First confirms current use; hidden for no-history borrowers unless a card/BNPL debt is explicitly declared | distress hard stop and cleanup action |
| Delinquency detail | Distinguishes resolved from recent live arrears | hard stop and verdict |
| Collateral | Tests security, consent, availability and value | product route and LTV cap |
| Vehicle | Revealed only by a structured vehicle use, vehicle product, or positive business-split vehicle amount; class/use/condition/price/contribution pick product and cap | route, rate band, amount |
| Home purchase | Price and contribution cap finance | lender amount |
| Business split | Prevents vehicle and stock from sharing the wrong product | component routes and blended EMI |
| Income uplift | Preserves productive upside outside the base | evidence-adjusted upside range only |

Tests in `src/domain/adaptive-contracts.test.ts` exercise one counterfactual per module. The registry also requires every atomic field to declare its exact output dependencies.

Question visibility has separate regression tests: narrative keywords cannot trigger vehicle routing, a business request with no vehicle component does not ask vehicle details, adding a vehicle component reveals them, and “no formal credit history” does not trigger card questions without a contradictory declared card/BNPL facility.

## Unknown behavior and confidence

- Unknown income evidence: widen recognized income rather than insert a zero fact.
- Unknown savings: use the full adjusted safe-ratio interval.
- Unknown/no-history credit: use the full product price envelope.
- Missing debt detail: retain the declared total and list the evidence gap.
- Missing vehicle/property values: do not invent an asset cap.
- One to three evidence gaps → medium confidence; four or more → low; none → high.

Confidence describes the precision of this assessment, not the borrower's character or creditworthiness.

## Known limitations

- No lender-specific eligibility policy, bureau pull, bank-statement parsing, tax validation, property valuation, or sanction probability.
- No guarantee that a lender will recognize the modeled income or offer the reference rate.
- Fees are indicative percentages; the KFS is the authoritative offer-level source.
- Home, gold, car, and generic business routes are intentionally lightweight. Deep adaptations focus on the three supplied borrowers.
- A single confidence label summarizes V1; a production version should show separate confidence for amount, price, and route.
- Results exist only in React memory. Refreshing or closing the page clears them.
- The stress test is one interpretable shock, not a simulation of unemployment, health events, collateral loss, or simultaneous shocks.

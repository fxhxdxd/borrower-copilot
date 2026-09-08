# Five-minute product walkthrough

## Before starting

Run the application with:

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal. No login, backend, database, bureau connection, or API key is required. The three borrower presets contain only facts supplied in the challenge brief; any additional walkthrough inputs are identified in the interface as assumptions.

## 0:00–0:40 — Understand the decision being made

On the landing page, review the four questions Borrower Copilot answers:

1. Should this borrower take the loan now?
2. How much might a lender offer?
3. How much should the borrower actually use?
4. What rate, EMI, and stress result should the borrower take into a branch?

Verify that lender capacity and borrower-safe capacity are presented as separate concepts. Approval size is never treated as the borrowing target, and the product is described as deterministic decision support rather than a sanction or rate guarantee.

## 0:40–1:40 — Complete Priya's assessment

Select **Priya** and review the prefilled core answers. Continue through the questionnaire and verify:

- Purpose is selected through structured options; free text only adds context and cannot secretly control routing.
- Income can be entered as an exact value or an honest range.
- Reporting zero current debt requires explicit confirmation.
- Credit status accepts an exact score, an approximate band, no formal history, or unknown.
- The core questions are sufficient to produce a result, while optional follow-ups tighten its ranges.
- Skipping a follow-up does not turn an unknown into zero. It widens the result and lowers confidence where relevant.

On the adaptive step, only follow-ups relevant to Priya's answers should appear. Vehicle, business, collateral, and delinquency-detail questions should remain hidden unless a prior answer makes them relevant.

## 1:40–2:25 — Verify Priya's result and card

Complete the assessment and compare the result with these expected outputs:

| Output | Expected result |
|---|---:|
| Verdict | Borrow |
| A lender may offer | ₹18.22L–₹21.89L |
| Borrower-safe capacity | ₹9.21L |
| Amount to use | ₹8L requested amount |
| Safe new EMI | ₹24,500/month |
| Primary stress result | Tight under a 20% three-month income fall |

Expand the calculation details. Each important number should include a plain-language calculation sentence and rule IDs, including the safe-EMI explanation based on income, current EMI, and borrower-safety limits.

Open the Negotiation Card and verify that it fits on one practical branch-facing screen. Its hierarchy should make the verdict, lender-versus-safe amount, EMI and tenure, fair rate/APR, and product route visible before supporting detail. It should also include three lender questions covering the KFS/APR, mandatory charges, and fixed/floating or prepayment terms.

## 2:25–3:30 — Verify Ravi's split-purpose routing

Return to the landing page and select **Ravi**.

Before the adaptive questions appear, verify that his structured purpose selection already identifies both **stock / working capital** and **vehicle** needs. The app must not infer a vehicle from Ravi's name, preset identity, or free-text keywords.

On the adaptive step, verify:

- ITR or bank-visible income is kept separate from turnover and self-reported cash flow.
- Ravi's wife's income is household context until her willingness, documentation, and obligations make it eligible as co-applicant income.
- The ₹15L request is split into ₹5L for the vehicle and ₹10L for stock.
- The vehicle class, use, and new/used condition select the appropriate product and market-rate band.
- Vehicle price and borrower contribution are optional context; they do not change Ravi's income-based safe EMI ceiling.
- Credit-card questions do not appear merely because Ravi has no credit score. With no formal credit history and confirmed zero current debt, the card/BNPL module stays hidden.

Complete the assessment and verify the result:

| Output | Expected result |
|---|---:|
| Verdict | Borrow less |
| A lender may offer | ₹8.18L–₹29.72L |
| Borrower-safe capacity | ₹5.90L–₹11.81L |
| Amount to use | ₹5.90L conservative edge |
| Shared safe new EMI | ₹11,000–₹22,000/month |
| Primary stress result | Fail |

The product recommendation should finance the ₹5L delivery-vehicle portion through commercial-vehicle finance and consider LAP or secured business funding for the ₹10L stock portion. Both facilities must consume the same total EMI ceiling; their separate capacities must never be added as if the debts were independent. The explanation should also state that using the vehicle as security may avoid pledging the shop for that portion.

## 3:30–4:15 — Verify Anita's hard stop

Return to the landing page, select **Anita**, and complete the assessment.

Verify that the income-generating scooter routes to retail two-wheeler finance while her income remains on the informal/gig assessment path. Expected future earnings from the scooter may appear only as an upside scenario; they must not increase base lender or safe affordability.

Compare the result with these expected outputs:

| Output | Expected result |
|---|---:|
| Verdict | Don't borrow yet |
| A lender may offer | ₹0–₹1.41L |
| Borrower-safe capacity | ₹0 |
| Amount to use | ₹0 |
| Primary stress result | Fail |

The hard stop should be explained by current cash flow and repayment distress: essential expenses plus existing repayments consume conservative income, while an unresolved recent bounce coexists with multiple high-cost active debts. The result must include concrete next steps to cure the overdue payment and reduce app-loan pressure rather than offering only a warning.

## 4:15–5:00 — Inspect explainability and implementation boundaries

Review the following implementation files:

- `src/domain/marketData.ts` contains versioned local market-rate data and source metadata.
- `src/domain/rules.ts` contains lending and borrower-safety policy constants.
- `src/domain/engine.ts` performs the assessment without React dependencies.
- The rule and question registries connect inputs to outputs, explanations, unknown behavior, and source or judgment labels.

Run:

```bash
npm test
npm run build
```

The focused suite covers financial math, interval behavior, routing, hard stops, stress, confidence, monotonicity, adaptive-field contracts, the three golden borrower outcomes, and React smoke paths. A safe-ratio, stress, hard-stop, or rate-band change belongs in the pure domain layer and its tests rather than in presentation components.

Finish by reviewing the limitations shown in the product and documentation. Borrower Copilot does not predict lender approval, pull a bureau report, parse financial documents, or guarantee a live rate. A lender's current Key Facts Statement remains authoritative.

## What I would build next

The next product bet is **Offer Check**: a borrower returns with a lender's Key Facts Statement and checks the real offer against the plan created here.

The first version would support a short manual entry path before attempting OCR. It would capture the sanctioned amount, amount actually disbursed, EMI, tenure, nominal rate, mandatory charges, insurance, and fixed/floating terms. Borrower Copilot would then:

1. Recalculate APR from the offer's actual cash flows using the existing IRR engine.
2. Compare the quoted EMI with the borrower's safe total EMI ceiling and stress result.
3. Compare the quoted nominal rate and APR with the relevant dated market band.
4. Flag financed fees, an amount above the safe-use limit, or terms that contradict the KFS.
5. Regenerate the Negotiation Card with a clear accept, negotiate, or walk-away action.

This closes the largest remaining gap in the borrower's journey: V1 prepares someone before the branch, while Offer Check helps them evaluate what the lender actually puts on the table. It also reuses the strongest existing components instead of adding unrelated product breadth.

After validating that flow with borrowers and branch staff, the next investments would be:

- Evidence-assisted input from bank statements and ITRs, always requiring borrower confirmation before a derived value changes the result.
- Per-output confidence plus one “answer this next” prompt showing which missing fact would most reduce uncertainty.
- Versioned lender-rate feeds with source-expiry warnings rather than silently stale market data.
- Kannada and Hindi copy tested with borrowers, not merely translated word for word.

I would not add lender matching, approval probabilities, or generative recommendations until there is evidence that the underlying lender data is reliable enough to support them.

## What I would cut

V1 deliberately cuts features that add operational scope without improving the three required lending decisions:

- Accounts, saved applications, sharing, backend storage, and production AI.
- Bureau pulls and OCR/import of statements, ITRs, or KFS documents.
- Lender-specific approval predictions and “best lender” rankings without dependable lender data.
- A standalone offer-entry flow before the underlying affordability and APR engines were proven.
- Deep adaptive journeys beyond Priya, Ravi, and Anita. Home, gold, and personal-car support remains lightweight because the brief requests real reference bands and basic routing.
- Multiple simultaneous stress scenarios. V1 uses one explicit, product-relevant shock that a borrower can understand.
- Broad Playwright and cross-browser automation. Domain tests protect the financial decisions; focused component tests and manual mobile QA protect the shipped path.

If the time box were reduced further, I would cut marketing-page depth and non-persona product UI before removing any decision rule. I would not cut the lender-versus-safe split, hard stops, unknown-as-unknown behavior, calculation explanations, the Negotiation Card, or tests around the three borrower outcomes. Those are the product, not polish.

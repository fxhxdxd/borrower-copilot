# Five-minute walkthrough

## 0:00–0:40 — Frame the product

Open the landing page.

“Borrower Copilot answers four questions before a borrower enters a branch: should I borrow, how much might a lender offer versus how much should I use, what rate/APR is fair, and what EMI survives one clear stress. This is deterministic decision support; it is not a sanction.”

Point to the sample amount bars. The product never collapses approval and safety into one number.

## 0:40–1:40 — Show the questionnaire architecture

Choose **Priya**.

“The ten core questions always produce an answer. Question one uses visible purpose selections for routing, while the short note is explanation only. Exact values and honest ranges are both first-class. Zero debt requires an explicit confirmation. Credit accepts an exact score, band, no history, or unknown.”

Move to “Sharpen the answer.”

“Only relevant follow-ups appear. They are ordered by hard-stop detection, routing, range reduction, then burden. Skipping is allowed: silence widens ranges and reduces confidence instead of becoming zero.”

Mention that each adaptive field declares its downstream outputs and each of the 18 modules has a counterfactual test.

## 1:40–2:35 — Priya: approval is not a target

Open Priya's result.

- Verdict: Borrow.
- Lender range: ₹18.22L–₹21.89L.
- Safe capacity: ₹9.21L; “use” remains her ₹8L request.
- Safe new EMI: ₹24,500.
- Stress: tight under a 20% three-month income fall.

Open “See the calculation.” Read the one-sentence trace and rule ID. Then open the Negotiation Card and show its five headline blocks, three lender questions, and personalized quote sentence.

## 2:35–3:45 — Ravi: route components, share the ceiling

Return home and choose **Ravi**. Continue to the adaptive step.

Show:

- “Stock / working capital” and “Vehicle” are visibly selected before follow-ups; no free-text keyword or preset identity controls routing.
- ITR income and net profit are distinct from turnover.
- His wife's ₹18,000 is household context, not repayment income until a documented and willing co-applicant is confirmed.
- The ₹15L need is split into ₹5L vehicle and ₹10L stock.
- New versus used commercial vehicle selects a different sourced rate envelope. Price and contribution remain optional and never change borrower affordability.
- The card/BNPL module is absent because Ravi reports no formal credit history and confirms zero current debt.

Open the result.

“The vehicle routes to commercial-vehicle finance and secures itself. The shop is considered only for stock finance/LAP. Both facilities consume one ₹11,000 conservative EMI ceiling; capacities are not added. The full request fails the floating-rate shock, so the verdict is Borrow less.”

## 3:45–4:30 — Anita: productive purpose does not override distress

Choose **Anita** and reach the result.

“The scooter is correctly routed to retail two-wheeler finance even though it supports gig work. But a productive purpose does not erase cash flow: essentials plus existing app-loan EMIs consume conservative income, and an unresolved bounce coexists with three high-cost debts. The result is Don't borrow yet, with concrete debt-cure steps.”

Point to the separate upside panel. Future income is visible but excluded from both base capacities.

## 4:30–5:00 — Rule change and limitations

Open `src/domain/marketData.ts`, `src/domain/rules.ts`, and `src/domain/engine.ts`.

“Policy constants, sources, question contracts, and math are outside React. A live change to a safe ratio, stress shock, rate band, or hard-stop threshold changes one pure layer and its tests—not presentation code.”

Close with limitations: no lender-specific approval model, bureau pull, statement parsing, or rate guarantee; the KFS remains authoritative.

## Deliberately deferred from V1

- Standalone lender-offer entry and KFS comparison.
- OCR/import of statements, ITRs, bureau reports, or KFS documents.
- Saved accounts, history, sharing, backend, database, or production AI.
- Lender-specific eligibility/sanction probability.
- Deep adaptive paths for home, gold, car, and borrowers beyond the three supplied cases.
- Separate confidence labels for amount, price, route, and verdict.
- Multi-shock scenario simulation and localized-language copy.
- Broad cross-browser/Playwright automation; V1 uses domain tests, three React smoke tests, and manual 360px/desktop QA.

## Next-build priorities

1. Per-output confidence and a concise “which answer would tighten this most?” prompt.
2. Offer-level KFS parser/comparator built on the existing IRR cash-flow engine.
3. Bank-statement and ITR evidence extraction with borrower confirmation before calculations change.
4. Lender-specific rate/version feeds and automated stale-source warnings.
5. Kannada and Hindi copy reviewed with borrowers and branch staff.

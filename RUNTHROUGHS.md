# Borrower run-throughs

Generated from the tested fixtures in `src/domain/presets.ts` on 7 September 2026. Facts from the challenge brief and extra walkthrough assumptions are kept separate. Rupee values are rounded for display; tests use unrounded calculations.

## Priya, 29 — Bengaluru, salaried

### Brief facts loaded

- Purpose: wedding.
- Request: ₹8,00,000 personal loan.
- Age: 29.
- Net income: ₹1,10,000/month.
- Existing car EMI: ₹14,000/month, 24 months left.
- Rent: ₹28,000/month.
- Credit score: 780.
- Employment: software engineer at a large MNC for five years.

### Walkthrough-only assumptions

- Other essential expenses: ₹17,000/month, making total essentials ₹45,000 including rent.
- No late, bounced, or overdue payment in the last 12 months.
- Permanent employment, no variable-pay share.
- Six months of essential expenses saved.
- No dependant or co-applicant income is used.

### Questions shown

The ten core questions are prefilled, including the visible “Personal expense” use selection. Relevant adaptive modules are employment continuity, variable-income/low-month check, household context, co-applicant, emergency savings, upcoming committed expense, active debt schedule, and a card/BNPL gate. Blank optional answers stay unknown.

### Tested output

| Output | Result |
|---|---:|
| Verdict | **BORROW** |
| Lender may offer | ₹18,22,000–₹21,89,000 |
| Safe capacity | ₹9,21,000 |
| You should use | **₹8,00,000** — capped at the actual request |
| Safe new EMI | ₹24,500/month |
| Requested EMI at prudent edge | ₹21,264/month |
| Recommended tenure | 48 months |
| Fair nominal rate | 10–12.5% |
| Indicative APR | 10.26–13.59% |
| Stress | **Tight** — income falls 20% for three months |
| Stressed residual cash | ₹7,736/month |
| Stressed total debt ratio | 40.1% |
| Confidence | High |

Calculation sentence: `₹24,500 = 35% × ₹1,10,000 − ₹14,000`, and this is tighter than the separate cash-reserve check.

### Negotiation Card message

> You can carry the ₹8L request, but a lender may offer much more. Do not let approval size become your borrowing target.

The card asks for the KFS/APR, all mandatory charges with GST separately, and fixed/floating plus prepayment terms. The quoted-rate sentence uses Priya's 10–12.5% fair band.

## Ravi, 42 — Mysuru, self-employed

### Brief facts loaded

- Purpose: second stock line and delivery vehicle.
- Request: ₹15,00,000.
- Kirana store operating for 14 years.
- Cash income: ₹40,000–₹80,000/month.
- ITR income: ₹4,20,000/year.
- Shop premises: approximately ₹45,00,000, owned and unencumbered.
- No formal loan history / no score.
- Wife earns ₹18,000/month teaching; this remains household context and is not added as co-applicant income.

### Walkthrough-only assumptions

- Essential household expenses: ₹25,000/month.
- No recent payment issue and no current debt repayment.
- Two months of emergency savings.
- Illustrative need split: ₹10,00,000 stock and ₹5,00,000 new commercial vehicle.
- Illustrative new vehicle invoice: ₹6,00,000 with ₹1,00,000 down payment.
- Ravi is willing to pledge the shop only for the stock portion.
- Expected ₹15,000 monthly business uplift has weak evidence and is upside only.

### Questions shown

The first step visibly marks both “Stock / working capital” and “Vehicle”; the narrative text is not used for routing. In addition to the core set, Ravi sees the business split first, followed by vehicle details and collateral, then business vintage, turnover versus net profit, documented income, co-applicant, savings, household context, and upside evidence. Because “No formal credit history” and zero current debt are confirmed, no credit-card/BNPL module appears.

### Tested output

| Output | Result |
|---|---:|
| Verdict | **BORROW LESS** |
| Lender may offer | ₹8,18,000–₹29,72,000 |
| Safe capacity | ₹5,90,000–₹11,81,000 |
| You should use | **₹5,90,000** conservative edge |
| Shared safe new EMI | ₹11,000–₹22,000/month |
| Requested split EMI | ₹27,924/month |
| Recommended component tenures | 60 months vehicle · 120 months stock/LAP |
| Blended fair nominal rate | 8.52–15% |
| Indicative APR | 8.93–15.16% |
| Stress | **Fail** — floating LAP rate rises by 2 percentage points |
| Normal residual at full request | −₹12,924/month |
| Stressed residual | −₹14,138/month |
| Stressed total debt ratio | 72.8% |
| Confidence | High for these entered assumptions |

The lender range is intentionally wide because no credit history prevents narrowing and the property supports a much larger theoretical ceiling. It is not the recommended amount.

### Component routes

1. **₹5,00,000 commercial-vehicle finance.** The new delivery vehicle secures itself.
2. **₹10,00,000 secured stock finance / LAP.** The shop is considered only for the stock portion, and the amount must still fit documented cash flow.

The engine computes one weighted payment factor against one shared ₹11,000 conservative EMI ceiling while retaining five years for the vehicle and ten years for stock/LAP. It does not add a vehicle-loan capacity to a separate LAP capacity. Its APR likewise uses each component's actual cash flows rather than an invented blended tenure.

### Negotiation Card message

> Split the need. Finance the delivery vehicle against the vehicle; use secured business funding only for the stock amount your documented cash flow can support.

The expected uplift appears separately as an evidence-adjusted ₹0–₹7,500/month upside range. It does not increase either base amount.

## Anita, 35 — Hubballi, informal/gig

### Brief facts loaded

- Purpose: electric scooter to increase delivery runs.
- Request: ₹1,50,000.
- Delivery-platform rider plus home tailoring.
- Income: ₹26,000–₹30,000/month.
- Two children; husband unemployed for eight months.
- Three app loans, ₹35,000 total outstanding at 30%+.
- One EMI bounced last month.

### Walkthrough-only assumptions

- Current app-loan repayments total ₹6,000/month.
- Essential household expenses: ₹22,000/month.
- No emergency savings.
- Bounced ₹2,500 remains unresolved.
- All three app loans remain active and high-cost.
- New scooter invoice: ₹1,70,000 with ₹20,000 down payment.
- Expected ₹8,000 monthly uplift has weak evidence and is upside only.

### Questions shown

The first step visibly marks “Vehicle,” which earns the vehicle-detail module without parsing her narrative. The hard-stop order brings debt schedule, the card/BNPL gate, and delinquency status ahead of vehicle routing. Informal continuity, low month, household context, savings, co-applicant, and uplift evidence follow.

### Tested output

| Output | Result |
|---|---:|
| Verdict | **DON'T BORROW YET** |
| Lender may offer | ₹0–₹1,41,000 |
| Safe capacity | ₹0 |
| You should use | **₹0 for now** |
| Safe new EMI | ₹0/month |
| Requested scooter EMI | ₹5,964/month |
| Recommended reference tenure | 36 months |
| Fair nominal rate | 10.5–25% full envelope |
| Indicative APR | 11.19–26.91% |
| Stress | **Fail** — conservative low month falls another 20% |
| Normal residual at full request | −₹9,964/month |
| Stressed residual | −₹14,764/month |
| Stressed total debt ratio | 62.3% |
| Confidence | Medium; bank-visible income remains missing |

Hard stop: essentials plus current EMI already exceed conservative income, and a recent unresolved bounce coexists with three active 30%+ debts.

### Negotiation Card message

> The scooter may improve income, but another EMI is unsafe until the bounced payment and app-loan burden are resolved.

Next steps: cure the bounced EMI, obtain closure/current statements for each app loan, direct spare cash to the highest-cost balance, and reassess after repayments fall. The expected uplift remains an evidence-adjusted ₹0–₹4,000/month upside—not base affordability.

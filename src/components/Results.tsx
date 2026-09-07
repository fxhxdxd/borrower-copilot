import { useState } from "react";
import { MARKET_AS_OF } from "../domain/engine";
import { formatCompactRupees, formatPercent, formatRange, formatRupees } from "../domain/format";
import type { AssessmentInput, AssessmentResult } from "../domain/types";

type Props = {
  input: AssessmentInput;
  result: AssessmentResult;
  onEdit: () => void;
  onHome: () => void;
};

const verdictText = {
  BORROW: "Borrow",
  BORROW_LESS: "Borrow less",
  DONT_BORROW: "Don’t borrow yet",
};

function Brand({ onClick }: { onClick: () => void }) {
  return <button type="button" className="brand-button" onClick={onClick}><span className="brand-mark">bc</span><span>Borrower Copilot</span></button>;
}

function Confidence({ level }: { level: AssessmentResult["confidence"] }) {
  return <span className={`confidence-pill ${level}`}><i /> {level[0].toUpperCase() + level.slice(1)} confidence</span>;
}

function AmountComparison({ result }: { result: AssessmentResult }) {
  const scale = Math.max(result.lenderAmount.max, result.safeAmount.max, 1);
  return <div className="amount-comparison">
    <div className="amount-row lender-amount">
      <div><span>A lender may offer</span><strong>{formatRange(result.lenderAmount, true)}</strong></div>
      <div className="amount-bar"><span style={{ width: `${Math.max(4, result.lenderAmount.max / scale * 100)}%` }} /></div>
      <small>Indicative approval envelope</small>
    </div>
    <div className="amount-row safe-amount">
      <div><span>You should use</span><strong>{result.useAmount === 0 ? "₹0 for now" : `Up to ${formatCompactRupees(result.useAmount)}`}</strong></div>
      <div className="amount-bar"><span style={{ width: `${Math.max(result.useAmount ? 4 : 0, result.useAmount / scale * 100)}%` }} /></div>
      <small>Conservative edge of your safe range</small>
    </div>
  </div>;
}

export function NegotiationCard({ input, result }: { input: AssessmentInput; result: AssessmentResult }) {
  return <article className={`negotiation-card verdict-${result.verdict.toLowerCase()}`}>
    <header className="card-header">
      <div><span className="card-brand">BORROWER COPILOT</span><h2>Negotiation Card</h2></div>
      <div className="card-person"><strong>{input.name || "Your plan"}</strong><span>{input.city || "India"} · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></div>
    </header>

    <section className="card-verdict-block">
      <span className="card-kicker">VERDICT</span>
      <h3>{verdictText[result.verdict]}</h3>
      <p>{result.borrowerCopy}</p>
    </section>

    <section className="card-headlines">
      <div className="card-block amount-block"><span>1 · AMOUNT</span><AmountComparison result={result} /></div>
      <div className="card-block"><span>2 · EMI + TENURE</span><strong>{formatRupees(result.safeNewEmi.min)}<small> safe new EMI / month</small></strong><p>{result.recommendedTenureLabel}</p></div>
      <div className="card-block"><span>3 · FAIR PRICE</span><strong>{result.rateBand.min.toFixed(2)}–{result.rateBand.max.toFixed(2)}%<small> nominal</small></strong><p>{result.aprBand.min.toFixed(2)}–{result.aprBand.max.toFixed(2)}% indicative APR</p></div>
      <div className="card-block route-block"><span>4 · PRODUCT ROUTE</span>{result.routes.map((route) => <div key={`${route.product}-${route.amount}`}><strong>{route.label}</strong>{route.amount && <small>{formatCompactRupees(route.amount)}</small>}<p>{route.rationale}</p></div>)}</div>
    </section>

    <section className="card-support-grid">
      <div>
        <span className="card-kicker">WHY THIS ANSWER</span>
        <ol className="reason-list">{result.reasons.map((reason) => <li key={reason.ruleId}><span>{reason.ruleId}</span><p>{reason.calculation}</p></li>)}</ol>
      </div>
      <div className="stress-card">
        <div><span className="card-kicker">ONE STRESS CHECK · OUR JUDGMENT</span><strong className={result.stress.status}>{result.stress.status}</strong></div>
        <p>{result.stress.label}</p>
        <dl><div><dt>Residual now</dt><dd>{formatRupees(result.stress.normalResidual)}</dd></div><div><dt>Under stress</dt><dd>{formatRupees(result.stress.stressedResidual)}</dd></div><div><dt>Debt ratio</dt><dd>{formatPercent(result.stress.stressedDebtRatio)}</dd></div></dl>
      </div>
    </section>

    <section className="lender-questions">
      <span className="card-kicker">ASK EVERY LENDER</span>
      <div><span>01</span><p>“Please give me the KFS and show the APR, not only the headline rate.”</p></div>
      <div><span>02</span><p>“List every mandatory lender and third-party charge, including GST separately.”</p></div>
      <div><span>03</span><p>“Is the rate fixed or floating, and what are the prepayment terms?”</p></div>
    </section>

    <blockquote>{result.negotiationLine}</blockquote>
    <footer className="card-footer"><Confidence level={result.confidence} /><span>Market data: {MARKET_AS_OF}</span><span>Decision support, not a loan offer</span></footer>
  </article>;
}

export function Results({ input, result, onEdit, onHome }: Props) {
  const [view, setView] = useState<"answer" | "card">("answer");
  return <main className="results-page">
    <header className="results-header">
      <Brand onClick={onHome} />
      <div className="result-actions"><button className="button ghost" type="button" onClick={onEdit}>Edit answers</button><button className="button secondary" type="button" onClick={() => window.print()}>Print / save card</button></div>
    </header>

    <div className="result-tabs" role="tablist" aria-label="Result views">
      <button type="button" role="tab" aria-selected={view === "answer"} onClick={() => setView("answer")}>Your answer</button>
      <button type="button" role="tab" aria-selected={view === "card"} onClick={() => setView("card")}>Negotiation Card</button>
    </div>

    {view === "answer" ? <div className="answer-view">
      <section className={`verdict-hero ${result.verdict.toLowerCase()}`}>
        <div className="verdict-copy">
          <p className="eyebrow">Your answer</p>
          <h1>{verdictText[result.verdict]}<span>.</span></h1>
          <p>{result.borrowerCopy}</p>
          <div className="next-action"><span>DO THIS NEXT</span><strong>{result.immediateAction}</strong></div>
        </div>
        <div className="verdict-meta"><Confidence level={result.confidence} /><span>Binding constraint</span><strong>{result.bindingConstraint}</strong></div>
      </section>

      <section className="results-grid">
        <article className="result-card comparison-card">
          <div className="result-card-heading"><div><span>01</span><h2>Amount</h2></div><p>Approval and affordability are not the same.</p></div>
          <AmountComparison result={result} />
          <details><summary>Why this range?</summary><p>{result.reasons[0].calculation}</p><code>{result.reasons[0].ruleId}</code></details>
        </article>

        <article className="result-card metric-card">
          <div className="result-card-heading"><div><span>02</span><h2>Monthly limit</h2></div></div>
          <strong className="big-number">{formatRupees(result.safeNewEmi.min)}</strong>
          <p>safe new EMI each month</p>
          <div className="inline-metrics"><div><span>REQUESTED EMI</span><strong>{formatRupees(result.requestedEmi)}</strong></div><div><span>TENURE</span><strong>{result.recommendedTenureLabel}</strong></div></div>
          <details><summary>See the calculation</summary><p>{result.reasons[1].calculation}</p><code>{result.reasons[1].ruleId}</code></details>
        </article>

        <article className="result-card metric-card">
          <div className="result-card-heading"><div><span>03</span><h2>Fair price</h2></div></div>
          <strong className="big-number">{result.rateBand.min.toFixed(2)}–{result.rateBand.max.toFixed(2)}%</strong>
          <p>fair nominal rate</p>
          <div className="inline-metrics"><div><span>INDICATIVE APR</span><strong>{result.aprBand.min.toFixed(2)}–{result.aprBand.max.toFixed(2)}%</strong></div><div><span>DATA AS OF</span><strong>Sep 2026</strong></div></div>
          <details><summary>What APR includes</summary><p>APR is calculated from actual cash flows after indicative mandatory upfront fees. GST is separate because the exact charge is unknown.</p><code>APR-01</code></details>
        </article>

        <article className="result-card route-card">
          <div className="result-card-heading"><div><span>04</span><h2>Product route</h2></div><p>{result.routes.length > 1 ? "One shared EMI ceiling across both facilities." : "Matched to use and security."}</p></div>
          <div className="route-list">{result.routes.map((route, index) => <div key={`${route.product}-${route.amount}`}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{route.label}</h3><p>{route.rationale}</p></div>{route.amount && <strong>{formatCompactRupees(route.amount)}</strong>}</div>)}</div>
          {result.productMismatch && <div className="mismatch-note"><strong>Product mismatch</strong><p>{result.productMismatch}</p></div>}
        </article>

        <article className="result-card stress-result-card">
          <div className="result-card-heading"><div><span>05</span><h2>One stress check</h2></div><strong className={`status ${result.stress.status}`}>{result.stress.status}</strong></div>
          <p className="stress-label">{result.stress.label}</p>
          <div className="stress-columns"><div><span>NORMAL</span><strong>{formatRupees(result.stress.normalResidual)}</strong><p>cash after essentials + debt</p></div><div><span>STRESSED</span><strong>{formatRupees(result.stress.stressedResidual)}</strong><p>{formatPercent(result.stress.stressedDebtRatio)} total debt ratio</p></div></div>
          <small>Shock magnitude is our borrower-safety judgment, not a regulatory rule.</small>
        </article>

        {result.upsideScenario && <article className="result-card upside-card"><span className="eyebrow">Upside only</span><h2>{formatRange(result.upsideScenario.plausibleRange)}/month</h2><p>{result.upsideScenario.note} Applicant estimate: {formatRupees(result.upsideScenario.monthlyIncomeUplift)}.</p></article>}
      </section>

      {result.missingEvidence.length > 0 && <section className="confidence-section"><div><p className="eyebrow">Make this answer tighter</p><h2>{result.missingEvidence.length} evidence gap{result.missingEvidence.length > 1 ? "s" : ""} widened your result.</h2></div><ul>{result.missingEvidence.map((item) => <li key={item}>{item}</li>)}</ul></section>}

      <section className="card-cta"><div><p className="eyebrow">Take it to the branch</p><h2>Your one-screen Negotiation Card is ready.</h2><p>Five headline blocks, three questions, and one sentence to use when the quote is too high.</p></div><button className="button light large" onClick={() => { setView("card"); window.scrollTo({ top: 0, behavior: "smooth" }); }} type="button">Open my card →</button></section>
    </div> : <div className="card-view"><div className="card-view-heading"><div><p className="eyebrow">Branch-ready summary</p><h1>Keep the conversation on your numbers.</h1></div><button type="button" className="button primary" onClick={() => window.print()}>Print / save PDF</button></div><NegotiationCard input={input} result={result} /></div>}
  </main>;
}

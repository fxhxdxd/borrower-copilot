import type { PersonaPreset } from "../domain/presets";

type Props = {
  personas: PersonaPreset[];
  onStart: () => void;
  onPersona: (persona: PersonaPreset) => void;
};

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

function ShieldIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3 5.5 5.6v5.7c0 4.2 2.7 7.8 6.5 9.7 3.8-1.9 6.5-5.5 6.5-9.7V5.6L12 3Z"/><path d="m9 12 2 2 4-4" /></svg>;
}

export function Landing({ personas, onStart, onPersona }: Props) {
  return (
    <main className="landing-page">
      <header className="site-header">
        <a className="brand" href="#top"><span className="brand-mark">bc</span><span>Borrower Copilot</span></a>
        <nav aria-label="Primary navigation">
          <a href="#how">How it works</a>
          <a href="#examples">Examples</a>
        </nav>
        <button type="button" className="button header-button" onClick={onStart}>Start assessment <ArrowIcon /></button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">A borrower-first loan check</p>
          <h1>Know your number before the lender names theirs.</h1>
          <p className="hero-lede">See what a lender may approve, what your monthly life can safely carry, and the rate worth negotiating for—in one clear answer.</p>
          <div className="hero-actions">
            <button type="button" className="button primary large" onClick={onStart}>Check my borrowing plan <ArrowIcon /></button>
            <span className="time-note">About 4 minutes · no sign-up</span>
          </div>
          <div className="trust-row"><ShieldIcon /><span>Nothing is uploaded, saved, or shared.</span></div>
        </div>
      </section>

      <section className="principles" id="how">
        <div><span>01</span><h2>Two numbers, not one</h2><p>Lender capacity and borrower-safe capacity answer different questions. We show both.</p></div>
        <div><span>02</span><h2>Ranges stay ranges</h2><p>Uncertain income or credit evidence widens the answer instead of becoming a fake fact.</p></div>
        <div><span>03</span><h2>Every number has a why</h2><p>Open any result to see the income, ratio, debts, product, and rule behind it.</p></div>
      </section>

      <section className="examples-section" id="examples">
        <div className="section-heading">
          <div><p className="eyebrow">Three real shapes of borrowing</p><h2>Try a guided case</h2></div>
          <p>Brief facts stay facts. Any extra walkthrough answer is clearly labeled as an assumption and remains editable.</p>
        </div>
        <div className="persona-grid">
          {personas.map((persona) => <button type="button" className={`persona-card ${persona.id}`} onClick={() => onPersona(persona)} key={persona.id}>
            <div className="persona-top"><span className="avatar">{persona.facts.name?.slice(0, 1)}</span><span className="city">{persona.facts.city}</span></div>
            <h3>{persona.facts.name}</h3>
            <p>{persona.summary}</p>
            <ul>{persona.knownFacts.slice(0, 3).map((fact) => <li key={fact}>{fact}</li>)}</ul>
            <span className="card-link">Explore case <ArrowIcon /></span>
          </button>)}
        </div>
      </section>

      <footer className="site-footer">
        <div><span className="brand-mark">bc</span><strong>Borrower Copilot</strong></div>
        <p>Decision support—not a sanction, financial advice, or guarantee. Market data as of September 2026.</p>
      </footer>
    </main>
  );
}

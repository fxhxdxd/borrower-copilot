# Borrower Copilot

A deterministic, borrower-first lending assistant for India. It separates what a lender may offer from what a borrower can safely use, explains every number, and produces a branch-ready Negotiation Card.

## Run locally in under five minutes

Prerequisite: Node.js 20.19+ (Node 22 recommended).

```bash
git clone https://github.com/fxhxdxd/borrower-copilot.git
cd borrower-copilot
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

No environment variables, database, login, API key, bureau account, or network request is needed at runtime. Assessment answers remain only in React memory and disappear on refresh.

## Verify

```bash
npm test
npm run lint
npm run build
```

The test suite covers loan math, RBI's APR example, interval monotonicity, hard stops, routing, all 18 adaptive-module contracts, all three golden borrowers, and three React UI smoke paths.

## Five-minute review path

1. On the landing page, open the guided Priya case.
2. Continue through the prefilled core questions and inspect the adaptive step.
3. Confirm `Borrow`, lender amount versus safe/use amount, one stress test, nominal rate, APR, and calculation IDs.
4. Open the printable Negotiation Card.
5. Repeat with Ravi to see component routing and Anita to see the hard stop.

## Architecture

- React 19, Vite, and TypeScript.
- Vitest and React Testing Library; no Playwright dependency.
- Pure lending functions in [`src/domain`](src/domain).
- UI components in [`src/components`](src/components) contain no policy constants.
- Local market data includes source URLs and an “as of” date.
- No backend, database, authentication, local storage, bureau pull, or production AI.

## Submission documents

- [`RULES.md`](RULES.md) — rules, source scope, judgment labels, unknown behavior, question contracts, and limitations.
- [`RUNTHROUGHS.md`](RUNTHROUGHS.md) — exact inputs, labeled assumptions, outputs, and card summaries for Priya, Ravi, and Anita.
- [`WALKTHROUGH.md`](WALKTHROUGH.md) — five-minute demonstration narrative, deliberate deferrals, and next-build priorities.

## Important

Borrower Copilot is decision support—not a loan sanction, eligibility promise, or substitute for a lender's Key Facts Statement. Market references are dated 7 September 2026; verify the current KFS before acting.

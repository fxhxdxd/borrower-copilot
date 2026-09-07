import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

async function runGuidedCase(name: "Priya" | "Ravi" | "Anita") {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: new RegExp(name) }));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "See my answer" }));
}

describe("guided borrower smoke tests", () => {
  it("takes Priya to a Borrow result and card", async () => {
    await runGuidedCase("Priya");
    expect(screen.getByRole("heading", { name: "Borrow." })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Negotiation Card" }));
    expect(screen.getByRole("heading", { name: "Negotiation Card" })).toBeInTheDocument();
  });

  it("takes Ravi to Borrow less with two routes", async () => {
    await runGuidedCase("Ravi");
    expect(screen.getByRole("heading", { name: "Borrow less." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Commercial-vehicle finance" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Secured stock finance / LAP" })).toBeInTheDocument();
  });

  it("takes Anita to Don't borrow yet", async () => {
    await runGuidedCase("Anita");
    expect(screen.getByRole("heading", { name: "Don’t borrow yet." })).toBeInTheDocument();
    expect(screen.getByText(/another EMI is unsafe/i)).toBeInTheDocument();
  });
});


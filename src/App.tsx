import { useMemo, useState } from "react";
import { AssessmentFlow } from "./components/AssessmentFlow";
import { Landing } from "./components/Landing";
import { Results } from "./components/Results";
import { assessBorrower } from "./domain/engine";
import { PERSONAS, type PersonaPreset } from "./domain/presets";
import type { AssessmentInput } from "./domain/types";

type Screen = "home" | "assessment" | "results";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [input, setInput] = useState<AssessmentInput>();
  const [persona, setPersona] = useState<PersonaPreset>();
  const result = useMemo(() => input ? assessBorrower(input) : undefined, [input]);

  const startBlank = () => {
    setPersona(undefined);
    setInput(undefined);
    setScreen("assessment");
    window.scrollTo(0, 0);
  };

  const startPersona = (selected: PersonaPreset) => {
    setPersona(selected);
    setInput(selected.walkthrough);
    setScreen("assessment");
    window.scrollTo(0, 0);
  };

  if (screen === "assessment") {
    return <AssessmentFlow
      key={`${persona?.id ?? "blank"}-${input?.name ?? "new"}`}
      initialInput={input}
      persona={persona}
      onBack={() => setScreen("home")}
      onComplete={(completed) => { setInput(completed); setScreen("results"); window.scrollTo(0, 0); }}
    />;
  }

  if (screen === "results" && input && result) {
    return <Results input={input} result={result} onEdit={() => setScreen("assessment")} onHome={() => setScreen("home")} />;
  }

  return <Landing personas={PERSONAS} onStart={startBlank} onPersona={startPersona} />;
}

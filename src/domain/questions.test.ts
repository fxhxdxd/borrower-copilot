import { describe, expect, it } from "vitest";
import { ADAPTIVE_MODULES, CORE_QUESTIONS, activeAdaptiveModules } from "./questions";
import { WALKTHROUGH_INPUTS } from "./presets";

describe("question registry contracts", () => {
  it("ships exactly ten core questions and eighteen adaptive modules", () => {
    expect(CORE_QUESTIONS).toHaveLength(10);
    expect(ADAPTIVE_MODULES).toHaveLength(18);
  });

  it("gives every atomic field an explicit output dependency", () => {
    for (const module of ADAPTIVE_MODULES) {
      expect(module.fields.length, module.id).toBeGreaterThan(0);
      for (const field of module.fields) {
        expect(field.outputDependencies.length, field.id).toBeGreaterThan(0);
      }
    }
  });

  it("orders active questions by hard stop, routing, range reduction, then burden", () => {
    const active = activeAdaptiveModules(WALKTHROUGH_INPUTS.anita);
    const priorities = active.map((module) => module.priority);
    const rank = { "hard-stop": 0, routing: 1, range: 2, burden: 3 };
    expect(priorities.map((priority) => rank[priority])).toEqual([...priorities.map((priority) => rank[priority])].sort());
  });

  it("asks Ravi for the business split and vehicle details but not a home purchase", () => {
    const ids = activeAdaptiveModules(WALKTHROUGH_INPUTS.ravi).map((module) => module.id);
    expect(ids).toContain("business-split");
    expect(ids).toContain("vehicle");
    expect(ids).not.toContain("property-purchase");
  });

  it("asks Anita for delinquency detail only because a payment issue is present", () => {
    expect(activeAdaptiveModules(WALKTHROUGH_INPUTS.anita).map((module) => module.id)).toContain("delinquency-detail");
    expect(activeAdaptiveModules(WALKTHROUGH_INPUTS.priya).map((module) => module.id)).not.toContain("delinquency-detail");
  });
});


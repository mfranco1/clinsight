import { describe, expect, it } from "vitest";
import { CLINICAL_TEMPLATES } from "../src/features/input/templates";
import { DIAGNOSIS_RULES } from "../src/services/ai/diagnosisRules";
import { SCHEMA_DESCRIPTIONS } from "../src/services/ai/schemaDescriptions";

describe("content configuration", () => {
  it("keeps clinical templates and AI configuration populated", () => {
    expect(CLINICAL_TEMPLATES.length).toBeGreaterThan(0);
    expect(Object.keys(DIAGNOSIS_RULES).length).toBeGreaterThan(0);
    expect(Object.keys(SCHEMA_DESCRIPTIONS).length).toBeGreaterThan(0);
  });
});

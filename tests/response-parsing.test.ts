import { describe, expect, it } from "vitest";
import { postProcessSoapNote } from "../services/ai/responseParsing";

describe("postProcessSoapNote", () => {
  it("flattens dynamic list sections while preserving the original object identity", () => {
    const soap = {
      subjective: {
        ros: [
          { system: "Respiratory", finding: "Clear" },
          { system: "Cardiac", finding: "Regular" },
        ],
        headsss: [{ category: "Home", finding: "Stable" }],
      },
      objective: {
        physicalExam: [{ system: "Skin", finding: "Warm" }],
      },
    };

    expect(postProcessSoapNote(soap)).toBe(soap);
    expect(soap).toEqual({
      subjective: {
        ros: { Respiratory: "Clear", Cardiac: "Regular" },
        headsss: { Home: "Stable" },
      },
      objective: { physicalExam: { Skin: "Warm" } },
    });
  });

  it("merges other findings using the first available section label and removes that source field", () => {
    const soap = {
      subjective: {
        ros: {
          otherFindings: [
            { category: "", system: "Neurologic", finding: "Alert" },
          ],
        },
      },
      objective: {
        physicalExam: {
          otherFindings: [{ systemOrRegion: "Extremities", finding: "Warm" }],
        },
      },
    };

    postProcessSoapNote(soap);

    expect(soap.subjective.ros).toEqual({ Neurologic: "Alert" });
    expect(soap.objective.physicalExam).toEqual({ Extremities: "Warm" });
  });
});

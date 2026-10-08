import { beforeEach, describe, expect, it, vi } from "vitest";

const { callGemini, convertFilesToParts, blobToBase64 } = vi.hoisted(() => ({
  callGemini: vi.fn(),
  convertFilesToParts: vi.fn(async () => []),
  blobToBase64: vi.fn(async () => "YXVkaW8="),
}));
vi.mock("../src/services/ai/geminiTransport", () => ({
  callGemini,
  convertFilesToParts,
  blobToBase64,
  sanitizeModelOutput: (text: string) => text,
}));

import { parsePrescriptions } from "../src/services/ai/tasks/discharge";
import { refreshPatientSummary } from "../src/services/ai/tasks/summary";
import { generateClinicalSuggestions } from "../src/services/ai/tasks/clinicalAssistance";
import {
  generateInputSuggestions,
  medicalLookup,
} from "../src/services/ai/tasks/inputAssistance";
import {
  analyzeLabPhotos,
  transcribeAudio,
} from "../src/services/ai/tasks/mediaAnalysis";
import { sendChatMessage } from "../src/services/ai/tasks/conversation";
import {
  generateMedicalChart,
  generateProgressNote,
  reassessSoapNote,
} from "../src/services/ai/tasks/chartGeneration";

describe("AI task request and result contracts", () => {
  beforeEach(() => {
    callGemini.mockReset();
    convertFilesToParts.mockClear();
    blobToBase64.mockClear();
  });

  it("preserves prescription parsing result fields and empty-response fallback", async () => {
    const prescriptions = [
      {
        drug: "Medication",
        dose: "1 tablet",
        route: "oral",
        frequency: "daily",
        duration: "7 days",
        sig: "Take daily",
        quantity: "7",
      },
    ];
    callGemini.mockResolvedValueOnce({ text: JSON.stringify(prescriptions) });
    callGemini.mockResolvedValueOnce({ text: "" });

    await expect(parsePrescriptions([])).resolves.toEqual(prescriptions);
    expect(
      callGemini.mock.calls[0][0].responseSchema.items.properties,
    ).toHaveProperty("quantity");
    await expect(parsePrescriptions([])).resolves.toEqual([]);
  });

  it("preserves summary request context and parses the expected handoff record", async () => {
    const summary = {
      patientId: "patient-1",
      oneLiner: "Stable",
      activeIssues: [],
      toDoList: [],
    };
    callGemini.mockResolvedValue({ text: JSON.stringify(summary) });
    const patientInfo = { patientName: "Fixture Patient" } as never;

    await expect(
      refreshPatientSummary(
        summary as never,
        patientInfo,
        [],
        [],
        "model-x",
        "Primary Care",
      ),
    ).resolves.toEqual(summary);
    expect(callGemini).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "model-x",
        responseMimeType: "application/json",
        contents: {
          parts: [{ text: expect.stringContaining("Primary Care") }],
        },
      }),
    );
  });

  it("omits legacy pearls from refresh requests and generated summary schemas", async () => {
    const legacySummary = {
      patientId: "patient-1",
      oneLiner: "Stable",
      activeIssues: [],
      toDoList: [],
      clinicalPearl: "Legacy education",
    };
    callGemini.mockResolvedValue({ text: JSON.stringify(legacySummary) });
    await refreshPatientSummary(
      legacySummary,
      { patientName: "Fixture Patient" } as never,
      [],
      [],
      "model-x",
      "Primary Care",
    );
    const request = callGemini.mock.calls[0][0];
    expect(request.contents.parts[0].text).not.toContain("Legacy education");
    expect(request.responseSchema.properties).not.toHaveProperty(
      "clinicalPearl",
    );
  });

  it("keeps clinical assistance structured and falls back to parsed suggestions", async () => {
    callGemini.mockResolvedValue({ text: '["Clarify onset"]' });
    await expect(
      generateClinicalSuggestions("Subjective", "Pain history"),
    ).resolves.toEqual(["Clarify onset"]);
    expect(callGemini).toHaveBeenCalledWith(
      expect.objectContaining({
        responseMimeType: "application/json",
        responseSchema: expect.objectContaining({ type: "ARRAY" }),
      }),
    );
  });

  it("preserves generated input fields and grounded lookup request options", async () => {
    const suggestions = { questions: [], tests: [] };
    callGemini.mockResolvedValueOnce({ text: JSON.stringify(suggestions) });
    await expect(generateInputSuggestions("Draft")).resolves.toEqual(
      suggestions,
    );
    const signal = new AbortController().signal;
    callGemini.mockResolvedValueOnce({
      text: "Reference answer",
      groundingSources: [],
    });
    await expect(medicalLookup("hypertension", signal)).resolves.toEqual({
      text: "Reference answer",
      groundingSources: [],
    });
    expect(callGemini).toHaveBeenLastCalledWith(
      expect.objectContaining({ useGoogleSearch: true, signal }),
    );
  });

  it("retains media task schema, fallback inputs, and audio transcription contract", async () => {
    const file = new File(["lab"], "lab.png", { type: "image/png" });
    const labResult = { labs: "Hemoglobin 12", labInterpretation: [] };
    callGemini.mockResolvedValueOnce({ text: JSON.stringify(labResult) });
    await expect(
      analyzeLabPhotos([file], "Prior labs", "Prior interpretation"),
    ).resolves.toEqual(labResult);
    expect(convertFilesToParts).toHaveBeenCalledWith([file]);
    expect(callGemini.mock.calls[0][0].responseSchema.required).toEqual([
      "labs",
      "labInterpretation",
    ]);
    callGemini.mockResolvedValueOnce({ text: "Transcribed note" });
    await expect(
      transcribeAudio(new Blob(["audio"], { type: "audio/wav" })),
    ).resolves.toBe("Transcribed note");
    expect(blobToBase64).toHaveBeenCalledOnce();
  });

  it("preserves chat title extraction and response contract", async () => {
    callGemini.mockResolvedValue({
      text: "<note_title>Follow-up</note_title>Clinical answer",
    });
    await expect(
      sendChatMessage("model-x", [], "Question", null),
    ).resolves.toMatchObject({
      text: "Clinical answer",
      title: "Follow-up",
    });
  });

  it("preserves new-chart continuity context, schema, and normalized output", async () => {
    const chart = {
      patientInfo: {
        patientName: "Fixture Patient",
        ageSex: "42-year-old",
        mrn: "MRN-1",
      },
      soap: {
        subjective: { ros: [{ system: "Respiratory", finding: "Clear" }] },
        objective: { physicalExam: [{ system: "Lungs", finding: "Clear" }] },
      },
      course: [],
      handoff: {
        patientId: "patient-1",
        oneLiner: "Stable",
        activeIssues: [],
        toDoList: [],
      },
    };
    callGemini.mockResolvedValue({
      text: JSON.stringify(chart),
      groundingSources: [],
    });

    const result = await generateMedicalChart(
      "New presentation",
      [],
      "model-x",
      "Cardiology",
      true,
      [],
      chart.patientInfo as never,
    );

    expect(result).toMatchObject({
      patientInfo: chart.patientInfo,
      course: [],
      handoff: chart.handoff,
    });
    expect(result.soap.subjective.ros).toEqual({ Respiratory: "Clear" });
    const request = callGemini.mock.calls[0][0];
    expect(request).toMatchObject({
      model: "model-x",
      useGoogleSearch: true,
      responseMimeType: "application/json",
    });
    expect(
      request.contents.parts
        .map((part: { text?: string }) => part.text)
        .join("\n"),
    ).toContain("USER SPECIALIZATION: Cardiology");
    expect(request.responseSchema.required).toEqual([
      "patientInfo",
      "soap",
      "course",
      "handoff",
    ]);
  });

  it("preserves progress-note date context and inferred encounter fields", async () => {
    const progress = {
      soap: { subjective: { ros: [] }, objective: { physicalExam: [] } },
      courseEvent: { event: "Follow-up", details: "Stable" },
      inferredDate: "2026-10-06",
      inferredTime: "09:30",
    };
    callGemini.mockResolvedValue({
      text: JSON.stringify(progress),
      groundingSources: [],
    });

    const result = await generateProgressNote(
      "Follow-up note",
      [],
      "model-y",
      "Primary Care",
      false,
    );
    expect(result).toMatchObject({
      courseEvent: progress.courseEvent,
      inferredDate: progress.inferredDate,
      inferredTime: progress.inferredTime,
    });
    expect(result.soap.subjective.ros).toEqual({});
    const request = callGemini.mock.calls[0][0];
    expect(request).toMatchObject({
      model: "model-y",
      useGoogleSearch: false,
      responseMimeType: "application/json",
    });
    expect(request.contents.parts[0].text).toContain(
      "CURRENT REFERENCE DATE AND TIME:",
    );
    expect(request.responseSchema.required).toEqual(["soap", "courseEvent"]);
  });

  it("preserves reassessment input context, schema, references, and grounding sources", async () => {
    const reassessment = {
      assessment: { summary: "Improved" },
      plan: [],
      references: ["Guideline"],
    };
    callGemini.mockResolvedValue({
      text: JSON.stringify(reassessment),
      groundingSources: [{ title: "Source", uri: "https://example.test" }],
    });

    const currentSoap = {
      subjective: {
        hpi: "Improving",
        ros: {},
        pmh: "",
        meds: "",
        social: "",
        family: "",
      },
      objective: {
        vitals: "",
        physicalExam: {},
        labs: "",
        imaging: "",
        labInterpretation: [],
        imagingCorrelation: [],
      },
    } as never;
    await expect(
      reassessSoapNote(currentSoap, [], "model-z", "Internal Medicine", true),
    ).resolves.toMatchObject({
      ...reassessment,
      groundingSources: [{ title: "Source", uri: "https://example.test" }],
    });
    expect(callGemini).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "model-z",
        useGoogleSearch: true,
        responseMimeType: "application/json",
        responseSchema: expect.objectContaining({
          required: ["assessment", "plan"],
        }),
      }),
    );
  });
});

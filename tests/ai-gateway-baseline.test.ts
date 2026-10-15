import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { callGemini, convertFilesToParts, blobToBase64 } = vi.hoisted(() => ({
  callGemini: vi.fn(),
  convertFilesToParts: vi.fn(async () => [
    { inlineData: { data: "AAF/gP8=", mimeType: "image/png" } },
  ]),
  blobToBase64: vi.fn(async () => "YXVkaW8="),
}));
vi.mock("../src/services/ai/geminiTransport", () => ({
  callGemini,
  convertFilesToParts,
  blobToBase64,
  sanitizeModelOutput: (value: string) => value,
}));
vi.mock("../src/utils/ids", () => ({ createId: () => "fixed-chart-id" }));
vi.mock("../src/utils/date", () => ({
  getTodayDate: () => "2026-10-15",
  getCurrentTime24: () => "09:30",
}));
import { geminiGateway as gateway } from "../src/services/ai/geminiGateway";
import {
  contractPatientCase,
  createContractAttachment,
} from "./fixtures/patient-cases";
const soap = contractPatientCase.entries[0].soap!;
const chartResult = {
  patientInfo: contractPatientCase.patientInfo,
  soap,
  course: [],
  handoff: contractPatientCase.handoff,
};
const history = Array.from({ length: 7 }, (_, i) => ({
  ...contractPatientCase.entries[2],
  id: `entry-${i}`,
  title: `Title-${i}`,
  rawText: `History-${i}`,
  date: `2026-10-0${7 - i}`,
}));
const textParts = (request: { contents: { parts: { text?: string }[] } }) =>
  request.contents.parts.map((p) => p.text || "").join("\n");

const operations = [
  {
    name: "chart",
    run: () => gateway.generateChart({ text: "Draft", files: [] }),
    output: chartResult,
    required: ["patientInfo", "soap", "course", "handoff"],
    fallback: "reject",
  },
  {
    name: "progress",
    run: () => gateway.generateProgressNote({ text: "Draft", files: [] }),
    output: { soap, courseEvent: { event: "Update", details: "Stable" } },
    required: ["soap", "courseEvent"],
    fallback: "reject",
  },
  {
    name: "reassessment",
    run: () => gateway.reassessNote({ soap }),
    output: { assessment: soap.assessment, plan: [] },
    required: ["assessment", "plan"],
    fallback: "reject",
  },
  {
    name: "summary",
    run: () =>
      gateway.refreshSummary({
        currentSummary: contractPatientCase.handoff,
        patientInfo: contractPatientCase.patientInfo,
        recentEntries: [],
        recentCourse: [],
        specialization: "General Practice",
      }),
    output: contractPatientCase.handoff,
    required: ["patientId", "oneLiner", "activeIssues", "toDoList"],
    fallback: "reject",
  },
  {
    name: "input suggestions",
    run: () => gateway.generateInputSuggestions("Draft"),
    output: { questions: [], tests: [] },
    required: ["questions", "tests"],
    fallback: "reject",
  },
  {
    name: "lab photos",
    run: () => gateway.analyzeLabPhotos([]),
    output: { labs: "5 mg/L", labInterpretation: [] },
    required: ["labs", "labInterpretation"],
    fallback: "reject",
  },
  {
    name: "imaging photos",
    run: () => gateway.analyzeImagingPhotos([]),
    output: { imaging: "Clear", imagingCorrelation: [] },
    required: ["imaging", "imagingCorrelation"],
    fallback: "reject",
  },
  {
    name: "prescriptions",
    run: () => gateway.parsePrescriptions([]),
    output: [],
    fallback: "emptyArray",
  },
] as const;

describe("W01 gateway provider contracts", () => {
  beforeEach(() => {
    callGemini.mockReset();
    convertFilesToParts.mockClear();
    blobToBase64.mockClear();
  });
  afterEach(() => vi.restoreAllMocks());

  it.each(operations)(
    "$name preserves schema and parsed result",
    async (operation) => {
      callGemini.mockResolvedValue({ text: JSON.stringify(operation.output) });
      const result = await operation.run();
      expect(result).toMatchObject(operation.output);
      const request = callGemini.mock.calls[0][0];
      expect(request.responseMimeType).toBe("application/json");
      if ("required" in operation)
        expect(request.responseSchema.required).toEqual(operation.required);
      else
        expect(request.responseSchema.items.required).toEqual([
          "drug",
          "dose",
          "route",
          "frequency",
          "duration",
          "sig",
          "quantity",
        ]);
      if (["chart", "progress", "reassessment"].includes(operation.name))
        expect(request.useGoogleSearch).toBe(false);
      if (operation.name === "chart")
        expect(result).toMatchObject({
          id: "fixed-chart-id",
          references: [],
          groundingSources: [],
        });
    },
  );

  it.each(operations)(
    "$name records empty and malformed result policy",
    async (operation) => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      for (const text of ["", "{malformed"]) {
        callGemini.mockResolvedValue({ text });
        if (operation.fallback === "reject")
          await expect(operation.run()).rejects.toThrow();
        else await expect(operation.run()).resolves.toEqual([]);
      }
    },
  );

  it("freezes chart's first-five order and progress's reversed first-three context with a fixed clock", async () => {
    callGemini.mockResolvedValueOnce({ text: JSON.stringify(chartResult) });
    await gateway.generateChart({
      text: "Draft",
      files: [],
      history,
      currentPatientInfo: contractPatientCase.patientInfo,
    });
    const chart = textParts(callGemini.mock.calls[0][0]);
    expect(chart).toContain(JSON.stringify(contractPatientCase.patientInfo));
    expect(chart.indexOf("History-0")).toBeLessThan(chart.indexOf("History-4"));
    expect(chart).not.toContain("History-5");
    callGemini.mockResolvedValueOnce({
      text: JSON.stringify({
        soap,
        courseEvent: { event: "Update", details: "Stable" },
      }),
    });
    await gateway.generateProgressNote({ text: "Draft", files: [], history });
    const progress = textParts(callGemini.mock.calls[1][0]);
    expect(progress).toContain("2026-10-15 09:30");
    expect(progress.indexOf("History-2")).toBeLessThan(
      progress.indexOf("History-0"),
    );
    expect(progress).not.toContain("History-3");
    expect(history[0].id).toBe("entry-0");
  });

  it("preserves full patient context in chat/thread, message order, files, grounding and title extraction", async () => {
    const signal = new AbortController().signal;
    const attachments = [createContractAttachment()];
    const messages = [
      { role: "user" as const, text: "First" },
      { role: "model" as const, text: "Second" },
    ];
    const groundingSources = [
      { title: "Fixture", uri: "https://example.test" },
    ];
    callGemini.mockResolvedValue({
      text: "<note_title>Review</note_title>Answer",
      groundingSources,
    });
    await expect(
      gateway.sendChatMessage({
        history: messages,
        message: "Third",
        patient: contractPatientCase,
        signal,
        attachments,
      }),
    ).resolves.toEqual({ text: "Answer", title: "Review", groundingSources });
    const request = callGemini.mock.calls[0][0];
    expect(request.systemInstruction).toContain(
      JSON.stringify(contractPatientCase),
    );
    expect(request.contents).toEqual([
      { role: "user", parts: [{ text: "First" }] },
      { role: "model", parts: [{ text: "Second" }] },
      {
        role: "user",
        parts: [
          { text: "Third" },
          { inlineData: { data: "AAF/gP8=", mimeType: "image/png" } },
        ],
      },
    ]);
    expect(request).toMatchObject({ signal, useGoogleSearch: false });
    expect(convertFilesToParts).toHaveBeenCalledWith([attachments[0].file]);
    await gateway.sendNoteThreadMessage({
      history: messages,
      message: "Third",
      noteContent: "Source note",
      noteTitle: "Title",
      highlightedContext: "Highlight",
      patient: contractPatientCase,
      signal,
    });
    const thread = callGemini.mock.calls[1][0];
    expect(thread).toMatchObject({ signal, useGoogleSearch: true });
    for (const value of [
      JSON.stringify(contractPatientCase),
      "Source note",
      "Title",
      "Highlight",
    ])
      expect(thread.systemInstruction).toContain(value);
  });

  it("preserves text fallbacks, suggestion fallback, title truncation and transcription data", async () => {
    callGemini.mockResolvedValue({ text: "" });
    await expect(
      gateway.sendChatMessage({ history: [], message: "", patient: null }),
    ).resolves.toEqual({
      text: "",
      title: "Clinical Conversation",
      groundingSources: undefined,
    });
    await expect(
      gateway.sendNoteThreadMessage({
        history: [],
        message: "",
        noteContent: "",
        noteTitle: "",
      }),
    ).resolves.toMatchObject({ text: "" });
    await expect(
      gateway.integrateClinicalData("Objective", "Source", [], "Update"),
    ).resolves.toBe("Source");
    await expect(gateway.analyzeClinicalPhotos([], "Exam")).resolves.toBe(
      "Exam",
    );
    await expect(
      gateway.transcribeAudio(new Blob(["audio"], { type: "audio/webm" })),
    ).resolves.toBe("");
    expect(callGemini.mock.lastCall![0].contents.parts[0]).toEqual({
      inlineData: { data: "YXVkaW8=", mimeType: "audio/webm" },
    });
    await expect(
      gateway.generateClinicalSuggestions("Objective", "Source"),
    ).resolves.toEqual([]);
    callGemini.mockResolvedValue({ text: "- First\n- Second" });
    await expect(
      gateway.generateClinicalSuggestions("Subjective", "Source"),
    ).resolves.toEqual(["First", "Second"]);
    callGemini.mockResolvedValue({ text: ' "Title" ' });
    await expect(
      gateway.generateResponseTitle("Query", "x".repeat(1000) + "EXCLUDED"),
    ).resolves.toBe("Title");
    expect(textParts(callGemini.mock.lastCall![0])).not.toContain("EXCLUDED");
    callGemini.mockRejectedValue(new Error("offline"));
    await expect(
      gateway.generateResponseTitle("Query", "Response"),
    ).resolves.toBe("Clinical Conversation");
  });

  it("forwards lookup signals and rejects cancelled chat/thread/lookup before transport", async () => {
    const controller = new AbortController();
    callGemini.mockResolvedValue({ text: "Answer", groundingSources: [] });
    await expect(gateway.lookup("Query", controller.signal)).resolves.toEqual({
      text: "Answer",
      groundingSources: [],
    });
    expect(callGemini.mock.lastCall![0]).toMatchObject({
      signal: controller.signal,
      useGoogleSearch: true,
      contents: { parts: [{ text: "Query" }] },
    });
    callGemini.mockClear();
    controller.abort();
    await expect(
      gateway.sendChatMessage({
        history: [],
        message: "",
        patient: null,
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
    await expect(
      gateway.sendNoteThreadMessage({
        history: [],
        message: "",
        noteContent: "",
        noteTitle: "",
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
    await expect(
      gateway.lookup("Query", controller.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(callGemini).not.toHaveBeenCalled();
  });
});

// Compare the projected gateway with the original task invocation path. Prompts/schemas
// remain task-owned; future domain fields must not change any provider request value.
import * as chartTasks from "../src/services/ai/tasks/chartGeneration";
import * as conversationTasks from "../src/services/ai/tasks/conversation";
import * as summaryTasks from "../src/services/ai/tasks/summary";
import * as clinicalTasks from "../src/services/ai/tasks/clinicalAssistance";
import * as inputTasks from "../src/services/ai/tasks/inputAssistance";
import * as mediaTasks from "../src/services/ai/tasks/mediaAnalysis";
import * as prescriptionTasks from "../src/services/ai/tasks/discharge";

it("keeps provider requests, schemas and results equivalent for every operation while excluding future fields", async () => {
  const futureInfo = {
    ...contractPatientCase.patientInfo,
    futureDomainField: "EXCLUDED",
  };
  const futureSoap = {
    ...soap,
    subjective: { ...soap.subjective, futureDomainField: "EXCLUDED" },
  };
  const futurePatient = {
    ...contractPatientCase,
    futureDomainField: "EXCLUDED",
    patientInfo: futureInfo,
  };
  const signal = new AbortController().signal;
  const attachments = [createContractAttachment()];
  const files = attachments.map((a) => a.file);
  const audio = new Blob(["audio"], { type: "audio/webm" });
  const summaryRequest = {
    currentSummary: contractPatientCase.handoff,
    patientInfo: futureInfo,
    recentEntries: history,
    recentCourse: contractPatientCase.course,
    specialization: "Cardiology",
  };
  const pairs = [
    [
      () =>
        gateway.generateChart({
          text: "Draft",
          files,
          history,
          currentPatientInfo: futureInfo,
          specialization: "Cardiology",
          useSearch: true,
        }),
      () =>
        chartTasks.generateMedicalChart(
          "Draft",
          files,
          "Cardiology",
          true,
          history,
          contractPatientCase.patientInfo,
        ),
      JSON.stringify(chartResult),
    ],
    [
      () =>
        gateway.generateProgressNote({
          text: "Draft",
          files,
          history,
          specialization: "Cardiology",
          useSearch: true,
        }),
      () =>
        chartTasks.generateProgressNote(
          "Draft",
          files,
          "Cardiology",
          true,
          history,
        ),
      JSON.stringify({
        soap,
        courseEvent: { event: "Update", details: "Stable" },
      }),
    ],
    [
      () =>
        gateway.reassessNote({
          soap: futureSoap,
          history,
          specialization: "Cardiology",
          useSearch: true,
        }),
      () => chartTasks.reassessSoapNote(soap, history, "Cardiology", true),
      JSON.stringify({ assessment: soap.assessment, plan: [] }),
    ],
    [
      () =>
        gateway.sendChatMessage({
          history: [],
          message: "Query",
          patient: futurePatient,
          useSearch: true,
          signal,
          attachments,
        }),
      () =>
        conversationTasks.sendChatMessage(
          [],
          "Query",
          contractPatientCase,
          true,
          signal,
          attachments,
        ),
      "Answer",
    ],
    [
      () =>
        gateway.sendNoteThreadMessage({
          history: [],
          message: "Query",
          noteContent: "Source",
          noteTitle: "Title",
          highlightedContext: "Highlight",
          patient: futurePatient,
          signal,
          attachments,
        }),
      () =>
        conversationTasks.sendNoteThreadMessage(
          [],
          "Query",
          "Source",
          "Title",
          "Highlight",
          contractPatientCase,
          signal,
          attachments,
        ),
      "Answer",
    ],
    [
      () => gateway.refreshSummary(summaryRequest),
      () =>
        summaryTasks.refreshPatientSummary(
          contractPatientCase.handoff,
          contractPatientCase.patientInfo,
          history,
          contractPatientCase.course,
          "Cardiology",
        ),
      JSON.stringify(contractPatientCase.handoff),
    ],
    [
      () => gateway.generateClinicalSuggestions("Objective", "Source"),
      () => clinicalTasks.generateClinicalSuggestions("Objective", "Source"),
      '["Review"]',
    ],
    [
      () =>
        gateway.integrateClinicalData(
          "Objective",
          "Source",
          ["Review"],
          "Update",
        ),
      () =>
        clinicalTasks.integrateClinicalData(
          "Objective",
          "Source",
          ["Review"],
          "Update",
        ),
      "Integrated",
    ],
    [
      () => gateway.generateInputSuggestions("Draft"),
      () => inputTasks.generateInputSuggestions("Draft"),
      '{"questions":[],"tests":[]}',
    ],
    [
      () => gateway.lookup("Query", signal),
      () => inputTasks.medicalLookup("Query", signal),
      "Answer",
    ],
    [
      () => gateway.generateResponseTitle("Query", "Answer"),
      () => inputTasks.generateResponseTitle("Query", "Answer"),
      "Title",
    ],
    [
      () => gateway.analyzeClinicalPhotos(files, "Exam"),
      () => mediaTasks.analyzeClinicalPhotos(files, "Exam"),
      "Exam result",
    ],
    [
      () => gateway.analyzeLabPhotos(files, "Labs", "Interpretation"),
      () => mediaTasks.analyzeLabPhotos(files, "Labs", "Interpretation"),
      '{"labs":"5 mg/L","labInterpretation":[]}',
    ],
    [
      () => gateway.analyzeImagingPhotos(files, "Imaging", "Correlation"),
      () => mediaTasks.analyzeImagingPhotos(files, "Imaging", "Correlation"),
      '{"imaging":"Clear","imagingCorrelation":[]}',
    ],
    [
      () => gateway.transcribeAudio(audio),
      () => mediaTasks.transcribeAudio(audio),
      "Transcript",
    ],
    [
      () =>
        gateway.parsePrescriptions([
          {
            problem: "Source",
            actions: ["Review"],
            ...{ futureDomainField: "EXCLUDED" },
          },
        ]),
      () =>
        prescriptionTasks.parsePrescriptions([
          { problem: "Source", actions: ["Review"] },
        ]),
      "[]",
    ],
  ] as const;
  for (const [projected, original, text] of pairs) {
    callGemini.mockReset().mockResolvedValue({ text, groundingSources: [] });
    const expected = await original();
    const originalRequest = callGemini.mock.calls[0][0];
    callGemini.mockClear();
    const actual = await projected();
    expect(actual).toEqual(expected);
    expect(callGemini.mock.calls[0][0]).toEqual(originalRequest);
    expect(JSON.stringify(callGemini.mock.calls[0][0])).not.toContain(
      "EXCLUDED",
    );
  }
});

it("honors cancellation while the conversation task import is pending", async () => {
  callGemini.mockClear();
  const controller = new AbortController();
  const pending = gateway.sendChatMessage({
    history: [],
    message: "Query",
    patient: contractPatientCase,
    signal: controller.signal,
  });
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  expect(callGemini).not.toHaveBeenCalled();
});

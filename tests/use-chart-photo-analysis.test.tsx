import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  analyzeClinicalPhotos,
  analyzeImagingPhotos,
  analyzeLabPhotos,
} from "../src/services/ai/actions";
import { useChartPhotoAnalysis } from "../src/features/chart/useChartPhotoAnalysis";
import { FileUpload } from "../src/types";
import { structuredPatientCase } from "./fixtures/patient-cases";

vi.mock("../src/services/ai/actions", () => ({
  analyzeClinicalPhotos: vi.fn(),
  analyzeImagingPhotos: vi.fn(),
  analyzeLabPhotos: vi.fn(),
}));

const attachment = (
  name: string,
  category: FileUpload["category"],
): FileUpload => ({
  file: new File(["sample"], name),
  base64: "c2FtcGxl",
  mimeType: "image/png",
  category,
});

describe("useChartPhotoAnalysis", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates physical exam content from all attached photos", async () => {
    vi.mocked(analyzeClinicalPhotos).mockResolvedValue("General: Updated");
    const entry = {
      ...structuredPatientCase.entries[0],
      attachments: [attachment("exam.png", "Physical Exam")],
    };
    const onUpdate = vi.fn();
    const { result } = renderHook(() =>
      useChartPhotoAnalysis({
        activeEntry: entry,
        selectedModel: "model-1",
        onUpdate,
        setWorkflowError: vi.fn(),
      }),
    );

    await act(async () => result.current.analyzePhotos());

    expect(analyzeClinicalPhotos).toHaveBeenCalledWith(
      [entry.attachments[0].file],
      "General: Well appearing",
      "model-1",
    );
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        objective: expect.objectContaining({
          physicalExam: { General: "Updated" },
        }),
      }),
    );
    expect(result.current.isAnalyzingPhotos).toBe(false);
  });

  it("routes categorized attachments and preserves the no-match feedback", async () => {
    const entry = {
      ...structuredPatientCase.entries[0],
      attachments: [
        attachment("xray.png", "Imaging"),
        attachment("cbc.png", "Laboratory"),
      ],
    };
    const setWorkflowError = vi.fn();
    vi.mocked(analyzeLabPhotos).mockResolvedValue({
      labs: "CBC reviewed",
      labInterpretation: ["Normal"],
    });
    const { result, rerender } = renderHook(
      ({ activeEntry }) =>
        useChartPhotoAnalysis({
          activeEntry,
          selectedModel: "model-1",
          setWorkflowError,
        }),
      {
        initialProps: { activeEntry: entry },
      },
    );

    await act(async () => result.current.analyzeLabs());
    expect(analyzeLabPhotos).toHaveBeenCalledWith(
      [entry.attachments[1].file],
      "Not Recorded",
      "",
      "model-1",
    );

    rerender({
      activeEntry: { ...entry, attachments: [entry.attachments[0]] },
    });
    await act(async () => result.current.analyzeLabs());
    expect(setWorkflowError).toHaveBeenCalledWith(
      "No laboratory photos found to analyze.",
    );
  });

  it("reports failures using the existing imaging error message", async () => {
    vi.mocked(analyzeImagingPhotos).mockRejectedValue(
      new Error("provider failure"),
    );
    const entry = {
      ...structuredPatientCase.entries[0],
      attachments: [attachment("xray.png", "Imaging")],
    };
    const setWorkflowError = vi.fn();
    const { result } = renderHook(() =>
      useChartPhotoAnalysis({
        activeEntry: entry,
        selectedModel: "model-1",
        setWorkflowError,
      }),
    );

    await act(async () => result.current.analyzeImaging());

    expect(setWorkflowError).toHaveBeenCalledWith(
      "Failed to analyze imaging photos. Please try again.",
    );
    expect(result.current.isAnalyzingImaging).toBe(false);
  });
});

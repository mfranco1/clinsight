import { beforeEach, describe, expect, it, vi } from "vitest";

const gateway = vi.hoisted(() => ({
  transcribeAudio: vi.fn(),
  sendChatMessage: vi.fn(),
  sendNoteThreadMessage: vi.fn(),
  generateClinicalSuggestions: vi.fn(),
  integrateClinicalData: vi.fn(),
  analyzeClinicalPhotos: vi.fn(),
  analyzeLabPhotos: vi.fn(),
  analyzeImagingPhotos: vi.fn(),
  lookup: vi.fn(),
  generateInputSuggestions: vi.fn(),
  generateHomeInstructions: vi.fn(),
  parsePrescriptions: vi.fn(),
}));

vi.mock("../src/services/ai/geminiGateway", () => ({ geminiGateway: gateway }));

import { medicalLookup, sendChatMessage } from "../src/services/ai/actions";
import type { FileUpload } from "../src/types";

describe("AI feature actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps existing positional chat calls to the typed gateway request", async () => {
    const history = [{ role: "user", text: "Hello" }] as never;
    const patient = { patientInfo: { patientName: "Fixture" } } as never;
    const attachments: FileUpload[] = [];
    const signal = new AbortController().signal;

    await sendChatMessage(
      "model-x",
      history,
      "Follow up",
      patient,
      true,
      signal,
      attachments,
    );

    expect(gateway.sendChatMessage).toHaveBeenCalledWith({
      model: "model-x",
      history,
      message: "Follow up",
      patient,
      useSearch: true,
      signal,
      attachments,
    });
  });

  it("preserves lookup cancellation when adapting to the gateway", async () => {
    const signal = new AbortController().signal;
    await medicalLookup("hypertension guidance", signal);
    expect(gateway.lookup).toHaveBeenCalledWith(
      "hypertension guidance",
      signal,
    );
  });
});

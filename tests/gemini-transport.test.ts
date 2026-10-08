import { describe, expect, it, vi } from "vitest";
import type { GenerateContentResponse } from "@google/genai";
import {
  awaitWithAbort,
  blobToBase64,
  callGemini,
  cleanGroundingSources,
  fileToGenerativePart,
  sanitizeModelOutput,
} from "../src/services/ai/geminiTransport";
import { extractAndParseJSON } from "../src/services/ai/responseParsing";

describe("Gemini transport helpers", () => {
  it("sanitizes model reasoning markers and normalizes grounding URLs", () => {
    expect(sanitizeModelOutput("Answer <thought>private</thought> done")).toBe(
      "Answer  done",
    );
    const response = {
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              { web: { title: "Reference", uri: "https://example.test" } },
            ],
          },
        },
      ],
    } satisfies Pick<GenerateContentResponse, "candidates">;
    expect(cleanGroundingSources(response)).toEqual([
      { title: "Reference", uri: "https://example.test" },
    ]);
  });

  it("rejects malformed structured output instead of returning a partial value", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => extractAndParseJSON('{ "incomplete": ')).toThrow();
  });

  it("rejects promptly when an abort signal is cancelled", async () => {
    const controller = new AbortController();
    const pending = new Promise<string>(() => {});
    const result = awaitWithAbort(pending, controller.signal);
    controller.abort();
    await expect(result).rejects.toMatchObject({ name: "AbortError" });
  });

  it("refuses provider requests in test mode", async () => {
    await expect(
      callGemini({ contents: "synthetic test input" }),
    ).rejects.toThrow("AI provider calls are disabled in test mode.");
  });

  it("converts browser files and blobs into base64 data", async () => {
    const file = new File(["clinical image"], "image.txt", {
      type: "text/plain",
    });
    expect(await fileToGenerativePart(file)).toEqual({
      inlineData: { data: btoa("clinical image"), mimeType: "text/plain" },
    });
    expect(await blobToBase64(new Blob(["clinical audio"]))).toBe(
      btoa("clinical audio"),
    );
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  collectAttachmentPreviewUrls,
  hydrateAttachments,
  serializeAttachments,
} from "../services/attachmentPersistence";
import type { FileUpload } from "../types";

describe("attachment persistence", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("stores serializable file metadata and rebuilds transient files and preview URLs", () => {
    const file = new File(["image data"], "scan.png", {
      type: "image/png",
      lastModified: 123,
    });
    const attachment: FileUpload = {
      file,
      previewUrl: "blob:temporary-preview",
      base64: btoa("image data"),
      mimeType: "image/png",
      category: "Imaging",
    };
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:restored-preview"),
    });

    const serialized = serializeAttachments({ attachments: [attachment] });
    const stored = JSON.parse(JSON.stringify(serialized));
    expect(stored.attachments[0].previewUrl).toBeUndefined();
    expect(stored.attachments[0].file).toEqual({
      name: "scan.png",
      type: "image/png",
      lastModified: 123,
    });

    const hydrated = hydrateAttachments(stored) as {
      attachments: FileUpload[];
    };
    expect(hydrated.attachments[0].file).toBeInstanceOf(File);
    expect(hydrated.attachments[0].file.name).toBe("scan.png");
    expect(hydrated.attachments[0].previewUrl).toBe("blob:restored-preview");
    expect(hydrated.attachments[0].base64).toBe(btoa("image data"));
  });

  it("collects only blob preview URLs across nested patient data", () => {
    const urls = collectAttachmentPreviewUrls({
      notes: [
        {
          attachments: [
            { base64: "a", mimeType: "image/png", previewUrl: "blob:one" },
          ],
        },
      ],
      unrelated: { previewUrl: "https://example.com/image.png" },
    });

    expect(urls).toEqual(new Set(["blob:one"]));
  });
});

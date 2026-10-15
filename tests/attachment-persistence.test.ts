import { afterEach, describe, expect, it, vi } from "vitest";
import {
  collectAttachmentPreviewUrls,
  hydrateAttachments,
  serializeAttachments,
} from "../src/services/attachmentPersistence";
import type { FileUpload } from "../src/types";

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

describe("durable attachment contract", () => {
  afterEach(() => vi.restoreAllMocks());

  it("preserves every byte and metadata at entry, note and subnote boundaries", async () => {
    const { createAttachmentPatientCase } =
      await import("./fixtures/patient-cases");
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:restored");
    const patient = createAttachmentPatientCase();
    const stored = serializeAttachments(patient);
    // Compile-time proof that the durable file is metadata, never a runtime File.
    const { expectTypeOf } = await import("vitest");
    expectTypeOf(stored.entries[0].attachments![0].file).toEqualTypeOf<
      import("../src/services/attachmentPersistence").PersistedFileMetadata
    >();
    const hydrated = hydrateAttachments(stored);
    const attachments = [
      hydrated.entries[0].attachments![0],
      hydrated.notes![0].attachments![0],
      hydrated.notes![0].subNotes![0].attachments![0],
    ];
    for (const attachment of attachments) {
      expect(attachment.file).toBeInstanceOf(File);
      expect(attachment.file.name).toBe("synthetic.png");
      expect(attachment.file.type).toBe("image/png");
      expect(attachment.file.lastModified).toBe(123);
      expect(attachment.category).toBe("Imaging");
      const bytes = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(attachment.file as File);
      });
      expect([...new Uint8Array(bytes)]).toEqual([0, 1, 127, 128, 255]);
    }
    expect(serializeAttachments(hydrated)).toEqual(stored);
    expect(JSON.stringify(stored)).not.toContain("blob:");
    expect(collectAttachmentPreviewUrls(hydrated)).toEqual(
      new Set(["blob:restored"]),
    );
    expect(patient.entries[0].attachments![0].previewUrl).toBe(
      "blob:synthetic-source",
    );
  });

  it("exposes corrupt durable metadata as the legacy hydration fallback", () => {
    const stored: import("../src/services/attachmentPersistence").PersistedAttachment =
      {
        file: { name: "broken.png", type: "image/png", lastModified: 456 },
        base64: "%%%",
        mimeType: "image/png",
        category: "Imaging",
      };
    const create = vi.spyOn(URL, "createObjectURL");
    const hydrated = hydrateAttachments(stored);
    expect(hydrated).toEqual(stored);
    expect(hydrated.file).not.toBeInstanceOf(File);
    expect(create).not.toHaveBeenCalled();
    expect(collectAttachmentPreviewUrls(hydrated)).toEqual(new Set());
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { createFileUploads } from "../services/fileService";

describe("createFileUploads", () => {
  afterEach(() => vi.restoreAllMocks());

  it("converts files in input order and applies the requested photo category", async () => {
    const createObjectUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValueOnce("blob:first")
      .mockReturnValueOnce("blob:second");
    const image = new File(["image"], "image.png", { type: "image/png" });
    const pdf = new File(["pdf"], "report.pdf", { type: "application/pdf" });

    const uploads = await createFileUploads([image, pdf], "Imaging");

    expect(uploads).toHaveLength(2);
    expect(uploads.map(({ file }) => file.name)).toEqual([
      "image.png",
      "report.pdf",
    ]);
    expect(uploads[0]).toMatchObject({
      mimeType: "image/png",
      previewUrl: "blob:first",
      category: "Imaging",
    });
    expect(uploads[0].base64).toBeTruthy();
    expect(uploads[1]).toMatchObject({
      mimeType: "application/pdf",
      category: "Imaging",
    });
    expect(uploads[1].previewUrl).toBeUndefined();
    expect(createObjectUrl).toHaveBeenCalledOnce();
  });
});

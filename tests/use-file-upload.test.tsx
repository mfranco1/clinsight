import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FileUpload } from "../types";
import { useFileUpload } from "../hooks/useFileUpload";

const attachment = (name: string, previewUrl: string): FileUpload => ({
  file: new File(["content"], name, { type: "image/png" }),
  previewUrl,
  base64: "Y29udGVudA==",
  mimeType: "image/png",
});

describe("useFileUpload preview lifecycle", () => {
  afterEach(() => vi.restoreAllMocks());

  it("keeps retained previews alive as the collection changes and revokes them on unmount", () => {
    const revoke = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
    const first = attachment("first.png", "blob:first");
    const second = attachment("second.png", "blob:second");
    const { result, unmount } = renderHook(() => useFileUpload([first]));

    act(() => result.current.setFiles([first, second]));
    expect(revoke).not.toHaveBeenCalled();

    unmount();
    expect(revoke).toHaveBeenCalledTimes(2);
    expect(revoke).toHaveBeenCalledWith("blob:first");
    expect(revoke).toHaveBeenCalledWith("blob:second");
  });

  it("revokes a removed preview immediately and does not revoke it again on unmount", () => {
    const revoke = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
    const first = attachment("first.png", "blob:first");
    const second = attachment("second.png", "blob:second");
    const { result, unmount } = renderHook(() =>
      useFileUpload([first, second]),
    );

    act(() => result.current.removeFile(0));
    expect(revoke).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith("blob:first");

    unmount();
    expect(revoke).toHaveBeenCalledTimes(2);
    expect(revoke).toHaveBeenLastCalledWith("blob:second");
  });
});

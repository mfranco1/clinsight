import { FileUpload, PhotoCategory } from "../types";

/**
 * Utility to convert a File object to a FileUpload object
 */
export const createFileUpload = async (
  file: File,
  category?: PhotoCategory,
): Promise<FileUpload> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      const previewUrl = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined;

      resolve({
        file,
        previewUrl,
        base64,
        mimeType: file.type,
        category,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const createFileUploads = (
  files: FileList | File[],
  category?: PhotoCategory,
): Promise<FileUpload[]> =>
  Promise.all(Array.from(files, (file) => createFileUpload(file, category)));

/**
 * Utility to open an attachment in a new tab
 */
export const openAttachment = (attachment: FileUpload) => {
  // If we have a fresh previewUrl (Blob URL), use it
  if (attachment.file && attachment.previewUrl) {
    window.open(attachment.previewUrl, "_blank");
    return;
  }

  // Fallback: If we only have base64, create a Blob and open it
  if (attachment.base64 && attachment.mimeType) {
    try {
      const byteCharacters = atob(attachment.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: attachment.mimeType });
      const blobUrl = URL.createObjectURL(blob);

      const newWindow = window.open(blobUrl, "_blank");

      // Cleanup the temporary Blob URL after the window is opened
      if (newWindow) {
        // We can't easily know when the tab is closed, but we can revoke after a delay
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      }
    } catch (e) {
      console.error("Error opening base64 attachment:", e);
      // Last resort: data URL
      window.open(
        `data:${attachment.mimeType};base64,${attachment.base64}`,
        "_blank",
      );
    }
  }
};

/**
 * Utility to revoke a URL
 */
export const revokeUrl = (url?: string) => {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
};

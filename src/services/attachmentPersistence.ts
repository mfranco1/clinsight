import type { FileUpload } from "../types";

interface SerializedFileMetadata {
  name: string;
  type: string;
  lastModified: number;
}

type AttachmentLike = Record<string, unknown> & {
  base64: string;
  mimeType: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isAttachment = (value: unknown): value is AttachmentLike =>
  isRecord(value) &&
  typeof value.base64 === "string" &&
  typeof value.mimeType === "string";

const getFileMetadata = (
  value: unknown,
  mimeType: string,
): SerializedFileMetadata => {
  if (isRecord(value)) {
    return {
      name: typeof value.name === "string" ? value.name : "Attachment",
      type: typeof value.type === "string" ? value.type : mimeType,
      lastModified:
        typeof value.lastModified === "number" ? value.lastModified : 0,
    };
  }
  return { name: "Attachment", type: mimeType, lastModified: 0 };
};

/** Removes runtime File and blob URL values while preserving metadata needed to restore them. */
export const serializeAttachments = <T>(value: T): T => {
  if (Array.isArray(value)) return value.map(serializeAttachments) as T;
  if (!isRecord(value)) return value;
  if (isAttachment(value)) {
    const serialized = {
      ...value,
      file: getFileMetadata(value.file, value.mimeType),
    };
    delete serialized.previewUrl;
    return serialized as T;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      serializeAttachments(child),
    ]),
  ) as T;
};

const restoreFileUpload = (attachment: AttachmentLike): FileUpload => {
  const metadata = getFileMetadata(attachment.file, attachment.mimeType);
  const binary = atob(attachment.base64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const file = new File([bytes], metadata.name, {
    type: attachment.mimeType || metadata.type,
    lastModified: metadata.lastModified,
  });
  const previewUrl = file.type.startsWith("image/")
    ? URL.createObjectURL(file)
    : undefined;
  return { ...attachment, file, previewUrl } as unknown as FileUpload;
};

/** Rebuilds transient browser File and preview URL values from persisted attachment data. */
export const hydrateAttachments = <T>(value: T): T => {
  if (Array.isArray(value)) return value.map(hydrateAttachments) as T;
  if (!isRecord(value)) return value;
  if (isAttachment(value)) {
    if (typeof File !== "undefined" && value.file instanceof File)
      return value as T;
    if (typeof atob === "undefined" || typeof File === "undefined")
      return value as T;
    try {
      return restoreFileUpload(value) as T;
    } catch {
      return value as T;
    }
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      hydrateAttachments(child),
    ]),
  ) as T;
};

export const collectAttachmentPreviewUrls = (
  value: unknown,
  urls = new Set<string>(),
): Set<string> => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectAttachmentPreviewUrls(item, urls));
  } else if (isRecord(value)) {
    if (
      isAttachment(value) &&
      typeof value.previewUrl === "string" &&
      value.previewUrl.startsWith("blob:")
    ) {
      urls.add(value.previewUrl);
    }
    Object.values(value).forEach((child) =>
      collectAttachmentPreviewUrls(child, urls),
    );
  }
  return urls;
};

import type { FileUpload, PhotoCategory } from "../types";

export interface PersistedFileMetadata {
  name: string;
  type: string;
  lastModified: number;
}

/** Durable bytes and metadata; preview URLs and File objects belong to runtime owners. */
export interface PersistedAttachment {
  file: PersistedFileMetadata;
  base64: string;
  mimeType: string;
  category?: PhotoCategory;
}

export type SerializedAttachments<T> = T extends FileUpload
  ? PersistedAttachment
  : T extends object
    ? { [K in keyof T]: SerializedAttachments<T[K]> }
    : T;

/** Invalid legacy bytes retain their durable representation until boundary validation is introduced. */
export type HydratedAttachments<T> = T extends FileUpload
  ? T
  : T extends PersistedAttachment
    ? FileUpload | PersistedAttachment
    : T extends object
      ? { [K in keyof T]: HydratedAttachments<T[K]> }
      : T;

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
): PersistedFileMetadata => {
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
const serializeAttachmentValues = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(serializeAttachmentValues);
  if (!isRecord(value)) return value;
  if (isAttachment(value)) {
    const serialized: Record<string, unknown> = {
      ...value,
      file: getFileMetadata(value.file, value.mimeType),
    };
    delete serialized.previewUrl;
    return serialized;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      serializeAttachmentValues(child),
    ]),
  );
};

/** Serialized type mirrors the existing recursive writer; it never promises a runtime File. */
export const serializeAttachments = <T>(value: T): SerializedAttachments<T> =>
  serializeAttachmentValues(value) as SerializedAttachments<T>;

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
const hydrateAttachmentValues = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(hydrateAttachmentValues);
  if (!isRecord(value)) return value;
  if (isAttachment(value)) {
    if (typeof File !== "undefined" && value.file instanceof File) return value;
    if (typeof atob === "undefined" || typeof File === "undefined")
      return value;
    try {
      return restoreFileUpload(value);
    } catch {
      return value;
    }
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      hydrateAttachmentValues(child),
    ]),
  );
};

export const hydrateAttachments = <T>(value: T): HydratedAttachments<T> =>
  hydrateAttachmentValues(value) as HydratedAttachments<T>;

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

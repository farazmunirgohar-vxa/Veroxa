export type MediaFileKind = "image" | "video";

export interface MediaValidationLimits { maxImageBytes: number; maxVideoBytes: number; maxBatchCount: number; }
export interface MediaValidationResult { ok: boolean; message?: string; kind?: MediaFileKind; extension?: string; }

export const DEFAULT_MEDIA_VALIDATION_LIMITS: MediaValidationLimits = {
  maxImageBytes: 25 * 1024 * 1024,
  maxVideoBytes: 100 * 1024 * 1024,
  maxBatchCount: 10,
};

const MIME_TO_EXTENSION: Record<string, { kind: MediaFileKind; extension: string }> = {
  "image/jpeg": { kind: "image", extension: "jpg" },
  "image/png": { kind: "image", extension: "png" },
  "image/webp": { kind: "image", extension: "webp" },
  "image/heic": { kind: "image", extension: "heic" },
  "image/heif": { kind: "image", extension: "heif" },
  "video/mp4": { kind: "video", extension: "mp4" },
  "video/quicktime": { kind: "video", extension: "mov" },
  "video/webm": { kind: "video", extension: "webm" },
};

export function getSafeMediaExtension(mimeType: string): string | null { return MIME_TO_EXTENSION[mimeType]?.extension ?? null; }
export function getMediaFileKind(mimeType: string): MediaFileKind | null { return MIME_TO_EXTENSION[mimeType]?.kind ?? null; }

export function validateMediaFile(file: File | null | undefined, limits = DEFAULT_MEDIA_VALIDATION_LIMITS): MediaValidationResult {
  if (!file) return { ok: false, message: "Please upload photos or videos only." };
  const match = MIME_TO_EXTENSION[file.type];
  if (!match) return { ok: false, message: "This file type is not supported yet." };
  const max = match.kind === "image" ? limits.maxImageBytes : limits.maxVideoBytes;
  if (file.size <= 0) return { ok: false, message: "Please upload photos or videos only." };
  if (file.size > max) return { ok: false, message: "This file is too large." };
  return { ok: true, kind: match.kind, extension: match.extension };
}

export function validateMediaBatch(files: File[], limits = DEFAULT_MEDIA_VALIDATION_LIMITS): MediaValidationResult[] {
  if (files.length > limits.maxBatchCount) return files.map(() => ({ ok: false, message: "Please choose fewer files at one time." }));
  return files.map((file) => validateMediaFile(file, limits));
}

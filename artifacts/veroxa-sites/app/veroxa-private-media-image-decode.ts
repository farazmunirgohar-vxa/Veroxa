import jpegJs from "jpeg-js";
import { decode as decodePng } from "fast-png";

import {
  type VeroxaPrivateMediaMimeType,
} from "./veroxa-private-media-assessment.ts";

// The in-process decoders allocate a complete RGB/RGBA raster, so they remain
// bounded independently from upload acceptance. Larger originals are decoded
// by the host image service into a 1-pixel output before any provider call.
const VEROXA_PRIVATE_MEDIA_IN_PROCESS_DECODE_MAX_PIXELS = 16_777_216;

export type VeroxaPrivateMediaImageVerificationMode =
  | "in_process_full_decode"
  | "host_bounded_decode";

export function veroxaPrivateMediaImageVerificationMode(
  width: number,
  height: number,
): VeroxaPrivateMediaImageVerificationMode | null {
  const pixels = width * height;
  if (!Number.isSafeInteger(pixels) || pixels < 1) return null;
  return pixels <= VEROXA_PRIVATE_MEDIA_IN_PROCESS_DECODE_MAX_PIXELS
    ? "in_process_full_decode"
    : "host_bounded_decode";
}

export const VEROXA_PRIVATE_MEDIA_FULL_DECODE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
] as const;

export type VeroxaPrivateMediaFullDecodeMimeType =
  typeof VEROXA_PRIVATE_MEDIA_FULL_DECODE_MIME_TYPES[number];

function expectedDecodedLength(
  width: number,
  height: number,
  channels: number,
): number | null {
  const pixels = width * height;
  const length = pixels * channels;
  return Number.isSafeInteger(pixels) && pixels >= 1 &&
      pixels <= VEROXA_PRIVATE_MEDIA_IN_PROCESS_DECODE_MAX_PIXELS &&
      Number.isSafeInteger(length)
    ? length
    : null;
}

/** Fully decodes an original while keeping the in-isolate raster bounded. */
export function fullyDecodeVeroxaPrivateMediaImage(input: {
  bytes: Uint8Array;
  mimeType: VeroxaPrivateMediaMimeType;
  expectedWidth: number;
  expectedHeight: number;
}): boolean {
  const pixels = input.expectedWidth * input.expectedHeight;
  if (!Number.isSafeInteger(pixels) || pixels < 1 ||
    pixels > VEROXA_PRIVATE_MEDIA_IN_PROCESS_DECODE_MAX_PIXELS ||
    !VEROXA_PRIVATE_MEDIA_FULL_DECODE_MIME_TYPES.includes(
      input.mimeType as VeroxaPrivateMediaFullDecodeMimeType,
    )) return false;

  try {
    if (input.mimeType === "image/jpeg") {
      const decoded = jpegJs.decode(input.bytes, {
        useTArray: true,
        formatAsRGBA: false,
        tolerantDecoding: false,
        maxResolutionInMP: 17,
        maxMemoryUsageInMB: 128,
      });
      const expectedLength = expectedDecodedLength(
        decoded.width,
        decoded.height,
        3,
      );
      return decoded.width === input.expectedWidth &&
        decoded.height === input.expectedHeight &&
        expectedLength !== null && decoded.data.byteLength === expectedLength;
    }

    const decoded = decodePng(input.bytes, { checkCrc: true });
    const expectedLength = expectedDecodedLength(
      decoded.width,
      decoded.height,
      decoded.channels,
    );
    const bytesPerSample = decoded.depth === 16 ? 2 : 1;
    return decoded.width === input.expectedWidth &&
      decoded.height === input.expectedHeight &&
      expectedLength !== null &&
      decoded.data.byteLength === expectedLength * bytesPerSample;
  } catch {
    return false;
  }
}

export type VeroxaPrivateMediaHostDecoder = (input: {
  bytes: Uint8Array;
  mimeType: VeroxaPrivateMediaFullDecodeMimeType;
  expectedWidth: number;
  expectedHeight: number;
}) => Promise<boolean>;

export type VeroxaPrivateMediaHostInspection = {
  width: number;
  height: number;
  fileSize: number;
};

export const VEROXA_PRIVATE_MEDIA_HOST_INSPECTION_FAILURE_CODES = [
  "images_binding_unavailable",
  "images_source_buffer_failed",
  "images_info_failed",
  "images_info_dimensions_invalid",
  "images_info_file_size_invalid",
  "images_info_file_size_mismatch",
  "images_input_failed",
  "images_transform_failed",
  "images_output_failed",
  "images_response_failed",
  "images_response_status_invalid",
  "images_response_content_type_invalid",
  "images_response_declared_size_invalid",
  "images_response_body_failed",
  "images_response_size_invalid",
  "images_response_magic_invalid",
] as const;

export type VeroxaPrivateMediaHostInspectionFailureCode =
  typeof VEROXA_PRIVATE_MEDIA_HOST_INSPECTION_FAILURE_CODES[number];

export type VeroxaPrivateMediaHostInspectionDiagnostics = {
  schemaVersion: 1;
  status: "passed" | "failed";
  stage: "binding" | "source" | "info" | "input" | "transform" | "output" |
    "response" | "complete";
  failureCode: VeroxaPrivateMediaHostInspectionFailureCode | null;
  bindingAvailable: boolean;
  info: {
    width: number | null;
    height: number | null;
    fileSize: number | null;
    format: string | null;
  } | null;
  output: {
    httpStatus: number | null;
    contentType: string | null;
    declaredContentLength: number | null;
    byteLength: number | null;
  } | null;
};

export type VeroxaPrivateMediaHostInspectionResult = {
  inspection: VeroxaPrivateMediaHostInspection | null;
  diagnostics: VeroxaPrivateMediaHostInspectionDiagnostics;
};

export type VeroxaPrivateMediaHostInspector = (input: {
  bytes: Uint8Array;
  mimeType: VeroxaPrivateMediaFullDecodeMimeType;
}) => Promise<VeroxaPrivateMediaHostInspectionResult>;

/**
 * Requires a trusted decode for every accepted JPEG/PNG. High-resolution
 * originals fail closed unless the host can decode and resize them without
 * materializing the complete source raster in the Worker isolate.
 */
export async function decodeVeroxaPrivateMediaImage(input: {
  bytes: Uint8Array;
  mimeType: VeroxaPrivateMediaMimeType;
  expectedWidth: number;
  expectedHeight: number;
  hostDecoder?: VeroxaPrivateMediaHostDecoder;
}): Promise<boolean> {
  if (!VEROXA_PRIVATE_MEDIA_FULL_DECODE_MIME_TYPES.includes(
    input.mimeType as VeroxaPrivateMediaFullDecodeMimeType,
  )) return false;
  const mode = veroxaPrivateMediaImageVerificationMode(
    input.expectedWidth,
    input.expectedHeight,
  );
  // Production supplies the host decoder for every source. This gives one
  // consistent native decode boundary while retaining the bounded in-process
  // decoder as a fail-closed local/test fallback for smaller originals.
  if (input.hostDecoder) {
    try {
      return await input.hostDecoder({
        ...input,
        mimeType: input.mimeType as VeroxaPrivateMediaFullDecodeMimeType,
      });
    } catch {
      return false;
    }
  }
  return mode === "in_process_full_decode"
    ? fullyDecodeVeroxaPrivateMediaImage(input)
    : false;
}

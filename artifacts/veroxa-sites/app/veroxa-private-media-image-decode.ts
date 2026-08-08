import jpegJs from "jpeg-js";
import { decode as decodePng } from "fast-png";

import {
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_DECODED_PIXELS,
  type VeroxaPrivateMediaMimeType,
} from "./veroxa-private-media-assessment.ts";

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
      pixels <= VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_DECODED_PIXELS &&
      Number.isSafeInteger(length)
    ? length
    : null;
}

/**
 * Fully decodes bounded JPEG and PNG inputs before any paid provider call.
 * Other formats are rejected until the Edge runtime has an equally bounded,
 * trusted full decoder.
 */
export function fullyDecodeVeroxaPrivateMediaImage(input: {
  bytes: Uint8Array;
  mimeType: VeroxaPrivateMediaMimeType;
  expectedWidth: number;
  expectedHeight: number;
}): boolean {
  const pixels = input.expectedWidth * input.expectedHeight;
  if (!Number.isSafeInteger(pixels) || pixels < 1 ||
    pixels > VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_DECODED_PIXELS ||
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

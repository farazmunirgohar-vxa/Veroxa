import {
  type VeroxaPrivateMediaHostDecoder,
  type VeroxaPrivateMediaHostInspection,
  type VeroxaPrivateMediaHostInspector,
} from "./veroxa-private-media-image-decode.ts";

const ONE_PIXEL_JPEG_MINIMUM_BYTES = 16;
const ONE_PIXEL_JPEG_MAXIMUM_BYTES = 128 * 1024;

/**
 * Cloudflare Images performs a real source decode and re-encode outside the
 * Worker isolate. Resizing to one pixel keeps our response read bounded while
 * still making malformed JPEG/PNG inputs fail before they reach OpenAI.
 */
async function inspectWithHost(
  input: Parameters<VeroxaPrivateMediaHostInspector>[0],
  expected?: { width: number; height: number },
): Promise<VeroxaPrivateMediaHostInspection | null> {
  try {
    const images = (globalThis as typeof globalThis & {
      __VEROXA_IMAGES__?: VeroxaImagesBinding;
    }).__VEROXA_IMAGES__;
    if (!images) return null;
    const sourceBytes = input.bytes.buffer.slice(
      input.bytes.byteOffset,
      input.bytes.byteOffset + input.bytes.byteLength,
    ) as ArrayBuffer;
    const info = await images.info(
      new Blob([sourceBytes], { type: input.mimeType }).stream(),
    );
    if (!Number.isSafeInteger(info.width) || info.width < 1 ||
      !Number.isSafeInteger(info.height) || info.height < 1 ||
      !Number.isSafeInteger(info.fileSize) ||
      info.fileSize !== input.bytes.byteLength ||
      expected && (info.width !== expected.width ||
        info.height !== expected.height)) return null;
    const result = await images
      .input(new Blob([sourceBytes], { type: input.mimeType }).stream())
      .transform({ width: 1, height: 1, fit: "fill" })
      .output({ format: "image/jpeg", quality: 1 });
    const response = result.response();
    if (!response.ok ||
      response.headers.get("content-type")?.split(";", 1)[0].trim() !==
        "image/jpeg") return null;
    const declared = Number(response.headers.get("content-length") || 0);
    if (Number.isFinite(declared) && declared > ONE_PIXEL_JPEG_MAXIMUM_BYTES) {
      return null;
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!(bytes.byteLength >= ONE_PIXEL_JPEG_MINIMUM_BYTES &&
      bytes.byteLength <= ONE_PIXEL_JPEG_MAXIMUM_BYTES &&
      bytes[0] === 0xff && bytes[1] === 0xd8 &&
      bytes[bytes.byteLength - 2] === 0xff &&
      bytes[bytes.byteLength - 1] === 0xd9)) return null;
    return {
      width: info.width,
      height: info.height,
      fileSize: info.fileSize,
    };
  } catch {
    return null;
  }
}

/**
 * Returns native dimensions only after the host has decoded and re-encoded
 * the complete source. This is the fail-closed compatibility boundary for
 * valid JPEG/PNG encodings that the stricter in-app structural parser rejects.
 */
export const inspectVeroxaPrivateMediaImageWithHost:
  VeroxaPrivateMediaHostInspector = (input) => inspectWithHost(input);

export const decodeVeroxaPrivateMediaImageWithHost:
  VeroxaPrivateMediaHostDecoder = async (input) =>
    Boolean(await inspectWithHost(input, {
      width: input.expectedWidth,
      height: input.expectedHeight,
    }));

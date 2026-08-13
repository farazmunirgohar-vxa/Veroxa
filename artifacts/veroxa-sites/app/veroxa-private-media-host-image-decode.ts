import {
  type VeroxaPrivateMediaHostDecoder,
} from "./veroxa-private-media-image-decode.ts";

const ONE_PIXEL_JPEG_MINIMUM_BYTES = 16;
const ONE_PIXEL_JPEG_MAXIMUM_BYTES = 128 * 1024;

/**
 * Cloudflare Images performs a real source decode and re-encode outside the
 * Worker isolate. Resizing to one pixel keeps our response read bounded while
 * still making malformed JPEG/PNG inputs fail before they reach OpenAI.
 */
export const decodeVeroxaPrivateMediaImageWithHost:
  VeroxaPrivateMediaHostDecoder = async (input) => {
    const images = (globalThis as typeof globalThis & {
      __VEROXA_IMAGES__?: VeroxaImagesBinding;
    }).__VEROXA_IMAGES__;
    if (!images) return false;
    const sourceBytes = input.bytes.buffer.slice(
      input.bytes.byteOffset,
      input.bytes.byteOffset + input.bytes.byteLength,
    ) as ArrayBuffer;
    const info = await images.info(
      new Blob([sourceBytes], { type: input.mimeType }).stream(),
    );
    if (info.width !== input.expectedWidth ||
      info.height !== input.expectedHeight ||
      info.fileSize !== input.bytes.byteLength) return false;
    const result = await images
      .input(new Blob([sourceBytes], { type: input.mimeType }).stream())
      .transform({ width: 1, height: 1, fit: "fill" })
      .output({ format: "image/jpeg", quality: 1 });
    const response = result.response();
    if (!response.ok ||
      response.headers.get("content-type")?.split(";", 1)[0].trim() !==
        "image/jpeg") return false;
    const declared = Number(response.headers.get("content-length") || 0);
    if (Number.isFinite(declared) && declared > ONE_PIXEL_JPEG_MAXIMUM_BYTES) {
      return false;
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    return bytes.byteLength >= ONE_PIXEL_JPEG_MINIMUM_BYTES &&
      bytes.byteLength <= ONE_PIXEL_JPEG_MAXIMUM_BYTES &&
      bytes[0] === 0xff && bytes[1] === 0xd8 &&
      bytes[bytes.byteLength - 2] === 0xff &&
      bytes[bytes.byteLength - 1] === 0xd9;
  };

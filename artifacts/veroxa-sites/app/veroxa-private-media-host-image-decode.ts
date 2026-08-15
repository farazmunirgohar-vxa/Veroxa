import {
  type VeroxaPrivateMediaHostDecoder,
  type VeroxaPrivateMediaHostInspection,
  type VeroxaPrivateMediaHostInspectionDiagnostics,
  type VeroxaPrivateMediaHostInspectionFailureCode,
  type VeroxaPrivateMediaHostInspectionResult,
  type VeroxaPrivateMediaHostInspector,
} from "./veroxa-private-media-image-decode.ts";

const ONE_PIXEL_JPEG_MINIMUM_BYTES = 16;
const ONE_PIXEL_JPEG_MAXIMUM_BYTES = 128 * 1024;

/**
 * Cloudflare Images performs a real source decode and re-encode outside the
 * Worker isolate. Resizing to one pixel keeps our response read bounded while
 * still making malformed JPEG/PNG inputs fail before they reach OpenAI.
 */
type HostInspectionStage =
  VeroxaPrivateMediaHostInspectionDiagnostics["stage"];

function failed(
  stage: HostInspectionStage,
  failureCode: VeroxaPrivateMediaHostInspectionFailureCode,
  input: {
    bindingAvailable: boolean;
    info?: VeroxaPrivateMediaHostInspectionDiagnostics["info"];
    output?: VeroxaPrivateMediaHostInspectionDiagnostics["output"];
  },
): VeroxaPrivateMediaHostInspectionResult {
  return {
    inspection: null,
    diagnostics: {
      schemaVersion: 1,
      status: "failed",
      stage,
      failureCode,
      bindingAvailable: input.bindingAvailable,
      info: input.info ?? null,
      output: input.output ?? null,
    },
  };
}

function observedInfo(value: {
  width: unknown;
  height: unknown;
  fileSize: unknown;
  format: unknown;
}): NonNullable<VeroxaPrivateMediaHostInspectionDiagnostics["info"]> {
  return {
    width: Number.isSafeInteger(value.width) ? value.width as number : null,
    height: Number.isSafeInteger(value.height) ? value.height as number : null,
    fileSize: Number.isSafeInteger(value.fileSize)
      ? value.fileSize as number
      : null,
    format: typeof value.format === "string"
      ? value.format.slice(0, 80)
      : null,
  };
}

async function inspectWithHost(
  input: Parameters<VeroxaPrivateMediaHostInspector>[0],
  expected?: { width: number; height: number },
): Promise<VeroxaPrivateMediaHostInspectionResult> {
  const images = (globalThis as typeof globalThis & {
    __VEROXA_IMAGES__?: VeroxaImagesBinding;
  }).__VEROXA_IMAGES__;
  if (!images) return failed("binding", "images_binding_unavailable", {
    bindingAvailable: false,
  });

  let sourceBytes: ArrayBuffer;
  try {
    sourceBytes = input.bytes.buffer.slice(
      input.bytes.byteOffset,
      input.bytes.byteOffset + input.bytes.byteLength,
    ) as ArrayBuffer;
  } catch {
    return failed("source", "images_source_buffer_failed", {
      bindingAvailable: true,
    });
  }

  let rawInfo: Awaited<ReturnType<VeroxaImagesBinding["info"]>>;
  try {
    rawInfo = await images.info(
      new Blob([sourceBytes], { type: input.mimeType }).stream(),
    );
  } catch {
    return failed("info", "images_info_failed", {
      bindingAvailable: true,
    });
  }
  const info = observedInfo(rawInfo);
  if (info.width === null || info.width < 1 || info.height === null ||
    info.height < 1 || expected && (info.width !== expected.width ||
      info.height !== expected.height)) {
    return failed("info", "images_info_dimensions_invalid", {
      bindingAvailable: true,
      info,
    });
  }
  if (info.fileSize === null || info.fileSize < 1) {
    return failed("info", "images_info_file_size_invalid", {
      bindingAvailable: true,
      info,
    });
  }
  if (info.fileSize !== input.bytes.byteLength) {
    return failed("info", "images_info_file_size_mismatch", {
      bindingAvailable: true,
      info,
    });
  }

  let handle: VeroxaImagesInput;
  try {
    handle = images.input(
      new Blob([sourceBytes], { type: input.mimeType }).stream(),
    );
  } catch {
    return failed("input", "images_input_failed", {
      bindingAvailable: true,
      info,
    });
  }
  try {
    handle = handle.transform({ width: 1, height: 1, fit: "fill" });
  } catch {
    return failed("transform", "images_transform_failed", {
      bindingAvailable: true,
      info,
    });
  }
  let result: VeroxaImagesTransformResult;
  try {
    result = await handle.output({ format: "image/jpeg", quality: 1 });
  } catch {
    return failed("output", "images_output_failed", {
      bindingAvailable: true,
      info,
    });
  }
  let response: Response;
  try {
    response = result.response();
  } catch {
    return failed("response", "images_response_failed", {
      bindingAvailable: true,
      info,
    });
  }
  const rawContentType = response.headers.get("content-type");
  const contentType = rawContentType?.split(";", 1)[0].trim() || null;
  const rawDeclared = response.headers.get("content-length");
  const parsedDeclared = rawDeclared === null ? null : Number(rawDeclared);
  const declaredContentLength = parsedDeclared !== null &&
      Number.isSafeInteger(parsedDeclared) && parsedDeclared >= 0
    ? parsedDeclared
    : null;
  const outputBase = {
    httpStatus: response.status,
    contentType,
    declaredContentLength,
    byteLength: null,
  };
  if (!response.ok) {
    return failed("response", "images_response_status_invalid", {
      bindingAvailable: true,
      info,
      output: outputBase,
    });
  }
  if (contentType !== "image/jpeg") {
    return failed("response", "images_response_content_type_invalid", {
      bindingAvailable: true,
      info,
      output: outputBase,
    });
  }
  if ((rawDeclared !== null && declaredContentLength === null) ||
    (declaredContentLength !== null &&
      declaredContentLength > ONE_PIXEL_JPEG_MAXIMUM_BYTES)) {
    return failed("response", "images_response_declared_size_invalid", {
      bindingAvailable: true,
      info,
      output: outputBase,
    });
  }
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await response.arrayBuffer());
  } catch {
    return failed("response", "images_response_body_failed", {
      bindingAvailable: true,
      info,
      output: outputBase,
    });
  }
  const output = { ...outputBase, byteLength: bytes.byteLength };
  if (bytes.byteLength < ONE_PIXEL_JPEG_MINIMUM_BYTES ||
    bytes.byteLength > ONE_PIXEL_JPEG_MAXIMUM_BYTES) {
    return failed("response", "images_response_size_invalid", {
      bindingAvailable: true,
      info,
      output,
    });
  }
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 ||
    bytes[bytes.byteLength - 2] !== 0xff ||
    bytes[bytes.byteLength - 1] !== 0xd9) {
    return failed("response", "images_response_magic_invalid", {
      bindingAvailable: true,
      info,
      output,
    });
  }
  const inspection: VeroxaPrivateMediaHostInspection = {
    width: info.width,
    height: info.height,
    fileSize: info.fileSize,
  };
  return {
    inspection,
    diagnostics: {
      schemaVersion: 1,
      status: "passed",
      stage: "complete",
      failureCode: null,
      bindingAvailable: true,
      info,
      output,
    },
  };
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
    Boolean((await inspectWithHost(input, {
      width: input.expectedWidth,
      height: input.expectedHeight,
    })).inspection);

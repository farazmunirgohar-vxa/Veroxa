import {
  detectMomoImageMimeType,
  inspectMomoImageBytesForTrustedCompatibility,
  inspectMomoImageBytesFully,
} from "./momo-image-bytes.ts";
import {
  type VeroxaPrivateMediaHostDecoder,
  type VeroxaPrivateMediaHostInspectionDiagnostics,
  type VeroxaPrivateMediaHostInspectionFailureCode,
  type VeroxaPrivateMediaHostInspectionResult,
  type VeroxaPrivateMediaHostInspector,
} from "./veroxa-private-media-image-decode.ts";

const ONE_PIXEL_IMAGE_MINIMUM_BYTES = 16;
const ONE_PIXEL_IMAGE_MAXIMUM_BYTES = 128 * 1024;
const DEFAULT_TIMEOUT_MS = 12_000;

type StorageObjectInfo = {
  id?: unknown;
  version?: unknown;
  name?: unknown;
  bucketId?: unknown;
  size?: unknown;
  contentType?: unknown;
};

type StorageSignedUrl = { signedUrl?: unknown };

class StorageTransformTimeoutError extends Error {
  constructor() {
    super("storage_transform_timeout");
  }
}

/** The small structural portion of the Supabase client used by this adapter. */
export type VeroxaStorageImageTransformClient = {
  storage: {
    from(bucket: string): {
      info(path: string): Promise<{ data: StorageObjectInfo | null; error: unknown }>;
      createSignedUrl(
        path: string,
        expiresIn: number,
        options?: {
          transform?: {
            width: number;
            height: number;
            resize: "fill";
            format: "origin";
          };
        },
      ): Promise<{ data: StorageSignedUrl | null; error: unknown }>;
    };
  };
};

type Stage = VeroxaPrivateMediaHostInspectionDiagnostics["stage"];

function failed(
  stage: Stage,
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

function statusCode(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const record = error as Record<string, unknown>;
  for (const value of [record.status, record.statusCode]) {
    const parsed = typeof value === "number"
      ? value
      : typeof value === "string" && /^\d{3}$/u.test(value)
        ? Number(value)
        : null;
    if (parsed !== null && Number.isInteger(parsed)) return parsed;
  }
  return null;
}

function storageFailure(
  error: unknown,
  bindingAvailable: boolean,
  fallback: VeroxaPrivateMediaHostInspectionFailureCode =
    "storage_transform_request_rejected",
): VeroxaPrivateMediaHostInspectionResult {
  const status = statusCode(error);
  if (status === 401 || status === 403) {
    return failed("credential", "storage_transform_credential_rejected", {
      bindingAvailable,
    });
  }
  if (status === 429) {
    return failed("rate_limit", "storage_transform_rate_limited", {
      bindingAvailable,
    });
  }
  if (status !== null && status >= 500) {
    return failed("provider", "storage_transform_provider_unavailable", {
      bindingAvailable,
    });
  }
  return failed("request", fallback, { bindingAvailable });
}

function safeOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
        url.hostname.endsWith(".supabase.co") &&
        !url.username && !url.password && !url.port &&
        (url.pathname === "/" || url.pathname === "") && !url.search &&
        !url.hash
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

function safeStoragePath(
  value: string | undefined,
  mimeType: string,
): value is string {
  if (!value || value.length > 500 || value.includes("..") ||
    value.startsWith("/") || value.includes("\\")) return false;
  const extension = mimeType === "image/jpeg" ? "(?:jpg|jpeg)" : "png";
  const restaurant = new RegExp(
    "^restaurants/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-" +
      "[89ab][0-9a-f]{3}-[0-9a-f]{12}/uploads/[0-9]{4}/" +
      "(?:0[1-9]|1[0-2])/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-" +
      `[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.${extension}$`,
    "iu",
  );
  const system = new RegExp(
    `^__veroxa_system/image-inspection-preflight/v1/[0-9a-f]{64}\\.${extension}$`,
    "iu",
  );
  return restaurant.test(value) || system.test(value);
}

function signedTransformPathMatches(url: URL, storagePath: string): boolean {
  const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
  const suffix = `/restaurant-media/${encodedPath}`;
  return Boolean(url.searchParams.get("token")) && [
    "/storage/v1/render/image/sign",
    // Storage may preserve the signed-object route while carrying a transform
    // in its signed token. Both forms remain scoped to this exact object.
    "/storage/v1/object/sign",
  ].some((prefix) => url.pathname === `${prefix}${suffix}`);
}

function storageInfoMatches(input: {
  value: StorageObjectInfo;
  storagePath: string;
  mimeType: string;
  byteLength: number;
  storageObjectId?: string;
  storageObjectVersion?: string;
}): boolean {
  const id = typeof input.value.id === "string" ? input.value.id : "";
  const version = typeof input.value.version === "string"
    ? input.value.version
    : "";
  const name = typeof input.value.name === "string" ? input.value.name : "";
  const bucketId = typeof input.value.bucketId === "string"
    ? input.value.bucketId
    : "";
  const size = typeof input.value.size === "number" ? input.value.size : NaN;
  const contentType = typeof input.value.contentType === "string"
    ? input.value.contentType.split(";", 1)[0].trim()
    : "";
  return Boolean(id && version && name === input.storagePath &&
    bucketId === "restaurant-media" && Number.isSafeInteger(size) &&
    size === input.byteLength && contentType === input.mimeType &&
    (!input.storageObjectId || id.toLowerCase() === input.storageObjectId) &&
    (!input.storageObjectVersion || version === input.storageObjectVersion));
}

async function boundedResponseBytes(response: Response): Promise<Uint8Array | null> {
  if (!response.body) return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) return null;
      total += value.byteLength;
      if (total > ONE_PIXEL_IMAGE_MAXIMUM_BYTES) {
        await reader.cancel("image_transform_response_too_large");
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function declaredContentLength(response: Response): number | null {
  const value = response.headers.get("content-length");
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

async function withinTimeout<T>(
  work: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new StorageTransformTimeoutError()),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export function createVeroxaPrivateMediaStorageImageInspector(input: {
  client: VeroxaStorageImageTransformClient | null;
  supabaseUrl: string | null | undefined;
  timeoutMs?: number;
}): VeroxaPrivateMediaHostInspector {
  const origin = safeOrigin(input.supabaseUrl);
  const bindingAvailable = Boolean(input.client && origin);
  const timeoutMs = Math.max(1_000, Math.min(
    input.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    45_000,
  ));

  return async (source) => {
    if (!input.client) {
      return failed("binding", "storage_transform_binding_unavailable", {
        bindingAvailable: false,
      });
    }
    if (!origin) {
      return failed("credential", "storage_transform_credential_unavailable", {
        bindingAvailable: false,
      });
    }
    if (!safeStoragePath(source.storagePath, source.mimeType)) {
      return failed("request", "storage_transform_path_invalid", {
        bindingAvailable,
      });
    }
    const compatibility = inspectMomoImageBytesForTrustedCompatibility(
      source.bytes,
    );
    if (!compatibility || compatibility.mimeType !== source.mimeType) {
      return failed("source", "storage_transform_source_mismatch", {
        bindingAvailable,
      });
    }
    const info = {
      width: compatibility.width,
      height: compatibility.height,
      fileSize: source.bytes.byteLength,
      format: source.mimeType,
    };
    const bucket = input.client.storage.from("restaurant-media");
    let before: StorageObjectInfo;
    try {
      const result = await withinTimeout(
        bucket.info(source.storagePath),
        timeoutMs,
      );
      if (result.error || !result.data) {
        return storageFailure(result.error, bindingAvailable);
      }
      before = result.data;
    } catch (error) {
      if (error instanceof StorageTransformTimeoutError) {
        return failed("timeout", "storage_transform_timeout", {
          bindingAvailable,
          info,
        });
      }
      return storageFailure(error, bindingAvailable);
    }
    if (!storageInfoMatches({
      value: before,
      storagePath: source.storagePath,
      mimeType: source.mimeType,
      byteLength: source.bytes.byteLength,
      storageObjectId: source.storageObjectId,
      storageObjectVersion: source.storageObjectVersion,
    })) {
      return failed("source", "storage_transform_source_mismatch", {
        bindingAvailable,
        info,
      });
    }

    let signedUrl: URL;
    try {
      const result = await withinTimeout(
        bucket.createSignedUrl(source.storagePath, 60, {
          transform: {
            width: 1,
            height: 1,
            resize: "fill",
            format: "origin",
          },
        }),
        timeoutMs,
      );
      if (result.error || typeof result.data?.signedUrl !== "string") {
        return storageFailure(
          result.error,
          bindingAvailable,
          "storage_transform_signing_failed",
        );
      }
      signedUrl = new URL(result.data.signedUrl, origin);
      if (signedUrl.protocol !== "https:" || signedUrl.origin !== origin ||
        signedUrl.username || signedUrl.password || signedUrl.hash ||
        !signedTransformPathMatches(signedUrl, source.storagePath)) {
        return failed("request", "storage_transform_signing_failed", {
          bindingAvailable,
          info,
        });
      }
    } catch (error) {
      if (error instanceof StorageTransformTimeoutError) {
        return failed("timeout", "storage_transform_timeout", {
          bindingAvailable,
          info,
        });
      }
      return storageFailure(
        error,
        bindingAvailable,
        "storage_transform_signing_failed",
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetch(signedUrl, {
        method: "GET",
        headers: { accept: source.mimeType },
        cache: "no-store",
        credentials: "omit",
        redirect: "error",
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timer);
      if (controller.signal.aborted) {
        return failed("timeout", "storage_transform_timeout", {
          bindingAvailable,
          info,
        });
      }
      return storageFailure(error, bindingAvailable);
    }
    // Keep the deadline active while reading the response body as well as
    // while waiting for headers. A transformed response that stalls after
    // headers is an unavailable dependency, not a successful inspection.
    try {
      const contentType = response.headers.get("content-type")?.split(";", 1)[0]
        .trim() || null;
      const declared = declaredContentLength(response);
      const outputBase = {
        httpStatus: response.status,
        contentType,
        declaredContentLength: declared,
        byteLength: null,
      };
      if (response.status === 401 || response.status === 403) {
        return failed("credential", "storage_transform_credential_rejected", {
          bindingAvailable,
          info,
          output: outputBase,
        });
      }
      if (response.status === 429) {
        return failed("rate_limit", "storage_transform_rate_limited", {
          bindingAvailable,
          info,
          output: outputBase,
        });
      }
      if (response.status >= 500) {
        return failed("provider", "storage_transform_provider_unavailable", {
          bindingAvailable,
          info,
          output: outputBase,
        });
      }
      if (!response.ok) {
        return failed("request", "storage_transform_request_rejected", {
          bindingAvailable,
          info,
          output: outputBase,
        });
      }
      if (contentType !== source.mimeType) {
        return failed("response", "storage_transform_response_content_type_invalid", {
          bindingAvailable,
          info,
          output: outputBase,
        });
      }
      if ((response.headers.has("content-length") && declared === null) ||
        (declared !== null && declared > ONE_PIXEL_IMAGE_MAXIMUM_BYTES)) {
        return failed("response", "storage_transform_response_declared_size_invalid", {
          bindingAvailable,
          info,
          output: outputBase,
        });
      }
      const outputBytes = await boundedResponseBytes(response);
      if (!outputBytes) {
        if (controller.signal.aborted) {
          return failed("timeout", "storage_transform_timeout", {
            bindingAvailable,
            info,
            output: outputBase,
          });
        }
        return failed("response", "storage_transform_response_body_failed", {
          bindingAvailable,
          info,
          output: outputBase,
        });
      }
      const output = { ...outputBase, byteLength: outputBytes.byteLength };
      if (outputBytes.byteLength < ONE_PIXEL_IMAGE_MINIMUM_BYTES ||
        outputBytes.byteLength > ONE_PIXEL_IMAGE_MAXIMUM_BYTES) {
        return failed("response", "storage_transform_response_size_invalid", {
          bindingAvailable,
          info,
          output,
        });
      }
      if (detectMomoImageMimeType(outputBytes) !== source.mimeType) {
        return failed("response", "storage_transform_response_magic_invalid", {
          bindingAvailable,
          info,
          output,
        });
      }
      const outputInspection = await inspectMomoImageBytesFully(outputBytes);
      if (!outputInspection || outputInspection.mimeType !== source.mimeType) {
        return failed("response", "storage_transform_response_decode_invalid", {
          bindingAvailable,
          info,
          output,
        });
      }
      if (outputInspection.width !== 1 || outputInspection.height !== 1) {
        return failed("response", "storage_transform_response_dimensions_invalid", {
          bindingAvailable,
          info,
          output,
        });
      }

      try {
        const result = await withinTimeout(
          bucket.info(source.storagePath),
          timeoutMs,
        );
        if (result.error || !result.data || !storageInfoMatches({
          value: result.data,
          storagePath: source.storagePath,
          mimeType: source.mimeType,
          byteLength: source.bytes.byteLength,
          storageObjectId: source.storageObjectId,
          storageObjectVersion: source.storageObjectVersion,
        }) || !storageInfoMatches({
          value: result.data,
          storagePath: source.storagePath,
          mimeType: source.mimeType,
          byteLength: source.bytes.byteLength,
          storageObjectId: typeof before.id === "string"
            ? before.id.toLowerCase()
            : undefined,
          storageObjectVersion: typeof before.version === "string"
            ? before.version
            : undefined,
        })) {
          return failed("source", "storage_transform_source_mismatch", {
            bindingAvailable,
            info,
            output,
          });
        }
      } catch (error) {
        if (error instanceof StorageTransformTimeoutError) {
          return failed("timeout", "storage_transform_timeout", {
            bindingAvailable,
            info,
            output,
          });
        }
        return failed("source", "storage_transform_source_mismatch", {
          bindingAvailable,
          info,
          output,
        });
      }

      return {
        inspection: {
          width: compatibility.width,
          height: compatibility.height,
          fileSize: source.bytes.byteLength,
        },
        diagnostics: {
          schemaVersion: 1,
          status: "passed",
          stage: "complete",
          failureCode: null,
          bindingAvailable,
          info,
          output,
        },
      };
    } finally {
      clearTimeout(timer);
    }
  };
}

export function createVeroxaPrivateMediaStorageImageDecoder(input: {
  client: VeroxaStorageImageTransformClient | null;
  supabaseUrl: string | null | undefined;
  timeoutMs?: number;
}): VeroxaPrivateMediaHostDecoder {
  const inspect = createVeroxaPrivateMediaStorageImageInspector(input);
  return async (source) => {
    const result = await inspect(source);
    return Boolean(result.inspection &&
      result.inspection.width === source.expectedWidth &&
      result.inspection.height === source.expectedHeight &&
      result.inspection.fileSize === source.bytes.byteLength);
  };
}

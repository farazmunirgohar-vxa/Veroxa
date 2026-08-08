import {
  inspectMomoImageBytesFully,
  momoBytesSha256,
} from "../../../momo-image-bytes.ts";
import { momoCanonicalJson } from "../../../momo-canonical-json.ts";
import {
  MOMO_CONTENT_AI_MAX_SOURCE_HEIGHT,
  MOMO_CONTENT_AI_MAX_SOURCE_WIDTH,
  isMomoContentUuid,
} from "../../../momo-content-ai-contract.ts";
import {
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_ASPECT_RATIO,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_DECODED_PIXELS,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_DIMENSION,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_SOURCE_BYTES,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_ASPECT_RATIO,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_DIMENSION,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_SOURCE_BYTES,
  VEROXA_PRIVATE_MEDIA_MIME_TYPES,
  type VeroxaPrivateMediaMimeType,
} from "../../../veroxa-private-media-assessment.ts";
import { parseMomoMediaFinalizeResult } from "../../../momo-media-finalize-contract.ts";

const MAX_BODY_BYTES = 2_048;
const VERIFIER_VERSION = "veroxa-private-image-byte-verifier-2026-08-08-v1";

type Actor = { role: "team" | "client"; restaurantId: string | null; userId: string };
type ObjectInfo = {
  id: string;
  version: string;
  name: string;
  bucketId: string;
  size: number;
  contentType: string;
};
type ParsedInput = { restaurantId: string; assetId: string; storagePath: string };
type IntakeFailureObservation = {
  storageObjectId: string | null;
  storageObjectVersion: string | null;
  observedContentType: string | null;
  declaredSize: number | null;
  downloadedSize: number | null;
  detectedMime: string | null;
  width: number | null;
  height: number | null;
  contentSha256: string | null;
};

export type MomoMediaFinalizeDependencies = {
  authenticate(): Promise<Actor | null>;
  download(storagePath: string): Promise<Blob>;
  info(storagePath: string): Promise<ObjectInfo>;
  finalize(input: {
    restaurantId: string;
    assetId: string;
    storagePath: string;
    storageObjectId: string;
    storageObjectVersion: string;
    detectedMime: VeroxaPrivateMediaMimeType;
    fileSize: number;
    width: number;
    height: number;
    contentSha256: string;
    verificationSnapshot: Record<string, unknown>;
    verificationCanonical: string;
    verificationSha256: string;
    idempotencyHash: string;
  }): Promise<unknown>;
  recordFailure(input: {
    restaurantId: string;
    assetId: string;
    outcome: "rejected" | "unavailable";
    reasonCodes: string[];
    evidenceSnapshot: Record<string, unknown>;
    evidenceCanonical: string;
    evidenceSha256: string;
    idempotencySha256: string;
  }): Promise<unknown>;
};

class PublicError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

function noStore(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status, headers: {
    "cache-control": "no-store, max-age=0",
    "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
    "x-content-type-options": "nosniff",
  } });
}

function originAllowed(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

async function parse(request: Request): Promise<ParsedInput> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new PublicError("invalid_request", 415);
  const declared = Number(request.headers.get("content-length") || 0);
  if (!Number.isFinite(declared) || declared < 0 || declared > MAX_BODY_BYTES) throw new PublicError("invalid_request", 413);
  let raw = "";
  try { raw = await request.text(); } catch { throw new PublicError("invalid_request", 400); }
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) throw new PublicError("invalid_request", 413);
  let body: unknown;
  try { body = JSON.parse(raw); } catch { throw new PublicError("invalid_request", 400); }
  if (typeof body !== "object" || body === null || Array.isArray(body)) throw new PublicError("invalid_request", 400);
  const value = body as Record<string, unknown>;
  if (Object.keys(value).sort().join(",") !== "assetId,restaurantId,storagePath" ||
    !isMomoContentUuid(value.restaurantId) || !isMomoContentUuid(value.assetId) ||
    typeof value.storagePath !== "string" || value.storagePath.length > 500 ||
    !new RegExp(`^restaurants/${value.restaurantId}/uploads/[0-9]{4}/(0[1-9]|1[0-2])/[0-9a-f-]{36}\\.(jpg|jpeg|png)$`, "u").test(value.storagePath)) throw new PublicError("invalid_request", 400);
  return { restaurantId: value.restaurantId.toLowerCase(), assetId: value.assetId.toLowerCase(), storagePath: value.storagePath };
}

function recordedIntakeFailure(value: unknown, assetId: string): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const result = value as Record<string, unknown>;
  return Object.keys(result).sort().join(",") === "assetId,attemptId,status" &&
    result.status === "recorded" && result.assetId === assetId &&
    isMomoContentUuid(result.attemptId);
}

export function createMomoMediaFinalizeHandler(dependencies: MomoMediaFinalizeDependencies) {
  return async (request: Request): Promise<Response> => {
    let actor: Actor | null = null;
    let input: ParsedInput | null = null;
    let recordable = false;
    const observed: IntakeFailureObservation = {
      storageObjectId: null,
      storageObjectVersion: null,
      observedContentType: null,
      declaredSize: null,
      downloadedSize: null,
      detectedMime: null,
      width: null,
      height: null,
      contentSha256: null,
    };
    try {
      if (!originAllowed(request)) throw new PublicError("cross_site_request_rejected", 403);
      actor = await dependencies.authenticate();
      if (!actor || !actor.restaurantId || !isMomoContentUuid(actor.restaurantId) || !isMomoContentUuid(actor.userId)) throw new PublicError("momo_access_required", 403);
      input = await parse(request);
      if (actor.restaurantId.toLowerCase() !== input.restaurantId) throw new PublicError("momo_access_required", 403);
      recordable = true;
      let blob: Blob;
      let info: ObjectInfo;
      try {
        [blob, info] = await Promise.all([dependencies.download(input.storagePath), dependencies.info(input.storagePath)]);
      } catch {
        throw new PublicError("media_verification_unavailable", 503);
      }
      observed.storageObjectId = isMomoContentUuid(info.id) ? info.id : null;
      observed.storageObjectVersion = info.version && info.version.length <= 200
        ? info.version : null;
      observed.observedContentType = info.contentType.slice(0, 160) || null;
      observed.declaredSize = Number.isSafeInteger(info.size) ? info.size : null;
      observed.downloadedSize = Number.isSafeInteger(blob.size) ? blob.size : null;
      if (!isMomoContentUuid(info.id) || !info.version || info.version.length > 200 || info.bucketId !== "restaurant-media" ||
        info.name !== input.storagePath || !Number.isSafeInteger(info.size) ||
        info.size < VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_SOURCE_BYTES ||
        info.size > VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_SOURCE_BYTES ||
        blob.size !== info.size) throw new PublicError("media_verification_failed", 422);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const inspection = await inspectMomoImageBytesFully(bytes);
      observed.detectedMime = inspection?.mimeType ?? null;
      observed.width = inspection?.width ?? null;
      observed.height = inspection?.height ?? null;
      const aspectRatio = inspection ? inspection.width / inspection.height : 0;
      const expectedExtension = inspection?.mimeType === "image/png"
        ? ".png"
        : ".jpg";
      if (!inspection || !VEROXA_PRIVATE_MEDIA_MIME_TYPES.includes(
        inspection.mimeType as VeroxaPrivateMediaMimeType,
      ) || inspection.width < VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_DIMENSION ||
        inspection.height < VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_DIMENSION ||
        inspection.width > Math.min(
          MOMO_CONTENT_AI_MAX_SOURCE_WIDTH,
          VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_DIMENSION,
        ) || inspection.height > Math.min(
          MOMO_CONTENT_AI_MAX_SOURCE_HEIGHT,
          VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_DIMENSION,
        ) || !Number.isSafeInteger(inspection.width * inspection.height) ||
        inspection.width * inspection.height >
          VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_DECODED_PIXELS ||
        aspectRatio < VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_ASPECT_RATIO ||
        aspectRatio > VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_ASPECT_RATIO ||
        info.contentType.split(";", 1)[0].trim() !== inspection.mimeType ||
        !(inspection.mimeType === "image/jpeg"
          ? /\.(jpg|jpeg)$/u.test(input.storagePath)
          : input.storagePath.endsWith(expectedExtension))) {
        throw new PublicError("media_not_assessable", 422);
      }
      const detectedMime = inspection.mimeType as VeroxaPrivateMediaMimeType;
      const contentSha256 = await momoBytesSha256(bytes);
      observed.contentSha256 = contentSha256;
      const verificationSnapshot = {
        schemaVersion: 3,
        verifierVersion: VERIFIER_VERSION,
        restaurantId: input.restaurantId,
        assetId: input.assetId,
        storagePath: input.storagePath,
        storageObjectId: info.id,
        storageObjectVersion: info.version,
        detectedMime,
        fileSize: bytes.byteLength,
        width: inspection.width,
        height: inspection.height,
        contentSha256,
      };
      const verificationCanonical = momoCanonicalJson(verificationSnapshot);
      const verificationSha256 = await momoBytesSha256(new TextEncoder().encode(verificationCanonical));
      const idempotencyHash = await momoBytesSha256(new TextEncoder().encode(`${input.restaurantId}:${input.assetId}:${info.id}:${info.version}:${contentSha256}`));
      const finalized = parseMomoMediaFinalizeResult(await dependencies.finalize({
        restaurantId: input.restaurantId,
        assetId: input.assetId,
        storagePath: input.storagePath,
        storageObjectId: info.id,
        storageObjectVersion: info.version,
        detectedMime,
        fileSize: bytes.byteLength,
        width: inspection.width,
        height: inspection.height,
        contentSha256,
        verificationSnapshot,
        verificationCanonical,
        verificationSha256,
        idempotencyHash,
      }), input.assetId);
      if (!finalized) throw new PublicError("media_verification_unavailable", 503);
      return noStore({ ...finalized, externalWriteAllowed: false }, 200);
    } catch (error) {
      if (error instanceof PublicError && recordable && actor && input && [
        "media_verification_unavailable",
        "media_verification_failed",
        "media_not_platform_ready",
        "media_not_assessable",
      ].includes(error.code)) {
        const outcome = error.code === "media_verification_unavailable"
          ? "unavailable" as const
          : "rejected" as const;
        const reasonCodes = [error.code];
        const evidenceSnapshot = {
          schemaVersion: 2,
          verifierVersion: VERIFIER_VERSION,
          restaurantId: input.restaurantId,
          assetId: input.assetId,
          storagePath: input.storagePath,
          outcome,
          reasonCodes,
          observed,
        };
        try {
          const evidenceCanonical = momoCanonicalJson(evidenceSnapshot);
          const evidenceSha256 = await momoBytesSha256(
            new TextEncoder().encode(evidenceCanonical),
          );
          const idempotencySha256 = await momoBytesSha256(new TextEncoder().encode(
            `momo-intake-failure-v2:${evidenceSha256}`,
          ));
          const recorded = await dependencies.recordFailure({
            restaurantId: input.restaurantId,
            assetId: input.assetId,
            outcome,
            reasonCodes,
            evidenceSnapshot,
            evidenceCanonical,
            evidenceSha256,
            idempotencySha256,
          });
          if (!recordedIntakeFailure(recorded, input.assetId)) {
            return noStore({ error: "media_verification_unavailable" }, 503);
          }
        } catch {
          return noStore({ error: "media_verification_unavailable" }, 503);
        }
      }
      return error instanceof PublicError
        ? noStore({ error: error.code }, error.status)
        : noStore({ error: "media_verification_unavailable" }, 503);
    }
  };
}

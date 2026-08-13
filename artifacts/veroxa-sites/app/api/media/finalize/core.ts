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
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_DIMENSION,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_SOURCE_BYTES,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_ASPECT_RATIO,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_DIMENSION,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_SOURCE_BYTES,
  VEROXA_PRIVATE_MEDIA_MIME_TYPES,
  type VeroxaPrivateMediaMimeType,
} from "../../../veroxa-private-media-assessment.ts";
import { parseMomoMediaFinalizeResult } from "../../../momo-media-finalize-contract.ts";
import {
  decodeVeroxaPrivateMediaImage,
  type VeroxaPrivateMediaHostDecoder,
} from "../../../veroxa-private-media-image-decode.ts";
import { MomoContentAiLifecycleBridgeError } from
  "../../../momo-content-ai-lifecycle-bridge.ts";
import type { MomoMediaFinalizeFailureReceipt } from
  "../../../momo-media-finalize-contract.ts";

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
type FinalizeCallContext = { correlationId: string };
type IntakeFailureStage =
  | "download"
  | "storage_metadata"
  | "byte_inspection"
  | "trusted_decode"
  | "finalize_bridge";
type IntakeFailureObservation = {
  failureStage: IntakeFailureStage | null;
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
  decodeHighResolutionImage?: VeroxaPrivateMediaHostDecoder;
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
  }, context: FinalizeCallContext): Promise<unknown>;
  recordFailure(input: {
    restaurantId: string;
    assetId: string;
    failureStage: IntakeFailureStage;
    errorCode: string;
    outcome: "rejected" | "unavailable";
    reasonCodes: string[];
    evidenceSnapshot: Record<string, unknown>;
    evidenceCanonical: string;
    evidenceSha256: string;
    idempotencySha256: string;
  }, context: FinalizeCallContext): Promise<unknown>;
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

function noStore(
  body: Record<string, unknown>,
  status: number,
  correlationId: string,
): Response {
  return Response.json(body, { status, headers: {
    "cache-control": "no-store, max-age=0",
    "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
    "x-content-type-options": "nosniff",
    "x-veroxa-correlation-id": correlationId,
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

function recordedIntakeFailure(
  value: unknown,
  assetId: string,
): { attemptId: string; durableCorrelationId: string } | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const result = value as Record<string, unknown>;
  return Object.keys(result).sort().join(",") ===
      "assetId,attemptId,durableCorrelationId,status" &&
    result.status === "recorded" && result.assetId === assetId &&
    isMomoContentUuid(result.attemptId) &&
    isMomoContentUuid(result.durableCorrelationId)
    ? {
      attemptId: result.attemptId.toLowerCase(),
      durableCorrelationId: result.durableCorrelationId.toLowerCase(),
    }
    : null;
}

function unconfirmedFailureReceipt(
  correlationId: string,
): MomoMediaFinalizeFailureReceipt {
  return {
    status: "exception_recording_unconfirmed",
    attemptId: null,
    recoveryOwner: null,
    clientActionRequired: false,
    correlationId,
    durableCorrelationId: null,
  };
}

export function createMomoMediaFinalizeHandler(dependencies: MomoMediaFinalizeDependencies) {
  return async (request: Request): Promise<Response> => {
    const requestedCorrelationId = request.headers.get(
      "x-veroxa-correlation-id",
    );
    const correlationId = isMomoContentUuid(requestedCorrelationId)
      ? requestedCorrelationId.toLowerCase()
      : crypto.randomUUID();
    let actor: Actor | null = null;
    let input: ParsedInput | null = null;
    let recordable = false;
    const observed: IntakeFailureObservation = {
      failureStage: null,
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
      observed.failureStage = "download";
      let blob: Blob;
      let info: ObjectInfo;
      try {
        [blob, info] = await Promise.all([dependencies.download(input.storagePath), dependencies.info(input.storagePath)]);
      } catch {
        observed.failureStage = "download";
        throw new PublicError("media_verification_unavailable", 503);
      }
      observed.storageObjectId = isMomoContentUuid(info.id) ? info.id : null;
      observed.storageObjectVersion = info.version && info.version.length <= 200
        ? info.version : null;
      observed.observedContentType = info.contentType.slice(0, 160) || null;
      observed.declaredSize = Number.isSafeInteger(info.size) ? info.size : null;
      observed.downloadedSize = Number.isSafeInteger(blob.size) ? blob.size : null;
      observed.failureStage = "storage_metadata";
      if (!isMomoContentUuid(info.id) || !info.version || info.version.length > 200 || info.bucketId !== "restaurant-media" ||
        info.name !== input.storagePath || !Number.isSafeInteger(info.size) ||
        info.size < VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_SOURCE_BYTES ||
        info.size > VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_SOURCE_BYTES ||
        blob.size !== info.size) {
        observed.failureStage = "storage_metadata";
        throw new PublicError("media_verification_failed", 422);
      }
      observed.failureStage = "byte_inspection";
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
        aspectRatio < VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_ASPECT_RATIO ||
        aspectRatio > VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_ASPECT_RATIO ||
        info.contentType.split(";", 1)[0].trim() !== inspection.mimeType ||
        !(inspection.mimeType === "image/jpeg"
          ? /\.(jpg|jpeg)$/u.test(input.storagePath)
          : input.storagePath.endsWith(expectedExtension))) {
        observed.failureStage = "byte_inspection";
        throw new PublicError("media_not_assessable", 422);
      }
      const detectedMime = inspection.mimeType as VeroxaPrivateMediaMimeType;
      observed.failureStage = "trusted_decode";
      if (!await decodeVeroxaPrivateMediaImage({
        bytes,
        mimeType: detectedMime,
        expectedWidth: inspection.width,
        expectedHeight: inspection.height,
        hostDecoder: dependencies.decodeHighResolutionImage,
      })) {
        observed.failureStage = "trusted_decode";
        throw new PublicError("media_not_assessable", 422);
      }
      observed.failureStage = "byte_inspection";
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
      observed.failureStage = "finalize_bridge";
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
      }, { correlationId }), input.assetId);
      if (!finalized) {
        observed.failureStage = "finalize_bridge";
        throw new PublicError("media_verification_unavailable", 503);
      }
      return noStore(
        { ...finalized, externalWriteAllowed: false },
        200,
        correlationId,
      );
    } catch (error) {
      const publicError = error instanceof PublicError
        ? error
        : new PublicError("media_verification_unavailable", 503);
      if (error instanceof MomoContentAiLifecycleBridgeError) {
        observed.failureStage = "finalize_bridge";
      } else if (!observed.failureStage && !(error instanceof PublicError)) {
        observed.failureStage = "finalize_bridge";
      }
      if (recordable && actor && input && [
        "media_verification_unavailable",
        "media_verification_failed",
        "media_not_platform_ready",
        "media_not_assessable",
      ].includes(publicError.code)) {
        const outcome = publicError.code === "media_verification_unavailable"
          ? "unavailable" as const
          : "rejected" as const;
        const reasonCodes = [publicError.code];
        const evidenceSnapshot = {
          schemaVersion: 2,
          verifierVersion: VERIFIER_VERSION,
          correlationId,
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
            failureStage: observed.failureStage ?? "finalize_bridge",
            errorCode: publicError.code,
            outcome,
            reasonCodes,
            evidenceSnapshot,
            evidenceCanonical,
            evidenceSha256,
            idempotencySha256,
          }, { correlationId });
          const durableReceipt = recordedIntakeFailure(recorded, input.assetId);
          if (!durableReceipt) {
            return noStore({
              error: "media_verification_unavailable",
              receipt: unconfirmedFailureReceipt(correlationId),
              externalWriteAllowed: false,
            }, 503, correlationId);
          }
          const receipt: MomoMediaFinalizeFailureReceipt = {
            status: "team_exception_recorded",
            attemptId: durableReceipt.attemptId,
            recoveryOwner: "veroxa_team",
            clientActionRequired: false,
            correlationId,
            durableCorrelationId: durableReceipt.durableCorrelationId,
          };
          return noStore({
            error: publicError.code,
            receipt,
            externalWriteAllowed: false,
          }, publicError.status, correlationId);
        } catch {
          return noStore({
            error: "media_verification_unavailable",
            receipt: unconfirmedFailureReceipt(correlationId),
            externalWriteAllowed: false,
          }, 503, correlationId);
        }
      }
      return noStore(
        { error: publicError.code },
        publicError.status,
        correlationId,
      );
    }
  };
}

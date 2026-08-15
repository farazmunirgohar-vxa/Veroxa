import {
  detectMomoImageMimeType,
  inspectMomoImageBytesFully,
  momoBytesSha256,
} from "../../../../../momo-image-bytes.ts";
import { momoCanonicalJson } from "../../../../../momo-canonical-json.ts";
import {
  MOMO_CONTENT_AI_MAX_SOURCE_HEIGHT,
  MOMO_CONTENT_AI_MAX_SOURCE_WIDTH,
  isMomoContentUuid,
} from "../../../../../momo-content-ai-contract.ts";
import {
  parseMomoMediaFinalizeResult,
  type MomoMediaFinalizeResult,
} from "../../../../../momo-media-finalize-contract.ts";
import {
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_ASPECT_RATIO,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_DIMENSION,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_SOURCE_BYTES,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_ASPECT_RATIO,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_DIMENSION,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_SOURCE_BYTES,
  VEROXA_PRIVATE_MEDIA_MIME_TYPES,
  type VeroxaPrivateMediaMimeType,
} from "../../../../../veroxa-private-media-assessment.ts";
import {
  decodeVeroxaPrivateMediaImage,
  type VeroxaPrivateMediaHostDecoder,
  type VeroxaPrivateMediaHostInspector,
} from "../../../../../veroxa-private-media-image-decode.ts";

const CANONICAL_RECOVERY_BODY = '{"schemaVersion":1}';
const RECOVERY_CONTEXT =
  "veroxa:momo-media-ingestion-recovery-wake:v1\nPOST\n/api/internal/momo/media/recover";
const VERIFIER_VERSION = "veroxa-private-image-byte-verifier-2026-08-08-v1";
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const HMAC = /^[0-9a-f]{64}$/u;
const MAX_WAKE_BYTES = 1_024;
const MAX_STORAGE_VERSION_LENGTH = 200;
const EXACT_WAKE_JSON =
  /^\{[\t\n\r ]*"schemaVersion"[\t\n\r ]*:[\t\n\r ]*1[\t\n\r ]*\}$/u;

type MediaRecoveryClaim = {
  outboxId: string;
  restaurantId: string;
  assetId: string;
  storagePath: string;
  storageObjectId: string | null;
  storageObjectVersion: string | null;
  declaredMime: VeroxaPrivateMediaMimeType;
  declaredFileSize: number;
  actorId: string;
  correlationId: string;
  leaseToken: string;
  attemptCount: number;
};

type ObjectInfo = {
  id: string;
  version: string;
  name: string;
  bucketId: string;
  size: number;
  contentType: string;
};

type FailureObservation = {
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

export type MomoMediaRecoveryDependencies = {
  configured: boolean;
  wakeHmacSecret: string;
  randomUUID(): string;
  decodeHighResolutionImage?: VeroxaPrivateMediaHostDecoder;
  inspectImageWithHost?: VeroxaPrivateMediaHostInspector;
  claim(input: {
    wakeNonce: string;
    signedAtMs: number;
    leaseToken: string;
  }): Promise<unknown>;
  download(storagePath: string): Promise<Blob>;
  info(storagePath: string): Promise<ObjectInfo>;
  complete(input: {
    outboxId: string;
    leaseToken: string;
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
  fail(input: {
    outboxId: string;
    leaseToken: string;
    failureCode: string;
    retryable: boolean;
    evidenceSnapshot: Record<string, unknown>;
    evidenceCanonical: string;
    evidenceSha256: string;
    idempotencySha256: string;
  }): Promise<unknown>;
};

class RecoveryRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

class RecoveryProcessingError extends Error {
  readonly code: string;
  readonly retryable: boolean;

  constructor(code: string, retryable: boolean) {
    super(code);
    this.code = code;
    this.retryable = retryable;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length &&
    actual.every((key, index) => key === expected[index]);
}

function noStore(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
      "x-content-type-options": "nosniff",
    },
  });
}

function hexBytes(value: string): Uint8Array<ArrayBuffer> {
  const result = new Uint8Array(new ArrayBuffer(value.length / 2));
  for (let index = 0; index < value.length; index += 2) {
    result[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return result;
}

async function boundedText(request: Request): Promise<string | null> {
  const declaredHeader = request.headers.get("content-length");
  const declared = declaredHeader === null ? null : Number(declaredHeader);
  if (declared !== null && (!Number.isSafeInteger(declared) || declared < 0 ||
    declared > MAX_WAKE_BYTES) || !request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) return null;
      total += value.byteLength;
      if (total > MAX_WAKE_BYTES) {
        await reader.cancel("request_too_large");
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
  if (total < 2 || (declared !== null && declared !== total)) return null;
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

async function verifiedWake(
  request: Request,
  secret: string,
): Promise<{ wakeNonce: string; signedAtMs: number }> {
  if (request.method !== "POST") {
    throw new RecoveryRequestError("method_not_allowed", 405);
  }
  const url = new URL(request.url);
  if (url.pathname !== "/api/internal/momo/media/recover" || url.search ||
    url.hash || !/^application\/json(?:[\t ]*;|$)/iu.test(
      request.headers.get("content-type")?.trim() || "",
    )) {
    throw new RecoveryRequestError("invalid_request", 400);
  }
  const raw = await boundedText(request);
  if (!raw) {
    throw new RecoveryRequestError("invalid_request", 400);
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new RecoveryRequestError("invalid_request", 400);
  }
  // pg_net accepts JSONB and emits its normalized wire representation. Keep
  // the accepted shape exact while signing the whitespace-free canonical form.
  if (!EXACT_WAKE_JSON.test(raw) || !isRecord(body) ||
    !exactKeys(body, ["schemaVersion"]) ||
    body.schemaVersion !== 1) {
    throw new RecoveryRequestError("invalid_request", 400);
  }
  const timestampText =
    request.headers.get("x-veroxa-media-ingestion-timestamp-ms")?.trim() || "";
  const nonce =
    request.headers.get("x-veroxa-media-ingestion-nonce")?.trim() || "";
  const signature =
    request.headers.get("x-veroxa-media-ingestion-signature")?.trim() || "";
  const timestamp = Number(timestampText);
  if (!/^\d{13}$/u.test(timestampText) || !Number.isSafeInteger(timestamp) ||
    Math.abs(Date.now() - timestamp) > 60_000 || !UUID.test(nonce) ||
    !HMAC.test(signature) || !HMAC.test(secret)) {
    throw new RecoveryRequestError("media_recovery_access_required", 403);
  }
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      hexBytes(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const message = new TextEncoder().encode(
      `${RECOVERY_CONTEXT}\n${timestampText}\n${nonce}\n${CANONICAL_RECOVERY_BODY}`,
    );
    if (!await crypto.subtle.verify(
      "HMAC",
      key,
      hexBytes(signature),
      message,
    )) throw new Error("invalid_signature");
  } catch {
    throw new RecoveryRequestError("media_recovery_access_required", 403);
  }
  return { wakeNonce: nonce.toLowerCase(), signedAtMs: timestamp };
}

function safeInteger(value: unknown): number | null {
  const number = typeof value === "string" && /^\d{1,16}$/u.test(value)
    ? Number(value)
    : value;
  return typeof number === "number" && Number.isSafeInteger(number)
    ? number
    : null;
}

function recoveryClaim(
  value: unknown,
  expectedLeaseToken: string,
): MediaRecoveryClaim | null {
  if (Array.isArray(value) && value.length !== 1) return null;
  const row = Array.isArray(value) ? value[0] : value;
  if (!isRecord(row) || !exactKeys(row, [
    "outbox_id",
    "restaurant_id",
    "asset_id",
    "storage_path",
    "storage_object_id",
    "storage_object_version",
    "declared_mime_type",
    "declared_file_size",
    "actor_id",
    "correlation_id",
    "lease_token",
    "attempt_count",
    "external_write_allowed",
  ])) return null;
  const restaurantId = String(row.restaurant_id || "").toLowerCase();
  const assetId = String(row.asset_id || "").toLowerCase();
  const outboxId = String(row.outbox_id || "").toLowerCase();
  const storageObjectId = row.storage_object_id === null
    ? null
    : String(row.storage_object_id || "").toLowerCase();
  const storageObjectVersion = row.storage_object_version === null
    ? null
    : String(row.storage_object_version || "");
  const actorId = String(row.actor_id || "").toLowerCase();
  const correlationId = String(row.correlation_id || "").toLowerCase();
  const leaseToken = String(row.lease_token || "").toLowerCase();
  const fileSize = safeInteger(row.declared_file_size);
  const attemptCount = safeInteger(row.attempt_count);
  if (!isMomoContentUuid(restaurantId) || !isMomoContentUuid(assetId) ||
    !isMomoContentUuid(outboxId) ||
    (storageObjectId !== null && !isMomoContentUuid(storageObjectId)) ||
    !isMomoContentUuid(actorId) || !isMomoContentUuid(correlationId) ||
    !isMomoContentUuid(leaseToken) || leaseToken !== expectedLeaseToken ||
    typeof row.storage_path !== "string" || row.storage_path.length > 500 ||
    !new RegExp(
      `^restaurants/${restaurantId}/uploads/[0-9]{4}/(0[1-9]|1[0-2])/` +
        "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-" +
        "[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.(jpg|jpeg|png)$",
      "u",
    ).test(row.storage_path) ||
    (storageObjectVersion !== null &&
      (storageObjectVersion.length < 1 ||
        storageObjectVersion.length > MAX_STORAGE_VERSION_LENGTH)) ||
    (storageObjectId === null) !== (storageObjectVersion === null) ||
    !VEROXA_PRIVATE_MEDIA_MIME_TYPES.includes(
      row.declared_mime_type as VeroxaPrivateMediaMimeType,
    ) || fileSize === null ||
    fileSize < VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_SOURCE_BYTES ||
    fileSize > VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_SOURCE_BYTES ||
    attemptCount === null || attemptCount < 1 || attemptCount > 20 ||
    row.external_write_allowed !== false) return null;
  return {
    outboxId,
    restaurantId,
    assetId,
    storagePath: row.storage_path,
    storageObjectId,
    storageObjectVersion,
    declaredMime: row.declared_mime_type as VeroxaPrivateMediaMimeType,
    declaredFileSize: fileSize,
    actorId,
    correlationId,
    leaseToken,
    attemptCount,
  };
}

function completedRecovery(
  value: unknown,
  claim: MediaRecoveryClaim,
): MomoMediaFinalizeResult | null {
  if (Array.isArray(value) && value.length !== 1) return null;
  const row = Array.isArray(value) ? value[0] : value;
  if (!isRecord(row) || !exactKeys(row, [
    "outbox_id",
    "asset_id",
    "verification_id",
    "status",
    "canonical_asset_id",
    "duplicate_asset_id",
    "correlation_id",
    "external_write_allowed",
  ]) || String(row.outbox_id).toLowerCase() !== claim.outboxId ||
    String(row.asset_id).toLowerCase() !== claim.assetId ||
    String(row.correlation_id).toLowerCase() !== claim.correlationId ||
    row.external_write_allowed !== false) return null;
  return parseMomoMediaFinalizeResult({
    verificationId: row.verification_id,
    status: row.status,
    canonicalAssetId: row.canonical_asset_id,
    duplicateAssetId: row.duplicate_asset_id,
  }, claim.assetId);
}

function recordedFailure(
  value: unknown,
  claim: MediaRecoveryClaim,
  failure: RecoveryProcessingError,
): "retry_wait" | "dead_letter" | null {
  if (Array.isArray(value) && value.length !== 1) return null;
  const row = Array.isArray(value) ? value[0] : value;
  if (!isRecord(row) || !exactKeys(row, [
    "outbox_id",
    "asset_id",
    "status",
    "failure_code",
    "correlation_id",
    "incident_id",
    "external_write_allowed",
  ]) || String(row.outbox_id).toLowerCase() !== claim.outboxId ||
    String(row.asset_id).toLowerCase() !== claim.assetId ||
    String(row.correlation_id).toLowerCase() !== claim.correlationId ||
    !isMomoContentUuid(row.incident_id) || row.failure_code !== failure.code ||
    row.external_write_allowed !== false ||
    (row.status !== "retry_wait" && row.status !== "dead_letter") ||
    (!failure.retryable && row.status !== "dead_letter")) return null;
  // A retryable failure may still become terminal when its bounded attempt
  // budget is exhausted. The database owns that authoritative transition.
  return row.status;
}

function storageMetadataFailure(
  claim: MediaRecoveryClaim,
  info: ObjectInfo,
): RecoveryProcessingError | null {
  const observedMime = info.contentType.split(";", 1)[0].trim();
  if (!isMomoContentUuid(info.id) ||
    (claim.storageObjectId !== null && info.id.toLowerCase() !==
      claim.storageObjectId) ||
    (claim.storageObjectVersion !== null &&
      info.version !== claim.storageObjectVersion) ||
    info.bucketId !== "restaurant-media" || info.name !== claim.storagePath ||
    !Number.isSafeInteger(info.size) || info.size !== claim.declaredFileSize ||
    info.size > VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_SOURCE_BYTES ||
    observedMime !== claim.declaredMime) {
    return new RecoveryProcessingError(
      "media_recovery_storage_object_mismatch",
      false,
    );
  }
  return null;
}

function processingError(error: unknown): RecoveryProcessingError {
  return error instanceof RecoveryProcessingError
    ? error
    : new RecoveryProcessingError("media_recovery_internal_unavailable", true);
}

export function createMomoMediaRecoveryHandler(
  dependencies: MomoMediaRecoveryDependencies,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    let wake: { wakeNonce: string; signedAtMs: number };
    try {
      wake = await verifiedWake(request, dependencies.wakeHmacSecret);
    } catch (error) {
      if (error instanceof RecoveryRequestError) {
        return noStore({ error: error.message }, error.status);
      }
      return noStore({ error: "invalid_request" }, 400);
    }
    if (!dependencies.configured) {
      return noStore({ error: "media_recovery_unavailable" }, 503);
    }

    const leaseToken = dependencies.randomUUID().toLowerCase();
    if (!isMomoContentUuid(leaseToken)) {
      return noStore({ error: "media_recovery_unavailable" }, 503);
    }
    let rawClaim: unknown;
    try {
      rawClaim = await dependencies.claim({ ...wake, leaseToken });
    } catch {
      return noStore({ error: "media_recovery_claim_unavailable" }, 503);
    }
    if (rawClaim === null || rawClaim === undefined ||
      (Array.isArray(rawClaim) && rawClaim.length === 0)) {
      return noStore({ status: "idle", externalWriteAllowed: false }, 200);
    }
    const claim = recoveryClaim(rawClaim, leaseToken);
    if (!claim) {
      return noStore({ error: "media_recovery_claim_invalid" }, 503);
    }

    const observed: FailureObservation = {
      storageObjectId: null,
      storageObjectVersion: null,
      observedContentType: null,
      declaredSize: claim.declaredFileSize,
      downloadedSize: null,
      detectedMime: null,
      width: null,
      height: null,
      contentSha256: null,
    };
    try {
      if (claim.storageObjectId === null ||
        claim.storageObjectVersion === null) {
        throw new RecoveryProcessingError(
          "media_recovery_storage_object_missing",
          false,
        );
      }
      let info: ObjectInfo;
      try {
        info = await dependencies.info(claim.storagePath);
      } catch {
        throw new RecoveryProcessingError(
          "media_recovery_storage_unavailable",
          true,
        );
      }
      observed.storageObjectId = isMomoContentUuid(info.id)
        ? info.id.toLowerCase()
        : null;
      observed.storageObjectVersion = info.version?.slice(
        0,
        MAX_STORAGE_VERSION_LENGTH,
      ) || null;
      observed.observedContentType = info.contentType?.slice(0, 160) || null;
      const metadataFailure = storageMetadataFailure(claim, info);
      if (metadataFailure) throw metadataFailure;

      let blob: Blob;
      try {
        blob = await dependencies.download(claim.storagePath);
      } catch {
        throw new RecoveryProcessingError(
          "media_recovery_storage_unavailable",
          true,
        );
      }
      observed.downloadedSize = Number.isSafeInteger(blob.size)
        ? blob.size
        : null;
      if (blob.size !== info.size) {
        throw new RecoveryProcessingError(
          "media_recovery_storage_object_mismatch",
          false,
        );
      }

      let bytes: Uint8Array;
      try {
        bytes = new Uint8Array(await blob.arrayBuffer());
      } catch {
        throw new RecoveryProcessingError(
          "media_recovery_storage_unavailable",
          true,
        );
      }
      const magicMime = detectMomoImageMimeType(bytes);
      observed.detectedMime = magicMime;
      let inspection = await inspectMomoImageBytesFully(bytes);
      let hostDecoded = false;
      if (!inspection &&
        (magicMime === "image/jpeg" || magicMime === "image/png") &&
        dependencies.inspectImageWithHost) {
        const hostInspection = await dependencies.inspectImageWithHost({
          bytes,
          mimeType: magicMime,
        });
        if (hostInspection) {
          observed.width = hostInspection.width;
          observed.height = hostInspection.height;
          if (hostInspection.fileSize === bytes.byteLength) {
            inspection = {
              mimeType: magicMime,
              width: hostInspection.width,
              height: hostInspection.height,
            };
            hostDecoded = true;
          }
        }
      }
      observed.width = inspection?.width ?? null;
      observed.height = inspection?.height ?? null;
      const aspectRatio = inspection ? inspection.width / inspection.height : 0;
      const extensionMatches = inspection?.mimeType === "image/jpeg"
        ? /\.(jpg|jpeg)$/u.test(claim.storagePath)
        : inspection?.mimeType === "image/png" &&
          claim.storagePath.endsWith(".png");
      if (!inspection || !VEROXA_PRIVATE_MEDIA_MIME_TYPES.includes(
        inspection.mimeType as VeroxaPrivateMediaMimeType,
      ) || inspection.mimeType !== claim.declaredMime || !extensionMatches ||
        inspection.width < VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_DIMENSION ||
        inspection.height < VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_DIMENSION ||
        inspection.width > Math.min(
          MOMO_CONTENT_AI_MAX_SOURCE_WIDTH,
          VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_DIMENSION,
        ) || inspection.height > Math.min(
          MOMO_CONTENT_AI_MAX_SOURCE_HEIGHT,
          VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_DIMENSION,
        ) || !Number.isSafeInteger(inspection.width * inspection.height) ||
        aspectRatio < VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_ASPECT_RATIO ||
        aspectRatio > VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_ASPECT_RATIO) {
        throw new RecoveryProcessingError("media_not_assessable", false);
      }
      const detectedMime = inspection.mimeType as VeroxaPrivateMediaMimeType;
      if (!hostDecoded && !await decodeVeroxaPrivateMediaImage({
        bytes,
        mimeType: detectedMime,
        expectedWidth: inspection.width,
        expectedHeight: inspection.height,
        hostDecoder: dependencies.decodeHighResolutionImage,
      })) {
        throw new RecoveryProcessingError("media_not_assessable", false);
      }

      const contentSha256 = await momoBytesSha256(bytes);
      observed.contentSha256 = contentSha256;
      const verificationSnapshot = {
        schemaVersion: 3,
        verifierVersion: VERIFIER_VERSION,
        restaurantId: claim.restaurantId,
        assetId: claim.assetId,
        storagePath: claim.storagePath,
        storageObjectId: info.id.toLowerCase(),
        storageObjectVersion: info.version,
        detectedMime,
        fileSize: bytes.byteLength,
        width: inspection.width,
        height: inspection.height,
        contentSha256,
      };
      const verificationCanonical = momoCanonicalJson(verificationSnapshot);
      const verificationSha256 = await momoBytesSha256(
        new TextEncoder().encode(verificationCanonical),
      );
      const idempotencyHash = await momoBytesSha256(new TextEncoder().encode(
        `${claim.restaurantId}:${claim.assetId}:${info.id.toLowerCase()}:${info.version}:${contentSha256}`,
      ));
      let rawCompleted: unknown;
      try {
        rawCompleted = await dependencies.complete({
          outboxId: claim.outboxId,
          leaseToken: claim.leaseToken,
          storageObjectId: info.id.toLowerCase(),
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
        });
      } catch {
        throw new RecoveryProcessingError(
          "media_recovery_completion_unavailable",
          true,
        );
      }
      const finalized = completedRecovery(rawCompleted, claim);
      if (!finalized) {
        throw new RecoveryProcessingError(
          "media_recovery_completion_invalid",
          true,
        );
      }
      return noStore({
        recoveryStatus: "recovered",
        verificationId: finalized.verificationId,
        status: finalized.status,
        canonicalAssetId: finalized.canonicalAssetId,
        duplicateAssetId: finalized.duplicateAssetId,
        externalWriteAllowed: false,
      }, 200);
    } catch (error) {
      const failure = processingError(error);
      const evidenceSnapshot = {
        schemaVersion: 1,
        verifierVersion: VERIFIER_VERSION,
        outboxId: claim.outboxId,
        correlationId: claim.correlationId,
        restaurantId: claim.restaurantId,
        assetId: claim.assetId,
        originalActorId: claim.actorId,
        storagePath: claim.storagePath,
        storageObjectId: claim.storageObjectId,
        storageObjectVersion: claim.storageObjectVersion,
        attemptCount: claim.attemptCount,
        failureCode: failure.code,
        retryable: failure.retryable,
        observed,
        externalWriteAllowed: false,
      };
      try {
        const evidenceCanonical = momoCanonicalJson(evidenceSnapshot);
        const evidenceSha256 = await momoBytesSha256(
          new TextEncoder().encode(evidenceCanonical),
        );
        const idempotencySha256 = await momoBytesSha256(
          new TextEncoder().encode(
            `momo-media-recovery-failure-v1:${claim.outboxId}:${claim.attemptCount}:${evidenceSha256}`,
          ),
        );
        const rawFailure = await dependencies.fail({
          outboxId: claim.outboxId,
          leaseToken: claim.leaseToken,
          failureCode: failure.code,
          retryable: failure.retryable,
          evidenceSnapshot,
          evidenceCanonical,
          evidenceSha256,
          idempotencySha256,
        });
        const failureStatus = recordedFailure(rawFailure, claim, failure);
        if (!failureStatus) {
          return noStore({
            error: "media_recovery_failure_recording_unavailable",
          }, 503);
        }
        return failureStatus === "retry_wait"
          ? noStore({ error: "media_recovery_retry_scheduled" }, 503)
          : noStore({
            status: "failed",
            assetId: claim.assetId,
            error: failure.code,
            externalWriteAllowed: false,
          }, 200);
      } catch {
        return noStore({
          error: "media_recovery_failure_recording_unavailable",
        }, 503);
      }
    }
  };
}

export const momoMediaRecoveryWakeCanonicalBody = CANONICAL_RECOVERY_BODY;
export const momoMediaRecoveryWakeContext = RECOVERY_CONTEXT;

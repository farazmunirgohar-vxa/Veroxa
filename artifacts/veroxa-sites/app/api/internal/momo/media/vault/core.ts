import { momoBytesSha256 } from "../../../../../momo-image-bytes.ts";
import { momoCanonicalJson } from "../../../../../momo-canonical-json.ts";
import { isMomoContentUuid } from
  "../../../../../momo-content-ai-contract.ts";
import {
  VeroxaMediaVaultError,
  type VeroxaMediaVaultReceipt,
} from "../../../../../momo-media-vault.ts";
import {
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_SOURCE_BYTES,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_SOURCE_BYTES,
  VEROXA_PRIVATE_MEDIA_MIME_TYPES,
  type VeroxaPrivateMediaMimeType,
} from "../../../../../veroxa-private-media-assessment.ts";

const CANONICAL_BODY = '{"schemaVersion":1}';
const WAKE_CONTEXT =
  "veroxa:momo-private-media-vault-wake:v1\nPOST\n/api/internal/momo/media/vault";
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const SHA256 = /^[0-9a-f]{64}$/u;
const HMAC = /^[0-9a-f]{64}$/u;
const EXACT_BODY =
  /^\{[\t\n\r ]*"schemaVersion"[\t\n\r ]*:[\t\n\r ]*1[\t\n\r ]*\}$/u;
const MAX_BODY_BYTES = 1_024;

type VaultClaim = {
  outboxId: string;
  restaurantId: string;
  assetId: string;
  intakeId: string;
  storagePath: string;
  storageObjectId: string;
  storageObjectVersion: string;
  mimeType: VeroxaPrivateMediaMimeType;
  fileSize: number;
  contentSha256: string;
  correlationId: string;
  leaseToken: string;
  attemptCount: number;
};

type SourceObjectInfo = {
  id: string;
  version: string;
  name: string;
  bucketId: string;
  size: number;
  contentType: string;
};

export type MomoMediaVaultDependencies = {
  configured: boolean;
  wakeHmacSecret: string;
  randomUUID(): string;
  claim(input: {
    wakeNonce: string;
    signedAtMs: number;
    leaseToken: string;
  }): Promise<unknown>;
  download(storagePath: string): Promise<Blob>;
  info(storagePath: string): Promise<SourceObjectInfo>;
  archive(input: {
    restaurantId: string;
    assetId: string;
    sourceStorageObjectId: string;
    sourceStorageObjectVersion: string;
    mimeType: VeroxaPrivateMediaMimeType;
    contentSha256: string;
    bytes: Uint8Array;
  }): Promise<VeroxaMediaVaultReceipt>;
  complete(input: {
    outboxId: string;
    leaseToken: string;
    vaultKey: string;
    vaultVersion: string;
    vaultEtag: string;
    fileSize: number;
    contentSha256: string;
    verificationSnapshot: Record<string, unknown>;
    verificationCanonical: string;
    verificationSha256: string;
  }): Promise<unknown>;
  fail(input: {
    outboxId: string;
    leaseToken: string;
    failureCode: string;
    retryable: boolean;
    evidenceSnapshot: Record<string, unknown>;
    evidenceCanonical: string;
    evidenceSha256: string;
  }): Promise<unknown>;
};

class VaultRequestError extends Error {
  readonly status: number;
  constructor(code: string, status: number) {
    super(code);
    this.status = status;
  }
}

class VaultProcessingError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  constructor(code: string, retryable: boolean) {
    super(code);
    this.code = code;
    this.retryable = retryable;
  }
}

function response(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status, headers: {
    "cache-control": "no-store, max-age=0",
    "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
    "x-content-type-options": "nosniff",
  } });
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length &&
    actual.every((key, index) => key === expected[index]);
}

function hexBytes(value: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(value.length / 2));
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return bytes;
}

async function requestBody(request: Request): Promise<string | null> {
  const declaredHeader = request.headers.get("content-length");
  const declared = declaredHeader === null ? null : Number(declaredHeader);
  if (declared !== null && (!Number.isSafeInteger(declared) || declared < 0 ||
    declared > MAX_BODY_BYTES)) return null;
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return null;
  }
  const size = new TextEncoder().encode(raw).byteLength;
  return size >= 2 && size <= MAX_BODY_BYTES &&
      (declared === null || declared === size)
    ? raw
    : null;
}

async function verifyWake(
  request: Request,
  secret: string,
): Promise<{ wakeNonce: string; signedAtMs: number }> {
  if (request.method !== "POST") {
    throw new VaultRequestError("method_not_allowed", 405);
  }
  const url = new URL(request.url);
  if (url.pathname !== "/api/internal/momo/media/vault" || url.search ||
    url.hash || !/^application\/json(?:[\t ]*;|$)/iu.test(
      request.headers.get("content-type")?.trim() || "",
    )) throw new VaultRequestError("invalid_request", 400);
  const raw = await requestBody(request);
  let body: unknown;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    throw new VaultRequestError("invalid_request", 400);
  }
  if (!raw || !EXACT_BODY.test(raw) || !record(body) ||
    !exactKeys(body, ["schemaVersion"]) || body.schemaVersion !== 1) {
    throw new VaultRequestError("invalid_request", 400);
  }
  const timestampText =
    request.headers.get("x-veroxa-media-vault-timestamp-ms")?.trim() || "";
  const nonce =
    request.headers.get("x-veroxa-media-vault-nonce")?.trim() || "";
  const signature =
    request.headers.get("x-veroxa-media-vault-signature")?.trim() || "";
  const timestamp = Number(timestampText);
  if (!/^\d{13}$/u.test(timestampText) || !Number.isSafeInteger(timestamp) ||
    Math.abs(Date.now() - timestamp) > 60_000 || !UUID.test(nonce) ||
    !HMAC.test(signature) || !HMAC.test(secret)) {
    throw new VaultRequestError("media_vault_access_required", 403);
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
      `${WAKE_CONTEXT}\n${timestampText}\n${nonce}\n${CANONICAL_BODY}`,
    );
    if (!await crypto.subtle.verify(
      "HMAC",
      key,
      hexBytes(signature),
      message,
    )) throw new Error("invalid_signature");
  } catch {
    throw new VaultRequestError("media_vault_access_required", 403);
  }
  return { wakeNonce: nonce.toLowerCase(), signedAtMs: timestamp };
}

function safeInteger(value: unknown): number | null {
  const normalized = typeof value === "string" && /^\d{1,16}$/u.test(value)
    ? Number(value)
    : value;
  return typeof normalized === "number" && Number.isSafeInteger(normalized)
    ? normalized
    : null;
}

function parseClaim(value: unknown, leaseToken: string): VaultClaim | null {
  if (Array.isArray(value) && value.length !== 1) return null;
  const row = Array.isArray(value) ? value[0] : value;
  if (!record(row) || !exactKeys(row, [
    "outbox_id", "restaurant_id", "asset_id", "intake_id",
    "storage_path", "storage_object_id", "storage_object_version",
    "mime_type", "file_size", "content_sha256", "correlation_id",
    "lease_token", "attempt_count", "external_write_allowed",
  ])) return null;
  const fileSize = safeInteger(row.file_size);
  const attemptCount = safeInteger(row.attempt_count);
  const claim = {
    outboxId: String(row.outbox_id || "").toLowerCase(),
    restaurantId: String(row.restaurant_id || "").toLowerCase(),
    assetId: String(row.asset_id || "").toLowerCase(),
    intakeId: String(row.intake_id || "").toLowerCase(),
    storagePath: String(row.storage_path || ""),
    storageObjectId: String(row.storage_object_id || "").toLowerCase(),
    storageObjectVersion: String(row.storage_object_version || ""),
    mimeType: row.mime_type as VeroxaPrivateMediaMimeType,
    fileSize: fileSize ?? -1,
    contentSha256: String(row.content_sha256 || ""),
    correlationId: String(row.correlation_id || "").toLowerCase(),
    leaseToken: String(row.lease_token || "").toLowerCase(),
    attemptCount: attemptCount ?? -1,
  };
  if (!isMomoContentUuid(claim.outboxId) ||
    !isMomoContentUuid(claim.restaurantId) ||
    !isMomoContentUuid(claim.assetId) || !isMomoContentUuid(claim.intakeId) ||
    !isMomoContentUuid(claim.storageObjectId) ||
    !isMomoContentUuid(claim.correlationId) ||
    !isMomoContentUuid(claim.leaseToken) || claim.leaseToken !== leaseToken ||
    claim.storageObjectVersion.length < 1 ||
    claim.storageObjectVersion.length > 200 ||
    !VEROXA_PRIVATE_MEDIA_MIME_TYPES.includes(claim.mimeType) ||
    claim.fileSize < VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_SOURCE_BYTES ||
    claim.fileSize > VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_SOURCE_BYTES ||
    !SHA256.test(claim.contentSha256) || claim.attemptCount < 1 ||
    claim.attemptCount > 5 || row.external_write_allowed !== false ||
    !new RegExp(
      `^restaurants/${claim.restaurantId}/uploads/[0-9]{4}/` +
        "(0[1-9]|1[0-2])/[0-9a-f]{8}-[0-9a-f]{4}-" +
        "[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-" +
        "[0-9a-f]{12}\\.(jpg|jpeg|png)$",
      "u",
    ).test(claim.storagePath)) return null;
  return claim;
}

function completed(value: unknown, claim: VaultClaim): string | null {
  if (Array.isArray(value) && value.length !== 1) return null;
  const row = Array.isArray(value) ? value[0] : value;
  return record(row) && exactKeys(row, [
    "outbox_id", "asset_id", "receipt_id", "status", "correlation_id",
    "external_write_allowed",
  ]) && String(row.outbox_id).toLowerCase() === claim.outboxId &&
      String(row.asset_id).toLowerCase() === claim.assetId &&
      String(row.correlation_id).toLowerCase() === claim.correlationId &&
      row.status === "verified" && isMomoContentUuid(row.receipt_id) &&
      row.external_write_allowed === false
    ? String(row.receipt_id).toLowerCase()
    : null;
}

function failureState(
  value: unknown,
  claim: VaultClaim,
  failure: VaultProcessingError,
): "retry_wait" | "dead_letter" | null {
  if (Array.isArray(value) && value.length !== 1) return null;
  const row = Array.isArray(value) ? value[0] : value;
  if (!record(row) || !exactKeys(row, [
    "outbox_id", "asset_id", "status", "failure_code", "correlation_id",
    "external_write_allowed",
  ]) || String(row.outbox_id).toLowerCase() !== claim.outboxId ||
    String(row.asset_id).toLowerCase() !== claim.assetId ||
    String(row.correlation_id).toLowerCase() !== claim.correlationId ||
    row.failure_code !== failure.code || row.external_write_allowed !== false ||
    (row.status !== "retry_wait" && row.status !== "dead_letter") ||
    (!failure.retryable && row.status !== "dead_letter")) return null;
  return row.status;
}

function processingError(error: unknown): VaultProcessingError {
  if (error instanceof VaultProcessingError) return error;
  if (error instanceof VeroxaMediaVaultError) {
    return new VaultProcessingError(error.code, error.retryable);
  }
  return new VaultProcessingError("media_vault_internal_unavailable", true);
}

export function createMomoMediaVaultHandler(
  dependencies: MomoMediaVaultDependencies,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    let wake: { wakeNonce: string; signedAtMs: number };
    try {
      wake = await verifyWake(request, dependencies.wakeHmacSecret);
    } catch (error) {
      return error instanceof VaultRequestError
        ? response({ error: error.message }, error.status)
        : response({ error: "invalid_request" }, 400);
    }
    if (!dependencies.configured) {
      return response({ error: "media_vault_unavailable" }, 503);
    }
    const leaseToken = dependencies.randomUUID().toLowerCase();
    if (!isMomoContentUuid(leaseToken)) {
      return response({ error: "media_vault_unavailable" }, 503);
    }
    let rawClaim: unknown;
    try {
      rawClaim = await dependencies.claim({ ...wake, leaseToken });
    } catch {
      return response({ error: "media_vault_claim_unavailable" }, 503);
    }
    if (rawClaim === null || rawClaim === undefined ||
      (Array.isArray(rawClaim) && rawClaim.length === 0)) {
      return response({ status: "idle", externalWriteAllowed: false }, 200);
    }
    const claim = parseClaim(rawClaim, leaseToken);
    if (!claim) {
      return response({ error: "media_vault_claim_invalid" }, 503);
    }

    try {
      let blob: Blob;
      let info: SourceObjectInfo;
      try {
        [blob, info] = await Promise.all([
          dependencies.download(claim.storagePath),
          dependencies.info(claim.storagePath),
        ]);
      } catch {
        throw new VaultProcessingError("media_vault_source_unavailable", true);
      }
      const observedMime = info.contentType.split(";", 1)[0].trim();
      if (info.id.toLowerCase() !== claim.storageObjectId ||
        info.version !== claim.storageObjectVersion ||
        info.name !== claim.storagePath || info.bucketId !== "restaurant-media" ||
        info.size !== claim.fileSize || blob.size !== claim.fileSize ||
        observedMime !== claim.mimeType) {
        throw new VaultProcessingError("media_vault_source_mismatch", false);
      }
      let bytes: Uint8Array;
      try {
        bytes = new Uint8Array(await blob.arrayBuffer());
      } catch {
        throw new VaultProcessingError("media_vault_source_unavailable", true);
      }
      if (await momoBytesSha256(bytes) !== claim.contentSha256) {
        throw new VaultProcessingError("media_vault_source_hash_mismatch", false);
      }
      const archived = await dependencies.archive({
        restaurantId: claim.restaurantId,
        assetId: claim.assetId,
        sourceStorageObjectId: claim.storageObjectId,
        sourceStorageObjectVersion: claim.storageObjectVersion,
        mimeType: claim.mimeType,
        contentSha256: claim.contentSha256,
        bytes,
      });
      const verificationSnapshot = {
        schemaVersion: 1,
        verifierVersion: "veroxa-private-media-vault-2026-08-15-v1",
        restaurantId: claim.restaurantId,
        assetId: claim.assetId,
        intakeId: claim.intakeId,
        sourceStoragePath: claim.storagePath,
        sourceStorageObjectId: claim.storageObjectId,
        sourceStorageObjectVersion: claim.storageObjectVersion,
        vaultKey: archived.vaultKey,
        vaultVersion: archived.vaultVersion,
        vaultEtag: archived.vaultEtag,
        mimeType: claim.mimeType,
        fileSize: archived.fileSize,
        contentSha256: archived.contentSha256,
        readbackHashVerified: true,
      };
      const verificationCanonical = momoCanonicalJson(verificationSnapshot);
      const verificationSha256 = await momoBytesSha256(
        new TextEncoder().encode(verificationCanonical),
      );
      let rawCompleted: unknown;
      try {
        rawCompleted = await dependencies.complete({
          outboxId: claim.outboxId,
          leaseToken: claim.leaseToken,
          vaultKey: archived.vaultKey,
          vaultVersion: archived.vaultVersion,
          vaultEtag: archived.vaultEtag,
          fileSize: archived.fileSize,
          contentSha256: archived.contentSha256,
          verificationSnapshot,
          verificationCanonical,
          verificationSha256,
        });
      } catch {
        throw new VaultProcessingError(
          "media_vault_completion_unavailable",
          true,
        );
      }
      const receiptId = completed(rawCompleted, claim);
      if (!receiptId) {
        throw new VaultProcessingError("media_vault_completion_invalid", true);
      }
      return response({
        status: "verified",
        assetId: claim.assetId,
        receiptId,
        vaultKey: archived.vaultKey,
        outcome: archived.outcome,
        externalWriteAllowed: false,
      }, 200);
    } catch (error) {
      const failure = processingError(error);
      const evidenceSnapshot = {
        schemaVersion: 1,
        verifierVersion: "veroxa-private-media-vault-2026-08-15-v1",
        outboxId: claim.outboxId,
        correlationId: claim.correlationId,
        restaurantId: claim.restaurantId,
        assetId: claim.assetId,
        intakeId: claim.intakeId,
        sourceStoragePath: claim.storagePath,
        sourceStorageObjectId: claim.storageObjectId,
        sourceStorageObjectVersion: claim.storageObjectVersion,
        contentSha256: claim.contentSha256,
        attemptCount: claim.attemptCount,
        failureCode: failure.code,
        retryable: failure.retryable,
        externalWriteAllowed: false,
      };
      try {
        const evidenceCanonical = momoCanonicalJson(evidenceSnapshot);
        const evidenceSha256 = await momoBytesSha256(
          new TextEncoder().encode(evidenceCanonical),
        );
        const rawFailure = await dependencies.fail({
          outboxId: claim.outboxId,
          leaseToken: claim.leaseToken,
          failureCode: failure.code,
          retryable: failure.retryable,
          evidenceSnapshot,
          evidenceCanonical,
          evidenceSha256,
        });
        const state = failureState(rawFailure, claim, failure);
        if (!state) {
          return response({ error: "media_vault_failure_recording_unavailable" }, 503);
        }
        return state === "retry_wait"
          ? response({ error: "media_vault_retry_scheduled" }, 503)
          : response({
            status: "failed",
            assetId: claim.assetId,
            error: failure.code,
            externalWriteAllowed: false,
          }, 200);
      } catch {
        return response({ error: "media_vault_failure_recording_unavailable" }, 503);
      }
    }
  };
}

export const momoMediaVaultWakeCanonicalBody = CANONICAL_BODY;
export const momoMediaVaultWakeContext = WAKE_CONTEXT;

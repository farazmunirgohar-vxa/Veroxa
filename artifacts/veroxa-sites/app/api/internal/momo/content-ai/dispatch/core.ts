import {
  MOMO_CONTENT_AI_MAX_BODY_BYTES,
  MOMO_CONTENT_AI_MAX_SOURCE_BYTES,
  isMomoContentUuid,
  type MomoContentPlatform,
  type MomoContentTruthSnapshotField,
} from "../../../../../momo-content-ai-contract.ts";
import { momoCanonicalJson } from "../../../../../momo-canonical-json.ts";
import {
  boundedMomoContentAiProviderEnvelope,
  isMomoContentAiDefinitiveProviderRejection,
  momoContentAiReservationFitsProviderEnvelope,
  momoContentAiProviderRequestId,
  momoContentAiSafetyIdentifier,
  prepareMomoContentAiProviderRequest,
  verifyMomoContentAiSourceBytes,
  type MomoContentAiReservation,
} from "../../../../../momo-content-ai-provider-request.ts";
import { momoContentAiProviderPayloadBelongsToRun } from "../../../../../momo-content-ai-result.ts";
import { readBoundedResponseBytes } from "../../../../../bounded-response.ts";

const CANONICAL_WAKE_BODY = '{"schemaVersion":1}';
const WAKE_CONTEXT =
  "veroxa:momo-content-ai-dispatch-wake:v1\nPOST\n/api/internal/momo/content-ai/dispatch";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const SHA256 = /^[0-9a-f]{64}$/u;
const HMAC = /^[0-9a-f]{64}$/u;
const MAX_WAKE_BYTES = Math.min(1_024, MOMO_CONTENT_AI_MAX_BODY_BYTES);

type MomoContentAiDispatchClaim = MomoContentAiReservation & {
  requestedBy: string;
  signedSourceUrl: string;
  attemptCount: number;
};

export type MomoContentAiDispatchDependencies = {
  enabled: boolean;
  providerConfigured: boolean;
  wakeHmacSecret: string;
  allowedSourceOrigin: string;
  claim(input: {
    wakeNonce: string;
    signedAtMs: number;
    leaseToken: string;
  }): Promise<unknown>;
  begin(input: {
    runId: string;
    requestHash: string;
    leaseToken: string;
    dispatchClaimToken: string;
    providerRequestSha256: string;
  }): Promise<{ runId: string; shouldCall: boolean; status: string }>;
  cancelBeforePost(input: {
    runId: string;
    requestHash: string;
    leaseToken: string;
    dispatchClaimToken: string;
    providerRequestSha256: string;
    errorCode: string;
  }): Promise<void>;
  release(input: {
    runId: string;
    requestHash: string;
    leaseToken: string;
    errorCode: string;
    retryable: boolean;
  }): Promise<void>;
  bind(input: {
    runId: string;
    requestHash: string;
    leaseToken: string;
    dispatchClaimToken: string;
    providerResponseId: string;
  }): Promise<void>;
  reconcile(input: {
    runId: string;
    requestHash: string;
    leaseToken: string;
    dispatchClaimToken: string;
    errorCode: string;
  }): Promise<void>;
  rejectAfterPost(input: {
    runId: string;
    requestHash: string;
    leaseToken: string;
    dispatchClaimToken: string;
    providerRequestSha256: string;
    providerHttpStatus: number;
    providerResponseSha256: string;
    providerRequestId: string | null;
  }): Promise<void>;
  fetchSource(url: string): Promise<Response>;
  callOpenAI(rawBody: string): Promise<Response>;
};

class DispatchRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

async function boundedText(
  request: Request,
  maximumBytes: number,
): Promise<string | null> {
  const declaredHeader = request.headers.get("content-length");
  const declared = declaredHeader === null ? null : Number(declaredHeader);
  if (declared !== null && (!Number.isSafeInteger(declared) || declared < 0 ||
    declared > maximumBytes)) return null;
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) return null;
      total += value.byteLength;
      if (total > maximumBytes) {
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

function hexBytes(value: string): Uint8Array<ArrayBuffer> {
  const result = new Uint8Array(new ArrayBuffer(value.length / 2));
  for (let index = 0; index < value.length; index += 2) {
    result[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return result;
}

async function verifyWake(
  request: Request,
  secret: string,
): Promise<{ wakeNonce: string; signedAtMs: number }> {
  if (request.method !== "POST") {
    throw new DispatchRequestError("method_not_allowed", 405);
  }
  const url = new URL(request.url);
  if (url.pathname !== "/api/internal/momo/content-ai/dispatch" ||
    url.search || url.hash ||
    !request.headers.get("content-type")?.toLowerCase()
      .startsWith("application/json")) {
    throw new DispatchRequestError("invalid_request", 400);
  }
  const raw = await boundedText(request, MAX_WAKE_BYTES);
  if (!raw) throw new DispatchRequestError("invalid_request", 400);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new DispatchRequestError("invalid_request", 400);
  }
  if (!isRecord(parsed) || Object.keys(parsed).length !== 1 ||
    parsed.schemaVersion !== 1) {
    throw new DispatchRequestError("invalid_request", 400);
  }
  const timestampText =
    request.headers.get("x-veroxa-dispatch-timestamp-ms")?.trim() || "";
  const nonce = request.headers.get("x-veroxa-dispatch-nonce")?.trim() || "";
  const signature =
    request.headers.get("x-veroxa-dispatch-signature")?.trim() || "";
  const timestamp = Number(timestampText);
  if (!/^\d{13}$/u.test(timestampText) || !Number.isSafeInteger(timestamp) ||
    Math.abs(Date.now() - timestamp) > 60_000 || !UUID.test(nonce) ||
    !HMAC.test(signature) || !HMAC.test(secret)) {
    throw new DispatchRequestError("dispatch_access_required", 403);
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
      `${WAKE_CONTEXT}\n${timestampText}\n${nonce}\n${CANONICAL_WAKE_BODY}`,
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      hexBytes(signature),
      message,
    );
    if (!valid) throw new Error();
  } catch {
    throw new DispatchRequestError("dispatch_access_required", 403);
  }
  return { wakeNonce: nonce.toLowerCase(), signedAtMs: timestamp };
}

function truthSnapshot(value: unknown): MomoContentTruthSnapshotField[] | null {
  if (!Array.isArray(value)) return null;
  const result: MomoContentTruthSnapshotField[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== "string" ||
      typeof item.fieldKey !== "string" ||
      item.evidenceClass !== "real_owner" ||
      typeof item.ownerConfirmedAt !== "string" ||
      !Object.hasOwn(item, "value")) return null;
    result.push({
      id: item.id,
      fieldKey: item.fieldKey,
      value: item.value,
      evidenceClass: "real_owner",
      ownerConfirmedAt: item.ownerConfirmedAt,
    });
  }
  return result;
}

function dispatchClaim(
  value: unknown,
  allowedSourceOrigin: string,
): MomoContentAiDispatchClaim | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!isRecord(row)) return null;
  const truth = truthSnapshot(row.truth_snapshot);
  const platforms = Array.isArray(row.target_platforms)
    ? row.target_platforms
    : null;
  const allowedPlatforms = new Set([
    "facebook",
    "instagram",
    "google_business",
  ]);
  let signedSourceUrl: URL;
  try {
    signedSourceUrl = new URL(String(row.signed_source_url || ""));
    if (signedSourceUrl.protocol !== "https:" ||
      signedSourceUrl.origin !== allowedSourceOrigin ||
      signedSourceUrl.username || signedSourceUrl.password ||
      signedSourceUrl.hash) throw new Error();
  } catch {
    return null;
  }
  if (!isMomoContentUuid(row.run_id) ||
    typeof row.request_hash !== "string" || !SHA256.test(row.request_hash) ||
    !isMomoContentUuid(row.restaurant_id) ||
    !isMomoContentUuid(row.requested_by) ||
    typeof row.source_storage_path !== "string" ||
    row.source_mime_type !== "image/jpeg" ||
    !Number.isSafeInteger(row.source_file_size) ||
    Number(row.source_file_size) < 1 ||
    Number(row.source_file_size) > MOMO_CONTENT_AI_MAX_SOURCE_BYTES ||
    typeof row.source_content_sha256 !== "string" ||
    !SHA256.test(row.source_content_sha256) ||
    !Number.isSafeInteger(row.source_width) ||
    !Number.isSafeInteger(row.source_height) || !platforms ||
    platforms.length < 1 || platforms.length > 3 ||
    platforms.some((platform) => typeof platform !== "string" ||
      !allowedPlatforms.has(platform)) || !truth ||
    typeof row.truth_snapshot_sha256 !== "string" ||
    !SHA256.test(row.truth_snapshot_sha256) ||
    row.reserved_microusd !== 6_000_000 ||
    !Number.isSafeInteger(row.attempt_count) ||
    Number(row.attempt_count) < 1 || Number(row.attempt_count) > 8) {
    return null;
  }
  const signedPathPrefix =
    "/storage/v1/object/sign/restaurant-media/";
  let signedStoragePath = "";
  try {
    if (!signedSourceUrl.pathname.startsWith(signedPathPrefix)) return null;
    signedStoragePath = decodeURIComponent(
      signedSourceUrl.pathname.slice(signedPathPrefix.length),
    );
  } catch {
    return null;
  }
  const signedQueryKeys = [...signedSourceUrl.searchParams.keys()];
  const signedTokens = signedSourceUrl.searchParams.getAll("token");
  const signedDownloads = signedSourceUrl.searchParams.getAll("download");
  const signedToken = signedTokens[0] || "";
  if (signedStoragePath !== row.source_storage_path ||
    signedTokens.length !== 1 || signedDownloads.length > 1 ||
    signedToken.length < 20 || signedToken.length > 4_096 ||
    signedQueryKeys.some((key) => key !== "token" && key !== "download")) {
    return null;
  }
  return {
    runId: row.run_id,
    status: "reserved",
    requestHash: row.request_hash,
    sourceStoragePath: row.source_storage_path,
    sourceMimeType: "image/jpeg",
    sourceFileSize: Number(row.source_file_size),
    sourceContentSha256: row.source_content_sha256,
    sourceWidth: Number(row.source_width),
    sourceHeight: Number(row.source_height),
    targetPlatforms: platforms as MomoContentPlatform[],
    truthSnapshot: truth,
    truthSnapshotSha256: row.truth_snapshot_sha256,
    reservedMicrousd: 6_000_000,
    requestedBy: row.requested_by,
    signedSourceUrl: signedSourceUrl.toString(),
    attemptCount: Number(row.attempt_count),
  };
}

async function boundedSourceBytes(response: Response): Promise<Uint8Array | null> {
  try {
    return await readBoundedResponseBytes(response, {
      maxBytes: MOMO_CONTENT_AI_MAX_SOURCE_BYTES,
      minBytes: 1,
      errorMessage: "source_verification_failed",
    });
  } catch {
    return null;
  }
}

async function repeatExact<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch {
    return operation();
  }
}

export function createMomoContentAiDispatchHandler(
  dependencies: MomoContentAiDispatchDependencies,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    let wake: { wakeNonce: string; signedAtMs: number };
    try {
      wake = await verifyWake(request, dependencies.wakeHmacSecret);
    } catch (error) {
      if (error instanceof DispatchRequestError) {
        return noStore({ error: error.message }, error.status);
      }
      return noStore({ error: "invalid_request" }, 400);
    }
    if (!dependencies.enabled || !dependencies.providerConfigured) {
      return noStore({ error: "dispatch_unavailable" }, 503);
    }

    const leaseToken = crypto.randomUUID();
    let rawClaim: unknown;
    try {
      rawClaim = await dependencies.claim({ ...wake, leaseToken });
    } catch {
      return noStore({ error: "dispatch_claim_unavailable" }, 503);
    }
    if (rawClaim === null || rawClaim === undefined ||
      (Array.isArray(rawClaim) && rawClaim.length === 0)) {
      return noStore({ status: "idle" }, 200);
    }
    const claim = dispatchClaim(rawClaim, dependencies.allowedSourceOrigin);
    if (!claim) {
      return noStore({ error: "dispatch_claim_invalid" }, 503);
    }

    const release = async (errorCode: string, retryable: boolean) => {
      try {
        await dependencies.release({
          runId: claim.runId,
          requestHash: claim.requestHash,
          leaseToken,
          errorCode,
          retryable,
        });
        return true;
      } catch {
        return false;
      }
    };

    if (!momoContentAiReservationFitsProviderEnvelope(claim)) {
      const recorded = await release("provider_input_envelope_exceeded", false);
      return noStore({
        status: recorded ? "blocked" : "finalization_uncertain",
        externalWriteAllowed: false,
      }, recorded ? 422 : 503);
    }

    let sourceResponse: Response;
    try {
      sourceResponse = await dependencies.fetchSource(claim.signedSourceUrl);
    } catch {
      const recorded = await release("source_download_unavailable", true);
      return noStore({
        status: recorded ? "queued" : "finalization_uncertain",
        externalWriteAllowed: false,
      }, recorded ? 202 : 503);
    }
    if (!sourceResponse.ok ||
      !sourceResponse.headers.get("content-type")?.toLowerCase()
        .startsWith("image/jpeg")) {
      const recorded = await release("source_download_unavailable", true);
      return noStore({
        status: recorded ? "queued" : "finalization_uncertain",
        externalWriteAllowed: false,
      }, recorded ? 202 : 503);
    }
    const bytes = await boundedSourceBytes(sourceResponse);
    if (!bytes || !(await verifyMomoContentAiSourceBytes(claim, bytes))) {
      const recorded = await release("source_verification_failed", false);
      return noStore({
        status: recorded ? "blocked" : "finalization_uncertain",
        externalWriteAllowed: false,
      }, recorded ? 422 : 503);
    }

    let prepared: { rawBody: string; providerRequestSha256: string };
    try {
      prepared = await prepareMomoContentAiProviderRequest(
        claim,
        bytes,
        await momoContentAiSafetyIdentifier(claim.requestedBy),
      );
    } catch {
      const recorded = await release("provider_request_build_failed", false);
      return noStore({
        status: recorded ? "blocked" : "finalization_uncertain",
        externalWriteAllowed: false,
      }, recorded ? 422 : 503);
    }

    const dispatchClaimToken = crypto.randomUUID();
    let began: { runId: string; shouldCall: boolean; status: string };
    try {
      began = await repeatExact(() => dependencies.begin({
        runId: claim.runId,
        requestHash: claim.requestHash,
        leaseToken,
        dispatchClaimToken,
        providerRequestSha256: prepared.providerRequestSha256,
      }));
    } catch {
      try {
        await repeatExact(() => dependencies.cancelBeforePost({
          runId: claim.runId,
          requestHash: claim.requestHash,
          leaseToken,
          dispatchClaimToken,
          providerRequestSha256: prepared.providerRequestSha256,
          errorCode: "dispatch_begin_unconfirmed",
        }));
        return noStore({
          runId: claim.runId,
          status: "queued",
          externalWriteAllowed: false,
        }, 202);
      } catch {
        return noStore({
          status: "finalization_uncertain",
          externalWriteAllowed: false,
        }, 503);
      }
    }
    if (began.runId !== claim.runId || !began.shouldCall ||
      began.status !== "provider_running") {
      return noStore({
        status: began.status || "in_progress",
        externalWriteAllowed: false,
      }, 202);
    }

    let providerResponse: Response;
    try {
      providerResponse = await dependencies.callOpenAI(prepared.rawBody);
    } catch {
      try {
        await repeatExact(() => dependencies.reconcile({
          runId: claim.runId,
          requestHash: claim.requestHash,
          leaseToken,
          dispatchClaimToken,
          errorCode: "provider_transport_unknown",
        }));
      } catch {
        return noStore({
          status: "finalization_uncertain",
          externalWriteAllowed: false,
        }, 503);
      }
      return noStore({
        runId: claim.runId,
        status: "reconciliation_required",
        externalWriteAllowed: false,
      }, 202);
    }

    const providerStatus = providerResponse.status;
    const envelope = await boundedMomoContentAiProviderEnvelope(
      providerResponse,
    );
    const payload = envelope?.payload ?? null;
    if (payload && momoContentAiProviderPayloadBelongsToRun(payload, claim)) {
      try {
        await repeatExact(() => dependencies.bind({
          runId: claim.runId,
          requestHash: claim.requestHash,
          leaseToken,
          dispatchClaimToken,
          providerResponseId: payload.id as string,
        }));
      } catch {
        return noStore({
          runId: claim.runId,
          status: "finalization_uncertain",
          externalWriteAllowed: false,
        }, 503);
      }
      return noStore({
        runId: claim.runId,
        status: "provider_running",
        externalWriteAllowed: false,
      }, 202);
    }

    if (envelope && isMomoContentAiDefinitiveProviderRejection(
      providerStatus,
      providerResponse.headers.get("content-type"),
      envelope.payload,
    )) {
      try {
        await repeatExact(() => dependencies.rejectAfterPost({
          runId: claim.runId,
          requestHash: claim.requestHash,
          leaseToken,
          dispatchClaimToken,
          providerRequestSha256: prepared.providerRequestSha256,
          providerHttpStatus: providerStatus,
          providerResponseSha256: envelope.responseSha256,
          providerRequestId: momoContentAiProviderRequestId(providerResponse),
        }));
      } catch {
        return noStore({
          runId: claim.runId,
          status: "finalization_uncertain",
          externalWriteAllowed: false,
        }, 503);
      }
      return noStore({
        runId: claim.runId,
        status: "failed",
        externalWriteAllowed: false,
      }, 200);
    }

    const errorCode = providerStatus === 429
      ? "provider_rate_limit_unknown"
      : providerStatus >= 400 && providerStatus < 500
      ? "provider_http_rejection_unknown"
      : providerResponse.ok
      ? "provider_response_unverifiable"
      : "provider_transport_unknown";
    try {
      await repeatExact(() => dependencies.reconcile({
        runId: claim.runId,
        requestHash: claim.requestHash,
        leaseToken,
        dispatchClaimToken,
        errorCode,
      }));
    } catch {
      return noStore({
        runId: claim.runId,
        status: "finalization_uncertain",
        externalWriteAllowed: false,
      }, 503);
    }
    return noStore({
      runId: claim.runId,
      status: "reconciliation_required",
      externalWriteAllowed: false,
    }, 202);
  };
}

export const momoContentAiDispatchWakeCanonicalBody = CANONICAL_WAKE_BODY;
export const momoContentAiDispatchWakeContext = WAKE_CONTEXT;
export const momoContentAiDispatchTruthCanonical = (
  value: MomoContentTruthSnapshotField[],
): string => momoCanonicalJson(value);

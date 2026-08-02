import {
  MOMO_CONTENT_AI_MAX_PROVIDER_BYTES,
  type MomoContentAiPackageOutput,
  type MomoContentPlatform,
  type MomoContentTruthSnapshotField,
} from "../../../momo-content-ai-contract.ts";
import {
  momoContentAiIncompleteReason,
  momoContentAiProviderAccounting,
  momoContentAiProviderPayloadBelongsToRun,
  prepareMomoContentAiCompletedResult,
  type MomoContentAiProviderUsage,
  type MomoContentAiValidationFailureEvidence,
} from "../../../momo-content-ai-result.ts";

const MAX_WEBHOOK_BYTES = 128_000;
const EVENT_ID = /^evt_[A-Za-z0-9_-]{8,196}$/u;
const WEBHOOK_ID = /^wh_[A-Za-z0-9_-]{8,196}$/u;
const RESPONSE_ID = /^resp_[A-Za-z0-9_-]{8,195}$/u;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const SHA256 = /^[0-9a-f]{64}$/u;
const ERROR_CODE = /^[a-z0-9_]{3,80}$/u;
const RELEVANT_EVENTS = new Set([
  "response.completed",
  "response.failed",
  "response.incomplete",
  "response.cancelled",
]);

type WebhookIdentity = {
  eventId: string;
  webhookId: string;
  responseId: string;
  runId: string;
  requestHash: string;
  claimToken: string;
};

type WebhookClaim = {
  runId: string;
  status: "provider_running" | "result_staged" | "pending_review" | "materialized" | "rejected" | "failed";
  requestHash: string;
  targetPlatforms: MomoContentPlatform[];
  truthSnapshot: MomoContentTruthSnapshotField[];
  reservedMicrousd: number;
  providerResponseId: string;
  storedOutput: MomoContentAiPackageOutput | null;
  providerErrorCode: string | null;
  eventStatus: "claimed" | "processed" | "failed";
  eventId: string;
  webhookId: string;
  webhookClaimToken: string | null;
  webhookClaimLeaseExpiresAt: string | null;
  ownsWebhookClaim: boolean;
  webhookClaimStatus: "acquired" | "owned" | "reclaimed" | "terminal_owner" | "terminal_other";
};

export type MomoContentAiWebhookDependencies = {
  configured: boolean;
  unwrap(rawBody: string, headers: Headers): Promise<unknown> | unknown;
  retrieveOpenAI(responseId: string): Promise<unknown>;
  claim(identity: WebhookIdentity): Promise<unknown>;
  stage(input: WebhookIdentity & {
    output: MomoContentAiPackageOutput;
    outputCanonical: string;
    outputSha256: string;
    validationReport: Record<string, unknown>;
    validationCanonical: string;
    validationSha256: string;
    accountedMicrousd: number;
    accountingBasis: "provider_usage_estimate" | "conservative_reservation";
    providerUsage: MomoContentAiProviderUsage | null;
  }): Promise<unknown>;
  completeStaged(identity: WebhookIdentity): Promise<unknown>;
  recordException(
    input: WebhookIdentity & MomoContentAiValidationFailureEvidence,
  ): Promise<unknown>;
  fail(input: WebhookIdentity & {
    errorCode: string;
    accountedMicrousd: number | null;
    providerUsage: MomoContentAiProviderUsage | null;
  }): Promise<unknown>;
  finish(input: WebhookIdentity & {
    outcome: "processed" | "failed";
    errorCode: string | null;
  }): Promise<unknown>;
  randomUUID?(): string;
};

class WebhookError extends Error {
  readonly status: number;
  readonly publicCode: string;

  constructor(publicCode: string, status: number) {
    super(publicCode);
    this.publicCode = publicCode;
    this.status = status;
  }
}

function response(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
      "x-content-type-options": "nosniff",
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstRecord(value: unknown): Record<string, unknown> | null {
  const row = Array.isArray(value) ? value[0] : value;
  return isRecord(row) ? row : null;
}

async function boundedRawBody(request: Request): Promise<string> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new WebhookError("webhook_invalid", 415);
  }
  const declared = Number(request.headers.get("content-length") || 0);
  if (!Number.isSafeInteger(declared) || declared < 0 || declared > MAX_WEBHOOK_BYTES || !request.body) {
    throw new WebhookError("webhook_invalid", declared > MAX_WEBHOOK_BYTES ? 413 : 400);
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) throw new WebhookError("webhook_invalid", 400);
      total += value.byteLength;
      if (total > MAX_WEBHOOK_BYTES) {
        await reader.cancel("webhook_too_large");
        throw new WebhookError("webhook_invalid", 413);
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof WebhookError) throw error;
    throw new WebhookError("webhook_invalid", 400);
  } finally {
    reader.releaseLock();
  }
  if (total < 2) throw new WebhookError("webhook_invalid", 400);
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new WebhookError("webhook_invalid", 400);
  }
}

function truthSnapshot(value: unknown): MomoContentTruthSnapshotField[] | null {
  if (!Array.isArray(value)) return null;
  const fields: MomoContentTruthSnapshotField[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.fieldKey !== "string" ||
      item.evidenceClass !== "real_owner" || typeof item.ownerConfirmedAt !== "string" ||
      !Object.hasOwn(item, "value")) return null;
    fields.push({
      id: item.id,
      fieldKey: item.fieldKey,
      value: item.value,
      evidenceClass: "real_owner",
      ownerConfirmedAt: item.ownerConfirmedAt,
    });
  }
  return fields;
}

function parseClaim(value: unknown, identity: WebhookIdentity): WebhookClaim {
  const row = firstRecord(value);
  const platforms = Array.isArray(row?.target_platforms) ? row.target_platforms : null;
  const allowedPlatforms = new Set(["instagram", "facebook", "google_business"]);
  const truth = truthSnapshot(row?.truth_snapshot);
  const claimToken = typeof row?.webhook_claim_token === "string" ? row.webhook_claim_token : null;
  const lease = typeof row?.webhook_claim_lease_expires_at === "string"
    ? row.webhook_claim_lease_expires_at
    : null;
  if (!row || row.run_id !== identity.runId || row.request_hash !== identity.requestHash ||
    row.provider_response_id !== identity.responseId || row.event_id !== identity.eventId ||
    row.webhook_id !== identity.webhookId ||
    !["provider_running", "result_staged", "pending_review", "materialized", "rejected", "failed"].includes(String(row.run_status)) ||
    !platforms || platforms.length < 1 || platforms.length > 3 ||
    platforms.some((platform) => typeof platform !== "string" || !allowedPlatforms.has(platform)) ||
    !truth || !Number.isSafeInteger(row.reserved_microusd) || Number(row.reserved_microusd) !== 6_000_000 ||
    !["claimed", "processed", "failed"].includes(String(row.event_status)) ||
    typeof row.requested_by !== "string" || !UUID.test(row.requested_by) ||
    typeof row.owns_webhook_claim !== "boolean" ||
    !["acquired", "owned", "reclaimed", "terminal_owner", "terminal_other"].includes(String(row.webhook_claim_status)) ||
    (row.provider_error_code !== null && row.provider_error_code !== undefined &&
      (typeof row.provider_error_code !== "string" || !ERROR_CODE.test(row.provider_error_code)))) {
    throw new WebhookError("webhook_claim_invalid", 503);
  }
  const eventStatus = row.event_status as WebhookClaim["eventStatus"];
  if (eventStatus === "claimed" &&
    (claimToken !== identity.claimToken || row.owns_webhook_claim !== true ||
      !lease || !Number.isFinite(Date.parse(lease)) || Date.parse(lease) <= Date.now())) {
    throw new WebhookError("webhook_claim_unavailable", 503);
  }
  return {
    runId: row.run_id as string,
    status: row.run_status as WebhookClaim["status"],
    requestHash: row.request_hash as string,
    targetPlatforms: platforms as MomoContentPlatform[],
    truthSnapshot: truth,
    reservedMicrousd: Number(row.reserved_microusd),
    providerResponseId: row.provider_response_id as string,
    storedOutput: isRecord(row.output_payload) ? row.output_payload as MomoContentAiPackageOutput : null,
    providerErrorCode: typeof row.provider_error_code === "string" ? row.provider_error_code : null,
    eventStatus,
    eventId: row.event_id as string,
    webhookId: row.webhook_id as string,
    webhookClaimToken: claimToken,
    webhookClaimLeaseExpiresAt: lease,
    ownsWebhookClaim: row.owns_webhook_claim as boolean,
    webhookClaimStatus: row.webhook_claim_status as WebhookClaim["webhookClaimStatus"],
  };
}

function providerPayload(value: unknown, responseId: string): Record<string, unknown> {
  if (!isRecord(value) || value.id !== responseId) throw new WebhookError("webhook_provider_unavailable", 503);
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new WebhookError("webhook_provider_unavailable", 503);
  }
  if (new TextEncoder().encode(serialized).byteLength > MOMO_CONTENT_AI_MAX_PROVIDER_BYTES) {
    throw new WebhookError("webhook_provider_unavailable", 503);
  }
  return value;
}

function eventIdentity(value: unknown, webhookId: string, claimToken: string): Omit<WebhookIdentity, "runId" | "requestHash"> {
  if (!isRecord(value) || typeof value.id !== "string" || !EVENT_ID.test(value.id) ||
    typeof value.type !== "string" || !RELEVANT_EVENTS.has(value.type) || !isRecord(value.data) ||
    typeof value.data.id !== "string" || !RESPONSE_ID.test(value.data.id)) {
    throw new WebhookError("webhook_invalid", 400);
  }
  return {
    eventId: value.id,
    webhookId,
    responseId: value.data.id,
    claimToken,
  };
}

function validatedProviderMetadata(payload: Record<string, unknown>): { runId: string; requestHash: string } {
  const metadata = isRecord(payload.metadata) ? payload.metadata : null;
  const runId = typeof metadata?.veroxa_run_id === "string" ? metadata.veroxa_run_id : "";
  const requestHash = typeof metadata?.veroxa_request_hash === "string" ? metadata.veroxa_request_hash : "";
  if (!UUID.test(runId) || !SHA256.test(requestHash)) {
    throw new WebhookError("webhook_provider_unavailable", 503);
  }
  return { runId: runId.toLowerCase(), requestHash };
}

async function expectRunId(operation: Promise<unknown>, runId: string): Promise<void> {
  if (await operation !== runId) throw new WebhookError("webhook_lifecycle_unavailable", 503);
}

async function expectEventId(operation: Promise<unknown>, eventId: string): Promise<void> {
  if (await operation !== eventId) throw new WebhookError("webhook_lifecycle_unavailable", 503);
}

async function expectRecordedException(operation: Promise<unknown>, runId: string): Promise<void> {
  const result = await operation;
  const expectedKeys = [
    "canonicalAssetId", "eventId", "incidentId", "occurrenceCount", "runId", "status",
  ];
  if (!isRecord(result) || result.runId !== runId ||
    Object.keys(result).sort().some((key, index) => key !== expectedKeys[index]) ||
    Object.keys(result).length !== expectedKeys.length ||
    typeof result.incidentId !== "string" || !UUID.test(result.incidentId) ||
    typeof result.eventId !== "string" || !UUID.test(result.eventId) ||
    typeof result.canonicalAssetId !== "string" || !UUID.test(result.canonicalAssetId) ||
    result.status !== "open" || !Number.isSafeInteger(result.occurrenceCount) ||
    Number(result.occurrenceCount) < 1) {
    throw new WebhookError("webhook_lifecycle_unavailable", 503);
  }
}

export function createMomoContentAiWebhookPostHandler(
  dependencies: MomoContentAiWebhookDependencies,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    try {
      if (!dependencies.configured) throw new WebhookError("webhook_configuration_unavailable", 503);
      const webhookId = request.headers.get("webhook-id")?.trim() || "";
      if (!WEBHOOK_ID.test(webhookId)) throw new WebhookError("webhook_invalid", 400);
      const raw = await boundedRawBody(request);
      let event: unknown;
      try {
        event = await dependencies.unwrap(raw, request.headers);
      } catch {
        throw new WebhookError("webhook_signature_invalid", 400);
      }
      if (!isRecord(event) || typeof event.type !== "string") {
        throw new WebhookError("webhook_invalid", 400);
      }
      if (!RELEVANT_EVENTS.has(event.type)) return response({ received: true, ignored: true }, 200);

      const claimToken = (dependencies.randomUUID ?? crypto.randomUUID)();
      if (!UUID.test(claimToken) || claimToken === "00000000-0000-0000-0000-000000000000") {
        throw new WebhookError("webhook_lifecycle_unavailable", 503);
      }
      const partial = eventIdentity(event, webhookId, claimToken);
      let payload: Record<string, unknown>;
      try {
        payload = providerPayload(await dependencies.retrieveOpenAI(partial.responseId), partial.responseId);
      } catch (error) {
        if (error instanceof WebhookError) throw error;
        throw new WebhookError("webhook_provider_unavailable", 503);
      }
      const metadata = validatedProviderMetadata(payload);
      const identity: WebhookIdentity = { ...partial, ...metadata };
      let claim: WebhookClaim;
      try {
        claim = parseClaim(await dependencies.claim(identity), identity);
      } catch (error) {
        if (error instanceof WebhookError) throw error;
        throw new WebhookError("webhook_claim_unavailable", 503);
      }

      if (claim.eventStatus === "processed" || claim.eventStatus === "failed") {
        return response({ received: true, replayed: true }, 200);
      }
      if (!momoContentAiProviderPayloadBelongsToRun(payload, {
        runId: identity.runId,
        requestHash: identity.requestHash,
        providerResponseId: identity.responseId,
      })) throw new WebhookError("webhook_provider_unavailable", 503);

      if (claim.status === "pending_review") {
        await expectRunId(dependencies.completeStaged(identity), identity.runId);
        await expectEventId(dependencies.finish({ ...identity, outcome: "processed", errorCode: null }), identity.eventId);
        return response({ received: true, replayed: true }, 200);
      }
      if (["materialized", "rejected"].includes(claim.status)) {
        await expectEventId(dependencies.finish({ ...identity, outcome: "processed", errorCode: null }), identity.eventId);
        return response({ received: true, replayed: true }, 200);
      }
      if (claim.status === "failed") {
        if (!claim.providerErrorCode) throw new WebhookError("webhook_lifecycle_unavailable", 503);
        await expectEventId(dependencies.finish({
          ...identity,
          outcome: "failed",
          errorCode: claim.providerErrorCode,
        }), identity.eventId);
        return response({ received: true, replayed: true }, 200);
      }
      if (claim.status === "result_staged") {
        if (!claim.storedOutput) throw new WebhookError("webhook_lifecycle_unavailable", 503);
        await expectRunId(dependencies.completeStaged(identity), identity.runId);
        await expectEventId(dependencies.finish({ ...identity, outcome: "processed", errorCode: null }), identity.eventId);
        return response({ received: true, recovered: true }, 200);
      }

      if (payload.status === "queued" || payload.status === "in_progress") {
        throw new WebhookError("webhook_provider_pending", 503);
      }
      const accounting = momoContentAiProviderAccounting(payload, claim.reservedMicrousd);
      if (["failed", "incomplete", "cancelled"].includes(String(payload.status))) {
        const errorCode = payload.status === "incomplete"
          ? `provider_incomplete_${momoContentAiIncompleteReason(payload)}`.slice(0, 80)
          : `provider_${String(payload.status)}`;
        await expectRunId(dependencies.fail({
          ...identity,
          errorCode,
          accountedMicrousd: accounting.providerUsage ? accounting.accountedMicrousd : null,
          providerUsage: accounting.providerUsage,
        }), identity.runId);
        await expectEventId(dependencies.finish({ ...identity, outcome: "failed", errorCode }), identity.eventId);
        return response({ received: true, failed: true }, 200);
      }
      if (payload.status !== "completed") throw new WebhookError("webhook_provider_unavailable", 503);

      const prepared = await prepareMomoContentAiCompletedResult(payload, {
        runId: claim.runId,
        requestHash: claim.requestHash,
        targetPlatforms: claim.targetPlatforms,
        truthSnapshot: claim.truthSnapshot,
        reservedMicrousd: claim.reservedMicrousd,
        providerResponseId: claim.providerResponseId,
      });
      if (!prepared.ok) {
        if (prepared.failure.validationEvidence) {
          await expectRecordedException(dependencies.recordException({
            ...identity,
            ...prepared.failure.validationEvidence,
          }), identity.runId);
        }
        await expectRunId(dependencies.fail({
          ...identity,
          errorCode: prepared.failure.errorCode,
          accountedMicrousd: accounting.providerUsage ? accounting.accountedMicrousd : null,
          providerUsage: accounting.providerUsage,
        }), identity.runId);
        await expectEventId(dependencies.finish({
          ...identity,
          outcome: "failed",
          errorCode: prepared.failure.errorCode,
        }), identity.eventId);
        return response({ received: true, failed: true }, 200);
      }

      await expectRunId(dependencies.stage({ ...identity, ...prepared.staged }), identity.runId);
      await expectRunId(dependencies.completeStaged(identity), identity.runId);
      await expectEventId(dependencies.finish({ ...identity, outcome: "processed", errorCode: null }), identity.eventId);
      return response({ received: true }, 200);
    } catch (error) {
      if (error instanceof WebhookError) return response({ error: error.publicCode }, error.status);
      return response({ error: "webhook_unavailable" }, 503);
    }
  };
}

import { createMomoContentAiWebhookPostHandler } from "../../../../openai/webhook/core.ts";
import { momoBytesSha256 } from "../../../../../momo-image-bytes.ts";
import type { MomoContentAiWebhookDependencies } from "../../../../openai/webhook/core.ts";

const CANONICAL_RECOVERY_BODY = '{"schemaVersion":1}';
const RECOVERY_CONTEXT =
  "veroxa:momo-content-ai-recovery-wake:v1\nPOST\n/api/internal/momo/content-ai/recover";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const SHA256 = /^[0-9a-f]{64}$/u;
const RESPONSE_ID = /^resp_[A-Za-z0-9_-]{8,195}$/u;
const HEX_256 = /^[0-9a-f]{64}$/u;
const MAX_WAKE_BYTES = 1_024;

type RecoveryClaim = {
  runId: string;
  requestHash: string;
  restaurantId: string;
  providerResponseId: string;
};

export type MomoContentAiRecoveryDependencies = Pick<
  MomoContentAiWebhookDependencies,
  | "retrieveOpenAI"
  | "claim"
  | "stage"
  | "completeStaged"
  | "recordException"
  | "fail"
  | "finish"
  | "randomUUID"
> & {
  configured: boolean;
  wakeHmacSecret: string;
  claimRecovery(input: {
    wakeNonce: string;
    signedAtMs: number;
  }): Promise<unknown>;
};

class RecoveryRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
  if (url.pathname !== "/api/internal/momo/content-ai/recover" ||
    url.search || url.hash ||
    !request.headers.get("content-type")?.toLowerCase()
      .startsWith("application/json")) {
    throw new RecoveryRequestError("invalid_request", 400);
  }
  const raw = await boundedText(request);
  if (!raw) throw new RecoveryRequestError("invalid_request", 400);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new RecoveryRequestError("invalid_request", 400);
  }
  if (!isRecord(body) || Object.keys(body).length !== 1 ||
    body.schemaVersion !== 1) {
    throw new RecoveryRequestError("invalid_request", 400);
  }
  const timestampText =
    request.headers.get("x-veroxa-recovery-timestamp-ms")?.trim() || "";
  const nonce =
    request.headers.get("x-veroxa-recovery-nonce")?.trim() || "";
  const signature =
    request.headers.get("x-veroxa-recovery-signature")?.trim() || "";
  const timestamp = Number(timestampText);
  if (!/^\d{13}$/u.test(timestampText) || !Number.isSafeInteger(timestamp) ||
    Math.abs(Date.now() - timestamp) > 60_000 || !UUID.test(nonce) ||
    !HEX_256.test(signature) || !HEX_256.test(secret)) {
    throw new RecoveryRequestError("recovery_access_required", 403);
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
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      hexBytes(signature),
      message,
    );
    if (!valid) throw new Error();
  } catch {
    throw new RecoveryRequestError("recovery_access_required", 403);
  }
  return { wakeNonce: nonce.toLowerCase(), signedAtMs: timestamp };
}

function recoveryClaim(value: unknown): RecoveryClaim | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!isRecord(row) || !UUID.test(String(row.run_id || "")) ||
    typeof row.request_hash !== "string" || !SHA256.test(row.request_hash) ||
    !UUID.test(String(row.restaurant_id || "")) ||
    typeof row.provider_response_id !== "string" ||
    !RESPONSE_ID.test(row.provider_response_id)) return null;
  return {
    runId: String(row.run_id).toLowerCase(),
    requestHash: row.request_hash,
    restaurantId: String(row.restaurant_id).toLowerCase(),
    providerResponseId: row.provider_response_id,
  };
}

async function recoveryEventIdentity(claim: RecoveryClaim): Promise<{
  eventId: string;
  webhookId: string;
}> {
  const hash = await momoBytesSha256(new TextEncoder().encode(
    `veroxa:momo-content-ai-response-recovery:v1:${claim.runId}:${claim.requestHash}:${claim.providerResponseId}`,
  ));
  return {
    eventId: `evt_veroxa_recovery_${hash.slice(0, 40)}`,
    webhookId: `wh_veroxa_recovery_${hash.slice(0, 40)}`,
  };
}

export function createMomoContentAiRecoveryHandler(
  dependencies: MomoContentAiRecoveryDependencies,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    let wake: { wakeNonce: string; signedAtMs: number };
    try {
      wake = await verifiedWake(request, dependencies.wakeHmacSecret);
    } catch (error) {
      if (error instanceof RecoveryRequestError) {
        return response({ error: error.message }, error.status);
      }
      return response({ error: "invalid_request" }, 400);
    }
    if (!dependencies.configured) {
      return response({ error: "recovery_unavailable" }, 503);
    }

    let rawClaim: unknown;
    try {
      rawClaim = await dependencies.claimRecovery(wake);
    } catch {
      return response({ error: "recovery_claim_unavailable" }, 503);
    }
    if (rawClaim === null || rawClaim === undefined ||
      (Array.isArray(rawClaim) && rawClaim.length === 0)) {
      return response({ status: "idle" }, 200);
    }
    const claim = recoveryClaim(rawClaim);
    if (!claim) return response({ error: "recovery_claim_invalid" }, 503);

    const synthetic = await recoveryEventIdentity(claim);
    const rawEvent = JSON.stringify({
      id: synthetic.eventId,
      type: "response.completed",
      data: { id: claim.providerResponseId },
    });
    const webhookHandler = createMomoContentAiWebhookPostHandler({
      configured: true,
      unwrap(rawBody) {
        return JSON.parse(rawBody) as unknown;
      },
      retrieveOpenAI: dependencies.retrieveOpenAI,
      claim: dependencies.claim,
      stage: dependencies.stage,
      completeStaged: dependencies.completeStaged,
      recordException: dependencies.recordException,
      fail: dependencies.fail,
      finish: dependencies.finish,
      randomUUID: dependencies.randomUUID,
    });
    return webhookHandler(new Request(
      "https://veroxa.internal/api/openai/webhook",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "webhook-id": synthetic.webhookId,
        },
        body: rawEvent,
      },
    ));
  };
}

export const momoContentAiRecoveryWakeCanonicalBody =
  CANONICAL_RECOVERY_BODY;
export const momoContentAiRecoveryWakeContext = RECOVERY_CONTEXT;

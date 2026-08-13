import { createClient } from "npm:@supabase/supabase-js@2.110.2";
import {
  isPlainObject,
  validMomoContentAiWebhookLifecycleRequest,
  verifyMomoContentAiWebhookBridgeSignature,
  type JsonObject,
  type MomoContentAiWebhookIdentity,
  type MomoContentAiWebhookLifecycleRequest,
} from "../_shared/momo-content-ai-webhook-lifecycle-contract.ts";
import { verifyExactBridgePublicKeyTransition } from
  "../_shared/bridge-public-key-transition.ts";

const BRIDGE_PUBLIC_KEY_SPKI_BASE64 =
  "MCowBQYDK2VwAyEA239rWPqMXC9X1l/w2AzXZUhrl68Sd3Jjh0TYI5jjjCQ=";
const BRIDGE_PREVIOUS_PUBLIC_KEY_SPKI_BASE64 =
  "MCowBQYDK2VwAyEAg/XOvj5uPdmqMKfWyh0jChnrtIoCHuaHODprsPRGo50=";
const BRIDGE_TRANSITION_PUBLIC_KEYS_SPKI_BASE64 = [
  BRIDGE_PUBLIC_KEY_SPKI_BASE64,
  BRIDGE_PREVIOUS_PUBLIC_KEY_SPKI_BASE64,
] as const;
const MAX_REQUEST_BYTES = 300_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function response(body: JsonObject, status: number): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
      "x-content-type-options": "nosniff",
    },
  });
}

function environmentKey(dictionaryName: string, legacyName: string, prefix: string): string {
  const dictionary = Deno.env.get(dictionaryName)?.trim() || "";
  if (dictionary) {
    try {
      const parsed = JSON.parse(dictionary);
      if (isPlainObject(parsed)) {
        const preferred = typeof parsed.default === "string" ? parsed.default.trim() : "";
        if (preferred.startsWith(prefix)) return preferred;
        const fallback = Object.values(parsed).find(
          (value) => typeof value === "string" && value.trim().startsWith(prefix),
        );
        if (typeof fallback === "string") return fallback.trim();
      }
    } catch {
      return "";
    }
  }
  return Deno.env.get(legacyName)?.trim() || "";
}

async function rawBody(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get("content-length") || 0);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json") ||
    !Number.isSafeInteger(declared) || declared < 0 || declared > MAX_REQUEST_BYTES || !request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) return null;
      total += value.byteLength;
      if (total > MAX_REQUEST_BYTES) {
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
  if (total < 2) return null;
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

function parse(raw: string): MomoContentAiWebhookLifecycleRequest | null {
  try {
    const value = JSON.parse(raw) as unknown;
    return isPlainObject(value) && validMomoContentAiWebhookLifecycleRequest(value) ? value : null;
  } catch {
    return null;
  }
}

function record(value: unknown): JsonObject | null {
  const row = Array.isArray(value) ? value[0] : value;
  return isPlainObject(row) ? row : null;
}

function claimParameters(body: MomoContentAiWebhookIdentity): JsonObject {
  return {
    p_event_id: body.eventId,
    p_webhook_id: body.webhookId,
    p_provider_response_id: body.responseId,
    p_run_id: body.runId,
    p_request_hash: body.requestHash,
    p_claim_token: body.claimToken,
  };
}

function requestedByFromOwnedClaim(value: unknown, body: MomoContentAiWebhookIdentity): string | null {
  const row = record(value);
  const lease = typeof row?.webhook_claim_lease_expires_at === "string"
    ? Date.parse(row.webhook_claim_lease_expires_at)
    : Number.NaN;
  if (!row || row.run_id !== body.runId || row.request_hash !== body.requestHash ||
    row.provider_response_id !== body.responseId || row.event_id !== body.eventId ||
    row.webhook_id !== body.webhookId || row.event_status !== "claimed" ||
    row.webhook_claim_token !== body.claimToken || row.owns_webhook_claim !== true ||
    !["acquired", "owned", "reclaimed"].includes(String(row.webhook_claim_status)) ||
    !Number.isFinite(lease) || lease <= Date.now() ||
    typeof row.requested_by !== "string" || !UUID.test(row.requested_by)) return null;
  return row.requested_by;
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== "POST") return response({ error: "method_not_allowed" }, 405);
  if (request.headers.get("x-veroxa-server-purpose") !== "momo-content-ai-webhook-lifecycle-v1") {
    return response({ error: "bridge_access_required" }, 403);
  }
  const raw = await rawBody(request);
  if (!raw) return response({ error: "invalid_request" }, 400);
  const verified = await verifyExactBridgePublicKeyTransition(
    BRIDGE_TRANSITION_PUBLIC_KEYS_SPKI_BASE64,
    (publicKeyBase64) => verifyMomoContentAiWebhookBridgeSignature({
      publicKeyBase64,
      timestampMs: request.headers.get(
        "x-veroxa-content-ai-timestamp-ms",
      )?.trim() || "",
      nonce: request.headers.get("x-veroxa-content-ai-nonce")?.trim() || "",
      body: raw,
      signature: request.headers.get(
        "x-veroxa-content-ai-signature",
      )?.trim() || "",
    }),
  );
  if (!verified) return response({ error: "bridge_access_required" }, 403);
  const body = parse(raw);
  if (!body) return response({ error: "invalid_request" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() || "";
  const secretKey = environmentKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY", "sb_secret_");
  if (!supabaseUrl || !secretKey) return response({ error: "lifecycle_configuration_unavailable" }, 503);
  const admin = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { "x-veroxa-server-purpose": "momo-content-ai-webhook-lifecycle-v1" } },
  });

  if (body.operation === "claim") {
    const { data, error } = await admin.rpc(
      "veroxa_claim_momo_content_ai_webhook_v1",
      claimParameters(body),
    );
    if (error) return response({ error: "lifecycle_rpc_rejected" }, 409);
    return response({ data }, 200);
  }

  if (body.operation === "finish") {
    const { data, error } = await admin.rpc("veroxa_finish_momo_content_ai_webhook_v1", {
      p_event_id: body.eventId,
      p_webhook_id: body.webhookId,
      p_claim_token: body.claimToken,
      p_provider_response_id: body.responseId,
      p_run_id: body.runId,
      p_request_hash: body.requestHash,
      p_outcome: body.outcome,
      p_error_code: body.errorCode,
    });
    if (error) return response({ error: "lifecycle_rpc_rejected" }, 409);
    return response({ data }, 200);
  }

  const { data: claimData, error: claimError } = await admin.rpc(
    "veroxa_claim_momo_content_ai_webhook_v1",
    claimParameters(body),
  );
  const actorId = claimError ? null : requestedByFromOwnedClaim(claimData, body);
  if (!actorId) return response({ error: "webhook_claim_required" }, 409);

  if (body.operation === "record_exception") {
    const { data, error } = await admin.rpc("veroxa_momo_upload_pipeline_v2", {
      p_operation: "record_exception",
      p_payload: {
        runId: body.runId,
        requestHash: body.requestHash,
        stage: body.stage,
        policyVersion: body.policyVersion,
        blockers: body.blockers,
        warnings: body.warnings,
        evidenceSnapshot: body.evidenceSnapshot,
        evidenceCanonical: body.evidenceCanonical,
        evidenceSha256: body.evidenceSha256,
      },
    });
    if (error) return response({ error: "lifecycle_rpc_rejected" }, 409);
    return response({ data }, 200);
  }

  let rpc:
    | "veroxa_stage_momo_content_ai_webhook_result_v1"
    | "veroxa_complete_staged_momo_content_ai_webhook_v1"
    | "veroxa_fail_momo_content_ai_webhook_v1";
  let parameters: JsonObject;
  const identity = {
    p_event_id: body.eventId,
    p_webhook_id: body.webhookId,
    p_claim_token: body.claimToken,
    p_run_id: body.runId,
    p_request_hash: body.requestHash,
  };
  if (body.operation === "stage_result") {
    rpc = "veroxa_stage_momo_content_ai_webhook_result_v1";
    parameters = {
      ...identity,
      p_provider_response_id: body.responseId,
      p_output_payload: body.output,
      p_output_canonical: body.outputCanonical,
      p_output_sha256: body.outputSha256,
      p_validation_report: body.validationReport,
      p_validation_canonical: body.validationCanonical,
      p_validation_sha256: body.validationSha256,
      p_accounted_microusd: body.accountedMicrousd,
      p_accounting_basis: body.accountingBasis,
      p_provider_usage: body.providerUsage,
      p_actor_id: actorId,
    };
  } else if (body.operation === "complete_staged") {
    rpc = "veroxa_complete_staged_momo_content_ai_webhook_v1";
    parameters = { ...identity, p_actor_id: actorId };
  } else {
    rpc = "veroxa_fail_momo_content_ai_webhook_v1";
    parameters = {
      ...identity,
      p_provider_response_id: body.responseId,
      p_error_code: body.errorCode,
      p_provider_called: true,
      p_accounted_microusd: body.accountedMicrousd,
      p_provider_usage: body.providerUsage,
      p_actor_id: actorId,
    };
  }
  const { data, error } = await admin.rpc(rpc, parameters);
  if (error) return response({ error: "lifecycle_rpc_rejected" }, 409);
  if (body.operation === "complete_staged") {
    const { error: readyError } = await admin.rpc(
      "veroxa_momo_upload_pipeline_v2",
      {
        p_operation: "materialize_veroxa_ready",
        p_payload: { runId: body.runId, requestHash: body.requestHash },
      },
    );
    if (readyError) return response({ error: "lifecycle_rpc_rejected" }, 409);
  }
  return response({ data }, 200);
});

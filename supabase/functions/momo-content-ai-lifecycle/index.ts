import { createClient } from "npm:@supabase/supabase-js@2.110.2";
import {
  isPlainObject,
  validMomoContentAiLifecycleRequest,
  verifyMomoContentAiBridgeSignature,
  type JsonObject,
  type MomoContentAiLifecycleRequest,
} from "../_shared/momo-content-ai-lifecycle-contract.ts";

const BRIDGE_PUBLIC_KEY_SPKI_BASE64 =
  "MCowBQYDK2VwAyEAu68hoOLgdP56mNDaTR6zr8m1HfLuFRXUnIi/DRM6mOY=";
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
        const fallback = Object.values(parsed).find((value) => typeof value === "string" && value.trim().startsWith(prefix));
        if (typeof fallback === "string") return fallback.trim();
      }
    } catch { return ""; }
  }
  return Deno.env.get(legacyName)?.trim() || "";
}

async function rawBody(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get("content-length") || 0);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json") || !Number.isSafeInteger(declared) || declared < 0 || declared > MAX_REQUEST_BYTES) return null;
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

function parse(raw: string): MomoContentAiLifecycleRequest | null {
  try {
    const value = JSON.parse(raw);
    return isPlainObject(value) && validMomoContentAiLifecycleRequest(value) ? value : null;
  } catch { return null; }
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== "POST") return response({ error: "method_not_allowed" }, 405);
  const authorization = request.headers.get("authorization")?.trim() || "";
  if (!authorization.startsWith("Bearer ") || authorization.length > 8_200) return response({ error: "team_access_required" }, 403);
  const accessToken = authorization.slice(7);
  const raw = await rawBody(request);
  if (!raw) return response({ error: "invalid_request" }, 400);
  const verified = await verifyMomoContentAiBridgeSignature({
    publicKeyBase64: BRIDGE_PUBLIC_KEY_SPKI_BASE64,
    timestampMs: request.headers.get("x-veroxa-content-ai-timestamp-ms")?.trim() || "",
    nonce: request.headers.get("x-veroxa-content-ai-nonce")?.trim() || "",
    accessToken,
    body: raw,
    signature: request.headers.get("x-veroxa-content-ai-signature")?.trim() || "",
  });
  if (!verified) return response({ error: "bridge_access_required" }, 403);
  const body = parse(raw);
  if (!body) return response({ error: "invalid_request" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() || "";
  const publishableKey = environmentKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY", "sb_publishable_");
  const secretKey = environmentKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY", "sb_secret_");
  if (!supabaseUrl || !publishableKey || !secretKey) return response({ error: "lifecycle_configuration_unavailable" }, 503);
  const userClient = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { authorization } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);
  if (userError || !userData.user || !UUID.test(userData.user.id)) return response({ error: "team_access_required" }, 403);
  const admin = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { "x-veroxa-server-purpose": "momo-content-ai-lifecycle-v1" } },
  });

  if (body.operation === "finalize_upload") {
    const { data: verificationId, error: finalizeError } = await admin.rpc(
      "veroxa_finalize_momo_media_intake_v1",
      {
        p_restaurant_id: body.restaurantId,
        p_asset_id: body.assetId,
        p_storage_object_id: body.storageObjectId,
        p_storage_object_version: body.storageObjectVersion,
        p_detected_mime: body.detectedMime,
        p_file_size: body.fileSize,
        p_width: body.width,
        p_height: body.height,
        p_content_sha256: body.contentSha256,
        p_verification_snapshot: body.verificationSnapshot,
        p_verification_canonical: body.verificationCanonical,
        p_verification_sha256: body.verificationSha256,
        p_idempotency_hash: body.idempotencyHash,
        p_actor_id: userData.user.id,
      },
    );
    if (finalizeError || typeof verificationId !== "string" || !UUID.test(verificationId)) {
      return response({ error: "lifecycle_rpc_rejected" }, 409);
    }
    const { data, error } = await admin.rpc("veroxa_momo_upload_pipeline_v2", {
      p_operation: "advance_verified_asset",
      p_payload: {
        restaurantId: body.restaurantId,
        assetId: body.assetId,
        verificationId,
        actorId: userData.user.id,
      },
    });
    if (error || !isPlainObject(data)) {
      return response({ error: "lifecycle_rpc_rejected" }, 409);
    }
    return response({ data }, 200);
  }

  if (body.operation === "record_intake_attempt") {
    const { data, error } = await admin.rpc("veroxa_momo_upload_pipeline_v2", {
      p_operation: "record_intake_attempt",
      p_payload: {
        restaurantId: body.restaurantId,
        assetId: body.assetId,
        actorId: userData.user.id,
        outcome: body.outcome,
        reasonCodes: body.reasonCodes,
        evidenceSnapshot: body.evidenceSnapshot,
        evidenceCanonical: body.evidenceCanonical,
        evidenceSha256: body.evidenceSha256,
        idempotencySha256: body.idempotencySha256,
      },
    });
    if (error || !isPlainObject(data)) {
      return response({ error: "lifecycle_rpc_rejected" }, 409);
    }
    return response({ data }, 200);
  }

  let rpc: "veroxa_stage_momo_content_ai_result_v1" | "veroxa_complete_staged_momo_content_ai_run_v1" | "veroxa_fail_momo_content_ai_run_v1" | "veroxa_materialize_momo_ready_package_v1";
  let parameters: JsonObject;
  if (body.operation === "complete_staged") {
    rpc = "veroxa_complete_staged_momo_content_ai_run_v1";
    parameters = { p_run_id: body.runId, p_request_hash: body.requestHash, p_actor_id: userData.user.id };
  } else if (body.operation === "materialize") {
    rpc = "veroxa_materialize_momo_ready_package_v1";
    parameters = {
      p_run_id: body.runId,
      p_request_hash: body.requestHash,
      p_schedule_snapshot: body.scheduleSnapshot,
      p_schedule_canonical: body.scheduleCanonical,
      p_schedule_sha256: body.scheduleSha256,
      p_inspection_attestation: body.inspectionAttestation,
      p_actor_id: userData.user.id,
    };
  } else if (body.operation === "stage_result") {
    rpc = "veroxa_stage_momo_content_ai_result_v1";
    parameters = {
      p_run_id: body.runId,
      p_request_hash: body.requestHash,
      p_provider_response_id: body.providerResponseId,
      p_output_payload: body.output,
      p_output_canonical: body.outputCanonical,
      p_output_sha256: body.outputSha256,
      p_validation_report: body.validationReport,
      p_validation_canonical: body.validationCanonical,
      p_validation_sha256: body.validationSha256,
      p_accounted_microusd: body.accountedMicrousd,
      p_accounting_basis: body.accountingBasis,
      p_provider_usage: body.providerUsage,
      p_actor_id: userData.user.id,
    };
  } else {
    rpc = "veroxa_fail_momo_content_ai_run_v1";
    parameters = {
      p_run_id: body.runId,
      p_request_hash: body.requestHash,
      p_provider_response_id: body.providerResponseId,
      p_error_code: body.errorCode,
      p_provider_called: body.providerCalled,
      p_accounted_microusd: body.accountedMicrousd,
      p_provider_usage: body.providerUsage,
      p_actor_id: userData.user.id,
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

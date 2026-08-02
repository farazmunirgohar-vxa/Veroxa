import { createClient } from "npm:@supabase/supabase-js@2.110.2";
import {
  isPlainObject,
  validMomoContentAiDispatchLifecycleRequest,
  verifyMomoContentAiDispatchBridgeSignature,
  type JsonObject,
  type MomoContentAiDispatchLifecycleRequest,
} from "../_shared/momo-content-ai-dispatch-lifecycle-contract.ts";

const BRIDGE_PUBLIC_KEY_SPKI_BASE64 =
  "MCowBQYDK2VwAyEAu68hoOLgdP56mNDaTR6zr8m1HfLuFRXUnIi/DRM6mOY=";
const MAX_REQUEST_BYTES = 20_000;

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

function environmentKey(
  dictionaryName: string,
  legacyName: string,
  prefix: string,
): string {
  const dictionary = Deno.env.get(dictionaryName)?.trim() || "";
  if (dictionary) {
    try {
      const parsed = JSON.parse(dictionary);
      if (isPlainObject(parsed)) {
        const preferred = typeof parsed.default === "string"
          ? parsed.default.trim()
          : "";
        if (preferred.startsWith(prefix)) return preferred;
        const fallback = Object.values(parsed).find(
          (value) => typeof value === "string" &&
            value.trim().startsWith(prefix),
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
    !Number.isSafeInteger(declared) || declared < 0 ||
    declared > MAX_REQUEST_BYTES || !request.body) return null;
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

function parse(raw: string): MomoContentAiDispatchLifecycleRequest | null {
  try {
    const value = JSON.parse(raw) as unknown;
    return isPlainObject(value) &&
        validMomoContentAiDispatchLifecycleRequest(value)
      ? value
      : null;
  } catch {
    return null;
  }
}

function record(value: unknown): JsonObject | null {
  const row = Array.isArray(value) ? value[0] : value;
  return isPlainObject(row) ? row : null;
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== "POST") {
    return response({ error: "method_not_allowed" }, 405);
  }
  if (request.headers.get("x-veroxa-server-purpose") !==
    "momo-content-ai-dispatch-lifecycle-v1") {
    return response({ error: "bridge_access_required" }, 403);
  }
  const raw = await rawBody(request);
  if (!raw) return response({ error: "invalid_request" }, 400);
  const verified = await verifyMomoContentAiDispatchBridgeSignature({
    publicKeyBase64: BRIDGE_PUBLIC_KEY_SPKI_BASE64,
    timestampMs: request.headers.get("x-veroxa-content-ai-timestamp-ms")?.trim() || "",
    nonce: request.headers.get("x-veroxa-content-ai-nonce")?.trim() || "",
    body: raw,
    signature: request.headers.get("x-veroxa-content-ai-signature")?.trim() || "",
  });
  if (!verified) return response({ error: "bridge_access_required" }, 403);
  const body = parse(raw);
  if (!body) return response({ error: "invalid_request" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() || "";
  const secretKey = environmentKey(
    "SUPABASE_SECRET_KEYS",
    "SUPABASE_SERVICE_ROLE_KEY",
    "sb_secret_",
  );
  if (!supabaseUrl || !secretKey) {
    return response({ error: "lifecycle_configuration_unavailable" }, 503);
  }
  const admin = createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "x-veroxa-server-purpose": "momo-content-ai-dispatch-lifecycle-v1",
      },
    },
  });

  if (body.operation === "claim") {
    const { data, error } = await admin.rpc(
      "veroxa_claim_momo_content_ai_dispatch_v1",
      {
        p_wake_nonce: body.wakeNonce,
        p_signed_at_ms: body.signedAtMs,
        p_lease_token: body.leaseToken,
      },
    );
    if (error) return response({ error: "lifecycle_rpc_rejected" }, 409);
    const claimed = record(data);
    if (!claimed) return response({ data: null }, 200);
    const storagePath = typeof claimed.source_storage_path === "string"
      ? claimed.source_storage_path
      : "";
    if (!storagePath || storagePath.length > 500) {
      return response({ error: "lifecycle_claim_invalid" }, 409);
    }
    const { data: signed, error: signedError } = await admin.storage
      .from("restaurant-media")
      .createSignedUrl(storagePath, 120);
    if (signedError || !signed?.signedUrl) {
      return response({ error: "lifecycle_source_unavailable" }, 503);
    }
    let signedUrl: URL;
    try {
      signedUrl = new URL(signed.signedUrl, supabaseUrl);
      if (signedUrl.protocol !== "https:" ||
        signedUrl.origin !== new URL(supabaseUrl).origin ||
        signedUrl.username || signedUrl.password || signedUrl.hash) {
        throw new Error();
      }
    } catch {
      return response({ error: "lifecycle_source_unavailable" }, 503);
    }
    return response({
      data: { ...claimed, signed_source_url: signedUrl.toString() },
    }, 200);
  }

  if (body.operation === "claim_recovery") {
    const { data, error } = await admin.rpc(
      "veroxa_claim_momo_content_ai_recovery_v1",
      {
        p_wake_nonce: body.wakeNonce,
        p_signed_at_ms: body.signedAtMs,
      },
    );
    if (error) return response({ error: "lifecycle_rpc_rejected" }, 409);
    return response({ data: record(data) }, 200);
  }

  let rpc:
    | "veroxa_begin_momo_content_ai_dispatch_v1"
    | "veroxa_cancel_momo_content_ai_dispatch_before_post_v1"
    | "veroxa_release_momo_content_ai_dispatch_v1"
    | "veroxa_bind_momo_content_ai_dispatch_response_v1"
    | "veroxa_reconcile_momo_content_ai_dispatch_v1"
    | "veroxa_reject_momo_content_ai_dispatch_after_post_v1";
  let parameters: JsonObject;
  if (body.operation === "begin") {
    rpc = "veroxa_begin_momo_content_ai_dispatch_v1";
    parameters = {
      p_run_id: body.runId,
      p_request_hash: body.requestHash,
      p_lease_token: body.leaseToken,
      p_dispatch_claim_token: body.dispatchClaimToken,
      p_provider_request_sha256: body.providerRequestSha256,
    };
  } else if (body.operation === "cancel_before_post") {
    rpc = "veroxa_cancel_momo_content_ai_dispatch_before_post_v1";
    parameters = {
      p_run_id: body.runId,
      p_request_hash: body.requestHash,
      p_lease_token: body.leaseToken,
      p_dispatch_claim_token: body.dispatchClaimToken,
      p_provider_request_sha256: body.providerRequestSha256,
      p_error_code: body.errorCode,
    };
  } else if (body.operation === "release") {
    rpc = "veroxa_release_momo_content_ai_dispatch_v1";
    parameters = {
      p_run_id: body.runId,
      p_request_hash: body.requestHash,
      p_lease_token: body.leaseToken,
      p_error_code: body.errorCode,
      p_retryable: body.retryable,
    };
  } else if (body.operation === "bind") {
    rpc = "veroxa_bind_momo_content_ai_dispatch_response_v1";
    parameters = {
      p_run_id: body.runId,
      p_request_hash: body.requestHash,
      p_lease_token: body.leaseToken,
      p_dispatch_claim_token: body.dispatchClaimToken,
      p_provider_response_id: body.providerResponseId,
    };
  } else if (body.operation === "reject_after_post") {
    rpc = "veroxa_reject_momo_content_ai_dispatch_after_post_v1";
    parameters = {
      p_run_id: body.runId,
      p_request_hash: body.requestHash,
      p_lease_token: body.leaseToken,
      p_dispatch_claim_token: body.dispatchClaimToken,
      p_provider_request_sha256: body.providerRequestSha256,
      p_provider_http_status: body.providerHttpStatus,
      p_provider_response_sha256: body.providerResponseSha256,
      p_provider_request_id: body.providerRequestId,
    };
  } else {
    rpc = "veroxa_reconcile_momo_content_ai_dispatch_v1";
    parameters = {
      p_run_id: body.runId,
      p_request_hash: body.requestHash,
      p_lease_token: body.leaseToken,
      p_dispatch_claim_token: body.dispatchClaimToken,
      p_error_code: body.errorCode,
    };
  }
  const { data, error } = await admin.rpc(rpc, parameters);
  if (error) return response({ error: "lifecycle_rpc_rejected" }, 409);
  return response({ data }, 200);
});

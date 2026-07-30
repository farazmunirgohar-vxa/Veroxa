import { createClient } from "npm:@supabase/supabase-js@2.110.2";
import {
  isPlainObject,
  type JsonObject,
  type MomoMediaAiLifecycleRequest,
  validMomoMediaAiLifecycleRequest,
  verifyMomoMediaAiBridgeSignature,
} from "../_shared/momo-media-ai-lifecycle-contract.ts";

const BRIDGE_PUBLIC_KEY_SPKI_BASE64 =
  "MCowBQYDK2VwAyEAu68hoOLgdP56mNDaTR6zr8m1HfLuFRXUnIi/DRM6mOY=";
const MAX_REQUEST_BYTES = 16_384;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type TerminalCandidateRow = {
  id: string;
  requested_by: string;
  request_hash: string;
  status: string;
  provider_request_id: string | null;
  storage_path: string | null;
  file_size: number | string | null;
  output_width: number | string | null;
  output_height: number | string | null;
  content_sha256: string | null;
  accounted_microusd: number | string | null;
  accounting_basis: string | null;
  provider_usage: unknown;
  provider_error_code: string | null;
};

type TerminalReplayDatabase = {
  public: {
    Tables: {
      veroxa_momo_media_ai_candidates: {
        Row: TerminalCandidateRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

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

function namedEnvironmentKey(
  dictionaryName: string,
  legacyName: string,
  modernPrefix: string,
): string {
  const dictionary = Deno.env.get(dictionaryName)?.trim() || "";
  if (dictionary) {
    try {
      const parsed = JSON.parse(dictionary);
      if (isPlainObject(parsed)) {
        const preferred = typeof parsed.default === "string"
          ? parsed.default.trim()
          : "";
        if (preferred.startsWith(modernPrefix)) return preferred;
        const fallback = Object.values(parsed).find(
          (value) =>
            typeof value === "string" &&
            value.trim().startsWith(modernPrefix),
        );
        if (typeof fallback === "string") return fallback.trim();
      }
    } catch {
      return "";
    }
  }
  return Deno.env.get(legacyName)?.trim() || "";
}

async function rawRequestBody(request: Request): Promise<string | null> {
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (
    !request.headers.get("content-type")?.toLowerCase()
      .startsWith("application/json") ||
    !Number.isSafeInteger(declaredLength) ||
    declaredLength < 0 ||
    declaredLength > MAX_REQUEST_BYTES
  ) return null;
  const raw = await request.text();
  if (
    raw.length < 2 ||
    new TextEncoder().encode(raw).byteLength > MAX_REQUEST_BYTES
  ) return null;
  return raw;
}

function parseRequestBody(raw: string): MomoMediaAiLifecycleRequest | null {
  try {
    const parsed = JSON.parse(raw);
    return isPlainObject(parsed) &&
        validMomoMediaAiLifecycleRequest(parsed)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function jsonEqual(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => jsonEqual(value, right[index]));
  }
  if (!isPlainObject(left) || !isPlainObject(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key, index) =>
        key === rightKeys[index] && jsonEqual(left[key], right[key]),
    );
}

async function exactTerminalReplay(
  userClient: ReturnType<typeof createClient<TerminalReplayDatabase>>,
  actorId: string,
  body: Extract<
    MomoMediaAiLifecycleRequest,
    { operation: "complete" | "fail" }
  >,
): Promise<string | null> {
  const { data, error } = await userClient
    .from("veroxa_momo_media_ai_candidates")
    .select(
      "id,requested_by,request_hash,status,provider_request_id,storage_path," +
        "file_size,output_width,output_height,content_sha256," +
        "accounted_microusd,accounting_basis,provider_usage," +
        "provider_error_code",
    )
    .eq("id", body.candidateId)
    .maybeSingle();
  const candidate = data as TerminalCandidateRow | null;
  if (
    error ||
    !candidate ||
    candidate.requested_by !== actorId ||
    candidate.request_hash !== body.requestHash
  ) return null;
  if (body.operation === "fail") {
    return candidate.status === "failed" &&
        candidate.provider_error_code === body.errorCode
      ? candidate.id
      : null;
  }
  return candidate.status === "pending_review" &&
      candidate.provider_request_id === body.providerRequestId &&
      candidate.storage_path === body.storagePath &&
      Number(candidate.file_size) === body.fileSize &&
      Number(candidate.output_width) === body.width &&
      Number(candidate.output_height) === body.height &&
      candidate.content_sha256 === body.contentSha256 &&
      Number(candidate.accounted_microusd) === body.accountedMicrousd &&
      candidate.accounting_basis === body.accountingBasis &&
      jsonEqual(candidate.provider_usage, body.providerUsage)
    ? candidate.id
    : null;
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== "POST") {
    return response({ error: "method_not_allowed" }, 405);
  }
  const authorization = request.headers.get("authorization")?.trim() || "";
  if (
    !authorization.startsWith("Bearer ") ||
    authorization.length > 8_200
  ) return response({ error: "team_access_required" }, 403);
  const accessToken = authorization.slice("Bearer ".length);
  const rawBody = await rawRequestBody(request);
  if (!rawBody) return response({ error: "invalid_request" }, 400);
  const bridgeVerified = await verifyMomoMediaAiBridgeSignature({
    publicKeyBase64: BRIDGE_PUBLIC_KEY_SPKI_BASE64,
    timestampMs:
      request.headers.get("x-veroxa-media-ai-timestamp-ms")?.trim() || "",
    nonce: request.headers.get("x-veroxa-media-ai-nonce")?.trim() || "",
    accessToken,
    body: rawBody,
    signature: request.headers.get("x-veroxa-media-ai-signature")?.trim() || "",
  });
  if (!bridgeVerified) {
    return response({ error: "bridge_access_required" }, 403);
  }
  const body = parseRequestBody(rawBody);
  if (!body) return response({ error: "invalid_request" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() || "";
  const publishableKey = namedEnvironmentKey(
    "SUPABASE_PUBLISHABLE_KEYS",
    "SUPABASE_ANON_KEY",
    "sb_publishable_",
  );
  const secretKey = namedEnvironmentKey(
    "SUPABASE_SECRET_KEYS",
    "SUPABASE_SERVICE_ROLE_KEY",
    "sb_secret_",
  );
  if (!supabaseUrl || !publishableKey || !secretKey) {
    return response({ error: "lifecycle_configuration_unavailable" }, 503);
  }

  const userClient = createClient<TerminalReplayDatabase>(
    supabaseUrl,
    publishableKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: { headers: { authorization } },
    },
  );
  const { data: userData, error: userError } = await userClient.auth.getUser(
    accessToken,
  );
  if (userError || !userData.user || !UUID_PATTERN.test(userData.user.id)) {
    return response({ error: "team_access_required" }, 403);
  }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { "x-veroxa-server-purpose": "momo-media-ai-lifecycle-v1" },
    },
  });

  let rpc:
    | "veroxa_momo_media_ai_lifecycle_preflight_v1"
    | "veroxa_start_momo_media_ai_provider_v1"
    | "veroxa_complete_momo_media_ai_candidate_v1"
    | "veroxa_fail_momo_media_ai_candidate_v1";
  let parameters: JsonObject;
  if (body.operation === "preflight") {
    rpc = "veroxa_momo_media_ai_lifecycle_preflight_v1";
    parameters = {
      p_restaurant_id: body.restaurantId,
      p_actor_id: userData.user.id,
    };
  } else if (body.operation === "start") {
    rpc = "veroxa_start_momo_media_ai_provider_v1";
    parameters = {
      p_candidate_id: body.candidateId,
      p_request_hash: body.requestHash,
      p_actor_id: userData.user.id,
    };
  } else if (body.operation === "complete") {
    rpc = "veroxa_complete_momo_media_ai_candidate_v1";
    parameters = {
      p_candidate_id: body.candidateId,
      p_request_hash: body.requestHash,
      p_provider_request_id: body.providerRequestId,
      p_storage_path: body.storagePath,
      p_file_size: body.fileSize,
      p_width: body.width,
      p_height: body.height,
      p_content_sha256: body.contentSha256,
      p_accounted_microusd: body.accountedMicrousd,
      p_accounting_basis: body.accountingBasis,
      p_provider_usage: body.providerUsage,
      p_actor_id: userData.user.id,
    };
  } else if (body.operation === "fail") {
    rpc = "veroxa_fail_momo_media_ai_candidate_v1";
    parameters = {
      p_candidate_id: body.candidateId,
      p_request_hash: body.requestHash,
      p_error_code: body.errorCode,
      p_actor_id: userData.user.id,
    };
  } else {
    return response({ error: "invalid_request" }, 400);
  }

  const { data, error } = await admin.rpc(rpc, parameters);
  if (error) {
    if (body.operation === "complete" || body.operation === "fail") {
      const replayedId = await exactTerminalReplay(
        userClient,
        userData.user.id,
        body,
      );
      if (replayedId) return response({ data: replayedId }, 200);
    }
    return response({ error: "lifecycle_rpc_rejected" }, 409);
  }
  return response({ data }, 200);
});

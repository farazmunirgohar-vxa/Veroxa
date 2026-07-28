import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { momoBytesSha256, inspectMomoPngBytes } from "../../../../momo-image-bytes";
import { getServerVeroxaContext } from "../../../../veroxa-supabase-server";
import {
  createMomoMediaAiPostHandler,
  type MomoMediaAiReservation,
  type MomoMediaAiReserveInput,
} from "./core";

export const runtime = "edge";

const OPENAI_IMAGE_EDIT_URL = "https://api.openai.com/v1/images/edits";
const openAiKey = process.env.OPENAI_API_KEY?.trim() || "";

type RpcRow = Record<string, unknown>;

function serverSupabaseConfig(): { url: string; secretKey: string } | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const canonicalSecret = process.env.SUPABASE_SECRET_KEY?.trim();
  const legacyServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const secretKey = canonicalSecret?.startsWith("sb_secret_")
    ? canonicalSecret
    : legacyServiceRole
      && !legacyServiceRole.startsWith("sb_publishable_")
      && legacyServiceRole.split(".").length === 3
      ? legacyServiceRole
      : "";
  if (!rawUrl || !secretKey) return null;
  try {
    const url = new URL(rawUrl);
    if (
      url.protocol !== "https:"
      || !url.hostname.endsWith(".supabase.co")
      || url.username
      || url.password
      || url.port
      || (url.pathname !== "/" && url.pathname !== "")
      || url.search
      || url.hash
    ) return null;
    return { url: url.origin, secretKey };
  } catch {
    return null;
  }
}

const serverConfig = serverSupabaseConfig();
const lifecycleAdmin = serverConfig
  ? createClient(serverConfig.url, serverConfig.secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { "x-veroxa-server-purpose": "momo-media-ai-lifecycle-v1" },
    },
  })
  : null;

function firstRow(value: unknown): RpcRow | null {
  const row = Array.isArray(value) ? value[0] : value;
  return typeof row === "object" && row !== null && !Array.isArray(row)
    ? row as RpcRow
    : null;
}

function candidateReservation(value: unknown): MomoMediaAiReservation {
  const row = firstRow(value);
  const status = row?.candidate_status;
  const sourceMimeType = row?.source_mime_type;
  const intendedUse = row?.intended_use;
  const evidenceClass = row?.evidence_class;
  if (
    typeof row?.candidate_id !== "string"
    || ![
      "reserved",
      "provider_running",
      "pending_review",
      "approved",
      "rejected",
    ].includes(String(status))
    || typeof row.source_storage_path !== "string"
    || !["image/jpeg", "image/png", "image/webp"].includes(
      String(sourceMimeType),
    )
    || typeof row.source_file_size !== "number"
    || typeof row.source_content_sha256 !== "string"
    || typeof row.output_width !== "number"
    || typeof row.output_height !== "number"
    || !["facebook", "instagram", "google_business", "website"].includes(
      String(intendedUse),
    )
    || !["development_proxy", "real_owner"].includes(String(evidenceClass))
    || typeof row.reserved_microusd !== "number"
  ) throw new Error("momo_media_ai_reservation_invalid");
  return {
    candidateId: row.candidate_id,
    status: status as MomoMediaAiReservation["status"],
    sourceStoragePath: row.source_storage_path,
    sourceMimeType:
      sourceMimeType as MomoMediaAiReservation["sourceMimeType"],
    sourceFileSize: row.source_file_size,
    sourceContentSha256: row.source_content_sha256,
    outputWidth: row.output_width,
    outputHeight: row.output_height,
    intendedUse: intendedUse as MomoMediaAiReservation["intendedUse"],
    evidenceClass: evidenceClass as MomoMediaAiReservation["evidenceClass"],
    reservedMicrousd: row.reserved_microusd,
  };
}

async function reserve(
  client: SupabaseClient,
  input: MomoMediaAiReserveInput,
): Promise<MomoMediaAiReservation> {
  const { data, error } = await client.rpc(
    "veroxa_reserve_momo_media_ai_candidate_v1",
    {
      p_restaurant_id: input.restaurantId,
      p_source_asset_id: input.assetId,
      p_goal: input.goal,
      p_preset_key: input.preset,
      p_quality: input.quality,
      p_alt_text: input.altText,
      p_idempotency_hash: input.idempotencyHash,
      p_request_hash: input.requestHash,
      p_processing_attestation_text: input.processingAttestation,
    },
  );
  if (error) throw new Error(error.message);
  return candidateReservation(data);
}

function storageConflict(error: { message?: string; statusCode?: string } | null): boolean {
  return Boolean(error && (
    error.statusCode === "409"
    || /already exists|duplicate|conflict/i.test(error.message || "")
  ));
}

function requiredRpcId(value: unknown, expected: string): void {
  if (typeof value !== "string" || value !== expected) {
    throw new Error("momo_media_ai_rpc_result_invalid");
  }
}

function dependenciesFor(
  client: SupabaseClient,
  admin: SupabaseClient | null,
  actor: {
    role: "team" | "client";
    restaurantId: string | null;
    userId: string;
  },
) {
  return {
    enabled: process.env.VEROXA_MEDIA_AI_ENABLED === "true",
    providerConfigured: Boolean(openAiKey && admin),
    async authenticate() {
      return actor;
    },
    async reserve(input: MomoMediaAiReserveInput) {
      return reserve(client, input);
    },
    async downloadSource(storagePath: string) {
      const { data, error } = await client.storage
        .from("restaurant-media")
        .download(storagePath, undefined, { cache: "no-store" });
      if (error || !data) throw new Error("media_ai_source_download_failed");
      return data;
    },
    async startProvider(input: {
      candidateId: string;
      requestHash: string;
    }) {
      if (!admin) throw new Error("media_ai_configuration_unavailable");
      const { data, error } = await admin.rpc(
        "veroxa_start_momo_media_ai_provider_v1",
        {
          p_candidate_id: input.candidateId,
          p_request_hash: input.requestHash,
          p_actor_id: actor.userId,
        },
      );
      if (error) throw new Error(error.message);
      const row = firstRow(data);
      if (
        row?.candidate_id !== input.candidateId
        || typeof row.should_call !== "boolean"
        || typeof row.candidate_status !== "string"
      ) throw new Error("momo_media_ai_start_invalid");
      return {
        shouldCall: row.should_call,
        status: row.candidate_status,
      };
    },
    async callOpenAI(body: FormData) {
      return fetch(OPENAI_IMAGE_EDIT_URL, {
        method: "POST",
        headers: {
          authorization: `Bearer ${openAiKey}`,
        },
        body,
        signal: AbortSignal.timeout(120_000),
      });
    },
    async storeCandidate(input: {
      storagePath: string;
      output: Blob;
      contentSha256: string;
      width: number;
      height: number;
    }) {
      const storage = client.storage.from("restaurant-media");
      const uploaded = await storage.upload(input.storagePath, input.output, {
        contentType: "image/png",
        upsert: false,
      });
      const uploadedByThisAttempt = !uploaded.error;
      if (uploaded.error && !storageConflict(uploaded.error)) {
        throw new Error("media_ai_candidate_upload_failed");
      }
      try {
        const info = await storage.info(input.storagePath);
        if (
          info.error
          || !info.data
          || info.data.size !== input.output.size
          || String(info.data.contentType || "").split(";", 1)[0].trim()
            !== "image/png"
        ) throw new Error("media_ai_candidate_info_failed");
        const readback = await storage.download(
          input.storagePath,
          { cacheNonce: input.contentSha256 },
          { cache: "no-store" },
        );
        if (readback.error || !readback.data) {
          throw new Error("media_ai_candidate_readback_failed");
        }
        const bytes = new Uint8Array(await readback.data.arrayBuffer());
        const dimensions = inspectMomoPngBytes(bytes);
        if (
          await momoBytesSha256(bytes) !== input.contentSha256
          || !dimensions
          || dimensions.width !== input.width
          || dimensions.height !== input.height
          || bytes.byteLength !== input.output.size
        ) throw new Error("media_ai_candidate_readback_mismatch");
      } catch (error) {
        if (uploadedByThisAttempt) {
          const removed = await storage.remove([input.storagePath]);
          if (removed.error) {
            throw new Error("media_ai_candidate_cleanup_failed", {
              cause: error,
            });
          }
        }
        throw error;
      }
    },
    async complete(input: {
      candidateId: string;
      requestHash: string;
      providerRequestId: string;
      storagePath: string;
      fileSize: number;
      width: number;
      height: number;
      contentSha256: string;
    }) {
      if (!admin) throw new Error("media_ai_configuration_unavailable");
      const { data, error } = await admin.rpc(
        "veroxa_complete_momo_media_ai_candidate_v1",
        {
          p_candidate_id: input.candidateId,
          p_request_hash: input.requestHash,
          p_provider_request_id: input.providerRequestId,
          p_storage_path: input.storagePath,
          p_file_size: input.fileSize,
          p_width: input.width,
          p_height: input.height,
          p_content_sha256: input.contentSha256,
          p_actor_id: actor.userId,
        },
      );
      if (error) throw new Error(error.message);
      requiredRpcId(data, input.candidateId);
    },
    async fail(input: {
      candidateId: string;
      requestHash: string;
      errorCode: string;
    }) {
      if (!admin) throw new Error("media_ai_configuration_unavailable");
      const { data, error } = await admin.rpc(
        "veroxa_fail_momo_media_ai_candidate_v1",
        {
          p_candidate_id: input.candidateId,
          p_request_hash: input.requestHash,
          p_error_code: input.errorCode,
          p_actor_id: actor.userId,
        },
      );
      if (error) throw new Error(error.message);
      requiredRpcId(data, input.candidateId);
    },
  };
}

export async function POST(request: Request): Promise<Response> {
  const context = await getServerVeroxaContext();
  if (!context) {
    return createMomoMediaAiPostHandler({
      ...dependenciesFor({} as SupabaseClient, lifecycleAdmin, {
        role: "client",
        restaurantId: null,
        userId: "00000000-0000-4000-8000-000000000000",
      }),
      authenticate: async () => null,
    })(request);
  }
  return createMomoMediaAiPostHandler(
    dependenciesFor(context.client, lifecycleAdmin, {
      role: context.access.role,
      restaurantId: context.access.restaurantId,
      userId: context.userId,
    }),
  )(request);
}

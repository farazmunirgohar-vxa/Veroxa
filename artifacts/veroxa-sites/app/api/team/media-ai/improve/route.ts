import type { SupabaseClient } from "@supabase/supabase-js";
import {
  inspectMomoImageBytesFully,
  momoBytesSha256,
} from "../../../../momo-image-bytes";
import {
  getMomoMediaAiLifecycleBridgeConfig,
  invokeMomoMediaAiLifecycleBridge,
  reconcileMomoMediaAiTerminalLifecycleBridge,
  type MomoMediaAiLifecycleBridgeConfig,
} from "../../../../momo-media-ai-lifecycle-bridge";
import { verifyMomoMediaAiOpenAiAccess } from "../../../../momo-media-ai-openai-access";
import { getServerVeroxaContext } from "../../../../veroxa-supabase-server";
import {
  createMomoMediaAiPostHandler,
  type MomoMediaAiProviderUsage,
  type MomoMediaAiReservation,
  type MomoMediaAiReserveInput,
} from "./core";

export const runtime = "edge";

const OPENAI_IMAGE_EDIT_URL = "https://api.openai.com/v1/images/edits";
const openAiKey = process.env.OPENAI_API_KEY?.trim() || "";

type RpcRow = Record<string, unknown>;
const lifecycleBridgeConfig = getMomoMediaAiLifecycleBridgeConfig();

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
  bridgeConfig: MomoMediaAiLifecycleBridgeConfig | null,
  actor: {
    role: "team" | "client";
    restaurantId: string | null;
    userId: string;
  },
) {
  return {
    enabled: process.env.VEROXA_MEDIA_AI_ENABLED === "true",
    providerConfigured: Boolean(openAiKey && bridgeConfig),
    async verifyProviderAccess() {
      return Boolean(
        openAiKey
        && bridgeConfig
        && await verifyMomoMediaAiOpenAiAccess(openAiKey),
      );
    },
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
      if (!bridgeConfig) {
        throw new Error("media_ai_configuration_unavailable");
      }
      const data = await invokeMomoMediaAiLifecycleBridge<unknown>(
        client,
        bridgeConfig,
        {
          operation: "start",
          candidateId: input.candidateId,
          requestHash: input.requestHash,
        },
      );
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
        signal: AbortSignal.timeout(180_000),
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
        if (readback.data.size !== input.output.size) {
          throw new Error("media_ai_candidate_readback_mismatch");
        }
        const bytes = new Uint8Array(await readback.data.arrayBuffer());
        const inspection = await inspectMomoImageBytesFully(bytes);
        if (
          await momoBytesSha256(bytes) !== input.contentSha256
          || inspection?.mimeType !== "image/png"
          || inspection.width !== input.width
          || inspection.height !== input.height
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
      accountedMicrousd: number;
      accountingBasis: "provider_usage_estimate" | "conservative_reservation";
      providerUsage: MomoMediaAiProviderUsage | null;
    }) {
      if (!bridgeConfig) {
        throw new Error("media_ai_configuration_unavailable");
      }
      const data = await reconcileMomoMediaAiTerminalLifecycleBridge<unknown>(
        client,
        bridgeConfig,
        {
          operation: "complete",
          candidateId: input.candidateId,
          requestHash: input.requestHash,
          providerRequestId: input.providerRequestId,
          storagePath: input.storagePath,
          fileSize: input.fileSize,
          width: input.width,
          height: input.height,
          contentSha256: input.contentSha256,
          accountedMicrousd: input.accountedMicrousd,
          accountingBasis: input.accountingBasis,
          providerUsage: input.providerUsage,
        },
      );
      requiredRpcId(data, input.candidateId);
    },
    async fail(input: {
      candidateId: string;
      requestHash: string;
      errorCode: string;
    }) {
      if (!bridgeConfig) {
        throw new Error("media_ai_configuration_unavailable");
      }
      const data = await reconcileMomoMediaAiTerminalLifecycleBridge<unknown>(
        client,
        bridgeConfig,
        {
          operation: "fail",
          candidateId: input.candidateId,
          requestHash: input.requestHash,
          errorCode: input.errorCode,
        },
      );
      requiredRpcId(data, input.candidateId);
    },
  };
}

export async function POST(request: Request): Promise<Response> {
  const context = await getServerVeroxaContext();
  if (!context) {
    return createMomoMediaAiPostHandler({
      ...dependenciesFor({} as SupabaseClient, lifecycleBridgeConfig, {
        role: "client",
        restaurantId: null,
        userId: "00000000-0000-4000-8000-000000000000",
      }),
      authenticate: async () => null,
    })(request);
  }
  return createMomoMediaAiPostHandler(
    dependenciesFor(context.client, lifecycleBridgeConfig, {
      role: context.access.role,
      restaurantId: context.access.restaurantId,
      userId: context.userId,
    }),
  )(request);
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { getMomoContentAiDispatchBridgeConfig } from "../../../../momo-content-ai-dispatch-bridge";
import {
  MOMO_CONTENT_AI_MAX_SOURCE_HEIGHT,
  MOMO_CONTENT_AI_MAX_SOURCE_WIDTH,
  MOMO_CONTENT_AI_MAX_TRUTH_BYTES,
  MOMO_CONTENT_AI_MODEL,
  type MomoContentPlatform,
  type MomoContentTruthSnapshotField,
} from "../../../../momo-content-ai-contract";
import { momoCanonicalJson } from "../../../../momo-canonical-json";
import { getServerVeroxaContext } from "../../../../veroxa-supabase-server";
import {
  createMomoContentAiPostHandler,
  type MomoContentAiReservation,
} from "./core";

export const runtime = "edge";

const OPENAI_RESPONSE_ID = /^resp_[A-Za-z0-9_-]{8,195}$/u;
const WAKE_SECRET = /^[0-9a-f]{64}$/u;
const openAiKey = process.env.OPENAI_API_KEY?.trim() || "";
const webhookSecret = process.env.OPENAI_WEBHOOK_SECRET?.trim() || "";
const dispatchBridgeConfig = getMomoContentAiDispatchBridgeConfig();
const wakeSecret =
  process.env.VEROXA_MOMO_CONTENT_AI_DISPATCH_HMAC_SECRET?.trim() || "";

function record(value: unknown): Record<string, unknown> | null {
  const row = Array.isArray(value) ? value[0] : value;
  return typeof row === "object" && row !== null && !Array.isArray(row)
    ? row as Record<string, unknown>
    : null;
}

function truthSnapshot(value: unknown): MomoContentTruthSnapshotField[] {
  if (!Array.isArray(value)) {
    throw new Error("momo_content_ai_reservation_invalid");
  }
  const result = value.map((item) => {
    const row = record(item);
    if (!row || typeof row.id !== "string" ||
      typeof row.fieldKey !== "string" ||
      row.evidenceClass !== "real_owner" ||
      typeof row.ownerConfirmedAt !== "string" ||
      !Object.hasOwn(row, "value")) {
      throw new Error("momo_content_ai_reservation_invalid");
    }
    return {
      id: row.id,
      fieldKey: row.fieldKey,
      value: row.value,
      evidenceClass: "real_owner" as const,
      ownerConfirmedAt: row.ownerConfirmedAt,
    };
  });
  if (new TextEncoder().encode(momoCanonicalJson(result)).byteLength >
    MOMO_CONTENT_AI_MAX_TRUTH_BYTES) {
    throw new Error("momo_content_ai_reservation_invalid");
  }
  return result;
}

function reservation(value: unknown): MomoContentAiReservation {
  const row = record(value);
  const platforms = Array.isArray(row?.target_platforms)
    ? row.target_platforms
    : null;
  const allowedPlatforms = new Set([
    "facebook",
    "instagram",
    "google_business",
  ]);
  const width = typeof row?.source_width === "number" ? row.source_width : 0;
  const height = typeof row?.source_height === "number" ? row.source_height : 0;
  const statuses = [
    "reserved",
    "provider_running",
    "result_staged",
    "pending_review",
    "materialized",
    "rejected",
    "failed",
  ];
  if (!row || typeof row.run_id !== "string" ||
    !statuses.includes(String(row.run_status)) ||
    typeof row.request_hash !== "string" ||
    typeof row.source_storage_path !== "string" ||
    row.source_mime_type !== "image/jpeg" ||
    typeof row.source_file_size !== "number" ||
    typeof row.source_content_sha256 !== "string" ||
    typeof row.source_width !== "number" ||
    typeof row.source_height !== "number" || width < 320 ||
    width > MOMO_CONTENT_AI_MAX_SOURCE_WIDTH || height < 250 ||
    height > MOMO_CONTENT_AI_MAX_SOURCE_HEIGHT || !platforms ||
    platforms.length < 1 || platforms.length > 3 ||
    platforms.some((platform) => typeof platform !== "string" ||
      !allowedPlatforms.has(platform)) ||
    typeof row.truth_snapshot_sha256 !== "string" ||
    typeof row.reserved_microusd !== "number" ||
    (row.provider_response_id !== null &&
      row.provider_response_id !== undefined &&
      (typeof row.provider_response_id !== "string" ||
        !OPENAI_RESPONSE_ID.test(row.provider_response_id)))) {
    throw new Error("momo_content_ai_reservation_invalid");
  }
  return {
    runId: row.run_id,
    status: row.run_status as MomoContentAiReservation["status"],
    requestHash: row.request_hash,
    sourceStoragePath: row.source_storage_path,
    sourceMimeType: "image/jpeg",
    sourceFileSize: row.source_file_size,
    sourceContentSha256: row.source_content_sha256,
    sourceWidth: row.source_width,
    sourceHeight: row.source_height,
    targetPlatforms: platforms as MomoContentPlatform[],
    truthSnapshot: truthSnapshot(row.truth_snapshot),
    truthSnapshotSha256: row.truth_snapshot_sha256,
    reservedMicrousd: row.reserved_microusd,
    providerResponseId: typeof row.provider_response_id === "string"
      ? row.provider_response_id
      : null,
    storedOutput: record(row.output_payload) as
      MomoContentAiReservation["storedOutput"],
  };
}

function dependencies(
  client: SupabaseClient,
  actor: {
    role: "team" | "client";
    restaurantId: string | null;
    userId: string;
  },
) {
  return {
    enabled: process.env.VEROXA_MOMO_CONTENT_AI_ENABLED === "true",
    providerConfigured: Boolean(
      openAiKey && webhookSecret && dispatchBridgeConfig &&
        WAKE_SECRET.test(wakeSecret),
    ),
    async authenticate() {
      return actor;
    },
    async reserve(input: {
      restaurantId: string;
      assetId: string;
      idempotencyHash: string;
      clientRequestHash: string;
      recoveryResponseId: null;
    }) {
      const { data, error } = await client.rpc(
        "veroxa_reserve_momo_content_ai_run_v1",
        {
          p_restaurant_id: input.restaurantId,
          p_source_asset_id: input.assetId,
          p_idempotency_hash: input.idempotencyHash,
          p_client_request_hash: input.clientRequestHash,
          p_recovery_response_id: null,
        },
      );
      if (error) throw new Error(error.message);
      return reservation(data);
    },
  };
}

export async function POST(request: Request): Promise<Response> {
  const context = await getServerVeroxaContext();
  if (!context) {
    return createMomoContentAiPostHandler({
      ...dependencies({} as SupabaseClient, {
        role: "client",
        restaurantId: null,
        userId: "00000000-0000-4000-8000-000000000000",
      }),
      authenticate: async () => null,
    })(request);
  }
  return createMomoContentAiPostHandler(dependencies(context.client, {
    role: context.access.role,
    restaurantId: context.access.restaurantId,
    userId: context.userId,
  }))(request);
}

export const contentAiModel = MOMO_CONTENT_AI_MODEL;

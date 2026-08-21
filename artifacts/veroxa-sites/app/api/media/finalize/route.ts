import type { SupabaseClient } from "@supabase/supabase-js";
import { isMomoContentUuid } from "../../../momo-content-ai-contract";
import {
  getMomoContentAiLifecycleBridgeConfig,
  invokeMomoContentAiLifecycleBridge,
  momoContentAiLifecycleBridgeFailure,
} from "../../../momo-content-ai-lifecycle-bridge";
import {
  createVeroxaPrivateMediaStorageImageDecoder,
} from "../../../veroxa-private-media-supabase-image-decode";
import {
  getServerSupabasePublicConfig,
  getServerVeroxaContext,
} from "../../../veroxa-supabase-server";
import {
  hasMomoMediaFinalizeProjectAuthCookie,
  resolveMomoMediaFinalizeContext,
} from "./bearer-auth";
import { createMomoMediaFinalizeHandler } from "./core";

export const runtime = "edge";

function dependencies(
  client: SupabaseClient,
  actor: {
    role: "team" | "client";
    restaurantId: string | null;
    userId: string;
  },
  serverVerifiedAccessToken?: string,
) {
  const bridge = () => getMomoContentAiLifecycleBridgeConfig();
  const bridgeOptions = (correlationId: string) =>
    serverVerifiedAccessToken
      ? { correlationId, serverVerifiedAccessToken }
      : { correlationId };
  return {
    decodeHighResolutionImage: createVeroxaPrivateMediaStorageImageDecoder({
      client,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    }),
    async authenticate() { return actor; },
    async download(storagePath: string) {
      const { data, error } = await client.storage.from("restaurant-media")
        .download(storagePath, undefined, { cache: "no-store" });
      if (error || !data) throw new Error("media_download_failed");
      return data;
    },
    async info(storagePath: string) {
      const { data, error } = await client.storage.from("restaurant-media")
        .info(storagePath);
      if (error || !data) throw new Error("media_info_failed");
      return {
        id: data.id,
        version: data.version,
        name: data.name,
        bucketId: data.bucketId,
        size: data.size ?? -1,
        contentType: data.contentType ?? "",
      };
    },
    async commit(
      input: Record<string, unknown>,
      context: { correlationId: string },
    ) {
      const bridgeConfig = bridge();
      if (!bridgeConfig) {
        throw momoContentAiLifecycleBridgeFailure({
          stage: "configuration",
          code: "momo_content_ai_lifecycle_configuration_unavailable",
          correlationId: context.correlationId,
        });
      }
      return invokeMomoContentAiLifecycleBridge<unknown>(
        client,
        bridgeConfig,
        { operation: "commit_upload", ...input },
        bridgeOptions(context.correlationId),
      );
    },
    async finalize(
      input: Record<string, unknown>,
      context: { correlationId: string },
    ) {
      const bridgeConfig = bridge();
      if (!bridgeConfig) {
        throw momoContentAiLifecycleBridgeFailure({
          stage: "configuration",
          code: "momo_content_ai_lifecycle_configuration_unavailable",
          correlationId: context.correlationId,
        });
      }
      return invokeMomoContentAiLifecycleBridge<unknown>(
        client,
        bridgeConfig,
        { operation: "finalize_upload", ...input },
        bridgeOptions(context.correlationId),
      );
    },
    async recordFailure(
      input: {
        restaurantId: string;
        assetId: string;
        failureStage: string;
        errorCode: string;
        outcome: string;
      },
      context: { correlationId: string },
    ) {
      const { data, error } = await client.rpc(
        "veroxa_record_momo_media_intake_failure_v1",
        {
          p_restaurant_id: input.restaurantId,
          p_asset_id: input.assetId,
          p_correlation_id: context.correlationId,
          p_failure_stage: input.failureStage,
          p_error_code: input.errorCode,
          p_outcome: input.outcome,
        },
      );
      const row = Array.isArray(data) ? data[0] : data;
      if (error || typeof row !== "object" || row === null ||
        Array.isArray(row)) throw new Error("intake_failure_record_unavailable");
      const receipt = row as Record<string, unknown>;
      if (!isMomoContentUuid(receipt.attempt_id) ||
        receipt.asset_id !== input.assetId ||
        !isMomoContentUuid(receipt.outbox_id) ||
        receipt.status !== "recorded" ||
        !isMomoContentUuid(receipt.correlation_id) ||
        !isMomoContentUuid(receipt.incident_id) ||
        receipt.external_write_allowed !== false) {
        throw new Error("intake_failure_receipt_invalid");
      }
      return {
        attemptId: receipt.attempt_id.toLowerCase(),
        assetId: receipt.asset_id,
        durableCorrelationId: receipt.correlation_id.toLowerCase(),
        status: receipt.status,
      };
    },
  };
}

export async function POST(request: Request): Promise<Response> {
  const config = getServerSupabasePublicConfig();
  const hadProjectAuthCookie = config
    ? hasMomoMediaFinalizeProjectAuthCookie(request, config)
    : false;
  const cookieContext = await getServerVeroxaContext();
  const resolved = await resolveMomoMediaFinalizeContext({
    request,
    config,
    cookieContext,
    hadProjectAuthCookie,
  });
  if (!resolved) {
    return createMomoMediaFinalizeHandler({
      ...dependencies({} as SupabaseClient, {
        role: "client",
        restaurantId: null,
        userId: "00000000-0000-4000-8000-000000000000",
      }),
      authenticate: async () => null,
    })(request);
  }
  const context = resolved.context;
  return createMomoMediaFinalizeHandler(dependencies(context.client, {
    role: context.access.role,
    restaurantId: context.access.restaurantId,
    userId: context.userId,
  }, resolved.serverVerifiedAccessToken))(request);
}

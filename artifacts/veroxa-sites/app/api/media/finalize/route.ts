import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getMomoContentAiLifecycleBridgeConfig,
  invokeMomoContentAiLifecycleBridge,
} from "../../../momo-content-ai-lifecycle-bridge";
import { getServerVeroxaContext } from "../../../veroxa-supabase-server";
import { createMomoMediaFinalizeHandler } from "./core";
import {
  decodeVeroxaPrivateMediaImageWithHost,
} from "../../../veroxa-private-media-host-image-decode";

export const runtime = "edge";

function dependencies(client: SupabaseClient, actor: { role: "team" | "client"; restaurantId: string | null; userId: string }) {
  const bridge = () => getMomoContentAiLifecycleBridgeConfig();
  return {
    decodeHighResolutionImage: decodeVeroxaPrivateMediaImageWithHost,
    async authenticate() { return actor; },
    async download(storagePath: string) {
      const { data, error } = await client.storage.from("restaurant-media").download(storagePath, undefined, { cache: "no-store" });
      if (error || !data) throw new Error("media_download_failed");
      return data;
    },
    async info(storagePath: string) {
      const { data, error } = await client.storage.from("restaurant-media").info(storagePath);
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
    async finalize(input: Record<string, unknown>) {
      const bridgeConfig = bridge();
      if (!bridgeConfig) throw new Error("media_verification_configuration_unavailable");
      return invokeMomoContentAiLifecycleBridge<unknown>(client, bridgeConfig, { operation: "finalize_upload", ...input });
    },
    async recordFailure(input: Record<string, unknown>) {
      const bridgeConfig = bridge();
      if (!bridgeConfig) throw new Error("media_verification_configuration_unavailable");
      return invokeMomoContentAiLifecycleBridge<unknown>(client, bridgeConfig, {
        operation: "record_intake_attempt",
        ...input,
      });
    },
  };
}

export async function POST(request: Request): Promise<Response> {
  const context = await getServerVeroxaContext();
  if (!context) {
    return createMomoMediaFinalizeHandler({
      ...dependencies({} as SupabaseClient, { role: "client", restaurantId: null, userId: "00000000-0000-4000-8000-000000000000" }),
      authenticate: async () => null,
    })(request);
  }
  return createMomoMediaFinalizeHandler(dependencies(context.client, {
    role: context.access.role,
    restaurantId: context.access.restaurantId,
    userId: context.userId,
  }))(request);
}

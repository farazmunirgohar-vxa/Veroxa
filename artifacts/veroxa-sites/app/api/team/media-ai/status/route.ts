import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getMomoMediaAiLifecycleBridgeConfig,
  invokeMomoMediaAiLifecycleBridge,
  type MomoMediaAiLifecycleBridgeConfig,
} from "../../../../momo-media-ai-lifecycle-bridge";
import { verifyMomoMediaAiOpenAiAccess } from "../../../../momo-media-ai-openai-access";
import { getServerVeroxaContext } from "../../../../veroxa-supabase-server";

export const runtime = "edge";

const lifecycleBridgeConfig = getMomoMediaAiLifecycleBridgeConfig();

function response(body: Record<string, boolean>, status: number): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
      "x-content-type-options": "nosniff",
    },
  });
}

async function lifecycleBridgeHealthy(
  client: SupabaseClient,
  bridgeConfig: MomoMediaAiLifecycleBridgeConfig | null,
  restaurantId: string,
): Promise<boolean> {
  if (!bridgeConfig) return false;
  let data: unknown;
  try {
    data = await invokeMomoMediaAiLifecycleBridge<unknown>(
      client,
      bridgeConfig,
      {
        operation: "preflight",
        restaurantId,
      },
    );
  } catch {
    return false;
  }
  const value = Array.isArray(data) ? data[0] : data;
  if (
    !value
    || typeof value !== "object"
    || Array.isArray(value)
    || Object.keys(value).length !== 1
  ) return false;
  return (value as { lifecycle_admin_healthy?: unknown })
    .lifecycle_admin_healthy === true;
}

export async function GET(): Promise<Response> {
  const context = await getServerVeroxaContext();
  if (!context || context.access.role !== "team" || !context.access.restaurantId) {
    return response({
      enabled: false,
      providerConfigured: false,
      modelMetadataVisible: false,
      lifecycleAdminHealthy: false,
      preflightReady: false,
    }, 403);
  }
  const enabled = process.env.VEROXA_MEDIA_AI_ENABLED === "true";
  const openAiKey = process.env.OPENAI_API_KEY?.trim() || "";
  const providerConfigured = Boolean(openAiKey && lifecycleBridgeConfig);
  const [modelMetadataVisible, lifecycleAdminHealthyResult] =
    await Promise.all([
      providerConfigured
        ? verifyMomoMediaAiOpenAiAccess(openAiKey)
        : Promise.resolve(false),
      lifecycleBridgeHealthy(
        context.client,
        lifecycleBridgeConfig,
        context.access.restaurantId,
      ),
    ]);
  return response({
    enabled,
    providerConfigured,
    modelMetadataVisible,
    lifecycleAdminHealthy: lifecycleAdminHealthyResult,
    preflightReady: enabled
      && providerConfigured
      && modelMetadataVisible
      && lifecycleAdminHealthyResult,
  }, 200);
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { verifyMomoMediaAiOpenAiAccess } from "../../../../momo-media-ai-openai-access";
import { getServerVeroxaContext } from "../../../../veroxa-supabase-server";

export const runtime = "edge";

type ServerSupabaseConfig = {
  url: string;
  secretKey: string;
};

function serverSupabaseConfig(): ServerSupabaseConfig | null {
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
      headers: { "x-veroxa-server-purpose": "momo-media-ai-preflight-v1" },
    },
  })
  : null;

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

async function lifecycleAdminHealthy(
  admin: SupabaseClient | null,
  restaurantId: string,
  actorId: string,
): Promise<boolean> {
  if (!admin) return false;
  const { data, error } = await admin.rpc(
    "veroxa_momo_media_ai_lifecycle_preflight_v1",
    {
      p_restaurant_id: restaurantId,
      p_actor_id: actorId,
    },
  );
  if (error) return false;
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
  const providerConfigured = Boolean(openAiKey && lifecycleAdmin);
  const [modelMetadataVisible, lifecycleAdminHealthyResult] =
    await Promise.all([
      providerConfigured
        ? verifyMomoMediaAiOpenAiAccess(openAiKey)
        : Promise.resolve(false),
      lifecycleAdminHealthy(
        lifecycleAdmin,
        context.access.restaurantId,
        context.userId,
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

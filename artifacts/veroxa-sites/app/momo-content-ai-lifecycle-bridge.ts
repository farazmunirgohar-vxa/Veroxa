import type { SupabaseClient } from "@supabase/supabase-js";

const FUNCTION_PATH = "/functions/v1/momo-content-ai-lifecycle";
const CONTEXT = `veroxa:momo-content-ai-lifecycle:v1\nPOST\n${FUNCTION_PATH}`;
const KEY_PATTERN = /^[A-Za-z0-9+/]{40,196}={0,2}$/u;

export type MomoContentAiLifecycleBridgeConfig = {
  endpoint: string;
  publishableKey: string;
  bridgePrivateKey: string;
};

type BridgeClient = Pick<SupabaseClient, "auth">;

function base64Buffer(value: string): ArrayBuffer {
  const decoded = atob(value);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0)).buffer;
}

function base64Url(value: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(value)) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

export function getMomoContentAiLifecycleBridgeConfig(environment: Record<string, string | undefined> = process.env): MomoContentAiLifecycleBridgeConfig | null {
  const rawUrl = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const bridgePrivateKey = environment.VEROXA_MEDIA_AI_BRIDGE_PRIVATE_KEY?.trim();
  if (!rawUrl || !publishableKey?.startsWith("sb_publishable_") || !bridgePrivateKey || !KEY_PATTERN.test(bridgePrivateKey)) return null;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co") || url.username || url.password || url.port || (url.pathname !== "/" && url.pathname !== "") || url.search || url.hash) return null;
    return { endpoint: new URL(FUNCTION_PATH, url.origin).toString(), publishableKey, bridgePrivateKey };
  } catch {
    return null;
  }
}

async function sign(privateKey: string, timestamp: string, nonce: string, token: string, body: string): Promise<string> {
  try {
    const key = await crypto.subtle.importKey("pkcs8", base64Buffer(privateKey), { name: "Ed25519" }, false, ["sign"]);
    const bytes = new TextEncoder().encode(`${CONTEXT}\n${timestamp}\n${nonce}\n${token}\n${body}`);
    return base64Url(await crypto.subtle.sign("Ed25519", key, bytes));
  } catch {
    throw new Error("momo_content_ai_lifecycle_signing_unavailable");
  }
}

export async function invokeMomoContentAiLifecycleBridge<T>(
  client: BridgeClient,
  config: MomoContentAiLifecycleBridgeConfig,
  requestBody: Record<string, unknown>,
  fetchImplementation: typeof fetch = fetch,
): Promise<T> {
  let { data, error } = await client.auth.getSession();
  const now = Math.floor(Date.now() / 1_000);
  if (!error && data.session && (!Number.isSafeInteger(data.session.expires_at) || Number(data.session.expires_at) <= now + 300)) {
    const refreshed = await client.auth.refreshSession();
    data = refreshed.data;
    error = refreshed.error;
  }
  const token = data.session?.access_token?.trim() || "";
  if (error || !token || token.length > 8_192 || !Number.isSafeInteger(data.session?.expires_at) || Number(data.session?.expires_at) <= now + 300) throw new Error("momo_content_ai_lifecycle_session_unavailable");
  const body = JSON.stringify(requestBody);
  if (new TextEncoder().encode(body).byteLength > 300_000) throw new Error("momo_content_ai_lifecycle_request_too_large");
  const timestamp = Date.now().toString();
  const nonce = crypto.randomUUID();
  const signature = await sign(config.bridgePrivateKey, timestamp, nonce, token, body);
  const response = await fetchImplementation(config.endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      apikey: config.publishableKey,
      "content-type": "application/json",
      "x-veroxa-content-ai-timestamp-ms": timestamp,
      "x-veroxa-content-ai-nonce": nonce,
      "x-veroxa-content-ai-signature": signature,
      "x-veroxa-server-purpose": "momo-content-ai-lifecycle-v1",
    },
    body,
    cache: "no-store",
    credentials: "omit",
    redirect: "error",
    signal: AbortSignal.timeout(20_000),
  });
  const text = await response.text();
  if (!response.ok || text.length < 2 || text.length > 65_536 || !response.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new Error("momo_content_ai_lifecycle_bridge_rejected");
  let payload: unknown;
  try { payload = JSON.parse(text); } catch { throw new Error("momo_content_ai_lifecycle_bridge_invalid"); }
  if (typeof payload !== "object" || payload === null || Array.isArray(payload) || Object.keys(payload).length !== 1 || !Object.hasOwn(payload, "data")) throw new Error("momo_content_ai_lifecycle_bridge_invalid");
  return (payload as { data: T }).data;
}

export async function reconcileMomoContentAiTerminalBridge<T>(client: BridgeClient, config: MomoContentAiLifecycleBridgeConfig, body: Record<string, unknown>): Promise<T> {
  try {
    return await invokeMomoContentAiLifecycleBridge<T>(client, config, body);
  } catch {
    return invokeMomoContentAiLifecycleBridge<T>(client, config, body);
  }
}

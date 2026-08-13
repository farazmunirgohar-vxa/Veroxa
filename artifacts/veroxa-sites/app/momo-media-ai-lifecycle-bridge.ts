import type { SupabaseClient } from "@supabase/supabase-js";

const MOMO_MEDIA_AI_LIFECYCLE_FUNCTION =
  "/functions/v1/momo-media-ai-lifecycle";
const MOMO_MEDIA_AI_SIGNING_CONTEXT =
  `veroxa:momo-media-ai-lifecycle:v1\nPOST\n${MOMO_MEDIA_AI_LIFECYCLE_FUNCTION}`;
const MOMO_MEDIA_AI_BRIDGE_PRIVATE_KEY_PATTERN =
  /^[A-Za-z0-9+/]{40,196}={0,2}$/;
const MOMO_MEDIA_AI_MAX_BRIDGE_RESPONSE_BYTES = 65_536;
const MOMO_MEDIA_AI_MAX_ACCESS_TOKEN_CHARS = 8_192;
const MOMO_MEDIA_AI_MIN_SESSION_TTL_SECONDS = 300;

export type MomoMediaAiLifecycleBridgeConfig = {
  endpoint: string;
  publishableKey: string;
  bridgePrivateKey: string;
};

type MomoMediaAiLifecycleBridgeEnvironment = {
  [key: string]: string | undefined;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  VEROXA_MOMO_MEDIA_AI_LIFECYCLE_BRIDGE_PRIVATE_KEY?: string;
};

type MomoMediaAiLifecycleBridgeClient = Pick<SupabaseClient, "auth">;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object"
    && value !== null
    && !Array.isArray(value);
}

function base64Buffer(value: string): ArrayBuffer {
  const decoded = atob(value);
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }
  return bytes.buffer;
}

function base64Url(value: ArrayBuffer): string {
  const bytes = new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function signedMessage(
  timestampMs: string,
  nonce: string,
  accessToken: string,
  body: string,
): ArrayBuffer {
  const bytes = new TextEncoder().encode(
    `${MOMO_MEDIA_AI_SIGNING_CONTEXT}\n${timestampMs}\n${nonce}\n${accessToken}\n${body}`,
  );
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

async function signBridgeRequest(
  privateKeyBase64: string,
  timestampMs: string,
  nonce: string,
  accessToken: string,
  body: string,
): Promise<string> {
  try {
    const key = await crypto.subtle.importKey(
      "pkcs8",
      base64Buffer(privateKeyBase64),
      { name: "Ed25519" },
      false,
      ["sign"],
    );
    return base64Url(await crypto.subtle.sign(
      "Ed25519",
      key,
      signedMessage(timestampMs, nonce, accessToken, body),
    ));
  } catch {
    throw new Error("momo_media_ai_lifecycle_signing_unavailable");
  }
}

export function getMomoMediaAiLifecycleBridgeConfig(
  environment: MomoMediaAiLifecycleBridgeEnvironment = process.env,
): MomoMediaAiLifecycleBridgeConfig | null {
  const rawUrl = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const bridgePrivateKey =
    environment.VEROXA_MOMO_MEDIA_AI_LIFECYCLE_BRIDGE_PRIVATE_KEY?.trim();
  if (
    !rawUrl
    || !publishableKey?.startsWith("sb_publishable_")
    || !bridgePrivateKey
    || !MOMO_MEDIA_AI_BRIDGE_PRIVATE_KEY_PATTERN.test(bridgePrivateKey)
  ) return null;
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
    return {
      endpoint: new URL(MOMO_MEDIA_AI_LIFECYCLE_FUNCTION, url.origin).toString(),
      publishableKey,
      bridgePrivateKey,
    };
  } catch {
    return null;
  }
}

export async function invokeMomoMediaAiLifecycleBridge<T>(
  client: MomoMediaAiLifecycleBridgeClient,
  config: MomoMediaAiLifecycleBridgeConfig,
  requestBody: Record<string, unknown>,
  fetchImplementation: typeof fetch = fetch,
): Promise<T> {
  let { data, error } = await client.auth.getSession();
  const nowSeconds = Math.floor(Date.now() / 1_000);
  if (
    !error
    && data.session
    && (
      !Number.isSafeInteger(data.session.expires_at)
      || Number(data.session.expires_at)
        <= nowSeconds + MOMO_MEDIA_AI_MIN_SESSION_TTL_SECONDS
    )
  ) {
    const refreshed = await client.auth.refreshSession();
    data = refreshed.data;
    error = refreshed.error;
  }
  const accessToken = data.session?.access_token?.trim() || "";
  const expiresAt = Number(data.session?.expires_at);
  if (
    error
    || !accessToken
    || accessToken.length > MOMO_MEDIA_AI_MAX_ACCESS_TOKEN_CHARS
    || !Number.isSafeInteger(expiresAt)
    || expiresAt <= nowSeconds + MOMO_MEDIA_AI_MIN_SESSION_TTL_SECONDS
  ) throw new Error("momo_media_ai_lifecycle_session_unavailable");

  const body = JSON.stringify(requestBody);
  const timestampMs = Date.now().toString();
  const nonce = crypto.randomUUID();
  const signature = await signBridgeRequest(
    config.bridgePrivateKey,
    timestampMs,
    nonce,
    accessToken,
    body,
  );
  const response = await fetchImplementation(config.endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      apikey: config.publishableKey,
      "content-type": "application/json",
      "x-veroxa-media-ai-timestamp-ms": timestampMs,
      "x-veroxa-media-ai-nonce": nonce,
      "x-veroxa-media-ai-signature": signature,
      "x-veroxa-server-purpose": "momo-media-ai-lifecycle-v1",
    },
    body,
    cache: "no-store",
    credentials: "omit",
    redirect: "error",
    signal: AbortSignal.timeout(20_000),
  });
  const text = await response.text();
  if (
    !response.ok
    || text.length < 2
    || text.length > MOMO_MEDIA_AI_MAX_BRIDGE_RESPONSE_BYTES
    || !response.headers.get("content-type")?.toLowerCase()
      .startsWith("application/json")
  ) throw new Error("momo_media_ai_lifecycle_bridge_rejected");
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("momo_media_ai_lifecycle_bridge_invalid");
  }
  if (
    !isPlainObject(payload)
    || Object.keys(payload).length !== 1
    || !Object.hasOwn(payload, "data")
  ) throw new Error("momo_media_ai_lifecycle_bridge_invalid");
  return payload.data as T;
}

export async function reconcileMomoMediaAiTerminalLifecycleBridge<T>(
  client: MomoMediaAiLifecycleBridgeClient,
  config: MomoMediaAiLifecycleBridgeConfig,
  requestBody: Record<string, unknown>,
  fetchImplementation: typeof fetch = fetch,
): Promise<T> {
  try {
    return await invokeMomoMediaAiLifecycleBridge<T>(
      client,
      config,
      requestBody,
      fetchImplementation,
    );
  } catch {
    // This is one exact database-lifecycle reconciliation, never another
    // OpenAI call. The Edge bridge accepts a terminal replay only when every
    // persisted completion/failure field matches this request.
    return invokeMomoMediaAiLifecycleBridge<T>(
      client,
      config,
      requestBody,
      fetchImplementation,
    );
  }
}

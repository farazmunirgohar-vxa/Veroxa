import { readBoundedResponseText } from "./bounded-response.ts";

const FUNCTION_PATH = "/functions/v1/momo-content-ai-dispatch-lifecycle";
const CONTEXT = `veroxa:momo-content-ai-dispatch-lifecycle:v1\nPOST\n${FUNCTION_PATH}`;
const KEY_PATTERN = /^[A-Za-z0-9+/]{40,196}={0,2}$/u;
const MAX_RESPONSE_BYTES = 320_000;

export type MomoContentAiDispatchBridgeConfig = {
  endpoint: string;
  publishableKey: string;
  bridgePrivateKey: string;
};

function base64Buffer(value: string): ArrayBuffer {
  const decoded = atob(value);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0)).buffer;
}

function base64Url(value: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(value)) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_")
    .replace(/=+$/u, "");
}

export function getMomoContentAiDispatchBridgeConfig(
  environment: Record<string, string | undefined> = process.env,
): MomoContentAiDispatchBridgeConfig | null {
  const rawUrl = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const bridgePrivateKey =
    environment.VEROXA_MOMO_CONTENT_AI_DISPATCH_BRIDGE_PRIVATE_KEY?.trim();
  if (!rawUrl || !publishableKey?.startsWith("sb_publishable_") ||
    !bridgePrivateKey || !KEY_PATTERN.test(bridgePrivateKey)) return null;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co") ||
      url.username || url.password || url.port ||
      (url.pathname !== "/" && url.pathname !== "") || url.search || url.hash) {
      return null;
    }
    return {
      endpoint: new URL(FUNCTION_PATH, url.origin).toString(),
      publishableKey,
      bridgePrivateKey,
    };
  } catch {
    return null;
  }
}

async function sign(
  privateKey: string,
  timestamp: string,
  nonce: string,
  body: string,
): Promise<string> {
  try {
    const key = await crypto.subtle.importKey(
      "pkcs8",
      base64Buffer(privateKey),
      { name: "Ed25519" },
      false,
      ["sign"],
    );
    const bytes = new TextEncoder().encode(
      `${CONTEXT}\n${timestamp}\n${nonce}\n${body}`,
    );
    return base64Url(await crypto.subtle.sign("Ed25519", key, bytes));
  } catch {
    throw new Error("momo_content_ai_dispatch_lifecycle_signing_unavailable");
  }
}

async function boundedResponseText(response: Response): Promise<string> {
  return readBoundedResponseText(response, {
    maxBytes: MAX_RESPONSE_BYTES,
    minBytes: 2,
    errorMessage: "momo_content_ai_dispatch_lifecycle_bridge_invalid",
  });
}

export async function invokeMomoContentAiDispatchBridge<T>(
  config: MomoContentAiDispatchBridgeConfig,
  requestBody: Record<string, unknown>,
  fetchImplementation: typeof fetch = fetch,
): Promise<T> {
  const body = JSON.stringify(requestBody);
  if (new TextEncoder().encode(body).byteLength > 20_000) {
    throw new Error("momo_content_ai_dispatch_lifecycle_request_too_large");
  }
  const timestamp = Date.now().toString();
  const nonce = crypto.randomUUID();
  const signature = await sign(
    config.bridgePrivateKey,
    timestamp,
    nonce,
    body,
  );
  const response = await fetchImplementation(config.endpoint, {
    method: "POST",
    headers: {
      apikey: config.publishableKey,
      "content-type": "application/json",
      "x-veroxa-content-ai-timestamp-ms": timestamp,
      "x-veroxa-content-ai-nonce": nonce,
      "x-veroxa-content-ai-signature": signature,
      "x-veroxa-server-purpose": "momo-content-ai-dispatch-lifecycle-v1",
    },
    body,
    cache: "no-store",
    credentials: "omit",
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });
  const text = await boundedResponseText(response);
  if (!response.ok ||
    !response.headers.get("content-type")?.toLowerCase()
      .startsWith("application/json")) {
    throw new Error("momo_content_ai_dispatch_lifecycle_bridge_rejected");
  }
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("momo_content_ai_dispatch_lifecycle_bridge_invalid");
  }
  if (typeof payload !== "object" || payload === null ||
    Array.isArray(payload) || Object.keys(payload).length !== 1 ||
    !Object.hasOwn(payload, "data")) {
    throw new Error("momo_content_ai_dispatch_lifecycle_bridge_invalid");
  }
  return (payload as { data: T }).data;
}

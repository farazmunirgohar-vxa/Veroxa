import type { SupabaseClient } from "@supabase/supabase-js";

const FUNCTION_PATH = "/functions/v1/momo-content-ai-lifecycle";
const CONTEXT = `veroxa:momo-content-ai-lifecycle:v1\nPOST\n${FUNCTION_PATH}`;
const KEY_PATTERN = /^[A-Za-z0-9+/]{40,196}={0,2}$/u;
const ACCESS_TOKEN_PATTERN =
  /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u;
const UPSTREAM_AUTH_ERROR_CODES = new Set([
  "bridge_access_required",
  "team_access_required",
] as const);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const PREFLIGHT_MESSAGE = new TextEncoder().encode(
  "veroxa:momo-content-ai-lifecycle:key-pair-preflight:v1",
);

export const MOMO_CONTENT_AI_LIFECYCLE_BRIDGE_PUBLIC_KEY_SPKI_BASE64 =
  "MCowBQYDK2VwAyEArmlgiwbW474YydgB3L+rvFjzMVQWb06tKBDU73mmPEk=";

export type MomoContentAiLifecycleBridgeConfig = {
  endpoint: string;
  publishableKey: string;
  bridgePrivateKey: string;
  bridgePublicKey: string;
};

export type MomoContentAiLifecycleBridgeStage =
  | "configuration"
  | "session"
  | "request"
  | "key_preflight"
  | "transport"
  | "response_status"
  | "response_body"
  | "response_contract";

export type MomoContentAiLifecycleBridgeErrorCode =
  | "momo_content_ai_lifecycle_configuration_unavailable"
  | "momo_content_ai_lifecycle_session_unavailable"
  | "momo_content_ai_lifecycle_request_too_large"
  | "momo_content_ai_lifecycle_key_pair_invalid"
  | "momo_content_ai_lifecycle_transport_unavailable"
  | "momo_content_ai_lifecycle_bridge_rejected"
  | "momo_content_ai_lifecycle_response_unavailable"
  | "momo_content_ai_lifecycle_response_invalid";

export type MomoContentAiLifecycleUpstreamAuthErrorCode =
  | "bridge_access_required"
  | "team_access_required";

export type MomoContentAiLifecycleBridgeTelemetry = {
  event: "momo_content_ai_lifecycle_bridge_failure";
  correlationId: string;
  stage: MomoContentAiLifecycleBridgeStage;
  code: MomoContentAiLifecycleBridgeErrorCode;
  retryable: boolean;
  httpStatus: number | null;
  upstreamAuthError: MomoContentAiLifecycleUpstreamAuthErrorCode | null;
};

export class MomoContentAiLifecycleBridgeError extends Error {
  readonly code: MomoContentAiLifecycleBridgeErrorCode;
  readonly stage: MomoContentAiLifecycleBridgeStage;
  readonly correlationId: string;
  readonly retryable: boolean;
  readonly httpStatus: number | null;
  readonly upstreamAuthError:
    MomoContentAiLifecycleUpstreamAuthErrorCode | null;

  constructor(input: Omit<MomoContentAiLifecycleBridgeTelemetry, "event">) {
    super(input.code);
    this.name = "MomoContentAiLifecycleBridgeError";
    this.code = input.code;
    this.stage = input.stage;
    this.correlationId = input.correlationId;
    this.retryable = input.retryable;
    this.httpStatus = input.httpStatus;
    this.upstreamAuthError = input.upstreamAuthError;
  }
}

type BridgeClient = Pick<SupabaseClient, "auth">;
type BridgeTelemetrySink = (
  event: MomoContentAiLifecycleBridgeTelemetry,
) => void;

export type MomoContentAiLifecycleBridgeInvocationOptions = {
  correlationId?: string;
  fetchImplementation?: typeof fetch;
  telemetry?: BridgeTelemetrySink;
  serverVerifiedAccessToken?: string;
};

function base64Buffer(value: string): ArrayBuffer {
  const decoded = atob(value);
  return Uint8Array.from(
    decoded,
    (character) => character.charCodeAt(0),
  ).buffer;
}

function base64Url(value: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(value)) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function safeCorrelationId(value: string | undefined): string {
  return value && UUID.test(value) ? value.toLowerCase() : crypto.randomUUID();
}

function defaultTelemetry(event: MomoContentAiLifecycleBridgeTelemetry): void {
  console.warn("veroxa_bridge_failure", JSON.stringify(event));
}

function allowlistedUpstreamAuthError(
  response: Response,
  text: string,
): MomoContentAiLifecycleUpstreamAuthErrorCode | null {
  if (text.length < 2 || text.length > 1_024) return null;
  const contentType = response.headers.get("content-type")?.trim() || "";
  if (!/^application\/json(?:\s*;\s*charset\s*=\s*(?:"utf-8"|utf-8))?$/iu
    .test(contentType)) return null;
  const match = text.match(
    /^\s*\{\s*"error"\s*:\s*"(bridge_access_required|team_access_required)"\s*\}\s*$/u,
  );
  const error = match?.[1];
  return error && UPSTREAM_AUTH_ERROR_CODES.has(
      error as MomoContentAiLifecycleUpstreamAuthErrorCode,
    )
    ? error as MomoContentAiLifecycleUpstreamAuthErrorCode
    : null;
}

export function momoContentAiLifecycleBridgeFailure(input: {
  stage: MomoContentAiLifecycleBridgeStage;
  code: MomoContentAiLifecycleBridgeErrorCode;
  correlationId?: string;
  retryable?: boolean;
  httpStatus?: number | null;
  upstreamAuthError?: MomoContentAiLifecycleUpstreamAuthErrorCode | null;
  telemetry?: BridgeTelemetrySink;
}): MomoContentAiLifecycleBridgeError {
  const event: MomoContentAiLifecycleBridgeTelemetry = {
    event: "momo_content_ai_lifecycle_bridge_failure",
    correlationId: safeCorrelationId(input.correlationId),
    stage: input.stage,
    code: input.code,
    retryable: input.retryable === true,
    httpStatus: input.httpStatus ?? null,
    upstreamAuthError: input.upstreamAuthError ?? null,
  };
  (input.telemetry ?? defaultTelemetry)(event);
  return new MomoContentAiLifecycleBridgeError(event);
}

export function getMomoContentAiLifecycleBridgeConfig(
  environment: Record<string, string | undefined> = process.env,
): MomoContentAiLifecycleBridgeConfig | null {
  const rawUrl = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const bridgePrivateKey = environment
    .VEROXA_MOMO_CONTENT_AI_LIFECYCLE_BRIDGE_PRIVATE_KEY?.trim();
  if (!rawUrl || !publishableKey?.startsWith("sb_publishable_") ||
    !bridgePrivateKey || !KEY_PATTERN.test(bridgePrivateKey)) return null;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co") ||
      url.username || url.password || url.port ||
      (url.pathname !== "/" && url.pathname !== "") || url.search ||
      url.hash) return null;
    return {
      endpoint: new URL(FUNCTION_PATH, url.origin).toString(),
      publishableKey,
      bridgePrivateKey,
      bridgePublicKey:
        MOMO_CONTENT_AI_LIFECYCLE_BRIDGE_PUBLIC_KEY_SPKI_BASE64,
    };
  } catch {
    return null;
  }
}

export async function importVerifiedMomoContentAiLifecycleSigningKey(input: {
  privateKeyBase64: string;
  publicKeyBase64: string;
}): Promise<CryptoKey | null> {
  try {
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      base64Buffer(input.privateKeyBase64),
      { name: "Ed25519" },
      false,
      ["sign"],
    );
    const publicKey = await crypto.subtle.importKey(
      "spki",
      base64Buffer(input.publicKeyBase64),
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    const signature = await crypto.subtle.sign(
      "Ed25519",
      privateKey,
      PREFLIGHT_MESSAGE,
    );
    return await crypto.subtle.verify(
      "Ed25519",
      publicKey,
      signature,
      PREFLIGHT_MESSAGE,
    ) ? privateKey : null;
  } catch {
    return null;
  }
}

async function sign(
  privateKey: CryptoKey,
  timestamp: string,
  nonce: string,
  token: string,
  body: string,
): Promise<string> {
  const bytes = new TextEncoder().encode(
    `${CONTEXT}\n${timestamp}\n${nonce}\n${token}\n${body}`,
  );
  return base64Url(
    await crypto.subtle.sign("Ed25519", privateKey, bytes),
  );
}

export async function invokeMomoContentAiLifecycleBridge<T>(
  client: BridgeClient,
  config: MomoContentAiLifecycleBridgeConfig,
  requestBody: Record<string, unknown>,
  options: MomoContentAiLifecycleBridgeInvocationOptions = {},
): Promise<T> {
  const correlationId = safeCorrelationId(options.correlationId);
  const telemetry = options.telemetry;
  let token = "";
  if (Object.hasOwn(options, "serverVerifiedAccessToken")) {
    const serverVerifiedAccessToken = options.serverVerifiedAccessToken;
    if (typeof serverVerifiedAccessToken !== "string" ||
      serverVerifiedAccessToken.length > 8_192 ||
      !ACCESS_TOKEN_PATTERN.test(serverVerifiedAccessToken)) {
      throw momoContentAiLifecycleBridgeFailure({
        stage: "session",
        code: "momo_content_ai_lifecycle_session_unavailable",
        correlationId,
        telemetry,
      });
    }
    token = serverVerifiedAccessToken;
  } else {
    let sessionResult;
    try {
      sessionResult = await client.auth.getSession();
      const now = Math.floor(Date.now() / 1_000);
      if (!sessionResult.error && sessionResult.data.session &&
        (!Number.isSafeInteger(sessionResult.data.session.expires_at) ||
          Number(sessionResult.data.session.expires_at) <= now + 300)) {
        sessionResult = await client.auth.refreshSession();
      }
    } catch {
      throw momoContentAiLifecycleBridgeFailure({
        stage: "session",
        code: "momo_content_ai_lifecycle_session_unavailable",
        correlationId,
        telemetry,
      });
    }
    const now = Math.floor(Date.now() / 1_000);
    token = sessionResult.data.session?.access_token?.trim() || "";
    if (sessionResult.error || !token || token.length > 8_192 ||
      !Number.isSafeInteger(sessionResult.data.session?.expires_at) ||
      Number(sessionResult.data.session?.expires_at) <= now + 300) {
      throw momoContentAiLifecycleBridgeFailure({
        stage: "session",
        code: "momo_content_ai_lifecycle_session_unavailable",
        correlationId,
        telemetry,
      });
    }
  }
  const body = JSON.stringify(requestBody);
  if (new TextEncoder().encode(body).byteLength > 300_000) {
    throw momoContentAiLifecycleBridgeFailure({
      stage: "request",
      code: "momo_content_ai_lifecycle_request_too_large",
      correlationId,
      telemetry,
    });
  }
  const signingKey = await importVerifiedMomoContentAiLifecycleSigningKey({
    privateKeyBase64: config.bridgePrivateKey,
    publicKeyBase64: config.bridgePublicKey,
  });
  if (!signingKey) {
    throw momoContentAiLifecycleBridgeFailure({
      stage: "key_preflight",
      code: "momo_content_ai_lifecycle_key_pair_invalid",
      correlationId,
      telemetry,
    });
  }
  const timestamp = Date.now().toString();
  const nonce = crypto.randomUUID();
  let signature: string;
  try {
    signature = await sign(signingKey, timestamp, nonce, token, body);
  } catch {
    throw momoContentAiLifecycleBridgeFailure({
      stage: "key_preflight",
      code: "momo_content_ai_lifecycle_key_pair_invalid",
      correlationId,
      telemetry,
    });
  }
  let response: Response;
  try {
    response = await (options.fetchImplementation ?? fetch)(config.endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        apikey: config.publishableKey,
        "content-type": "application/json",
        "x-veroxa-content-ai-timestamp-ms": timestamp,
        "x-veroxa-content-ai-nonce": nonce,
        "x-veroxa-content-ai-signature": signature,
        "x-veroxa-correlation-id": correlationId,
        "x-veroxa-server-purpose": "momo-content-ai-lifecycle-v1",
      },
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw momoContentAiLifecycleBridgeFailure({
      stage: "transport",
      code: "momo_content_ai_lifecycle_transport_unavailable",
      correlationId,
      retryable: true,
      telemetry,
    });
  }
  if (response.status >= 300 && response.status < 400) {
    throw momoContentAiLifecycleBridgeFailure({
      stage: "response_status",
      code: "momo_content_ai_lifecycle_bridge_rejected",
      correlationId,
      retryable: false,
      httpStatus: response.status,
      telemetry,
    });
  }
  let text: string;
  try {
    text = await response.text();
  } catch {
    throw momoContentAiLifecycleBridgeFailure({
      stage: "response_body",
      code: "momo_content_ai_lifecycle_response_unavailable",
      correlationId,
      retryable: true,
      telemetry,
    });
  }
  if (!response.ok) {
    throw momoContentAiLifecycleBridgeFailure({
      stage: "response_status",
      code: "momo_content_ai_lifecycle_bridge_rejected",
      correlationId,
      retryable: response.status === 408 || response.status === 429 ||
        response.status >= 500,
      httpStatus: response.status,
      upstreamAuthError: allowlistedUpstreamAuthError(response, text),
      telemetry,
    });
  }
  if (text.length < 2 || text.length > 65_536 ||
    !response.headers.get("content-type")?.toLowerCase().startsWith(
      "application/json",
    )) {
    throw momoContentAiLifecycleBridgeFailure({
      stage: "response_body",
      code: "momo_content_ai_lifecycle_response_invalid",
      correlationId,
      retryable: true,
      telemetry,
    });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw momoContentAiLifecycleBridgeFailure({
      stage: "response_contract",
      code: "momo_content_ai_lifecycle_response_invalid",
      correlationId,
      retryable: true,
      telemetry,
    });
  }
  if (typeof payload !== "object" || payload === null ||
    Array.isArray(payload) || Object.keys(payload).length !== 1 ||
    !Object.hasOwn(payload, "data")) {
    throw momoContentAiLifecycleBridgeFailure({
      stage: "response_contract",
      code: "momo_content_ai_lifecycle_response_invalid",
      correlationId,
      retryable: true,
      telemetry,
    });
  }
  return (payload as { data: T }).data;
}

export async function reconcileMomoContentAiTerminalBridge<T>(
  client: BridgeClient,
  config: MomoContentAiLifecycleBridgeConfig,
  body: Record<string, unknown>,
  options: MomoContentAiLifecycleBridgeInvocationOptions = {},
): Promise<T> {
  const correlationId = safeCorrelationId(options.correlationId);
  try {
    return await invokeMomoContentAiLifecycleBridge<T>(client, config, body, {
      ...options,
      correlationId,
    });
  } catch (error) {
    if (!(error instanceof MomoContentAiLifecycleBridgeError) ||
      !error.retryable) throw error;
    return invokeMomoContentAiLifecycleBridge<T>(client, config, body, {
      ...options,
      correlationId,
    });
  }
}

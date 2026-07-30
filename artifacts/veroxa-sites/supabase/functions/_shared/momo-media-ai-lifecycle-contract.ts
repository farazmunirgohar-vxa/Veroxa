const MAX_CLOCK_SKEW_MS = 60_000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const ED25519_SIGNATURE_PATTERN = /^[A-Za-z0-9_-]{86}$/;
const SIGNING_CONTEXT =
  "veroxa:momo-media-ai-lifecycle:v1\nPOST\n/functions/v1/momo-media-ai-lifecycle";

export type JsonObject = Record<string, unknown>;

export type MomoMediaAiProviderUsage = {
  input_tokens: number;
  input_tokens_details: {
    image_tokens: number;
    text_tokens: number;
  };
  output_tokens: number;
  total_tokens: number;
};

export type MomoMediaAiLifecycleRequest =
  | {
    operation: "preflight";
    restaurantId: string;
  }
  | {
    operation: "start";
    candidateId: string;
    requestHash: string;
  }
  | {
    operation: "complete";
    candidateId: string;
    requestHash: string;
    providerRequestId: string;
    storagePath: string;
    fileSize: number;
    width: number;
    height: number;
    contentSha256: string;
    accountedMicrousd: number;
    accountingBasis:
      | "provider_usage_estimate"
      | "conservative_reservation";
    providerUsage: MomoMediaAiProviderUsage | null;
  }
  | {
    operation: "fail";
    candidateId: string;
    requestHash: string;
    errorCode: string;
  };

export function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value);
}

function exactKeys(value: JsonObject, keys: string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length &&
    actual.every((key, index) => key === expected[index]);
}

function base64Bytes(value: string): Uint8Array {
  const decoded = atob(value);
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }
  return bytes;
}

function base64UrlBytes(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") +
    "=".repeat((4 - value.length % 4) % 4);
  return base64Bytes(padded);
}

function signedMessage(
  timestampMs: string,
  nonce: string,
  accessToken: string,
  body: string,
): Uint8Array {
  return new TextEncoder().encode(
    `${SIGNING_CONTEXT}\n${timestampMs}\n${nonce}\n${accessToken}\n${body}`,
  );
}

export async function verifyMomoMediaAiBridgeSignature(input: {
  publicKeyBase64: string;
  timestampMs: string;
  nonce: string;
  accessToken: string;
  body: string;
  signature: string;
  nowMs?: number;
}): Promise<boolean> {
  const timestamp = Number(input.timestampMs);
  const nowMs = input.nowMs ?? Date.now();
  if (
    !/^\d{13}$/u.test(input.timestampMs) ||
    !Number.isSafeInteger(timestamp) ||
    Math.abs(nowMs - timestamp) > MAX_CLOCK_SKEW_MS ||
    !UUID_PATTERN.test(input.nonce) ||
    !input.accessToken ||
    input.accessToken.length > 8_192 ||
    input.body.length < 2 ||
    !ED25519_SIGNATURE_PATTERN.test(input.signature)
  ) return false;
  try {
    const key = await crypto.subtle.importKey(
      "spki",
      base64Bytes(input.publicKeyBase64),
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    return await crypto.subtle.verify(
      "Ed25519",
      key,
      base64UrlBytes(input.signature),
      signedMessage(
        input.timestampMs,
        input.nonce,
        input.accessToken,
        input.body,
      ),
    );
  } catch {
    return false;
  }
}

function validProviderUsage(
  value: unknown,
): value is MomoMediaAiProviderUsage {
  if (
    !isPlainObject(value) || !exactKeys(value, [
      "input_tokens",
      "input_tokens_details",
      "output_tokens",
      "total_tokens",
    ])
  ) return false;
  if (
    !Number.isSafeInteger(value.input_tokens) ||
    !Number.isSafeInteger(value.output_tokens) ||
    !Number.isSafeInteger(value.total_tokens) ||
    Number(value.input_tokens) < 0 ||
    Number(value.output_tokens) < 0 ||
    Number(value.total_tokens) < 0 ||
    !isPlainObject(value.input_tokens_details) ||
    !exactKeys(value.input_tokens_details, ["image_tokens", "text_tokens"]) ||
    !Number.isSafeInteger(value.input_tokens_details.image_tokens) ||
    !Number.isSafeInteger(value.input_tokens_details.text_tokens) ||
    Number(value.input_tokens_details.image_tokens) < 0 ||
    Number(value.input_tokens_details.text_tokens) < 0
  ) return false;
  return Number(value.input_tokens) ===
      Number(value.input_tokens_details.image_tokens) +
        Number(value.input_tokens_details.text_tokens) &&
    Number(value.total_tokens) ===
      Number(value.input_tokens) + Number(value.output_tokens);
}

export function validMomoMediaAiLifecycleRequest(
  body: JsonObject,
): body is MomoMediaAiLifecycleRequest {
  if (body.operation === "preflight") {
    return exactKeys(body, ["operation", "restaurantId"]) &&
      typeof body.restaurantId === "string" &&
      UUID_PATTERN.test(body.restaurantId);
  }
  if (body.operation === "start") {
    return exactKeys(body, ["operation", "candidateId", "requestHash"]) &&
      typeof body.candidateId === "string" &&
      UUID_PATTERN.test(body.candidateId) &&
      typeof body.requestHash === "string" &&
      SHA256_PATTERN.test(body.requestHash);
  }
  if (body.operation === "complete") {
    return exactKeys(body, [
      "operation",
      "candidateId",
      "requestHash",
      "providerRequestId",
      "storagePath",
      "fileSize",
      "width",
      "height",
      "contentSha256",
      "accountedMicrousd",
      "accountingBasis",
      "providerUsage",
    ]) &&
      typeof body.candidateId === "string" &&
      UUID_PATTERN.test(body.candidateId) &&
      typeof body.requestHash === "string" &&
      SHA256_PATTERN.test(body.requestHash) &&
      typeof body.providerRequestId === "string" &&
      body.providerRequestId.length >= 1 &&
      body.providerRequestId.length <= 200 &&
      body.providerRequestId === body.providerRequestId.trim() &&
      typeof body.storagePath === "string" &&
      body.storagePath.length >= 20 &&
      body.storagePath.length <= 500 &&
      typeof body.fileSize === "number" &&
      Number.isSafeInteger(body.fileSize) &&
      body.fileSize >= 1 &&
      body.fileSize <= 52_428_800 &&
      typeof body.width === "number" &&
      Number.isSafeInteger(body.width) &&
      body.width >= 16 &&
      body.width <= 3_840 &&
      typeof body.height === "number" &&
      Number.isSafeInteger(body.height) &&
      body.height >= 16 &&
      body.height <= 3_840 &&
      typeof body.contentSha256 === "string" &&
      SHA256_PATTERN.test(body.contentSha256) &&
      typeof body.accountedMicrousd === "number" &&
      Number.isSafeInteger(body.accountedMicrousd) &&
      body.accountedMicrousd >= 1 &&
      body.accountedMicrousd <= 20_000_000 &&
      (
        body.accountingBasis === "provider_usage_estimate" ||
        body.accountingBasis === "conservative_reservation"
      ) &&
      (
        body.accountingBasis === "provider_usage_estimate"
          ? validProviderUsage(body.providerUsage)
          : body.providerUsage === null
      );
  }
  if (body.operation === "fail") {
    return exactKeys(
      body,
      ["operation", "candidateId", "requestHash", "errorCode"],
    ) &&
      typeof body.candidateId === "string" &&
      UUID_PATTERN.test(body.candidateId) &&
      typeof body.requestHash === "string" &&
      SHA256_PATTERN.test(body.requestHash) &&
      typeof body.errorCode === "string" &&
      /^[a-z0-9_]{3,80}$/.test(body.errorCode);
  }
  return false;
}

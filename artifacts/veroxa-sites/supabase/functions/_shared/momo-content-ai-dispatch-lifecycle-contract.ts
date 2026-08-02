const MAX_CLOCK_SKEW_MS = 60_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const SHA256 = /^[0-9a-f]{64}$/u;
const RESPONSE_ID = /^resp_[A-Za-z0-9_-]{8,195}$/u;
const SIGNATURE = /^[A-Za-z0-9_-]{86}$/u;
const ERROR_CODE = /^[a-z0-9_]{3,80}$/u;
const CONTEXT = "veroxa:momo-content-ai-dispatch-lifecycle:v1\nPOST\n/functions/v1/momo-content-ai-dispatch-lifecycle";

export type JsonObject = Record<string, unknown>;

export type MomoContentAiDispatchLifecycleRequest =
  | {
      operation: "claim";
      wakeNonce: string;
      signedAtMs: number;
      leaseToken: string;
    }
  | {
      operation: "claim_recovery";
      wakeNonce: string;
      signedAtMs: number;
    }
  | {
      operation: "begin";
      runId: string;
      requestHash: string;
      leaseToken: string;
      dispatchClaimToken: string;
      providerRequestSha256: string;
    }
  | {
      operation: "release";
      runId: string;
      requestHash: string;
      leaseToken: string;
      errorCode: string;
      retryable: boolean;
    }
  | {
      operation: "cancel_before_post";
      runId: string;
      requestHash: string;
      leaseToken: string;
      dispatchClaimToken: string;
      providerRequestSha256: string;
      errorCode: string;
    }
  | {
      operation: "bind";
      runId: string;
      requestHash: string;
      leaseToken: string;
      dispatchClaimToken: string;
      providerResponseId: string;
    }
  | {
      operation: "reconcile";
      runId: string;
      requestHash: string;
      leaseToken: string;
      dispatchClaimToken: string;
      errorCode: string;
    }
  | {
      operation: "reject_after_post";
      runId: string;
      requestHash: string;
      leaseToken: string;
      dispatchClaimToken: string;
      providerRequestSha256: string;
      providerHttpStatus: number;
      providerResponseSha256: string;
      providerRequestId: string | null;
    };

export const isPlainObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function exact(value: JsonObject, keys: string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length &&
    actual.every((key, index) => key === expected[index]);
}

function uuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value) &&
    value !== "00000000-0000-0000-0000-000000000000";
}

function identity(body: JsonObject): boolean {
  return uuid(body.runId) && typeof body.requestHash === "string" &&
    SHA256.test(body.requestHash) && uuid(body.leaseToken);
}

export function validMomoContentAiDispatchLifecycleRequest(
  body: JsonObject,
): body is MomoContentAiDispatchLifecycleRequest {
  if (body.operation === "claim") {
    return exact(body, ["operation", "wakeNonce", "signedAtMs", "leaseToken"]) &&
      uuid(body.wakeNonce) && uuid(body.leaseToken) &&
      Number.isSafeInteger(body.signedAtMs) &&
      Number(body.signedAtMs) >= 1_000_000_000_000 &&
      Number(body.signedAtMs) <= 9_999_999_999_999;
  }
  if (body.operation === "claim_recovery") {
    return exact(body, ["operation", "wakeNonce", "signedAtMs"]) &&
      uuid(body.wakeNonce) && Number.isSafeInteger(body.signedAtMs) &&
      Number(body.signedAtMs) >= 1_000_000_000_000 &&
      Number(body.signedAtMs) <= 9_999_999_999_999;
  }
  if (!identity(body)) return false;
  if (body.operation === "begin") {
    return exact(body, [
      "operation", "runId", "requestHash", "leaseToken",
      "dispatchClaimToken", "providerRequestSha256",
    ]) && uuid(body.dispatchClaimToken) &&
      typeof body.providerRequestSha256 === "string" &&
      SHA256.test(body.providerRequestSha256);
  }
  if (body.operation === "release") {
    return exact(body, [
      "operation", "runId", "requestHash", "leaseToken", "errorCode",
      "retryable",
    ]) && typeof body.errorCode === "string" && ERROR_CODE.test(body.errorCode) &&
      typeof body.retryable === "boolean";
  }
  if (body.operation === "cancel_before_post") {
    return exact(body, [
      "operation", "runId", "requestHash", "leaseToken",
      "dispatchClaimToken", "providerRequestSha256", "errorCode",
    ]) && uuid(body.dispatchClaimToken) &&
      typeof body.providerRequestSha256 === "string" &&
      SHA256.test(body.providerRequestSha256) &&
      typeof body.errorCode === "string" && ERROR_CODE.test(body.errorCode);
  }
  if (body.operation === "bind") {
    return exact(body, [
      "operation", "runId", "requestHash", "leaseToken",
      "dispatchClaimToken", "providerResponseId",
    ]) && uuid(body.dispatchClaimToken) &&
      typeof body.providerResponseId === "string" &&
      RESPONSE_ID.test(body.providerResponseId);
  }
  if (body.operation === "reject_after_post") {
    return exact(body, [
      "operation", "runId", "requestHash", "leaseToken",
      "dispatchClaimToken", "providerRequestSha256", "providerHttpStatus",
      "providerResponseSha256", "providerRequestId",
    ]) && uuid(body.dispatchClaimToken) &&
      typeof body.providerRequestSha256 === "string" &&
      SHA256.test(body.providerRequestSha256) &&
      typeof body.providerResponseSha256 === "string" &&
      SHA256.test(body.providerResponseSha256) &&
      typeof body.providerHttpStatus === "number" &&
      [400, 401, 403, 404, 405, 413, 415, 422]
        .includes(body.providerHttpStatus) &&
      (body.providerRequestId === null ||
        (typeof body.providerRequestId === "string" &&
          /^req_[A-Za-z0-9_-]{8,195}$/u.test(body.providerRequestId)));
  }
  return body.operation === "reconcile" && exact(body, [
    "operation", "runId", "requestHash", "leaseToken",
    "dispatchClaimToken", "errorCode",
  ]) && uuid(body.dispatchClaimToken) &&
    typeof body.errorCode === "string" && ERROR_CODE.test(body.errorCode);
}

function base64Bytes(value: string): Uint8Array {
  const decoded = atob(value);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

function base64UrlBytes(value: string): Uint8Array {
  return base64Bytes(
    value.replaceAll("-", "+").replaceAll("_", "/") +
      "=".repeat((4 - value.length % 4) % 4),
  );
}

export async function verifyMomoContentAiDispatchBridgeSignature(input: {
  publicKeyBase64: string;
  timestampMs: string;
  nonce: string;
  body: string;
  signature: string;
}): Promise<boolean> {
  const timestamp = Number(input.timestampMs);
  if (!/^\d{13}$/u.test(input.timestampMs) || !Number.isSafeInteger(timestamp) ||
    Math.abs(Date.now() - timestamp) > MAX_CLOCK_SKEW_MS ||
    !UUID.test(input.nonce) || !SIGNATURE.test(input.signature)) return false;
  try {
    const key = await crypto.subtle.importKey(
      "spki",
      base64Bytes(input.publicKeyBase64),
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    const message = new TextEncoder().encode(
      `${CONTEXT}\n${input.timestampMs}\n${input.nonce}\n${input.body}`,
    );
    return crypto.subtle.verify(
      "Ed25519",
      key,
      base64UrlBytes(input.signature),
      message,
    );
  } catch {
    return false;
  }
}

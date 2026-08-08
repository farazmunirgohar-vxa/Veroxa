const MAX_CLOCK_SKEW_MS = 60_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const SHA256 = /^[0-9a-f]{64}$/u;
const SIGNATURE = /^[A-Za-z0-9_-]{86}$/u;
const ERROR_CODE = /^[a-z0-9_]{3,80}$/u;
const CONTEXT = "veroxa:momo-content-ai-lifecycle:v1\nPOST\n/functions/v1/momo-content-ai-lifecycle";

export type JsonObject = Record<string, unknown>;
export type MomoContentAiLifecycleRequest =
  | {
    operation: "finalize_upload";
    restaurantId: string;
    assetId: string;
    storagePath: string;
    storageObjectId: string;
    storageObjectVersion: string;
    detectedMime: "image/jpeg" | "image/png";
    fileSize: number;
    width: number;
    height: number;
    contentSha256: string;
    verificationSnapshot: JsonObject;
    verificationCanonical: string;
    verificationSha256: string;
    idempotencyHash: string;
  }
  | {
    operation: "record_intake_attempt";
    restaurantId: string;
    assetId: string;
    outcome: "rejected" | "unavailable";
    reasonCodes: string[];
    evidenceSnapshot: JsonObject;
    evidenceCanonical: string;
    evidenceSha256: string;
    idempotencySha256: string;
  }
  | {
    operation: "reserve_private_assessment";
    restaurantId: string;
    assetId: string;
    requestHash: string;
    idempotencyHash: string;
    model: "gpt-5.6-sol";
    promptVersion: "veroxa-private-media-assessment-2026-08-08-v2";
    schemaVersion: "veroxa-private-media-assessment-v1";
    reservedMicrousd: 1_000_000;
  }
  | {
    operation: "start_private_assessment";
    assessmentId: string;
    requestHash: string;
  }
  | {
    operation: "complete_private_assessment";
    assessmentId: string;
    requestHash: string;
    providerResponseId: string;
    output: JsonObject;
    outputCanonical: string;
    outputSha256: string;
    accountedMicrousd: number;
    accountingBasis: "provider_usage_estimate" | "conservative_reservation";
    providerUsage: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
    } | null;
  }
  | {
    operation: "fail_private_assessment";
    assessmentId: string;
    requestHash: string;
    providerResponseId: string | null;
    errorCode: string;
    providerCalled: boolean;
    accountedMicrousd: number | null;
    providerUsage: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
    } | null;
  }
  | { operation: "complete_staged"; runId: string; requestHash: string }
  | {
    operation: "materialize";
    runId: string;
    requestHash: string;
    scheduleSnapshot: JsonObject;
    scheduleCanonical: string;
    scheduleSha256: string;
    inspectionAttestation: string;
  }
  | {
    operation: "stage_result";
    runId: string;
    requestHash: string;
    providerResponseId: string;
    output: JsonObject;
    outputCanonical: string;
    outputSha256: string;
    validationReport: JsonObject;
    validationCanonical: string;
    validationSha256: string;
    accountedMicrousd: number;
    accountingBasis: "provider_usage_estimate" | "conservative_reservation";
    providerUsage: { input_tokens: number; output_tokens: number; total_tokens: number } | null;
  }
  | {
    operation: "fail";
    runId: string;
    requestHash: string;
    providerResponseId: string | null;
    errorCode: string;
    providerCalled: boolean;
    accountedMicrousd: number | null;
    providerUsage: { input_tokens: number; output_tokens: number; total_tokens: number } | null;
  };

export const isPlainObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function exact(value: JsonObject, keys: string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function base64Bytes(value: string): Uint8Array {
  const decoded = atob(value);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

function base64UrlBytes(value: string): Uint8Array {
  return base64Bytes(value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - value.length % 4) % 4));
}

export async function verifyMomoContentAiBridgeSignature(input: {
  publicKeyBase64: string;
  timestampMs: string;
  nonce: string;
  accessToken: string;
  body: string;
  signature: string;
}): Promise<boolean> {
  const timestamp = Number(input.timestampMs);
  if (!/^\d{13}$/u.test(input.timestampMs) || !Number.isSafeInteger(timestamp) ||
    Math.abs(Date.now() - timestamp) > MAX_CLOCK_SKEW_MS || !UUID.test(input.nonce) ||
    !input.accessToken || input.accessToken.length > 8_192 || !SIGNATURE.test(input.signature)) return false;
  try {
    const key = await crypto.subtle.importKey("spki", base64Bytes(input.publicKeyBase64), { name: "Ed25519" }, false, ["verify"]);
    const message = new TextEncoder().encode(`${CONTEXT}\n${input.timestampMs}\n${input.nonce}\n${input.accessToken}\n${input.body}`);
    return crypto.subtle.verify("Ed25519", key, base64UrlBytes(input.signature), message);
  } catch {
    return false;
  }
}

function validUsage(value: unknown): boolean {
  if (!isPlainObject(value) || !exact(value, ["input_tokens", "output_tokens", "total_tokens"])) return false;
  const input = Number(value.input_tokens);
  const output = Number(value.output_tokens);
  const total = Number(value.total_tokens);
  return [input, output, total].every((number) => Number.isSafeInteger(number) && number >= 0) && total === input + output;
}

function validSortedCodes(value: unknown, minimum: number, maximum: number): value is string[] {
  return Array.isArray(value) && value.length >= minimum && value.length <= maximum &&
    value.every((item) => typeof item === "string" && ERROR_CODE.test(item)) &&
    new Set(value).size === value.length &&
    value.every((item, index) => index === 0 || String(value[index - 1]) < item);
}

function usageMicrousd(value: unknown, maxOutputTokens: number): number | null {
  if (!validUsage(value)) return null;
  const usage = value as { input_tokens: number; output_tokens: number; total_tokens: number };
  if (usage.input_tokens < 1 || usage.input_tokens > 1_050_000 || usage.output_tokens > maxOutputTokens) return null;
  const longContext = usage.input_tokens > 272_000;
  const cost = usage.input_tokens * (longContext ? 10 : 5) + usage.output_tokens * (longContext ? 45 : 30);
  return Number.isSafeInteger(cost) && cost >= 1 ? cost : null;
}

export function validMomoContentAiLifecycleRequest(body: JsonObject): body is MomoContentAiLifecycleRequest {
  if (body.operation === "finalize_upload") {
    return exact(body, [
      "operation", "restaurantId", "assetId", "storagePath",
      "storageObjectId", "storageObjectVersion", "detectedMime", "fileSize",
      "width", "height", "contentSha256", "verificationSnapshot",
      "verificationCanonical", "verificationSha256", "idempotencyHash",
    ]) && typeof body.restaurantId === "string" && UUID.test(body.restaurantId) &&
      typeof body.assetId === "string" && UUID.test(body.assetId) &&
      typeof body.storagePath === "string" && body.storagePath.length >= 40 && body.storagePath.length <= 500 &&
      typeof body.storageObjectId === "string" && UUID.test(body.storageObjectId) &&
      typeof body.storageObjectVersion === "string" && body.storageObjectVersion.length >= 1 && body.storageObjectVersion.length <= 200 &&
      ["image/jpeg", "image/png"].includes(String(body.detectedMime)) &&
      Number.isSafeInteger(body.fileSize) && Number(body.fileSize) >= 10_240 && Number(body.fileSize) <= 10_485_760 &&
      Number.isSafeInteger(body.width) && Number(body.width) >= 128 && Number(body.width) <= 12_000 &&
      Number.isSafeInteger(body.height) && Number(body.height) >= 128 && Number(body.height) <= 12_000 &&
      Number.isSafeInteger(Number(body.width) * Number(body.height)) &&
      Number(body.width) * Number(body.height) <= 16_777_216 &&
      Number(body.width) / Number(body.height) >= 0.4 && Number(body.width) / Number(body.height) <= 2.5 &&
      typeof body.contentSha256 === "string" && SHA256.test(body.contentSha256) &&
      isPlainObject(body.verificationSnapshot) &&
      typeof body.verificationCanonical === "string" && body.verificationCanonical.length >= 2 && body.verificationCanonical.length <= 20_000 &&
      typeof body.verificationSha256 === "string" && SHA256.test(body.verificationSha256) &&
      typeof body.idempotencyHash === "string" && SHA256.test(body.idempotencyHash);
  }
  if (body.operation === "record_intake_attempt") {
    return exact(body, [
      "operation", "restaurantId", "assetId", "outcome", "reasonCodes",
      "evidenceSnapshot", "evidenceCanonical", "evidenceSha256",
      "idempotencySha256",
    ]) && typeof body.restaurantId === "string" && UUID.test(body.restaurantId) &&
      typeof body.assetId === "string" && UUID.test(body.assetId) &&
      (body.outcome === "rejected" || body.outcome === "unavailable") &&
      validSortedCodes(body.reasonCodes, 1, 16) &&
      isPlainObject(body.evidenceSnapshot) &&
      body.evidenceSnapshot.restaurantId === body.restaurantId &&
      body.evidenceSnapshot.assetId === body.assetId &&
      body.evidenceSnapshot.outcome === body.outcome &&
      Array.isArray(body.evidenceSnapshot.reasonCodes) &&
      JSON.stringify(body.evidenceSnapshot.reasonCodes) === JSON.stringify(body.reasonCodes) &&
      typeof body.evidenceCanonical === "string" &&
      body.evidenceCanonical.length >= 2 && body.evidenceCanonical.length <= 32_768 &&
      typeof body.evidenceSha256 === "string" && SHA256.test(body.evidenceSha256) &&
      typeof body.idempotencySha256 === "string" && SHA256.test(body.idempotencySha256);
  }
  if (body.operation === "reserve_private_assessment") {
    return exact(body, [
      "operation", "restaurantId", "assetId", "requestHash",
      "idempotencyHash", "model", "promptVersion", "schemaVersion",
      "reservedMicrousd",
    ]) && typeof body.restaurantId === "string" && UUID.test(body.restaurantId) &&
      typeof body.assetId === "string" && UUID.test(body.assetId) &&
      typeof body.requestHash === "string" && SHA256.test(body.requestHash) &&
      typeof body.idempotencyHash === "string" && SHA256.test(body.idempotencyHash) &&
      body.model === "gpt-5.6-sol" &&
      body.promptVersion === "veroxa-private-media-assessment-2026-08-08-v2" &&
      body.schemaVersion === "veroxa-private-media-assessment-v1" &&
      body.reservedMicrousd === 1_000_000;
  }
  if (body.operation === "start_private_assessment") {
    return exact(body, ["operation", "assessmentId", "requestHash"]) &&
      typeof body.assessmentId === "string" && UUID.test(body.assessmentId) &&
      typeof body.requestHash === "string" && SHA256.test(body.requestHash);
  }
  if (body.operation === "complete_private_assessment") {
    const measured = body.providerUsage === null
      ? null
      : usageMicrousd(body.providerUsage, 3_000);
    return exact(body, [
      "operation", "assessmentId", "requestHash", "providerResponseId",
      "output", "outputCanonical", "outputSha256", "accountedMicrousd",
      "accountingBasis", "providerUsage",
    ]) && typeof body.assessmentId === "string" && UUID.test(body.assessmentId) &&
      typeof body.requestHash === "string" && SHA256.test(body.requestHash) &&
      typeof body.providerResponseId === "string" &&
      /^resp_[A-Za-z0-9_-]{8,195}$/u.test(body.providerResponseId) &&
      isPlainObject(body.output) &&
      typeof body.outputCanonical === "string" &&
      body.outputCanonical.length >= 2 && body.outputCanonical.length <= 32_768 &&
      typeof body.outputSha256 === "string" && SHA256.test(body.outputSha256) &&
      Number.isSafeInteger(body.accountedMicrousd) &&
      Number(body.accountedMicrousd) >= 1 && Number(body.accountedMicrousd) <= 1_000_000 &&
      (body.accountingBasis === "provider_usage_estimate"
        ? measured !== null && measured === body.accountedMicrousd
        : body.accountingBasis === "conservative_reservation" &&
          body.providerUsage === null && body.accountedMicrousd === 1_000_000);
  }
  if (body.operation === "fail_private_assessment") {
    const measured = body.providerUsage === null
      ? null
      : usageMicrousd(body.providerUsage, 3_000);
    return exact(body, [
      "operation", "assessmentId", "requestHash", "providerResponseId",
      "errorCode", "providerCalled", "accountedMicrousd", "providerUsage",
    ]) && typeof body.assessmentId === "string" && UUID.test(body.assessmentId) &&
      typeof body.requestHash === "string" && SHA256.test(body.requestHash) &&
      (body.providerResponseId === null ||
        typeof body.providerResponseId === "string" &&
        /^resp_[A-Za-z0-9_-]{8,195}$/u.test(body.providerResponseId)) &&
      typeof body.errorCode === "string" && ERROR_CODE.test(body.errorCode) &&
      typeof body.providerCalled === "boolean" &&
      (body.providerCalled
        ? body.providerUsage === null
          ? body.accountedMicrousd === 1_000_000
          : body.providerResponseId !== null && measured !== null &&
            measured > 1_000_000 && measured <= 20_000_000 &&
            body.accountedMicrousd === measured
        : body.providerResponseId === null && body.accountedMicrousd === null &&
          body.providerUsage === null);
  }
  if (body.operation === "complete_staged") {
    return exact(body, ["operation", "runId", "requestHash"]) && typeof body.runId === "string" && UUID.test(body.runId) && typeof body.requestHash === "string" && SHA256.test(body.requestHash);
  }
  if (body.operation === "materialize") {
    return exact(body, ["operation", "runId", "requestHash", "scheduleSnapshot", "scheduleCanonical", "scheduleSha256", "inspectionAttestation"]) &&
      typeof body.runId === "string" && UUID.test(body.runId) &&
      typeof body.requestHash === "string" && SHA256.test(body.requestHash) &&
      isPlainObject(body.scheduleSnapshot) &&
      typeof body.scheduleCanonical === "string" && body.scheduleCanonical.length >= 2 && body.scheduleCanonical.length <= 2_000 &&
      typeof body.scheduleSha256 === "string" && SHA256.test(body.scheduleSha256) &&
      typeof body.inspectionAttestation === "string" && body.inspectionAttestation.length >= 100 && body.inspectionAttestation.length <= 1_000;
  }
  if (body.operation === "fail") {
    const measuredCost = body.providerUsage === null ? null : usageMicrousd(body.providerUsage, 128_000);
    return exact(body, ["operation", "runId", "requestHash", "providerResponseId", "errorCode", "providerCalled", "accountedMicrousd", "providerUsage"]) &&
      typeof body.runId === "string" && UUID.test(body.runId) &&
      typeof body.requestHash === "string" && SHA256.test(body.requestHash) &&
      (body.providerResponseId === null ||
        (typeof body.providerResponseId === "string" && /^resp_[A-Za-z0-9_-]{8,195}$/u.test(body.providerResponseId))) &&
      typeof body.errorCode === "string" && ERROR_CODE.test(body.errorCode) &&
      typeof body.providerCalled === "boolean" &&
      body.providerCalled === (body.providerResponseId !== null) &&
      (body.providerUsage === null
        ? body.accountedMicrousd === null
        : body.providerCalled && measuredCost !== null && body.accountedMicrousd === measuredCost && measuredCost <= 100_000_000);
  }
  if (body.operation !== "stage_result" || !exact(body, [
    "operation", "runId", "requestHash", "providerResponseId", "output",
    "outputCanonical", "outputSha256", "validationReport", "validationCanonical",
    "validationSha256", "accountedMicrousd",
    "accountingBasis", "providerUsage",
  ])) return false;
  const measuredCost = body.providerUsage === null ? null : usageMicrousd(body.providerUsage, 25_000);
  return typeof body.runId === "string" && UUID.test(body.runId) &&
    typeof body.requestHash === "string" && SHA256.test(body.requestHash) &&
    typeof body.providerResponseId === "string" && /^resp_[A-Za-z0-9_-]{8,195}$/u.test(body.providerResponseId) &&
    isPlainObject(body.output) && isPlainObject(body.validationReport) &&
    typeof body.outputCanonical === "string" && body.outputCanonical.length >= 2 && body.outputCanonical.length <= 220_000 &&
    typeof body.validationCanonical === "string" && body.validationCanonical.length >= 2 && body.validationCanonical.length <= 20_000 &&
    typeof body.outputSha256 === "string" && SHA256.test(body.outputSha256) &&
    typeof body.validationSha256 === "string" && SHA256.test(body.validationSha256) &&
    Number.isSafeInteger(body.accountedMicrousd) && Number(body.accountedMicrousd) >= 1 && Number(body.accountedMicrousd) <= 6_000_000 &&
    ["provider_usage_estimate", "conservative_reservation"].includes(String(body.accountingBasis)) &&
    (body.accountingBasis === "provider_usage_estimate"
      ? measuredCost !== null && body.accountedMicrousd === measuredCost
      : body.providerUsage === null && body.accountedMicrousd === 6_000_000);
}

const MAX_CLOCK_SKEW_MS = 60_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const SHA256 = /^[0-9a-f]{64}$/u;
const EVENT_ID = /^evt_[A-Za-z0-9_-]{8,196}$/u;
const WEBHOOK_ID = /^wh_[A-Za-z0-9_-]{8,196}$/u;
const RESPONSE_ID = /^resp_[A-Za-z0-9_-]{8,195}$/u;
const SIGNATURE = /^[A-Za-z0-9_-]{86}$/u;
const ERROR_CODE = /^[a-z0-9_]{3,80}$/u;
const POLICY_VERSION = /^momo-content-validator-[0-9]{4}-[0-9]{2}-[0-9]{2}-v[1-9][0-9]{0,3}$/u;
const QUALITY_SUBJECTS = new Set([
  "food", "drink", "interior", "exterior", "team", "menu", "other",
]);
const QUALITY_ISSUES = new Set([
  "blur", "dark", "overexposed", "glare", "cropped_subject",
  "busy_background", "readable_text", "possible_logo_or_watermark", "none",
]);
const CONTEXT = "veroxa:momo-content-ai-webhook-lifecycle:v1\nPOST\n/functions/v1/momo-content-ai-webhook-lifecycle";

export type JsonObject = Record<string, unknown>;

export type MomoContentAiWebhookIdentity = {
  eventId: string;
  webhookId: string;
  responseId: string;
  runId: string;
  requestHash: string;
  claimToken: string;
};

export type MomoContentAiWebhookLifecycleRequest =
  | ({ operation: "claim" } & MomoContentAiWebhookIdentity)
  | ({ operation: "complete_staged" } & MomoContentAiWebhookIdentity)
  | ({
      operation: "record_exception";
      stage: "content_validation";
      policyVersion: string;
      blockers: string[];
      warnings: string[];
      evidenceSnapshot: {
        schemaValid: boolean;
        qualityAssessment: {
          subject: string;
          visualSummary: string;
          qualityScore: number;
          qualityIssues: string[];
        } | null;
      };
      evidenceCanonical: string;
      evidenceSha256: string;
    } & MomoContentAiWebhookIdentity)
  | ({
      operation: "stage_result";
      output: JsonObject;
      outputCanonical: string;
      outputSha256: string;
      validationReport: JsonObject;
      validationCanonical: string;
      validationSha256: string;
      accountedMicrousd: number;
      accountingBasis: "provider_usage_estimate" | "conservative_reservation";
      providerUsage: { input_tokens: number; output_tokens: number; total_tokens: number } | null;
    } & MomoContentAiWebhookIdentity)
  | ({
      operation: "fail";
      errorCode: string;
      accountedMicrousd: number | null;
      providerUsage: { input_tokens: number; output_tokens: number; total_tokens: number } | null;
    } & MomoContentAiWebhookIdentity)
  | ({
      operation: "finish";
      outcome: "processed" | "failed";
      errorCode: string | null;
    } & MomoContentAiWebhookIdentity);

export const isPlainObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function exact(value: JsonObject, keys: string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`
    ).join(",")}}`;
  }
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new Error("non_json_value");
  return serialized;
}

function base64Bytes(value: string): Uint8Array {
  const decoded = atob(value);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

function base64UrlBytes(value: string): Uint8Array {
  return base64Bytes(value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - value.length % 4) % 4));
}

export async function verifyMomoContentAiWebhookBridgeSignature(input: {
  publicKeyBase64: string;
  timestampMs: string;
  nonce: string;
  body: string;
  signature: string;
}): Promise<boolean> {
  const timestamp = Number(input.timestampMs);
  if (!/^\d{13}$/u.test(input.timestampMs) || !Number.isSafeInteger(timestamp) ||
    Math.abs(Date.now() - timestamp) > MAX_CLOCK_SKEW_MS || !UUID.test(input.nonce) ||
    !SIGNATURE.test(input.signature)) return false;
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
    return crypto.subtle.verify("Ed25519", key, base64UrlBytes(input.signature), message);
  } catch {
    return false;
  }
}

function validIdentity(body: JsonObject): boolean {
  return typeof body.eventId === "string" && EVENT_ID.test(body.eventId) &&
    typeof body.webhookId === "string" && WEBHOOK_ID.test(body.webhookId) &&
    typeof body.responseId === "string" && RESPONSE_ID.test(body.responseId) &&
    typeof body.runId === "string" && UUID.test(body.runId) &&
    typeof body.requestHash === "string" && SHA256.test(body.requestHash) &&
    typeof body.claimToken === "string" && UUID.test(body.claimToken) &&
    body.claimToken !== "00000000-0000-0000-0000-000000000000";
}

function validUsage(value: unknown): boolean {
  if (!isPlainObject(value) || !exact(value, ["input_tokens", "output_tokens", "total_tokens"])) return false;
  const input = Number(value.input_tokens);
  const output = Number(value.output_tokens);
  const total = Number(value.total_tokens);
  return [input, output, total].every((number) => Number.isSafeInteger(number) && number >= 0) &&
    total === input + output;
}

function validSortedCodes(value: unknown, minimum: number, maximum: number): value is string[] {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum ||
    value.some((item) => typeof item !== "string" || !ERROR_CODE.test(item))) return false;
  return new Set(value).size === value.length &&
    value.every((item, index) => index === 0 || String(value[index - 1]) < item);
}

function validQualityAssessment(value: unknown): boolean {
  if (!isPlainObject(value) || !exact(value, [
    "subject", "visualSummary", "qualityScore", "qualityIssues",
  ]) || typeof value.subject !== "string" || !QUALITY_SUBJECTS.has(value.subject) ||
    typeof value.visualSummary !== "string" || value.visualSummary !== value.visualSummary.trim() ||
    value.visualSummary.length < 20 || value.visualSummary.length > 400 ||
    !Number.isInteger(value.qualityScore) || Number(value.qualityScore) < 1 ||
    Number(value.qualityScore) > 5 || !Array.isArray(value.qualityIssues) ||
    value.qualityIssues.length < 1 || value.qualityIssues.length > 6 ||
    value.qualityIssues.some((issue) => typeof issue !== "string" || !QUALITY_ISSUES.has(issue)) ||
    new Set(value.qualityIssues).size !== value.qualityIssues.length ||
    !value.qualityIssues.every((issue, index) => index === 0 ||
      String(value.qualityIssues[index - 1]) < String(issue))) return false;
  return !value.qualityIssues.includes("none") || value.qualityIssues.length === 1;
}

function validExceptionEvidence(body: JsonObject): boolean {
  if (!exact(body, [
    "operation", ...IDENTITY_KEYS, "stage", "policyVersion", "blockers", "warnings",
    "evidenceSnapshot", "evidenceCanonical", "evidenceSha256",
  ]) || body.stage !== "content_validation" || typeof body.policyVersion !== "string" ||
    !POLICY_VERSION.test(body.policyVersion) || !validSortedCodes(body.blockers, 1, 64) ||
    !validSortedCodes(body.warnings, 0, 32) || !isPlainObject(body.evidenceSnapshot) ||
    !exact(body.evidenceSnapshot, ["schemaValid", "qualityAssessment"]) ||
    typeof body.evidenceSnapshot.schemaValid !== "boolean" ||
    typeof body.evidenceCanonical !== "string" || body.evidenceCanonical.length < 2 ||
    body.evidenceCanonical.length > 20_000 || typeof body.evidenceSha256 !== "string" ||
    !SHA256.test(body.evidenceSha256)) return false;
  const schemaValid = body.evidenceSnapshot.schemaValid;
  const assessment = body.evidenceSnapshot.qualityAssessment;
  if (schemaValid !== (assessment !== null) ||
    (schemaValid ? !validQualityAssessment(assessment) : body.blockers.length !== 1 ||
      body.blockers[0] !== "schema_invalid") ||
    (schemaValid && body.blockers.includes("schema_invalid"))) return false;
  return body.evidenceCanonical === canonicalJson({
    stage: body.stage,
    policyVersion: body.policyVersion,
    blockers: body.blockers,
    warnings: body.warnings,
    evidenceSnapshot: body.evidenceSnapshot,
  });
}

function usageMicrousd(value: unknown, maxOutputTokens: number): number | null {
  if (!validUsage(value)) return null;
  const usage = value as { input_tokens: number; output_tokens: number; total_tokens: number };
  if (usage.input_tokens < 1 || usage.input_tokens > 1_050_000 || usage.output_tokens > maxOutputTokens) return null;
  const longContext = usage.input_tokens > 272_000;
  const cost = usage.input_tokens * (longContext ? 10 : 5) +
    usage.output_tokens * (longContext ? 45 : 30);
  return Number.isSafeInteger(cost) && cost >= 1 ? cost : null;
}

const IDENTITY_KEYS = ["eventId", "webhookId", "responseId", "runId", "requestHash", "claimToken"];

export function validMomoContentAiWebhookLifecycleRequest(
  body: JsonObject,
): body is MomoContentAiWebhookLifecycleRequest {
  if (!validIdentity(body)) return false;
  if (body.operation === "claim" || body.operation === "complete_staged") {
    return exact(body, ["operation", ...IDENTITY_KEYS]);
  }
  if (body.operation === "record_exception") return validExceptionEvidence(body);
  if (body.operation === "finish") {
    return exact(body, ["operation", ...IDENTITY_KEYS, "outcome", "errorCode"]) &&
      (body.outcome === "processed" || body.outcome === "failed") &&
      (body.outcome === "processed"
        ? body.errorCode === null
        : typeof body.errorCode === "string" && ERROR_CODE.test(body.errorCode));
  }
  if (body.operation === "fail") {
    const measured = body.providerUsage === null ? null : usageMicrousd(body.providerUsage, 128_000);
    return exact(body, ["operation", ...IDENTITY_KEYS, "errorCode", "accountedMicrousd", "providerUsage"]) &&
      typeof body.errorCode === "string" && ERROR_CODE.test(body.errorCode) &&
      (body.providerUsage === null
        ? body.accountedMicrousd === null
        : measured !== null && body.accountedMicrousd === measured &&
          Number.isSafeInteger(body.accountedMicrousd) && Number(body.accountedMicrousd) >= 1 &&
          Number(body.accountedMicrousd) <= 100_000_000);
  }
  if (body.operation !== "stage_result" || !exact(body, [
    "operation", ...IDENTITY_KEYS, "output", "outputCanonical", "outputSha256",
    "validationReport", "validationCanonical", "validationSha256", "accountedMicrousd",
    "accountingBasis", "providerUsage",
  ])) return false;
  const measured = body.providerUsage === null ? null : usageMicrousd(body.providerUsage, 25_000);
  return isPlainObject(body.output) && isPlainObject(body.validationReport) &&
    typeof body.outputCanonical === "string" && body.outputCanonical.length >= 2 && body.outputCanonical.length <= 220_000 &&
    typeof body.validationCanonical === "string" && body.validationCanonical.length >= 2 && body.validationCanonical.length <= 20_000 &&
    typeof body.outputSha256 === "string" && SHA256.test(body.outputSha256) &&
    typeof body.validationSha256 === "string" && SHA256.test(body.validationSha256) &&
    Number.isSafeInteger(body.accountedMicrousd) && Number(body.accountedMicrousd) >= 1 && Number(body.accountedMicrousd) <= 6_000_000 &&
    (body.accountingBasis === "provider_usage_estimate" || body.accountingBasis === "conservative_reservation") &&
    (body.accountingBasis === "provider_usage_estimate"
      ? measured !== null && body.accountedMicrousd === measured
      : body.providerUsage === null && body.accountedMicrousd === 6_000_000);
}

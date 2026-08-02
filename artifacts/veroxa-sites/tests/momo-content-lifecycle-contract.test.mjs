import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { validMomoContentAiLifecycleRequest } from "../supabase/functions/_shared/momo-content-ai-lifecycle-contract.ts";

const UUID = "11111111-1111-4111-8111-111111111111";
const SHA = "a".repeat(64);
const edgeSource = await readFile(new URL("../supabase/functions/momo-content-ai-lifecycle/index.ts", import.meta.url), "utf8");

test("the lifecycle Edge boundary cancels oversized streams before buffering", () => {
  assert.match(edgeSource, /request\.body\.getReader\(\)/u);
  assert.match(edgeSource, /total > MAX_REQUEST_BYTES[\s\S]*?reader\.cancel\("request_too_large"\)/u);
  assert.doesNotMatch(edgeSource, /request\.text\(\)/u);
});

function finalizeUpload() {
  return {
    operation: "finalize_upload",
    restaurantId: UUID,
    assetId: "22222222-2222-4222-8222-222222222222",
    storagePath: `restaurants/${UUID}/uploads/2026/08/33333333-3333-4333-8333-333333333333.jpg`,
    storageObjectId: "44444444-4444-4444-8444-444444444444",
    storageObjectVersion: "1",
    detectedMime: "image/jpeg",
    fileSize: 250_000,
    width: 1080,
    height: 1080,
    contentSha256: SHA,
    verificationSnapshot: { schemaVersion: 1 },
    verificationCanonical: '{"schemaVersion":1}',
    verificationSha256: SHA,
    idempotencyHash: SHA,
  };
}

test("content lifecycle accepts only the exact three-platform JPG intake profile", () => {
  assert.equal(validMomoContentAiLifecycleRequest(finalizeUpload()), true);

  for (const mutation of [
    { detectedMime: "image/png" },
    { fileSize: 10_239 },
    { fileSize: 5_242_881 },
    { width: 319 },
    { height: 249 },
    { width: 12_001 },
    { height: 12_001 },
    { width: 1_080, height: 2_000 },
    { width: 2_000, height: 1_000 },
  ]) {
    assert.equal(
      validMomoContentAiLifecycleRequest({ ...finalizeUpload(), ...mutation }),
      false,
      JSON.stringify(mutation),
    );
  }
});

function stageResult(overrides = {}) {
  return {
    operation: "stage_result",
    runId: UUID,
    requestHash: SHA,
    providerResponseId: "resp_12345678",
    output: { schemaVersion: "momo-content-package-v1" },
    outputCanonical: '{"schemaVersion":"momo-content-package-v1"}',
    outputSha256: SHA,
    validationReport: { passed: true },
    validationCanonical: '{"passed":true}',
    validationSha256: SHA,
    accountedMicrousd: 110_000,
    accountingBasis: "provider_usage_estimate",
    providerUsage: { input_tokens: 10_000, output_tokens: 2_000, total_tokens: 12_000 },
    ...overrides,
  };
}

function failure(overrides = {}) {
  return {
    operation: "fail",
    runId: UUID,
    requestHash: SHA,
    providerResponseId: "resp_momo_content_001",
    errorCode: "provider_transport_failed",
    providerCalled: true,
    accountedMicrousd: null,
    providerUsage: null,
    ...overrides,
  };
}

test("content completion accepts only exact usage-derived or full conservative accounting", () => {
  assert.equal(validMomoContentAiLifecycleRequest(stageResult()), true);
  assert.equal(validMomoContentAiLifecycleRequest(stageResult({ accountedMicrousd: 109_999 })), false);
  assert.equal(validMomoContentAiLifecycleRequest(stageResult({
    providerUsage: { input_tokens: 10_000, output_tokens: 25_001, total_tokens: 35_001 },
    accountedMicrousd: 800_030,
  })), false);
  assert.equal(validMomoContentAiLifecycleRequest(stageResult({
    providerUsage: null,
    accountedMicrousd: 6_000_000,
    accountingBasis: "conservative_reservation",
  })), true);
  assert.equal(validMomoContentAiLifecycleRequest(stageResult({
    providerUsage: null,
    accountedMicrousd: 5_999_999,
    accountingBasis: "conservative_reservation",
  })), false);
});

test("content lifecycle exposes only a bounded idempotent staged-result completion", () => {
  assert.equal(validMomoContentAiLifecycleRequest({
    operation: "complete_staged",
    runId: UUID,
    requestHash: SHA,
  }), true);
  assert.equal(validMomoContentAiLifecycleRequest({
    operation: "complete",
    runId: UUID,
    requestHash: SHA,
  }), false);
});

test("the Team lifecycle boundary rejects every legacy provider-dispatch mutation", () => {
  const dispatchClaimToken = "22222222-2222-4222-8222-222222222222";
  for (const operation of [
    "start",
    "abort_before_provider",
    "fail_unbound_provider",
    "record_provider_response",
  ]) {
    assert.equal(validMomoContentAiLifecycleRequest({
      operation,
      runId: UUID,
      requestHash: SHA,
      dispatchClaimToken,
      providerResponseId: "resp_momo_content_001",
    }), false, operation);
  }
  assert.doesNotMatch(edgeSource, /veroxa_(?:start|abort|fail_unbound|record)_momo_content_ai/u);
});

test("content failure requires an exact response identity after provider dispatch", () => {
  assert.equal(validMomoContentAiLifecycleRequest(failure()), true);
  assert.equal(validMomoContentAiLifecycleRequest(failure({ providerResponseId: null, providerCalled: false })), true);
  assert.equal(validMomoContentAiLifecycleRequest(failure({ providerResponseId: null })), false);
  assert.equal(validMomoContentAiLifecycleRequest(failure({ providerCalled: false })), false);
  assert.equal(validMomoContentAiLifecycleRequest(failure({ providerResponseId: "response_invalid" })), false);
  const providerUsage = { input_tokens: 273_000, output_tokens: 1, total_tokens: 273_001 };
  assert.equal(validMomoContentAiLifecycleRequest(failure({
    providerUsage,
    accountedMicrousd: 2_730_045,
  })), true);
  assert.equal(validMomoContentAiLifecycleRequest(failure({
    providerUsage,
    accountedMicrousd: 5_000_000,
  })), false);
  assert.equal(validMomoContentAiLifecycleRequest(failure({
    providerCalled: false,
    providerUsage,
    accountedMicrousd: 2_730_045,
  })), false);
});

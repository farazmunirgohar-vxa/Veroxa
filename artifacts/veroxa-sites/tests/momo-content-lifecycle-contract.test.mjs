import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { validMomoContentAiLifecycleRequest } from "../supabase/functions/_shared/momo-content-ai-lifecycle-contract.ts";

const UUID = "11111111-1111-4111-8111-111111111111";
const SHA = "a".repeat(64);
const [
  edgeSource,
  rootEdgeSource,
  siteContractSource,
  rootContractSource,
  finalizeCoreSource,
  finalizeRouteSource,
  clientUploadSource,
] =
  await Promise.all([
    readFile(new URL("../supabase/functions/momo-content-ai-lifecycle/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../../../supabase/functions/momo-content-ai-lifecycle/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase/functions/_shared/momo-content-ai-lifecycle-contract.ts", import.meta.url), "utf8"),
    readFile(new URL("../../../supabase/functions/_shared/momo-content-ai-lifecycle-contract.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/media/finalize/core.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/media/finalize/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/momo-client-data.ts", import.meta.url), "utf8"),
  ]);

test("root and Sites lifecycle commit boundaries remain byte-identical", () => {
  assert.equal(edgeSource, rootEdgeSource);
  assert.equal(siteContractSource, rootContractSource);
});

test("browser registration is removed and the server hashes before signed commit", () => {
  assert.doesNotMatch(clientUploadSource, /client\.rpc\(\s*"veroxa_commit_media_upload_v1"/u);
  assert.match(clientUploadSource, /finalizeMomoMediaUploadSession/u);
  assert.match(finalizeRouteSource, /\{ operation: "commit_upload", \.\.\.input \}/u);
  const hash = finalizeCoreSource.indexOf(
    "const contentSha256 = await momoBytesSha256(bytes)",
  );
  const commit = finalizeCoreSource.indexOf("dependencies.commit({", hash);
  const finalize = finalizeCoreSource.indexOf("dependencies.finalize({", commit);
  assert.ok(hash >= 0 && commit > hash && finalize > commit);
  assert.match(edgeSource, /admin\.rpc\("veroxa_commit_media_upload_v2"/u);
  assert.doesNotMatch(edgeSource, /admin\.rpc\("veroxa_commit_media_upload_v1"/u);
});

test("the lifecycle Edge boundary cancels oversized streams before buffering", () => {
  assert.match(edgeSource, /const MAX_LEGACY_REQUEST_BYTES = 300_000/u);
  assert.match(edgeSource, /const MAX_REQUEST_BYTES = 610_000/u);
  assert.match(edgeSource, /request\.body\.getReader\(\)/u);
  assert.match(edgeSource, /total > MAX_REQUEST_BYTES[\s\S]*?reader\.cancel\("request_too_large"\)/u);
  assert.match(edgeSource,
    /new TextEncoder\(\)\.encode\(raw\)\.byteLength > MAX_LEGACY_REQUEST_BYTES/u);
  assert.doesNotMatch(edgeSource, /request\.text\(\)/u);
});

test("the lifecycle Edge boundary accepts v2 envelopes while retaining v1 rollback", () => {
  const v2 = edgeSource.indexOf(
    "verifyMomoContentAiBridgeEnvelopeV2Signature({",
  );
  const v1 = edgeSource.indexOf("verifyMomoContentAiBridgeSignature({");
  const auth = edgeSource.indexOf("userClient.auth.getUser(accessToken)");
  assert.ok(v2 >= 0 && v2 < auth);
  assert.ok(v1 >= 0 && v1 < auth);
  assert.match(edgeSource, /wireValue\.schemaVersion === 2/u);
  assert.match(edgeSource, /body: verified \? parse\(envelope\.payload\) : null/u);
  assert.match(edgeSource, /return \{ verified, body: verified \? parse\(raw\) : null \}/u);
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

function commitUpload(overrides = {}) {
  return {
    operation: "commit_upload",
    restaurantId: UUID,
    uploadSessionId: "22222222-2222-4222-8222-222222222222",
    clientIdempotencyKey: "33333333-3333-4333-8333-333333333333",
    storagePath: `restaurants/${UUID}/uploads/2026/08/44444444-4444-4444-8444-444444444444.jpg`,
    observedSha256: SHA,
    storageObjectId: "55555555-5555-4555-8555-555555555555",
    storageObjectVersion: "storage-v1",
    ...overrides,
  };
}

test("upload commit bridge accepts only exact server-observed object identity", () => {
  assert.equal(validMomoContentAiLifecycleRequest(commitUpload()), true);
  for (const mutation of [
    { observedSha256: "client-claimed" },
    { storageObjectId: UUID, unexpected: true },
    { storageObjectVersion: "" },
    { storagePath: `restaurants/${UUID}/uploads/2026/08/other.jpg` },
  ]) {
    assert.equal(
      validMomoContentAiLifecycleRequest(commitUpload(mutation)),
      false,
      JSON.stringify(mutation),
    );
  }
  assert.match(edgeSource, /admin\.rpc\("veroxa_commit_media_upload_v2"/u);
  assert.match(edgeSource, /p_observed_sha256: body\.observedSha256/u);
  assert.match(edgeSource, /p_actor_id: userData\.user\.id/u);
});

test("private assessment intake accepts only its bounded JPEG and PNG envelope", () => {
  assert.equal(validMomoContentAiLifecycleRequest(finalizeUpload()), true);

  for (const supported of [
    { detectedMime: "image/png" },
    { fileSize: 10_240 },
    { fileSize: 10_485_760 },
    { width: 128, height: 320 },
    { width: 300, height: 750 },
    { width: 750, height: 300 },
    { width: 8_064, height: 6_048 },
    { width: 12_000, height: 12_000 },
  ]) {
    assert.equal(
      validMomoContentAiLifecycleRequest({ ...finalizeUpload(), ...supported }),
      true,
      JSON.stringify(supported),
    );
  }

  for (const mutation of [
    { detectedMime: "image/heic" },
    { detectedMime: "image/gif" },
    { detectedMime: "image/webp" },
    { fileSize: 10_239 },
    { fileSize: 10_485_761 },
    { width: 127 },
    { height: 127 },
    { width: 12_001 },
    { height: 12_001 },
    { width: 399, height: 1_000 },
    { width: 2_501, height: 1_000 },
  ]) {
    assert.equal(
      validMomoContentAiLifecycleRequest({ ...finalizeUpload(), ...mutation }),
      false,
      JSON.stringify(mutation),
    );
  }
});

test("private assessment reservation accepts only the current v2 prompt", () => {
  const reservation = {
    operation: "reserve_private_assessment",
    restaurantId: UUID,
    assetId: "22222222-2222-4222-8222-222222222222",
    requestHash: SHA,
    idempotencyHash: "b".repeat(64),
    model: "gpt-5.6-sol",
    promptVersion: "veroxa-private-media-assessment-2026-08-08-v2",
    schemaVersion: "veroxa-private-media-assessment-v1",
    reservedMicrousd: 1_000_000,
  };
  assert.equal(validMomoContentAiLifecycleRequest(reservation), true);
  assert.equal(validMomoContentAiLifecycleRequest({
    ...reservation,
    promptVersion: "veroxa-private-media-assessment-2026-08-08-v1",
  }), false);
});

test("private assessment failure settles a known provider overrun exactly", () => {
  const overrun = {
    operation: "fail_private_assessment",
    assessmentId: UUID,
    requestHash: SHA,
    providerResponseId: "resp_private_assessment_0001",
    errorCode: "provider_usage_exceeded_reservation",
    providerCalled: true,
    accountedMicrousd: 1_090_000,
    providerUsage: {
      input_tokens: 200_000,
      output_tokens: 3_000,
      total_tokens: 203_000,
    },
  };
  assert.equal(validMomoContentAiLifecycleRequest(overrun), true);
  assert.equal(validMomoContentAiLifecycleRequest({
    ...overrun,
    accountedMicrousd: 1_000_000,
  }), false);
  assert.equal(validMomoContentAiLifecycleRequest({
    ...overrun,
    providerResponseId: null,
  }), false);
  assert.equal(validMomoContentAiLifecycleRequest({
    ...overrun,
    providerUsage: null,
    accountedMicrousd: 1_000_000,
  }), true, "an unknown called-provider failure conservatively settles the reservation");
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

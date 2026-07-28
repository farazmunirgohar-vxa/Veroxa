import assert from "node:assert/strict";
import test from "node:test";
import {
  MOMO_MEDIA_AI_MODEL,
  MOMO_MEDIA_AI_PROCESSING_ATTESTATION,
} from "../app/momo-media-ai-contract.ts";
import { momoBytesSha256 } from "../app/momo-image-bytes.ts";
import {
  createMomoMediaAiPostHandler,
} from "../app/api/team/media-ai/improve/core.ts";

const RESTAURANT_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";
const ASSET_ID = "33333333-3333-4333-8333-333333333333";
const CANDIDATE_ID = "44444444-4444-4444-8444-444444444444";
const IDEMPOTENCY_KEY = "momo-media-ai-test-0001";
const SOURCE_BYTES = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]);
const SOURCE_SHA = await momoBytesSha256(SOURCE_BYTES);

function png(width = 1024, height = 1280) {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 13, false);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  view.setUint32(16, width, false);
  view.setUint32(20, height, false);
  return bytes;
}

function providerResponse(bytes = png(), status = 200, headers = {}) {
  return new Response(JSON.stringify({
    created: 1,
    data: [{ b64_json: Buffer.from(bytes).toString("base64") }],
  }), {
    status,
    headers: {
      "content-type": "application/json",
      "x-request-id": "req_media_ai_test_001",
      ...headers,
    },
  });
}

function request(overrides = {}, headers = {}) {
  return new Request("https://veroxa.example/api/team/media-ai/improve", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://veroxa.example",
      "idempotency-key": IDEMPOTENCY_KEY,
      ...headers,
    },
    body: JSON.stringify({
      restaurantId: RESTAURANT_ID,
      assetId: ASSET_ID,
      goal: "lighting_color",
      preset: "instagram_portrait",
      quality: "low",
      altText: "Momo food image prepared as a private AI candidate.",
      processingConsent: true,
      idempotencyKey: IDEMPOTENCY_KEY,
      ...overrides,
    }),
  });
}

function reservation(overrides = {}) {
  return {
    candidateId: CANDIDATE_ID,
    status: "reserved",
    sourceStoragePath: `${RESTAURANT_ID}/private-original.jpg`,
    sourceMimeType: "image/jpeg",
    sourceFileSize: SOURCE_BYTES.length,
    sourceContentSha256: SOURCE_SHA,
    outputWidth: 1024,
    outputHeight: 1280,
    intendedUse: "instagram",
    evidenceClass: "development_proxy",
    reservedMicrousd: 100_000,
    ...overrides,
  };
}

function harness(overrides = {}) {
  const calls = {
    order: [],
    reserve: [],
    provider: [],
    store: [],
    complete: [],
    fail: [],
  };
  const dependencies = {
    enabled: true,
    providerConfigured: true,
    async authenticate() {
      return { role: "team", restaurantId: RESTAURANT_ID, userId: USER_ID };
    },
    async reserve(input) {
      calls.order.push("reserve");
      calls.reserve.push(input);
      return reservation();
    },
    async downloadSource() {
      calls.order.push("download");
      return new Blob([SOURCE_BYTES], { type: "image/jpeg" });
    },
    async startProvider() {
      calls.order.push("start");
      return { shouldCall: true, status: "provider_running" };
    },
    async callOpenAI(body) {
      calls.order.push("provider");
      calls.provider.push(body);
      return providerResponse();
    },
    async storeCandidate(input) {
      calls.order.push("store");
      calls.store.push(input);
    },
    async complete(input) {
      calls.order.push("complete");
      calls.complete.push(input);
    },
    async fail(input) {
      calls.order.push("fail");
      calls.fail.push(input);
    },
    ...overrides,
  };
  return {
    handler: createMomoMediaAiPostHandler(dependencies),
    calls,
    dependencies,
  };
}

async function json(response) {
  return response.json();
}

test("rejects unauthenticated, Client, and cross-site callers before reservation", async () => {
  for (const authenticate of [
    async () => null,
    async () => ({ role: "client", restaurantId: RESTAURANT_ID, userId: USER_ID }),
  ]) {
    const { handler, calls } = harness({ authenticate });
    const response = await handler(request());
    assert.equal(response.status, 403);
    assert.equal((await json(response)).error, "team_access_required");
    assert.equal(calls.reserve.length, 0);
    assert.equal(calls.provider.length, 0);
  }
  const crossSite = harness();
  const response = await crossSite.handler(request({}, {
    origin: "https://evil.example",
    "sec-fetch-site": "cross-site",
  }));
  assert.equal(response.status, 403);
  assert.equal((await json(response)).error, "cross_site_request_rejected");
  assert.equal(crossSite.calls.reserve.length, 0);
});

test("disabled or unconfigured Media AI cannot reserve budget or call OpenAI", async () => {
  for (const override of [
    { enabled: false },
    { providerConfigured: false },
  ]) {
    const { handler, calls } = harness(override);
    const response = await handler(request());
    assert.equal(response.status, 503);
    assert.equal(calls.reserve.length, 0);
    assert.equal(calls.provider.length, 0);
  }
});

test("requires exact consent, enums, ids, body bounds, and idempotency agreement", async () => {
  const { handler, calls } = harness();
  for (const invalid of [
    { processingConsent: false },
    { restaurantId: "not-a-uuid" },
    { assetId: "not-a-uuid" },
    { goal: "invent_steam" },
    { goal: "toString" },
    { preset: "tiktok_magic" },
    { preset: "constructor" },
    { quality: "ultra" },
    { altText: "" },
    { altText: "x".repeat(281) },
    { idempotencyKey: "short" },
    { prompt: "add more dumplings" },
  ]) {
    const response = await handler(request(invalid));
    assert.equal(response.status, 400);
    assert.equal((await json(response)).error, "invalid_request");
  }
  const conflict = await handler(request({}, {
    "idempotency-key": "momo-media-ai-different-key",
  }));
  assert.equal(conflict.status, 400);
  assert.equal(calls.reserve.length, 0);
});

test("executes one exact provider call after source verification and before private finalization", async () => {
  const { handler, calls } = harness();
  const response = await handler(request());
  assert.equal(response.status, 200);
  const body = await json(response);
  assert.equal(body.candidateId, CANDIDATE_ID);
  assert.equal(body.status, "pending_review");
  assert.equal(body.accountedMicrousd, 100_000);
  assert.equal(body.externalWriteAllowed, false);
  assert.deepEqual(calls.order, [
    "reserve",
    "download",
    "start",
    "provider",
    "store",
    "complete",
  ]);
  assert.equal(calls.provider.length, 1);
  const form = calls.provider[0];
  assert.equal(form.get("model"), MOMO_MEDIA_AI_MODEL);
  assert.equal(form.get("size"), "1024x1280");
  assert.equal(form.get("quality"), "low");
  assert.equal(form.get("output_format"), "png");
  assert.equal(form.get("moderation"), "auto");
  assert.equal(form.get("n"), "1");
  assert.equal(form.get("input_fidelity"), null);
  assert.match(String(form.get("prompt")), /Preserve the exact real dish/i);
  assert.doesNotMatch(String(form.get("prompt")), /Momo food image prepared/);
  assert.ok(form.get("image") instanceof File);
  assert.equal(calls.reserve[0].processingAttestation, MOMO_MEDIA_AI_PROCESSING_ATTESTATION);
  assert.match(calls.reserve[0].idempotencyHash, /^[0-9a-f]{64}$/);
  assert.match(calls.reserve[0].requestHash, /^[0-9a-f]{64}$/);
  assert.match(calls.store[0].storagePath, new RegExp(
    `^restaurants/${RESTAURANT_ID}/renditions/${CANDIDATE_ID}/[0-9a-f]{64}\\.png$`,
  ));
  assert.equal(calls.complete[0].providerRequestId, "req_media_ai_test_001");
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
});

test("a source byte, MIME, size, or hash mismatch fails before the billable boundary", async () => {
  for (const reserveOverride of [
    { sourceContentSha256: "a".repeat(64) },
    { sourceFileSize: 99 },
    { sourceMimeType: "image/png" },
  ]) {
    const { handler, calls } = harness({
      reserve: async () => reservation(reserveOverride),
    });
    const response = await handler(request());
    assert.equal(response.status, 409);
    assert.equal((await json(response)).error, "source_not_ready");
    assert.equal(calls.provider.length, 0);
    assert.equal(calls.fail.length, 1);
    assert.equal(calls.fail[0].errorCode, "source_verification_failed");
  }
});

test("completed, rejected, and pending idempotent replays never download or call the provider", async () => {
  for (const status of ["pending_review", "approved", "rejected"]) {
    const { handler, calls } = harness({
      reserve: async () => reservation({ status }),
    });
    const response = await handler(request());
    assert.equal(response.status, 200);
    assert.equal(calls.provider.length, 0);
    assert.equal((await json(response)).replayed, true);
  }
});

test("provider-started replay is blocked and never calls OpenAI twice", async () => {
  const { handler, calls } = harness({
    reserve: async () => reservation({ status: "provider_running" }),
  });
  const response = await handler(request());
  assert.equal(response.status, 409);
  assert.equal((await json(response)).error, "media_ai_in_progress");
  assert.equal(calls.provider.length, 0);
});

test("a distinct request key cannot create a second active candidate for one asset", async () => {
  const { handler, calls } = harness({
    reserve: async () => {
      throw new Error("momo_media_ai_asset_attempt_active");
    },
  });
  const response = await handler(request());
  assert.equal(response.status, 409);
  assert.equal((await json(response)).error, "media_ai_in_progress");
  assert.equal(calls.provider.length, 0);
  assert.equal(calls.store.length, 0);
});

test("a lost provider-start RPC is terminalized without calling OpenAI", async () => {
  const { handler, calls } = harness({
    startProvider: async () => {
      throw new Error("database response lost");
    },
  });
  const response = await handler(request());
  assert.equal(response.status, 503);
  assert.equal((await json(response)).error, "candidate_finalization_uncertain");
  assert.equal(calls.provider.length, 0);
  assert.equal(calls.fail.length, 1);
  assert.equal(calls.fail[0].errorCode, "provider_start_failed");
});

test("byte-identical outputs from distinct candidates use distinct private paths", async () => {
  const secondCandidateId = "55555555-5555-4555-8555-555555555555";
  const first = harness();
  const second = harness({
    reserve: async () => reservation({ candidateId: secondCandidateId }),
  });
  assert.equal((await first.handler(request())).status, 200);
  assert.equal((await second.handler(request())).status, 200);
  assert.notEqual(
    first.calls.store[0].storagePath,
    second.calls.store[0].storagePath,
  );
  assert.match(
    first.calls.store[0].storagePath,
    new RegExp(`/renditions/${CANDIDATE_ID}/[0-9a-f]{64}\\.png$`),
  );
  assert.match(
    second.calls.store[0].storagePath,
    new RegExp(`/renditions/${secondCandidateId}/[0-9a-f]{64}\\.png$`),
  );
});

test("provider rejection, timeout, and malformed output are terminal and never retried", async () => {
  const cases = [
    {
      callOpenAI: async () => new Response(
        JSON.stringify({ error: { message: "raw provider detail" } }),
        { status: 400 },
      ),
      expected: "provider_rejected",
    },
    {
      callOpenAI: async () => {
        throw new DOMException("timeout", "TimeoutError");
      },
      expected: "provider_timeout",
    },
    {
      callOpenAI: async () => providerResponse(png(1024, 1024)),
      expected: "provider_output_invalid",
    },
  ];
  for (const item of cases) {
    const { handler, calls } = harness({ callOpenAI: item.callOpenAI });
    const response = await handler(request());
    assert.equal(response.status, 502);
    const body = await json(response);
    assert.equal(body.error, item.expected);
    assert.doesNotMatch(JSON.stringify(body), /raw provider detail/i);
    assert.equal(calls.fail.length, 1);
    assert.equal(calls.complete.length, 0);
  }
});

test("storage failure is accounted once and cannot produce a review candidate", async () => {
  const { handler, calls } = harness({
    storeCandidate: async () => {
      throw new Error("storage unavailable");
    },
  });
  const response = await handler(request());
  assert.equal(response.status, 502);
  assert.equal((await json(response)).error, "candidate_storage_failed");
  assert.equal(calls.fail.length, 1);
  assert.equal(calls.fail[0].errorCode, "candidate_storage_failed");
  assert.equal(calls.complete.length, 0);
});

test("ambiguous database finalization preserves the object and forbids provider retry", async () => {
  const { handler, calls } = harness({
    complete: async () => {
      throw new Error("response lost after commit boundary");
    },
  });
  const response = await handler(request());
  assert.equal(response.status, 503);
  assert.equal((await json(response)).error, "candidate_finalization_uncertain");
  assert.equal(calls.provider.length, 1);
  assert.equal(calls.store.length, 1);
  assert.equal(calls.fail.length, 0);
});

test("an unexpected post-boundary failure never reports a zero-charge configuration error", async () => {
  let hashCalls = 0;
  const { handler, calls } = harness({
    hashBytes: async (bytes) => {
      hashCalls += 1;
      if (hashCalls === 1) return momoBytesSha256(bytes);
      throw new Error("unexpected output hashing failure");
    },
  });
  const response = await handler(request());
  assert.equal(response.status, 503);
  assert.equal(
    (await json(response)).error,
    "candidate_finalization_uncertain",
  );
  assert.equal(calls.provider.length, 1);
  assert.equal(calls.fail.length, 1);
  assert.equal(
    calls.fail[0].errorCode,
    "unexpected_post_provider_failure",
  );
});

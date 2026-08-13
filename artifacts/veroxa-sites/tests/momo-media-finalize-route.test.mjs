import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createMomoMediaFinalizeHandler } from "../app/api/media/finalize/core.ts";

const RESTAURANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ASSET_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const OBJECT_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const VERIFICATION_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const ATTEMPT_ID = "22222222-2222-4222-8222-222222222222";
const CORRELATION_ID = "33333333-3333-4333-8333-333333333333";
const DURABLE_CORRELATION_ID = "44444444-4444-4444-8444-444444444444";
const CANONICAL_ASSET_ID = "11111111-1111-4111-8111-111111111111";
const STORAGE_PATH = `restaurants/${RESTAURANT_ID}/uploads/2026/07/ffffffff-ffff-4fff-8fff-ffffffffffff.jpg`;
const VERIFIED_RESULT = {
  verificationId: VERIFICATION_ID,
  status: "verified",
  canonicalAssetId: ASSET_ID,
  duplicateAssetId: null,
};
const [routeSource, recoveryMigration] = await Promise.all([
  readFile(new URL(
    "../app/api/media/finalize/route.ts",
    import.meta.url,
  ), "utf8"),
  readFile(new URL(
    "../supabase/migrations/20260813163534_durable_media_ingestion_recovery.sql",
    import.meta.url,
  ), "utf8"),
]);

function jpeg(width = 1200, height = 900, minimumBytes = 10 * 1024) {
  const header = [
    0xff, 0xd8,
    0xff, 0xc0, 0x00, 0x0b, 0x08,
    (height >> 8) & 0xff, height & 0xff,
    (width >> 8) & 0xff, width & 0xff,
    0x01, 0x01, 0x11, 0x00,
    0xff, 0xda, 0x00, 0x08,
    0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
  ];
  const bytes = new Uint8Array(Math.max(minimumBytes, header.length + 3));
  bytes.set(header);
  bytes.fill(0x01, header.length, bytes.length - 2);
  bytes.set([0xff, 0xd9], bytes.length - 2);
  return bytes;
}

function request(overrides = {}, headers = {}) {
  return new Request("https://veroxa.example/api/media/finalize", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://veroxa.example", ...headers },
    body: JSON.stringify({ restaurantId: RESTAURANT_ID, assetId: ASSET_ID, storagePath: STORAGE_PATH, ...overrides }),
  });
}

function harness(overrides = {}) {
  const source = jpeg();
  const calls = {
    download: [],
    info: [],
    finalize: [],
    recordFailure: [],
    recordFailureContext: [],
  };
  const dependencies = {
    async decodeHighResolutionImage() { return true; },
    async authenticate() { return { role: "client", restaurantId: RESTAURANT_ID, userId: USER_ID }; },
    async download(path) { calls.download.push(path); return new Blob([source], { type: "image/jpeg" }); },
    async info(path) {
      calls.info.push(path);
      return { id: OBJECT_ID, version: "storage-v1", name: path, bucketId: "restaurant-media", size: source.length, contentType: "image/jpeg" };
    },
    async finalize(input) { calls.finalize.push(input); return VERIFIED_RESULT; },
    async recordFailure(input, context) {
      calls.recordFailure.push(input);
      calls.recordFailureContext.push(context);
      return {
        attemptId: ATTEMPT_ID,
        status: "recorded",
        assetId: input.assetId,
        durableCorrelationId: DURABLE_CORRELATION_ID,
      };
    },
    ...overrides,
  };
  return { calls, handler: createMomoMediaFinalizeHandler(dependencies), source };
}

test("byte-verifies one scoped JPG and sends immutable evidence to finalization", async () => {
  const { calls, handler, source } = harness();
  const response = await handler(request());
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(result, { ...VERIFIED_RESULT, externalWriteAllowed: false });
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.deepEqual(calls.download, [STORAGE_PATH]);
  assert.deepEqual(calls.info, [STORAGE_PATH]);
  assert.equal(calls.finalize.length, 1);
  const evidence = calls.finalize[0];
  assert.equal(evidence.detectedMime, "image/jpeg");
  assert.equal(evidence.fileSize, source.length);
  assert.equal(evidence.width, 1200);
  assert.equal(evidence.height, 900);
  assert.match(evidence.contentSha256, /^[0-9a-f]{64}$/u);
  assert.match(evidence.verificationSha256, /^[0-9a-f]{64}$/u);
  assert.match(evidence.idempotencyHash, /^[0-9a-f]{64}$/u);
  assert.deepEqual(JSON.parse(evidence.verificationCanonical), evidence.verificationSnapshot);
});

test("accepts a high-resolution original without a total-pixel ceiling", async () => {
  const source = jpeg(8064, 6048);
  const hostDecodes = [];
  const { calls, handler } = harness({
    decodeHighResolutionImage: async (input) => {
      hostDecodes.push(input);
      return true;
    },
    download: async () => new Blob([source], { type: "image/jpeg" }),
    info: async () => ({
      id: OBJECT_ID,
      version: "storage-v1",
      name: STORAGE_PATH,
      bucketId: "restaurant-media",
      size: source.length,
      contentType: "image/jpeg",
    }),
  });
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.equal(calls.finalize.length, 1);
  assert.equal(calls.finalize[0].width, 8064);
  assert.equal(calls.finalize[0].height, 6048);
  assert.equal(hostDecodes.length, 1);
  assert.equal(hostDecodes[0].mimeType, "image/jpeg");
  assert.equal(hostDecodes[0].expectedWidth, 8064);
  assert.equal(hostDecodes[0].expectedHeight, 6048);
});

test("high-resolution originals fail closed when the trusted host decoder rejects them", async () => {
  const source = jpeg(8064, 6048);
  const { calls, handler } = harness({
    decodeHighResolutionImage: async () => false,
    download: async () => new Blob([source], { type: "image/jpeg" }),
    info: async () => ({
      id: OBJECT_ID,
      version: "storage-v1",
      name: STORAGE_PATH,
      bucketId: "restaurant-media",
      size: source.length,
      contentType: "image/jpeg",
    }),
  });
  const response = await handler(request());
  assert.equal(response.status, 422);
  assert.equal((await response.json()).error, "media_not_assessable");
  assert.equal(calls.finalize.length, 0);
  assert.equal(calls.recordFailure.length, 1);
});

test("returns the canonical asset for an exact duplicate without external writes", async () => {
  const duplicate = {
    verificationId: VERIFICATION_ID,
    status: "duplicate",
    canonicalAssetId: CANONICAL_ASSET_ID,
    duplicateAssetId: ASSET_ID,
  };
  const { handler } = harness({ finalize: async () => duplicate });
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ...duplicate, externalWriteAllowed: false });
});

test("normalizes the legacy verification UUID while rejecting inconsistent lifecycle results", async () => {
  const legacy = harness({ finalize: async () => VERIFICATION_ID });
  assert.deepEqual(await (await legacy.handler(request())).json(), { ...VERIFIED_RESULT, externalWriteAllowed: false });

  for (const invalid of [
    { ...VERIFIED_RESULT, canonicalAssetId: CANONICAL_ASSET_ID },
    { ...VERIFIED_RESULT, status: "duplicate", duplicateAssetId: null },
    { ...VERIFIED_RESULT, unexpected: true },
  ]) {
    const { handler } = harness({ finalize: async () => invalid });
    const response = await handler(request());
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, "media_verification_unavailable");
  }
});

test("rejects unauthenticated, cross-tenant, and cross-site requests before storage reads", async () => {
  for (const scenario of [
    { authenticate: async () => null, expected: 403, request: request() },
    { authenticate: async () => ({ role: "team", restaurantId: "99999999-9999-4999-8999-999999999999", userId: USER_ID }), expected: 403, request: request() },
    { expected: 403, request: request({}, { "sec-fetch-site": "cross-site" }) },
  ]) {
    const { calls, handler } = harness(scenario.authenticate ? { authenticate: scenario.authenticate } : {});
    assert.equal((await handler(scenario.request)).status, scenario.expected);
    assert.equal(calls.download.length, 0);
    assert.equal(calls.finalize.length, 0);
  }
});

test("rejects storage metadata mismatch before byte finalization", async () => {
  const { calls, handler } = harness({ async info() {
    return { id: OBJECT_ID, version: "storage-v1", name: STORAGE_PATH, bucketId: "wrong-bucket", size: 10 * 1024, contentType: "image/jpeg" };
  } });
  const response = await handler(request());
  assert.equal(response.status, 422);
  assert.equal((await response.json()).error, "media_verification_failed");
  assert.equal(calls.finalize.length, 0);
  assert.equal(calls.recordFailure.length, 1);
  assert.equal(calls.recordFailure[0].outcome, "rejected");
  assert.deepEqual(calls.recordFailure[0].reasonCodes, ["media_verification_failed"]);
  assert.match(calls.recordFailure[0].evidenceSha256, /^[0-9a-f]{64}$/u);
  assert.match(calls.recordFailure[0].idempotencySha256, /^[0-9a-f]{64}$/u);
});

test("accepts a common portrait and rejects non-images, unsafe dimensions, and extreme ratios", async () => {
  const portrait = harness({
    download: async () => new Blob([jpeg(900, 1200)], { type: "image/jpeg" }),
    info: async () => ({ id: OBJECT_ID, version: "storage-v1", name: STORAGE_PATH, bucketId: "restaurant-media", size: jpeg(900, 1200).length, contentType: "image/jpeg" }),
  });
  assert.equal((await portrait.handler(request())).status, 200);

  const cases = [
    new Uint8Array(10 * 1024).fill(0x01),
    jpeg(127, 250),
    jpeg(12_001, 7_000),
    jpeg(9_601, 12_001),
    jpeg(128, 400),
    jpeg(1200, 250),
  ];
  for (const source of cases) {
    const calls = [];
    const handler = createMomoMediaFinalizeHandler({
      authenticate: async () => ({ role: "client", restaurantId: RESTAURANT_ID, userId: USER_ID }),
      download: async () => new Blob([source], { type: "image/jpeg" }),
      info: async () => ({ id: OBJECT_ID, version: "storage-v1", name: STORAGE_PATH, bucketId: "restaurant-media", size: source.length, contentType: "image/jpeg" }),
      finalize: async (input) => { calls.push(input); return VERIFIED_RESULT; },
      recordFailure: async (input) => ({
        attemptId: ATTEMPT_ID,
        status: "recorded",
        assetId: input.assetId,
        durableCorrelationId: DURABLE_CORRELATION_ID,
      }),
    });
    const response = await handler(request());
    assert.equal(response.status, 422);
    assert.equal((await response.json()).error, "media_not_assessable");
    assert.equal(calls.length, 0);
  }
});

test("fails closed when private storage or lifecycle finalization is unavailable", async () => {
  const storage = harness({ download: async () => { throw new Error("unavailable"); } });
  assert.equal((await storage.handler(request())).status, 503);
  assert.equal(storage.calls.finalize.length, 0);

  const lifecycle = harness({ finalize: async () => { throw new Error("unavailable"); } });
  const response = await lifecycle.handler(request());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "media_verification_unavailable");
});

test("generic lifecycle failure is recorded by the independent receipt path", async () => {
  const { calls, handler } = harness({
    finalize: async () => { throw new Error("bridge_transport_secret"); },
  });
  const response = await handler(request({}, {
    "x-veroxa-correlation-id": CORRELATION_ID,
  }));
  assert.equal(response.status, 503);
  assert.equal(
    response.headers.get("x-veroxa-correlation-id"),
    CORRELATION_ID,
  );
  assert.deepEqual(await response.json(), {
    error: "media_verification_unavailable",
    receipt: {
      status: "team_exception_recorded",
      attemptId: ATTEMPT_ID,
      recoveryOwner: "veroxa_team",
      clientActionRequired: false,
      correlationId: CORRELATION_ID,
      durableCorrelationId: DURABLE_CORRELATION_ID,
    },
    externalWriteAllowed: false,
  });
  assert.equal(calls.recordFailure.length, 1);
  assert.equal(calls.recordFailure[0].failureStage, "finalize_bridge");
  assert.equal(
    calls.recordFailure[0].errorCode,
    "media_verification_unavailable",
  );
  assert.equal(
    calls.recordFailure[0].evidenceSnapshot.correlationId,
    CORRELATION_ID,
  );
  assert.deepEqual(calls.recordFailureContext, [{
    correlationId: CORRELATION_ID,
  }]);
});

test("unconfirmed exception recording never claims Team ownership", async () => {
  const { handler } = harness({
    finalize: async () => { throw new Error("unavailable"); },
    recordFailure: async () => { throw new Error("rpc_unavailable"); },
  });
  const response = await handler(request({}, {
    "x-veroxa-correlation-id": CORRELATION_ID,
  }));
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: "media_verification_unavailable",
    receipt: {
      status: "exception_recording_unconfirmed",
      attemptId: null,
      recoveryOwner: null,
      clientActionRequired: false,
      correlationId: CORRELATION_ID,
      durableCorrelationId: null,
    },
    externalWriteAllowed: false,
  });
});

test("route failure recording is an authenticated narrow RPC independent of the bridge", () => {
  const recorder = routeSource.slice(
    routeSource.indexOf("async recordFailure"),
    routeSource.indexOf("\n    },\n  };", routeSource.indexOf("async recordFailure")),
  );
  assert.match(
    recorder,
    /client\.rpc\(\s*"veroxa_record_momo_media_intake_failure_v1"/u,
  );
  assert.doesNotMatch(recorder, /invokeMomoContentAiLifecycleBridge/u);
  assert.doesNotMatch(routeSource, /SUPABASE_(SECRET_KEY|SERVICE_ROLE_KEY)/u);
  assert.match(
    recoveryMigration,
    /grant execute on function\s+public\.veroxa_record_momo_media_intake_failure_v1\([\s\S]*?\) to authenticated;/u,
  );
  assert.match(recoveryMigration, /'requestCorrelationId', p_correlation_id/u);
  assert.match(recoveryMigration, /'correlationId', receipt\.correlation_id/u);
});

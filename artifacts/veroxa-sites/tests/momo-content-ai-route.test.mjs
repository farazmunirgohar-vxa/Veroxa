import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createMomoContentAiPostHandler } from "../app/api/team/content-ai/package/core.ts";
import {
  MOMO_CONTENT_AI_MAX_BODY_BYTES,
  MOMO_CONTENT_AI_PROMPT_VERSION,
  MOMO_CONTENT_AI_VALIDATOR_VERSION,
} from "../app/momo-content-ai-contract.ts";

const RESTAURANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER_RESTAURANT_ID = "99999999-9999-4999-8999-999999999999";
const USER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ASSET_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const RUN_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const IDEMPOTENCY_KEY = "momo-content-test-0001";
const teamRouteSource = await readFile(new URL(
  "../app/api/team/content-ai/package/route.ts",
  import.meta.url,
), "utf8");
const workerRouteSource = await readFile(new URL(
  "../app/api/internal/momo/content-ai/dispatch/route.ts",
  import.meta.url,
), "utf8");
const packageCoreSource = await readFile(new URL(
  "../app/api/team/content-ai/package/core.ts",
  import.meta.url,
), "utf8");

function request(overrides = {}, headers = {}) {
  return new Request("https://veroxa.example/api/team/content-ai/package", {
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
      standingAutomation: true,
      idempotencyKey: IDEMPOTENCY_KEY,
      ...overrides,
    }),
  });
}

function reservation(overrides = {}) {
  return {
    runId: RUN_ID,
    status: "reserved",
    requestHash: "1".repeat(64),
    sourceStoragePath:
      `restaurants/${RESTAURANT_ID}/uploads/2026/08/source.jpg`,
    sourceMimeType: "image/jpeg",
    sourceFileSize: 10_240,
    sourceContentSha256: "2".repeat(64),
    sourceWidth: 1080,
    sourceHeight: 1080,
    targetPlatforms: ["instagram", "facebook", "google_business"],
    truthSnapshot: [],
    truthSnapshotSha256: "3".repeat(64),
    reservedMicrousd: 6_000_000,
    providerResponseId: null,
    storedOutput: null,
    ...overrides,
  };
}

function harness(overrides = {}) {
  const calls = { authenticate: 0, reserve: [] };
  const dependencies = {
    enabled: true,
    providerConfigured: true,
    async authenticate() {
      calls.authenticate += 1;
      return { role: "team", restaurantId: RESTAURANT_ID, userId: USER_ID };
    },
    async reserve(input) {
      calls.reserve.push(input);
      return reservation();
    },
    ...overrides,
  };
  return {
    calls,
    handler: createMomoContentAiPostHandler(dependencies),
  };
}

test("queues one exact Momo package and returns before provider work", async () => {
  const { calls, handler } = harness();
  const response = await handler(request());
  const body = await response.json();
  assert.equal(response.status, 202);
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.deepEqual(body, {
    runId: RUN_ID,
    status: "queued",
    replayed: false,
    canMarkReady: false,
    externalWriteAllowed: false,
  });
  assert.equal(calls.reserve.length, 1);
  assert.deepEqual(calls.reserve[0], {
    restaurantId: RESTAURANT_ID,
    assetId: ASSET_ID,
    idempotencyHash: calls.reserve[0].idempotencyHash,
    clientRequestHash: calls.reserve[0].clientRequestHash,
    recoveryResponseId: null,
  });
  assert.match(calls.reserve[0].idempotencyHash, /^[0-9a-f]{64}$/u);
  assert.match(calls.reserve[0].clientRequestHash, /^[0-9a-f]{64}$/u);
});

test("v5 prompt and validator identities are bound into the reservation fingerprint", () => {
  assert.equal(MOMO_CONTENT_AI_PROMPT_VERSION, "momo-content-package-2026-08-08-v5");
  assert.equal(MOMO_CONTENT_AI_VALIDATOR_VERSION, "momo-content-validator-2026-08-08-v5");
  const fingerprint = packageCoreSource.slice(
    packageCoreSource.indexOf("const clientRequestHash"),
    packageCoreSource.indexOf("let reservation"),
  );
  assert.match(fingerprint, /promptVersion: MOMO_CONTENT_AI_PROMPT_VERSION/u);
  assert.match(fingerprint, /validatorVersion: MOMO_CONTENT_AI_VALIDATOR_VERSION/u);
  assert.doesNotMatch(fingerprint, /2026-08-01-v4/u);
});

test("maps only authoritative database states into quiet portal states", async () => {
  for (const [databaseStatus, publicStatus, expectedHttp] of [
    ["provider_running", "provider_running", 202],
    ["result_staged", "finalizing", 202],
    ["pending_review", "pending_team_review", 200],
    ["materialized", "materialized", 200],
    ["rejected", "rejected", 200],
  ]) {
    const storedOutput = databaseStatus === "pending_review"
      ? { schemaVersion: "momo-content-package-v1" }
      : null;
    const { handler } = harness({
      reserve: async () => reservation({ status: databaseStatus, storedOutput }),
    });
    const response = await handler(request());
    const body = await response.json();
    assert.equal(response.status, expectedHttp, databaseStatus);
    assert.equal(body.status, publicStatus, databaseStatus);
    assert.equal(body.replayed, true, databaseStatus);
    assert.equal(body.canMarkReady, false, databaseStatus);
    assert.equal(body.externalWriteAllowed, false, databaseStatus);
    if (storedOutput) assert.deepEqual(body.package, storedOutput);
  }
});

test("a failed authoritative run cannot be represented as queued or Ready", async () => {
  const { handler } = harness({
    reserve: async () => reservation({ status: "failed" }),
  });
  const response = await handler(request());
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    error: "content_ai_previous_attempt_failed",
  });
});

test("authenticates before parsing or reserving and enforces exact tenant scope", async () => {
  for (const actor of [
    null,
    { role: "client", restaurantId: RESTAURANT_ID, userId: USER_ID },
    { role: "team", restaurantId: null, userId: USER_ID },
    { role: "team", restaurantId: OTHER_RESTAURANT_ID, userId: USER_ID },
    { role: "team", restaurantId: RESTAURANT_ID, userId: "not-a-user" },
  ]) {
    let reserved = 0;
    const { handler } = harness({
      authenticate: async () => actor,
      reserve: async () => {
        reserved += 1;
        return reservation();
      },
    });
    const response = await handler(request());
    assert.equal(response.status, 403, JSON.stringify(actor));
    assert.equal(reserved, 0, JSON.stringify(actor));
  }
});

test("rejects cross-site, extra-field, recovery-ID, and mismatched-key requests", async () => {
  const cases = [
    request({}, { origin: "https://attacker.example" }),
    request({}, { "sec-fetch-site": "cross-site" }),
    request({ unexpected: true }),
    request({ recoveryResponseId: "resp_browser_owned_001" }),
    request({ standingAutomation: false }),
    request({}, { "idempotency-key": "momo-content-other-0002" }),
  ];
  for (const candidate of cases) {
    const { calls, handler } = harness();
    const response = await handler(candidate);
    assert.ok([400, 403].includes(response.status));
    assert.equal(calls.reserve.length, 0);
  }
});

test("cancels an oversized streamed body before reservation", async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(MOMO_CONTENT_AI_MAX_BODY_BYTES + 1));
    },
    cancel() {
      cancelled = true;
    },
  });
  const oversized = new Request(
    "https://veroxa.example/api/team/content-ai/package",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: stream,
      duplex: "half",
    },
  );
  const { calls, handler } = harness();
  const response = await handler(oversized);
  assert.equal(response.status, 413);
  assert.equal(cancelled, true);
  assert.equal(calls.reserve.length, 0);
});

test("fails closed when automation, provider configuration, or reservation is unavailable", async () => {
  for (const [overrides, status, code] of [
    [{ enabled: false }, 503, "content_ai_disabled"],
    [{ providerConfigured: false }, 503, "content_ai_configuration_unavailable"],
    [{ reserve: async () => { throw new Error("budget exhausted"); } }, 409, "content_ai_budget_unavailable"],
    [{ reserve: async () => { throw new Error("runtime disabled"); } }, 503, "content_ai_disabled"],
    [{ reserve: async () => { throw new Error("idempotency_conflict"); } }, 409, "idempotency_conflict"],
    [{ reserve: async () => { throw new Error("active_run"); } }, 409, "content_ai_in_progress"],
    [{ reserve: async () => { throw new Error("rights changed"); } }, 409, "source_not_ready"],
  ]) {
    const { handler } = harness(overrides);
    const response = await handler(request());
    assert.equal(response.status, status, code);
    assert.deepEqual(await response.json(), { error: code });
  }
});

test("new reservations and provider calls require the webhook recovery channel", () => {
  for (const source of [teamRouteSource, workerRouteSource]) {
    assert.match(source, /OPENAI_WEBHOOK_SECRET/u);
    assert.match(source, /openAiKey && webhookSecret/u);
  }
});

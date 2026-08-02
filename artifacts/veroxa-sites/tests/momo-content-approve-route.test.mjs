import assert from "node:assert/strict";
import test from "node:test";
import { createMomoContentApproveHandler } from "../app/api/team/content-ai/approve/core.ts";
import { momoCanonicalJson } from "../app/momo-canonical-json.ts";
import { momoBytesSha256 } from "../app/momo-image-bytes.ts";
import { context, output } from "./momo-content-fixture.mjs";

const RESTAURANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const RUN_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const REQUEST_HASH = "1".repeat(64);

function chicagoLocalMinute(offsetMinutes = 0) {
  const date = new Date(Date.now() + 48 * 60 * 60 * 1000 + offsetMinutes * 60_000);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

async function reviewRun(overrides = {}) {
  const packageOutput = output();
  const outputSha256 = await momoBytesSha256(new TextEncoder().encode(momoCanonicalJson(packageOutput)));
  return {
    id: RUN_ID,
    restaurantId: RESTAURANT_ID,
    requestHash: REQUEST_HASH,
    status: "pending_review",
    targetPlatforms: [...context.targetPlatforms],
    truthSnapshot: context.truthFields,
    output: packageOutput,
    outputSha256,
    ...overrides,
  };
}

function body(overrides = {}) {
  return {
    restaurantId: RESTAURANT_ID,
    runId: RUN_ID,
    inspectionAttestation: true,
    schedules: {
      facebook: chicagoLocalMinute(),
      instagram: chicagoLocalMinute(1),
      google_business: chicagoLocalMinute(2),
    },
    ...overrides,
  };
}

function request(overrides = {}, headers = {}) {
  return new Request("https://veroxa.example/api/team/content-ai/approve", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://veroxa.example", ...headers },
    body: JSON.stringify(body(overrides)),
  });
}

async function harness(overrides = {}) {
  const calls = [];
  const run = await reviewRun();
  const dependencies = {
    async authenticate() { return { role: "team", restaurantId: RESTAURANT_ID, userId: USER_ID }; },
    async loadRun() { return run; },
    async materialize(input) { calls.push(input); return "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"; },
    async loadReadyStatus() { return "ready_to_post"; },
    ...overrides,
  };
  return { calls, handler: createMomoContentApproveHandler(dependencies), run };
}

test("materializes only a validated, explicitly inspected Team package", async () => {
  const { calls, handler } = await harness();
  const response = await handler(request());
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.status, "ready_to_post");
  assert.equal(result.externalWriteAllowed, false);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].runId, RUN_ID);
  assert.equal(calls[0].requestHash, REQUEST_HASH);
  assert.match(calls[0].inspectionAttestation, /reviewed the final media, factual claims, platform copy, SEO phrases, hashtags/i);
  assert.equal(calls[0].scheduleSha256.length, 64);
  assert.match(calls[0].scheduleSnapshot.instagram, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/u);
});

test("rejects a missing inspection attestation and never materializes", async () => {
  const { calls, handler } = await harness();
  const response = await handler(request({ inspectionAttestation: false }));
  assert.equal(response.status, 400);
  assert.equal(calls.length, 0);
});

test("rejects incomplete schedules and cross-tenant actors", async () => {
  const incomplete = await harness();
  const response = await incomplete.handler(request({ schedules: { instagram: chicagoLocalMinute() } }));
  assert.equal(response.status, 400);
  assert.equal(incomplete.calls.length, 0);

  const cross = await harness({
    async authenticate() { return { role: "team", restaurantId: "ffffffff-ffff-4fff-8fff-ffffffffffff", userId: USER_ID }; },
  });
  assert.equal((await cross.handler(request())).status, 403);
  assert.equal(cross.calls.length, 0);
});

test("rejects zoned timestamps so the Chicago wall-time contract stays unambiguous", async () => {
  const { calls, handler } = await harness();
  const response = await handler(request({ schedules: {
    facebook: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    instagram: chicagoLocalMinute(1),
    google_business: chicagoLocalMinute(2),
  } }));
  assert.equal(response.status, 400);
  assert.equal(calls.length, 0);
});

test("replays a materialized approval through the idempotent database contract", async () => {
  const materialized = await reviewRun({ status: "materialized" });
  const { calls, handler } = await harness({ async loadRun() { return materialized; } });
  const response = await handler(request());
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.status, "ready_to_post");
  assert.equal(result.replayed, true);
  assert.equal(calls.length, 1);
});

test("never echoes Ready when authoritative replay status is blocked", async () => {
  const materialized = await reviewRun({ status: "materialized" });
  const { calls, handler } = await harness({
    async loadRun() { return materialized; },
    async loadReadyStatus() { return "blocked"; },
  });
  const response = await handler(request());
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error, "content_package_no_longer_ready");
  assert.equal(calls.length, 1);
});

test("revalidates SEO quality and the immutable output hash at approval", async () => {
  const tamperedOutput = output();
  tamperedOutput.variants[2].caption = "A generic restaurant setting welcomes local diners without naming the business or cuisine.";
  const invalidSeo = await harness({ async loadRun() {
    const run = await reviewRun();
    return { ...run, output: tamperedOutput };
  } });
  assert.equal((await invalidSeo.handler(request())).status, 422);
  assert.equal(invalidSeo.calls.length, 0);

  const invalidHash = await harness({ async loadRun() {
    const run = await reviewRun();
    return { ...run, outputSha256: "f".repeat(64) };
  } });
  assert.equal((await invalidHash.handler(request())).status, 409);
  assert.equal(invalidHash.calls.length, 0);
});

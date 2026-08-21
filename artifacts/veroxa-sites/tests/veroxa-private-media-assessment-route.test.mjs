import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import jpegJs from "jpeg-js";
import { createVeroxaPrivateMediaAssessmentHandler } from "../app/api/media/assessment/core.ts";
import {
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_SCHEMA_VERSION,
  parseVeroxaPrivateMediaAssessment,
} from "../app/veroxa-private-media-assessment.ts";
import { momoBytesSha256 } from "../app/momo-image-bytes.ts";

const RESTAURANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ASSET_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ASSESSMENT_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const OBJECT_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const REUSED_ASSESSMENT_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const STORAGE_PATH =
  `restaurants/${RESTAURANT_ID}/uploads/2026/08/${ASSET_ID}.jpg`;
const IDEMPOTENCY_KEY = "private-assessment-route-test-0001";
const assessmentRouteSource = await readFile(new URL(
  "../app/api/media/assessment/route.ts",
  import.meta.url,
), "utf8");

function jpeg(width = 128, height = 160) {
  const data = new Uint8Array(width * height * 4);
  let state = 0x12345678;
  for (let offset = 0; offset < data.length; offset += 4) {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    data[offset] = state;
    data[offset + 1] = state >>> 8;
    data[offset + 2] = state >>> 16;
    data[offset + 3] = 255;
  }
  return new Uint8Array(jpegJs.encode({ data, width, height }, 85).data);
}

function structurallyPlausibleButUndecodableJpeg(
  width = 128,
  height = 160,
  minimumBytes = 10 * 1024,
) {
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

function assessment() {
  return {
    schemaVersion: VEROXA_PRIVATE_MEDIA_ASSESSMENT_SCHEMA_VERSION,
    subject: "food",
    visualSummary: "Visible: browned food pieces arranged on a white plate.",
    qualityScore: 4,
    qualityIssues: ["none"],
    tags: [{
      slug: "food-visible",
      label: "Food visible",
      evidenceClass: "objective",
      category: "scene",
      confidence: 0.99,
      uncertainty: null,
    }, {
      slug: "possible-dumpling-like-items",
      label: "Possible dumpling-like items",
      evidenceClass: "visual_hypothesis",
      category: "dish_hypothesis",
      confidence: 0.72,
      uncertainty: "Pixels alone cannot confirm the exact dish or ingredients.",
    }],
    uncertainties: [
      "Dish identity, ingredients, menu status, and business association are not confirmed.",
    ],
  };
}

function request(overrides = {}, headers = {}) {
  return new Request("https://veroxa.example/api/media/assessment", {
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
      privateAssessmentRequested: true,
      idempotencyKey: IDEMPOTENCY_KEY,
      ...overrides,
    }),
  });
}

function providerResponse(
  output = assessment(),
  metadata = {},
  usage = { input_tokens: 500, output_tokens: 200, total_tokens: 700 },
) {
  return new Response(JSON.stringify({
    id: "resp_private_assessment_0001",
    status: "completed",
    model: "gpt-5.6-sol",
    metadata,
    output: [{
      type: "message",
      content: [{ type: "output_text", text: JSON.stringify(output) }],
    }],
    usage,
  }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

async function harness(overrides = {}) {
  const source = overrides.source ?? jpeg();
  const sourceHash = await momoBytesSha256(source);
  const calls = {
    reserve: [],
    start: [],
    download: [],
    info: [],
    openai: [],
    complete: [],
    fail: [],
  };
  const reservation = {
    assessmentId: ASSESSMENT_ID,
    status: "reserved",
    requestHash: "request-filled-by-handler",
    sourceStoragePath: STORAGE_PATH,
    sourceStorageObjectId: OBJECT_ID,
    sourceStorageObjectVersion: "storage-v1",
    sourceMimeType: "image/jpeg",
    sourceFileSize: source.length,
    sourceWidth: 128,
    sourceHeight: 160,
    sourceContentSha256: sourceHash,
    evidenceClass: "development_proxy",
    reusedFromAssessmentId: null,
    providerResponseId: null,
    output: null,
    outputSha256: null,
    reservedMicrousd: 1_000_000,
  };
  const dependencies = {
    enabled: true,
    providerConfigured: true,
    async authenticate() {
      return {
        role: "client",
        restaurantId: RESTAURANT_ID,
        userId: USER_ID,
      };
    },
    async reserve(input) {
      calls.reserve.push(input);
      return { ...reservation, requestHash: input.requestHash };
    },
    async start(input) {
      calls.start.push(input);
      return {
        assessmentId: input.assessmentId,
        shouldCall: true,
        status: "provider_running",
      };
    },
    async downloadSource(path) {
      calls.download.push(path);
      return new Blob([source], { type: "image/jpeg" });
    },
    async sourceInfo(path) {
      calls.info.push(path);
      return {
        id: OBJECT_ID,
        version: "storage-v1",
        name: path,
        bucketId: "restaurant-media",
        size: source.length,
        contentType: "image/jpeg",
      };
    },
    async callOpenAI(rawBody) {
      const body = JSON.parse(rawBody);
      calls.openai.push(body);
      return providerResponse(assessment(), body.metadata);
    },
    async complete(input) {
      calls.complete.push(input);
      return { assessmentId: input.assessmentId, status: "completed" };
    },
    async fail(input) {
      calls.fail.push(input);
    },
    ...overrides,
  };
  return {
    calls,
    source,
    sourceHash,
    reservation,
    handler: createVeroxaPrivateMediaAssessmentHandler(dependencies),
  };
}

test("route uses Worker-compatible private Storage and provider transports", () => {
  const storageStart = assessmentRouteSource.indexOf("async downloadSource");
  const storageEnd = assessmentRouteSource.indexOf("async sourceInfo");
  const providerStart = assessmentRouteSource.indexOf("async callOpenAI");
  const providerEnd = assessmentRouteSource.indexOf("async complete");
  assert.ok(storageStart >= 0 && storageEnd > storageStart);
  assert.ok(providerStart >= 0 && providerEnd > providerStart);
  const storageBlock = assessmentRouteSource.slice(storageStart, storageEnd);
  const providerBlock = assessmentRouteSource.slice(providerStart, providerEnd);
  assert.match(storageBlock, /\.download\(storagePath\)/u);
  assert.doesNotMatch(storageBlock, /\.download\(\s*storagePath\s*,/u);
  assert.doesNotMatch(storageBlock, /\b(?:cache|credentials)\s*:/u);
  assert.doesNotMatch(providerBlock, /\b(?:cache|credentials)\s*:/u);
  assert.match(providerBlock, /redirect:\s*"manual"/u);
  assert.match(providerBlock, /AbortSignal\.timeout\(45_000\)/u);
  assert.ok(
    providerBlock.indexOf("response.status >= 300") <
      providerBlock.indexOf("return response"),
  );
  const redirectStart = providerBlock.indexOf("if (response.status >= 300");
  const redirectEnd = providerBlock.indexOf("return response");
  assert.ok(redirectStart >= 0 && redirectEnd > redirectStart);
  const redirectBranch = providerBlock.slice(redirectStart, redirectEnd);
  assert.doesNotMatch(
    redirectBranch,
    /response\.(?:body|text|json|blob|arrayBuffer)/u,
  );
});

test("authenticates, re-verifies exact private bytes, calls OpenAI once, and persists the neutral result", async () => {
  const { calls, handler, sourceHash } = await harness();
  const response = await handler(request());
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, "completed");
  assert.equal(body.sourceContentSha256, sourceHash);
  assert.equal(body.externalWriteAllowed, false);
  assert.equal(body.assessment.tags[1].evidenceClass, "visual_hypothesis");
  assert.equal(body.assessment.tags[1].slug, "possible-dumpling-like-items");
  assert.equal(body.assessment.tags[1].label, "Possible dumpling-like items");
  assert.equal(body.assessment.visualSummary, "Visible subject: food. Objective visual tags: Food visible.");
  assert.doesNotMatch(JSON.stringify(body), /provider|microusd|usage|cost|internal_error/iu);
  assert.equal(calls.reserve.length, 1);
  assert.equal(calls.download.length, 1);
  assert.equal(calls.info.length, 1);
  assert.equal(calls.start.length, 1);
  assert.equal(calls.openai.length, 1, "one upload assessment must make one provider call");
  assert.equal(calls.openai[0].store, false);
  assert.equal(calls.openai[0].service_tier, "default");
  assert.deepEqual(calls.openai[0].prompt_cache_options, { mode: "explicit" });
  assert.doesNotMatch(JSON.stringify(calls.openai[0]), /prompt_cache_breakpoint/u);
  assert.equal(calls.openai[0].background, false);
  assert.equal(calls.complete.length, 1);
  assert.equal(calls.fail.length, 0);
});

test("an identical-byte completed reservation reuses assessment only and never calls the provider", async () => {
  const { calls, handler, reservation, sourceHash } = await harness({
    async reserve(input) {
      calls.reserve.push(input);
      return {
        ...reservation,
        requestHash: "7".repeat(64),
        status: "completed",
        reusedFromAssessmentId: REUSED_ASSESSMENT_ID,
        output: assessment(),
        outputSha256: "9".repeat(64),
      };
    },
  });
  const response = await handler(request());
  assert.equal(response.status, 200);
  const sanitizedAssessment = parseVeroxaPrivateMediaAssessment(assessment());
  assert.ok(sanitizedAssessment);
  assert.deepEqual(await response.json(), {
    assessmentId: ASSESSMENT_ID,
    status: "completed",
    assessment: sanitizedAssessment,
    reused: true,
    reusedFromAssessmentId: REUSED_ASSESSMENT_ID,
    sourceContentSha256: sourceHash,
    externalWriteAllowed: false,
  });
  assert.equal(calls.start.length, 0);
  assert.equal(calls.download.length, 0);
  assert.equal(calls.openai.length, 0);
  assert.equal(calls.complete.length, 0);
});

test("source hash mismatch fails before provider start and records one pre-provider failure", async () => {
  const { calls, handler, reservation } = await harness({
    async reserve(input) {
      calls.reserve.push(input);
      return {
        ...reservation,
        requestHash: input.requestHash,
        sourceContentSha256: "0".repeat(64),
      };
    },
  });
  const response = await handler(request());
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    error: "private_media_assessment_source_not_ready",
  });
  assert.equal(calls.start.length, 0);
  assert.equal(calls.openai.length, 0);
  assert.equal(calls.complete.length, 0);
  assert.equal(calls.fail.length, 1);
  assert.equal(calls.fail[0].providerCalled, false);
  assert.equal(calls.fail[0].errorCode, "source_verification_failed");
});

test("a structurally plausible random JPEG must fully decode before provider start", async () => {
  const { calls, handler } = await harness({
    source: structurallyPlausibleButUndecodableJpeg(),
  });
  const response = await handler(request());
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    error: "private_media_assessment_source_not_ready",
  });
  assert.equal(calls.start.length, 0);
  assert.equal(calls.openai.length, 0);
  assert.equal(calls.complete.length, 0);
  assert.equal(calls.fail.length, 1);
  assert.equal(calls.fail[0].providerCalled, false);
});

test("a high-resolution source requires and passes a trusted host decode before OpenAI", async () => {
  const source = structurallyPlausibleButUndecodableJpeg(8064, 6048);
  const hostDecodes = [];
  const { calls, handler, reservation } = await harness({
    source,
    decodeHighResolutionImage: async (input) => {
      hostDecodes.push(input);
      return true;
    },
    async reserve(input) {
      calls.reserve.push(input);
      return {
        ...reservation,
        requestHash: input.requestHash,
        sourceWidth: 8064,
        sourceHeight: 6048,
      };
    },
  });
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.equal(hostDecodes.length, 1);
  assert.equal(hostDecodes[0].expectedWidth, 8064);
  assert.equal(hostDecodes[0].expectedHeight, 6048);
  assert.equal(calls.openai.length, 1);
});

test("a high-resolution source fails closed before OpenAI when host decoding fails", async () => {
  const source = structurallyPlausibleButUndecodableJpeg(8064, 6048);
  const { calls, handler, reservation } = await harness({
    source,
    decodeHighResolutionImage: async () => false,
    async reserve(input) {
      calls.reserve.push(input);
      return {
        ...reservation,
        requestHash: input.requestHash,
        sourceWidth: 8064,
        sourceHeight: 6048,
      };
    },
  });
  const response = await handler(request());
  assert.equal(response.status, 409);
  assert.equal(calls.start.length, 0);
  assert.equal(calls.openai.length, 0);
  assert.equal(calls.fail[0].errorCode, "source_verification_failed");
});

test("a legacy WebP reservation fails closed before any paid assessment call", async () => {
  const { calls, handler, reservation } = await harness({
    async reserve(input) {
      calls.reserve.push(input);
      return {
        ...reservation,
        requestHash: input.requestHash,
        sourceMimeType: "image/webp",
      };
    },
  });
  const response = await handler(request());
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    error: "private_media_assessment_format_unsupported",
  });
  assert.equal(calls.download.length, 0);
  assert.equal(calls.start.length, 0);
  assert.equal(calls.openai.length, 0);
  assert.equal(calls.fail.length, 1);
  assert.equal(calls.fail[0].errorCode, "source_full_decode_unsupported");
  assert.equal(calls.fail[0].providerCalled, false);
});

test("a fresh reservation cannot substitute a different request hash", async () => {
  const { calls, handler, reservation } = await harness({
    async reserve(input) {
      calls.reserve.push(input);
      return {
        ...reservation,
        requestHash: "7".repeat(64),
        reusedFromAssessmentId: null,
      };
    },
  });
  const response = await handler(request());
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    error: "private_media_assessment_source_not_ready",
  });
  assert.equal(calls.download.length, 0);
  assert.equal(calls.start.length, 0);
  assert.equal(calls.openai.length, 0);
});

test("provider transport failure is never automatically retried", async () => {
  let attempts = 0;
  const { calls, handler } = await harness({
    async callOpenAI() {
      attempts += 1;
      throw new Error("network unavailable");
    },
  });
  const response = await handler(request());
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), {
    error: "private_media_assessment_unavailable",
  });
  assert.equal(attempts, 1);
  assert.equal(calls.complete.length, 0);
  assert.equal(calls.fail.length, 1);
  assert.equal(calls.fail[0].providerCalled, true);
  assert.equal(calls.fail[0].accountedMicrousd, 1_000_000);
});

test("provider redirect is failed once without reading its body", async () => {
  let bodyRead = false;
  const { calls, handler } = await harness({
    async callOpenAI() {
      return {
        status: 307,
        ok: false,
        headers: new Headers({
          "content-type": "application/json",
          location: "https://unexpected.example/",
        }),
        get body() {
          bodyRead = true;
          throw new Error("redirect_body_must_not_be_read");
        },
      };
    },
  });
  const response = await handler(request());
  assert.equal(response.status, 502);
  assert.equal(bodyRead, false);
  assert.equal(calls.complete.length, 0);
  assert.equal(calls.fail.length, 1);
  assert.equal(calls.fail[0].providerCalled, true);
  assert.equal(calls.fail[0].errorCode, "provider_rejected");
});

test("known usage above the reservation fails once and settles the measured cost", async () => {
  const usage = {
    input_tokens: 200_000,
    output_tokens: 3_000,
    total_tokens: 203_000,
  };
  let attempts = 0;
  const { calls, handler } = await harness({
    async callOpenAI(rawBody) {
      attempts += 1;
      const body = JSON.parse(rawBody);
      return providerResponse(assessment(), body.metadata, usage);
    },
  });
  const response = await handler(request());
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), {
    error: "private_media_assessment_unavailable",
  });
  assert.equal(attempts, 1);
  assert.equal(calls.complete.length, 0);
  assert.equal(calls.fail.length, 1);
  assert.equal(calls.fail[0].providerResponseId, "resp_private_assessment_0001");
  assert.equal(calls.fail[0].errorCode, "provider_usage_exceeded_reservation");
  assert.equal(calls.fail[0].accountedMicrousd, 1_090_000);
  assert.deepEqual(calls.fail[0].providerUsage, usage);
});

test("malformed provider output still settles a bound known overrun", async () => {
  const usage = {
    input_tokens: 200_000,
    output_tokens: 3_000,
    total_tokens: 203_000,
  };
  let attempts = 0;
  const { calls, handler } = await harness({
    async callOpenAI(rawBody) {
      attempts += 1;
      const body = JSON.parse(rawBody);
      return providerResponse({ unsafe: "not the assessment schema" }, body.metadata, usage);
    },
  });
  const response = await handler(request());
  assert.equal(response.status, 502);
  assert.equal(attempts, 1);
  assert.equal(calls.complete.length, 0);
  assert.equal(calls.fail.length, 1);
  assert.deepEqual(calls.fail[0], {
    assessmentId: ASSESSMENT_ID,
    requestHash: calls.reserve[0].requestHash,
    providerResponseId: "resp_private_assessment_0001",
    errorCode: "provider_output_invalid",
    providerCalled: true,
    accountedMicrousd: 1_090_000,
    providerUsage: usage,
  });
});

test("authentication and tenant checks happen before reservation or private storage reads", async () => {
  for (const actor of [
    null,
    { role: "client", restaurantId: "99999999-9999-4999-8999-999999999999", userId: USER_ID },
    { role: "anonymous", restaurantId: RESTAURANT_ID, userId: USER_ID },
  ]) {
    const { calls, handler } = await harness({ authenticate: async () => actor });
    const response = await handler(request());
    assert.equal(response.status, 403);
    assert.equal(calls.reserve.length, 0);
    assert.equal(calls.download.length, 0);
    assert.equal(calls.openai.length, 0);
  }
});

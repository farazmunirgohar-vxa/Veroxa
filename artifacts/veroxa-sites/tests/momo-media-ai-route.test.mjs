import assert from "node:assert/strict";
import test from "node:test";
import { deflateSync } from "node:zlib";
import {
  MOMO_MEDIA_AI_MODEL,
  MOMO_MEDIA_AI_PROCESSING_ATTESTATION,
  MOMO_MEDIA_AI_PRESETS,
  isMomoMediaAiProviderSize,
} from "../app/momo-media-ai-contract.ts";
import {
  inspectMomoImageBytesFully,
  momoBytesSha256,
} from "../app/momo-image-bytes.ts";
import {
  createMomoMediaAiPostHandler,
} from "../app/api/team/media-ai/improve/core.ts";
import {
  verifyMomoMediaAiOpenAiAccess,
} from "../app/momo-media-ai-openai-access.ts";

const RESTAURANT_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";
const ASSET_ID = "33333333-3333-4333-8333-333333333333";
const CANDIDATE_ID = "44444444-4444-4444-8444-444444444444";
const IDEMPOTENCY_KEY = "momo-media-ai-test-0001";
const SOURCE_BYTES = Uint8Array.from(Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAAAAAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==",
  "base64",
));
const WEBP_BYTES = Uint8Array.from(Buffer.from(
  "UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAgA0JaQAA3AA/vuUAAA=",
  "base64",
));
const SOURCE_SHA = await momoBytesSha256(SOURCE_BYTES);
const INSTAGRAM_PORTRAIT = MOMO_MEDIA_AI_PRESETS.instagram_portrait;

const PNG_SIGNATURE = Uint8Array.from([
  0x89,
  0x50,
  0x4e,
  0x47,
  0x0d,
  0x0a,
  0x1a,
  0x0a,
]);
const PNG_CACHE = new Map();

function concatenate(...parts) {
  const result = new Uint8Array(parts.reduce(
    (total, part) => total + part.byteLength,
    0,
  ));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = new TextEncoder().encode(type);
  const result = new Uint8Array(12 + data.byteLength);
  const view = new DataView(result.buffer);
  view.setUint32(0, data.byteLength, false);
  result.set(typeBytes, 4);
  result.set(data, 8);
  view.setUint32(8 + data.byteLength, crc32(
    result.subarray(4, 8 + data.byteLength),
  ), false);
  return result;
}

function pngFromCompressed(width, height, compressed) {
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width, false);
  view.setUint32(4, height, false);
  header[8] = 1;
  header[9] = 0;
  return concatenate(
    PNG_SIGNATURE,
    pngChunk("IHDR", header),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", new Uint8Array()),
  );
}

function pngFromRaw(width, height, raw) {
  return pngFromCompressed(
    width,
    height,
    Uint8Array.from(deflateSync(raw)),
  );
}

function png(
  width = INSTAGRAM_PORTRAIT.width,
  height = INSTAGRAM_PORTRAIT.height,
) {
  const key = `${width}x${height}`;
  const cached = PNG_CACHE.get(key);
  if (cached) return cached;
  const rowBytes = Math.ceil(width / 8);
  const bytes = pngFromRaw(
    width,
    height,
    new Uint8Array((rowBytes + 1) * height),
  );
  PNG_CACHE.set(key, bytes);
  return bytes;
}

function webpChunk(type, data) {
  const result = new Uint8Array(8 + data.byteLength + (data.byteLength & 1));
  result.set(new TextEncoder().encode(type), 0);
  new DataView(result.buffer).setUint32(4, data.byteLength, true);
  result.set(data, 8);
  return result;
}

function extendedWebpWithoutAlpha() {
  const body = concatenate(
    new TextEncoder().encode("WEBP"),
    webpChunk("VP8X", new Uint8Array(10)),
    WEBP_BYTES.subarray(12),
  );
  const result = new Uint8Array(8 + body.byteLength);
  result.set(new TextEncoder().encode("RIFF"), 0);
  new DataView(result.buffer).setUint32(4, body.byteLength, true);
  result.set(body, 8);
  return result;
}

function providerResponse(
  bytes = png(),
  status = 200,
  headers = {},
  usage = null,
) {
  const payload = {
    created: 1,
    data: [{ b64_json: Buffer.from(bytes).toString("base64") }],
  };
  if (usage) payload.usage = usage;
  return new Response(JSON.stringify(payload), {
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
      goal: "professional_food_finish",
      preset: "instagram_portrait",
      quality: "high",
      altText: "Momo food image prepared as a private AI candidate.",
      standingAutomation: true,
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
    outputWidth: INSTAGRAM_PORTRAIT.width,
    outputHeight: INSTAGRAM_PORTRAIT.height,
    intendedUse: "instagram",
    evidenceClass: "development_proxy",
    reservedMicrousd: 20_000_000,
    ...overrides,
  };
}

function harness(overrides = {}) {
  const calls = {
    access: [],
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
    async verifyProviderAccess() {
      calls.access.push(true);
      return true;
    },
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

test("fully validates complete JPEG, PNG, and WebP files and rejects truncated or corrupt structures", async () => {
  assert.deepEqual(
    await inspectMomoImageBytesFully(SOURCE_BYTES),
    { mimeType: "image/jpeg", width: 1, height: 1 },
  );
  assert.deepEqual(
    await inspectMomoImageBytesFully(png(1, 1)),
    { mimeType: "image/png", width: 1, height: 1 },
  );
  assert.deepEqual(
    await inspectMomoImageBytesFully(WEBP_BYTES),
    { mimeType: "image/webp", width: 1, height: 1 },
  );
  assert.deepEqual(
    await inspectMomoImageBytesFully(extendedWebpWithoutAlpha()),
    { mimeType: "image/webp", width: 1, height: 1 },
  );

  for (const bytes of [SOURCE_BYTES, png(1, 1), WEBP_BYTES]) {
    assert.equal(
      await inspectMomoImageBytesFully(bytes.slice(0, -1)),
      null,
    );
  }
  assert.equal(
    await inspectMomoImageBytesFully(
      Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]),
    ),
    null,
  );
  assert.equal(
    await inspectMomoImageBytesFully(PNG_SIGNATURE),
    null,
  );

  const corruptCrc = png(1, 1).slice();
  corruptCrc[corruptCrc.length - 1] ^= 0x01;
  assert.equal(await inspectMomoImageBytesFully(corruptCrc), null);

  const wrongScanlineLength = pngFromRaw(1, 1, new Uint8Array([0]));
  assert.equal(
    await inspectMomoImageBytesFully(wrongScanlineLength),
    null,
  );
  const invalidFilter = pngFromRaw(
    1,
    1,
    Uint8Array.from([5, 0]),
  );
  assert.equal(await inspectMomoImageBytesFully(invalidFilter), null);

  const compressed = Uint8Array.from(deflateSync(Uint8Array.from([0, 0])));
  const truncatedDeflate = pngFromCompressed(
    1,
    1,
    compressed.slice(0, -1),
  );
  assert.equal(await inspectMomoImageBytesFully(truncatedDeflate), null);
});

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

test("disabled, unconfigured, or model-inaccessible Media AI cannot reserve budget or call OpenAI", async () => {
  for (const override of [
    { enabled: false },
    { providerConfigured: false },
    { verifyProviderAccess: async () => false },
    {
      verifyProviderAccess: async () => {
        throw new Error("access check unavailable");
      },
    },
  ]) {
    const { handler, calls } = harness(override);
    const response = await handler(request());
    assert.equal(response.status, 503);
    assert.equal(calls.reserve.length, 0);
    assert.equal(calls.provider.length, 0);
  }
});

test("an above-threshold request blocks before the provider boundary", async () => {
  const { handler, calls } = harness({
    reserve: async () => {
      throw new Error("momo_media_ai_authorization_required");
    },
  });
  const response = await handler(request());
  assert.equal(response.status, 409);
  assert.equal((await json(response)).error, "media_ai_authorization_required");
  assert.equal(calls.provider.length, 0);
});

test("an authoritative failed replay exposes a manual-retry signal without crossing the provider boundary", async () => {
  const { handler, calls } = harness({
    reserve: async () => {
      throw new Error("momo_media_ai_failed_attempt_cannot_replay");
    },
  });
  const response = await handler(request());
  assert.equal(response.status, 409);
  assert.equal(
    (await json(response)).error,
    "media_ai_previous_attempt_failed",
  );
  assert.deepEqual(calls.order, []);
  assert.equal(calls.provider.length, 0);
  assert.equal(calls.store.length, 0);
  assert.equal(calls.complete.length, 0);
  assert.equal(calls.fail.length, 0);
});

test("requires exact standing authorization, enums, ids, body bounds, and idempotency agreement", async () => {
  const { handler, calls } = harness();
  for (const invalid of [
    { standingAutomation: false },
    { restaurantId: "not-a-uuid" },
    { assetId: "not-a-uuid" },
    { goal: "invent_steam" },
    { goal: "lighting_color" },
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

test("uses only documented gpt-image-2 sizes and rejects an unsupported provider size before it can be sent", async () => {
  for (const preset of Object.values(MOMO_MEDIA_AI_PRESETS)) {
    assert.equal(
      isMomoMediaAiProviderSize(preset.width, preset.height),
      true,
      `${preset.width}x${preset.height} must remain a valid gpt-image-2 size`,
    );
  }
  assert.equal(isMomoMediaAiProviderSize(1025, 1280), false);
  assert.equal(isMomoMediaAiProviderSize(1024, 4096), false);
  assert.equal(isMomoMediaAiProviderSize(1024, 512), false);
  assert.equal(isMomoMediaAiProviderSize(2160, 3840), true);
  const { handler, calls } = harness({
    reserve: async () => reservation({ outputWidth: 1025 }),
  });
  const response = await handler(request());
  assert.equal(response.status, 503);
  assert.equal((await json(response)).error, "media_ai_configuration_unavailable");
  assert.equal(calls.provider.length, 0);
  assert.equal(calls.fail.at(-1).errorCode, "provider_size_invalid");
});

test("executes one exact provider call after source verification and before private finalization", async () => {
  const { handler, calls } = harness();
  const response = await handler(request());
  assert.equal(response.status, 200);
  const body = await json(response);
  assert.equal(body.candidateId, CANDIDATE_ID);
  assert.equal(body.status, "pending_review");
  assert.equal(body.accountedMicrousd, 20_000_000);
  assert.equal(body.accountingBasis, "conservative_reservation");
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
  assert.equal(
    form.get("size"),
    `${INSTAGRAM_PORTRAIT.width}x${INSTAGRAM_PORTRAIT.height}`,
  );
  assert.equal(form.get("quality"), "high");
  assert.equal(form.get("input_fidelity"), null);
  assert.equal(form.get("background"), "opaque");
  assert.equal(form.get("output_format"), "png");
  assert.equal(form.get("moderation"), "auto");
  assert.equal(form.get("n"), "1");
  assert.match(String(form.get("prompt")), /Preserve the exact real dish/i);
  assert.doesNotMatch(String(form.get("prompt")), /Momo food image prepared/);
  assert.ok(form.get("image[]") instanceof File);
  assert.equal(calls.reserve[0].processingAttestation, MOMO_MEDIA_AI_PROCESSING_ATTESTATION);
  assert.equal(calls.access.length, 1);
  assert.match(calls.reserve[0].idempotencyHash, /^[0-9a-f]{64}$/);
  assert.match(calls.reserve[0].requestHash, /^[0-9a-f]{64}$/);
  assert.match(calls.store[0].storagePath, new RegExp(
    `^restaurants/${RESTAURANT_ID}/renditions/${CANDIDATE_ID}/[0-9a-f]{64}\\.png$`,
  ));
  assert.equal(calls.complete[0].providerRequestId, "req_media_ai_test_001");
  assert.equal(calls.complete[0].accountedMicrousd, 20_000_000);
  assert.equal(calls.complete[0].accountingBasis, "conservative_reservation");
  assert.equal(calls.complete[0].providerUsage, null);
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
});

test("binds nonportrait Team destinations to reservation and exact provider size", async () => {
  for (const presetKey of [
    "google_business_square",
    "website_hero",
  ]) {
    const preset = MOMO_MEDIA_AI_PRESETS[presetKey];
    let reserveInput;
    let providerForm;
    const { handler } = harness({
      async reserve(input) {
        reserveInput = input;
        return reservation({
          outputWidth: preset.width,
          outputHeight: preset.height,
          intendedUse: preset.intendedUse,
        });
      },
      async callOpenAI(body) {
        providerForm = body;
        return providerResponse(png(preset.width, preset.height));
      },
    });
    const response = await handler(request({ preset: presetKey }));
    assert.equal(response.status, 200);
    assert.equal(reserveInput.preset, presetKey);
    assert.equal(
      providerForm.get("size"),
      `${preset.width}x${preset.height}`,
    );
  }
});

test("standing automation idempotency is stable across Team operators for the same restaurant and key", async () => {
  const alternateUserId = "66666666-6666-4666-8666-666666666666";
  const first = harness();
  const second = harness({
    authenticate: async () => ({
      role: "team",
      restaurantId: RESTAURANT_ID,
      userId: alternateUserId,
    }),
  });
  assert.equal((await first.handler(request())).status, 200);
  assert.equal((await second.handler(request())).status, 200);
  assert.equal(
    first.calls.reserve[0].idempotencyHash,
    second.calls.reserve[0].idempotencyHash,
  );
});

test("model access verification is bounded, exact, and never sends image data", async () => {
  let observedUrl = "";
  let observedInit;
  const accessible = await verifyMomoMediaAiOpenAiAccess(
    "sk-test-placeholder",
    async (url, init) => {
      observedUrl = String(url);
      observedInit = init;
      return new Response(JSON.stringify({
        id: MOMO_MEDIA_AI_MODEL,
        object: "model",
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  );
  assert.equal(accessible, true);
  assert.equal(
    observedUrl,
    `https://api.openai.com/v1/models/${MOMO_MEDIA_AI_MODEL}`,
  );
  assert.equal(observedInit.method, "GET");
  assert.equal(observedInit.body, undefined);
  assert.equal(
    observedInit.headers.authorization,
    "Bearer sk-test-placeholder",
  );

  for (const response of [
    new Response("{}", { status: 401 }),
    new Response(JSON.stringify({ id: "different-model", object: "model" })),
    new Response("{not-json"),
    new Response("{}", {
      status: 200,
      headers: { "content-length": "16385" },
    }),
  ]) {
    assert.equal(
      await verifyMomoMediaAiOpenAiAccess(
        "sk-test-placeholder",
        async () => response,
      ),
      false,
    );
  }
});

test("reconciles valid provider usage at the locked GPT Image 2 rates", async () => {
  const usage = {
    input_tokens: 1_100,
    input_tokens_details: {
      image_tokens: 1_000,
      text_tokens: 100,
    },
    output_tokens: 2_000,
    total_tokens: 3_100,
  };
  const { handler, calls } = harness({
    callOpenAI: async () => providerResponse(png(), 200, {}, usage),
  });
  const response = await handler(request());
  const body = await json(response);
  assert.equal(response.status, 200);
  assert.equal(body.accountedMicrousd, 68_500);
  assert.equal(body.accountingBasis, "provider_usage_estimate");
  assert.equal(calls.complete[0].accountedMicrousd, 68_500);
  assert.equal(
    calls.complete[0].accountingBasis,
    "provider_usage_estimate",
  );
  assert.deepEqual(calls.complete[0].providerUsage, usage);
});

test("malformed usage falls back to the conservative per-job ceiling", async () => {
  const { handler, calls } = harness({
    callOpenAI: async () => providerResponse(png(), 200, {}, {
      input_tokens: 1_100,
      input_tokens_details: {
        image_tokens: 1_000,
        text_tokens: 100,
      },
      output_tokens: 2_000,
      total_tokens: 3_099,
    }),
  });
  const response = await handler(request());
  const body = await json(response);
  assert.equal(response.status, 200);
  assert.equal(body.accountedMicrousd, 20_000_000);
  assert.equal(body.accountingBasis, "conservative_reservation");
  assert.equal(calls.complete[0].providerUsage, null);
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

test("a structurally truncated source fails before the billable provider boundary even when metadata matches", async () => {
  const truncated = SOURCE_BYTES.slice(0, -1);
  const truncatedSha = await momoBytesSha256(truncated);
  const { handler, calls } = harness({
    reserve: async () => reservation({
      sourceFileSize: truncated.byteLength,
      sourceContentSha256: truncatedSha,
    }),
    downloadSource: async () =>
      new Blob([truncated], { type: "image/jpeg" }),
  });
  const response = await handler(request());
  assert.equal(response.status, 409);
  assert.equal((await json(response)).error, "source_not_ready");
  assert.equal(calls.provider.length, 0);
  assert.equal(calls.fail.at(-1).errorCode, "source_verification_failed");
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
  const malformedScanlines = pngFromRaw(
    INSTAGRAM_PORTRAIT.width,
    INSTAGRAM_PORTRAIT.height,
    new Uint8Array([0]),
  );
  const compressed = Uint8Array.from(deflateSync(new Uint8Array(
    (Math.ceil(INSTAGRAM_PORTRAIT.width / 8) + 1)
      * INSTAGRAM_PORTRAIT.height,
  )));
  const truncatedDeflate = pngFromCompressed(
    INSTAGRAM_PORTRAIT.width,
    INSTAGRAM_PORTRAIT.height,
    compressed.slice(0, -1),
  );
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
    {
      callOpenAI: async () => providerResponse(png().slice(0, -1)),
      expected: "provider_output_invalid",
    },
    {
      callOpenAI: async () => providerResponse(malformedScanlines),
      expected: "provider_output_invalid",
    },
    {
      callOpenAI: async () => providerResponse(truncatedDeflate),
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

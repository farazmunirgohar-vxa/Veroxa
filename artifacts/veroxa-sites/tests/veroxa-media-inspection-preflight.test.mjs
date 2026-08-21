import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import jpeg from "jpeg-js";

import {
  createMediaInspectionPreflightHandler,
  MediaInspectionPreflightFailure,
  mediaInspectionPreflightCanonicalBody,
  mediaInspectionPreflightPath,
  mediaInspectionPreflightWakeContext,
} from "../app/api/internal/veroxa/media/inspection-preflight/core.ts";
import {
  inspectMomoImageBytesFully,
  momoBytesSha256,
} from "../app/momo-image-bytes.ts";
import {
  createVeroxaPrivateMediaStorageImageInspector,
} from "../app/veroxa-private-media-supabase-image-decode.ts";

const SECRET = "cd".repeat(32);
const RUN_ID = "11111111-1111-4111-8111-111111111111";
const NONCE = "22222222-2222-4222-8222-222222222222";
const OBJECT_ID = "33333333-3333-4333-8333-333333333333";
const VERSION = "fixture-version-1";
const SHA256 = "a".repeat(64);
const PATH = `__veroxa_system/image-inspection-preflight/v1/${SHA256}.jpg`;

const [routeSource, imageDecoderSource, workerSource, recoveryRouteSource,
  assessmentRouteSource, finalizeRouteSource, artifactMigration, rootMigration,
  releaseManifestSource] =
  await Promise.all([
    readFile(new URL(
      "../app/api/internal/veroxa/media/inspection-preflight/route.ts",
      import.meta.url,
    ), "utf8"),
    readFile(new URL(
      "../app/veroxa-private-media-supabase-image-decode.ts",
      import.meta.url,
    ), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL(
      "../app/api/internal/momo/media/recover/route.ts",
      import.meta.url,
    ), "utf8"),
    readFile(new URL("../app/api/media/assessment/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/media/finalize/route.ts", import.meta.url), "utf8"),
    readFile(new URL(
      "../supabase/migrations/20260815090000_media_inspection_preflight_canary_v1.sql",
      import.meta.url,
    ), "utf8"),
    readFile(new URL(
      "../../../supabase/migrations/20260815090000_media_inspection_preflight_canary_v1.sql",
      import.meta.url,
    ), "utf8"),
    readFile(new URL(
      "../../../scripts/src/release-manifest.ts",
      import.meta.url,
    ), "utf8"),
  ]);

function encodedJpeg(width, height) {
  const data = Buffer.alloc(width * height * 4, 0);
  for (let index = 0; index < data.length; index += 4) {
    data[index] = 196;
    data[index + 1] = 108;
    data[index + 2] = 48;
    data[index + 3] = 255;
  }
  return new Uint8Array(jpeg.encode({ data, width, height }, 90).data);
}

function signedRequest({
  signature,
  timestamp = Date.now().toString(),
  nonce = NONCE,
  rawBody = mediaInspectionPreflightCanonicalBody,
  method = "POST",
} = {}) {
  const signed = signature ?? createHmac("sha256", Buffer.from(SECRET, "hex"))
    .update(
      `${mediaInspectionPreflightWakeContext}\n${timestamp}\n${nonce}\n${mediaInspectionPreflightCanonicalBody}`,
    )
    .digest("hex");
  return new Request(`https://veroxa.example${mediaInspectionPreflightPath}`, {
    method,
    headers: {
      "content-type": "application/json",
      "x-veroxa-media-inspection-timestamp-ms": timestamp,
      "x-veroxa-media-inspection-nonce": nonce,
      "x-veroxa-media-inspection-signature": signed,
    },
    body: method === "POST" ? rawBody : undefined,
  });
}

function passedDiagnostics() {
  return {
    schemaVersion: 1,
    status: "passed",
    stage: "complete",
    failureCode: null,
    bindingAvailable: true,
    info: { width: 3, height: 2, fileSize: 640, format: "image/jpeg" },
    output: {
      httpStatus: 200,
      contentType: "image/jpeg",
      declaredContentLength: 640,
      byteLength: 640,
    },
  };
}

function fixture() {
  return {
    bytes: encodedJpeg(3, 2),
    mimeType: "image/jpeg",
    storagePath: PATH,
    storageObjectId: OBJECT_ID,
    storageObjectVersion: VERSION,
    sha256: SHA256,
  };
}

function transformClient(source, options = {}) {
  const object = {
    id: OBJECT_ID,
    version: VERSION,
    name: PATH,
    bucketId: "restaurant-media",
    size: source.byteLength,
    contentType: "image/jpeg",
  };
  return {
    storage: {
      from() {
        return {
          async info() {
            return { data: object, error: null };
          },
          async createSignedUrl() {
            return options.signing ?? {
              data: {
                signedUrl:
                  `https://mwqkhsvdezeykdpqhqec.supabase.co/storage/v1/object/sign/restaurant-media/${PATH}?token=opaque`,
              },
              error: null,
            };
          },
        };
      },
    },
  };
}

function handlerHarness(options = {}) {
  const calls = { claim: [], fixture: 0, inspect: [], complete: [] };
  const handler = createMediaInspectionPreflightHandler({
    configured: options.configured ?? true,
    wakeHmacSecret: SECRET,
    now: () => options.now ?? 1_770_000_000_000,
    async claim(input) {
      calls.claim.push(input);
      return options.claim ?? [{ preflight_run_id: RUN_ID }];
    },
    async ensureFixture() {
      calls.fixture += 1;
      if (options.fixtureError) throw options.fixtureError;
      return fixture();
    },
    async inspect(input) {
      calls.inspect.push(input);
      return options.inspection ?? {
        inspection: { width: 3, height: 2, fileSize: input.bytes.byteLength },
        diagnostics: passedDiagnostics(),
      };
    },
    async complete(input) {
      calls.complete.push(input);
      if (options.completeError) throw new Error("unavailable");
    },
  });
  return { handler, calls };
}

test("production transform adapter proves an immutable storage source through a 1px decoded output", async () => {
  const source = encodedJpeg(3, 2);
  const onePixel = encodedJpeg(1, 1);
  const calls = { info: 0, signed: [], fetch: [] };
  const object = {
    id: OBJECT_ID,
    version: VERSION,
    name: PATH,
    bucketId: "restaurant-media",
    size: source.byteLength,
    contentType: "image/jpeg",
  };
  const client = {
    storage: {
      from(bucket) {
        assert.equal(bucket, "restaurant-media");
        return {
          async info(path) {
            calls.info += 1;
            assert.equal(path, PATH);
            return { data: object, error: null };
          },
          async createSignedUrl(path, expiresIn, options) {
            calls.signed.push({ path, expiresIn, options });
            return {
              data: {
                signedUrl:
                  `https://mwqkhsvdezeykdpqhqec.supabase.co/storage/v1/object/sign/restaurant-media/${PATH}?token=opaque`,
              },
              error: null,
            };
          },
        };
      },
    },
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.fetch.push({ url: String(url), init });
    return new Response(onePixel, {
      status: 200,
      headers: {
        "content-type": "image/jpeg",
        "content-length": String(onePixel.byteLength),
      },
    });
  };
  try {
    const inspect = createVeroxaPrivateMediaStorageImageInspector({
      client,
      supabaseUrl: "https://mwqkhsvdezeykdpqhqec.supabase.co",
      timeoutMs: 2_000,
    });
    const result = await inspect({
      bytes: source,
      mimeType: "image/jpeg",
      storagePath: PATH,
      storageObjectId: OBJECT_ID,
      storageObjectVersion: VERSION,
    });
    assert.deepEqual(result.inspection, {
      width: 3,
      height: 2,
      fileSize: source.byteLength,
    });
    assert.equal(result.diagnostics.status, "passed");
    assert.equal(calls.info, 2);
    assert.deepEqual(calls.signed[0], {
      path: PATH,
      expiresIn: 60,
      options: {
        transform: { width: 1, height: 1, resize: "fill", format: "origin" },
      },
    });
    assert.equal(Object.hasOwn(calls.fetch[0].init, "cache"), false);
    assert.equal(Object.hasOwn(calls.fetch[0].init, "credentials"), false);
    assert.equal(calls.fetch[0].init.redirect, "manual");
    assert.ok(calls.fetch[0].init.signal instanceof AbortSignal);
    assert.equal(calls.fetch[0].init.signal.aborted, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adapter fails closed with an actionable missing-binding result", async () => {
  const inspect = createVeroxaPrivateMediaStorageImageInspector({
    client: null,
    supabaseUrl: "https://mwqkhsvdezeykdpqhqec.supabase.co",
  });
  const result = await inspect({
    bytes: encodedJpeg(3, 2),
    mimeType: "image/jpeg",
    storagePath: PATH,
    storageObjectId: OBJECT_ID,
    storageObjectVersion: VERSION,
  });
  assert.equal(result.inspection, null);
  assert.deepEqual(result.diagnostics, {
    schemaVersion: 1,
    status: "failed",
    stage: "binding",
    failureCode: "storage_transform_binding_unavailable",
    bindingAvailable: false,
    info: null,
    output: null,
  });
});

test("adapter classifies credential, provider, request, rate-limit, and malformed-response failures", async () => {
  const source = encodedJpeg(3, 2);
  const input = {
    bytes: source,
    mimeType: "image/jpeg",
    storagePath: PATH,
    storageObjectId: OBJECT_ID,
    storageObjectVersion: VERSION,
  };
  const invalidConfiguration = createVeroxaPrivateMediaStorageImageInspector({
    client: transformClient(source),
    supabaseUrl: "http://mwqkhsvdezeykdpqhqec.supabase.co",
  });
  assert.equal((await invalidConfiguration(input)).diagnostics.failureCode,
    "storage_transform_credential_unavailable");

  for (const [status, expected] of [
    [503, "storage_transform_provider_unavailable"],
    [400, "storage_transform_signing_failed"],
    [429, "storage_transform_rate_limited"],
  ]) {
    const inspect = createVeroxaPrivateMediaStorageImageInspector({
      client: transformClient(source, { signing: { data: null, error: { status } } }),
      supabaseUrl: "https://mwqkhsvdezeykdpqhqec.supabase.co",
    });
    assert.equal((await inspect(input)).diagnostics.failureCode, expected);
  }

  const wrongSignedPath = createVeroxaPrivateMediaStorageImageInspector({
    client: transformClient(source, {
      signing: {
        data: {
          signedUrl:
            "https://mwqkhsvdezeykdpqhqec.supabase.co/storage/v1/object/sign/restaurant-media/other.jpg?token=opaque",
        },
        error: null,
      },
    }),
    supabaseUrl: "https://mwqkhsvdezeykdpqhqec.supabase.co",
  });
  assert.equal((await wrongSignedPath(input)).diagnostics.failureCode,
    "storage_transform_signing_failed");

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(encodedJpeg(1, 1), {
    status: 400,
    headers: { "content-type": "image/jpeg" },
  });
  try {
    const inspect = createVeroxaPrivateMediaStorageImageInspector({
      client: transformClient(source),
      supabaseUrl: "https://mwqkhsvdezeykdpqhqec.supabase.co",
    });
    assert.equal((await inspect(input)).diagnostics.failureCode,
      "storage_transform_request_rejected");
  } finally {
    globalThis.fetch = originalFetch;
  }

  let redirectBodyRead = false;
  globalThis.fetch = async () => ({
    status: 302,
    ok: false,
    headers: new Headers({ location: "https://unexpected.example/" }),
    get body() {
      redirectBodyRead = true;
      throw new Error("redirect_body_must_not_be_read");
    },
  });
  try {
    const inspect = createVeroxaPrivateMediaStorageImageInspector({
      client: transformClient(source),
      supabaseUrl: "https://mwqkhsvdezeykdpqhqec.supabase.co",
    });
    const result = await inspect(input);
    assert.equal(result.inspection, null);
    assert.equal(result.diagnostics.failureCode,
      "storage_transform_request_rejected");
    assert.equal(result.diagnostics.output?.httpStatus, 302);
    assert.equal(redirectBodyRead, false);
  } finally {
    globalThis.fetch = originalFetch;
  }

  globalThis.fetch = async () => new Response("not an image", {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
  try {
    const inspect = createVeroxaPrivateMediaStorageImageInspector({
      client: transformClient(source),
      supabaseUrl: "https://mwqkhsvdezeykdpqhqec.supabase.co",
    });
    assert.equal((await inspect(input)).diagnostics.failureCode,
      "storage_transform_response_content_type_invalid");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adapter bounds a transform that stalls after request start", async () => {
  const source = encodedJpeg(3, 2);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => new Promise((_, reject) => {
    init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), {
      once: true,
    });
  });
  try {
    const inspect = createVeroxaPrivateMediaStorageImageInspector({
      client: transformClient(source),
      supabaseUrl: "https://mwqkhsvdezeykdpqhqec.supabase.co",
      timeoutMs: 1_000,
    });
    const result = await inspect({
      bytes: source,
      mimeType: "image/jpeg",
      storagePath: PATH,
      storageObjectId: OBJECT_ID,
      storageObjectVersion: VERSION,
    });
    assert.equal(result.diagnostics.failureCode, "storage_transform_timeout");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adapter bounds stalled Storage metadata and signing calls before a transform URL exists", async () => {
  const source = encodedJpeg(3, 2);
  const input = {
    bytes: source,
    mimeType: "image/jpeg",
    storagePath: PATH,
    storageObjectId: OBJECT_ID,
    storageObjectVersion: VERSION,
  };
  const object = {
    id: OBJECT_ID,
    version: VERSION,
    name: PATH,
    bucketId: "restaurant-media",
    size: source.byteLength,
    contentType: "image/jpeg",
  };
  const metadataStall = createVeroxaPrivateMediaStorageImageInspector({
    client: {
      storage: { from: () => ({
        info: () => new Promise(() => {}),
        createSignedUrl: async () => ({ data: null, error: null }),
      }) },
    },
    supabaseUrl: "https://mwqkhsvdezeykdpqhqec.supabase.co",
    timeoutMs: 1_000,
  });
  assert.equal((await metadataStall(input)).diagnostics.failureCode,
    "storage_transform_timeout");

  const signingStall = createVeroxaPrivateMediaStorageImageInspector({
    client: {
      storage: { from: () => ({
        info: async () => ({ data: object, error: null }),
        createSignedUrl: () => new Promise(() => {}),
      }) },
    },
    supabaseUrl: "https://mwqkhsvdezeykdpqhqec.supabase.co",
    timeoutMs: 1_000,
  });
  assert.equal((await signingStall(input)).diagnostics.failureCode,
    "storage_transform_timeout");
});

test("signed preflight records a pass and does not expose fixture or dependency details", async () => {
  const now = 1_770_000_000_000;
  const { handler, calls } = handlerHarness({ now });
  const response = await handler(signedRequest({ timestamp: String(now) }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    schemaVersion: 1,
    state: "passed",
    failureCode: null,
  });
  assert.equal(calls.fixture, 1);
  assert.equal(calls.inspect.length, 1);
  assert.deepEqual(calls.complete, [{
    runId: RUN_ID,
    state: "passed",
    failureCode: null,
    diagnostics: passedDiagnostics(),
    fixtureSha256: SHA256,
  }]);
});

test("embedded synthetic fixture is decodable and content-addressed", async () => {
  const base64 = routeSource.match(
    /const FIXTURE_BASE64 =\n\s*"([A-Za-z0-9+/=]+)";/u,
  )?.[1];
  const sha256 = routeSource.match(
    /const FIXTURE_SHA256 =\n\s*"([0-9a-f]{64})";/u,
  )?.[1];
  assert.ok(base64);
  assert.ok(sha256);
  const bytes = new Uint8Array(Buffer.from(base64, "base64"));
  const inspection = await inspectMomoImageBytesFully(bytes);
  assert.equal(await momoBytesSha256(bytes), sha256);
  assert.deepEqual(inspection && {
    mimeType: inspection.mimeType,
    width: inspection.width,
    height: inspection.height,
  }, {
    mimeType: "image/jpeg",
    width: 3,
    height: 2,
  });
});

test("signature failures, replays, and failed inspection remain fail-closed", async () => {
  const now = 1_770_000_000_000;
  const rejected = handlerHarness({ now });
  const unauthorized = await rejected.handler(signedRequest({
    timestamp: String(now),
    signature: "00".repeat(32),
  }));
  assert.equal(unauthorized.status, 403);
  assert.equal(rejected.calls.claim.length, 0);
  assert.equal(rejected.calls.fixture, 0);

  const stale = await rejected.handler(signedRequest({
    timestamp: String(now - 120_001),
  }));
  assert.equal(stale.status, 403);
  assert.equal(rejected.calls.claim.length, 0);

  const replay = handlerHarness({ now, claim: [] });
  const replayResponse = await replay.handler(signedRequest({ timestamp: String(now) }));
  assert.equal(replayResponse.status, 202);
  assert.equal(replay.calls.fixture, 0);

  const failed = handlerHarness({
    now,
    inspection: {
      inspection: null,
      diagnostics: {
        ...passedDiagnostics(),
        status: "failed",
        stage: "provider",
        failureCode: "storage_transform_provider_unavailable",
      },
    },
  });
  const failedResponse = await failed.handler(signedRequest({ timestamp: String(now) }));
  assert.equal(failedResponse.status, 503);
  assert.deepEqual(failed.calls.complete[0], {
    runId: RUN_ID,
    state: "failed",
    failureCode: "storage_transform_provider_unavailable",
    diagnostics: failed.calls.complete[0].diagnostics,
    fixtureSha256: SHA256,
  });

  const fixtureFailure = handlerHarness({
    now,
    fixtureError: new MediaInspectionPreflightFailure(
      "media_inspection_fixture_integrity_invalid",
    ),
  });
  const fixtureResponse = await fixtureFailure.handler(
    signedRequest({ timestamp: String(now) }),
  );
  assert.equal(fixtureResponse.status, 503);
  assert.deepEqual(await fixtureResponse.json(), {
    schemaVersion: 1,
    state: "failed",
    failureCode: "media_inspection_fixture_integrity_invalid",
  });
  assert.deepEqual(fixtureFailure.calls.complete, [{
    runId: RUN_ID,
    state: "failed",
    failureCode: "media_inspection_fixture_integrity_invalid",
    diagnostics: null,
    fixtureSha256: null,
  }]);
});

test("source-level guard replaces the broken Images-only production dependency with a private canary", () => {
  const fixtureReaderStart = routeSource.indexOf("async function readFixture");
  const fixtureReaderEnd = routeSource.indexOf("async function ensureFixture");
  assert.ok(
    fixtureReaderStart >= 0 && fixtureReaderEnd > fixtureReaderStart,
  );
  const fixtureReader = routeSource.slice(
    fixtureReaderStart,
    fixtureReaderEnd,
  );
  assert.match(fixtureReader, /storage\.download\(FIXTURE_PATH\)/u);
  assert.doesNotMatch(fixtureReader, /\b(?:cache|credentials)\s*:/u);
  assert.doesNotMatch(fixtureReader, /storage\.download\(\s*FIXTURE_PATH\s*,/u);
  assert.doesNotMatch(imageDecoderSource, /\b(?:cache|credentials)\s*:/u);
  assert.match(imageDecoderSource, /redirect:\s*"manual"/u);
  assert.match(routeSource, /upsert:\s*false/u);
  assert.match(routeSource, /createVeroxaPrivateMediaStorageImageInspector/u);
  assert.doesNotMatch(routeSource, /OPENAI|responses\.create|images\.generate/u);
  assert.match(workerSource, /const images = env\.IMAGES/u);
  assert.match(workerSource, /image_optimizer_unavailable/u);
  assert.match(recoveryRouteSource, /createVeroxaPrivateMediaStorageImageInspector/u);
  assert.doesNotMatch(recoveryRouteSource, /__VEROXA_IMAGES__/u);
  assert.match(assessmentRouteSource, /createVeroxaPrivateMediaStorageImageDecoder/u);
  assert.match(finalizeRouteSource, /createVeroxaPrivateMediaStorageImageDecoder/u);
  assert.doesNotMatch(assessmentRouteSource, /host-image-decode/u);
  assert.doesNotMatch(finalizeRouteSource, /host-image-decode/u);
  assert.equal(rootMigration, artifactMigration);
  assert.match(rootMigration, /force row level security/u);
  assert.match(rootMigration, /revoke all on function[\s\S]*deliver_media_inspection_preflight_v1/u);
  assert.match(rootMigration, /to service_role/u);
  assert.match(rootMigration, /cron\.schedule/u);
  assert.match(rootMigration, /media_inspection_preflight_delivery_expired/u);
  assert.match(rootMigration, /media_inspection_preflight_runtime_secret_v1/u);
  assert.match(rootMigration, /veroxa_media_inspection_preflight_endpoint_v1/u);
  assert.match(rootMigration, /media_inspection_preflight_configuration_unavailable/u);
  assert.doesNotMatch(rootMigration, /endpoint constant text/u);
  assert.match(releaseManifestSource,
    /ACTIVE_MEDIA_INSPECTION_CANDIDATE_ALLOWED_PATHS/u);
  assert.match(releaseManifestSource,
    /active media-inspection candidate Git scope drifted/u);
  assert.match(releaseManifestSource,
    /gitPathList\(\["ls-files", "--others", "--exclude-standard"\]\)/u);
  assert.doesNotMatch(rootMigration, /openai|publish|schedule.*external/iu);
});

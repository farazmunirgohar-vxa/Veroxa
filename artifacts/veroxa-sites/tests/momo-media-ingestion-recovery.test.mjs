import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createMomoMediaRecoveryHandler,
  momoMediaRecoveryWakeCanonicalBody,
  momoMediaRecoveryWakeContext,
} from "../app/api/internal/momo/media/recover/core.ts";

const RESTAURANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ACTOR_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ASSET_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const OBJECT_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const OUTBOX_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const LEASE_TOKEN = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const WAKE_NONCE = "11111111-1111-4111-8111-111111111111";
const CORRELATION_ID = "22222222-2222-4222-8222-222222222222";
const VERIFICATION_ID = "33333333-3333-4333-8333-333333333333";
const INCIDENT_ID = "44444444-4444-4444-8444-444444444444";
const WAKE_SECRET = "ab".repeat(32);
const STORAGE_VERSION = "storage-version-1";
const STORAGE_PATH =
  `restaurants/${RESTAURANT_ID}/uploads/2026/08/55555555-5555-4555-8555-555555555555.jpg`;

const [routeSource, migrationSource, pathRepairMigrationSource] = await Promise.all([
  readFile(new URL(
    "../app/api/internal/momo/media/recover/route.ts",
    import.meta.url,
  ), "utf8"),
  readFile(new URL(
    "../supabase/migrations/20260813163534_durable_media_ingestion_recovery.sql",
    import.meta.url,
  ), "utf8"),
  readFile(new URL(
    "../supabase/migrations/20260813175640_durable_media_ingestion_path_regex_repair_v1.sql",
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

function jpegWithTrailingBytes(width = 1200, height = 900) {
  const strict = jpeg(width, height);
  const bytes = new Uint8Array(strict.byteLength + 4);
  bytes.set(strict);
  bytes.set([0x00, 0x00, 0x00, 0x00], strict.byteLength);
  return bytes;
}

function malformedJpegWithMagic(minimumBytes = 10 * 1024) {
  const bytes = new Uint8Array(minimumBytes);
  bytes.set([0xff, 0xd8, 0xff, 0xd9]);
  return bytes;
}

function recoveryRequest({
  rawBody = momoMediaRecoveryWakeCanonicalBody,
  timestamp = Date.now().toString(),
  nonce = WAKE_NONCE,
  signature,
  url = "https://veroxa.example/api/internal/momo/media/recover",
  method = "POST",
} = {}) {
  const signed = signature ?? createHmac(
    "sha256",
    Buffer.from(WAKE_SECRET, "hex"),
  ).update(
    `${momoMediaRecoveryWakeContext}\n${timestamp}\n${nonce}\n${momoMediaRecoveryWakeCanonicalBody}`,
  ).digest("hex");
  return new Request(url, {
    method,
    headers: {
      "content-type": "application/json",
      "x-veroxa-media-ingestion-timestamp-ms": timestamp,
      "x-veroxa-media-ingestion-nonce": nonce,
      "x-veroxa-media-ingestion-signature": signed,
    },
    body: method === "POST" ? rawBody : undefined,
  });
}

function harness(options = {}) {
  const source = options.source ?? jpeg();
  const storageObjectId = options.storageObjectMissing ? null : OBJECT_ID;
  const storageObjectVersion = options.storageObjectMissing
    ? null
    : STORAGE_VERSION;
  const calls = {
    claim: [],
    download: [],
    info: [],
    decode: [],
    inspect: [],
    complete: [],
    fail: [],
  };
  const dependencies = {
    configured: options.configured ?? true,
    wakeHmacSecret: options.wakeHmacSecret ?? WAKE_SECRET,
    randomUUID: () => LEASE_TOKEN,
    async claim(input) {
      calls.claim.push(input);
      if (options.claimError) throw new Error("claim unavailable");
      if (options.claim !== undefined) return options.claim;
      return [{
        outbox_id: OUTBOX_ID,
        restaurant_id: RESTAURANT_ID,
        asset_id: ASSET_ID,
        storage_path: STORAGE_PATH,
        storage_object_id: storageObjectId,
        storage_object_version: storageObjectVersion,
        declared_mime_type: "image/jpeg",
        declared_file_size: source.length,
        actor_id: ACTOR_ID,
        correlation_id: CORRELATION_ID,
        lease_token: LEASE_TOKEN,
        attempt_count: options.attemptCount ?? 1,
        external_write_allowed: false,
      }];
    },
    async download(path) {
      calls.download.push(path);
      if (options.storageError) throw new Error("storage unavailable");
      return new Blob([source], { type: "image/jpeg" });
    },
    async info(path) {
      calls.info.push(path);
      if (options.storageError) throw new Error("storage unavailable");
      return {
        id: options.infoId ?? OBJECT_ID,
        version: options.infoVersion ?? STORAGE_VERSION,
        name: options.infoPath ?? path,
        bucketId: options.bucketId ?? "restaurant-media",
        size: options.infoSize ?? source.length,
        contentType: options.infoMime ?? "image/jpeg",
      };
    },
    async decodeHighResolutionImage(input) {
      calls.decode.push(input);
      return options.decodeResult ?? true;
    },
    async inspectImageWithHost(input) {
      calls.inspect.push(input);
      if (options.inspectError) throw new Error("host inspection unavailable");
      const inspection = options.hostInspection ?? null;
      return {
        inspection,
        diagnostics: options.hostDiagnostics ?? {
          schemaVersion: 1,
          status: inspection ? "passed" : "failed",
          stage: inspection ? "complete" : "info",
          failureCode: inspection ? null : "images_info_failed",
          bindingAvailable: true,
          info: inspection
            ? { ...inspection, format: "image/jpeg" }
            : null,
          output: inspection
            ? {
              httpStatus: 200,
              contentType: "image/jpeg",
              declaredContentLength: null,
              byteLength: 24,
            }
            : null,
        },
      };
    },
    async complete(input) {
      calls.complete.push(input);
      if (options.completeError) throw new Error("completion unavailable");
      if (options.complete !== undefined) return options.complete;
      return [{
        outbox_id: OUTBOX_ID,
        asset_id: ASSET_ID,
        verification_id: VERIFICATION_ID,
        status: "verified",
        canonical_asset_id: ASSET_ID,
        duplicate_asset_id: null,
        correlation_id: CORRELATION_ID,
        external_write_allowed: false,
      }];
    },
    async fail(input) {
      calls.fail.push(input);
      if (options.failError) throw new Error("failure recording unavailable");
      const status = options.failureStatus ??
        (input.retryable ? "retry_wait" : "dead_letter");
      return [{
        outbox_id: OUTBOX_ID,
        asset_id: ASSET_ID,
        status,
        failure_code: input.failureCode,
        correlation_id: CORRELATION_ID,
        incident_id: INCIDENT_ID,
        external_write_allowed: false,
      }];
    },
  };
  return {
    calls,
    source,
    handler: createMomoMediaRecoveryHandler(dependencies),
  };
}

test("recovers the exact stored asset with byte, decode, canonical, and hash evidence", async () => {
  const { calls, source, handler } = harness();
  const response = await handler(recoveryRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    recoveryStatus: "recovered",
    verificationId: VERIFICATION_ID,
    status: "verified",
    canonicalAssetId: ASSET_ID,
    duplicateAssetId: null,
    externalWriteAllowed: false,
  });
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.deepEqual(calls.download, [STORAGE_PATH]);
  assert.deepEqual(calls.info, [STORAGE_PATH]);
  assert.equal(calls.complete.length, 1);
  assert.equal(calls.fail.length, 0);
  const finalized = calls.complete[0];
  assert.equal(finalized.outboxId, OUTBOX_ID);
  assert.equal(finalized.leaseToken, LEASE_TOKEN);
  assert.equal(finalized.storageObjectId, OBJECT_ID);
  assert.equal(finalized.storageObjectVersion, STORAGE_VERSION);
  assert.equal(finalized.fileSize, source.length);
  assert.equal(finalized.width, 1200);
  assert.equal(finalized.height, 900);
  assert.match(finalized.contentSha256, /^[0-9a-f]{64}$/u);
  assert.match(finalized.verificationSha256, /^[0-9a-f]{64}$/u);
  assert.match(finalized.idempotencyHash, /^[0-9a-f]{64}$/u);
  const expectedContentSha256 = createHash("sha256").update(source).digest(
    "hex",
  );
  assert.equal(finalized.contentSha256, expectedContentSha256);
  assert.equal(
    finalized.verificationSha256,
    createHash("sha256").update(finalized.verificationCanonical).digest("hex"),
  );
  assert.equal(
    finalized.idempotencyHash,
    createHash("sha256").update(
      `${RESTAURANT_ID}:${ASSET_ID}:${OBJECT_ID}:${STORAGE_VERSION}:${expectedContentSha256}`,
    ).digest("hex"),
  );
  assert.deepEqual(
    JSON.parse(finalized.verificationCanonical),
    finalized.verificationSnapshot,
  );
  assert.equal(
    finalized.verificationSnapshot.verifierVersion,
    "veroxa-private-image-byte-verifier-2026-08-08-v1",
    "the recovery success record must remain compatible with the persisted intake contract",
  );
});

test("reports recovery ownership separately from an idempotent duplicate result", async () => {
  const canonicalAssetId = "77777777-7777-4777-8777-777777777777";
  const { handler } = harness({
    complete: [{
      outbox_id: OUTBOX_ID,
      asset_id: ASSET_ID,
      verification_id: VERIFICATION_ID,
      status: "duplicate",
      canonical_asset_id: canonicalAssetId,
      duplicate_asset_id: ASSET_ID,
      correlation_id: CORRELATION_ID,
      external_write_allowed: false,
    }],
  });
  const response = await handler(recoveryRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    recoveryStatus: "recovered",
    verificationId: VERIFICATION_ID,
    status: "duplicate",
    canonicalAssetId,
    duplicateAssetId: ASSET_ID,
    externalWriteAllowed: false,
  });
});

test("accepts high-resolution originals without an aggregate-pixel rejection", async () => {
  const source = jpeg(8064, 6048);
  const { calls, handler } = harness({ source });
  assert.equal((await handler(recoveryRequest())).status, 200);
  assert.equal(calls.complete[0].width, 8064);
  assert.equal(calls.complete[0].height, 6048);
  assert.equal(calls.decode.length, 1);
  assert.equal(calls.decode[0].expectedWidth, 8064);
  assert.equal(calls.decode[0].expectedHeight, 6048);
});

test("recovers a declared JPEG through the trusted host when strict structural inspection rejects compatible trailing bytes", async () => {
  const source = jpegWithTrailingBytes();
  const { calls, handler } = harness({
    source,
    hostInspection: {
      width: 1200,
      height: 900,
      fileSize: source.byteLength,
    },
  });
  const response = await handler(recoveryRequest());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).recoveryStatus, "recovered");
  assert.equal(calls.inspect.length, 1);
  assert.equal(calls.decode.length, 0,
    "the host inspection already proves a complete bounded decode");
  assert.equal(calls.complete.length, 1);
  assert.equal(calls.complete[0].width, 1200);
  assert.equal(calls.complete[0].height, 900);
  assert.equal(calls.complete[0].fileSize, source.byteLength);
  assert.equal(
    calls.complete[0].contentSha256,
    createHash("sha256").update(source).digest("hex"),
    "hash the preserved original bytes, including the compatible trailer",
  );
});

test("host compatibility inspection remains fail-closed for wrong magic, decode failure, size drift, and unsafe dimensions", async () => {
  const compatible = jpegWithTrailingBytes();
  const malformed = malformedJpegWithMagic();
  const scenarios = [
    {
      source: new Uint8Array(compatible.byteLength).fill(0x01),
      hostInspection: { width: 1200, height: 900, fileSize: compatible.length },
      expectedHostCalls: 0,
    },
    {
      source: compatible,
      hostInspection: null,
      expectedHostCalls: 1,
    },
    {
      source: compatible,
      hostInspection: {
        width: 1200,
        height: 900,
        fileSize: compatible.length - 1,
      },
      expectedHostCalls: 1,
    },
    {
      source: malformed,
      hostInspection: {
        width: 1200,
        height: 900,
        fileSize: malformed.length,
      },
      expectedHostCalls: 1,
    },
    {
      source: compatible,
      hostInspection: {
        width: 12_001,
        height: 900,
        fileSize: compatible.length,
      },
      expectedHostCalls: 1,
    },
  ];
  for (const options of scenarios) {
    const { calls, handler } = harness(options);
    const response = await handler(recoveryRequest());
    assert.equal(response.status, 200);
    assert.equal((await response.json()).error, "media_not_assessable");
    assert.equal(calls.inspect.length, options.expectedHostCalls);
    assert.equal(calls.complete.length, 0);
    assert.equal(calls.fail.length, 1);
    assert.equal(calls.fail[0].retryable, false);
    if (options.expectedHostCalls === 1) {
      assert.equal(
        calls.fail[0].evidenceSnapshot.stage,
        options.hostInspection ? "worker" : "host_image_inspection",
      );
      assert.equal(
        calls.fail[0].evidenceSnapshot.observed.hostInspectionDiagnostics
          .failureCode,
        options.hostInspection ? null : "images_info_failed",
      );
    }
  }
});

test("wake authentication rejects noncanonical, stale, tampered, wrong-path, and wrong-method requests before claim", async () => {
  const scenarios = [
    recoveryRequest({ rawBody: '{"schemaVersion":1,"extra":true}' }),
    recoveryRequest({
      rawBody: '{"schemaVersion":1,"schemaVersion":1}',
    }),
    recoveryRequest({ timestamp: String(Date.now() - 120_000) }),
    recoveryRequest({ signature: "00".repeat(32) }),
    recoveryRequest({
      url: "https://veroxa.example/api/internal/momo/media/recover?asset=1",
    }),
    recoveryRequest({ method: "GET" }),
  ];
  for (const request of scenarios) {
    const { calls, handler } = harness();
    assert.notEqual((await handler(request)).status, 200);
    assert.equal(calls.claim.length, 0);
    assert.equal(calls.download.length, 0);
  }
});

test("wake authentication rejects media types that only prefix-match JSON", async () => {
  const request = recoveryRequest();
  request.headers.set("content-type", "application/json-evil");
  const { calls, handler } = harness();
  assert.equal((await handler(request)).status, 400);
  assert.equal(calls.claim.length, 0);
});

test("accepts pg_net JSONB whitespace while preserving the exact wake shape", async () => {
  const { calls, handler } = harness({ claim: [] });
  const response = await handler(recoveryRequest({
    rawBody: '{"schemaVersion": 1}',
  }));
  assert.equal(response.status, 200);
  assert.equal(calls.claim.length, 1);
});

test("returns idle for an exact valid wake with no eligible claim", async () => {
  const { calls, handler } = harness({ claim: [] });
  const response = await handler(recoveryRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "idle",
    externalWriteAllowed: false,
  });
  assert.equal(calls.download.length, 0);
});

test("rejects malformed or externally writable claims before storage access", async () => {
  for (const claim of [[{
    outbox_id: OUTBOX_ID,
  }], [{
    outbox_id: OUTBOX_ID,
    restaurant_id: RESTAURANT_ID,
    asset_id: ASSET_ID,
    storage_path: STORAGE_PATH,
    storage_object_id: OBJECT_ID,
    storage_object_version: STORAGE_VERSION,
    declared_mime_type: "image/jpeg",
    declared_file_size: jpeg().length,
    actor_id: ACTOR_ID,
    correlation_id: CORRELATION_ID,
    lease_token: LEASE_TOKEN,
    attempt_count: 1,
    external_write_allowed: true,
  }], [{
    outbox_id: OUTBOX_ID,
    restaurant_id: RESTAURANT_ID,
    asset_id: ASSET_ID,
    storage_path:
      `restaurants/${RESTAURANT_ID}/uploads/2026/08/------------------------------------.jpg`,
    storage_object_id: OBJECT_ID,
    storage_object_version: STORAGE_VERSION,
    declared_mime_type: "image/jpeg",
    declared_file_size: jpeg().length,
    actor_id: ACTOR_ID,
    correlation_id: CORRELATION_ID,
    lease_token: LEASE_TOKEN,
    attempt_count: 1,
    external_write_allowed: false,
  }]]) {
    const { calls, handler } = harness({ claim });
    const response = await handler(recoveryRequest());
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: "media_recovery_claim_invalid",
    });
    assert.equal(calls.download.length, 0);
  }
});

test("missing storage metadata becomes one durable terminal failure without a read", async () => {
  const { calls, handler } = harness({ storageObjectMissing: true });
  const response = await handler(recoveryRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "failed",
    assetId: ASSET_ID,
    error: "media_recovery_storage_object_missing",
    externalWriteAllowed: false,
  });
  assert.equal(calls.download.length, 0);
  assert.equal(calls.info.length, 0);
  assert.equal(calls.complete.length, 0);
  assert.equal(calls.fail.length, 1);
  assert.equal(calls.fail[0].retryable, false);
  assert.equal(calls.fail[0].evidenceSnapshot.correlationId, CORRELATION_ID);
  assert.equal(calls.fail[0].evidenceSnapshot.originalActorId, ACTOR_ID);
});

test("transient storage failure records retry_wait and remains retryable", async () => {
  const { calls, handler } = harness({ storageError: true });
  const response = await handler(recoveryRequest());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: "media_recovery_retry_scheduled",
  });
  assert.equal(calls.complete.length, 0);
  assert.equal(calls.fail.length, 1);
  assert.equal(calls.fail[0].failureCode, "media_recovery_storage_unavailable");
  assert.equal(calls.fail[0].retryable, true);
  assert.equal(
    calls.fail[0].evidenceSha256,
    createHash("sha256").update(calls.fail[0].evidenceCanonical).digest("hex"),
  );
  assert.equal(
    calls.fail[0].idempotencySha256,
    createHash("sha256").update(
      `momo-media-recovery-failure-v1:${OUTBOX_ID}:1:${calls.fail[0].evidenceSha256}`,
    ).digest("hex"),
  );
});

test("database can dead-letter a retryable failure when bounded attempts are exhausted", async () => {
  const { handler } = harness({
    storageError: true,
    attemptCount: 5,
    failureStatus: "dead_letter",
  });
  const response = await handler(recoveryRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "failed",
    assetId: ASSET_ID,
    error: "media_recovery_storage_unavailable",
    externalWriteAllowed: false,
  });
});

test("immutable storage mismatches and trusted decode failures dead-letter with evidence", async () => {
  for (const options of [
    { infoVersion: "unexpected-version" },
    { infoId: "99999999-9999-4999-8999-999999999999" },
    { bucketId: "wrong-bucket" },
    { decodeResult: false },
  ]) {
    const { calls, handler } = harness(options);
    const response = await handler(recoveryRequest());
    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, "failed");
    assert.equal(calls.complete.length, 0);
    assert.equal(calls.fail.length, 1);
    assert.equal(calls.fail[0].retryable, false);
    assert.match(calls.fail[0].evidenceSha256, /^[0-9a-f]{64}$/u);
    assert.match(calls.fail[0].idempotencySha256, /^[0-9a-f]{64}$/u);
  }
});

test("rejects mismatched storage metadata before downloading the object", async () => {
  const { calls, handler } = harness({
    infoSize: jpeg().length + 1,
  });
  const response = await handler(recoveryRequest());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, "failed");
  assert.equal(calls.info.length, 1);
  assert.equal(calls.download.length, 0);
  assert.equal(calls.fail[0].failureCode, "media_recovery_storage_object_mismatch");
});

test("completion outage is durably recorded and exact replay evidence stays idempotent", async () => {
  const outage = harness({ completeError: true });
  assert.equal((await outage.handler(recoveryRequest())).status, 503);
  assert.equal(outage.calls.fail.length, 1);
  assert.equal(
    outage.calls.fail[0].failureCode,
    "media_recovery_completion_unavailable",
  );
  assert.equal(
    outage.calls.fail[0].evidenceSnapshot.verifierVersion,
    "veroxa-private-image-byte-verifier-2026-08-15-v2",
    "diagnostic evidence may evolve without changing the immutable success contract",
  );

  const replay = harness();
  assert.equal((await replay.handler(recoveryRequest())).status, 200);
  assert.equal((await replay.handler(recoveryRequest({
    nonce: "66666666-6666-4666-8666-666666666666",
  }))).status, 200);
  assert.equal(replay.calls.complete.length, 2);
  assert.equal(
    replay.calls.complete[0].idempotencyHash,
    replay.calls.complete[1].idempotencyHash,
  );
  assert.equal(
    replay.calls.complete[0].verificationSha256,
    replay.calls.complete[1].verificationSha256,
  );
});

test("a failed durable failure write never reports recovery or terminal ownership", async () => {
  const { handler } = harness({ storageError: true, failError: true });
  const response = await handler(recoveryRequest());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: "media_recovery_failure_recording_unavailable",
  });
});

test("route is service-role storage/RPC only and never invokes providers or external writes", () => {
  assert.match(routeSource, /SUPABASE_SECRET_KEY/u);
  assert.match(
    routeSource,
    /VEROXA_MOMO_CONTENT_AI_DISPATCH_HMAC_SECRET/u,
  );
  assert.doesNotMatch(routeSource, /SUPABASE_SERVICE_ROLE_KEY/u);
  assert.match(routeSource, /veroxa_claim_momo_media_ingestion_v1/u);
  assert.match(routeSource, /veroxa_complete_momo_media_ingestion_v1/u);
  assert.match(routeSource, /veroxa_fail_momo_media_ingestion_v1/u);
  assert.match(routeSource, /from\("restaurant-media"\)/u);
  assert.doesNotMatch(
    routeSource,
    /OpenAI|responses\.create|publish|schedule|provider_writes|callOpenAI/u,
  );
});

test("database contract is private, bounded, lease-based, and preserves external locks", () => {
  assert.doesNotMatch(migrationSource, /pg_catalog\.extract\s*\(/iu);
  assert.doesNotMatch(migrationSource, /pg_catalog\.(?:least|greatest)\s*\(/iu);
  assert.doesNotMatch(migrationSource, /candidate\.actor_id\s*=\s*actor_id\b/iu);
  assert.doesNotMatch(migrationSource, /target\.idempotency_sha256\s*=\s*idempotency_sha256\b/iu);
  assert.match(migrationSource, /candidate\.actor_id\s*=\s*v_actor_id\b/iu);
  assert.match(
    migrationSource,
    /target\.idempotency_sha256\s*=\s*v_idempotency_sha256\b/iu,
  );
  assert.equal(
    migrationSource.match(/extract\(epoch from\s+pg_catalog\.clock_timestamp\(\)\)/giu)?.length,
    2,
  );
  assert.equal(migrationSource.match(/\bleast\s*\(/giu)?.length, 4);
  for (const operation of ["claim", "complete", "fail"]) {
    const name = `veroxa_${operation}_momo_media_ingestion_v1`;
    assert.match(migrationSource, new RegExp(name, "u"));
    const grants = migrationSource.match(new RegExp(
      `grant execute on function\\s+public\\.${name}\\([\\s\\S]*?;`,
      "giu",
    )) ?? [];
    assert.equal(grants.length, 1);
    assert.match(grants[0], /to service_role\s*;/iu);
    assert.doesNotMatch(grants[0], /to (?:anon|authenticated)\b/iu);
  }
  assert.match(migrationSource, /for update skip locked/iu);
  assert.match(migrationSource, /external_write_allowed/iu);
  assert.match(migrationSource, /target\.attempt_count \+ 1 < target\.max_attempts/iu);
  assert.match(migrationSource, /receipt\.state = 'dead_letter'[\s\S]{0,900}return query select existing_attempt\.id/iu);
  assert.match(migrationSource, /receipt\.state = 'leased'[\s\S]{0,220}momo_media_ingestion_lease_active_v1/iu);
  assert.match(migrationSource, /momo-authenticated-intake-failure-v1:' \|\| receipt\.id::text \|\| ':' \|\|\s*p_correlation_id::text/iu);
  assert.doesNotMatch(migrationSource, /veroxa_momo_upload_pipeline_v2/iu);
  assert.match(migrationSource, /limit 100\s+for update skip locked/iu);
  assert.match(migrationSource, /limit 1000[\s\S]{0,180}delete from veroxa_private\.momo_media_ingestion_wake_nonces_v1/iu);
  assert.match(migrationSource, /recovery_actor_id := coalesce\(recovery_actor_id, receipt\.actor_id\)/iu);
  assert.match(migrationSource, /last_evidence_sha256 = attempt_sha256/iu);
  assert.doesNotMatch(pathRepairMigrationSource, /\\+\.\(jpg\|jpeg\|png\)/u);
  assert.equal(
    pathRepairMigrationSource.split("[.](jpg|jpeg|png)").length - 1,
    4,
  );
  assert.match(
    pathRepairMigrationSource,
    /lock table public\.veroxa_media_assets in share row exclusive mode/iu,
  );
  assert.match(
    pathRepairMigrationSource,
    /drop constraint momo_media_ingestion_outbox_v1_check/iu,
  );
  assert.match(
    pathRepairMigrationSource,
    /momo_media_ingestion_path_repair_backfill_incomplete_v1/iu,
  );
});

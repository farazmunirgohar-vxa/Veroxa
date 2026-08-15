import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  archiveVeroxaPrivateMediaOriginal,
  VeroxaMediaVaultError,
  veroxaMediaVaultKey,
} from "../app/momo-media-vault.ts";
import {
  createMomoMediaVaultHandler,
  momoMediaVaultWakeCanonicalBody,
  momoMediaVaultWakeContext,
} from "../app/api/internal/momo/media/vault/core.ts";

const RESTAURANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ASSET_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const INTAKE_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const OBJECT_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const OUTBOX_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const LEASE_TOKEN = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const CORRELATION_ID = "11111111-1111-4111-8111-111111111111";
const WAKE_NONCE = "22222222-2222-4222-8222-222222222222";
const RECEIPT_ID = "33333333-3333-4333-8333-333333333333";
const WAKE_SECRET = "ab".repeat(32);
const STORAGE_VERSION = "source-version-1";
const STORAGE_PATH =
  `restaurants/${RESTAURANT_ID}/uploads/2026/08/44444444-4444-4444-8444-444444444444.jpg`;
const BYTES = new Uint8Array(10 * 1024).fill(7);
const CONTENT_SHA256 = createHash("sha256").update(BYTES).digest("hex");

const [routeSource, migrationSource, hostingManifest] = await Promise.all([
  readFile(new URL(
    "../app/api/internal/momo/media/vault/route.ts",
    import.meta.url,
  ), "utf8"),
  readFile(new URL(
    "../supabase/migrations/20260815013053_momo_private_media_r2_vault_v1.sql",
    import.meta.url,
  ), "utf8"),
  readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
]);

function buffer(value) {
  return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
}

function bucketHarness() {
  const objects = new Map();
  const calls = { put: 0, get: 0, head: 0, options: null };
  const bucket = {
    async head(key) {
      calls.head += 1;
      return objects.get(key) ?? null;
    },
    async get(key) {
      calls.get += 1;
      const object = objects.get(key);
      return object
        ? { ...object, async arrayBuffer() { return buffer(object.bytes); } }
        : null;
    },
    async put(key, bytes, options) {
      calls.put += 1;
      calls.options = options;
      assert.equal(options.onlyIf.get("if-none-match"), "*");
      if (objects.has(key)) return null;
      const copy = new Uint8Array(bytes);
      const object = {
        key,
        version: `vault-version-${calls.put}`,
        etag: createHash("md5").update(copy).digest("hex"),
        size: copy.byteLength,
        httpMetadata: options.httpMetadata,
        customMetadata: options.customMetadata,
        checksums: { sha256: options.sha256 },
        bytes: copy,
      };
      objects.set(key, object);
      return object;
    },
  };
  return { bucket, calls, objects };
}

function archiveInput(overrides = {}) {
  return {
    restaurantId: RESTAURANT_ID,
    assetId: ASSET_ID,
    sourceStorageObjectId: OBJECT_ID,
    sourceStorageObjectVersion: STORAGE_VERSION,
    mimeType: "image/jpeg",
    contentSha256: CONTENT_SHA256,
    bytes: BYTES,
    ...overrides,
  };
}

test("R2 vault creates once, sends SHA-256, and re-hashes exact readback", async () => {
  const { bucket, calls } = bucketHarness();
  const first = await archiveVeroxaPrivateMediaOriginal(bucket, archiveInput());
  assert.equal(first.outcome, "created");
  assert.equal(first.fileSize, BYTES.byteLength);
  assert.equal(first.contentSha256, CONTENT_SHA256);
  assert.equal(calls.put, 1);
  assert.equal(Buffer.from(calls.options.sha256).toString("hex"), CONTENT_SHA256);
  assert.deepEqual(calls.options.customMetadata, {
    schemaVersion: "1",
    restaurantId: RESTAURANT_ID,
    contentSha256: CONTENT_SHA256,
    fileSize: String(BYTES.byteLength),
  });

  const replay = await archiveVeroxaPrivateMediaOriginal(bucket, archiveInput({
    assetId: "55555555-5555-4555-8555-555555555555",
    sourceStorageObjectId: "66666666-6666-4666-8666-666666666666",
    sourceStorageObjectVersion: "duplicate-source-version",
  }));
  assert.equal(replay.outcome, "already_verified");
  assert.equal(replay.vaultKey, first.vaultKey);
  assert.equal(calls.put, 1, "an existing content hash must never be overwritten");
});

test("R2 vault fails closed on conflicting metadata or readback bytes", async () => {
  const { bucket, objects } = bucketHarness();
  const original = await archiveVeroxaPrivateMediaOriginal(bucket, archiveInput());
  const stored = objects.get(original.vaultKey);
  stored.customMetadata.contentSha256 = "00".repeat(32);
  await assert.rejects(
    archiveVeroxaPrivateMediaOriginal(bucket, archiveInput()),
    (error) => error instanceof VeroxaMediaVaultError &&
      error.code === "media_vault_object_conflict" && !error.retryable,
  );
});

test("vault keys are tenant-scoped, content-addressed, and MIME-normalized", () => {
  assert.equal(veroxaMediaVaultKey(archiveInput()),
    `private-originals/v1/restaurants/${RESTAURANT_ID}/sha256/${CONTENT_SHA256}.jpg`);
  assert.equal(veroxaMediaVaultKey({
    restaurantId: RESTAURANT_ID,
    contentSha256: CONTENT_SHA256,
    mimeType: "image/png",
  }).endsWith(".png"), true);
});

function signedRequest({ signature, timestamp = Date.now().toString() } = {}) {
  const signed = signature ?? createHmac(
    "sha256",
    Buffer.from(WAKE_SECRET, "hex"),
  ).update(
    `${momoMediaVaultWakeContext}\n${timestamp}\n${WAKE_NONCE}\n` +
      momoMediaVaultWakeCanonicalBody,
  ).digest("hex");
  return new Request("https://veroxa.example/api/internal/momo/media/vault", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-veroxa-media-vault-timestamp-ms": timestamp,
      "x-veroxa-media-vault-nonce": WAKE_NONCE,
      "x-veroxa-media-vault-signature": signed,
    },
    body: momoMediaVaultWakeCanonicalBody,
  });
}

function routeHarness(options = {}) {
  const calls = { archive: [], complete: [], fail: [] };
  const dependencies = {
    configured: options.configured ?? true,
    wakeHmacSecret: WAKE_SECRET,
    randomUUID: () => LEASE_TOKEN,
    async claim() {
      return [{
        outbox_id: OUTBOX_ID,
        restaurant_id: RESTAURANT_ID,
        asset_id: ASSET_ID,
        intake_id: INTAKE_ID,
        storage_path: STORAGE_PATH,
        storage_object_id: OBJECT_ID,
        storage_object_version: STORAGE_VERSION,
        mime_type: "image/jpeg",
        file_size: BYTES.byteLength,
        content_sha256: CONTENT_SHA256,
        correlation_id: CORRELATION_ID,
        lease_token: LEASE_TOKEN,
        attempt_count: 1,
        external_write_allowed: false,
      }];
    },
    async download() {
      return new Blob([options.sourceBytes ?? BYTES], { type: "image/jpeg" });
    },
    async info() {
      return {
        id: OBJECT_ID,
        version: STORAGE_VERSION,
        name: STORAGE_PATH,
        bucketId: "restaurant-media",
        size: BYTES.byteLength,
        contentType: "image/jpeg",
      };
    },
    async archive(input) {
      calls.archive.push(input);
      if (options.archiveError) throw options.archiveError;
      return {
        vaultKey: veroxaMediaVaultKey(input),
        vaultVersion: "r2-version-1",
        vaultEtag: "0123456789abcdef0123456789abcdef",
        fileSize: input.bytes.byteLength,
        contentSha256: input.contentSha256,
        outcome: "created",
      };
    },
    async complete(input) {
      calls.complete.push(input);
      return [{
        outbox_id: OUTBOX_ID,
        asset_id: ASSET_ID,
        receipt_id: RECEIPT_ID,
        status: "verified",
        correlation_id: CORRELATION_ID,
        external_write_allowed: false,
      }];
    },
    async fail(input) {
      calls.fail.push(input);
      return [{
        outbox_id: OUTBOX_ID,
        asset_id: ASSET_ID,
        status: input.retryable ? "retry_wait" : "dead_letter",
        failure_code: input.failureCode,
        correlation_id: CORRELATION_ID,
        external_write_allowed: false,
      }];
    },
  };
  return {
    calls,
    handler: createMomoMediaVaultHandler(dependencies),
  };
}

test("signed vault worker preserves source bytes and records verified receipt", async () => {
  const { calls, handler } = routeHarness();
  const result = await handler(signedRequest());
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), {
    status: "verified",
    assetId: ASSET_ID,
    receiptId: RECEIPT_ID,
    vaultKey:
      `private-originals/v1/restaurants/${RESTAURANT_ID}/sha256/${CONTENT_SHA256}.jpg`,
    outcome: "created",
    externalWriteAllowed: false,
  });
  assert.equal(calls.archive.length, 1);
  assert.deepEqual(calls.archive[0].bytes, BYTES);
  assert.equal(calls.complete[0].verificationSnapshot.readbackHashVerified, true);
  assert.equal(calls.fail.length, 0);
});

test("vault worker rejects source hash drift before R2 and dead-letters it", async () => {
  const changed = new Uint8Array(BYTES);
  changed[0] ^= 0xff;
  const { calls, handler } = routeHarness({ sourceBytes: changed });
  const result = await handler(signedRequest());
  assert.equal(result.status, 200);
  assert.equal((await result.json()).error, "media_vault_source_hash_mismatch");
  assert.equal(calls.archive.length, 0);
  assert.equal(calls.fail[0].retryable, false);
});

test("vault worker schedules bounded retry for transient R2 failure", async () => {
  const { calls, handler } = routeHarness({
    archiveError: new VeroxaMediaVaultError("media_vault_write_unavailable", true),
  });
  const result = await handler(signedRequest());
  assert.equal(result.status, 503);
  assert.deepEqual(await result.json(), { error: "media_vault_retry_scheduled" });
  assert.equal(calls.fail[0].failureCode, "media_vault_write_unavailable");
  assert.equal(calls.fail[0].retryable, true);
});

test("vault wake is private and exact", async () => {
  const { handler } = routeHarness();
  assert.equal((await handler(signedRequest({ signature: "00".repeat(32) }))).status, 403);
  assert.equal((await handler(new Request(
    "https://veroxa.example/api/internal/momo/media/vault",
  ))).status, 405);
});

test("source contract wires R2 privately and gates only final Ready", () => {
  assert.deepEqual(JSON.parse(hostingManifest).r2, "BUCKET");
  assert.match(routeSource, /await import\("cloudflare:workers"\)/u);
  assert.match(routeSource, /createHandler\(env\.BUCKET\)/u);
  assert.doesNotMatch(routeSource, /NEXT_PUBLIC_[A-Z0-9_]*R2/u);
  assert.match(migrationSource,
    /create trigger veroxa_require_momo_media_vault_before_ready_v1[\s\S]*?before insert on public\.veroxa_momo_ready_packages_v2/u);
  assert.match(migrationSource,
    /AI generation\/validation can[\s\S]*?only Ready creation waits/u);
  assert.match(migrationSource,
    /state text not null default 'pending'[\s\S]*?'dead_letter'/u);
  assert.match(migrationSource,
    /provider_writes = false[\s\S]*?external_scheduling = false/u);
  assert.match(migrationSource,
    /grant execute on function[\s\S]*?veroxa_claim_momo_media_vault_v1[\s\S]*?to service_role/u);
  assert.doesNotMatch(migrationSource,
    /grant execute on function[\s\S]*?veroxa_claim_momo_media_vault_v1[\s\S]*?to authenticated/u);
});

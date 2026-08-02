import assert from "node:assert/strict";
import test from "node:test";
import { uploadMomoClientMediaWithDependencies } from "../app/momo-client-data.ts";
import { MomoMediaFinalizeRequestError } from "../app/momo-media-finalize-client.ts";

const RESTAURANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ASSET_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OBJECT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const VERIFICATION_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function jpg(size = 10 * 1024) {
  const value = new Blob([new Uint8Array(size)], { type: "image/jpeg" });
  Object.defineProperty(value, "name", { value: "momo.jpg" });
  return value;
}

function harness(overrides = {}) {
  const calls = { upload: [], remove: [], rpc: [], finalize: [] };
  const client = {
    storage: { from(bucket) { return {
      async upload(path, file, options) { calls.upload.push({ bucket, path, file, options }); return { error: null }; },
      async remove(paths) { calls.remove.push({ bucket, paths }); return { error: null }; },
    }; } },
    async rpc(name, parameters) {
      calls.rpc.push({ name, parameters });
      return { data: [{ asset_id: ASSET_ID, rights_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" }], error: null };
    },
    ...overrides.client,
  };
  const finalize = overrides.finalize ?? (async (input) => {
    calls.finalize.push(input);
    return { verificationId: VERIFICATION_ID, status: "verified", canonicalAssetId: ASSET_ID, duplicateAssetId: null, externalWriteAllowed: false };
  });
  return {
    calls,
    dependencies: {
      client,
      finalize,
      now: () => new Date("2026-08-02T12:00:00.000Z"),
      randomUuid: () => OBJECT_ID,
    },
  };
}

test("real client upload registers the stored JPG, parses asset_id, then finalizes it", async () => {
  const { calls, dependencies } = harness();
  const result = await uploadMomoClientMediaWithDependencies({
    restaurantId: RESTAURANT_ID,
    file: jpg(),
    usageScope: ["instagram", "instagram", "facebook"],
  }, dependencies);
  assert.equal(result.status, "verified");
  assert.equal(result.assetId, ASSET_ID);
  assert.match(result.storagePath, /\/uploads\/2026\/08\/cccccccc-cccc-4ccc-8ccc-cccccccccccc\.jpg$/u);
  assert.equal(calls.upload.length, 1);
  assert.equal(calls.rpc[0].name, "veroxa_register_momo_media_v2");
  assert.deepEqual(calls.rpc[0].parameters.p_usage_scope, ["instagram", "facebook"]);
  assert.deepEqual(calls.finalize[0], { restaurantId: RESTAURANT_ID, assetId: ASSET_ID, storagePath: result.storagePath });
  assert.equal(calls.remove.length, 0);
});

test("registered originals remain saved and retryable when finalization needs attention", async () => {
  const { calls, dependencies } = harness({ finalize: async () => { throw new MomoMediaFinalizeRequestError("media_not_platform_ready", 422); } });
  const result = await uploadMomoClientMediaWithDependencies({
    restaurantId: RESTAURANT_ID,
    file: jpg(),
    usageScope: ["instagram"],
  }, dependencies);
  assert.deepEqual(result, {
    status: "uploaded_but_needs_attention",
    assetId: ASSET_ID,
    storagePath: calls.upload[0].path,
    errorCode: "media_not_platform_ready",
    externalWriteAllowed: false,
  });
  assert.equal(calls.remove.length, 0, "a registered original must never be deleted after finalize failure");
});

test("registration rollback removes only the new unregistered object", async () => {
  const calls = { upload: [], remove: [] };
  const client = {
    storage: { from(bucket) { return {
      async upload(path) { calls.upload.push({ bucket, path }); return { error: null }; },
      async remove(paths) { calls.remove.push({ bucket, paths }); return { error: null }; },
    }; } },
    async rpc() { return { data: null, error: new Error("rejected") }; },
  };
  await assert.rejects(() => uploadMomoClientMediaWithDependencies({
    restaurantId: RESTAURANT_ID,
    file: jpg(),
    usageScope: ["instagram"],
  }, { client, now: () => new Date("2026-08-02T12:00:00.000Z"), randomUuid: () => OBJECT_ID }), /media_registration_failed/u);
  assert.deepEqual(calls.remove, [{ bucket: "restaurant-media", paths: [calls.upload[0].path] }]);
});

test("client acceptance rejects non-JPG and out-of-envelope files before storage", async () => {
  const { calls, dependencies } = harness();
  const png = new Blob([new Uint8Array(10 * 1024)], { type: "image/png" });
  Object.defineProperty(png, "name", { value: "momo.png" });
  await assert.rejects(() => uploadMomoClientMediaWithDependencies({ restaurantId: RESTAURANT_ID, file: png, usageScope: ["instagram"] }, dependencies), /invalid_media_type/u);
  await assert.rejects(() => uploadMomoClientMediaWithDependencies({ restaurantId: RESTAURANT_ID, file: jpg(10 * 1024 - 1), usageScope: ["instagram"] }, dependencies), /invalid_media_size/u);
  assert.equal(calls.upload.length, 0);
});

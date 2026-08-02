import assert from "node:assert/strict";
import test from "node:test";
import {
  finalizeMomoMediaUpload,
  MomoMediaFinalizeRequestError,
} from "../app/momo-media-finalize-client.ts";

const RESTAURANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ASSET_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const CANONICAL_ASSET_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const VERIFICATION_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const STORAGE_PATH = `restaurants/${RESTAURANT_ID}/uploads/2026/08/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee.jpg`;

test("shared client finalizer posts one bounded same-origin request and accepts verified evidence", async () => {
  const calls = [];
  const result = await finalizeMomoMediaUpload({ restaurantId: RESTAURANT_ID, assetId: ASSET_ID, storagePath: STORAGE_PATH }, async (url, init) => {
    calls.push({ url, init });
    return Response.json({
      verificationId: VERIFICATION_ID,
      status: "verified",
      canonicalAssetId: ASSET_ID,
      duplicateAssetId: null,
      externalWriteAllowed: false,
    });
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/media/finalize");
  assert.equal(calls[0].init.credentials, "same-origin");
  assert.equal(calls[0].init.cache, "no-store");
  assert.deepEqual(JSON.parse(calls[0].init.body), { restaurantId: RESTAURANT_ID, assetId: ASSET_ID, storagePath: STORAGE_PATH });
  assert.equal(result.status, "verified");
  assert.equal(result.externalWriteAllowed, false);
});

test("shared client finalizer preserves the authoritative canonical identity for a duplicate", async () => {
  const result = await finalizeMomoMediaUpload({ restaurantId: RESTAURANT_ID, assetId: ASSET_ID, storagePath: STORAGE_PATH }, async () => Response.json({
    verificationId: VERIFICATION_ID,
    status: "duplicate",
    canonicalAssetId: CANONICAL_ASSET_ID,
    duplicateAssetId: ASSET_ID,
    externalWriteAllowed: false,
  }));
  assert.equal(result.status, "duplicate");
  assert.equal(result.canonicalAssetId, CANONICAL_ASSET_ID);
  assert.equal(result.duplicateAssetId, ASSET_ID);
});

test("shared client finalizer exposes controlled failure codes and rejects malformed success", async () => {
  await assert.rejects(
    () => finalizeMomoMediaUpload({ restaurantId: RESTAURANT_ID, assetId: ASSET_ID, storagePath: STORAGE_PATH }, async () => Response.json({ error: "media_not_platform_ready" }, { status: 422 })),
    (error) => error instanceof MomoMediaFinalizeRequestError && error.code === "media_not_platform_ready" && error.status === 422,
  );
  await assert.rejects(
    () => finalizeMomoMediaUpload({ restaurantId: RESTAURANT_ID, assetId: ASSET_ID, storagePath: STORAGE_PATH }, async () => Response.json({ status: "verified" })),
    (error) => error instanceof MomoMediaFinalizeRequestError && error.code === "media_verification_unavailable",
  );
});

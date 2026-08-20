import assert from "node:assert/strict";
import test from "node:test";
import {
  finalizeMomoMediaUpload,
  finalizeMomoMediaUploadSession,
  MomoMediaFinalizeRequestError,
} from "../app/momo-media-finalize-client.ts";

const RESTAURANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ASSET_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const CANONICAL_ASSET_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const VERIFICATION_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const ATTEMPT_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const UPLOAD_SESSION_ID = "11111111-1111-4111-8111-111111111111";
const RIGHTS_ID = "22222222-2222-4222-8222-222222222222";
const IDEMPOTENCY_KEY = "33333333-3333-4333-8333-333333333333";
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
  assert.match(
    calls[0].init.headers["x-veroxa-correlation-id"],
    /^[0-9a-f-]{36}$/u,
  );
  assert.deepEqual(JSON.parse(calls[0].init.body), { restaurantId: RESTAURANT_ID, assetId: ASSET_ID, storagePath: STORAGE_PATH });
  assert.equal(result.status, "verified");
  assert.equal(result.externalWriteAllowed, false);
});

test("shared client accepts Team ownership only from a matching durable receipt", async () => {
  await assert.rejects(
    () => finalizeMomoMediaUpload({
      restaurantId: RESTAURANT_ID,
      assetId: ASSET_ID,
      storagePath: STORAGE_PATH,
    }, async (_url, init) => {
      const correlationId = init.headers["x-veroxa-correlation-id"];
      return Response.json({
        error: "media_verification_unavailable",
        receipt: {
          status: "team_exception_recorded",
          attemptId: ATTEMPT_ID,
          recoveryOwner: "veroxa_team",
          clientActionRequired: false,
          correlationId,
          durableCorrelationId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        },
        externalWriteAllowed: false,
      }, {
        status: 503,
        headers: { "x-veroxa-correlation-id": correlationId },
      });
    }),
    (error) => error instanceof MomoMediaFinalizeRequestError &&
      error.receipt?.status === "team_exception_recorded" &&
      error.receipt.attemptId === ATTEMPT_ID &&
      error.correlationId === error.receipt.correlationId,
  );

  await assert.rejects(
    () => finalizeMomoMediaUpload({
      restaurantId: RESTAURANT_ID,
      assetId: ASSET_ID,
      storagePath: STORAGE_PATH,
    }, async (_url, init) => Response.json({
      error: "media_verification_unavailable",
      receipt: {
        status: "team_exception_recorded",
        attemptId: ATTEMPT_ID,
        recoveryOwner: "veroxa_team",
        clientActionRequired: false,
        correlationId: init.headers["x-veroxa-correlation-id"],
        durableCorrelationId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      },
      externalWriteAllowed: false,
    }, { status: 503 })),
    (error) => error instanceof MomoMediaFinalizeRequestError &&
      error.receipt === null && error.correlationId === null,
  );
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

test("session finalizer accepts registration identities only from the server response", async () => {
  const calls = [];
  const result = await finalizeMomoMediaUploadSession({
    restaurantId: RESTAURANT_ID,
    uploadSessionId: UPLOAD_SESSION_ID,
    clientIdempotencyKey: IDEMPOTENCY_KEY,
    storagePath: STORAGE_PATH,
  }, async (url, init) => {
    calls.push({ url, init });
    return Response.json({
      verificationId: VERIFICATION_ID,
      status: "verified",
      canonicalAssetId: ASSET_ID,
      duplicateAssetId: null,
      uploadSessionId: UPLOAD_SESSION_ID,
      assetId: ASSET_ID,
      rightsId: RIGHTS_ID,
      externalWriteAllowed: false,
    });
  });
  assert.equal(result.assetId, ASSET_ID);
  assert.equal(result.rightsId, RIGHTS_ID);
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    restaurantId: RESTAURANT_ID,
    uploadSessionId: UPLOAD_SESSION_ID,
    clientIdempotencyKey: IDEMPOTENCY_KEY,
    storagePath: STORAGE_PATH,
  });

  await assert.rejects(
    () => finalizeMomoMediaUploadSession({
      restaurantId: RESTAURANT_ID,
      uploadSessionId: UPLOAD_SESSION_ID,
      clientIdempotencyKey: IDEMPOTENCY_KEY,
      storagePath: STORAGE_PATH,
    }, async () => Response.json({
      verificationId: VERIFICATION_ID,
      status: "verified",
      canonicalAssetId: ASSET_ID,
      duplicateAssetId: null,
      uploadSessionId: "44444444-4444-4444-8444-444444444444",
      assetId: ASSET_ID,
      rightsId: RIGHTS_ID,
      externalWriteAllowed: false,
    })),
    (error) => error instanceof MomoMediaFinalizeRequestError &&
      error.code === "media_verification_unavailable",
  );
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

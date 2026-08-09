import assert from "node:assert/strict";
import test from "node:test";
import { uploadMomoClientMediaWithDependencies } from "../app/momo-client-data.ts";
import { MomoMediaFinalizeRequestError } from "../app/momo-media-finalize-client.ts";

const RESTAURANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ASSET_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OBJECT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const VERIFICATION_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function image(type = "image/jpeg", size = 10 * 1024) {
  const value = new Blob([new Uint8Array(size)], { type });
  const extension = type === "image/png" ? "png" : "jpg";
  Object.defineProperty(value, "name", { value: `food.${extension}` });
  return value;
}

function harness(overrides = {}) {
  const calls = { upload: [], remove: [], rpc: [], finalize: [], assess: [], association: [] };
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
  const assess = overrides.assess ?? (async (input) => {
    calls.assess.push(input);
    return {
      assessmentId: "99999999-9999-4999-8999-999999999999",
      status: "completed",
      assessment: {
        schemaVersion: "veroxa-private-media-assessment-v1",
        subject: "food",
        visualSummary: "Visible: food arranged on a plate in a close view.",
        qualityScore: 4,
        qualityIssues: ["none"],
        tags: [{ slug: "food-visible", label: "Food visible", evidenceClass: "objective", category: "scene", confidence: 0.99, uncertainty: null }],
        uncertainties: ["Dish identity and restaurant association are not confirmed by pixels."],
      },
      reused: false,
      reusedFromAssessmentId: null,
      sourceContentSha256: "1".repeat(64),
      externalWriteAllowed: false,
    };
  });
  const recordAssociation = overrides.recordAssociation ?? (async (input) => {
    calls.association.push(input);
    return {
      associationId: "88888888-8888-4888-8888-888888888888",
      assetId: input.assetId,
      association: input.association,
      associationEvidenceClass: "development_proxy",
      recordedAt: "2026-08-02T12:00:00.000Z",
      externalWriteAllowed: false,
    };
  });
  return {
    calls,
    dependencies: {
      client,
      finalize,
      assess,
      recordAssociation,
      now: () => new Date("2026-08-02T12:00:00.000Z"),
      randomUuid: () => OBJECT_ID,
    },
  };
}

test("real client upload registers the stored JPG, parses asset_id, then finalizes it", async () => {
  const { calls, dependencies } = harness();
  const result = await uploadMomoClientMediaWithDependencies({
    restaurantId: RESTAURANT_ID,
    file: image(),
    usageScope: ["instagram", "instagram", "facebook"],
    restaurantAssociation: "not_for_restaurant",
  }, dependencies);
  assert.equal(result.status, "verified");
  assert.equal(result.assetId, ASSET_ID);
  assert.match(result.storagePath, /\/uploads\/2026\/08\/cccccccc-cccc-4ccc-8ccc-cccccccccccc\.jpg$/u);
  assert.equal(calls.upload.length, 1);
  assert.equal(calls.rpc[0].name, "veroxa_register_momo_media_v3");
  assert.deepEqual(calls.rpc[0].parameters.p_usage_scope, ["instagram", "facebook"]);
  assert.equal(calls.rpc[0].parameters.p_requested_association, "not_for_restaurant");
  assert.equal(calls.rpc[0].parameters.p_association_note, null);
  assert.equal(Object.hasOwn(calls.rpc[0].parameters, "p_intake_notes"), false,
    "the database must create the versioned durable instruction itself");
  assert.deepEqual(calls.finalize[0], { restaurantId: RESTAURANT_ID, assetId: ASSET_ID, storagePath: result.storagePath });
  assert.equal(calls.assess.length, 1);
  assert.equal(calls.association.length, 1);
  assert.equal(calls.association[0].rightsId, "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee");
  assert.equal(calls.remove.length, 0);
});

test("Team assessment-only upload uses its narrow registration RPC and never writes an association", async () => {
  const { calls, dependencies } = harness();
  const result = await uploadMomoClientMediaWithDependencies({
    restaurantId: RESTAURANT_ID,
    file: image("image/png"),
    usageScope: ["internal"],
    restaurantAssociation: "not_for_restaurant",
  }, {
    ...dependencies,
    registrationRpc: "veroxa_register_team_private_media_v1",
    skipAssociation: true,
  });
  assert.equal(result.status, "verified");
  assert.equal(calls.rpc[0].name, "veroxa_register_team_private_media_v1");
  assert.deepEqual(calls.rpc[0].parameters.p_usage_scope, ["internal"]);
  assert.equal(calls.assess.length, 1);
  assert.equal(calls.association.length, 0);
  assert.equal(result.associationRecorded, false);
  assert.equal(result.assessment?.assessment.tags[0].label, "Food visible");
});

test("Team assessment registration rejects every external preparation scope", async () => {
  for (const usageScope of [["instagram"], ["facebook"], ["google_business"], ["internal", "instagram"]]) {
    const { dependencies } = harness();
    await assert.rejects(uploadMomoClientMediaWithDependencies({
      restaurantId: RESTAURANT_ID,
      file: image("image/png"),
      usageScope,
      restaurantAssociation: "not_for_restaurant",
    }, {
      ...dependencies,
      registrationRpc: "veroxa_register_team_private_media_v1",
      skipAssociation: true,
    }), /invalid_media_scope/u);
  }
});

test("registered originals remain saved and retryable when finalization needs attention", async () => {
  const { calls, dependencies } = harness({ finalize: async () => { throw new MomoMediaFinalizeRequestError("media_not_platform_ready", 422); } });
  const result = await uploadMomoClientMediaWithDependencies({
    restaurantId: RESTAURANT_ID,
    file: image(),
    usageScope: ["instagram"],
    restaurantAssociation: "not_for_restaurant",
  }, dependencies);
  assert.deepEqual(result, {
    status: "uploaded_but_needs_attention",
    assetId: ASSET_ID,
    storagePath: calls.upload[0].path,
    errorCode: "media_not_platform_ready",
    externalWriteAllowed: false,
    rightsId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  });
  assert.equal(calls.remove.length, 0, "a registered original must never be deleted after finalize failure");
  assert.equal(calls.rpc[0].name, "veroxa_register_momo_media_v3");
  assert.equal(calls.rpc[0].parameters.p_requested_association, "not_for_restaurant",
    "the upload instruction must be registered before finalization starts");
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
    file: image(),
    usageScope: ["instagram"],
    restaurantAssociation: "not_for_restaurant",
  }, { client, now: () => new Date("2026-08-02T12:00:00.000Z"), randomUuid: () => OBJECT_ID }), /media_registration_failed/u);
  assert.deepEqual(calls.remove, [{ bucket: "restaurant-media", paths: [calls.upload[0].path] }]);
});

test("client acceptance supports JPEG and PNG while rejecting WebP, HEIC, and out-of-envelope files", async () => {
  const { calls, dependencies } = harness();
  const result = await uploadMomoClientMediaWithDependencies({ restaurantId: RESTAURANT_ID, file: image("image/png"), usageScope: ["instagram"], restaurantAssociation: "not_for_restaurant" }, dependencies);
  assert.match(result.storagePath, /\.png$/u);
  const beforeRejects = calls.upload.length;
  await assert.rejects(() => uploadMomoClientMediaWithDependencies({ restaurantId: RESTAURANT_ID, file: image("image/webp"), usageScope: ["instagram"], restaurantAssociation: "not_for_restaurant" }, dependencies), /invalid_media_type/u);
  await assert.rejects(() => uploadMomoClientMediaWithDependencies({ restaurantId: RESTAURANT_ID, file: image("image/heic"), usageScope: ["instagram"], restaurantAssociation: "not_for_restaurant" }, dependencies), /invalid_media_type/u);
  await assert.rejects(() => uploadMomoClientMediaWithDependencies({ restaurantId: RESTAURANT_ID, file: image("image/jpeg", 10 * 1024 - 1), usageScope: ["instagram"], restaurantAssociation: "not_for_restaurant" }, dependencies), /invalid_media_size/u);
  assert.equal(calls.upload.length, beforeRejects);
});

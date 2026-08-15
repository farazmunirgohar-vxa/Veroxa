import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { uploadMomoClientMediaWithDependencies } from "../app/momo-client-data.ts";
import { MomoMediaFinalizeRequestError } from "../app/momo-media-finalize-client.ts";

const RESTAURANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ASSET_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OBJECT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const VERIFICATION_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const RIGHTS_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const SESSION_PATH_PREFIX =
  `restaurants/${RESTAURANT_ID}/uploads/2026/08/${OBJECT_ID}`;
const portalSource = await readFile(new URL(
  "../app/momo-client-portal.tsx",
  import.meta.url,
), "utf8");

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
      async upload(path, file, options) {
        calls.upload.push({ bucket, path, file, options });
        if (overrides.upload) return overrides.upload(path, file, options);
        return { error: null };
      },
      async remove(paths) { calls.remove.push({ bucket, paths }); return { error: null }; },
    }; } },
    async rpc(name, parameters) {
      calls.rpc.push({ name, parameters });
      if (overrides.rpc) return overrides.rpc(name, parameters);
      if (name === "veroxa_begin_media_upload_v1") {
        const extension = parameters.p_mime_type === "image/png" ? "png" : "jpg";
        return { data: [{
          upload_session_id: OBJECT_ID,
          storage_path: `${SESSION_PATH_PREFIX}.${extension}`,
          session_status: "initiated",
          asset_id: null,
          rights_id: null,
          original_sha256: "1".repeat(64),
          external_write_allowed: false,
        }], error: null };
      }
      if (name === "veroxa_commit_media_upload_v1") {
        const begin = calls.rpc.find((call) =>
          call.name === "veroxa_begin_media_upload_v1"
        );
        const extension = begin?.parameters.p_mime_type === "image/png"
          ? "png"
          : "jpg";
        return { data: [{
          upload_session_id: OBJECT_ID,
          storage_path: `${SESSION_PATH_PREFIX}.${extension}`,
          session_status: "registered",
          asset_id: ASSET_ID,
          rights_id: RIGHTS_ID,
          original_sha256: "1".repeat(64),
          external_write_allowed: false,
        }], error: null };
      }
      return { data: [{ asset_id: ASSET_ID, rights_id: RIGHTS_ID }], error: null };
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
      sha256: async () => "1".repeat(64),
      now: () => new Date("2026-08-02T12:00:00.000Z"),
      randomUuid: () => OBJECT_ID,
    },
  };
}

test("real client upload registers the stored JPG, parses asset_id, then finalizes it", async () => {
  const { calls, dependencies } = harness();
  await assert.rejects(uploadMomoClientMediaWithDependencies({
    restaurantId: RESTAURANT_ID,
    file: image(),
    usageScope: ["instagram", "facebook"],
    restaurantAssociation: "not_for_restaurant",
    rightsAttested: false,
  }, dependencies), /media_rights_attestation_required/u);
  assert.equal(calls.upload.length, 0, "missing owner attestation must fail before storage");
  const result = await uploadMomoClientMediaWithDependencies({
    restaurantId: RESTAURANT_ID,
    file: image(),
    usageScope: ["instagram", "instagram", "facebook"],
    restaurantAssociation: "not_for_restaurant",
    rightsAttested: true,
  }, dependencies);
  assert.equal(result.status, "verified");
  assert.equal(result.assetId, ASSET_ID);
  assert.match(result.storagePath, /\/uploads\/2026\/08\/cccccccc-cccc-4ccc-8ccc-cccccccccccc\.jpg$/u);
  assert.equal(calls.upload.length, 1);
  assert.equal(calls.rpc[0].name, "veroxa_begin_media_upload_v1");
  assert.equal(calls.rpc[1].name, "veroxa_commit_media_upload_v1");
  assert.deepEqual(calls.rpc[0].parameters.p_usage_scope, ["instagram", "facebook"]);
  assert.equal(calls.rpc[0].parameters.p_original_sha256, "1".repeat(64));
  assert.equal(calls.rpc[0].parameters.p_requested_association, "not_for_restaurant");
  assert.equal(calls.rpc[0].parameters.p_association_note, null);
  assert.equal(Object.hasOwn(calls.rpc[0].parameters, "p_intake_notes"), false,
    "the database must create the versioned durable instruction itself");
  assert.deepEqual(calls.finalize[0], { restaurantId: RESTAURANT_ID, assetId: ASSET_ID, storagePath: result.storagePath });
  assert.equal(calls.assess.length, 1);
  assert.equal(calls.association.length, 1);
  assert.equal(calls.association[0].rightsId, RIGHTS_ID);
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
    rightsAttested: true,
  }, dependencies);
  assert.deepEqual(result, {
    status: "uploaded_but_needs_attention",
    assetId: ASSET_ID,
    storagePath: calls.upload[0].path,
    errorCode: "media_not_platform_ready",
    failureReceipt: null,
    externalWriteAllowed: false,
    rightsId: RIGHTS_ID,
  });
  assert.equal(calls.remove.length, 0, "a registered original must never be deleted after finalize failure");
  assert.equal(calls.rpc[0].name, "veroxa_begin_media_upload_v1");
  assert.equal(calls.rpc[0].parameters.p_requested_association, "not_for_restaurant",
    "the upload instruction must be registered before finalization starts");
});

test("a durable finalize exception receipt survives the upload handoff", async () => {
  const receipt = {
    status: "team_exception_recorded",
    attemptId: "77777777-7777-4777-8777-777777777777",
    recoveryOwner: "veroxa_team",
    clientActionRequired: false,
    correlationId: "66666666-6666-4666-8666-666666666666",
    durableCorrelationId: "55555555-5555-4555-8555-555555555555",
  };
  const { calls, dependencies } = harness({
    finalize: async () => {
      throw new MomoMediaFinalizeRequestError(
        "media_verification_unavailable",
        503,
        receipt,
        receipt.correlationId,
      );
    },
  });
  const result = await uploadMomoClientMediaWithDependencies({
    restaurantId: RESTAURANT_ID,
    file: image(),
    usageScope: ["instagram"],
    restaurantAssociation: "not_for_restaurant",
    rightsAttested: true,
  }, dependencies);
  assert.equal(result.status, "uploaded_but_needs_attention");
  assert.deepEqual(result.failureReceipt, receipt);
  assert.equal(calls.remove.length, 0);
});

test("immediate upload copy claims Team ownership only for a durable receipt", () => {
  const messageFunction = portalSource.slice(
    portalSource.indexOf("function mediaUploadAttentionMessage"),
    portalSource.indexOf("\n}\n\nfunction Media", portalSource.indexOf(
      "function mediaUploadAttentionMessage",
    )),
  );
  assert.match(
    messageFunction,
    /failureReceipt\?\.status === "team_exception_recorded"[\s\S]*?Team Faraz owns the next step/u,
  );
  assert.match(
    messageFunction,
    /: " Your upload is saved and queued for private recovery\./u,
  );
});

test("a failed session commit retains the private object for idempotent replay", async () => {
  const calls = { upload: [], remove: [] };
  const client = {
    storage: { from(bucket) { return {
      async upload(path) { calls.upload.push({ bucket, path }); return { error: null }; },
      async remove(paths) { calls.remove.push({ bucket, paths }); return { error: null }; },
    }; } },
    async rpc(name) {
      if (name === "veroxa_begin_media_upload_v1") return { data: [{
        upload_session_id: OBJECT_ID,
        storage_path: `${SESSION_PATH_PREFIX}.jpg`,
        session_status: "initiated",
        asset_id: null,
        rights_id: null,
        original_sha256: "1".repeat(64),
        external_write_allowed: false,
      }], error: null };
      return { data: null, error: new Error("rejected") };
    },
  };
  await assert.rejects(() => uploadMomoClientMediaWithDependencies({
    restaurantId: RESTAURANT_ID,
    file: image(),
    usageScope: ["instagram"],
    restaurantAssociation: "not_for_restaurant",
    rightsAttested: true,
  }, {
    client,
    sha256: async () => "1".repeat(64),
    randomUuid: () => OBJECT_ID,
  }), /media_registration_failed/u);
  assert.equal(calls.upload.length, 1);
  assert.deepEqual(calls.remove, []);
});

test("an already registered replay skips object creation and reuses the same IDs", async () => {
  const { calls, dependencies } = harness({
    rpc: async () => ({ data: [{
      upload_session_id: OBJECT_ID,
      storage_path: `${SESSION_PATH_PREFIX}.jpg`,
      session_status: "registered",
      asset_id: ASSET_ID,
      rights_id: RIGHTS_ID,
      original_sha256: "1".repeat(64),
      external_write_allowed: false,
    }], error: null }),
  });
  const result = await uploadMomoClientMediaWithDependencies({
    restaurantId: RESTAURANT_ID,
    file: image(),
    usageScope: ["instagram"],
    restaurantAssociation: "not_for_restaurant",
    rightsAttested: true,
    clientIdempotencyKey: OBJECT_ID,
  }, dependencies);
  assert.equal(result.assetId, ASSET_ID);
  assert.equal(calls.upload.length, 0);
  assert.deepEqual(calls.rpc.map((call) => call.name), [
    "veroxa_begin_media_upload_v1",
    "veroxa_commit_media_upload_v1",
  ]);
});

test("an initiated replay can commit an already-present reserved object", async () => {
  const { calls, dependencies } = harness({
    upload: async () => ({ error: new Error("object already exists") }),
  });
  const result = await uploadMomoClientMediaWithDependencies({
    restaurantId: RESTAURANT_ID,
    file: image(),
    usageScope: ["instagram"],
    restaurantAssociation: "not_for_restaurant",
    rightsAttested: true,
  }, dependencies);
  assert.equal(result.status, "verified");
  assert.equal(result.assetId, ASSET_ID);
  assert.equal(calls.upload.length, 1);
  assert.equal(calls.rpc[1].name, "veroxa_commit_media_upload_v1");
});

test("upload-session responses fail closed when the expected SHA is confused", async () => {
  const { calls, dependencies } = harness({
    rpc: async (name) => {
      if (name !== "veroxa_begin_media_upload_v1") {
        throw new Error("unexpected commit");
      }
      return { data: [{
        upload_session_id: OBJECT_ID,
        storage_path: `${SESSION_PATH_PREFIX}.jpg`,
        session_status: "initiated",
        asset_id: null,
        rights_id: null,
        original_sha256: "2".repeat(64),
        external_write_allowed: false,
      }], error: null };
    },
  });
  await assert.rejects(() => uploadMomoClientMediaWithDependencies({
    restaurantId: RESTAURANT_ID,
    file: image(),
    usageScope: ["instagram"],
    restaurantAssociation: "not_for_restaurant",
    rightsAttested: true,
  }, dependencies), /media_upload_session_response_invalid/u);
  assert.equal(calls.upload.length, 0);
  assert.equal(calls.rpc.length, 1);
});

test("client acceptance supports JPEG and PNG while rejecting WebP, HEIC, and out-of-envelope files", async () => {
  const { calls, dependencies } = harness();
  const result = await uploadMomoClientMediaWithDependencies({ restaurantId: RESTAURANT_ID, file: image("image/png"), usageScope: ["instagram"], restaurantAssociation: "not_for_restaurant", rightsAttested: true }, dependencies);
  assert.match(result.storagePath, /\.png$/u);
  const beforeRejects = calls.upload.length;
  await assert.rejects(() => uploadMomoClientMediaWithDependencies({ restaurantId: RESTAURANT_ID, file: image("image/webp"), usageScope: ["instagram"], restaurantAssociation: "not_for_restaurant", rightsAttested: true }, dependencies), /invalid_media_type/u);
  await assert.rejects(() => uploadMomoClientMediaWithDependencies({ restaurantId: RESTAURANT_ID, file: image("image/heic"), usageScope: ["instagram"], restaurantAssociation: "not_for_restaurant", rightsAttested: true }, dependencies), /invalid_media_type/u);
  await assert.rejects(() => uploadMomoClientMediaWithDependencies({ restaurantId: RESTAURANT_ID, file: image("image/jpeg", 10 * 1024 - 1), usageScope: ["instagram"], restaurantAssociation: "not_for_restaurant", rightsAttested: true }, dependencies), /invalid_media_size/u);
  assert.equal(calls.upload.length, beforeRejects);
});

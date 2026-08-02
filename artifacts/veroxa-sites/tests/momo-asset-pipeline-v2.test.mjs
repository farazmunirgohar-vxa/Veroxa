import assert from "node:assert/strict";
import test from "node:test";
import { resolveMomoAssetPipeline } from "../app/momo-operating-gates.ts";

const HASH = "a".repeat(64);
const CANONICAL = "00000000-0000-4000-8000-000000000001";
const PROCESSING = "00000000-0000-4000-8000-000000000002";
const IDENTITY = "00000000-0000-4000-8000-000000000003";
const CANONICAL_VERIFICATION = "00000000-0000-4000-8000-000000000004";
const PROCESSING_VERIFICATION = "00000000-0000-4000-8000-000000000005";
const CANONICAL_RIGHTS = "00000000-0000-4000-8000-000000000006";
const PROCESSING_RIGHTS = "00000000-0000-4000-8000-000000000007";
const RUN = "00000000-0000-4000-8000-000000000008";

const fixture = (status = "pending_review") => ({
  media: [CANONICAL, PROCESSING].map((id) => ({
    id,
    content_sha256: HASH,
  })),
  mediaIntake: [{
    id: CANONICAL_VERIFICATION,
    asset_id: CANONICAL,
    status: "verified",
    content_sha256: HASH,
  }, {
    id: PROCESSING_VERIFICATION,
    asset_id: PROCESSING,
    status: "verified",
    content_sha256: HASH,
  }],
  mediaIdentityLinksV2: [{
    identity_id: IDENTITY,
    asset_id: CANONICAL,
    verification_id: CANONICAL_VERIFICATION,
    canonical_asset_id: CANONICAL,
    link_kind: "canonical",
    content_sha256: HASH,
    rights_id: CANONICAL_RIGHTS,
    rights_attestation_sha256: "b".repeat(64),
  }, {
    identity_id: IDENTITY,
    asset_id: PROCESSING,
    verification_id: PROCESSING_VERIFICATION,
    canonical_asset_id: CANONICAL,
    link_kind: "exact_duplicate",
    content_sha256: HASH,
    rights_id: PROCESSING_RIGHTS,
    rights_attestation_sha256: "c".repeat(64),
  }],
  contentAiRuns: [{
    id: RUN,
    decision_mode: "automation_policy_v2",
    automation_identity_id: IDENTITY,
    source_asset_id: PROCESSING,
    intake_verification_id: PROCESSING_VERIFICATION,
    rights_id: PROCESSING_RIGHTS,
    rights_attestation_sha256: "c".repeat(64),
    source_content_sha256: HASH,
    provider_error_code: null,
    status,
  }],
  exceptionIncidentsV2: [],
  veroxaReadyPackagesV2: [],
});

test("v2 pending_review means automatic finalization, never Team review", () => {
  const data = fixture();
  assert.equal(resolveMomoAssetPipeline(data, CANONICAL).state, "preparing_content");
  assert.equal(resolveMomoAssetPipeline(data, PROCESSING).state, "preparing_content");
});

test("canonical and duplicate cards share Ready while naming the concrete rights-bearing source", () => {
  const data = fixture();
  data.veroxaReadyPackagesV2.push({
    id: "00000000-0000-4000-8000-000000000009",
    identity_id: IDENTITY,
    content_ai_run_id: RUN,
    canonical_asset_id: CANONICAL,
    source_asset_id: PROCESSING,
    intake_verification_id: PROCESSING_VERIFICATION,
    rights_id: PROCESSING_RIGHTS,
    rights_attestation_sha256: "c".repeat(64),
    source_content_sha256: HASH,
    status: "veroxa_ready",
    external_write_allowed: false,
  });
  assert.equal(resolveMomoAssetPipeline(data, CANONICAL).state, "veroxa_ready");
  assert.equal(resolveMomoAssetPipeline(data, PROCESSING).state, "veroxa_ready");
});

test("v2 UI fails closed when Ready points at a different source or an incident is open", () => {
  const incoherent = fixture();
  incoherent.veroxaReadyPackagesV2.push({
    id: "00000000-0000-4000-8000-000000000009",
    identity_id: IDENTITY,
    content_ai_run_id: RUN,
    canonical_asset_id: CANONICAL,
    source_asset_id: CANONICAL,
    intake_verification_id: PROCESSING_VERIFICATION,
    rights_id: PROCESSING_RIGHTS,
    rights_attestation_sha256: "c".repeat(64),
    source_content_sha256: HASH,
    status: "veroxa_ready",
    external_write_allowed: false,
  });
  assert.equal(resolveMomoAssetPipeline(incoherent, CANONICAL).state, "blocked");

  const incident = fixture();
  incident.exceptionIncidentsV2.push({
    canonical_asset_id: CANONICAL,
    status: "open",
    blockers: ["claim_validation_failed"],
  });
  const resolution = resolveMomoAssetPipeline(incident, PROCESSING);
  assert.equal(resolution.state, "blocked");
  assert.deepEqual(resolution.blockers, ["claim_validation_failed"]);
});

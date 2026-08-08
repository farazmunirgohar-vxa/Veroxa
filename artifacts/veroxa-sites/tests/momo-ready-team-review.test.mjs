import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  momoReadyReviewAllowsManualExport,
  momoReadyReviewCanApprove,
  momoReadyReviewCanDiscard,
  parseMomoReadyReviewDecisionV2,
  parseMomoReadyReviewStatusV2,
} from "../app/momo-data.ts";
import {
  MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION,
  MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION_SHA256,
  MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION_VERSION,
} from "../app/momo-content-ai-contract.ts";

const PACKAGE_ID = "11111111-1111-4111-8111-111111111111";
const DECISION_ID = "22222222-2222-4222-8222-222222222222";
const TEAM_ID = "33333333-3333-4333-8333-333333333333";
const SNAPSHOT_HASH = "a".repeat(64);
const DECIDED_AT = "2026-08-08T12:00:00.000Z";
const MAX_STALE_BLOCKERS = [
  "review_snapshot_stale", "cost_evidence_changed",
  "external_write_lock_changed", "identity_changed",
  "package_evidence_changed", "rights_changed",
  "runtime_controls_changed", "source_evidence_changed",
  "storage_changed", "truth_changed", "validator_changed",
  "variants_changed",
];

function status(overrides = {}) {
  return {
    ready_package_id: PACKAGE_ID,
    review_state: "awaiting_team_review",
    terminal_decision: null,
    decision_review_snapshot_sha256: null,
    decision_id: null,
    decided_by: null,
    decided_at: null,
    decision_reason: null,
    inspection_attestation_version: null,
    inspection_attestation_text: null,
    inspection_attestation_sha256: null,
    current_review_snapshot_sha256: SNAPSHOT_HASH,
    snapshot_current: true,
    can_manual_export: false,
    external_write_allowed: false,
    blocker_codes: [],
    ...overrides,
  };
}

function approvedStatus(overrides = {}) {
  return status({
    review_state: "approved_for_manual_export",
    terminal_decision: "approved_for_manual_export",
    decision_review_snapshot_sha256: SNAPSHOT_HASH,
    decision_id: DECISION_ID,
    decided_by: TEAM_ID,
    decided_at: DECIDED_AT,
    inspection_attestation_version: MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION_VERSION,
    inspection_attestation_text: MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION,
    inspection_attestation_sha256: MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION_SHA256,
    can_manual_export: true,
    ...overrides,
  });
}

function decision(overrides = {}) {
  return {
    decision_id: DECISION_ID,
    ready_package_id: PACKAGE_ID,
    review_state: "approved_for_manual_export",
    terminal_decision: "approved_for_manual_export",
    decision_review_snapshot_sha256: SNAPSHOT_HASH,
    replayed: false,
    decided_by: TEAM_ID,
    decided_at: DECIDED_AT,
    decision_reason: null,
    inspection_attestation_version: MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION_VERSION,
    inspection_attestation_text: MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION,
    inspection_attestation_sha256: MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION_SHA256,
    current_review_snapshot_sha256: SNAPSHOT_HASH,
    snapshot_current: true,
    can_manual_export: true,
    external_write_allowed: false,
    blocker_codes: [],
    ...overrides,
  };
}

test("strict Ready review states separate approval, discard, and manual export", () => {
  const awaiting = parseMomoReadyReviewStatusV2(status());
  assert.ok(awaiting);
  assert.equal(momoReadyReviewCanApprove(awaiting), true);
  assert.equal(momoReadyReviewCanDiscard(awaiting), true);
  assert.equal(momoReadyReviewAllowsManualExport(awaiting), false);

  const approved = parseMomoReadyReviewStatusV2(approvedStatus());
  assert.ok(approved);
  assert.equal(momoReadyReviewAllowsManualExport(approved), true);
  assert.equal(momoReadyReviewCanApprove(approved), false);
  assert.equal(momoReadyReviewCanDiscard(approved), true,
    "Team may terminally discard exact source bytes after export approval");
  assert.equal(momoReadyReviewAllowsManualExport(approvedStatus({
    decision_id: null,
  })), false, "manual export must not trust approval without durable decision provenance");
  assert.equal(momoReadyReviewAllowsManualExport(approvedStatus({
    inspection_attestation_text: "different attestation",
  })), false, "manual export must bind the exact fixed inspection attestation");

  const discarded = parseMomoReadyReviewStatusV2(status({
    review_state: "discarded",
    terminal_decision: "discarded",
    decision_review_snapshot_sha256: SNAPSHOT_HASH,
    decision_id: DECISION_ID,
    decided_by: TEAM_ID,
    decided_at: DECIDED_AT,
    decision_reason: "Not suitable for this manual package.",
  }));
  assert.ok(discarded);
  assert.equal(momoReadyReviewAllowsManualExport(discarded), false);
  assert.equal(momoReadyReviewCanApprove(discarded), false);
  assert.equal(momoReadyReviewCanDiscard(discarded), false);
});

test("an undecided blocked package may be discarded but never approved or exported", () => {
  const blocked = parseMomoReadyReviewStatusV2(status({
    review_state: "blocked",
    blocker_codes: ["rights_not_current"],
  }));
  assert.ok(blocked);
  assert.equal(momoReadyReviewCanApprove(blocked), false);
  assert.equal(momoReadyReviewCanDiscard(blocked), true);
  assert.equal(momoReadyReviewAllowsManualExport(blocked), false);
  assert.equal(momoReadyReviewCanDiscard(status({
    review_state: "blocked",
    blocker_codes: [],
  })), false, "a fabricated blocker-free blocked state must fail closed");
  assert.equal(momoReadyReviewCanDiscard(status({
    review_state: "awaiting_team_review",
    blocker_codes: ["rights_not_current"],
  })), false, "awaiting review must remain blocker-free");

  const unavailable = { ...blocked, current_review_snapshot_sha256: "", snapshot_current: false };
  assert.equal(momoReadyReviewCanDiscard(unavailable), false);

  const staleApproved = parseMomoReadyReviewStatusV2(approvedStatus({
    review_state: "blocked",
    current_review_snapshot_sha256: "b".repeat(64),
    snapshot_current: false,
    can_manual_export: false,
    blocker_codes: ["rights_not_current"],
  }));
  assert.ok(staleApproved);
  assert.equal(momoReadyReviewCanDiscard(staleApproved), true,
    "a stale approval may still be replaced by a current-snapshot source discard");
  assert.equal(momoReadyReviewAllowsManualExport(staleApproved), false);
});

test("status parser rejects partial provenance, bad attestation, and incoherent blockers", () => {
  assert.equal(parseMomoReadyReviewStatusV2(status({ decided_by: TEAM_ID })), null);
  assert.equal(parseMomoReadyReviewStatusV2(status({ blocker_codes: ["same", "same"] })), null);
  assert.equal(parseMomoReadyReviewStatusV2(status({ review_state: "blocked", blocker_codes: [] })), null);
  assert.equal(parseMomoReadyReviewStatusV2(approvedStatus({
    inspection_attestation_text: "different attestation",
  })), null);
  assert.equal(parseMomoReadyReviewStatusV2({ ...status(), unexpected: true }), null);
  assert.ok(parseMomoReadyReviewStatusV2(approvedStatus({
    review_state: "blocked",
    current_review_snapshot_sha256: "b".repeat(64),
    snapshot_current: false,
    can_manual_export: false,
    blocker_codes: MAX_STALE_BLOCKERS,
  })), "the bounded maximal stale snapshot must remain readable");
  assert.equal(parseMomoReadyReviewStatusV2(approvedStatus({
    review_state: "blocked",
    current_review_snapshot_sha256: "b".repeat(64),
    snapshot_current: false,
    can_manual_export: false,
    blocker_codes: [...MAX_STALE_BLOCKERS, "unexpected_thirteenth_blocker"],
  })), null);
});

test("decision response parser binds exact snapshot, actor, attestation, and state", () => {
  const expected = {
    readyPackageId: PACKAGE_ID,
    decision: "approved_for_manual_export",
    expectedReviewSnapshotSha256: SNAPSHOT_HASH,
    reason: null,
  };
  assert.ok(parseMomoReadyReviewDecisionV2(decision(), expected));
  assert.equal(parseMomoReadyReviewDecisionV2(decision({
    current_review_snapshot_sha256: "b".repeat(64),
  }), expected), null);
  assert.equal(parseMomoReadyReviewDecisionV2(decision({
    blocker_codes: ["rights_not_current"],
  }), expected), null);
  assert.equal(parseMomoReadyReviewDecisionV2(decision({
    inspection_attestation_sha256: "b".repeat(64),
  }), expected), null);
  assert.equal(parseMomoReadyReviewDecisionV2({ ...decision(), unexpected: true }, expected), null);

  const staleApprovalReplay = parseMomoReadyReviewDecisionV2(decision({
    review_state: "blocked",
    replayed: true,
    current_review_snapshot_sha256: "b".repeat(64),
    snapshot_current: false,
    can_manual_export: false,
    blocker_codes: MAX_STALE_BLOCKERS,
  }), expected);
  assert.ok(staleApprovalReplay, "an exact immutable approval retry must remain replayable after evidence drift");
  assert.equal(staleApprovalReplay.terminal_decision, "approved_for_manual_export");
  assert.equal(staleApprovalReplay.decision_review_snapshot_sha256, SNAPSHOT_HASH);
  assert.equal(staleApprovalReplay.review_state, "blocked");
  assert.equal(staleApprovalReplay.can_manual_export, false);

  const reason = "Image does not fit the intended manual package.";
  const discarded = decision({
    review_state: "discarded",
    terminal_decision: "discarded",
    decision_reason: reason,
    inspection_attestation_version: null,
    inspection_attestation_text: null,
    inspection_attestation_sha256: null,
    can_manual_export: false,
  });
  assert.ok(parseMomoReadyReviewDecisionV2(discarded, {
    readyPackageId: PACKAGE_ID,
    decision: "discarded",
    expectedReviewSnapshotSha256: SNAPSHOT_HASH,
    reason,
  }));
  assert.ok(parseMomoReadyReviewDecisionV2({
    ...discarded,
    replayed: true,
    current_review_snapshot_sha256: "c".repeat(64),
    snapshot_current: false,
    blocker_codes: ["review_snapshot_stale"],
  }, {
    readyPackageId: PACKAGE_ID,
    decision: "discarded",
    expectedReviewSnapshotSha256: SNAPSHOT_HASH,
    reason,
  }), "an exact immutable discard retry must remain replayable after evidence drift");
});

test("Team Ready UI gates every export through fresh status and preserves discarded evidence", async () => {
  const [center, data] = await Promise.all([
    readFile(new URL("../app/momo-operating-center.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/momo-data.ts", import.meta.url), "utf8"),
  ]);
  const card = center.slice(
    center.indexOf("function VeroxaReadyPackageCard"),
    center.indexOf("function ContentPanel"),
  );
  const freshGate = card.slice(
    card.indexOf("const runFreshManualExportAction"),
    card.indexOf("const decide"),
  );
  assert.match(freshGate, /getMomoReadyReviewStatusV2/);
  assert.match(freshGate, /momoReadyReviewAllowsManualExport\(fresh\)/);
  assert.match(freshGate, /fresh\.current_review_snapshot_sha256[\s\S]*?reviewStatus\.current_review_snapshot_sha256/);
  assert.match(card, /runFreshManualExportAction\(\(\) => \{[\s\S]*?link\.click\(\)/);
  assert.match(card, /runFreshManualExportAction\(async \(\) => \{[\s\S]*?navigator\.clipboard\.writeText/);
  assert.match(card, /Approve for manual export/);
  assert.match(card, /Only manual copy and download are unlocked; external posting remains disabled/);
  assert.match(card, /\{MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION\}/);
  assert.match(card, /reviewConfirmedSnapshotSha256 ===[\s\S]{0,100}reviewStatus\.current_review_snapshot_sha256/);
  assert.match(card, /setReviewConfirmedSnapshotSha256\(event\.target\.checked \? reviewStatus\?\.current_review_snapshot_sha256 \?\? null : null\)/);
  assert.match(card, /packageRun\?\.prompt_version === MOMO_CONTENT_AI_PROMPT_VERSION[\s\S]{0,160}packageRun\.validator_version === MOMO_CONTENT_AI_VALIDATOR_VERSION/);
  assert.match(card, /Subject: \{labelStatus\(readyPackage\.output_payload\.assetAssessment\.subject\)\}/);
  assert.match(card, /aria-label="Media visual assessment"/);
  assert.doesNotMatch(card, /Subject: food/);
  assert.match(card, /legacy tags are hidden; regenerate it under the current contract before approval/);
  assert.match(card, /output_payload\.internalMediaTags\.map\(\(tag\)/);
  assert.match(card, /Math\.round\(tag\.confidence \* 100\)/);
  assert.match(card, /Discard source from future Ready/);
  assert.match(card, /terminal for these exact image bytes across every same-byte upload and asset record for this restaurant/);
  assert.match(card, /immutable bytes, the package, rights evidence, and audit history remain retained/);
  assert.doesNotMatch(card, /storage\.from[\s\S]*?\.remove|\.delete\(/u);
  assert.match(data, /\.rpc\(\s*"veroxa_decide_momo_ready_package_v2"[\s\S]{0,800}p_inspection_attestation: input\.decision === "approved_for_manual_export"[\s\S]{0,160}\? MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION[\s\S]{0,80}: null/);
  assert.match(data, /\.rpc\(\s*"veroxa_momo_ready_review_status_v2"/);
  assert.match(data, /p_ready_package_id: input\.readyPackageId\.toLowerCase\(\)/);
  assert.match(data, /key: "veroxaReadyPackagesV2"[^\n]*secondaryOrder: "id"[^\n]*limit: 50/);
  assert.match(data, /\.in\("ready_package_id", readyPackageIds\)[\s\S]{0,300}\.limit\(Math\.min\(readyPackageIds\.length \* 3, 150\)\)/);
  assert.match(data, /new Set\(parsed\.map\(\(item\) => item\.ready_package_id\)\)\.size !== parsed\.length/);
  assert.match(center, /pendingReadyReviews = data\.readyReviewStatusesV2\.filter\(\(status\) =>[\s\S]{0,220}momoReadyReviewCanApprove\(status\) \|\|[\s\S]{0,120}status\.terminal_decision === null[\s\S]{0,120}momoReadyReviewCanDiscard\(status\)/);
});

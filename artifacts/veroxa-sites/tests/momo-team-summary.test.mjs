import assert from "node:assert/strict";
import test from "node:test";
import { buildMomoTeamSummary } from "../app/momo-team-summary.ts";

const emptyMomoWorkspaceData = () => ({
  truth: [], contacts: [], onboarding: [], presence: [], confirmations: [],
  readiness: [], readinessGate: null, media: [], mediaRights: [], mediaReviews: [],
  mediaTags: [], mediaAssetTags: [], mediaUsage: [], mediaIntake: [], mediaIdentityLinksV2: [], aiJobs: [],
  contentAiRuns: [], readyPackages: [], readyPackageVariants: [], readyPackageStatuses: [],
  exceptionIncidentsV2: [], exceptionEventsV2: [], veroxaReadyPackagesV2: [], veroxaReadyVariantsV2: [], strategies: [],
  contentItems: [], pendingContentConfirmations: [], variants: [], approvals: [], calendar: [], connections: [],
  publishQueue: [], localChecks: [], reviews: [], visibility: [], work: [],
  activity: [], reports: [], monitors: [], alerts: [], recovery: [],
  contentInputs: [], activationDecisions: [],
});

test("the Team home stays truthful when Momo has no recorded work", () => {
  const summary = buildMomoTeamSummary(emptyMomoWorkspaceData());

  assert.deepEqual(summary.attention, []);
  assert.equal(summary.stages.find((stage) => stage.key === "restaurant")?.status, "Not started");
  assert.equal(summary.stages.find((stage) => stage.key === "media")?.status, "Waiting on Momo");
  assert.equal(summary.stages.find((stage) => stage.key === "readiness")?.detail, "Final gate not evaluated");
  assert.equal(summary.nextAction?.destination, "team-intelligence");
});

test("urgent failures outrank decisions and blocked work while routine media stays out of attention", () => {
  const data = emptyMomoWorkspaceData();
  data.alerts.push({ id: "alert-1", status: "open" });
  data.confirmations.push({ id: "confirmation-1", status: "pending" });
  data.work.push({ id: "work-1", status: "blocked", blocked_reason: "Owner access required" });
  data.media.push({ id: "media-1", status: "uploaded" });

  const summary = buildMomoTeamSummary(data);

  assert.deepEqual(summary.attention.map((item) => item.key), [
    "recovery",
    "restaurant-decisions",
    "blocked-work",
  ]);
  assert.equal(summary.nextAction?.destination, "team-work");
  assert.equal(summary.attention[0].tone, "urgent");
});

test("raw provider and routine media rows cannot overstate readiness or create an exception", () => {
  const data = emptyMomoWorkspaceData();
  data.media.push({ id: "media-1", status: "ready_to_use" });
  data.connections.push({
    id: "connection-1",
    provider: "instagram",
    status: "connected",
    capabilities: ["instagram_publish"],
    owner_authorized_by: null,
    owner_authorized_at: null,
    last_verified_at: null,
  });

  const summary = buildMomoTeamSummary(data);

  assert.equal(summary.stages.find((stage) => stage.key === "media")?.status, "In progress");
  assert.equal(summary.attention.some((item) => item.destination === "team-media"), false);
  assert.equal(summary.stages.find((stage) => stage.key === "presence")?.status, "Waiting on Momo");
  assert.match(summary.stages.find((stage) => stage.key === "presence")?.detail || "", /^0 of 1/);
});

test("only unresolved consolidated v2 incidents create media or content attention", () => {
  const data = emptyMomoWorkspaceData();
  data.media.push({ id: "media-1", status: "uploaded", content_sha256: null });
  data.approvals.push({ id: "legacy-approval", subject_type: "content_item", status: "pending" });
  data.contentAiRuns.push({ id: "legacy-run", decision_mode: "team_review_v1", status: "pending_review" });
  data.exceptionIncidentsV2.push({
    id: "incident-1",
    canonical_asset_id: "media-1",
    stage: "content_validation",
    status: "open",
    blockers: ["claim_validation_failed"],
    occurrence_count: 4,
  });

  const summary = buildMomoTeamSummary(data);

  assert.deepEqual(summary.attention.map((item) => item.key), ["momo-exception-incident-1"]);
  assert.equal(summary.attention[0].title, "Content package failed verification");
  assert.match(summary.attention[0].detail, /4 matching occurrences consolidated/u);
  assert.equal(summary.attention.some((item) => item.key === "content-decisions"), false);
  assert.equal(summary.stages.find((stage) => stage.key === "content")?.status, "Needs attention");
});

test("v2 completion is Veroxa Ready without treating legacy scheduled rows as current", () => {
  const data = emptyMomoWorkspaceData();
  data.media.push({ id: "media-1", status: "uploaded", content_sha256: "a".repeat(64) });
  data.contentItems.push({ id: "legacy-content", status: "scheduled" });
  data.veroxaReadyPackagesV2.push({ id: "ready-v2", canonical_asset_id: "media-1", status: "veroxa_ready", external_write_allowed: false });

  const summary = buildMomoTeamSummary(data);

  assert.equal(summary.stages.find((stage) => stage.key === "media")?.status, "Complete");
  assert.equal(summary.stages.find((stage) => stage.key === "content")?.status, "Complete");
  assert.match(summary.stages.find((stage) => stage.key === "content")?.detail || "", /unscheduled package.*posting is off/u);
  assert.deepEqual(summary.attention, []);
});

test("exact duplicate uploads count as one identity and only its latest run can be Ready", () => {
  const data = emptyMomoWorkspaceData();
  data.media.push(
    { id: "media-1", status: "uploaded", content_sha256: "a".repeat(64) },
    { id: "media-2", status: "uploaded", content_sha256: "a".repeat(64) },
  );
  data.mediaIdentityLinksV2.push(
    { asset_id: "media-1", identity_id: "identity-1" },
    { asset_id: "media-2", identity_id: "identity-1" },
  );
  data.contentAiRuns.push({
    id: "run-current",
    decision_mode: "automation_policy_v2",
    automation_identity_id: "identity-1",
    status: "pending_review",
  });
  data.veroxaReadyPackagesV2.push({
    id: "ready-current",
    identity_id: "identity-1",
    content_ai_run_id: "run-current",
    canonical_asset_id: "media-1",
    status: "veroxa_ready",
    external_write_allowed: false,
  });

  const ready = buildMomoTeamSummary(data);
  assert.equal(ready.stages.find((stage) => stage.key === "media")?.status, "Complete");
  assert.match(ready.stages.find((stage) => stage.key === "media")?.detail || "", /^1 canonical media package/u);
  assert.match(ready.stages.find((stage) => stage.key === "content")?.detail || "", /^1 unscheduled package/u);

  data.contentAiRuns.unshift({
    id: "run-newer",
    decision_mode: "automation_policy_v2",
    automation_identity_id: "identity-1",
    status: "provider_running",
  });
  const superseded = buildMomoTeamSummary(data);
  assert.equal(superseded.stages.find((stage) => stage.key === "content")?.status, "In progress");
  assert.match(superseded.stages.find((stage) => stage.key === "content")?.detail || "", /1 automatic preparation is in progress/u);
});

test("the action-first summary exposes no backend event names", () => {
  const data = emptyMomoWorkspaceData();
  data.activity.push({
    id: "event-1",
    event_type: "veroxa_media_ai_candidate_readback_completed_v2",
    occurred_at: "2026-07-31T12:00:00.000Z",
  });

  const summary = buildMomoTeamSummary(data);

  assert.deepEqual(summary.recentUpdates, [{
    id: "event-1",
    title: "Media updated",
    occurredAt: "2026-07-31T12:00:00.000Z",
  }]);
});

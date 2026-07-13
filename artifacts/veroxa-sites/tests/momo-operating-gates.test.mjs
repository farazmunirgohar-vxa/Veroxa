import assert from "node:assert/strict";
import test from "node:test";
import {
  MOMO_MANUAL_REPORT_NARRATIVES,
  momoCalendarEntryIsCurrentApproved,
  momoConnectionIsCurrentlyEligible,
  momoContentSelectionsAreCurrent,
  momoMediaIsCurrentlyUsable,
  momoReportNarrativeIsSafeWithoutProviderMetrics,
  normalizedMomoHttpsUrl,
  resolveLatestMomoPresenceConfirmation,
} from "../app/momo-operating-gates.ts";

const NOW = Date.parse("2026-07-13T18:00:00.000Z");

test("presence URLs require nonempty credential-free HTTPS and normalize fragments", () => {
  assert.equal(normalizedMomoHttpsUrl(""), null);
  assert.equal(normalizedMomoHttpsUrl("http://example.com"), null);
  assert.equal(normalizedMomoHttpsUrl("https://user:secret@example.com"), null);
  assert.equal(normalizedMomoHttpsUrl("https://example.com/menu#today"), "https://example.com/menu");
});

test("usable media requires current rights, review, public approval, and exact scope", () => {
  const data = { media: [], mediaRights: [], mediaReviews: [] };
  data.media.push({ id: "media-1", status: "ready_to_use" });
  data.mediaRights.push({
    id: "rights-1",
    asset_id: "media-1",
    rights_status: "confirmed",
    usage_scope: ["instagram", "internal"],
    valid_from: "2026-07-01T05:00:00.000Z",
    expires_at: "2026-08-01T04:59:59.999Z",
  });
  data.mediaReviews.push({ id: "review-1", asset_id: "media-1", is_current: true, status: "approved", public_use_approved: true });

  assert.equal(momoMediaIsCurrentlyUsable(data, "media-1", "instagram", NOW), true);
  assert.equal(momoMediaIsCurrentlyUsable(data, "media-1", "facebook", NOW), false);
  assert.equal(momoMediaIsCurrentlyUsable(data, "media-1", "instagram", Date.parse("2026-08-01T05:00:00.000Z")), false);
  data.mediaRights[0].expires_at = "2026-07-13T17:59:59.999Z";
  assert.equal(momoMediaIsCurrentlyUsable(data, "media-1", "instagram", NOW), false);
  data.mediaRights[0].expires_at = "invalid";
  assert.equal(momoMediaIsCurrentlyUsable(data, "media-1", "instagram", NOW), false);
});

test("provider eligibility requires owner authorization, capability, and later verification", () => {
  const connection = {
    status: "connected",
    owner_authorized_by: "owner-1",
    owner_authorized_at: "2026-07-13T17:00:00.000Z",
    last_verified_at: "2026-07-13T17:30:00.000Z",
    capabilities: ["instagram_publish"],
  };
  assert.equal(momoConnectionIsCurrentlyEligible(connection, "instagram_publish"), true);
  assert.equal(momoConnectionIsCurrentlyEligible(connection, "facebook_publish"), false);
  assert.equal(momoConnectionIsCurrentlyEligible({ ...connection, last_verified_at: "2026-07-13T16:00:00.000Z" }, "instagram_publish"), false);
  assert.equal(momoConnectionIsCurrentlyEligible({ ...connection, owner_authorized_by: null }, "instagram_publish"), false);
  assert.equal(momoConnectionIsCurrentlyEligible({
    status: "connected",
    eligible_capabilities: ["instagram_publish"],
    capabilities: [],
    owner_authorized_by: null,
    owner_authorized_at: null,
    last_verified_at: null,
  }, "instagram_publish"), true);
  assert.equal(momoConnectionIsCurrentlyEligible({
    status: "revoked",
    eligible_capabilities: ["instagram_publish"],
    capabilities: [],
    owner_authorized_by: null,
    owner_authorized_at: null,
    last_verified_at: null,
  }, "instagram_publish"), false);
  assert.equal(momoConnectionIsCurrentlyEligible({
    status: "connected",
    eligible_capabilities: [],
    capabilities: [],
    owner_authorized_by: null,
    owner_authorized_at: null,
    last_verified_at: null,
  }, "instagram_publish"), false);
});

test("only a future approved America/Chicago calendar row unlocks publishing review", () => {
  const entry = { status: "approved", timezone: "America/Chicago", scheduled_for: "2026-07-14T18:00:00.000Z" };
  assert.equal(momoCalendarEntryIsCurrentApproved(entry, NOW), true);
  assert.equal(momoCalendarEntryIsCurrentApproved({ ...entry, status: "cancelled" }, NOW), false);
  assert.equal(momoCalendarEntryIsCurrentApproved({ ...entry, timezone: "UTC" }, NOW), false);
  assert.equal(momoCalendarEntryIsCurrentApproved({ ...entry, scheduled_for: "2026-07-13T17:59:59.999Z" }, NOW), false);
});

const confirmation = (overrides = {}) => ({
  id: "confirmation",
  status: "approved",
  decision: "confirm",
  proposed_value: { publicUrl: "https://example.com/profile", accessAuthorized: true },
  created_at: "2026-07-13T17:00:00.000Z",
  ...overrides,
});

test("presence evidence uses the latest exact URL-bound affirmative owner decision", () => {
  const approved = confirmation();
  const exact = resolveLatestMomoPresenceConfirmation([approved], "https://example.com/profile");
  assert.equal(exact.exactUrlConfirmed, true);
  assert.equal(exact.accessAuthorized, true);

  const newerPending = confirmation({ id: "pending", status: "pending", decision: "correct", created_at: "2026-07-13T18:00:00.000Z" });
  const blocked = resolveLatestMomoPresenceConfirmation([approved, newerPending], "https://example.com/profile");
  assert.equal(blocked.pending, true);
  assert.equal(blocked.approved, undefined);
  assert.equal(blocked.exactUrlConfirmed, false);

  assert.equal(resolveLatestMomoPresenceConfirmation([approved], "https://example.com/other").exactUrlConfirmed, false);
  assert.equal(resolveLatestMomoPresenceConfirmation([confirmation({ proposed_value: { publicUrl: "https://example.com", accessAuthorized: true } })], "https://example.com/").exactUrlConfirmed, false);
  assert.equal(resolveLatestMomoPresenceConfirmation([confirmation({ proposed_value: { publicUrl: "https://example.com/profile", accessAuthorized: false } })], "https://example.com/profile").accessAuthorized, false);
});

test("content selections reject duplicates and records that left the current eligible set", () => {
  const base = {
    selectedTruthIds: ["truth-1", "truth-2"],
    currentTruthIds: ["truth-1", "truth-2"],
    selectedMediaId: "media-1",
    currentMediaIds: ["media-1"],
    selectedStrategyId: "strategy-1",
    currentStrategyIds: ["strategy-1"],
  };
  assert.equal(momoContentSelectionsAreCurrent(base), true);
  assert.equal(momoContentSelectionsAreCurrent({ ...base, selectedTruthIds: ["truth-1", "truth-1"] }), false);
  assert.equal(momoContentSelectionsAreCurrent({ ...base, currentTruthIds: ["truth-1"] }), false);
  assert.equal(momoContentSelectionsAreCurrent({ ...base, currentMediaIds: [] }), false);
  assert.equal(momoContentSelectionsAreCurrent({ ...base, currentStrategyIds: [] }), false);
});

test("manual reports reject unsupported provider and business outcomes", () => {
  assert.equal(momoReportNarrativeIsSafeWithoutProviderMetrics(MOMO_MANUAL_REPORT_NARRATIVES[0]), true);
  assert.equal(momoReportNarrativeIsSafeWithoutProviderMetrics("Internal process update: We acquired 32 customers."), false);
  assert.equal(momoReportNarrativeIsSafeWithoutProviderMetrics("Revenue +300%, #1 on Google."), false);
  assert.equal(momoReportNarrativeIsSafeWithoutProviderMetrics("The post went live and reached 5,000 views."), false);
  assert.equal(momoReportNarrativeIsSafeWithoutProviderMetrics("Sales increased 25%."), false);
});

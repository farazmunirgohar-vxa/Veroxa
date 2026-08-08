import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Team v2 reads are scoped to open incidents, unscheduled Ready, and active legacy jobs", async () => {
  const [data, migration] = await Promise.all([
    readFile(new URL("../app/momo-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20260802063124_momo_upload_veroxa_ready_v2.sql", import.meta.url), "utf8"),
  ]);

  assert.match(migration, /create table public\.veroxa_momo_exception_incidents_v2/);
  assert.match(migration, /status text not null default 'open' check \(status in \('open','resolved'\)\)/);
  assert.match(migration, /create table public\.veroxa_momo_ready_packages_v2[\s\S]*?status text not null check \(status = 'veroxa_ready'\)[\s\S]*?external_write_allowed boolean not null default false check \(not external_write_allowed\)/);
  assert.match(migration, /create table public\.veroxa_momo_ready_variants_v2[\s\S]*?unique \(ready_package_id, platform\)/);
  assert.doesNotMatch(migration.match(/create table public\.veroxa_momo_ready_packages_v2[\s\S]*?create table public\.veroxa_momo_ready_variants_v2/)?.[0] || "", /scheduled_for|timezone|publish/i);

  assert.match(data, /table: "veroxa_momo_exception_incidents_v2"[\s\S]{0,900}equals: \{ status: "open", external_write_allowed: false \}/);
  assert.match(data, /table: "veroxa_momo_media_asset_identity_links_v2"[\s\S]{0,900}limit: 200/);
  assert.match(data, /table: "veroxa_momo_exception_events_v2"[\s\S]{0,900}limit: 200/);
  assert.match(data, /table: "veroxa_momo_ready_packages_v2"[\s\S]{0,1300}equals: \{ status: "veroxa_ready", external_write_allowed: false \}/);
  assert.match(data, /table: "veroxa_momo_ready_variants_v2"[\s\S]{0,700}equals: \{ status: "veroxa_ready", external_write_allowed: false \}/);
  assert.match(data, /table: "veroxa_ai_jobs"[\s\S]{0,800}isNull: "superseded_by_job_id"/, "superseded legacy jobs must be history, not routine readback");
  assert.match(data, /if \(definition\.isNull\) query = query\.is\(definition\.isNull, null\)/);
});

test("Team media supports assessment-only recognition while content remains decision-scoped", async () => {
  const [center, clientData] = await Promise.all([
    readFile(new URL("../app/momo-operating-center.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/momo-client-data.ts", import.meta.url), "utf8"),
  ]);
  const media = center.slice(center.indexOf("function MediaPanel"), center.indexOf("type MomoContentPreparationState"));
  const teamIntake = center.slice(center.indexOf("function TeamPrivateAssessmentIntake"), center.indexOf("type MomoContentPreparationState"));
  const content = center.slice(center.indexOf("function ContentPanel"), center.indexOf("function PendingContentConfirmationCard"));
  const ready = center.slice(center.indexOf("function VeroxaReadyPackageCard"), center.indexOf("function ContentPanel"));
  const teamUpload = clientData.slice(clientData.indexOf("export async function uploadMomoTeamPrivateMedia"), clientData.indexOf("export async function retryMomoClientMediaVerification"));

  assert.match(media, /EXCEPTION-ONLY QUEUE/);
  assert.match(media, /<TeamPrivateAssessmentIntake/);
  assert.match(teamIntake, /Recognize and tag a food image/);
  assert.match(teamIntake, /uploadMomoTeamPrivateMedia/);
  assert.doesNotMatch(teamIntake, /Instagram|Facebook|Google Business Profile|Private preparation scope/);
  assert.match(teamIntake, /outcome\.assessment\.assessment/);
  assert.match(teamIntake, /assessment\.tags\.map/);
  assert.match(teamIntake, /assessment-only[\s\S]{0,260}cannot claim a current Momo offering[\s\S]{0,160}become Ready/);
  assert.doesNotMatch(teamIntake, /represents_current_restaurant_offering|recordMomoMediaRestaurantAssociation/);
  assert.match(clientData, /export async function uploadMomoTeamPrivateMedia[\s\S]{0,700}usageScope: \[MOMO_TEAM_PRIVATE_MEDIA_SCOPE\][\s\S]{0,400}registrationRpc: "veroxa_register_team_private_media_v1"[\s\S]{0,120}skipAssociation: true/);
  assert.match(teamUpload, /const teamClient = getVeroxaSupabase\(\);[\s\S]*?if \(!teamClient\) throw new Error\("configuration_unavailable"\)/);
  assert.doesNotMatch(teamUpload, /requiredClient|configureMomoClient/);
  assert.match(media, /openIncidents\.map\(\(incident\)/);
  assert.match(media, /Media history & manual recovery/);
  assert.match(media, /<MediaAssetCard asset=\{recoveryAsset\}/, "manual media recovery must remain reachable for the selected exception source");
  assert.match(media, /latestEvent[\s\S]{0,500}event\.source_asset_id/);
  assert.match(media, /setRecoveryAssetId\(sourceAssetId\)/, "recovery must open the immutable exception source, not assume canonical bytes own the selected rights");

  assert.match(content, /const attentionCount = role === "team"[\s\S]{0,160}\? openIncidents\.length \+ pendingReadyReviews\.length/);
  assert.doesNotMatch(content, /\? legacyReviewRuns\.length|\? legacyFailedRuns\.length/);
  assert.match(content, /EXCEPTION-ONLY QUEUE/);
  assert.match(content, /READY REVIEW QUEUE/);
  assert.match(content, /manual copy and download remain locked/);
  assert.match(content, /Legacy v1 history & manual recovery/);
  assert.match(content, /legacyReviewRuns\.map\(\(item\) => <ContentPackageReviewCard/);

  assert.match(ready, /Unscheduled by design/);
  assert.match(ready, /No schedule · no posting/);
  assert.doesNotMatch(ready, /scheduled_for|scheduledFor|ready_to_post|getMomoReadyPackageStatus/);
  assert.match(ready, /external writes disabled/);
  assert.match(ready, /selected processing upload[\s\S]{0,300}rights record/);
});

test("Client copy presents safe outcomes without internal processing details", async () => {
  const [portal, data] = await Promise.all([
    readFile(new URL("../app/momo-client-portal.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/momo-client-data.ts", import.meta.url), "utf8"),
  ]);
  assert.match(portal, /Identical bytes reused only the private visual assessment/);
  assert.match(portal, /Permission and restaurant association remain separate for this upload/);
  assert.match(portal, /v2AttentionReasons\.map\(\(reason\) => clientAttentionMessage\[reason\]\)/);
  assert.match(portal, /pipelineStatus === "veroxa_ready" &&[\s\S]*?workflow\.rightsConfirmed && restaurantContentEligible/);
  assert.match(portal, /exact image bytes[\s\S]*?duplicate upload and asset record for this restaurant[\s\S]*?SHA-256 hash[\s\S]*?audit evidence remain stored/);
  assert.match(portal, /!item\.sourceMediaDiscarded && assessableImage[\s\S]*?Retry private assessment/);
  assert.match(portal, /: !item\.sourceMediaDiscarded \? <details[\s\S]*?Record final association/);
  assert.match(portal, /!item\.sourceMediaDiscarded && item\.rightsId[\s\S]*?Withdraw future permission/);
  assert.match(portal, /!newestSourceMediaDiscarded && newestPrepared/);
  assert.doesNotMatch(portal, /Source SHA-256:\s*\{/u);
  assert.match(data, /client\.rpc\("veroxa_momo_client_upload_status_v4"/);
  assert.doesNotMatch(data, /client\.rpc\("veroxa_momo_client_upload_status_v3"/);
  assert.match(data, /pipelineAttentionReasons: effectiveAttentionReasons/);
  assert.doesNotMatch(portal, /\bAI\b|\bautomatic(?:ally)?\b|provider_|content_ai_|canonical identity|processing identity|processing source|exact (?:saved )?bytes|storage record|registration identifier|processing upload/iu);
  assert.doesNotMatch(portal, /processingAssetId\.slice|canonicalAssetId\?\.slice/);
  assert.doesNotMatch(data, /row\.(?:canonical_asset_id|processing_asset_id|ready_package_id|reason_codes|provider_error_code)/u);
});

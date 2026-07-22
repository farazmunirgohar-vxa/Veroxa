import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  momoMediaReviewCanSave,
  momoRenditionMatchesCurrentEvidence,
  resolveMomoMediaWorkflow,
} from "../app/momo-media-guidance.ts";
import { mergeMomoClientMediaReadback, parseMomoClientSnapshot } from "../app/momo-client-data.ts";
import { deriveMomoCoverCropAtFocalPoint } from "../app/momo-media-workflow.ts";

const NOW = Date.parse("2026-07-22T12:00:00.000Z");
const approved = {
  hasAsset: true,
  assetStatus: "ready_to_use",
  rightsStatus: "confirmed",
  rightsValidFrom: "2026-07-01T00:00:00.000Z",
  rightsExpiresAt: "2026-08-01T00:00:00.000Z",
  reviewStatus: "approved",
  publicUseApproved: true,
  now: NOW,
};

test("media guidance advances only through verified Upload → Review → Improve → Ready evidence", () => {
  assert.deepEqual(resolveMomoMediaWorkflow({ hasAsset: false, now: NOW }), {
    uploaded: false,
    rightsConfirmed: false,
    reviewApproved: false,
    improvementReady: false,
    ready: false,
    nextAction: "upload",
  });
  assert.equal(resolveMomoMediaWorkflow({ ...approved, assetStatus: "uploaded" }).nextAction, "team_review");
  assert.equal(resolveMomoMediaWorkflow(approved).nextAction, "improve");
  assert.equal(resolveMomoMediaWorkflow(approved).ready, false, "review alone must never be represented as Ready");
  const ready = resolveMomoMediaWorkflow({ ...approved, renditionStatus: "ready" });
  assert.equal(ready.improvementReady, true);
  assert.equal(ready.ready, true);
  assert.equal(ready.nextAction, "ready");
});

test("media guidance fails closed for future, expired, malformed, or revoked rights", () => {
  for (const input of [
    { ...approved, rightsStatus: "revoked" },
    { ...approved, rightsValidFrom: "2026-07-23T00:00:00.000Z" },
    { ...approved, rightsExpiresAt: "2026-07-22T11:59:59.999Z" },
    { ...approved, rightsExpiresAt: "2026-07-22T12:00:00.000Z" },
    { ...approved, rightsExpiresAt: "not-a-date" },
  ]) {
    const result = resolveMomoMediaWorkflow(input);
    assert.equal(result.rightsConfirmed, false);
    assert.equal(result.reviewApproved, false);
    assert.equal(result.nextAction, "confirm_rights");
  }
});

test("Team review cannot be saved from a signed URL alone", () => {
  const review = { hasRights: true, previewRendered: true, inspectionConfirmed: true, notes: "Food is sharp and evenly lit." };
  assert.equal(momoMediaReviewCanSave(review), true);
  assert.equal(momoMediaReviewCanSave({ ...review, previewRendered: false }), false);
  assert.equal(momoMediaReviewCanSave({ ...review, inspectionConfirmed: false }), false);
  assert.equal(momoMediaReviewCanSave({ ...review, hasRights: false }), false);
  assert.equal(momoMediaReviewCanSave({ ...review, notes: "too short" }), false);
});

test("Team rendition eligibility follows current lineage, scope, evidence, and write lock", () => {
  const rendition = {
    assetId: "asset-1",
    assetContentSha256: "a".repeat(64),
    rightsEvidenceClass: "development_proxy",
    usageScope: ["instagram"],
    sourceKind: "owner_asset",
    sourceAssetId: "asset-1",
    sourceKey: "asset-1",
    sourceContentSha256: "a".repeat(64),
    intendedUse: "instagram",
    renditionEvidenceClass: "development_proxy",
    renditionStatus: "ready",
    externalWriteAllowed: false,
  };
  assert.equal(momoRenditionMatchesCurrentEvidence({ ...rendition, assetContentSha256: "" }), false, "a first-render workspace snapshot without the newly stored source hash must remain blocked");
  assert.equal(momoRenditionMatchesCurrentEvidence(rendition), true);
  assert.equal(momoRenditionMatchesCurrentEvidence({ ...rendition, usageScope: ["website"] }), false);
  assert.equal(momoRenditionMatchesCurrentEvidence({ ...rendition, renditionEvidenceClass: "real_owner" }), false);
  assert.equal(momoRenditionMatchesCurrentEvidence({ ...rendition, sourceContentSha256: "b".repeat(64) }), false);
  assert.equal(momoRenditionMatchesCurrentEvidence({ ...rendition, externalWriteAllowed: true }), false);
});

test("focal-point crops stay aspect-safe while preserving the selected food subject", () => {
  const geometry = { sourceWidth: 1600, sourceHeight: 1200, outputWidth: 1080, outputHeight: 1350, rotation: 0 };
  assert.deepEqual(deriveMomoCoverCropAtFocalPoint(geometry, 0, 0.5), { x: 0, y: 0, width: 0.6, height: 1 });
  assert.deepEqual(deriveMomoCoverCropAtFocalPoint(geometry, 0.5, 0.5), { x: 0.2, y: 0, width: 0.6, height: 1 });
  assert.deepEqual(deriveMomoCoverCropAtFocalPoint(geometry, 1, 0.5), { x: 0.4, y: 0, width: 0.6, height: 1 });
  assert.deepEqual(deriveMomoCoverCropAtFocalPoint(geometry, -2, 4), { x: 0, y: 0, width: 0.6, height: 1 }, "out-of-range focal values must clamp");
});

test("Client and Team source preserve real links, real-image-first selection, inline previews, and prerequisite order", async () => {
  const [page, client, clientData, team, operating] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/momo-client-portal.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/momo-client-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/momo-team-preconnection-center.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/momo-operating-center.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(client, /href=\{clientRoutes\[item\]\}/, "Client navigation must use real links");
  assert.match(client, /className="momo-module-grid client-action-grid"[\s\S]*?<a href=\{clientRoutes\.media\}/, "Dashboard Media must be a real link");
  assert.doesNotMatch(client, /history\.pushState/, "Client routing must not depend on a click-only pushState handler");
  assert.doesNotMatch(client, /Share private photos or videos/, "Client dashboard must not promise unsupported video intake");
  assert.ok((client.match(/setRightsConfirmed\(false\)/g) || []).length >= 4, "File, scope, expiry, and completed upload must invalidate the prior rights attestation");
  assert.match(client, /getMomoClientMediaPreview\(storagePath\)/, "Client media must open signed private original and derivative previews inline");
  assert.match(client, /<img src=\{previewUrl\}/, "Client must show the actual private image instead of a placeholder");
  assert.match(client, /renditionStatus: item\.renditionStatus/, "Client Ready must come from sanitized rendition readback");
  assert.match(clientData, /veroxa_momo_client_media_status_v1/, "Client must load the protected minimal rendition status projection");
  assert.match(page, /<Link key=\{item\.id\} href=\{item\.path\}/, "Team navigation must use reliable route links");

  assert.match(team, /useState\(\(\) => preferredAssetId \|\| editableAssets\[0\]\?\.id \|\| ""\)/, "Team editor must default to the selected or newest real image");
  assert.doesNotMatch(team, /useState\("synthetic-fixture-v1"\)/, "Synthetic media must not be the default source");
  assert.match(team, /Review unlocks improvement/, "Blocked improvement must explain its prerequisite");
  assert.match(team, /TeamPrivateImagePreview/, "Team must compare the real original and private derivative inline");
  assert.match(team, /Badge value=\{selectedWorkflow\.ready/, "Team Ready badge must re-check current rights and review state");
  assert.match(team, /selectedUsageScope\.includes\(selectedPresetUse\)/, "Team must block output presets outside the owner-authorized scope");
  assert.match(team, /momoRenditionMatchesCurrentEvidence/, "Team Ready must re-check current rendition lineage, scope, and evidence");
  assert.match(team, /renderedRenditionId === currentRendition\.id/, "Team Ready must require the current derivative to render successfully");
  assert.match(team, /onLoad=\{\(\) => \{ setState\("ready"\)/, "Derivative readiness must be driven by actual image load");
  assert.match(team, /await persistMomoImageRendition\([\s\S]*?if \(asset\) await onWorkspaceRefresh\?\.\(\)/, "First rendition must refresh the authoritative parent asset hash before Ready is evaluated");
  assert.match(operating, /\{mediaLibrary\}[\s\S]*?<MomoTeamPreconnectionCenter mode="media"/, "Team review must appear before the image editor");
  assert.match(operating, /onWorkspaceRefresh=\{reloadWorkspace\}/, "Media workspace must provide the parent refresh boundary to the nested editor");
  assert.match(operating, /Approved for public-use preparation \(this does not post\)/, "Review copy must separate preparation permission from posting");
  assert.match(operating, /onLoadedData=\{\(\) => setPreviewRendered\(true\)\}/, "Video review must wait for rendered media");
  assert.match(operating, /onLoad=\{\(\) => setPreviewRendered\(true\)\}/, "Image review must wait for decoded media");
  assert.match(operating, /inspectionConfirmed/, "Team must explicitly attest visual inspection");
  assert.match(page, /className="top-sign-out"[\s\S]*?Sign out/, "Team desktop must expose a plainly labeled sign-out action");
});

test("Client rendition projection exposes only a fail-closed per-asset Ready status", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20260722000100_momo_client_media_status_v1.sql", import.meta.url), "utf8");
  assert.match(sql, /security definer[\s\S]*?set search_path = ''/i);
  assert.match(sql, /auth\.uid\(\)[\s\S]*?veroxa_current_user_has_active_restaurant/);
  assert.match(sql, /asset\.status = 'ready_to_use'/);
  assert.match(sql, /rights\.expires_at is null or rights\.expires_at > now\(\)/);
  assert.match(sql, /rights\.usage_scope \? rendition\.intended_use/);
  assert.match(sql, /rights\.evidence_class = caller_evidence_class[\s\S]*?rendition\.evidence_class = rights\.evidence_class/);
  assert.match(sql, /review\.is_current[\s\S]*?review\.status = 'approved'[\s\S]*?review\.public_use_approved/);
  assert.match(sql, /rendition\.source_kind = 'owner_asset'[\s\S]*?rendition\.source_key = asset\.id::text[\s\S]*?rendition\.source_content_sha256 = asset\.content_sha256/);
  assert.match(sql, /rendition\.output_hash_attested_at is not null[\s\S]*?not rendition\.external_write_allowed/);
  assert.match(sql, /object\.name = rendition\.storage_path[\s\S]*?object\.version is not null[\s\S]*?rendition\.storage_object_version is not null[\s\S]*?object\.version = rendition\.storage_object_version/);
  assert.match(sql, /case[\s\S]*?metadata ->> 'size'[\s\S]*?\^\[0-9\]\{1,30\}\$[\s\S]*?::numeric = rendition\.file_size[\s\S]*?else false/);
  assert.doesNotMatch(sql, /'contentSha256'|'recipe'|'renditionId'/, "Client projection must not expose Team-only hashes, recipes, or IDs");
  assert.match(sql, /veroxa_restaurant_media_member_select[\s\S]*?veroxa_momo_client_can_read_rendition_v1\(name\)/, "Storage read must reuse the exact eligibility predicate");
  assert.match(sql, /revoke all on function[\s\S]*?from public, anon, authenticated, service_role/);
  assert.match(sql, /grant execute on function[\s\S]*?to authenticated/);
});

test("Forward migration removes legacy broad table and readiness privileges", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20260722000100_momo_client_media_status_v1.sql", import.meta.url), "utf8");
  const hardenedTables = [
    "veroxa_campaign_tracking_contracts",
    "veroxa_content_media_placements",
    "veroxa_external_content_cache",
    "veroxa_growth_evidence_sources",
    "veroxa_media_renditions",
    "veroxa_momo_account_handoffs",
    "veroxa_momo_action_consents",
    "veroxa_momo_authority_events",
    "veroxa_momo_evidence_authorities",
    "veroxa_momo_release_attestations",
    "veroxa_momo_runtime_controls",
    "veroxa_preconnection_gate_runs",
    "veroxa_publication_rehearsals",
    "veroxa_seo_change_sets",
    "veroxa_seo_page_baselines",
  ];
  for (const table of hardenedTables) assert.match(sql, new RegExp(`'${table}'`));
  assert.match(sql, /alter table public\.%I force row level security/);
  assert.match(sql, /revoke all privileges on table public\.%I from public, anon, authenticated, service_role/);
  assert.match(sql, /grant select on[\s\S]*?veroxa_campaign_tracking_contracts[\s\S]*?to authenticated/);
  assert.match(sql, /revoke execute on function[\s\S]*?veroxa_run_momo_readiness_gate_v1\(uuid\)[\s\S]*?veroxa_record_momo_no_go_v1\(uuid,uuid,text,boolean\)[\s\S]*?veroxa_run_momo_preconnection_gate_v1\(uuid\)[\s\S]*?from public, anon, service_role/);
  assert.doesNotMatch(sql, /grant[\s\S]{0,400}\bto service_role\b/i);
});

test("Client readback merge is the only path to Ready and rejects malformed or conflicting rows", () => {
  const restaurantId = "00000000-0000-4000-8000-000000000010";
  const assetId = "00000000-0000-4000-8000-000000000001";
  const snapshot = parseMomoClientSnapshot({
    media: [{
      id: assetId,
      storagePath: `restaurants/${restaurantId}/uploads/2026/07/00000000-0000-4000-8000-000000000099.jpg`,
      displayFileName: "momo.jpg",
      mimeType: "image/jpeg",
      fileSize: 1024,
      status: "ready_to_use",
      createdAt: "2026-07-22T12:00:00.000Z",
      rightsStatus: "confirmed",
      reviewStatus: "approved",
      publicUseApproved: true,
      renditionStatus: "ready",
    }],
  });
  assert.equal(snapshot.media[0].renditionStatus, null, "the broad base snapshot must never create Ready");
  assert.equal(snapshot.mediaReadbackAvailable, false);

  const valid = {
    assetId,
    renditionStatus: "ready",
    renditionStoragePath: `restaurants/${restaurantId}/renditions/${assetId}/${"a".repeat(64)}.jpg`,
    renditionAltText: "Prepared Momo food image.",
    renditionWidth: 1080,
    renditionHeight: 1350,
  };
  const merged = mergeMomoClientMediaReadback(snapshot, [valid], restaurantId);
  assert.equal(merged.mediaReadbackAvailable, true);
  assert.equal(merged.media[0].renditionStatus, "ready");
  assert.equal(merged.media[0].renditionStoragePath, valid.renditionStoragePath);

  for (const invalid of [
    null,
    {},
    [{ ...valid, renditionStoragePath: `restaurants/${restaurantId}/uploads/not-a-rendition.jpg` }],
    [{ ...valid, renditionAltText: "" }],
    [{ ...valid, renditionWidth: 0 }],
    [{ ...valid }, { ...valid }],
    [{ ...valid, assetId: "00000000-0000-4000-8000-000000000099" }],
  ]) {
    const rejected = mergeMomoClientMediaReadback(merged, invalid, restaurantId);
    assert.equal(rejected.media[0].renditionStatus, null);
    assert.equal(rejected.media[0].renditionStoragePath, null);
  }
});

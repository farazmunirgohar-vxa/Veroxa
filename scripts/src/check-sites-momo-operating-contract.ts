import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const data = read("artifacts/veroxa-sites/app/momo-data.ts");
const ui = read("artifacts/veroxa-sites/app/momo-operating-center.tsx");
const teamMediaUi = read(
  "artifacts/veroxa-sites/app/momo-team-preconnection-center.tsx",
);
const clientData = read("artifacts/veroxa-sites/app/momo-client-data.ts");
const clientUi = read("artifacts/veroxa-sites/app/momo-client-portal.tsx");
const teamSummary = read("artifacts/veroxa-sites/app/momo-team-summary.ts");
const page = read("artifacts/veroxa-sites/app/page.tsx");
const mediaGuidance = read("artifacts/veroxa-sites/app/momo-media-guidance.ts");
const manualCycle = read(
  "artifacts/veroxa-sites/app/momo-manual-content-cycle.ts",
);
const operatingGates = read(
  "artifacts/veroxa-sites/app/momo-operating-gates.ts",
);
const gateTests = read(
  "artifacts/veroxa-sites/tests/momo-operating-gates.test.mjs",
);
const hydrationTests = read(
  "artifacts/veroxa-sites/tests/momo-client-snapshot-hydration.test.mjs",
);
const mediaGuidanceTests = read(
  "artifacts/veroxa-sites/tests/momo-media-guidance.test.mjs",
);
const v2TeamSurfaceTests = read(
  "artifacts/veroxa-sites/tests/momo-v2-team-surface.test.mjs",
);
const v2AssetPipelineTests = read(
  "artifacts/veroxa-sites/tests/momo-asset-pipeline-v2.test.mjs",
);
const teamSummaryTests = read(
  "artifacts/veroxa-sites/tests/momo-team-summary.test.mjs",
);
const v2UploadContractTests = read(
  "artifacts/veroxa-sites/tests/momo-upload-veroxa-ready-v2-contract.test.mjs",
);
const clientMediaProjection = read(
  "artifacts/veroxa-sites/supabase/migrations/20260722210026_momo_client_media_status_v1.sql",
);
const v2UploadContract = read(
  "artifacts/veroxa-sites/supabase/migrations/20260802063124_momo_upload_veroxa_ready_v2.sql",
);
const combined = `${data}\n${ui}\n${manualCycle}\n${operatingGates}`;
const failures: string[] = [];
const must = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};
const mustMatch = (source: string, pattern: RegExp, message: string) => {
  must(pattern.test(source), message);
};

const forbidden = [
  '"team_verified"',
  '"restaurant_name"',
  '"street_address"',
  '"dietary_halal_claims"',
  'value="google_business_profile"',
  '"content_variants"',
  '"owner_content_approval"',
  '"team_content_approval"',
  '"manual_follow_up"',
  '"media_review"',
  'value="owner_confirmation"',
  '"content_review"',
  '"connection_check"',
  '"needs_better_version"',
  "RLS protected",
  'source: "owner", is_current: true',
  'approvalKind: item.requires_owner_confirmation ? "owner_confirmation" : "team_review"',
  "attestation_text_sha256",
];
for (const literal of forbidden) {
  must(
    !combined.includes(literal),
    `Sites Momo source contains stale/unsafe literal: ${literal}`,
  );
}

// The unified candidate keeps v2 upload-to-Ready as the active daily workflow,
// adds Team-private assessment intake, and retains v1 only as recovery history.
for (const marker of [
  "Run a private assessment-only food upload or resolve a consolidated exception",
  "EXCEPTION-ONLY QUEUE",
  "Veroxa Ready without Team review",
  "Legacy v1 history & manual recovery",
  "VEROXA READY · UNSCHEDULED",
  "Unscheduled by design",
  "Nothing is scheduled, posted, or externally connected",
  "Team Faraz handles consolidated exceptions only",
  "veroxaReadyPackagesV2",
  "exceptionIncidentsV2",
]) {
  must(
    ui.includes(marker),
    `Sites v36 Team surface is missing its active workflow boundary: ${marker}`,
  );
}
for (const marker of [
  "unscheduled Veroxa Ready",
  "Identical bytes reused only the private visual assessment",
  "Permission and restaurant association remain separate for this upload",
  "Veroxa Ready · unscheduled",
  "Nothing was posted, scheduled, or connected",
]) {
  must(
    clientUi.includes(marker),
    `Sites v36 Client surface is missing its lineage/safety boundary: ${marker}`,
  );
}
for (const marker of [
  'table: "veroxa_momo_media_asset_identity_links_v2"',
  'table: "veroxa_momo_exception_incidents_v2"',
  'table: "veroxa_momo_ready_packages_v2"',
  'equals: { status: "open", external_write_allowed: false }',
  'equals: { status: "veroxa_ready", external_write_allowed: false }',
]) {
  must(
    data.includes(marker),
    `Sites v36 data adapter is missing its fail-closed read model: ${marker}`,
  );
}
for (const marker of [
  "create table public.veroxa_momo_media_asset_identity_links_v2",
  "create table public.veroxa_momo_exception_incidents_v2",
  "create table public.veroxa_momo_ready_packages_v2",
  "link_kind text not null check (link_kind in ('canonical','exact_duplicate'))",
  "rights_id uuid not null references public.veroxa_media_rights(id) on delete restrict",
  "rights_attestation_sha256 text not null check (rights_attestation_sha256 ~ '^[0-9a-f]{64}$')",
  "unique (identity_id, asset_id)",
  "check ((link_kind = 'canonical') = (asset_id = canonical_asset_id))",
  "duplicateRightsCombined', false",
  "externalWriteAllowed', false",
]) {
  must(
    v2UploadContract.includes(marker),
    `Sites v36 database contract is missing its lineage/write lock: ${marker}`,
  );
}
mustMatch(
  v2UploadContract,
  /join public\.veroxa_momo_media_asset_identity_links_v2 link[\s\S]{0,500}link\.asset_id = run\.source_asset_id[\s\S]{0,300}link\.verification_id = run\.intake_verification_id[\s\S]{0,300}link\.rights_id = run\.rights_id[\s\S]{0,300}link\.rights_attestation_sha256 =[\s\S]{0,120}run\.rights_attestation_sha256[\s\S]{0,400}identity\.content_sha256 = run\.source_content_sha256/,
  "Sites v36 processing runs must cohere to one exact identity link, verification, rights record, attestation, and byte hash",
);
mustMatch(
  v2UploadContract,
  /asset\.content_sha256 = run\.source_content_sha256/,
  "Sites v36 processing runs must cohere to the selected upload byte hash",
);

const readyPackagesStart = v2UploadContract.indexOf(
  "create table public.veroxa_momo_ready_packages_v2",
);
const readyVariantsStart = v2UploadContract.indexOf(
  "create table public.veroxa_momo_ready_variants_v2",
  readyPackagesStart + 1,
);
const readyVariantsEnd = v2UploadContract.indexOf(
  "create index veroxa_momo_ready_packages_v2_latest",
  readyVariantsStart + 1,
);
must(
  readyPackagesStart >= 0 &&
    readyVariantsStart > readyPackagesStart &&
    readyVariantsEnd > readyVariantsStart,
  "Sites v36 Veroxa Ready package and variant table boundaries are missing or reordered",
);
const v2ReadyPackageTable =
  readyPackagesStart >= 0 && readyVariantsStart > readyPackagesStart
    ? v2UploadContract.slice(readyPackagesStart, readyVariantsStart)
    : "";
const v2ReadyVariantTable =
  readyVariantsStart >= 0 && readyVariantsEnd > readyVariantsStart
    ? v2UploadContract.slice(readyVariantsStart, readyVariantsEnd)
    : "";
for (const [name, table] of [
  ["package", v2ReadyPackageTable],
  ["variant", v2ReadyVariantTable],
] as const) {
  must(
    table.includes("status text not null check (status = 'veroxa_ready')"),
    `Sites v36 Veroxa Ready ${name} rows must have an immutable readiness status`,
  );
  must(
    table.includes(
      "external_write_allowed boolean not null default false check (not external_write_allowed)",
    ),
    `Sites v36 Veroxa Ready ${name} rows must keep external writes disabled`,
  );
  must(
    !/scheduled_for|timezone|publish/i.test(table),
    `Sites v36 Veroxa Ready ${name} rows must not acquire scheduling or publishing fields`,
  );
}

for (const marker of [
  '["identity.display_name", "identity"',
  '["identity.legal_name", "identity"',
  '["identity.cuisine", "identity"',
  '["address.primary", "address"',
  '["phone.primary", "phone"',
  '["hours.regular", "hours"',
  '["hours.special", "hours"',
  '["menu.primary", "menu"',
  '["services.active", "services"',
  '["services.delivery", "services"',
  '["services.catering", "services"',
  '["claims.dietary", "claims"',
  '["claims.halal", "claims"',
  '["brand.voice", "brand"',
  '["brand.positioning", "brand"',
  '["goals.primary", "goals"',
  '["goals.audience", "goals"',
  '["goals.customer_action", "goals"',
  'item.status === "owner_confirmed"',
  'role === "team" && allowedPair && approval.status === "pending"',
  'decision: "confirm"',
  'decision: "correct"',
  'decision: "needs_help"',
  'decision: "reject"',
  "Run no-credential preflight",
  "Save step review",
  "Save presence review",
  "accessAuthorized",
  "This does not connect or publish anything now",
  "resolveLatestMomoPresenceConfirmation",
  '["connected", "degraded"].includes(accessStatus)',
  'contraryOwnerIntent ? "owner_blocked"',
  "rightsReason.trim().length < 10",
  "Immutable go / no-go evidence",
]) {
  must(
    ui.includes(marker),
    `Sites UI is not aligned to the operating schema: ${marker}`,
  );
}

for (const marker of [
  "usageScope: string[]",
  "p_usage_scope: usageScope",
  'status: "pending"',
  "created_by: user.id",
  'rpc("veroxa_momo_client_snapshot_v1"',
  'rpc("veroxa_review_momo_media_v1"',
  'rpc("veroxa_apply_approval_v1"',
  'if (role === "client")',
  "source: String(item.source)",
  "if (item.reviewStatus)",
  "pendingContentConfirmations",
  "submitMomoContentConfirmation",
  'rpc("veroxa_submit_momo_confirmation_v1"',
  'rpc("veroxa_create_manual_content_draft_v1"',
  'rpc("veroxa_schedule_momo_variant_v1"',
  'rpc("veroxa_transition_work_item_v1"',
  'rpc("veroxa_record_monitor_check_v1"',
  'rpc("veroxa_start_recovery_run_v1"',
  "p_max_attempts: 1",
  'rpc("veroxa_complete_recovery_run_v1"',
  'rpc("veroxa_provider_preflight_v1"',
  'rpc("veroxa_run_momo_readiness_gate_v1"',
  'rpc("veroxa_record_momo_no_go_v1"',
  'rpc("veroxa_run_momo_no_go_rehearsal_v1"',
  'rpc("veroxa_create_momo_report_draft_v1"',
  'rpc("veroxa_record_momo_media_reuse_v1"',
  'rpc("veroxa_queue_momo_publication_v1"',
  'rpc("veroxa_create_truth_revisions_v1"',
  'rpc("veroxa_revoke_momo_media_rights_v1"',
  'rpc("veroxa_register_momo_media_v2"',
  'rpc("veroxa_save_momo_contact_prefill_v1"',
  'rpc("veroxa_add_momo_media_tag_v1"',
  'rpc("veroxa_create_manual_variant_v1"',
  'rpc("veroxa_revise_momo_report_draft_v1"',
  'rpc("veroxa_transition_momo_alert_v1"',
  'rpc("veroxa_update_momo_onboarding_step_v1"',
  'rpc("veroxa_update_momo_presence_v1"',
  'rpc("veroxa_prepare_momo_ai_job_v1"',
  'table: "veroxa_content_input_ledger"',
  'table: "veroxa_activation_decisions"',
  "p_pillar: input.pillar",
  "manual_pillar",
  "attestation_sha256",
  'timezone: String(item.timezone || "America/Chicago")',
  'query.key === "truth" || query.key === "confirmations"',
  "export function hydrateMomoClientSnapshot",
]) {
  must(
    data.includes(marker),
    `Sites data adapter missing a required write contract: ${marker}`,
  );
}

for (const marker of [
  "submitMomoContentConfirmation",
  "data.pendingContentConfirmations",
]) {
  must(
    ui.includes(marker),
    `Sites UI is missing an executable confirmation/approval path: ${marker}`,
  );
}
for (const scope of [
  "instagram",
  "facebook",
  "google_business",
  "website",
  "internal",
]) {
  must(
    ui.includes(`[\"${scope}\"`) || ui.includes(`\"${scope}\",`),
    `Media usage scope option missing: ${scope}`,
  );
}

function functionBody(name: string, nextName: string): string {
  const start = data.indexOf(`export async function ${name}`);
  const end = data.indexOf(`export async function ${nextName}`, start + 1);
  return start >= 0 ? data.slice(start, end >= 0 ? end : data.length) : "";
}

for (const [name, nextName] of [
  ["createMomoContentStrategy", "createMomoContentDraft"],
  ["createMomoWorkItem", "retryMomoWorkItem"],
] as const) {
  const body = functionBody(name, nextName);
  must(Boolean(body), `Sites data adapter function is missing: ${name}`);
  must(
    body.includes("created_by: user.id"),
    `${name} must persist the authenticated creator`,
  );
}

for (const [name, nextName, rpc] of [
  [
    "saveMomoContact",
    "reviewMomoConfirmation",
    "veroxa_save_momo_contact_prefill_v1",
  ],
  ["addMomoMediaTag", "getMomoMediaPreviewUrl", "veroxa_add_momo_media_tag_v1"],
  [
    "createMomoContentDraft",
    "createMomoPlatformVariant",
    "veroxa_create_manual_content_draft_v1",
  ],
  [
    "createMomoPlatformVariant",
    "requestMomoApproval",
    "veroxa_create_manual_variant_v1",
  ],
  [
    "reviseMomoReportDraft",
    "createMomoWorkItem",
    "veroxa_revise_momo_report_draft_v1",
  ],
  [
    "transitionMomoAlert",
    "startMomoRecoveryRun",
    "veroxa_transition_momo_alert_v1",
  ],
  [
    "scheduleMomoVariant",
    "queueMomoPublication",
    "veroxa_schedule_momo_variant_v1",
  ],
] as const) {
  const body = functionBody(name, nextName);
  must(Boolean(body), `Sites data adapter function is missing: ${name}`);
  must(
    body.includes(rpc),
    `${name} must use the transactional ${rpc} contract`,
  );
  must(
    !body.includes('.from("'),
    `${name} must not bypass its transactional RPC`,
  );
}

must(
  !data.includes('.from("veroxa_confirmations").insert'),
  "Client confirmations must use the subject-validating RPC",
);
must(
  !data.includes('.from("veroxa_readiness_dimensions").update'),
  "Readiness cannot be directly marked verified from Sites",
);
must(
  !data.includes('.from("veroxa_provider_connections").update'),
  "Sites cannot directly mark a provider connected",
);
must(
  !data.includes('.from("veroxa_reports").insert'),
  "Sites reports must use server-side Momo-local evidence validation",
);
must(
  !data.includes('.from("veroxa_media_usage").insert'),
  "Sites media reuse must use current rights/review validation",
);
must(
  !data.includes('.from("veroxa_publish_queue").insert'),
  "Sites publication queueing must use approval/provider/calendar validation",
);
must(
  !data.includes('.from("veroxa_restaurant_contacts").insert'),
  "Sites Team contact prefills must use the protected server contract",
);
must(
  !data.includes('.from("veroxa_restaurant_contacts").update'),
  "Sites Team contact edits must use the protected server contract",
);
must(
  !data.includes('.from("veroxa_media_tags").upsert'),
  "Sites media tagging must preserve provenance through the protected server contract",
);
must(
  !data.includes('.from("veroxa_media_asset_tags").upsert'),
  "Sites media links must preserve provenance through the protected server contract",
);
must(
  !data.includes('.from("veroxa_content_variants").insert'),
  "Sites manual variants must use the actor-bound provenance contract",
);
must(
  !data.includes('.from("veroxa_ai_jobs").insert'),
  "Sites AI preparation must use the server-side fail-closed contract",
);
must(
  !data.includes('rpc("veroxa_create_truth_revision_v1"'),
  "Sites must not retain the revoked legacy single-field truth RPC",
);
must(
  ui.includes("momoLocalDate(event.occurred_at)"),
  "Report preview dates must be interpreted in America/Chicago",
);
must(
  ui.includes('["facebook_publish", "instagram_publish"]'),
  "Meta preflight must cover Facebook and Instagram independently",
);
must(
  ui.includes("Revoke future media use"),
  "Owner media rights must have an immediate revocation path",
);
must(
  ui.includes("Reject direction"),
  "Owner content decisions must include a non-confirmation path",
);
must(
  ui.includes("Withdraw profile approval"),
  "Owner presence confirmation must have an audited withdrawal path",
);
must(
  ui.includes("Approve withdrawal"),
  "Team review must be able to apply an owner presence withdrawal",
);
must(
  ui.includes("externalEvidenceWorkTypes"),
  "Provider-facing work and recovery must remain Team-only without source-backed evidence",
);
must(
  ui.includes("team_only_pending_provider_evidence"),
  "Provider-facing completion must preserve its report-evidence boundary",
);
must(
  ui.includes("Start due retry"),
  "Retrying work must re-enter an auditable in-progress attempt only when due",
);
must(
  ui.includes("Save report revision"),
  "Changes-requested reports must have a validated revision lifecycle",
);
must(
  ui.includes("Alert acknowledged with Team evidence"),
  "Manual monitoring alerts must have an audited acknowledgement lifecycle",
);

for (const marker of [
  "fieldKey: string",
  "momoTruthFieldSupportsSensitiveClaim",
  "momoTruthValueSupportsSensitiveClaim",
  "validateMomoPlatformVariantCaption",
  "unsupported_sensitive_claim",
]) {
  must(
    manualCycle.includes(marker),
    `Manual content claim gate missing: ${marker}`,
  );
}
for (const marker of [
  "normalizedMomoHttpsUrl",
  "momoMediaIsCurrentlyUsable",
  "momoConnectionIsCurrentlyEligible",
  "momoCalendarEntryIsCurrentApproved",
  "MOMO_MANUAL_REPORT_NARRATIVES",
  "resolveLatestMomoPresenceConfirmation",
  "momoContentSelectionsAreCurrent",
]) {
  must(
    operatingGates.includes(marker),
    `Behavioral operating gate missing: ${marker}`,
  );
  must(
    gateTests.includes(marker),
    `Behavioral operating gate fixture missing: ${marker}`,
  );
}
for (const marker of [
  "never invents content or variant approval",
  "rejects malformed calendar rows",
  "drops rows whose status is absent",
  "ignores provider and technical-readiness blocks entirely",
]) {
  must(
    hydrationTests.includes(marker),
    `Client snapshot fail-closed fixture missing: ${marker}`,
  );
}

const clientHydrationStart = data.indexOf(
  "export function hydrateMomoClientSnapshot",
);
const clientHydrationEnd = data.indexOf(
  "export async function loadMomoWorkspaceData",
  clientHydrationStart,
);
const clientHydration =
  clientHydrationStart >= 0
    ? data.slice(
        clientHydrationStart,
        clientHydrationEnd >= 0 ? clientHydrationEnd : data.length,
      )
    : "";
must(Boolean(clientHydration), "Client snapshot hydration boundary is missing");
must(
  !clientHydration.includes("raw.connections"),
  "The legacy workspace hydrator must not expose provider connection internals to Client routes",
);
must(
  !clientHydration.includes("raw.readiness"),
  "The legacy workspace hydrator must not expose technical readiness internals to Client routes",
);

// A Team review is evidence only after the private media has actually decoded
// in the browser and the reviewer explicitly confirms the visual inspection.
for (const marker of [
  "export function momoMediaReviewCanSave",
  "input.previewRendered",
  "input.inspectionConfirmed",
  "input.notes.trim().length < 10",
]) {
  must(
    mediaGuidance.includes(marker),
    `Rendered-preview review gate missing: ${marker}`,
  );
}
must(
  ui.includes("momoMediaReviewCanSave"),
  "Team media review must consume the rendered-preview evidence gate",
);
mustMatch(
  ui,
  /onLoadedData=\{\(\) => setPreviewRendered\(true\)\}/,
  "Team video review must wait for successful rendering",
);
mustMatch(
  ui,
  /onLoad=\{\(\) => setPreviewRendered\(true\)\}/,
  "Team image review must wait for successful decoding",
);
must(
  ui.includes("inspectionConfirmed"),
  "Team media review must require an explicit inspection attestation",
);

// Changing the file, preparation scope, expiry, or completing an upload must
// invalidate the earlier checkbox attestation instead of silently reusing it.
must(
  (clientUi.match(/setRightsConfirmed\(false\)/g) || []).length >= 4,
  "Client media changes must invalidate the earlier rights attestation",
);
mustMatch(
  clientUi,
  /const toggle = \(item: string\) => \{\s*setRightsConfirmed\(false\);[\s\S]*?setScope\(/,
  "Changing Client preparation scope must invalidate rights attestation",
);
mustMatch(
  clientUi,
  /const chooseFile = async \(next: File \| null\) => \{[\s\S]*?setRightsConfirmed\(false\);/,
  "Changing the Client file must invalidate rights attestation",
);
mustMatch(
  clientUi,
  /type="date"[\s\S]*?onChange=\{\(event\) => \{ setRightsConfirmed\(false\); setExpiresAt\(/,
  "Changing Client rights expiry must invalidate rights attestation",
);

// Ready is a current-state computation: exact source lineage, owner scope,
// evidence class, write lock, review state, and a rendered derivative all gate it.
for (const marker of [
  'input.sourceKind === "owner_asset"',
  "input.sourceAssetId === input.assetId",
  "input.sourceKey === input.assetId",
  "input.sourceContentSha256 === input.assetContentSha256",
  "input.usageScope.includes(input.intendedUse)",
  "input.renditionEvidenceClass === input.rightsEvidenceClass",
  'input.renditionStatus === "ready"',
  "input.externalWriteAllowed === false",
]) {
  must(
    mediaGuidance.includes(marker),
    `Current rendition eligibility gate missing: ${marker}`,
  );
}
must(
  teamMediaUi.includes("momoRenditionMatchesCurrentEvidence"),
  "Team Ready must re-check current rendition evidence",
);
must(
  teamMediaUi.includes("renderedRenditionId === currentRendition.id"),
  "Team Ready must require the current derivative to render successfully",
);
mustMatch(
  teamMediaUi,
  /await persistMomoImageRendition\([\s\S]*?if \(asset\) await onWorkspaceRefresh\?\.\(\);/,
  "A real rendition save must refresh the authoritative parent workspace before Ready is evaluated",
);
const mediaPanelStart = ui.indexOf("function MediaPanel");
const manualRecoveryStart = ui.indexOf("{recoveryAsset &&", mediaPanelStart);
must(
  mediaPanelStart >= 0 && manualRecoveryStart > mediaPanelStart,
  "The v36 Team media routine/recovery boundary is missing",
);
const routineMediaSurface =
  mediaPanelStart >= 0 && manualRecoveryStart > mediaPanelStart
    ? ui.slice(mediaPanelStart, manualRecoveryStart)
    : "";
must(
  !routineMediaSurface.includes('<MomoTeamPreconnectionCenter mode="media"'),
  "The active v36 Team surface must not route routine uploads through the legacy manual rendition editor",
);
must(
  ui.includes("selected processing upload") &&
    clientUi.includes("Permission and restaurant association remain separate for this upload"),
  "Team Ready diagnostics must retain source lineage while the Client surface stays implementation-safe",
);
const readyCardStart = ui.indexOf("function VeroxaReadyPackageCard");
const readyCardEnd = ui.indexOf("function ContentPanel", readyCardStart + 1);
must(
  readyCardStart >= 0 && readyCardEnd > readyCardStart,
  "The v36 Veroxa Ready card boundary is missing",
);
const readyCard =
  readyCardStart >= 0 && readyCardEnd > readyCardStart
    ? ui.slice(readyCardStart, readyCardEnd)
    : "";
must(
  !/scheduled_for|scheduledFor|ready_to_post|getMomoReadyPackageStatus/.test(
    readyCard,
  ),
  "The active v36 Ready card must not inherit legacy scheduling or approval semantics",
);

for (const marker of [
  "data.exceptionIncidentsV2 ?? []",
  'item.status === "open"',
  'run.decision_mode === "automation_policy_v2"',
  "data.veroxaReadyPackagesV2 ?? []",
  "new Set(identityLinks.map((item) => item.identity_id)).size",
  "latestAutomationRunByIdentity.get(item.identity_id)?.id === item.content_ai_run_id",
]) {
  must(
    teamSummary.includes(marker),
    `The Team home summary is missing its v36 exception/readiness boundary: ${marker}`,
  );
}

// Both roles need a plainly labelled escape hatch; account avatars alone are
// navigation, not a discoverable sign-out control.
mustMatch(
  clientUi,
  /className="client-sign-out"[\s\S]*?onClick=\{signOut\}[\s\S]*?>Sign out<\/button>/,
  "Client desktop must expose an explicit sign-out action",
);
mustMatch(
  clientUi,
  /className="client-more-sign-out"[\s\S]*?onClick=\{signOut\}[\s\S]*?>Sign out of Veroxa<\/button>/,
  "Client mobile navigation must expose an explicit sign-out action",
);
mustMatch(
  page,
  /className="top-sign-out"[\s\S]*?handleSignOut\(\)[\s\S]*?Sign out/,
  "Team desktop must expose an explicit sign-out action",
);
mustMatch(
  page,
  /className="team-mobile-sign-out"[\s\S]*?handleSignOut\(\)[\s\S]*?Sign out/,
  "Team mobile navigation must expose an explicit sign-out action",
);

// Client Ready data comes from a minimal tenant-scoped projection. The broad
// snapshot cannot mint rendition readiness, and malformed projection rows clear it.
for (const marker of [
  "mediaReadbackAvailable: false",
  "renditionStatus: null",
  "export function mergeMomoClientMediaReadback",
  "knownAssetIds.has(assetId)",
  "pathParts[1] === restaurantId",
  'rpc("veroxa_momo_client_media_status_v1"',
]) {
  must(
    clientData.includes(marker),
    `Client media projection boundary missing: ${marker}`,
  );
}
for (const marker of [
  "security definer",
  "set search_path = ''",
  "veroxa_current_user_has_active_restaurant(target_restaurant_id)",
  "rights.evidence_class = caller_evidence_class",
  "review.is_current",
  "review.status = 'approved'",
  "review.public_use_approved",
  "rendition.source_kind = 'owner_asset'",
  "rendition.source_key = asset.id::text",
  "rendition.source_content_sha256 = asset.content_sha256",
  "rights.usage_scope ? rendition.intended_use",
  "rendition.output_hash_attested_at is not null",
  "not rendition.external_write_allowed",
  "object.version = rendition.storage_object_version",
  "public.veroxa_momo_client_can_read_rendition_v1(name)",
  "from public, anon, authenticated, service_role",
  "to authenticated",
]) {
  must(
    clientMediaProjection.includes(marker),
    `Tenant-safe Client rendition projection missing: ${marker}`,
  );
}
for (const privateKey of ["contentSha256", "recipe", "renditionId"]) {
  must(
    !clientMediaProjection.includes(`'${privateKey}'`),
    `Client rendition projection exposes Team-only field: ${privateKey}`,
  );
}
for (const marker of [
  "alter table public.%I force row level security",
  "revoke all privileges on table public.%I from public, anon, authenticated, service_role",
  "public.veroxa_run_momo_readiness_gate_v1(uuid)",
  "public.veroxa_record_momo_no_go_v1(uuid,uuid,text,boolean)",
  "public.veroxa_run_momo_preconnection_gate_v1(uuid)",
  "from public, anon, service_role",
]) {
  must(
    clientMediaProjection.includes(marker),
    `Forward-only migration hardening missing: ${marker}`,
  );
}
must(
  !/grant[\s\S]{0,400}\bto service_role\b/i.test(clientMediaProjection),
  "Forward-only migration must not restore a direct service-role table or function grant",
);
for (const fixture of [
  "Team review cannot be saved from a signed URL alone",
  "Team rendition eligibility follows current lineage, scope, evidence, and write lock",
  "Client rendition projection exposes only a fail-closed per-asset Ready status",
  "Forward migration removes legacy broad table and readiness privileges",
  "Client readback merge is the only path to Ready and rejects malformed or conflicting rows",
  "Client v3 readback accepts only sanitized coherent pipeline states",
  "File, scope, expiry, and completed upload must invalidate the prior rights attestation",
]) {
  must(
    mediaGuidanceTests.toLowerCase().includes(fixture.toLowerCase()),
    `Executable media safety fixture missing: ${fixture}`,
  );
}

for (const fixture of [
  "Team v2 reads are scoped to open incidents, unscheduled Ready, and active legacy jobs",
  "Team media supports assessment-only recognition while content remains decision-scoped",
  "Client copy presents safe outcomes without internal processing details",
]) {
  must(
    v2TeamSurfaceTests.includes(fixture),
    `Executable v36 Team/Client fixture missing: ${fixture}`,
  );
}
for (const fixture of [
  "v2 pending_review means automatic finalization, never Team review",
  "canonical and duplicate cards share Ready while naming the concrete rights-bearing source",
  "v2 UI fails closed when Ready points at a different source or an incident is open",
]) {
  must(
    v2AssetPipelineTests.includes(fixture),
    `Executable v36 pipeline fixture missing: ${fixture}`,
  );
}
for (const fixture of [
  "only unresolved consolidated v2 incidents create media or content attention",
  "raw provider and routine media rows cannot overstate readiness or create an exception",
  "v2 completion is Veroxa Ready without treating legacy scheduled rows as current",
  "exact duplicate uploads count as one identity and only its latest run can be Ready",
]) {
  must(
    teamSummaryTests.includes(fixture),
    `Executable v36 Team summary fixture missing: ${fixture}`,
  );
}
for (const marker of [
  "processing selects one deterministic current exact link and never unions or copies rights",
  "duplicateRightsCombined', false",
  "materialize_veroxa_ready",
  "externalWriteAllowed', false",
]) {
  must(
    v2UploadContractTests.includes(marker),
    `Executable v36 lineage fixture missing: ${marker}`,
  );
}

for (const marker of [
  "status: input.status",
  'status: "pending"',
  'status: "queued"',
]) {
  must(data.includes(marker), `Sites write status contract missing: ${marker}`);
}

if (failures.length) {
  console.error(
    "Sites Momo operating contract failed:\n" +
      failures.map((failure) => `- ${failure}`).join("\n"),
  );
  process.exit(1);
}

console.log("Sites Momo operating contract passed.");

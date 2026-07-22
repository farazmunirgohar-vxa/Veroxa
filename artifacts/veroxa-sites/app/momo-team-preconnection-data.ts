import { getVeroxaSupabase } from "./veroxa-supabase";
import type { MomoImageEditPlan } from "./momo-media-workflow";
import {
  runMomoPublicationRehearsal,
  type MomoRehearsalScenario,
} from "./momo-publication-rehearsal";
import {
  analyzeMomoSeoEvidence,
  buildMomoSeoChangePlan,
  type MomoSeoPageEvidence,
} from "./momo-seo-workbench";
import { momoSha256 } from "./momo-media-workflow";
import { runMomoAiContractRehearsal } from "./momo-ai-automation-rehearsal";
import { normalizeMomoMetricsRehearsal, type MomoMetricsSource } from "./momo-metrics-rehearsal";
import { inspectMomoImageBlob } from "./momo-image-renderer";

export type MomoTeamPreconnectionData = {
  runtimeControls: Array<{
    restaurant_id: string;
    ai_live_calls: boolean;
    provider_writes: boolean;
    review_replies: boolean;
    website_writes: boolean;
    external_scheduling: boolean;
    updated_at: string;
  }>;
  renditions: Array<{
    id: string;
    source_kind: string;
    source_asset_id: string | null;
    source_key: string;
    source_content_sha256: string;
    storage_path: string;
    mime_type: string;
    file_size: number;
    width: number;
    height: number;
    content_sha256: string;
    recipe_fingerprint: string;
    edit_recipe: unknown;
    intended_use: string;
    alt_text: string;
    evidence_class: string;
    status: string;
    external_write_allowed: false;
    created_at: string;
  }>;
  publicationRehearsals: Array<{
    id: string;
    subject_key: string;
    channel: string;
    payload_sha256: string;
    scenario: MomoRehearsalScenario;
    status: string;
    attempts: unknown;
    simulated_receipt: unknown;
    evidence_class: string;
    external_write_allowed: false;
    created_at: string;
  }>;
  seoBaselines: Array<{
    id: string;
    page_url: string;
    page_type: string;
    observed_at: string;
    findings: unknown;
    baseline_sha256: string;
    evidence_class: string;
    created_at: string;
  }>;
  seoChangeSets: Array<{
    id: string;
    baseline_id: string;
    target_url: string;
    proposed_changes: unknown;
    proposed_sha256: string;
    rollback_snapshot: unknown;
    blocked_live_reasons: unknown;
    status: string;
    external_write_allowed: false;
    created_at: string;
  }>;
  gateRuns: Array<{
    id: string;
    status: "pass" | "blocked";
    checks: Record<string, boolean>;
    blockers: string[];
    can_request_owner_access: boolean;
    can_activate: false;
    evaluated_at: string;
  }>;
  actionConsents: Array<{
    id: string;
    action_kind: string;
    subject_key: string;
    client_description: string;
    scope_snapshot: Record<string, unknown>;
    status: string;
    requested_at: string;
    expires_at: string;
    decided_at: string | null;
    revoked_at: string | null;
  }>;
  trackingContracts: Array<{
    id: string;
    subject_key: string;
    platform: string;
    tagged_url: string;
    mapping_sha256: string;
    pii_scan_passed: boolean;
    external_write_allowed: false;
    created_at: string;
  }>;
  releaseAttestations: Array<{
    id: string;
    release_key: string;
    test_count: number;
    checks: Record<string, boolean>;
    status: "passed";
    verified_at: string;
  }>;
  aiRehearsals: Array<{
    id: string;
    prompt_version: string;
    model_key: string | null;
    input_sha256: string | null;
    output_sha256: string | null;
    grounding_report: Record<string, unknown>;
    evidence_keys: unknown;
    provider_called: false;
    external_write_allowed: false;
    human_review_required: true;
    status: string;
    rehearsal_attested_at: string | null;
  }>;
  metricsRehearsals: Array<{
    id: string;
    source: MomoMetricsSource;
    period_start: string;
    period_end: string;
    metrics: Record<string, number>;
    snapshot_sha256: string | null;
    evidence_class: string;
    external_write_allowed: false;
    captured_at: string;
  }>;
};

export const MOMO_PUBLIC_SEO_EVIDENCE: MomoSeoPageEvidence[] = [
  {
    url: "https://momohousesa.com/",
    observedAt: "2026-07-16T00:00:00.000Z",
    title: "Best Momos in Town | Momo House San Antonio (Nepali Style Dumplings) | Momos near me",
    text: "THIS IS A NON LIVE LOCATION",
    listedAddress: "4447 De Zavala Rd, San Antonio, TX",
    listedHours: ["Sun 11–8; Mon–Thu 11–7; Fri–Sat 11–9"],
  },
  {
    url: "https://momohousesa.com/menu",
    observedAt: "2026-07-16T00:00:00.000Z",
    title: "Momo House menu",
    text: "THIS IS A NON LIVE LOCATION",
    menuPrices: ["$0.00", "$0.00", "$0.00", "$0.00", "$0.00", "$0.00", "$0.00", "$0.00"],
    orderingClosed: true,
  },
  {
    url: "https://momohousesa.com/story",
    observedAt: "2026-07-16T00:00:00.000Z",
    title: "Momo House story",
    text: "THIS IS A NON LIVE LOCATION",
  },
  {
    url: "https://momohousesa.com/catering",
    observedAt: "2026-07-16T00:00:00.000Z",
    title: "Momo House catering",
    text: "THIS IS A NON LIVE LOCATION",
    listedHours: ["Sun–Thu 11–9; Fri–Sat 11–10:30"],
  },
];

function requiredClient() {
  const client = getVeroxaSupabase();
  if (!client) throw new Error("configuration_unavailable");
  return client;
}

function isMomoStorageObjectConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { status?: unknown; statusCode?: unknown; message?: unknown };
  return Number(candidate.status) === 409
    || String(candidate.statusCode || "").toLowerCase() === "duplicate"
    || /already exists|duplicate/i.test(String(candidate.message || ""));
}

export async function loadMomoTeamPreconnectionData(restaurantId: string): Promise<MomoTeamPreconnectionData> {
  const client = requiredClient();
  const queries = await Promise.all([
    client.from("veroxa_momo_runtime_controls").select("restaurant_id, ai_live_calls, provider_writes, review_replies, website_writes, external_scheduling, updated_at").eq("restaurant_id", restaurantId),
    client.from("veroxa_media_renditions").select("id, source_kind, source_asset_id, source_key, source_content_sha256, storage_path, mime_type, file_size, width, height, content_sha256, recipe_fingerprint, edit_recipe, intended_use, alt_text, evidence_class, status, external_write_allowed, created_at").eq("restaurant_id", restaurantId).order("created_at", { ascending: false }).limit(25),
    client.from("veroxa_publication_rehearsals").select("id, subject_key, channel, payload_sha256, scenario, status, attempts, simulated_receipt, evidence_class, external_write_allowed, created_at").eq("restaurant_id", restaurantId).order("created_at", { ascending: false }).limit(25),
    client.from("veroxa_seo_page_baselines").select("id, page_url, page_type, observed_at, findings, baseline_sha256, evidence_class, created_at").eq("restaurant_id", restaurantId).order("created_at", { ascending: false }).limit(25),
    client.from("veroxa_seo_change_sets").select("id, baseline_id, target_url, proposed_changes, proposed_sha256, rollback_snapshot, blocked_live_reasons, status, external_write_allowed, created_at").eq("restaurant_id", restaurantId).order("created_at", { ascending: false }).limit(25),
    client.from("veroxa_preconnection_gate_runs").select("id, status, checks, blockers, can_request_owner_access, can_activate, evaluated_at").eq("restaurant_id", restaurantId).order("evaluated_at", { ascending: false }).limit(10),
    client.from("veroxa_momo_action_consents").select("id, action_kind, subject_key, client_description, scope_snapshot, status, requested_at, expires_at, decided_at, revoked_at").eq("restaurant_id", restaurantId).order("requested_at", { ascending: false }).limit(25),
    client.from("veroxa_campaign_tracking_contracts").select("id, subject_key, platform, tagged_url, mapping_sha256, pii_scan_passed, external_write_allowed, created_at").eq("restaurant_id", restaurantId).order("created_at", { ascending: false }).limit(25),
    client.from("veroxa_momo_release_attestations").select("id, release_key, test_count, checks, status, verified_at").eq("restaurant_id", restaurantId).order("verified_at", { ascending: false }).limit(10),
    client.from("veroxa_ai_jobs").select("id, prompt_version, model_key, input_sha256, output_sha256, grounding_report, evidence_keys, provider_called, external_write_allowed, human_review_required, status, rehearsal_attested_at").eq("restaurant_id", restaurantId).eq("rehearsal_contract_version", "momo-ai-contract-rehearsal-v1").order("created_at", { ascending: false }).limit(10),
    client.from("veroxa_visibility_snapshots").select("id, source, period_start, period_end, metrics, snapshot_sha256, evidence_class, external_write_allowed, captured_at").eq("restaurant_id", restaurantId).eq("schema_version", "momo-metrics-rehearsal-v1").order("captured_at", { ascending: false }).limit(20),
  ]);
  if (queries.some((query) => query.error)) throw new Error("preconnection_data_unavailable");
  return {
    runtimeControls: (queries[0].data || []) as MomoTeamPreconnectionData["runtimeControls"],
    renditions: (queries[1].data || []) as MomoTeamPreconnectionData["renditions"],
    publicationRehearsals: (queries[2].data || []) as MomoTeamPreconnectionData["publicationRehearsals"],
    seoBaselines: (queries[3].data || []) as MomoTeamPreconnectionData["seoBaselines"],
    seoChangeSets: (queries[4].data || []) as MomoTeamPreconnectionData["seoChangeSets"],
    gateRuns: (queries[5].data || []) as MomoTeamPreconnectionData["gateRuns"],
    actionConsents: (queries[6].data || []) as MomoTeamPreconnectionData["actionConsents"],
    trackingContracts: (queries[7].data || []) as MomoTeamPreconnectionData["trackingContracts"],
    releaseAttestations: (queries[8].data || []) as MomoTeamPreconnectionData["releaseAttestations"],
    aiRehearsals: (queries[9].data || []) as MomoTeamPreconnectionData["aiRehearsals"],
    metricsRehearsals: (queries[10].data || []) as MomoTeamPreconnectionData["metricsRehearsals"],
  };
}

export async function momoBlobSha256(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function persistMomoImageRendition(input: {
  restaurantId: string;
  sourceKind: "owner_asset" | "synthetic_fixture";
  sourceAssetId: string | null;
  sourceKey: string;
  sourceContentSha256: string;
  sourceWidth: number;
  sourceHeight: number;
  plan: MomoImageEditPlan;
  output: Blob;
  evidenceClass: "development_proxy" | "synthetic" | "real_owner";
}): Promise<string> {
  const client = requiredClient();
  const rendered = await inspectMomoImageBlob(input.output);
  if (rendered.mimeType !== input.plan.outputMimeType
    || rendered.width !== input.plan.outputWidth
    || rendered.height !== input.plan.outputHeight
    || rendered.fileSize !== input.output.size) throw new Error("rendition_output_mismatch");
  const outputSha256 = await momoBlobSha256(input.output);
  if (input.sourceKind === "owner_asset" && input.sourceAssetId) {
    const original = await client.rpc("veroxa_record_momo_original_metadata_v1", {
      p_restaurant_id: input.restaurantId,
      p_asset_id: input.sourceAssetId,
      p_content_sha256: input.sourceContentSha256,
      p_width: input.sourceWidth,
      p_height: input.sourceHeight,
    });
    if (original.error || original.data !== input.sourceAssetId) throw new Error("original_metadata_registration_failed");
  }
  const prepared = await client.rpc("veroxa_prepare_momo_rendition_v1", {
    p_restaurant_id: input.restaurantId,
    p_source_kind: input.sourceKind,
    p_source_asset_id: input.sourceAssetId,
    p_source_key: input.sourceKey,
    p_source_content_sha256: input.sourceContentSha256,
    p_mime_type: input.plan.outputMimeType,
    p_width: input.plan.outputWidth,
    p_height: input.plan.outputHeight,
    p_edit_recipe: input.plan.recipe,
    p_intended_use: input.plan.intendedUse,
    p_alt_text: input.plan.recipe.altText,
    p_evidence_class: input.evidenceClass,
  });
  const reservation = (Array.isArray(prepared.data) ? prepared.data[0] : prepared.data) as Record<string, unknown> | null;
  if (prepared.error || !reservation || typeof reservation.recipe_fingerprint !== "string" || typeof reservation.storage_path !== "string") {
    throw new Error("rendition_preparation_failed");
  }
  const recipeFingerprint = reservation.recipe_fingerprint;
  const storagePath = reservation.storage_path;
  const existing = await client.from("veroxa_media_renditions").select("id")
    .eq("restaurant_id", input.restaurantId).eq("recipe_fingerprint", recipeFingerprint).maybeSingle();
  if (existing.error) throw new Error("rendition_lookup_failed");
  if (existing.data?.id) return existing.data.id;
  const storage = client.storage.from("restaurant-media");
  const uploaded = await storage.upload(storagePath, input.output, {
    contentType: input.plan.outputMimeType,
    upsert: false,
  });
  const uploadedByThisAttempt = !uploaded.error;
  if (uploaded.error && !isMomoStorageObjectConflict(uploaded.error)) throw new Error("rendition_upload_failed");
  let registrationAttempted = false;
  try {
    // Read the private object back through the authenticated Storage policy.
    // Registration occurs only after the stored bytes, MIME type, size, and
    // decoded dimensions match the locally rendered output.
    const objectInfo = await storage.info(storagePath);
    if (objectInfo.error || !objectInfo.data) throw new Error("rendition_info_readback_failed");
    const storedMetadataMime = String(objectInfo.data.contentType || "").split(";", 1)[0].trim().toLowerCase();
    if (objectInfo.data.size !== input.output.size || storedMetadataMime !== input.plan.outputMimeType) {
      throw new Error("rendition_metadata_mismatch");
    }
    const downloaded = await storage.download(
      storagePath,
      { cacheNonce: outputSha256 },
      { cache: "no-store" },
    );
    if (downloaded.error || !downloaded.data) throw new Error("rendition_readback_failed");
    const storedSha256 = await momoBlobSha256(downloaded.data);
    const stored = await inspectMomoImageBlob(downloaded.data);
    if (storedSha256 !== outputSha256
      || stored.mimeType !== input.plan.outputMimeType
      || stored.fileSize !== input.output.size
      || stored.width !== input.plan.outputWidth
      || stored.height !== input.plan.outputHeight) {
      throw new Error("rendition_readback_mismatch");
    }
    registrationAttempted = true;
    const saved = await client.rpc("veroxa_register_momo_rendition_v1", {
      p_restaurant_id: input.restaurantId,
      p_source_kind: input.sourceKind,
      p_source_asset_id: input.sourceAssetId,
      p_source_key: input.sourceKey,
      p_source_content_sha256: input.sourceContentSha256,
      p_storage_path: storagePath,
      p_mime_type: input.plan.outputMimeType,
      p_file_size: input.output.size,
      p_width: input.plan.outputWidth,
      p_height: input.plan.outputHeight,
      p_content_sha256: outputSha256,
      p_recipe_fingerprint: recipeFingerprint,
      p_edit_recipe: input.plan.recipe,
      p_intended_use: input.plan.intendedUse,
      p_alt_text: input.plan.recipe.altText,
      p_evidence_class: input.evidenceClass,
    });
    if (saved.error || typeof saved.data !== "string") {
      const committed = await client.from("veroxa_media_renditions").select("id")
        .eq("restaurant_id", input.restaurantId).eq("recipe_fingerprint", recipeFingerprint).maybeSingle();
      if (!committed.error && committed.data?.id) return committed.data.id;
      if (committed.error) throw new Error("rendition_registration_state_unknown");
      throw new Error("rendition_registration_failed");
    }
    return saved.data;
  } catch (error) {
    if (registrationAttempted) {
      const committed = await client.from("veroxa_media_renditions").select("id")
        .eq("restaurant_id", input.restaurantId).eq("recipe_fingerprint", recipeFingerprint).maybeSingle();
      if (!committed.error && committed.data?.id) return committed.data.id;
      // Once the RPC crossed the network boundary its commit outcome can be
      // delayed or its response can be lost. Preserve the verified object and
      // fail closed; a retry can recover it by hash and register idempotently.
      throw new Error("rendition_registration_state_unknown", { cause: error });
    }
    if (uploadedByThisAttempt) {
      const removed = await storage.remove([storagePath]);
      if (removed.error) throw new Error("rendition_cleanup_failed", { cause: error });
    }
    throw error;
  }
}

export async function getMomoTeamMediaSource(storagePath: string): Promise<Blob> {
  const client = requiredClient();
  const signed = await client.storage.from("restaurant-media").createSignedUrl(storagePath, 300);
  if (signed.error || !signed.data?.signedUrl) throw new Error("media_source_unavailable");
  const response = await fetch(signed.data.signedUrl, { cache: "no-store" });
  if (!response.ok) throw new Error("media_source_unavailable");
  return response.blob();
}

export async function persistMomoAiContractRehearsal(restaurantId: string): Promise<void> {
  const client = requiredClient();
  const rehearsal = await runMomoAiContractRehearsal({
    restaurantId,
    restaurantName: "Momo's House San Antonio",
    objective: "Verify the provider-neutral Momo content output, grounding, and human-review contract without a model call.",
    facts: [
      { key: "workflow_fixture", value: "Synthetic Team-only preconnection rehearsal", evidenceClass: "synthetic" },
      { key: "public_site_origin", value: "https://momohousesa.com/", evidenceClass: "synthetic" },
    ],
    channels: ["facebook", "instagram", "google_business"],
  });
  const saved = await client.rpc("veroxa_record_momo_ai_contract_rehearsal_v1", {
    p_restaurant_id: restaurantId,
    p_subject_key: "momo_ai_content_contract_v1",
    p_input_snapshot: rehearsal.inputSnapshot,
    p_output_snapshot: rehearsal.outputSnapshot,
    p_grounding_report: rehearsal.groundingReport,
    p_evidence_keys: rehearsal.evidenceKeys,
  });
  if (saved.error || typeof saved.data !== "string") throw new Error("ai_contract_rehearsal_save_failed");
}

export async function persistMomoPublicationRehearsalSuite(
  restaurantId: string,
  renditions: MomoTeamPreconnectionData["renditions"],
): Promise<void> {
  const client = requiredClient();
  const approvalSnapshotSha256 = await momoSha256("momo-synthetic-approval-snapshot-v1");
  const scheduledFor = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const scenarios: MomoRehearsalScenario[] = ["success", "transient_then_success", "permanent_failure"];
  const channels = ["facebook", "instagram", "google_business"] as const;
  for (const channel of channels) {
    const rendition = renditions.find((item) => item.source_kind === "synthetic_fixture"
      && item.intended_use === channel && item.status === "ready" && !item.external_write_allowed);
    if (!rendition) throw new Error(`synthetic_${channel}_rendition_required`);
    for (const scenario of scenarios) {
      const result = await runMomoPublicationRehearsal({
        restaurantId,
        variantId: `synthetic-${channel}-${scenario}`,
        channel,
        caption: `Momo ${channel} publication contract rehearsal: ${scenario}.`,
        scheduledFor,
        timezone: "America/Chicago",
        media: [{ renditionId: rendition.id, contentSha256: rendition.content_sha256, altText: rendition.alt_text }],
        approvalSnapshotSha256,
        evidenceClass: "synthetic",
        scenario,
      });
      const saved = await client.rpc("veroxa_record_momo_publication_rehearsal_v1", {
        p_restaurant_id: restaurantId,
        p_subject_key: `momo_preaccess_${channel}_${scenario}_v1`,
        p_variant_id: null,
        p_channel: result.simulatedReceipt.channel,
        p_payload_snapshot: result.payloadSnapshot,
        p_approval_snapshot_sha256: approvalSnapshotSha256,
        p_scenario: scenario,
        p_status: result.state,
        p_attempts: result.attempts,
        p_simulated_receipt: result.simulatedReceipt,
        p_evidence_class: "synthetic",
      });
      if (saved.error || typeof saved.data !== "string") throw new Error("publication_rehearsal_save_failed");
    }
  }
  for (const platform of [...channels, "website"] as const) {
    const tracking = await client.rpc("veroxa_record_momo_tracking_contract_v1", {
      p_restaurant_id: restaurantId,
      p_subject_key: `momo_preaccess_tracking_${platform}_v1`,
      p_platform: platform,
      p_destination_url: "https://momohousesa.com/",
      p_utm_source: platform,
      p_utm_medium: platform === "website" ? "owned_site" : "organic_social",
      p_utm_campaign: "momo_preaccess_rehearsal",
      p_utm_content: `${platform}_synthetic_contract_v1`,
      p_evidence_class: "synthetic",
    });
    if (tracking.error || typeof tracking.data !== "string") throw new Error("tracking_contract_save_failed");
  }
}

export async function persistMomoMetricsRehearsalSuite(restaurantId: string): Promise<void> {
  const client = requiredClient();
  const end = new Date();
  const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
  const periodStart = start.toISOString().slice(0, 10);
  const periodEnd = end.toISOString().slice(0, 10);
  const fixtures: Array<{ source: MomoMetricsSource; metrics: Record<string, number> }> = [
    { source: "facebook", metrics: { impressions: 100, reach: 80, engagements: 12, clicks: 4 } },
    { source: "instagram", metrics: { impressions: 120, reach: 90, engagements: 18, clicks: 6 } },
    { source: "google_business", metrics: { views: 75, calls: 2, directions: 3, website_clicks: 5 } },
    { source: "website", metrics: { sessions: 50, engaged_sessions: 35, conversions: 0 } },
  ];
  for (const fixture of fixtures) {
    await normalizeMomoMetricsRehearsal({ restaurantId, source: fixture.source, periodStart, periodEnd, metrics: fixture.metrics });
    const saved = await client.rpc("veroxa_record_momo_metrics_rehearsal_v1", {
      p_restaurant_id: restaurantId,
      p_source: fixture.source,
      p_period_start: periodStart,
      p_period_end: periodEnd,
      p_metrics: fixture.metrics,
    });
    if (saved.error || typeof saved.data !== "string") throw new Error("metrics_rehearsal_save_failed");
  }
}

export async function persistMomoSeoWorkspace(restaurantId: string): Promise<void> {
  const client = requiredClient();
  const findings = analyzeMomoSeoEvidence(MOMO_PUBLIC_SEO_EVIDENCE);
  const plan = await buildMomoSeoChangePlan({
    pages: MOMO_PUBLIC_SEO_EVIDENCE,
    evidenceClass: "public_evidence",
    restaurantName: "Momo House",
    locality: "San Antonio",
    cuisine: "Nepali-Style Dumplings",
    address: "4447 De Zavala Rd",
  });
  const baseline = await client.rpc("veroxa_record_momo_seo_baseline_v1", {
    p_restaurant_id: restaurantId,
    p_page_url: MOMO_PUBLIC_SEO_EVIDENCE[0].url,
    p_page_type: "home",
    p_observed_at: MOMO_PUBLIC_SEO_EVIDENCE[0].observedAt,
    p_evidence_snapshot: { pages: MOMO_PUBLIC_SEO_EVIDENCE, observedBy: "public_web_evidence_review" },
    p_findings: findings,
    p_evidence_class: "public_evidence",
  });
  if (baseline.error || typeof baseline.data !== "string") throw new Error("seo_baseline_save_failed");
  const changeSet = await client.rpc("veroxa_record_momo_seo_change_set_v1", {
    p_restaurant_id: restaurantId,
    p_baseline_id: baseline.data,
    p_target_url: plan.targetUrl,
    p_proposed_changes: {
      changes: plan.changes,
      structuredDataDraft: plan.structuredDataDraft,
      schemaVersion: plan.schemaVersion,
    },
    p_rollback_snapshot: plan.rollbackSnapshot,
    p_blocked_live_reasons: plan.blockedLiveReasons,
    p_evidence_class: "public_evidence",
  });
  if (changeSet.error || typeof changeSet.data !== "string") throw new Error("seo_change_set_save_failed");
}

export async function runMomoPreconnectionGate(restaurantId: string): Promise<{
  gate_run_id: string;
  status: "pass" | "blocked";
  can_request_owner_access: boolean;
  can_activate: false;
  blockers: string[];
}> {
  const client = requiredClient();
  const result = await client.rpc("veroxa_run_momo_preconnection_gate_v1", {
    p_restaurant_id: restaurantId,
  });
  const row = (Array.isArray(result.data) ? result.data[0] : result.data) as Record<string, unknown> | null;
  if (result.error || !row || typeof row.gate_run_id !== "string") throw new Error("preconnection_gate_failed");
  return {
    gate_run_id: row.gate_run_id,
    status: row.status === "pass" ? "pass" : "blocked",
    can_request_owner_access: row.can_request_owner_access === true,
    can_activate: false,
    blockers: Array.isArray(row.blockers) ? row.blockers.filter((item): item is string => typeof item === "string") : [],
  };
}

export type MomoActionKind = "business_profile_change" | "review_reply" | "google_post" | "social_post" | "website_change" | "access_connection";

export async function requestMomoActionConsent(input: {
  restaurantId: string;
  actionKind: MomoActionKind;
  subjectKey: string;
  description: string;
  scope: {
    target: string;
    operation: string;
    before?: unknown;
    after?: unknown;
    contentPreview?: string;
    scheduledFor?: string;
    batchSize?: number;
  };
  expiresAt: string;
}): Promise<string> {
  const result = await requiredClient().rpc("veroxa_request_momo_action_consent_v1", {
    p_restaurant_id: input.restaurantId,
    p_action_kind: input.actionKind,
    p_subject_key: input.subjectKey,
    p_client_description: input.description,
    p_scope_snapshot: input.scope,
    p_expires_at: input.expiresAt,
  });
  if (result.error || typeof result.data !== "string") throw new Error("action_consent_request_failed");
  return result.data;
}

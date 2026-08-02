import type { MomoConfirmation, MomoWorkspaceData } from "./momo-data.ts";
import {
  MOMO_CONTENT_AI_MAX_SOURCE_HEIGHT,
  MOMO_CONTENT_AI_MAX_SOURCE_WIDTH,
} from "./momo-content-ai-contract.ts";

export type MomoPublicPlatform = "facebook" | "instagram" | "google_business";
export type MomoMediaScope = MomoPublicPlatform | "website" | "internal";

const MOMO_CONTENT_RESERVATION_STALE_MS = 5 * 60 * 1000;
const MOMO_CONTENT_PROVIDER_STALE_MS = 15 * 60 * 1000;
const MOMO_CONTENT_FINALIZATION_STALE_MS = 5 * 60 * 1000;

export const momoContentAiRunNeedsRecovery = (
  run: MomoWorkspaceData["contentAiRuns"][number],
  now = Date.now(),
): boolean => {
  if (run.status === "result_staged") {
    const updatedAt = Date.parse(run.updated_at);
    return !Number.isFinite(updatedAt) ||
      updatedAt <= now - MOMO_CONTENT_FINALIZATION_STALE_MS;
  }
  if (run.status === "reserved") {
    const requestedAt = Date.parse(run.requested_at);
    return !Number.isFinite(requestedAt) || requestedAt <= now - MOMO_CONTENT_RESERVATION_STALE_MS;
  }
  if (run.status === "provider_running") {
    const providerStartedAt = run.provider_started_at ? Date.parse(run.provider_started_at) : Number.NaN;
    return !Number.isFinite(providerStartedAt) || providerStartedAt <= now - MOMO_CONTENT_PROVIDER_STALE_MS;
  }
  return false;
};

export const momoOriginalMediaMeetsPlatformReadyProfile = (input: {
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
}): boolean => {
  const ratio = input.height > 0 ? input.width / input.height : 0;
  return input.mimeType === "image/jpeg" && input.fileSize >= 10 * 1024 &&
    input.fileSize <= 5 * 1024 * 1024 && input.width >= 320 &&
    input.height >= 250 && input.width <= MOMO_CONTENT_AI_MAX_SOURCE_WIDTH &&
    input.height <= MOMO_CONTENT_AI_MAX_SOURCE_HEIGHT && ratio >= 0.8 && ratio <= 1.91;
};

export type MomoAssetPipelineResolution = {
  state: "uploaded" | "analyzing" | "team_review" | "preparing_content" | "veroxa_ready" | "ready_to_post" | "blocked";
  blockers: string[];
  contentRunId: string | null;
};

export const resolveMomoAssetPipeline = (
  data: MomoWorkspaceData,
  assetId: string,
  now = Date.now(),
): MomoAssetPipelineResolution => {
  const asset = data.media.find((item) => item.id === assetId);
  const intake = data.mediaIntake.find((item) => item.asset_id === assetId && item.status === "verified");
  const identityLink = (data.mediaIdentityLinksV2 ?? []).find((item) => item.asset_id === assetId);
  if (identityLink) {
    const run = data.contentAiRuns.find((item) =>
      item.decision_mode === "automation_policy_v2" &&
      item.automation_identity_id === identityLink.identity_id
    );
    const incident = (data.exceptionIncidentsV2 ?? []).find((item) =>
      item.status === "open" && item.canonical_asset_id === identityLink.canonical_asset_id
    );
    const processingLink = run
      ? (data.mediaIdentityLinksV2 ?? []).find((item) =>
        item.identity_id === identityLink.identity_id && item.asset_id === run.source_asset_id
      )
      : undefined;
    const ready = run
      ? (data.veroxaReadyPackagesV2 ?? []).find((item) =>
        item.identity_id === identityLink.identity_id && item.content_ai_run_id === run.id
      )
      : undefined;
    const identityCoherent = Boolean(
      asset?.content_sha256 && intake &&
      intake.id === identityLink.verification_id &&
      intake.content_sha256 === asset.content_sha256 &&
      identityLink.content_sha256 === asset.content_sha256 &&
      (identityLink.link_kind === "canonical") === (assetId === identityLink.canonical_asset_id),
    );
    const runCoherent = Boolean(
      run && processingLink &&
      processingLink.identity_id === identityLink.identity_id &&
      processingLink.canonical_asset_id === identityLink.canonical_asset_id &&
      processingLink.verification_id === run.intake_verification_id &&
      processingLink.rights_id === run.rights_id &&
      processingLink.rights_attestation_sha256 === run.rights_attestation_sha256 &&
      processingLink.content_sha256 === run.source_content_sha256,
    );
    const readyCoherent = Boolean(
      ready && run && runCoherent &&
      ready.canonical_asset_id === identityLink.canonical_asset_id &&
      ready.source_asset_id === run.source_asset_id &&
      ready.intake_verification_id === run.intake_verification_id &&
      ready.rights_id === run.rights_id &&
      ready.rights_attestation_sha256 === run.rights_attestation_sha256 &&
      ready.source_content_sha256 === run.source_content_sha256 &&
      ready.status === "veroxa_ready" && ready.external_write_allowed === false,
    );

    if (incident) {
      return {
        state: "blocked",
        blockers: stringTokens(incident.blockers).length
          ? stringTokens(incident.blockers)
          : ["A consolidated exception needs Team Faraz."],
        contentRunId: run?.id ?? null,
      };
    }
    if (!identityCoherent) {
      return {
        state: "blocked",
        blockers: ["Canonical byte-identity evidence is incomplete or inconsistent."],
        contentRunId: run?.id ?? null,
      };
    }
    if (run && ["failed", "rejected"].includes(run.status)) {
      return {
        state: "blocked",
        blockers: [run.provider_error_code || "Automatic content preparation failed safely."],
        contentRunId: run.id,
      };
    }
    if (ready) {
      return readyCoherent
        ? { state: "veroxa_ready", blockers: [], contentRunId: run?.id ?? null }
        : {
          state: "blocked",
          blockers: ["Veroxa Ready provenance no longer matches the selected processing source."],
          contentRunId: run?.id ?? null,
        };
    }
    if (run && ["reserved", "provider_running", "result_staged", "pending_review"].includes(run.status)) {
      return runCoherent
        ? { state: "preparing_content", blockers: [], contentRunId: run.id }
        : {
          state: "blocked",
          blockers: ["Automatic preparation source evidence is incomplete or inconsistent."],
          contentRunId: run.id,
        };
    }
    if (run) {
      return {
        state: "blocked",
        blockers: ["Automatic preparation completed without a coherent Veroxa Ready package."],
        contentRunId: run.id,
      };
    }
    return { state: "analyzing", blockers: [], contentRunId: null };
  }
  const rights = data.mediaRights.find((item) => item.asset_id === assetId);
  const review = data.mediaReviews.find((item) => item.asset_id === assetId && item.is_current);
  const run = data.contentAiRuns.find((item) => item.source_asset_id === assetId && !["rejected", "failed"].includes(item.status));
  const ready = data.readyPackages.find((item) => item.source_asset_id === assetId);
  if (ready) {
    const readiness = resolveMomoContentPackageReadiness(data, ready.id, now);
    if (readiness.ready) return { state: "ready_to_post", blockers: [], contentRunId: run?.id ?? null };
  }
  if (run?.status === "provider_running" || run?.status === "reserved" || run?.status === "result_staged") {
    return { state: "preparing_content", blockers: [], contentRunId: run.id };
  }
  if (run?.status === "pending_review") {
    return { state: "team_review", blockers: [], contentRunId: run.id };
  }
  if (ready) {
    const readiness = resolveMomoContentPackageReadiness(data, ready.id, now);
    return { state: "blocked", blockers: readiness.blockers, contentRunId: run?.id ?? null };
  }
  const blockers: string[] = [];
  if (!asset) blockers.push("Media record is missing.");
  if (!intake || !asset?.content_sha256 || intake.content_sha256 !== asset.content_sha256) blockers.push("Server byte verification is required.");
  if (intake && !momoOriginalMediaMeetsPlatformReadyProfile({
    mimeType: intake.detected_mime_type,
    fileSize: intake.file_size,
    width: intake.width,
    height: intake.height,
  })) blockers.push("The exact original does not meet the three-platform Ready image profile.");
  if (rights?.rights_status !== "confirmed" || rights.evidence_class !== "real_owner") blockers.push("Current real-owner usage rights are required.");
  if (rights?.valid_from && Date.parse(rights.valid_from) > now) blockers.push("Usage rights are not active yet.");
  if (rights?.expires_at && Date.parse(rights.expires_at) <= now) blockers.push("Usage rights have expired.");
  if (review?.status !== "approved" || !review.public_use_approved) blockers.push("Team media approval is required.");
  if (review?.public_use_approved && (review.quality_score === null || review.quality_score < 80)) blockers.push("Team media quality must score at least 80.");
  if (!intake) return {
    state: "uploaded",
    blockers: ["Server byte verification has not completed."],
    contentRunId: null,
  };
  if (blockers.length) return { state: "team_review", blockers, contentRunId: null };
  return { state: "team_review", blockers: [], contentRunId: null };
};

export type MomoContentPackageReadiness = {
  ready: boolean;
  blockers: string[];
  variants: MomoWorkspaceData["readyPackageVariants"];
};

export const resolveMomoContentPackageReadiness = (
  data: MomoWorkspaceData,
  readyPackageId: string,
  now = Date.now(),
): MomoContentPackageReadiness => {
  const readyPackage = data.readyPackages.find((item) => item.id === readyPackageId);
  const variants = data.readyPackageVariants.filter((item) => item.ready_package_id === readyPackageId);
  const blockers: string[] = [];
  const authoritative = data.readyPackageStatuses.find((item) => item.ready_package_id === readyPackageId);
  if (!authoritative || authoritative.effective_status !== "ready_to_post") {
    blockers.push(...(authoritative?.blockers.length ? authoritative.blockers : ["Authoritative readiness is unavailable."]));
  }
  if (!readyPackage || readyPackage.status !== "ready_to_post") {
    return { ready: false, blockers: ["Team-approved Ready package is missing."], variants };
  }
  const run = data.contentAiRuns.find((item) => item.id === readyPackage.content_ai_run_id);
  const asset = data.media.find((item) => item.id === readyPackage.source_asset_id);
  const intake = data.mediaIntake.find((item) => item.asset_id === readyPackage.source_asset_id && item.status === "verified");
  const rights = data.mediaRights.find((item) => item.asset_id === readyPackage.source_asset_id);
  const review = data.mediaReviews.find((item) => item.asset_id === readyPackage.source_asset_id && item.is_current);
  if (run?.status !== "materialized" || run.output_sha256 !== readyPackage.approved_payload_sha256 ||
    run.source_storage_path !== readyPackage.source_storage_path ||
    run.source_storage_object_id !== readyPackage.source_storage_object_id ||
    run.source_storage_object_version !== readyPackage.source_storage_object_version ||
    run.source_content_sha256 !== readyPackage.source_content_sha256 ||
    run.review_id !== readyPackage.review_id) blockers.push("Approved package provenance changed.");
  if (!asset?.content_sha256 || asset.content_sha256 !== intake?.content_sha256) blockers.push("Source media verification is no longer current.");
  if (rights?.rights_status !== "confirmed" || rights.evidence_class !== "real_owner") blockers.push("Real-owner media rights are no longer current.");
  if (rights?.valid_from && Date.parse(rights.valid_from) > now) blockers.push("Media rights are not active.");
  if (rights?.expires_at && Date.parse(rights.expires_at) <= now) blockers.push("Media rights expired.");
  if (review?.status !== "approved" || !review.public_use_approved) blockers.push("Current Team media review is not approved.");
  if (!variants.length || variants.length !== run?.target_platforms.length) blockers.push("The approved platform set is incomplete.");
  const scope = new Set(stringTokens(rights?.usage_scope));
  for (const variant of variants) {
    if (variant.media_source_kind !== "original_accepted" ||
      variant.media_asset_id !== readyPackage.source_asset_id ||
      variant.media_review_id !== readyPackage.review_id ||
      variant.media_storage_path !== readyPackage.source_storage_path ||
      variant.media_storage_object_id !== readyPackage.source_storage_object_id ||
      variant.media_storage_object_version !== readyPackage.source_storage_object_version ||
      variant.media_mime_type !== readyPackage.source_mime_type ||
      variant.media_file_size !== readyPackage.source_file_size ||
      variant.media_width !== readyPackage.source_width ||
      variant.media_height !== readyPackage.source_height ||
      variant.media_content_sha256 !== readyPackage.source_content_sha256) {
      blockers.push(`${variant.platform} final media provenance changed.`);
    }
    if (!scope.has(variant.platform)) blockers.push(`${variant.platform} is outside current media rights.`);
    const scheduled = Date.parse(variant.scheduled_for);
    if (variant.timezone !== "America/Chicago" || !Number.isFinite(scheduled) || scheduled <= now) blockers.push(`${variant.platform} needs a future America/Chicago plan.`);
    if (rights?.expires_at && Number.isFinite(scheduled) && scheduled >= Date.parse(rights.expires_at)) blockers.push(`${variant.platform} is planned after rights expire.`);
    if (!variant.alt_text.trim() || variant.alt_text.length < 30) blockers.push(`${variant.platform} alt text is incomplete.`);
    if (variant.platform === "google_business" && (variant.hashtags.length || /#[A-Za-z]/u.test(variant.caption))) blockers.push("Google Business copy cannot contain hashtags.");
    if (variant.platform === "instagram" && (variant.hashtags.length < 3 || variant.hashtags.length > 5)) blockers.push("Instagram requires three to five relevant hashtags.");
    if (variant.platform === "facebook" && variant.hashtags.length > 3) blockers.push("Facebook allows no more than three hashtags.");
    if (variant.seo_phrases.length < 3 || variant.seo_phrases.length > 8) blockers.push(`${variant.platform} SEO phrases are incomplete.`);
  }
  if (data.publishQueue.length) blockers.push("Publishing queue must remain empty in this release.");
  return { ready: blockers.length === 0, blockers: [...new Set(blockers)], variants };
};

const stringTokens = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export const normalizedMomoHttpsUrl = (value: string | null | undefined): string | null => {
  const candidate = value?.trim();
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
};

export const momoMediaIsCurrentlyUsable = (
  data: MomoWorkspaceData,
  assetId: string | null | undefined,
  platform?: MomoMediaScope,
  now = Date.now(),
): boolean => {
  if (!assetId) return false;
  const asset = data.media.find((item) => item.id === assetId);
  const rights = data.mediaRights.find((item) => item.asset_id === assetId);
  const review = data.mediaReviews.find((item) => item.asset_id === assetId && item.is_current);
  const validFrom = rights?.valid_from ? Date.parse(rights.valid_from) : null;
  const expiresAt = rights?.expires_at ? Date.parse(rights.expires_at) : null;
  return Boolean(
    asset?.status === "ready_to_use" &&
    rights?.rights_status === "confirmed" &&
    (validFrom === null || (Number.isFinite(validFrom) && validFrom <= now)) &&
    (expiresAt === null || (Number.isFinite(expiresAt) && expiresAt > now)) &&
    review?.status === "approved" &&
    review.is_current &&
    review.public_use_approved &&
    (!platform || stringTokens(rights?.usage_scope).includes(platform))
  );
};

export const momoConnectionIsCurrentlyEligible = (
  connection: MomoWorkspaceData["connections"][number] | undefined,
  capability: string,
): boolean => {
  if (connection?.status === "connected" && stringTokens(connection.eligible_capabilities).includes(capability)) return true;
  if (!connection || connection.status !== "connected" || !connection.owner_authorized_by || !connection.owner_authorized_at || !connection.last_verified_at) return false;
  const authorizedAt = Date.parse(connection.owner_authorized_at);
  const verifiedAt = Date.parse(connection.last_verified_at);
  return Number.isFinite(authorizedAt) && Number.isFinite(verifiedAt) && verifiedAt >= authorizedAt && stringTokens(connection.capabilities).includes(capability);
};

export const momoCalendarEntryIsCurrentApproved = (
  entry: MomoWorkspaceData["calendar"][number],
  now = Date.now(),
): boolean => {
  const scheduledAt = entry.scheduled_for ? Date.parse(entry.scheduled_for) : Number.NaN;
  return entry.status === "approved" && entry.timezone === "America/Chicago" && Number.isFinite(scheduledAt) && scheduledAt > now;
};

export type MomoPresenceConfirmationResolution = {
  latest: MomoConfirmation | undefined;
  approved: MomoConfirmation | undefined;
  pending: boolean;
  exactUrlConfirmed: boolean;
  accessAuthorized: boolean;
};

export const resolveLatestMomoPresenceConfirmation = (
  confirmations: readonly MomoConfirmation[],
  publicUrl: string | null | undefined,
): MomoPresenceConfirmationResolution => {
  const latest = confirmations
    .map((item, index) => ({ item, index, timestamp: Date.parse(item.created_at) }))
    .sort((left, right) => (Number.isFinite(right.timestamp) ? right.timestamp : 0) - (Number.isFinite(left.timestamp) ? left.timestamp : 0) || left.index - right.index)[0]?.item;
  const pending = Boolean(latest && ["pending", "in_review"].includes(latest.status));
  const approved = latest?.status === "approved" && ["confirm", "correct"].includes(latest.decision || "")
    ? latest
    : undefined;
  const proposed = approved?.proposed_value && typeof approved.proposed_value === "object"
    ? approved.proposed_value as Record<string, unknown>
    : null;
  const normalizedUrl = normalizedMomoHttpsUrl(publicUrl);
  const proposedUrl = typeof proposed?.publicUrl === "string" ? proposed.publicUrl : null;
  const approvedUrl = normalizedMomoHttpsUrl(proposedUrl);
  return {
    latest,
    approved,
    pending,
    exactUrlConfirmed: Boolean(approved && !pending && normalizedUrl && approvedUrl === normalizedUrl && proposedUrl?.trim() === publicUrl?.trim()),
    accessAuthorized: proposed?.accessAuthorized === true,
  };
};

export const momoContentSelectionsAreCurrent = (input: {
  selectedTruthIds: readonly string[];
  currentTruthIds: readonly string[];
  selectedMediaId?: string | null;
  currentMediaIds: readonly string[];
  selectedStrategyId?: string | null;
  currentStrategyIds: readonly string[];
}): boolean => {
  const distinctTruth = new Set(input.selectedTruthIds);
  const currentTruth = new Set(input.currentTruthIds);
  return distinctTruth.size === input.selectedTruthIds.length
    && input.selectedTruthIds.every((id) => currentTruth.has(id))
    && (!input.selectedMediaId || input.currentMediaIds.includes(input.selectedMediaId))
    && (!input.selectedStrategyId || input.currentStrategyIds.includes(input.selectedStrategyId));
};

export const momoTruthFieldIsCurrentlyUsable = (
  data: Pick<MomoWorkspaceData, "truth" | "confirmations">,
  truthFieldId: string | null | undefined,
): boolean => {
  if (!truthFieldId) return false;
  const field = data.truth.find((item) => item.id === truthFieldId);
  if (!field || !field.is_current || field.status !== "owner_confirmed") return false;
  const latest = data.confirmations
    .filter((item) => item.subject_type === "truth_field" && item.subject_id === truthFieldId)
    .map((item, index) => ({ item, index, timestamp: Date.parse(item.created_at) }))
    .sort((left, right) => (Number.isFinite(right.timestamp) ? right.timestamp : 0) - (Number.isFinite(left.timestamp) ? left.timestamp : 0) || left.index - right.index)[0]?.item;
  return !latest || (latest.status === "approved" && ["confirm", "correct"].includes(latest.decision || ""));
};

export const MOMO_MANUAL_REPORT_NARRATIVES = [
  "Manual operating update: Team completed reviewed internal workflow steps for this period. No external outcome is claimed.",
  "Rehearsal update: Team recorded internal testing activity for this period. No external outcome is claimed.",
  "Blocker update: Team documented unresolved operating blockers for this period. No external outcome is claimed.",
] as const;

export const momoReportNarrativeIsSafeWithoutProviderMetrics = (
  narrative: string | null | undefined,
): boolean => {
  const value = narrative?.trim() ?? "";
  return MOMO_MANUAL_REPORT_NARRATIVES.some((allowed) => value === allowed);
};

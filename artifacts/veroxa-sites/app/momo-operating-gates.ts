import type { MomoConfirmation, MomoWorkspaceData } from "./momo-data";

export type MomoPublicPlatform = "facebook" | "instagram" | "google_business";
export type MomoMediaScope = MomoPublicPlatform | "website" | "internal";

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

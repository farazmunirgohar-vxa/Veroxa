/**
 * Visibility Audit — finding → prepared action mapper.
 *
 * This is the bridge that turns audit findings into reviewable prepared actions
 * in the Approval Queue. It produces *seeds* only: the safety fields
 * (`riskLevel`, `approvalRequirement`) are derived later by the rules engine in
 * the store, so the approval gate stays the single source of truth. Nothing here
 * executes, posts, or calls anything external. See docs/VISIBILITY_AUDIT_ENGINE.md.
 */

import type {
  ExecutionMode,
  PreparedActionChannel,
  PreparedActionPriority,
  PreparedActionType,
  ResolvedPreparedActionSeed,
} from "@/domain/preparedActions";
import {
  MAX_PREPARED_ACTIONS_PER_AUDIT,
  type VisibilityAuditFinding,
  type VisibilityAuditResult,
  type VisibilityAuditSeverity,
} from "./types";

const SEVERITY_TO_PRIORITY: Record<
  VisibilityAuditSeverity,
  PreparedActionPriority
> = {
  urgent: "high",
  high: "high",
  medium: "medium",
  low: "low",
};

/** Internal-only action types hold for internal handling; the rest wait safely for later. */
function executionModeFor(
  type: PreparedActionType,
  channel: PreparedActionChannel,
): ExecutionMode {
  if (type === "seo_keyword_update" || type === "internal_follow_up")
    return "internal_only";
  if (channel === "client_communication") return "manual_now";
  return "connector_later";
}

function suggestedNextFor(channel: PreparedActionChannel): string {
  switch (channel) {
    case "website":
      return "Review the prepared copy, then approve or ask the client to confirm details.";
    case "reviews":
      return "Approve to hold this reply for review.";
    case "seo":
      return "Review and fold into the next content plan.";
    case "social_media":
      return "Approve to prepare this post for the next posting window.";
    case "google_business_profile":
      return "Approve to queue this Google update for later.";
    default:
      return "Review and approve when ready.";
  }
}

/**
 * Turn one actionable finding into a prepared-action seed. Returns null when the
 * finding has no concrete prepared-action mapping (informational only).
 */
export function visibilityFindingToPreparedAction(
  finding: VisibilityAuditFinding,
  ctx: { clientId: string; restaurantName: string; generatedAtLabel: string },
): ResolvedPreparedActionSeed | null {
  const {
    preparedChannel,
    preparedType,
    preparedText,
    keywordAngle,
    label,
    requiresClientConfirmation,
  } = finding.recommendation;
  if (!finding.actionable || !preparedChannel || !preparedType) return null;

  return {
    id: `PA-${finding.id}`,
    clientId: ctx.clientId,
    restaurantName: ctx.restaurantName,
    channel: preparedChannel,
    type: preparedType,
    source: "automation_audit",
    title: finding.title,
    reason: finding.detail,
    payload: {
      ...(preparedText ? { preparedText } : {}),
      ...(keywordAngle ? { keywordAngle } : {}),
      ...(requiresClientConfirmation ? { requiresClientConfirmation } : {}),
    },
    priority: SEVERITY_TO_PRIORITY[finding.severity],
    status: "needs_review",
    executionMode: executionModeFor(preparedType, preparedChannel),
    suggestedNext: label || suggestedNextFor(preparedChannel),
    preparedAtLabel: ctx.generatedAtLabel,
    demoOnly: true,
  };
}

/**
 * Generate every prepared-action seed implied by a completed visibility audit.
 * Order follows the audit's own severity ordering.
 */
export function generatePreparedActionsFromVisibilityAudit(
  result: VisibilityAuditResult,
): ResolvedPreparedActionSeed[] {
  const ctx = {
    clientId: result.clientId,
    restaurantName: result.restaurantName,
    generatedAtLabel: result.generatedAtLabel,
  };
  const seen = new Set<string>();
  const deduped: ResolvedPreparedActionSeed[] = [];

  for (const seed of result.findings
    .map((finding) => visibilityFindingToPreparedAction(finding, ctx))
    .filter((item): item is ResolvedPreparedActionSeed => item !== null)) {
    const signature = [
      seed.clientId,
      seed.channel,
      seed.type,
      seed.title.toLowerCase(),
    ].join("::");
    if (seen.has(signature)) continue;
    seen.add(signature);
    deduped.push(seed);
    if (deduped.length >= MAX_PREPARED_ACTIONS_PER_AUDIT) break;
  }

  return deduped;
}

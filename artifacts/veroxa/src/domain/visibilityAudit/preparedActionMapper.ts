/**
 * Visibility finding → Prepared Action mapper.
 *
 * Findings never bypass the central prepared-action safety rules: this mapper
 * does not set riskLevel or approvalRequirement. The preparedActionStore derives
 * both fields from the Prepared Actions rules engine at seed time.
 */

import type { PreparedAction } from "@/domain/preparedActions";
import type { VisibilityAuditFinding } from "./types";

export type VisibilityPreparedActionSeed = Omit<
  PreparedAction,
  "riskLevel" | "approvalRequirement" | "demoOnly" | "executionStatus"
> & {
  executionStatus?: PreparedAction["executionStatus"];
};

export const MAX_VISIBILITY_PREPARED_ACTIONS_PER_RESTAURANT = 2;

function preparedTextForFinding(finding: VisibilityAuditFinding): string | undefined {
  switch (finding.category) {
    case "photos":
      return "Could you send one fresh photo of the dining room, storefront, or best-selling dish this week? A simple phone photo is perfect.";
    case "reviews":
      return "Thank you for taking the time to visit us and share your experience. We appreciate it and hope to welcome you back soon.";
    case "catering":
      return "Catering details to confirm: availability, lead time, serving sizes, minimum order, and current pricing.";
    case "hours":
      return "Please confirm the current regular hours and any upcoming holiday hours before Veroxa prepares a customer-facing update.";
    case "menu":
      return "Please confirm the current menu link and whether prices or availability have changed before Veroxa prepares a menu visibility update.";
    case "business_claims":
      return "Please confirm the exact wording Veroxa may use for any dietary, ingredient, or health-related claim.";
    case "google_profile":
    case "website":
      return "Please confirm the correct business link before Veroxa prepares the next visibility step.";
    default:
      return undefined;
  }
}

function actionTypeForFinding(finding: VisibilityAuditFinding): PreparedAction["type"] {
  switch (finding.category) {
    case "photos":
      return "content_request";
    case "reviews":
      return "review_reply";
    case "menu":
      return "menu_visibility_update";
    case "catering":
    case "business_claims":
      return "website_copy_update";
    case "hours":
    case "google_profile":
    case "website":
    default:
      return "client_reminder";
  }
}

function channelForFinding(finding: VisibilityAuditFinding): PreparedAction["channel"] {
  switch (finding.category) {
    case "reviews":
      return "reviews";
    case "menu":
    case "catering":
    case "business_claims":
    case "website":
      return "website";
    case "photos":
    case "hours":
    case "google_profile":
    default:
      return "client_communication";
  }
}

export function mapVisibilityFindingToPreparedAction(
  finding: VisibilityAuditFinding,
): VisibilityPreparedActionSeed {
  return {
    id: `PA-${finding.id}`,
    clientId: finding.clientId,
    restaurantName: finding.restaurantName,
    channel: channelForFinding(finding),
    type: actionTypeForFinding(finding),
    source: "visibility_audit",
    title: finding.title.replace("Visibility issue: ", "Prepared action: "),
    reason: `${finding.issue} ${finding.evidenceLabel}`,
    payload: {
      preparedText: preparedTextForFinding(finding),
      notes: finding.needsClientConfirmation
        ? `Needs confirmation: ${finding.confirmationTopic ?? "business detail"}.`
        : "Team can review without asking the restaurant first.",
    },
    priority: finding.priority,
    status: finding.needsClientConfirmation ? "needs_client_confirmation" : "needs_review",
    executionMode: "manual_now",
    suggestedNext: finding.needsClientConfirmation
      ? "Ask for confirmation before approving."
      : "Review the prepared action.",
    preparedAtLabel: "Today, 9:20 AM",
  };
}

export function mapVisibilityFindingsToPreparedActions(
  findings: VisibilityAuditFinding[],
): VisibilityPreparedActionSeed[] {
  const perClientCounts = new Map<string, number>();
  const seen = new Set<string>();
  const actions: VisibilityPreparedActionSeed[] = [];

  for (const finding of findings) {
    const currentCount = perClientCounts.get(finding.clientId) ?? 0;
    if (currentCount >= MAX_VISIBILITY_PREPARED_ACTIONS_PER_RESTAURANT) continue;

    const action = mapVisibilityFindingToPreparedAction(finding);
    const dedupeKey = `${action.clientId}:${action.channel}:${action.type}:${action.title}`;
    if (seen.has(dedupeKey)) continue;

    seen.add(dedupeKey);
    perClientCounts.set(finding.clientId, currentCount + 1);
    actions.push(action);
  }

  return actions;
}

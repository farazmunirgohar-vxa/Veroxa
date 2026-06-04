import { VEROXA_PLANS } from "@/data/pricing/veroxaPricing";
import type {
  ClientAccount,
  ClientMediaStatus,
  ClientRiskStatus,
  ContentWorkflowStatus,
  PremiumReadinessStatus,
  ReportWorkflowStatus,
  TeamActionQueueItem,
  TeamClientOverviewItem,
  TeamDailyCommandSummary,
} from "@/domain/operations";

/**
 * Review-mode operational records are non-public, non-demo local contracts for
 * real /client/* and /team/* shells while live production data is disconnected.
 * They are separate from public demo fixtures and First-5 benchmark fixtures.
 * A future Supabase-backed repository can replace this module without changing
 * page-level contracts.
 */
const REVIEW_MODE_CLIENT_ID = "review-client-account";

const clientAccounts: ClientAccount[] = [
  {
    id: REVIEW_MODE_CLIENT_ID,
    businessName: "Restaurant Account in Review",
    planId: "complete_online_presence",
    lifecycleStage: "review_mode",
    portalStatus: "pending_connection",
    mediaStatus: "needs_media",
    contentStatus: "blocked_by_media",
    reportStatus: "empty_until_activity",
    premiumReadinessStatus: "not_eligible_yet",
    createdAt: "2026-05-31T00:00:00.000Z",
    updatedAt: "2026-05-31T00:00:00.000Z",
  },
  {
    id: "client-account-pending-connection",
    businessName: "Client Account Pending Connection",
    planId: "complete_online_presence",
    lifecycleStage: "setup_pending",
    portalStatus: "review_shell",
    mediaStatus: "pending_review",
    contentStatus: "ready_for_review",
    reportStatus: "weekly_update_due",
    premiumReadinessStatus: "assessment_needed",
    createdAt: "2026-05-31T00:00:00.000Z",
    updatedAt: "2026-05-31T00:00:00.000Z",
  },
];

const mediaStatuses: Record<string, ClientMediaStatus> = {
  [REVIEW_MODE_CLIENT_ID]: {
    clientId: REVIEW_MODE_CLIENT_ID,
    usableMediaCount: 0,
    pendingReviewCount: 0,
    needsMoreMedia: true,
    lastMediaReceivedAt: null,
    nextMediaRequest:
      "Send a few clear food, dining room, and exterior photos when ready.",
    clientVisibleMessage:
      "Your media area is ready. Veroxa will ask for content when the account connection is complete.",
    teamInternalMessage:
      "Live media intake is not connected. Keep the client in a calm request-ready state.",
  },
  "client-account-pending-connection": {
    clientId: "client-account-pending-connection",
    usableMediaCount: 8,
    pendingReviewCount: 3,
    needsMoreMedia: false,
    lastMediaReceivedAt: "2026-05-30T16:00:00.000Z",
    nextMediaRequest:
      "Review pending uploads and confirm whether more reels clips are needed.",
    clientVisibleMessage:
      "Veroxa has media ready for review and will let you know if anything else is needed.",
    teamInternalMessage:
      "Pending review media can support the next content preparation pass.",
  },
};

const contentStatuses: Record<string, ContentWorkflowStatus> = {
  [REVIEW_MODE_CLIENT_ID]: {
    clientId: REVIEW_MODE_CLIENT_ID,
    nextContentStatus: "blocked_by_media",
    draftsReady: 0,
    scheduledItems: 0,
    needsHumanReview: false,
    nextPostWindow: null,
    blockedReason: "Waiting for usable restaurant-provided media.",
    clientVisibleMessage:
      "Content preparation will begin once Veroxa has usable media and account setup is complete.",
    teamInternalMessage:
      "No content drafts should be represented as live. Queue media request first.",
  },
  "client-account-pending-connection": {
    clientId: "client-account-pending-connection",
    nextContentStatus: "ready_for_review",
    draftsReady: 2,
    scheduledItems: 0,
    needsHumanReview: true,
    nextPostWindow: "Next available manual posting window after Veroxa review",
    blockedReason: null,
    clientVisibleMessage:
      "Veroxa is preparing upcoming content for team review before anything goes live.",
    teamInternalMessage:
      "Two review-mode drafts can be inspected by Faraz; no connector execution exists.",
  },
};

const reportStatuses: Record<string, ReportWorkflowStatus> = {
  [REVIEW_MODE_CLIENT_ID]: {
    clientId: REVIEW_MODE_CLIENT_ID,
    weeklyUpdateStatus: "not_started",
    monthlyReportStatus: "empty_until_activity",
    lastWeeklyUpdateAt: null,
    lastMonthlyReportAt: null,
    needsReview: false,
    reportEmptyStateReason:
      "Reports need active account work before a meaningful snapshot can be prepared.",
    clientVisibleMessage:
      "Reports will appear after Veroxa has enough account activity to summarize clearly.",
    teamInternalMessage:
      "Keep report queue empty for this account until real operating activity exists.",
  },
  "client-account-pending-connection": {
    clientId: "client-account-pending-connection",
    weeklyUpdateStatus: "ready_for_review",
    monthlyReportStatus: "in_review",
    lastWeeklyUpdateAt: null,
    lastMonthlyReportAt: null,
    needsReview: true,
    reportEmptyStateReason: null,
    clientVisibleMessage:
      "A weekly update can be prepared once the Veroxa team finishes review.",
    teamInternalMessage:
      "Weekly update review shell is ready; monthly report remains a review-mode placeholder.",
  },
};

const riskStatuses: Record<string, ClientRiskStatus> = {
  [REVIEW_MODE_CLIENT_ID]: {
    clientId: REVIEW_MODE_CLIENT_ID,
    riskLevel: "medium",
    reasons: [
      "Live account connection is pending",
      "Usable media supply has not started",
    ],
    nextHumanAction:
      "Confirm account setup status and ask for starter media when appropriate.",
    clientVisibleMessage:
      "Nothing urgent is needed right now. Veroxa will guide the next simple setup step.",
    teamInternalMessage:
      "Primary risk is launch readiness, not performance. Do not show as active client data.",
  },
  "client-account-pending-connection": {
    clientId: "client-account-pending-connection",
    riskLevel: "low",
    reasons: ["Media exists for review", "Content can be prepared manually"],
    nextHumanAction:
      "Review media and prepare the next content item for approval.",
    clientVisibleMessage: "Veroxa is reviewing your next visibility step.",
    teamInternalMessage:
      "Good candidate for the next manual content preparation pass.",
  },
};

const premiumStatuses: Record<string, PremiumReadinessStatus> = {
  [REVIEW_MODE_CLIENT_ID]: {
    eligible: false,
    status: "not_eligible_yet",
    reason:
      "Premium is assessed only after Starter or Growth has operating history.",
    nextStep: "Continue setup and collect enough operating context first.",
    adSpendSeparate: true,
    requiresApproval: true,
  },
  "client-account-pending-connection": {
    eligible: false,
    status: "assessment_needed",
    reason:
      "Growth account may be assessed later, but ads are not active in review mode.",
    nextStep:
      "Complete Veroxa readiness assessment before recommending Premium.",
    adSpendSeparate: true,
    requiresApproval: true,
  },
};

function findAccount(clientId: string): ClientAccount {
  return (
    clientAccounts.find((account) => account.id === clientId) ??
    clientAccounts[0]
  );
}

export function getCurrentClientAccount(): ClientAccount {
  return clientAccounts[0];
}

export function getClientPlan(clientId: string) {
  return VEROXA_PLANS[findAccount(clientId).planId];
}

export function getClientMediaStatus(clientId: string): ClientMediaStatus {
  return mediaStatuses[clientId] ?? mediaStatuses[REVIEW_MODE_CLIENT_ID];
}

export function getClientContentWorkflow(
  clientId: string,
): ContentWorkflowStatus {
  return contentStatuses[clientId] ?? contentStatuses[REVIEW_MODE_CLIENT_ID];
}

export function getClientReportWorkflow(
  clientId: string,
): ReportWorkflowStatus {
  return reportStatuses[clientId] ?? reportStatuses[REVIEW_MODE_CLIENT_ID];
}

export function getClientRiskStatus(clientId: string): ClientRiskStatus {
  return riskStatuses[clientId] ?? riskStatuses[REVIEW_MODE_CLIENT_ID];
}

export function getClientPremiumReadiness(
  clientId: string,
): PremiumReadinessStatus {
  return premiumStatuses[clientId] ?? premiumStatuses[REVIEW_MODE_CLIENT_ID];
}

export function getTeamClientOverview(): TeamClientOverviewItem[] {
  return clientAccounts.map((account) => ({
    account,
    media: getClientMediaStatus(account.id),
    content: getClientContentWorkflow(account.id),
    report: getClientReportWorkflow(account.id),
    risk: getClientRiskStatus(account.id),
    premium: getClientPremiumReadiness(account.id),
  }));
}

export function getTeamActionQueue(): TeamActionQueueItem[] {
  return getTeamClientOverview().flatMap((item): TeamActionQueueItem[] => {
    const actions: TeamActionQueueItem[] = [];
    if (item.media.needsMoreMedia) {
      actions.push({
        id: `${item.account.id}-media-request`,
        clientId: item.account.id,
        clientName: item.account.businessName,
        type: "media_request",
        title: "Media request ready to prepare",
        status: "needs_confirmation",
        priority: "medium",
        nextHumanAction: item.risk.nextHumanAction,
      });
    }
    if (item.content.needsHumanReview) {
      actions.push({
        id: `${item.account.id}-content-review`,
        clientId: item.account.id,
        clientName: item.account.businessName,
        type: "content_preparation",
        title: `${item.content.draftsReady} content item(s) ready for Veroxa review`,
        status: "ready_for_review",
        priority: "medium",
        nextHumanAction: "Review content and queue for later manual handling.",
      });
    }
    if (item.report.needsReview) {
      actions.push({
        id: `${item.account.id}-report-review`,
        clientId: item.account.id,
        clientName: item.account.businessName,
        type: "report_review",
        title: "Weekly update needs Veroxa review",
        status: "ready_for_review",
        priority: "medium",
        nextHumanAction: "Review the update before it is shown to the client.",
      });
    }
    if (item.premium.status === "assessment_needed") {
      actions.push({
        id: `${item.account.id}-premium-assessment`,
        clientId: item.account.id,
        clientName: item.account.businessName,
        type: "premium_readiness",
        title: "Premium readiness assessment can be held for later",
        status: "queued_for_later",
        priority: "low",
        nextHumanAction: item.premium.nextStep,
      });
    }
    return actions;
  });
}

export function getPremiumReadinessCandidates(): TeamClientOverviewItem[] {
  return getTeamClientOverview().filter(
    (item) =>
      item.premium.eligible || item.premium.status === "assessment_needed",
  );
}

export function getTeamDailyCommandSummary(): TeamDailyCommandSummary {
  const overview = getTeamClientOverview();
  const actions = getTeamActionQueue();
  const clientsNeedingMedia = overview.filter(
    (item) => item.media.needsMoreMedia,
  ).length;
  const clientsReadyForContent = overview.filter(
    (item) => item.content.needsHumanReview,
  ).length;
  const reportsNeedingReview = overview.filter(
    (item) => item.report.needsReview,
  ).length;
  const premiumCandidates = getPremiumReadinessCandidates().length;
  const riskFlags = overview.filter(
    (item) => item.risk.riskLevel !== "low",
  ).length;

  return {
    totalAccounts: overview.length,
    clientsNeedingMedia,
    clientsReadyForContent,
    reportsNeedingReview,
    premiumCandidates,
    riskFlags,
    nextHumanActions: actions
      .slice(0, 5)
      .map((action) => action.nextHumanAction),
    workloadSummary:
      actions.length === 0
        ? "No review-mode actions are queued right now."
        : `${actions.length} review-mode action(s) need calm founder review before anything moves forward.`,
  };
}

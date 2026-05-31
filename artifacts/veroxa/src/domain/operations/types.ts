import type { CurrentPublicPlanId } from "@/data/pricing/veroxaPricing";
export type { DemoBottleneck as Bottleneck, BottleneckType } from "@/data/demoData";

export type ClientLifecycleStage =
  | "review_mode"
  | "setup_pending"
  | "active_ready"
  | "active_manual"
  | "paused";

export type ClientPortalStatus =
  | "review_shell"
  | "pending_connection"
  | "ready_for_client"
  | "live_connected";

export type ClientMediaHealthStatus =
  | "needs_media"
  | "pending_review"
  | "usable_supply"
  | "not_connected";

export type ClientContentStatus =
  | "blocked_by_media"
  | "drafts_needed"
  | "ready_for_review"
  | "queued_for_later"
  | "not_connected";

export type ClientReportStatus =
  | "empty_until_activity"
  | "weekly_update_due"
  | "monthly_report_due"
  | "ready_for_review"
  | "not_connected";

export type PremiumReadinessState =
  | "not_eligible_yet"
  | "assessment_needed"
  | "candidate"
  | "approved_for_later";

export interface PremiumReadinessStatus {
  eligible: boolean;
  status: PremiumReadinessState;
  reason: string;
  nextStep: string;
  adSpendSeparate: true;
  requiresApproval: true;
}

export interface ClientAccount {
  id: string;
  businessName: string;
  planId: CurrentPublicPlanId;
  lifecycleStage: ClientLifecycleStage;
  portalStatus: ClientPortalStatus;
  mediaStatus: ClientMediaHealthStatus;
  contentStatus: ClientContentStatus;
  reportStatus: ClientReportStatus;
  premiumReadinessStatus: PremiumReadinessState;
  createdAt: string;
  updatedAt: string;
}

export interface ClientMediaStatus {
  clientId: string;
  usableMediaCount: number;
  pendingReviewCount: number;
  needsMoreMedia: boolean;
  lastMediaReceivedAt: string | null;
  nextMediaRequest: string;
  clientVisibleMessage: string;
  teamInternalMessage: string;
}

export interface ContentWorkflowStatus {
  clientId: string;
  nextContentStatus: ClientContentStatus;
  draftsReady: number;
  scheduledItems: number;
  needsHumanReview: boolean;
  nextPostWindow: string | null;
  blockedReason: string | null;
  clientVisibleMessage: string;
  teamInternalMessage: string;
}

export interface ReportWorkflowStatus {
  clientId: string;
  weeklyUpdateStatus: "not_started" | "in_review" | "ready_for_review" | "sent";
  monthlyReportStatus: "empty_until_activity" | "in_review" | "ready_for_review" | "sent";
  lastWeeklyUpdateAt: string | null;
  lastMonthlyReportAt: string | null;
  needsReview: boolean;
  reportEmptyStateReason: string | null;
  clientVisibleMessage: string;
  teamInternalMessage: string;
}

export interface ClientRiskStatus {
  clientId: string;
  riskLevel: "low" | "medium" | "high";
  reasons: string[];
  nextHumanAction: string;
  clientVisibleMessage: string;
  teamInternalMessage: string;
}

export type TeamActionQueueType =
  | "media_request"
  | "content_preparation"
  | "report_review"
  | "premium_readiness"
  | "visibility_review";

export interface TeamActionQueueItem {
  id: string;
  clientId: string;
  clientName: string;
  type: TeamActionQueueType;
  title: string;
  status: "ready_for_review" | "needs_confirmation" | "queued_for_later" | "in_review";
  priority: "low" | "medium" | "high";
  nextHumanAction: string;
}

export interface TeamClientOverviewItem {
  account: ClientAccount;
  media: ClientMediaStatus;
  content: ContentWorkflowStatus;
  report: ReportWorkflowStatus;
  risk: ClientRiskStatus;
  premium: PremiumReadinessStatus;
}

export interface TeamDailyCommandSummary {
  totalAccounts: number;
  clientsNeedingMedia: number;
  clientsReadyForContent: number;
  reportsNeedingReview: number;
  premiumCandidates: number;
  riskFlags: number;
  nextHumanActions: string[];
  workloadSummary: string;
}

import type { FirstClientLifecycleStage, FirstClientOperatingSeed, MediaRhythmStatus, OnboardingReadinessStatus, ServiceHealthStatus } from "./types";

export function determineLifecycleStage(params: {
  seed: FirstClientOperatingSeed;
  onboardingStatus: OnboardingReadinessStatus;
  mediaRhythmStatus: MediaRhythmStatus;
  serviceHealthStatus: ServiceHealthStatus;
}): FirstClientLifecycleStage {
  const { seed, onboardingStatus, mediaRhythmStatus, serviceHealthStatus } = params;
  if (seed.servicePaused) return "paused";
  if (serviceHealthStatus === "blocked" || serviceHealthStatus === "urgent") return "at_risk";
  if (onboardingStatus.status === "needed") return "onboarding_needed";
  if (onboardingStatus.status === "partial") return "onboarding_in_progress";
  if (mediaRhythmStatus.shouldSlowPostingDueToMedia) return "media_collection_needed";
  if (seed.clientConfirmationStatus === "needed" || onboardingStatus.itemsRequiringConfirmation.length > 0)
    return "client_confirmation_needed";
  if (seed.monthlyReportDue) return "monthly_report_due";
  if (seed.weeklyUpdateDue) return "weekly_update_due";
  if (seed.manualExecutionCompleted) return "manually_executed";
  if (seed.manualExecutionStatus === "ready_for_manual_execution") return "ready_for_manual_execution";
  if (seed.contentPreparationNeeded) return "content_preparation";
  return "review_complete";
}

export function getLifecycleStageLabel(stage: FirstClientLifecycleStage): string {
  const labels: Record<FirstClientLifecycleStage, string> = {
    prospect_review: "Prospect review",
    onboarding_needed: "Onboarding needed",
    onboarding_in_progress: "Onboarding in progress",
    media_collection_needed: "Media collection needed",
    content_preparation: "Content preparation",
    client_confirmation_needed: "Client confirmation needed",
    ready_for_manual_execution: "Ready for manual execution",
    manually_executed: "Manually executed preview",
    weekly_update_due: "Weekly update due",
    monthly_report_due: "Monthly report due",
    at_risk: "At risk / blocked",
    paused: "Paused",
    review_complete: "Review complete",
  };
  return labels[stage];
}

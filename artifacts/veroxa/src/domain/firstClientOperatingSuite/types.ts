export type FirstClientLifecycleStage =
  | "prospect_review"
  | "onboarding_needed"
  | "onboarding_in_progress"
  | "media_collection_needed"
  | "content_preparation"
  | "client_confirmation_needed"
  | "ready_for_manual_execution"
  | "manually_executed"
  | "weekly_update_due"
  | "monthly_report_due"
  | "at_risk"
  | "paused"
  | "review_complete";

export type FirstClientPackageFit = "Starter" | "Growth" | "Premium assessment";

export type ServiceHealthStatus =
  | "healthy"
  | "caution"
  | "urgent"
  | "blocked"
  | "paused"
  | "review_needed";

export type ReadinessStatus = "complete" | "partial" | "needed" | "blocked";
export type MediaContentSupplyStatus = "ready" | "thin" | "low" | "blocked";
export type ManualExecutionStatus =
  | "not_ready"
  | "ready_for_manual_execution"
  | "queued_for_later"
  | "manually_executed_preview"
  | "blocked";
export type DraftStatus = "not_due" | "draft_needed" | "draft_ready" | "blocked";
export type ClientConfirmationStatus =
  | "not_required"
  | "needed"
  | "requested_preview"
  | "received_preview";

export interface OnboardingReadinessInput {
  businessName?: string;
  address?: string;
  phone?: string;
  website?: string;
  googleBusinessProfileLink?: string;
  instagramLink?: string;
  facebookLink?: string;
  tiktokLink?: string;
  menuLinkOrImages?: string;
  orderingLink?: string;
  topMenuItems?: readonly string[];
  bestSellers?: readonly string[];
  brandToneNotes?: string;
  mediaGuidanceGiven?: boolean;
  postingPreferences?: string;
  premiumReadinessNotes?: string;
  requiresPremiumReadiness?: boolean;
  itemsRequiringConfirmation?: readonly string[];
}

export interface OnboardingReadinessStatus {
  status: ReadinessStatus;
  completedItems: readonly string[];
  missingItems: readonly string[];
  itemsRequiringConfirmation: readonly string[];
  nextSetupAction: string;
  premiumReadinessLabel?: string;
}

export interface MediaRhythmInput {
  usableMediaCount: number;
  lowQualityMediaCount: number;
  missingMediaCount: number;
  lastMediaUploadLabel: string;
  preferredMediaThemes?: readonly string[];
}

export interface MediaRhythmStatus {
  usableMediaCount: number;
  lowQualityMediaCount: number;
  missingMediaCount: number;
  lastMediaUploadLabel: string;
  nextMediaRequest: string;
  contentSupplyStatus: MediaContentSupplyStatus;
  shouldSlowPostingDueToMedia: boolean;
}

export interface WeeklyUpdateStatus {
  status: DraftStatus;
  readinessLabel: string;
  nextAction: string;
}

export interface MonthlyReportStatus {
  status: DraftStatus;
  readinessLabel: string;
  blockers: readonly string[];
}

export interface ClientHandoffPack {
  onboardingChecklist: readonly string[];
  clientSafeWelcomeNoteDraft: string;
  mediaRequestDraft: string;
  firstWeekSetupChecklist: readonly string[];
  businessTruthConfirmationChecklist: readonly string[];
  internalTeamSetupChecklist: readonly string[];
  serviceStartReadinessLabel: string;
}

export interface TeamWeeklyUpdateDraft {
  preparedThisWeek: readonly string[];
  readyForManualExecution: readonly string[];
  needsClientConfirmation: readonly string[];
  mediaNeeded: readonly string[];
  heldForLater: readonly string[];
  reviewedNext: readonly string[];
  internalBlockersAndWarnings: readonly string[];
  draftOnlyLabel: string;
}

export interface ClientSafeWeeklyUpdateDraft {
  workingOn: readonly string[];
  needFromClient: readonly string[];
  nextPlannedFocus: readonly string[];
  closingNote: string;
  draftOnlyLabel: string;
}

export interface TeamMonthlyReportDraft {
  workCompleted: readonly string[];
  preparedManualExecutionPacks: readonly string[];
  mediaSupplyNotes: readonly string[];
  visibilityProfileCleanupNotes: readonly string[];
  clientConfirmationDelays: readonly string[];
  reportDataLimitations: readonly string[];
  nextMonthRecommendation: string;
  internalServiceHealth: string;
  internalProfitValidationNote?: string;
  draftOnlyLabel: string;
}

export interface ClientSafeMonthlyReportDraft {
  progressSummary: string;
  workCompleted: readonly string[];
  needsClientInput: readonly string[];
  recommendedNext: readonly string[];
  mediaGuidance: string;
  draftOnlyLabel: string;
}

export interface FirstClientOperatingSnapshot {
  clientId: string;
  restaurantName: string;
  packageFit: FirstClientPackageFit;
  lifecycleStage: FirstClientLifecycleStage;
  onboardingStatus: OnboardingReadinessStatus;
  mediaRhythmStatus: MediaRhythmStatus;
  manualExecutionStatus: ManualExecutionStatus;
  weeklyUpdateStatus: WeeklyUpdateStatus;
  monthlyReportStatus: MonthlyReportStatus;
  clientConfirmationStatus: ClientConfirmationStatus;
  serviceHealthStatus: ServiceHealthStatus;
  nextBestAction: string;
  clientSafeSummary: string;
  teamInternalSummary: string;
  blockers: readonly string[];
  warnings: readonly string[];
  readySignals: readonly string[];
  updatedAt: string;
}

export interface FirstClientOperatingSeed {
  clientId: string;
  restaurantName: string;
  packageFit: FirstClientPackageFit;
  onboarding: OnboardingReadinessInput;
  media: MediaRhythmInput;
  manualExecutionStatus: ManualExecutionStatus;
  weeklyUpdateDue: boolean;
  monthlyReportDue: boolean;
  clientConfirmationStatus: ClientConfirmationStatus;
  servicePaused?: boolean;
  manualExecutionCompleted?: boolean;
  contentPreparationNeeded?: boolean;
  internalNotes?: readonly string[];
  readySignals?: readonly string[];
  warnings?: readonly string[];
  updatedAt: string;
}

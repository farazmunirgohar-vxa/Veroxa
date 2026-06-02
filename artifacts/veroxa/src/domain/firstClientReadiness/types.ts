export type ReadinessArea =
  | "client_portal"
  | "team_portal"
  | "media_workflow"
  | "client_requests"
  | "client_updates"
  | "reports"
  | "workflow_tracking"
  | "approval_gates"
  | "data_readiness"
  | "launch_guardrails"
  | "pricing_alignment"
  | "role_separation"
  | "service_boundaries";

export type ReadinessStatus =
  | "passing"
  | "warning"
  | "failing"
  | "blocked"
  | "caution"
  | "ready_for_review"
  | "ready";

export type ReadinessSeverity = "blocker" | "warning" | "pass";

export type FirstClientPackageFit =
  | "essential"
  | "growth"
  | "premium_candidate";

export type FirstClientRiskProfile =
  | "healthy"
  | "media_limited"
  | "reels_ready"
  | "inconsistent_media"
  | "premium_assessment_needed";

export type FirstClientMediaState =
  | "steady_photo_supply"
  | "low_photo_supply"
  | "video_and_photo_supply"
  | "inconsistent_uploads"
  | "ads_readiness_review";

export interface ReadinessCheck {
  key: string;
  area: ReadinessArea;
  label: string;
  description: string;
  status: Extract<ReadinessStatus, "passing" | "warning" | "failing">;
  severity: ReadinessSeverity;
  recommendedAction: string;
}

export interface FirstClientScenario {
  key: string;
  label: string;
  packageFit: FirstClientPackageFit;
  riskProfile: FirstClientRiskProfile;
  mediaState: FirstClientMediaState;
  expectedClientPortalNeeds: readonly string[];
  expectedTeamNeeds: readonly string[];
  expectedReportNeeds: readonly string[];
  premiumReadinessNote: string;
  readinessFocusAreas: readonly ReadinessArea[];
}

export interface ReadinessAreaSummary {
  area: ReadinessArea;
  totalChecks: number;
  passingChecks: number;
  warningChecks: number;
  blockingChecks: number;
  status: ReadinessStatus;
}

export interface FirstClientReadinessSummary {
  totalChecks: number;
  passingChecks: number;
  warningChecks: number;
  blockingChecks: number;
  completionPercentage: number;
  overallStatus: ReadinessStatus;
  recommendedNextAction: string;
  areaSummaries: readonly ReadinessAreaSummary[];
}

export interface FirstClientLaunchGate {
  status: ReadinessStatus;
  isReady: boolean;
  requiredCheckKeys: readonly string[];
  blockers: readonly ReadinessCheck[];
  message: string;
  readyForDemoWalkthrough: boolean;
  readyForFeedbackConversations: boolean;
  readyForFirstPaidClient: boolean;
  blockedLiveIntegrations: readonly string[];
  nextRequiredBuild: string;
}

import type { ClientPlanSlug } from "./packageReadiness";
import {
  buildClientPackageReadiness,
  getMediaDependencyReminder,
  getPremiumEligibilityState,
  type PremiumEligibilityStatus,
} from "./packageReadiness";

export type FirstFiveCondition =
  | "healthy_essential"
  | "essential_low_media"
  | "growth_reels_ready"
  | "growth_inconsistent_uploads"
  | "premium_assessment_eligible";

export type MediaRiskLevel = "low_media_risk" | "inconsistent_uploads" | "healthy_supply";
export type ContentQueueState = "needs_media" | "ready_for_content" | "ready_for_reels" | "hold_for_later";
export type ReportReadinessState = "weekly_update_ready" | "monthly_report_ready" | "report_needs_review";

export interface FirstFiveClientReadinessFixture {
  id: string;
  condition: FirstFiveCondition;
  label: string;
  restaurantName: string;
  plan: ClientPlanSlug;
  usableMediaCount: number;
  hasShortVideoContent: boolean;
  uploadConsistency: "steady" | "low" | "inconsistent";
  monthsActiveOnFoundationPlan: number;
  foundationStable: boolean;
  weeklyUpdateReady: boolean;
  monthlyReportReady: boolean;
}

export interface FirstFiveClientReadinessModel {
  id: string;
  condition: FirstFiveCondition;
  label: string;
  restaurantName: string;
  plan: ClientPlanSlug;
  planLabel: string;
  accountStatus: string;
  usableMediaCount: number;
  mediaRiskLevel: MediaRiskLevel;
  mediaSupplyStatus: string;
  contentQueueState: ContentQueueState;
  reportReadinessState: ReportReadinessState;
  premiumEligibilityStatus: PremiumEligibilityStatus;
  premiumCandidate: boolean;
  nextHelpfulAction: string;
  nextTeamAction: string;
  riskReason: string;
  recommendedHumanFollowUp: string;
  deterministicSuggestion: string;
  veroxaResponsibilities: string[];
  restaurantResponsibilities: string[];
  weeklyUpdateStatus: string;
  monthlyReportStatus: string;
  premiumReadinessLabel: string;
  mediaReminder: string;
}

export interface FirstFiveClientPortalViewModel {
  key: string;
  packageLabel: string;
  accountStatus: string;
  mediaSupplyStatus: string;
  nextHelpfulAction: string;
  whatVeroxaIsHandling: string[];
  whatRestaurantHandles: string[];
  weeklyUpdateStatus: string;
  monthlyReportStatus: string;
  premiumReadinessLabel: string;
}

export interface FirstFiveTeamViewModel {
  key: string;
  restaurantName: string;
  readinessCategory: string;
  packageLabel: string;
  mediaRiskLevel: string;
  contentQueueState: string;
  reportReadinessState: string;
  premiumCandidate: boolean;
  nextTeamAction: string;
  escalationReason: string;
  recommendedHumanFollowUp: string;
  deterministicSuggestion: string;
}

export interface FirstFiveTeamCommandCenterSummary {
  totalClients: number;
  firstFiveCoverage: string;
  clientsNeedingMedia: number;
  clientsReadyForContent: number;
  inconsistentUploads: number;
  reportsNeedingReview: number;
  premiumAssessmentCandidates: number;
  internalAlerts: string[];
  workloadSummary: string;
}

export const FIRST_FIVE_CLIENT_READINESS_FIXTURES: FirstFiveClientReadinessFixture[] = [
  {
    id: "first-5-essential-healthy",
    condition: "healthy_essential",
    label: "Healthy Essential client",
    restaurantName: "Demo Grill House",
    plan: "essential",
    usableMediaCount: 18,
    hasShortVideoContent: false,
    uploadConsistency: "steady",
    monthsActiveOnFoundationPlan: 1,
    foundationStable: true,
    weeklyUpdateReady: true,
    monthlyReportReady: true,
  },
  {
    id: "first-5-essential-low-media",
    condition: "essential_low_media",
    label: "Essential client with low media",
    restaurantName: "Demo Taco Bar",
    plan: "essential",
    usableMediaCount: 3,
    hasShortVideoContent: false,
    uploadConsistency: "low",
    monthsActiveOnFoundationPlan: 1,
    foundationStable: false,
    weeklyUpdateReady: true,
    monthlyReportReady: false,
  },
  {
    id: "first-5-growth-reels-ready",
    condition: "growth_reels_ready",
    label: "Growth client with reels content",
    restaurantName: "Demo Mediterranean Grill",
    plan: "growth",
    usableMediaCount: 22,
    hasShortVideoContent: true,
    uploadConsistency: "steady",
    monthsActiveOnFoundationPlan: 1,
    foundationStable: true,
    weeklyUpdateReady: true,
    monthlyReportReady: true,
  },
  {
    id: "first-5-growth-inconsistent-uploads",
    condition: "growth_inconsistent_uploads",
    label: "Growth client with inconsistent uploads",
    restaurantName: "Demo Cafe",
    plan: "growth",
    usableMediaCount: 8,
    hasShortVideoContent: true,
    uploadConsistency: "inconsistent",
    monthsActiveOnFoundationPlan: 1,
    foundationStable: false,
    weeklyUpdateReady: false,
    monthlyReportReady: false,
  },
  {
    id: "first-5-premium-assessment-eligible",
    condition: "premium_assessment_eligible",
    label: "Client eligible for Premium assessment",
    restaurantName: "Demo Bistro",
    plan: "growth",
    usableMediaCount: 25,
    hasShortVideoContent: true,
    uploadConsistency: "steady",
    monthsActiveOnFoundationPlan: 2,
    foundationStable: true,
    weeklyUpdateReady: true,
    monthlyReportReady: false,
  },
];

function getMediaRisk(fixture: FirstFiveClientReadinessFixture): MediaRiskLevel {
  if (fixture.usableMediaCount < 6 || fixture.uploadConsistency === "low") return "low_media_risk";
  if (fixture.uploadConsistency === "inconsistent") return "inconsistent_uploads";
  return "healthy_supply";
}

function getContentQueueState(fixture: FirstFiveClientReadinessFixture): ContentQueueState {
  if (fixture.usableMediaCount < 6) return "needs_media";
  if (fixture.uploadConsistency === "inconsistent") return "hold_for_later";
  if ((fixture.plan === "growth" || fixture.plan === "premium") && fixture.hasShortVideoContent) return "ready_for_reels";
  return "ready_for_content";
}

function getReportReadinessState(fixture: FirstFiveClientReadinessFixture): ReportReadinessState {
  if (!fixture.weeklyUpdateReady || !fixture.monthlyReportReady) return "report_needs_review";
  return fixture.monthlyReportReady ? "monthly_report_ready" : "weekly_update_ready";
}

function getMediaSupplyStatus(mediaRiskLevel: MediaRiskLevel, usableMediaCount: number): string {
  if (mediaRiskLevel === "low_media_risk") return `More content needed — ${usableMediaCount} usable items available.`;
  if (mediaRiskLevel === "inconsistent_uploads") return `Usable content exists, but uploads are inconsistent.`;
  return `Content supply looks workable — ${usableMediaCount} usable items available.`;
}

function getNextHelpfulAction(fixture: FirstFiveClientReadinessFixture, mediaRiskLevel: MediaRiskLevel): string {
  if (mediaRiskLevel === "low_media_risk") return "Send a few fresh food photos or short videos so posting does not slow down.";
  if (mediaRiskLevel === "inconsistent_uploads") return "Send one small batch of fresh media this week so Veroxa can keep work moving.";
  if (fixture.condition === "premium_assessment_eligible") return "Premium can be reviewed with Veroxa when you are ready; ad spend stays separate.";
  if (fixture.plan === "growth" && fixture.hasShortVideoContent) return "Keep sending usable short videos when you have them.";
  return "Keep sharing fresh photos when you have new dishes, specials, or busy moments.";
}

function getNextTeamAction(model: Pick<FirstFiveClientReadinessModel, "mediaRiskLevel" | "contentQueueState" | "premiumCandidate" | "reportReadinessState">): string {
  if (model.mediaRiskLevel === "low_media_risk") return "Send calm media request with simple examples.";
  if (model.mediaRiskLevel === "inconsistent_uploads") return "Recommend a weekly upload rhythm and hold non-urgent drafts.";
  if (model.premiumCandidate) return "Offer Premium readiness assessment; do not start ads without approval and budget.";
  if (model.reportReadinessState === "report_needs_review") return "Review report inputs before monthly snapshot is shown.";
  if (model.contentQueueState === "ready_for_reels") return "Prepare short-video draft for review using provided media.";
  return "Prepare next content item and keep weekly update current.";
}

function getRiskReason(mediaRiskLevel: MediaRiskLevel, premiumCandidate: boolean, reportState: ReportReadinessState): string {
  if (mediaRiskLevel === "low_media_risk") return "Posting may slow because usable media is low.";
  if (mediaRiskLevel === "inconsistent_uploads") return "Client uploads are uneven, so queue timing needs human review.";
  if (premiumCandidate) return "Premium assessment is possible, but ads require explicit approval and agreed ad budget.";
  if (reportState === "report_needs_review") return "Report is not ready to show without Veroxa review.";
  return "Foundation stable.";
}

export function buildFirstFiveClientReadinessModel(
  fixture: FirstFiveClientReadinessFixture,
): FirstFiveClientReadinessModel {
  const usableMediaAvailable = fixture.usableMediaCount >= 6;
  const packageReadiness = buildClientPackageReadiness({
    plan: fixture.plan,
    monthsActiveOnFoundationPlan: fixture.monthsActiveOnFoundationPlan,
    foundationStable: fixture.foundationStable,
    readinessAssessmentCompleted: false,
    clientApprovedPremium: false,
    agreedAdBudget: false,
    usableMediaAvailable,
    firstClientDiscountEligible: true,
    monthsSinceServiceStart: fixture.monthsActiveOnFoundationPlan,
    continuouslyActive: true,
  });
  const premiumEligibilityStatus = getPremiumEligibilityState({
    plan: fixture.plan,
    monthsActiveOnFoundationPlan: fixture.monthsActiveOnFoundationPlan,
    foundationStable: fixture.foundationStable,
    readinessAssessmentCompleted: false,
    clientApprovedPremium: false,
    agreedAdBudget: false,
    usableMediaAvailable,
    firstClientDiscountEligible: true,
    monthsSinceServiceStart: fixture.monthsActiveOnFoundationPlan,
    continuouslyActive: true,
  });
  const mediaRiskLevel = getMediaRisk(fixture);
  const contentQueueState = getContentQueueState(fixture);
  const reportReadinessState = getReportReadinessState(fixture);
  const premiumCandidate = fixture.condition === "premium_assessment_eligible" && premiumEligibilityStatus === "eligible_for_assessment";

  const partial = { mediaRiskLevel, contentQueueState, premiumCandidate, reportReadinessState };
  const riskReason = getRiskReason(mediaRiskLevel, premiumCandidate, reportReadinessState);

  return {
    id: fixture.id,
    condition: fixture.condition,
    label: fixture.label,
    restaurantName: fixture.restaurantName,
    plan: fixture.plan,
    planLabel: packageReadiness.planLabel,
    accountStatus: fixture.foundationStable ? "Foundation stable" : "In review",
    usableMediaCount: fixture.usableMediaCount,
    mediaRiskLevel,
    mediaSupplyStatus: getMediaSupplyStatus(mediaRiskLevel, fixture.usableMediaCount),
    contentQueueState,
    reportReadinessState,
    premiumEligibilityStatus,
    premiumCandidate,
    nextHelpfulAction: getNextHelpfulAction(fixture, mediaRiskLevel),
    nextTeamAction: getNextTeamAction(partial),
    riskReason,
    recommendedHumanFollowUp:
      mediaRiskLevel === "healthy_supply" ? "No urgent follow-up; keep normal review rhythm." : "Human review recommended before promising timing.",
    deterministicSuggestion: `Rule-based assist: ${getNextTeamAction(partial)}`,
    veroxaResponsibilities: packageReadiness.veroxaResponsibilities,
    restaurantResponsibilities: packageReadiness.restaurantResponsibilities,
    weeklyUpdateStatus: fixture.weeklyUpdateReady ? "Weekly update prepared" : "Weekly update in review",
    monthlyReportStatus: fixture.monthlyReportReady ? "Monthly report visible" : "Monthly report in review",
    premiumReadinessLabel: packageReadiness.premiumStatusLabel,
    mediaReminder: getMediaDependencyReminder(usableMediaAvailable),
  };
}

export function mapFirstFiveModelToClientView(
  model: FirstFiveClientReadinessModel,
): FirstFiveClientPortalViewModel {
  return {
    key: model.condition,
    packageLabel: model.planLabel,
    accountStatus: model.accountStatus,
    mediaSupplyStatus: model.mediaSupplyStatus,
    nextHelpfulAction: model.nextHelpfulAction,
    whatVeroxaIsHandling: model.veroxaResponsibilities,
    whatRestaurantHandles: model.restaurantResponsibilities,
    weeklyUpdateStatus: model.weeklyUpdateStatus,
    monthlyReportStatus: model.monthlyReportStatus,
    premiumReadinessLabel: model.premiumReadinessLabel,
  };
}

export function mapFirstFiveModelToTeamView(
  model: FirstFiveClientReadinessModel,
): FirstFiveTeamViewModel {
  return {
    key: model.condition,
    restaurantName: model.restaurantName,
    readinessCategory: model.label,
    packageLabel: model.planLabel,
    mediaRiskLevel: model.mediaRiskLevel === "healthy_supply" ? "Low media risk" : model.mediaRiskLevel === "low_media_risk" ? "Needs media" : "Inconsistent uploads",
    contentQueueState: model.contentQueueState === "ready_for_reels" ? "Ready for content" : model.contentQueueState.replaceAll("_", " "),
    reportReadinessState: model.reportReadinessState.replaceAll("_", " "),
    premiumCandidate: model.premiumCandidate,
    nextTeamAction: model.nextTeamAction,
    escalationReason: model.riskReason,
    recommendedHumanFollowUp: model.recommendedHumanFollowUp,
    deterministicSuggestion: model.deterministicSuggestion,
  };
}

export function getFirstFiveReadinessModels(): FirstFiveClientReadinessModel[] {
  return FIRST_FIVE_CLIENT_READINESS_FIXTURES.map(buildFirstFiveClientReadinessModel);
}

export function getFirstFiveClientPortalViewModels(): FirstFiveClientPortalViewModel[] {
  return getFirstFiveReadinessModels().map(mapFirstFiveModelToClientView);
}

export function getFirstFiveTeamViewModels(): FirstFiveTeamViewModel[] {
  return getFirstFiveReadinessModels().map(mapFirstFiveModelToTeamView);
}

export function getFirstFiveTeamCommandCenterSummary(): FirstFiveTeamCommandCenterSummary {
  const models = getFirstFiveReadinessModels();
  const clientsNeedingMedia = models.filter((m) => m.mediaRiskLevel === "low_media_risk").length;
  const inconsistentUploads = models.filter((m) => m.mediaRiskLevel === "inconsistent_uploads").length;
  const clientsReadyForContent = models.filter((m) => m.contentQueueState === "ready_for_content" || m.contentQueueState === "ready_for_reels").length;
  const reportsNeedingReview = models.filter((m) => m.reportReadinessState === "report_needs_review").length;
  const premiumAssessmentCandidates = models.filter((m) => m.premiumCandidate).length;

  return {
    totalClients: models.length,
    firstFiveCoverage: `${models.length}/5 launch conditions represented`,
    clientsNeedingMedia,
    clientsReadyForContent,
    inconsistentUploads,
    reportsNeedingReview,
    premiumAssessmentCandidates,
    internalAlerts: models
      .filter((m) => m.mediaRiskLevel !== "healthy_supply" || m.premiumCandidate || m.reportReadinessState === "report_needs_review")
      .map((m) => `${m.restaurantName}: ${m.riskReason}`),
    workloadSummary: `${clientsReadyForContent} ready for content, ${clientsNeedingMedia} need media, ${reportsNeedingReview} reports need review.`,
  };
}

export function getFirstFiveClientReadinessStatus(
  fixture: FirstFiveClientReadinessFixture,
) {
  const model = buildFirstFiveClientReadinessModel(fixture);
  return {
    id: model.id,
    label: model.label,
    condition: model.condition,
    statusLabel: model.accountStatus,
    nextStep: model.nextTeamAction,
    mediaReminder: model.mediaReminder,
  };
}

export function getFirstFiveReadinessStatuses() {
  return FIRST_FIVE_CLIENT_READINESS_FIXTURES.map(getFirstFiveClientReadinessStatus);
}

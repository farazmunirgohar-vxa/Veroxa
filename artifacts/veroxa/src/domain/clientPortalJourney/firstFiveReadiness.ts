import type { ClientPlanSlug } from "./packageReadiness";
import { getMediaDependencyReminder, getPremiumEligibilityState } from "./packageReadiness";

export type FirstFiveCondition =
  | "healthy_essential"
  | "essential_low_media"
  | "growth_reels_ready"
  | "growth_inconsistent_uploads"
  | "premium_assessment_eligible";

export interface FirstFiveClientReadinessFixture {
  id: string;
  condition: FirstFiveCondition;
  label: string;
  plan: ClientPlanSlug;
  usableMediaCount: number;
  hasShortVideoContent: boolean;
  uploadConsistency: "steady" | "low" | "inconsistent";
  monthsActiveOnFoundationPlan: number;
  foundationStable: boolean;
}

export interface FirstFiveReadinessStatus {
  id: string;
  label: string;
  condition: FirstFiveCondition;
  statusLabel: string;
  nextStep: string;
  mediaReminder: string;
}

export const FIRST_FIVE_CLIENT_READINESS_FIXTURES: FirstFiveClientReadinessFixture[] = [
  {
    id: "first-5-essential-healthy",
    condition: "healthy_essential",
    label: "Healthy Essential client",
    plan: "essential",
    usableMediaCount: 18,
    hasShortVideoContent: false,
    uploadConsistency: "steady",
    monthsActiveOnFoundationPlan: 1,
    foundationStable: true,
  },
  {
    id: "first-5-essential-low-media",
    condition: "essential_low_media",
    label: "Essential client with low media",
    plan: "essential",
    usableMediaCount: 3,
    hasShortVideoContent: false,
    uploadConsistency: "low",
    monthsActiveOnFoundationPlan: 1,
    foundationStable: false,
  },
  {
    id: "first-5-growth-reels-ready",
    condition: "growth_reels_ready",
    label: "Growth client with reels content",
    plan: "growth",
    usableMediaCount: 22,
    hasShortVideoContent: true,
    uploadConsistency: "steady",
    monthsActiveOnFoundationPlan: 1,
    foundationStable: true,
  },
  {
    id: "first-5-growth-inconsistent-uploads",
    condition: "growth_inconsistent_uploads",
    label: "Growth client with inconsistent uploads",
    plan: "growth",
    usableMediaCount: 8,
    hasShortVideoContent: true,
    uploadConsistency: "inconsistent",
    monthsActiveOnFoundationPlan: 1,
    foundationStable: false,
  },
  {
    id: "first-5-premium-assessment-eligible",
    condition: "premium_assessment_eligible",
    label: "Client eligible for Premium assessment",
    plan: "growth",
    usableMediaCount: 25,
    hasShortVideoContent: true,
    uploadConsistency: "steady",
    monthsActiveOnFoundationPlan: 2,
    foundationStable: true,
  },
];

export function getFirstFiveClientReadinessStatus(
  fixture: FirstFiveClientReadinessFixture,
): FirstFiveReadinessStatus {
  const usableMediaAvailable = fixture.usableMediaCount >= 6;
  const premiumStatus = getPremiumEligibilityState({
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

  let statusLabel = "Ready for weekly operating rhythm";
  let nextStep = "Keep weekly updates and monthly snapshots consistent.";

  if (!usableMediaAvailable) {
    statusLabel = "More content needed";
    nextStep = "Ask for fresh photos or short videos before posting slows.";
  } else if (fixture.uploadConsistency === "inconsistent") {
    statusLabel = "Needs steadier uploads";
    nextStep = "Send a calm reminder with simple photo and short video guidance.";
  } else if (fixture.condition === "premium_assessment_eligible" && premiumStatus === "eligible_for_assessment") {
    statusLabel = "Premium readiness assessment available";
    nextStep = "Offer a readiness assessment by phone, Zoom, or in person.";
  } else if (fixture.plan === "growth" && fixture.hasShortVideoContent) {
    statusLabel = "Reels support ready";
    nextStep = "Prepare Reels/TikTok support using the client-provided videos.";
  }

  return {
    id: fixture.id,
    label: fixture.label,
    condition: fixture.condition,
    statusLabel,
    nextStep,
    mediaReminder: getMediaDependencyReminder(usableMediaAvailable),
  };
}

export function getFirstFiveReadinessStatuses(): FirstFiveReadinessStatus[] {
  return FIRST_FIVE_CLIENT_READINESS_FIXTURES.map(getFirstFiveClientReadinessStatus);
}

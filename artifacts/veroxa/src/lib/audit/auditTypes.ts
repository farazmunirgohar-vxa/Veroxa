/**
 * auditTypes.ts — M026A
 *
 * Types for the Free Customer-Flow Readiness Audit. Rule-based only,
 * no AI, no scraping, no network. All scoring is computed locally from
 * the input fields provided by the user.
 */

export type AuditCategoryId =
  | "search_visibility_readiness"
  | "google_maps_conversion_readiness"
  | "social_reminder_system"
  | "content_persuasion_quality"
  | "action_path_clarity"
  | "review_trust_strength"
  | "growth_leverage_opportunity";

export type AuditGrade =
  | "strong_foundation"
  | "good_missed_consistency"
  | "clear_gap"
  | "underbuilt"
  | "foundational_problem";

export type AuditCustomerFlowStage =
  | "visibility"
  | "trust"
  | "reminder"
  | "action"
  | "retention";

export type RecommendedPackageId =
  | "google_optimization"
  | "complete_online_presence"
  | "complete_plus_ads"
  | "ads_management_only";

export type AuditConfidence = "basic" | "good" | "strong";

export type GrowthReportSourceLabel =
  | "verified"
  | "found"
  | "not found"
  | "manual review needed";

export interface GrowthReportSection {
  id: string;
  title: string;
  currentSignal: string;
  whyItMatters: string;
  veroxaRecommendation: string;
  sourceLabel: GrowthReportSourceLabel;
}

export type RestaurantSourceMode = "google_places" | "fixture" | "manual";

export interface RestaurantAuditInput {
  // Required for audit generation
  restaurantName: string;
  city: string;
  state: string;
  /**
   * Cuisine is no longer required for the initial restaurant search.
   * If unknown at audit time, callers should default to
   * "Restaurant / Food — category not verified."
   */
  cuisineType: string;
  // Optional links (M027A)
  googleListingUrl?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  menuOrderingUrl?: string;
  otherUrl?: string;
  // Optional context (kept for compatibility; not required publicly)
  currentGoal?: string;
  biggestProblem?: string;
  notes?: string;
  // Optional signals from candidate selection
  googleRating?: number;
  reviewCount?: number;
  // Optional live-mode signals (Live Audit Lookup V1) — all optional so the
  // audit still works in fixture / manual mode without any of these.
  selectedPlaceId?: string;
  restaurantSource?: RestaurantSourceMode;
  liveProfileConfidence?: "high" | "medium" | "low";
  websiteFound?: boolean;
  menuLinkFound?: boolean;
  orderLinkFound?: boolean;
  reservationLinkFound?: boolean;
  contactPathFound?: boolean;
  discoveredSocialLinks?: string[];
  discoveredMenuLinks?: string[];
  businessStatus?: string;
}

export interface AuditCategoryScore {
  id: AuditCategoryId;
  label: string;
  score: number;
  maxScore: number;
  whatItMeans: string;
  customerFlowImpact: string;
  howVeroxaHelps: string;
  explanation: string;
}

export interface AuditCustomerFlowImpact {
  stage: AuditCustomerFlowStage;
  stageLabel: string;
  stageDescription: string;
  veroxaHelps: string;
  possibleIndicators: string[];
}

export interface AuditWeakSpot {
  categoryId: AuditCategoryId;
  title: string;
  whyItMatters: string;
  howVeroxaHelps: string;
}

export interface AuditOpportunity {
  id: string;
  title: string;
  whyItMatters: string;
  veroxaApproach: string;
}

export interface AuditRecommendation {
  packageId: RecommendedPackageId;
  reason: string;
  whyNotAdsYet: string | null;
  firstSteps: string[];
}

export interface AuditPackageRecommendation {
  packageId: RecommendedPackageId;
  packageLabel: string;
  standardPriceDisplay: string;
  foundingPriceDisplay: string;
  reason: string;
  whyNotAdsYet: string | null;
  firstSteps: string[];
  /**
   * Soft expected-direction statement. Never a guarantee — see allowed
   * wording in the free-audit refinement spec.
   */
  expectedDirection: string;
}

export interface VeroxaServiceAlignmentEntry {
  area: string;
  veroxaService: string;
}

export interface RestaurantAuditReport {
  input: RestaurantAuditInput;
  totalScore: number;
  maxScore: 100;
  grade: AuditGrade;
  gradeLabel: string;
  gradeDescription: string;
  categories: AuditCategoryScore[];
  weakSpots: AuditWeakSpot[];
  opportunities: AuditOpportunity[];
  recommendation: AuditPackageRecommendation;
  customerFlowExplanation: string;
  auditConfidence: AuditConfidence;
  confidenceLabel: string;
  confidenceExplanation: string;
  generatedAtLabel: string;
  growthReportSections: GrowthReportSection[];
}

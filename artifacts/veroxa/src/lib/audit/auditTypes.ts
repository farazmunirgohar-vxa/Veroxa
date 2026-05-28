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

export interface RestaurantAuditInput {
  restaurantName: string;
  city: string;
  state: string;
  cuisineType: string;
  googleListingUrl?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  currentGoal: string;
  biggestProblem?: string;
  notes?: string;
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
  generatedAtLabel: string;
}

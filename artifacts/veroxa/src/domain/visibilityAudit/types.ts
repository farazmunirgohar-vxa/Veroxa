/**
 * Visibility Audit — domain model (foundation only).
 *
 * The Visibility Audit engine is one *source* of prepared actions for the
 * Approval-to-Execution queue: Veroxa looks at a restaurant's Google profile,
 * website, reviews, social presence, and local search wording, finds visibility
 * gaps, and prepares exact actions for Faraz to approve.
 *
 * IMPORTANT: this is a rule-based / fixture model only. Nothing here calls
 * Google, Meta, a website, OpenAI, or any external service. There are NO live
 * API calls, NO crawling, NO storage, NO public side effects. The model is
 * shaped so a real audit source can later implement the same surface. See
 * docs/VISIBILITY_AUDIT_ENGINE.md.
 */

export type VisibilityAuditId = string;

/**
 * The audit can surface many findings per restaurant, but only the highest-
 * priority ones become prepared actions so the Approval Queue stays calm and
 * reviewable. The audit page still shows every finding.
 */
export const MAX_PREPARED_ACTIONS_PER_AUDIT = 5;

/** The area of online presence a finding belongs to. */
export type VisibilityAuditCategory =
  | "google_business_profile"
  | "local_seo"
  | "website"
  | "reviews"
  | "social_profile"
  | "menu_visibility"
  | "catering_visibility"
  | "content_freshness";

export const VISIBILITY_AUDIT_CATEGORY_LABELS: Record<VisibilityAuditCategory, string> = {
  google_business_profile: "Google Business Profile",
  local_seo: "Local search",
  website: "Website",
  reviews: "Reviews",
  social_profile: "Social profile",
  menu_visibility: "Menu visibility",
  catering_visibility: "Catering visibility",
  content_freshness: "Content freshness",
};

export const VISIBILITY_AUDIT_CATEGORY_ORDER: VisibilityAuditCategory[] = [
  "google_business_profile",
  "reviews",
  "website",
  "local_seo",
  "social_profile",
  "menu_visibility",
  "catering_visibility",
  "content_freshness",
];

/** How pressing a finding is. */
export type VisibilityAuditSeverity = "low" | "medium" | "high" | "urgent";

export const VISIBILITY_AUDIT_SEVERITY_LABELS: Record<VisibilityAuditSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const VISIBILITY_AUDIT_SEVERITY_ORDER: Record<VisibilityAuditSeverity, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/** Where a finding was observed (in this foundation, always demo fixtures). */
export type VisibilityAuditSource =
  | "google_profile"
  | "website"
  | "social_profile"
  | "reviews"
  | "menu"
  | "local_seo"
  | "manual_team_check"
  | "demo_fixture";

/**
 * A single visibility gap Veroxa found. `detail` is internal (team-facing);
 * `recommendation` is the calm next step. When `actionable` is true the finding
 * can be turned into a prepared action via the mapper.
 */
export interface VisibilityAuditFinding {
  id: string;
  category: VisibilityAuditCategory;
  severity: VisibilityAuditSeverity;
  source: VisibilityAuditSource;
  /** Short, calm headline (no jargon). */
  title: string;
  /** Internal explanation for the team — plain language, no scores that look fake. */
  detail: string;
  /** The recommended next step, calm and imperative. */
  recommendation: VisibilityAuditRecommendation;
  /** True if this finding should become a prepared action in the queue. */
  actionable: boolean;
}

/** The recommended next step a finding suggests, with the prepared-action hint. */
export interface VisibilityAuditRecommendation {
  /** Calm, plain-language next step shown to the team. */
  label: string;
  /** Hint for the mapper: which prepared-action channel this would land in. */
  preparedChannel?: import("@/domain/preparedActions").PreparedActionChannel;
  /** Hint for the mapper: which prepared-action type to create. */
  preparedType?: import("@/domain/preparedActions").PreparedActionType;
  /** Prepared text/content the action would carry (plain text only). */
  preparedText?: string;
  /** Suggested keyword angle for search-related actions. */
  keywordAngle?: string;
}

// ── Audit inputs (fixture-shaped, ready for a real source later) ──────────────

export interface VisibilityAuditGoogleInput {
  /** 0–100 completeness of the Google Business Profile. */
  profileCompleteness: number;
  hasRecentPhotos: boolean;
  lastGooglePostDaysAgo: number;
  unansweredReviews: number;
  reviewCount: number;
  averageRating: number;
  menuLinkWorking: boolean;
  orderingLinkWorking: boolean;
  hoursConfirmed: boolean;
  holidayHoursMissing: boolean;
}

export interface VisibilityAuditWebsiteInput {
  hasWebsite: boolean;
  menuPageExists: boolean;
  cateringPageExists: boolean;
  orderingLinkVisible: boolean;
  brokenLinksCount: number;
  localKeywordsPresent: boolean;
  bestSellersVisible: boolean;
  mobileFriendlyConcern: boolean;
}

export type ContentSupplyStatus = "healthy" | "low" | "critical";

export interface VisibilityAuditSocialInput {
  instagramBioClear: boolean;
  facebookLinkCorrect: boolean;
  recentSocialPostDaysAgo: number;
  contentSupplyStatus: ContentSupplyStatus;
}

export interface VisibilityAuditSeoInput {
  primaryFoodKeywords: string[];
  localAreaKeywords: string[];
  cateringVisible: boolean;
  /** How clearly best sellers are signposted across the presence. */
  bestSellerClarity: "clear" | "weak" | "unclear";
  /** Themes reviews could reinforce for local search (food/service/catering…). */
  reviewKeywordOpportunities: string[];
}

/** Everything the rule engine needs to audit one restaurant. Fixture-only here. */
export interface VisibilityAuditInput {
  clientId: string;
  /** Whether the restaurant actually offers catering (drives catering rules). */
  cateringOffered: boolean;
  google: VisibilityAuditGoogleInput;
  website: VisibilityAuditWebsiteInput;
  social: VisibilityAuditSocialInput;
  seo: VisibilityAuditSeoInput;
}

// ── Audit outputs ─────────────────────────────────────────────────────────────

/** A short per-category roll-up used for the audit summary view. */
export interface VisibilityAuditCategorySummary {
  category: VisibilityAuditCategory;
  findingCount: number;
  topSeverity: VisibilityAuditSeverity | null;
}

/** The computed result of running the audit over one restaurant's input. */
export interface VisibilityAuditResult {
  clientId: string;
  restaurantName: string;
  /** 0–100 visibility score. Higher is better. Demo-safe, plain heuristic. */
  overallScore: number;
  /** One calm line summarising the state of the restaurant's visibility. */
  headline: string;
  findings: VisibilityAuditFinding[];
  categorySummaries: VisibilityAuditCategorySummary[];
  /** Count of findings that will become prepared actions in the queue. */
  preparedActionCount: number;
  /** Friendly "as of" label (display string; demo-safe). */
  generatedAtLabel: string;
  /** Always demo-only in this foundation. */
  demoOnly: true;
}

/** The audited entity: the input that was checked plus the result. */
export interface VisibilityAudit {
  id: VisibilityAuditId;
  input: VisibilityAuditInput;
  result: VisibilityAuditResult;
}

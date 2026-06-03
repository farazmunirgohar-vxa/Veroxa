/**
 * internalLeadScoring.ts — M029
 *
 * Internal-only Veroxa Lead Success Score. Ranks restaurants by likelihood
 * of becoming a successful Veroxa lead/client. This is a prioritization
 * tool for the Veroxa team — it must NEVER be shown on the public
 * `/free-audit` page or to restaurants.
 *
 * Scoring categories (100 pts):
 *   1. Online Weakness / Need              — 20
 *   2. Veroxa Impact Potential             — 20
 *   3. Content Potential                   — 15
 *   4. Google / Maps Opportunity           — 15
 *   5. Package Fit / MRR Potential         — 10
 *   6. Owner Reachability / Contactability — 10
 *   7. Competitive / Niche Advantage       —  5
 *   8. Warm Relationship / Strategic Value —  5
 *
 * Priority tiers:
 *   85–100 = Priority A
 *   70–84  = Priority B
 *   55–69  = Nurture
 *   40–54  = Low Priority
 *    0–39  = Not Current Target
 */

import { getCurrentPublicPlanForPackageId } from "@/data/pricing/veroxaPricing";
import { evaluateProfitFit, formatProfitFitSummary } from "@/domain/profitFit";
import type {
  AuditPackageRecommendation,
  RecommendedPackageId,
  RestaurantAuditReport,
} from "@/lib/audit/auditTypes";
import type {
  AuditLeadContact,
  AuditLeadInternalFlags,
  AuditLeadLinks,
  LeadPriority,
  LeadSource,
} from "./leadTypes";

export interface InternalLeadScoreInput {
  report: RestaurantAuditReport;
  links: AuditLeadLinks;
  contact?: AuditLeadContact;
  internalFlags?: AuditLeadInternalFlags;
  source: LeadSource;
  walkthroughRequested: boolean;
}

export interface InternalLeadScoreBreakdown {
  onlineWeakness: number;
  veroxaImpact: number;
  contentPotential: number;
  googleMaps: number;
  packageFit: number;
  ownerReachability: number;
  competitiveAdvantage: number;
  warmRelationship: number;
}

export interface InternalLeadAudit {
  score: number;
  breakdown: InternalLeadScoreBreakdown;
  priority: LeadPriority;
  projectedFoundingMonthlyMrr: number;
  projectedStandardMonthlyMrr: number;
  whyThisLeadIsStrong: string[];
  risks: string[];
  profitFitSummary: string;
  recommendedOutreachAngle: string;
  suggestedOpener: string;
  suggestedFollowUp: string;
  likelyObjection: string;
  nextAction: string;
}

const clamp = (n: number, max: number): number =>
  Math.max(0, Math.min(max, Math.round(n)));

function countLinks(links: AuditLeadLinks): number {
  return (
    (links.googleListingUrl ? 1 : 0) +
    (links.websiteUrl ? 1 : 0) +
    (links.instagramUrl ? 1 : 0) +
    (links.facebookUrl ? 1 : 0) +
    (links.tiktokUrl ? 1 : 0) +
    (links.menuOrderingUrl ? 1 : 0) +
    (links.otherUrl ? 1 : 0)
  );
}

function categoryScore(report: RestaurantAuditReport, id: string): number {
  return report.categories.find((c) => c.id === id)?.score ?? 0;
}

// ── 1. Online Weakness / Need (20) ──────────────────────────────────
// Higher weakness = bigger need = stronger Veroxa case.
function scoreOnlineWeakness(report: RestaurantAuditReport): number {
  const gap = 100 - report.totalScore;
  // 100 gap → 20 pts; 0 gap → 0 pts
  return clamp((gap / 100) * 20, 20);
}

// ── 2. Veroxa Impact Potential (20) ─────────────────────────────────
// Sweet spot: moderately weak but not totally broken. Veroxa can move
// the needle most when foundation is there but underperforming.
function scoreVeroxaImpact(report: RestaurantAuditReport): number {
  const t = report.totalScore;
  if (t >= 30 && t <= 70) return 20;
  if (t > 70 && t <= 85) return 14;
  if (t > 85) return 8;
  if (t >= 20) return 12;
  return 6; // very broken — harder/slower to help
}

// ── 3. Content Potential (15) ───────────────────────────────────────
function scoreContentPotential(
  report: RestaurantAuditReport,
  links: AuditLeadLinks,
): number {
  const content = categoryScore(report, "content_persuasion_quality");
  const social = categoryScore(report, "social_reminder_system");
  const hasIg = !!links.instagramUrl;
  const hasFb = !!links.facebookUrl;
  const hasTt = !!links.tiktokUrl;
  const socialCount = (hasIg ? 1 : 0) + (hasFb ? 1 : 0) + (hasTt ? 1 : 0);

  // Lower content/social = more potential for Veroxa to add.
  const contentGap = 15 - content; // 0..15
  const socialGap = 10 - social; // can be negative
  let pts = clamp(contentGap + Math.max(0, socialGap) * 0.4, 12);
  // Bonus when at least one social account exists to build on.
  if (socialCount >= 1) pts += 2;
  if (socialCount >= 2) pts += 1;
  return clamp(pts, 15);
}

// ── 4. Google / Maps Opportunity (15) ───────────────────────────────
function scoreGoogleMaps(
  report: RestaurantAuditReport,
  links: AuditLeadLinks,
): number {
  const search = categoryScore(report, "search_visibility_readiness");
  const maps = categoryScore(report, "google_maps_conversion_readiness");
  const review = categoryScore(report, "review_trust_strength");
  const hasGoogle = !!links.googleListingUrl;
  const gap =
    Math.max(0, 17 - search) + Math.max(0, 17 - maps) + Math.max(0, 8 - review);
  // Normalize gap (max ~42) into 0..13 range.
  let pts = clamp((gap / 42) * 13, 13);
  if (hasGoogle) pts += 2;
  return clamp(pts, 15);
}

// ── 5. Package Fit / MRR Potential (10) ─────────────────────────────
function scorePackageFit(packageId: RecommendedPackageId): number {
  switch (packageId) {
    case "premium":
    case "complete_plus_ads":
      return 8;
    case "growth":
    case "complete_online_presence":
      return 10;
    case "ads_management_only":
      return 7;
    case "starter":
    case "google_optimization":
      return 6;
  }
}

// ── 6. Owner Reachability / Contactability (10) ─────────────────────
function scoreOwnerReachability(
  contact?: AuditLeadContact,
  internalFlags?: AuditLeadInternalFlags,
  walkthroughRequested?: boolean,
): number {
  let pts = 0;
  if (walkthroughRequested) pts += 4;
  if (contact?.phone) pts += 3;
  if (contact?.email) pts += 2;
  if (contact?.bestTimeToContact) pts += 1;
  if (internalFlags?.contactAvailable) pts += 1;
  switch (internalFlags?.ownerReachability) {
    case "high":
      pts += 3;
      break;
    case "medium":
      pts += 2;
      break;
    case "low":
      pts += 1;
      break;
  }
  return clamp(pts, 10);
}

// ── 7. Competitive / Niche Advantage (5) ────────────────────────────
function scoreCompetitiveAdvantage(report: RestaurantAuditReport): number {
  // Distinct/specialty cuisine types tend to convert better with content.
  const cuisine = (report.input.cuisineType || "").toLowerCase().trim();
  if (!cuisine) return 1;
  const distinct = [
    "mediterranean",
    "turkish",
    "greek",
    "afghan",
    "ethiopian",
    "korean",
    "vietnamese",
    "ramen",
    "sushi",
    "halal",
    "vegan",
    "barbecue",
    "bbq",
    "steakhouse",
    "seafood",
    "brunch",
    "bakery",
    "pastry",
    "dessert",
    "ice cream",
    "coffee",
    "specialty",
  ];
  if (distinct.some((d) => cuisine.includes(d))) return 5;
  const common = ["pizza", "burger", "sandwich", "deli", "diner"];
  if (common.some((d) => cuisine.includes(d))) return 3;
  return 4;
}

// ── 8. Warm Relationship / Strategic Value (5) ──────────────────────
const RELATIONSHIP_SOURCES = new Set<LeadSource>([
  "referral",
  "client_referral",
  "family_friend_referral",
  "restaurant_owner_referral",
  "founder_network",
  "community_referral",
  "mosque_community_center",
  "halal_network",
  "pakistani_community_network",
  "turkish_mediterranean_network",
  "referral_from_success",
  "vendor_partner",
  "pos_partner",
  "accountant_bookkeeper",
  "commercial_realtor",
]);

const WALK_IN_SOURCES = new Set<LeadSource>([
  "walk_in",
  "grand_opening",
  "new_restaurant_opening",
  "food_festival",
  "local_event",
]);

function scoreWarmRelationship(
  internalFlags?: AuditLeadInternalFlags,
  source?: LeadSource,
): number {
  let pts = 0;
  if (internalFlags?.warmRelationship) pts += 3;
  if (source && RELATIONSHIP_SOURCES.has(source)) pts += 3;
  if (source && WALK_IN_SOURCES.has(source)) pts += 1;
  if (
    internalFlags?.strategicValueNote &&
    internalFlags.strategicValueNote.trim().length > 0
  ) {
    pts += 2;
  }
  return clamp(pts, 5);
}

export function calculateLeadSuccessScore(input: InternalLeadScoreInput): {
  total: number;
  breakdown: InternalLeadScoreBreakdown;
} {
  const {
    report,
    links,
    contact,
    internalFlags,
    source,
    walkthroughRequested,
  } = input;
  const breakdown: InternalLeadScoreBreakdown = {
    onlineWeakness: scoreOnlineWeakness(report),
    veroxaImpact: scoreVeroxaImpact(report),
    contentPotential: scoreContentPotential(report, links),
    googleMaps: scoreGoogleMaps(report, links),
    packageFit: scorePackageFit(report.recommendation.packageId),
    ownerReachability: scoreOwnerReachability(
      contact,
      internalFlags,
      walkthroughRequested,
    ),
    competitiveAdvantage: scoreCompetitiveAdvantage(report),
    warmRelationship: scoreWarmRelationship(internalFlags, source),
  };
  const total =
    breakdown.onlineWeakness +
    breakdown.veroxaImpact +
    breakdown.contentPotential +
    breakdown.googleMaps +
    breakdown.packageFit +
    breakdown.ownerReachability +
    breakdown.competitiveAdvantage +
    breakdown.warmRelationship;
  return { total: clamp(total, 100), breakdown };
}

export function getLeadPriority(score: number): LeadPriority {
  if (score >= 85) return "priority_a";
  if (score >= 70) return "priority_b";
  if (score >= 55) return "nurture";
  if (score >= 40) return "low_priority";
  return "not_current_target";
}

export function getProjectedMrrFromRecommendation(
  recommendation: AuditPackageRecommendation,
): { current: number; standard: number } {
  const plan = getCurrentPublicPlanForPackageId(recommendation.packageId);
  return { current: plan.priceMonthly, standard: plan.priceMonthly };
}

export function getBestOutreachAngle(input: InternalLeadScoreInput): string {
  const { report } = input;
  const weakest = report.weakSpots[0]?.title;
  const cuisine = report.input.cuisineType;
  if (weakest) {
    return `Lead with the customer-flow weak spot: "${weakest}". Tie it to ${cuisine} customers slipping away online before they reach the door.`;
  }
  return `Lead with Veroxa's full customer-flow system for ${cuisine} restaurants and the current no-contract plan fit.`;
}

export function getLikelyObjection(input: InternalLeadScoreInput): string {
  const { report, contact } = input;
  if (report.totalScore < 40) {
    return "Owner may feel overwhelmed by how much needs to change. Frame Veroxa as the operating system that handles it for them, not another to-do list.";
  }
  if (report.totalScore >= 80) {
    return "Owner may feel their online presence is already 'good enough'. Show specific customer-flow gaps and the current plan fit as the reason to act now.";
  }
  if (!contact?.phone && !contact?.email) {
    return "No contact info yet — first objection is usually 'who is this'. Use a short value-led intro and the audit findings to earn the next 5 minutes.";
  }
  return "Likely objection: 'I post on social already / my nephew handles it.' Reframe: Veroxa is a system, not a poster — Google + content + reminders + reporting in one place.";
}

export function getSuggestedOpener(input: InternalLeadScoreInput): string {
  const { report } = input;
  const name = report.input.restaurantName;
  return `Hi ${name} team — your food already has potential. The online system around it can be stronger. I ran a quick Veroxa audit and wanted to show you where customers may be slipping away online before they reach the door.`;
}

function getSuggestedFollowUp(input: InternalLeadScoreInput): string {
  if (input.walkthroughRequested) {
    return "Send walkthrough confirmation with the audit summary and one weak spot example. Offer two 15-minute slots in the next 48 hours.";
  }
  return "Follow up in 3 business days with one specific weak spot fix Veroxa would tackle first. Keep it short and useful.";
}

export function getNextAction(
  input: InternalLeadScoreInput,
  priority: LeadPriority,
): string {
  if (input.walkthroughRequested) {
    return "Confirm walkthrough — call or email within 24 hours.";
  }
  switch (priority) {
    case "priority_a":
      return "Manual review now. Reach out within 24 hours with a tailored opener.";
    case "priority_b":
      return "Manual review this week. Personalize a short outreach using the audit weak spots.";
    case "nurture":
      return "Add to nurture cadence. Revisit in 2 weeks with one targeted insight.";
    case "low_priority":
      return "Park for now. Re-evaluate if owner contact info becomes available.";
    case "not_current_target":
      return "Do not pursue actively. Keep on file in case the restaurant returns.";
  }
}

function getWhyStrong(
  input: InternalLeadScoreInput,
  breakdown: InternalLeadScoreBreakdown,
): string[] {
  const reasons: string[] = [];
  if (breakdown.veroxaImpact >= 18) {
    reasons.push(
      "Sits in the sweet spot where Veroxa can measurably improve customer flow.",
    );
  }
  if (breakdown.googleMaps >= 11) {
    reasons.push(
      "Clear Google / Maps gap — early wins are realistic in the first 30–60 days.",
    );
  }
  if (breakdown.contentPotential >= 11) {
    reasons.push(
      "Strong content potential. Visual food content + weekly cadence would fill an obvious gap.",
    );
  }
  if (breakdown.packageFit >= 9) {
    reasons.push(
      "Recommended package has solid MRR potential and matches the weak spots.",
    );
  }
  if (breakdown.ownerReachability >= 6) {
    reasons.push(
      "Owner reachability is high — easy to start the conversation.",
    );
  }
  if (breakdown.warmRelationship >= 3) {
    reasons.push(
      "Warm or strategic relationship in place — lower friction to first meeting.",
    );
  }
  if (reasons.length === 0) {
    reasons.push(
      "No standout strengths yet. Treat as exploratory until more signal is gathered.",
    );
  }
  return reasons;
}

function getRisks(
  input: InternalLeadScoreInput,
  breakdown: InternalLeadScoreBreakdown,
): string[] {
  const risks: string[] = [];
  if (breakdown.ownerReachability <= 3) {
    risks.push("Limited or no contact info — outreach path is unclear.");
  }
  if (input.report.auditConfidence === "basic") {
    risks.push(
      "Audit confidence is basic. Live verification would strengthen the case before outreach.",
    );
  }
  if (input.report.totalScore < 30) {
    risks.push(
      "Online presence is very weak. Onboarding will be heavier; set expectations carefully.",
    );
  }
  if (input.report.totalScore > 85) {
    risks.push(
      "Restaurant may believe online is already strong enough — harder to create urgency.",
    );
  }
  if (breakdown.warmRelationship === 0) {
    risks.push("Cold lead — no warm context to lean on yet.");
  }
  if (risks.length === 0) {
    risks.push("No major risks flagged based on current signal.");
  }
  return risks;
}

export function generateInternalLeadAudit(
  input: InternalLeadScoreInput,
): InternalLeadAudit {
  const { total, breakdown } = calculateLeadSuccessScore(input);
  const priority = getLeadPriority(total);
  const mrr = getProjectedMrrFromRecommendation(input.report.recommendation);
  const profitFit = evaluateProfitFit({
    monthlyFee: mrr.standard,
    hasCapacityForMoreOrders: undefined,
    discountDependency: "unknown",
    deliveryAppDependency: "unknown",
    repeatCustomerPotential: "unknown",
  });
  return {
    score: total,
    breakdown,
    priority,
    projectedFoundingMonthlyMrr: mrr.current,
    projectedStandardMonthlyMrr: mrr.standard,
    whyThisLeadIsStrong: getWhyStrong(input, breakdown),
    risks: [
      ...getRisks(input, breakdown),
      profitFit.status === "needs_more_info"
        ? "Profit fit needs more info — confirm average ticket, margin, capacity, and order source mix before selling."
        : profitFit.mainRisk,
    ],
    profitFitSummary: formatProfitFitSummary(profitFit),
    recommendedOutreachAngle: getBestOutreachAngle(input),
    suggestedOpener: getSuggestedOpener(input),
    suggestedFollowUp: getSuggestedFollowUp(input),
    likelyObjection: getLikelyObjection(input),
    nextAction: getNextAction(input, priority),
  };
}

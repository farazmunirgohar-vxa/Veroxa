/**
 * leadScoringEngine.ts — deterministic lead intelligence analysis.
 *
 * Pure, rule-based transformation over public/provided signals. No network,
 * no scraping, no writes. Produces a LeadIntelligenceProfile that a human
 * reviews before any outreach. Marketing-investment signals are always framed
 * as POSSIBLE — never as confirmed agency spend.
 */

import type { AuditLeadRecord } from "@/lib/leads/leadTypes";
import { buildContactPaths } from "./contactPathEngine";
import {
  LEAD_SEGMENT_DESCRIPTIONS,
  LEAD_SEGMENT_LABELS,
  LEAD_NEXT_ACTION_LABELS,
  type ConversionOpportunityScore,
  type ExecutionInconsistencySignal,
  type LeadComplianceFlag,
  type LeadFitTier,
  type LeadIntelligenceProfile,
  type LeadNextAction,
  type LeadNextActionKind,
  type LeadSegment,
  type MarketingInvestmentSignal,
  type ReachabilitySignal,
  type SignalStrength,
} from "./leadIntelligenceTypes";

/**
 * Structural input for analysis. Decoupled from storage so the engine can run
 * on a saved AuditLeadRecord, a manual prospect, or a fixture. All fields are
 * public/provided observations only.
 */
export interface LeadIntelligenceInput {
  restaurantName: string;
  city: string;
  state: string;
  cuisineType?: string;
  /** 0..100 public audit score (higher = stronger presence). */
  auditScore?: number;
  auditGradeLabel?: string;
  recommendedPackageLabel?: string;
  weakSpotTitles?: string[];
  /** Presence / discovery signals (public). */
  websiteFound?: boolean;
  menuLinkFound?: boolean;
  orderLinkFound?: boolean;
  contactPathFound?: boolean;
  socialLinkCount?: number;
  hasInstagram?: boolean;
  hasFacebook?: boolean;
  hasGoogleListing?: boolean;
  googleRating?: number;
  googleReviewCount?: number;
  /** Public contact hints (provided, never scraped). */
  listedPhone?: string;
  publicOwnerOrManagerName?: string;
  websiteEmailProvided?: boolean;
  websiteContactFormProvided?: boolean;
  linkedinPublicProfileProvided?: boolean;
  /** Internal manual flags Veroxa team can set. */
  warmRelationship?: boolean;
  ownerReachability?: "low" | "medium" | "high";
  contactAvailable?: boolean;
}

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

function strengthFromScore(score: number): SignalStrength {
  if (score >= 66) return "high";
  if (score >= 33) return "medium";
  return "low";
}

/** Map a saved lead record into the structural analysis input. */
export function inputFromAuditLead(
  lead: AuditLeadRecord,
): LeadIntelligenceInput {
  const sr = lead.selectedRestaurant;
  const flags = lead.internalFlags;
  return {
    restaurantName: lead.restaurantName,
    city: lead.city,
    state: lead.state,
    cuisineType: lead.cuisineType,
    auditScore: lead.publicAudit.totalScore,
    auditGradeLabel: lead.publicAudit.gradeLabel,
    recommendedPackageLabel: lead.publicAudit.recommendedPackageLabel,
    weakSpotTitles: lead.publicAudit.weakSpotTitles,
    websiteFound: sr?.websiteFound ?? !!lead.links.websiteUrl,
    menuLinkFound: sr?.menuLinkFound ?? !!lead.links.menuOrderingUrl,
    orderLinkFound: sr?.orderLinkFound,
    contactPathFound: sr?.contactPathFound,
    socialLinkCount:
      sr?.discoveredSocialLinks?.length ??
      [lead.links.instagramUrl, lead.links.facebookUrl, lead.links.tiktokUrl].filter(
        Boolean,
      ).length,
    hasInstagram: !!lead.links.instagramUrl,
    hasFacebook: !!lead.links.facebookUrl,
    hasGoogleListing: !!lead.links.googleListingUrl || !!sr?.selectedGoogleMapsUrl,
    googleRating: sr?.selectedRating,
    googleReviewCount: sr?.selectedReviewCount,
    listedPhone: sr?.selectedPhone ?? lead.contact?.phone,
    websiteEmailProvided: !!lead.contact?.email,
    warmRelationship: flags?.warmRelationship,
    ownerReachability: flags?.ownerReachability,
    contactAvailable: flags?.contactAvailable,
  };
}

// ---------------------------------------------------------------------------
// Dimension scoring
// ---------------------------------------------------------------------------

function scoreImprovementRoom(input: LeadIntelligenceInput): number {
  // Lower audit score => more room to improve.
  const base =
    typeof input.auditScore === "number" ? 100 - input.auditScore : 60;
  let room = base;
  if (input.websiteFound === false) room += 12;
  if (input.menuLinkFound === false) room += 8;
  if (input.orderLinkFound === false) room += 4;
  if ((input.socialLinkCount ?? 0) === 0) room += 10;
  if (input.contactPathFound === false) room += 6;
  return clamp(room);
}

function scoreMarketingInvestment(input: LeadIntelligenceInput): number {
  // POSSIBLE paid-service signals only — presence of polished surfaces +
  // active channels can hint at investment, but is never treated as confirmed.
  let s = 0;
  if (input.websiteFound) s += 22;
  if (input.menuLinkFound) s += 10;
  if (input.orderLinkFound) s += 12;
  if ((input.socialLinkCount ?? 0) >= 2) s += 16;
  else if ((input.socialLinkCount ?? 0) === 1) s += 8;
  if ((input.googleReviewCount ?? 0) >= 150) s += 16;
  else if ((input.googleReviewCount ?? 0) >= 50) s += 8;
  if ((input.auditScore ?? 0) >= 70) s += 8;
  return clamp(s);
}

function scoreInconsistency(input: LeadIntelligenceInput): number {
  // Inconsistency = some surfaces present but others weak/missing, or a
  // mid-range audit with gaps. Strongest when there is partial presence.
  let s = 0;
  const present = [
    input.websiteFound,
    input.menuLinkFound,
    (input.socialLinkCount ?? 0) > 0,
    input.hasGoogleListing,
  ].filter(Boolean).length;
  const missing = [
    input.websiteFound === false,
    input.menuLinkFound === false,
    (input.socialLinkCount ?? 0) === 0,
    input.contactPathFound === false,
  ].filter(Boolean).length;
  if (present >= 1 && missing >= 1) s += 40; // partial presence = inconsistent
  s += missing * 8;
  const audit = input.auditScore ?? 50;
  if (audit >= 40 && audit <= 75) s += 18; // mid-range = mixed execution
  if ((input.weakSpotTitles?.length ?? 0) >= 2) s += 12;
  return clamp(s);
}

function scoreReachability(input: LeadIntelligenceInput): number {
  let s = 0;
  if (input.listedPhone) s += 30;
  if (input.contactPathFound) s += 16;
  if (input.websiteEmailProvided) s += 14;
  if (input.websiteContactFormProvided) s += 8;
  if (input.publicOwnerOrManagerName) s += 10;
  if (input.hasInstagram || input.hasFacebook) s += 8;
  if (input.linkedinPublicProfileProvided) s += 6;
  if (input.contactAvailable) s += 10;
  if (input.ownerReachability === "high") s += 14;
  else if (input.ownerReachability === "medium") s += 8;
  if (input.warmRelationship) s += 16;
  return clamp(s);
}

function scoreFit(input: LeadIntelligenceInput): number {
  // Veroxa's ideal: a real restaurant with clear improvement room that is
  // reachable. Fit balances "room to help" with "able to act".
  const room = scoreImprovementRoom(input);
  const reach = scoreReachability(input);
  let fit = room * 0.5 + reach * 0.4;
  if (input.warmRelationship) fit += 10;
  if ((input.googleReviewCount ?? 0) >= 20) fit += 6; // a real, operating venue
  if ((input.auditScore ?? 0) >= 85) fit -= 12; // already strong = lower fit
  return clamp(fit);
}

function scoreFoodVisualPotential(input: LeadIntelligenceInput): number {
  // POSSIBLE upside from better food visuals. A real, operating venue (reviews,
  // a listing) with thin/inconsistent visual presence has the most room. This
  // is an opportunity estimate, never a judgement of their current photos.
  const operating =
    (input.googleReviewCount ?? 0) >= 10 || input.hasGoogleListing === true;
  let s = operating ? 40 : 25;
  if ((input.socialLinkCount ?? 0) === 0) s += 24;
  else if ((input.socialLinkCount ?? 0) === 1) s += 12;
  if (input.websiteFound === false) s += 14;
  if (input.menuLinkFound === false) s += 8;
  if ((input.auditScore ?? 0) <= 50) s += 10;
  if ((input.auditScore ?? 0) >= 85) s -= 18; // already polished = less room
  return clamp(s);
}

function scoreAuditStrength(input: LeadIntelligenceInput): number {
  // How strong the public audit already looks. Higher = stronger execution.
  let s = typeof input.auditScore === "number" ? input.auditScore : 45;
  if (input.websiteFound) s += 4;
  if (input.menuLinkFound) s += 3;
  if ((input.socialLinkCount ?? 0) >= 2) s += 4;
  if ((input.googleReviewCount ?? 0) >= 50) s += 4;
  if ((input.weakSpotTitles?.length ?? 0) >= 3) s -= 8;
  return clamp(s);
}

function scoreDecisionMakerAccess(input: LeadIntelligenceInput): number {
  // How likely we can reach an actual owner/manager via public/provided paths.
  let s = 0;
  if (input.publicOwnerOrManagerName) s += 30;
  if (input.warmRelationship) s += 26;
  if (input.ownerReachability === "high") s += 22;
  else if (input.ownerReachability === "medium") s += 12;
  if (input.listedPhone) s += 14;
  if (input.linkedinPublicProfileProvided) s += 12;
  if (input.contactAvailable) s += 8;
  if (input.websiteEmailProvided) s += 6;
  return clamp(s);
}

function buildScore(input: LeadIntelligenceInput): ConversionOpportunityScore {
  const improvementRoomScore = scoreImprovementRoom(input);
  const marketingInvestmentSignalScore = scoreMarketingInvestment(input);
  const inconsistencyScore = scoreInconsistency(input);
  const reachabilityScore = scoreReachability(input);
  const fitScore = scoreFit(input);
  const foodVisualPotentialScore = scoreFoodVisualPotential(input);
  const auditStrengthScore = scoreAuditStrength(input);
  const decisionMakerAccessScore = scoreDecisionMakerAccess(input);
  const overallConversionOpportunity = clamp(
    improvementRoomScore * 0.26 +
      inconsistencyScore * 0.2 +
      reachabilityScore * 0.18 +
      fitScore * 0.18 +
      marketingInvestmentSignalScore * 0.08 +
      foodVisualPotentialScore * 0.06 +
      decisionMakerAccessScore * 0.04,
  );
  return {
    improvementRoomScore,
    marketingInvestmentSignalScore,
    inconsistencyScore,
    reachabilityScore,
    fitScore,
    foodVisualPotentialScore,
    auditStrengthScore,
    decisionMakerAccessScore,
    overallConversionOpportunity,
  };
}

// ---------------------------------------------------------------------------
// Signal narratives (cautious language only)
// ---------------------------------------------------------------------------

function buildMarketingSignal(
  input: LeadIntelligenceInput,
  score: number,
): MarketingInvestmentSignal {
  const observations: string[] = [];
  if (input.websiteFound)
    observations.push("Has a findable website — possible digital investment.");
  if (input.orderLinkFound)
    observations.push(
      "Online ordering link present — possible paid platform or setup help.",
    );
  if ((input.socialLinkCount ?? 0) >= 2)
    observations.push(
      "Active on multiple social channels — possible marketing effort or help.",
    );
  if ((input.googleReviewCount ?? 0) >= 150)
    observations.push(
      "High review volume — possible review-generation or marketing activity.",
    );
  const possible = observations.length > 0 && score >= 33;
  if (!possible) {
    observations.push(
      "No strong signal of existing paid marketing from public surfaces.",
    );
  }
  return {
    possiblePaidServiceSignal: possible,
    strength: strengthFromScore(score),
    observations,
    needsManualVerification: true,
  };
}

function buildInconsistencySignal(
  input: LeadIntelligenceInput,
  score: number,
): ExecutionInconsistencySignal {
  const observations: string[] = [];
  if (input.websiteFound && (input.socialLinkCount ?? 0) === 0)
    observations.push("Has a website but little or no social presence.");
  if (!input.websiteFound && (input.socialLinkCount ?? 0) > 0)
    observations.push("Active socially but no clear website found.");
  if (input.menuLinkFound === false)
    observations.push("Menu link is hard to find or missing.");
  if (input.contactPathFound === false)
    observations.push("No obvious contact path on public surfaces.");
  if ((input.weakSpotTitles?.length ?? 0) >= 2)
    observations.push("Audit flagged multiple weak spots in the basics.");
  if (observations.length === 0)
    observations.push("Execution looks fairly even across public surfaces.");
  return {
    inconsistent: score >= 40,
    strength: strengthFromScore(score),
    observations,
  };
}

function buildReachabilitySignal(
  input: LeadIntelligenceInput,
  score: number,
  usablePathCount: number,
): ReachabilitySignal {
  const observations: string[] = [];
  if (input.listedPhone) observations.push("A business phone appears available.");
  if (input.websiteEmailProvided)
    observations.push("A website email was provided.");
  if (input.warmRelationship)
    observations.push("Marked as a warm relationship — easier first contact.");
  if (input.ownerReachability)
    observations.push(`Owner reachability marked ${input.ownerReachability}.`);
  if (usablePathCount === 0)
    observations.push("No public contact path yet — needs manual research.");
  const level: ReachabilitySignal["level"] =
    score >= 66 ? "high" : score >= 33 ? "medium" : "low";
  return { level, observations, usablePathCount };
}

// ---------------------------------------------------------------------------
// Segmentation
// ---------------------------------------------------------------------------

function pickSegment(
  input: LeadIntelligenceInput,
  score: ConversionOpportunityScore,
  marketing: MarketingInvestmentSignal,
): LeadSegment {
  const presenceCount = [
    input.websiteFound,
    input.menuLinkFound,
    (input.socialLinkCount ?? 0) > 0,
    input.hasGoogleListing,
  ].filter(Boolean).length;

  if (score.overallConversionOpportunity < 30 && (input.auditScore ?? 0) >= 80) {
    return "already_strong_low_priority";
  }
  if (presenceCount <= 1 && score.improvementRoomScore >= 60) {
    return "no_online_presence_lead";
  }
  if (
    marketing.possiblePaidServiceSignal &&
    score.improvementRoomScore >= 45 &&
    (input.orderLinkFound || (input.socialLinkCount ?? 0) >= 2)
  ) {
    // Possible spend but weak basics => possible waste risk.
    if (score.inconsistencyScore >= 50) return "ads_waste_risk_lead";
    return "agency_spend_opportunity_lead";
  }
  if (score.reachabilityScore >= 45 && score.fitScore >= 50) {
    return "strong_fit_pilot_lead";
  }
  return "inconsistent_owner_managed_lead";
}

function fitTierFromScore(fitScore: number): LeadFitTier {
  if (fitScore >= 75) return "ideal_fit";
  if (fitScore >= 55) return "good_fit";
  if (fitScore >= 35) return "possible_fit";
  return "weak_fit";
}

// ---------------------------------------------------------------------------
// Reasons + sales angle + next actions
// ---------------------------------------------------------------------------

function buildTopReasons(
  input: LeadIntelligenceInput,
  score: ConversionOpportunityScore,
  segment: LeadSegment,
): string[] {
  const reasons: string[] = [];
  if (score.improvementRoomScore >= 60)
    reasons.push("Clear room to improve the public presence.");
  if (score.inconsistencyScore >= 50)
    reasons.push("Execution appears inconsistent across surfaces.");
  if (score.reachabilityScore >= 50)
    reasons.push("Looks reachable through a public contact path.");
  if (input.warmRelationship)
    reasons.push("Warm relationship lowers the barrier to a first conversation.");
  if (segment === "ads_waste_risk_lead")
    reasons.push(
      "Possible promotion spend with weak supporting basics — worth a careful look.",
    );
  if (segment === "already_strong_low_priority")
    reasons.push("Already executing well — lower priority for now.");
  if (reasons.length === 0)
    reasons.push("Mixed signals — review manually before prioritising.");
  return reasons.slice(0, 4);
}

function buildSalesAngle(segment: LeadSegment, name: string): string {
  switch (segment) {
    case "no_online_presence_lead":
      return `Offer ${name} a simple, done-for-you way to show up online consistently — start with the basics that are missing.`;
    case "inconsistent_owner_managed_lead":
      return `Acknowledge how hard it is to keep posting while running the floor, and offer to take consistency off ${name}'s plate.`;
    case "agency_spend_opportunity_lead":
      return `Lead with a free audit for ${name}; frame Veroxa as complementary help to tighten execution, never as a replacement attack on anyone they use.`;
    case "ads_waste_risk_lead":
      return `Offer to review whether ${name}'s current efforts are supported by strong basics — focus on making existing spend work harder, without criticising any vendor.`;
    case "strong_fit_pilot_lead":
      return `Invite ${name} to a quick audit walkthrough and propose a short pilot focused on one clear improvement.`;
    case "already_strong_low_priority":
      return `Keep ${name} warm — share a useful idea occasionally and revisit when there is a clear gap to help with.`;
  }
}

function buildNextActions(
  segment: LeadSegment,
  usablePathCount: number,
): LeadNextAction[] {
  const mk = (kind: LeadNextActionKind, detail: string): LeadNextAction => ({
    kind,
    label: LEAD_NEXT_ACTION_LABELS[kind],
    detail,
    requiresHumanReview:
      kind === "send_after_review" ||
      kind === "prepare_outreach" ||
      kind === "prepare_proposal",
  });

  const actions: LeadNextAction[] = [];
  if (usablePathCount === 0) {
    actions.push(
      mk(
        "verify_contact_path",
        "Find a public contact path manually before any outreach.",
      ),
    );
  } else {
    actions.push(
      mk(
        "verify_contact_path",
        "Confirm the best public contact path is current.",
      ),
    );
  }

  if (segment === "already_strong_low_priority") {
    actions.push(mk("nurture_later", "Revisit when a clear gap appears."));
    return actions;
  }

  actions.push(
    mk("prepare_outreach", "Prepare a cautious, value-based first message."),
    mk("send_after_review", "A human reviews and sends — nothing auto-sends."),
    mk("run_or_share_audit", "Use the free audit to open a real conversation."),
    mk("book_audit_walkthrough", "Offer a short walkthrough of the findings."),
    mk("schedule_meeting", "Schedule a meeting if there is interest."),
    mk("begin_onboarding", "If they say yes, start the onboarding checklist."),
  );
  return actions;
}

function buildComplianceFlags(usablePathCount: number): LeadComplianceFlag[] {
  const flags: LeadComplianceFlag[] = [
    {
      type: "human_review_required",
      note: "Every outreach draft must be reviewed by a human before use.",
    },
    {
      type: "no_auto_send",
      note: "Veroxa never auto-sends email, calls, or texts from this engine.",
    },
    {
      type: "no_confirmed_spend_claim",
      note: "Marketing-investment signals are possible only — never confirmed.",
    },
    {
      type: "no_vendor_disparagement",
      note: "Never criticise a current agency or vendor in outreach.",
    },
    {
      type: "no_guaranteed_results",
      note: "Never promise walk-ins, sales, rankings, or guaranteed outcomes.",
    },
    {
      type: "no_private_contact_scraping",
      note: "Only public/provided contact paths are used — no private scraping.",
    },
  ];
  if (usablePathCount === 0) {
    flags.push({
      type: "needs_manual_contact_research",
      note: "No public contact path found yet — manual research required first.",
    });
  }
  return flags;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function analyzeLeadIntelligence(
  input: LeadIntelligenceInput,
): LeadIntelligenceProfile {
  const score = buildScore(input);
  const contactPaths = buildContactPaths(input);
  const usablePathCount = contactPaths.filter(
    (p) => p.confidence !== "needs_research",
  ).length;

  const marketing = buildMarketingSignal(
    input,
    score.marketingInvestmentSignalScore,
  );
  const inconsistency = buildInconsistencySignal(
    input,
    score.inconsistencyScore,
  );
  const reachability = buildReachabilitySignal(
    input,
    score.reachabilityScore,
    usablePathCount,
  );

  const segment = pickSegment(input, score, marketing);
  const location = [input.city, input.state].filter(Boolean).join(", ");

  return {
    restaurantName: input.restaurantName,
    location,
    segment,
    segmentLabel: LEAD_SEGMENT_LABELS[segment],
    segmentDescription: LEAD_SEGMENT_DESCRIPTIONS[segment],
    fitTier: fitTierFromScore(score.fitScore),
    score,
    marketingInvestment: marketing,
    inconsistency,
    reachability,
    contactPaths,
    topReasons: buildTopReasons(input, score, segment),
    recommendedSalesAngle: buildSalesAngle(segment, input.restaurantName),
    nextActions: buildNextActions(segment, usablePathCount),
    complianceFlags: buildComplianceFlags(usablePathCount),
  };
}

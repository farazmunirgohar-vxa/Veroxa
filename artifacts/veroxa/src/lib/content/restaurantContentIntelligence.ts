/**
 * restaurantContentIntelligence.ts — the Restaurant Content Intelligence
 * Pipeline. For each client upload, this rule-based engine reasons about the
 * restaurant, the media, the customer moment, the content angle, platform
 * adaptation, timing, and claim risk BEFORE preparing strategic caption
 * drafts — and only when the media/context passes a quality gate.
 *
 * RULE-BASED ONLY. Deterministic. No live model calls, no network, no cloud
 * writes, no publishing, no auto-messaging, no notifications. If a real AI
 * provider is wired later (server-side only), it can sit behind this same
 * interface; this module is the safe fallback that always produces structured,
 * claim-safe output. Every output is a DRAFT that requires Veroxa team
 * approval — nothing here is final and nothing guarantees an outcome.
 *
 * Caption safety: drafts never invent menu items, discounts, specials, prices,
 * or halal/authentic/family-owned/health/"best in town"/guarantee claims.
 * Those require explicit client confirmation.
 */

import type { ClientTeamSubmission } from "@/data/demo/demoClientTeamWork";
import type {
  AiConfidenceLevel,
  AiRiskLevel,
} from "@/lib/ai/aiAgentTypes";
import {
  CONTENT_ANGLE_LABELS,
  CUSTOMER_MOMENT_LABELS,
  CUSTOMER_MOMENT_WINDOWS,
  type ContentAngle,
  type CustomerMoment,
} from "./customerMomentTypes";

/**
 * The minimal submission shape the pipeline reads. Accepting a structural
 * subset (rather than the full `ClientTeamSubmission`) lets client-safe
 * views (e.g. `ClientVisibleSubmission`, which omits `internalTeamNote`)
 * use the engine without leaking team-only fields.
 */
export type ContentIntelligenceInput = Pick<
  ClientTeamSubmission,
  "id" | "description" | "status" | "submissionType"
> &
  Partial<Pick<ClientTeamSubmission, "workType">>;

// ===========================================================================
// STAGE 1 — Layer output types
// ===========================================================================

/** Media usability gate — controls whether captions may be drafted at all. */
export type MediaUsability =
  | "usable_now"
  | "needs_context"
  | "save_for_later"
  | "not_recommended";

export const MEDIA_USABILITY_LABELS: Record<MediaUsability, string> = {
  usable_now: "Usable now",
  needs_context: "Needs context",
  save_for_later: "Save for later",
  not_recommended: "Not recommended",
};

export type MediaQualityLabel = "Strong" | "Good" | "Mixed" | "Needs context";

/** Layer 1 — what we know about the restaurant (confirmed facts only). */
export interface RestaurantKnowledge {
  restaurantName: string;
  /** Cuisine/category only when known; never invented. */
  cuisineOrCategory?: string;
  /** Menu items only when the client has confirmed them. */
  knownMenuItems: string[];
  /** Claims confirmed by the client — safe to use publicly. */
  confirmedClaims: string[];
  /** Tone guidance for captions. */
  toneGuidance: string;
  /** Knowledge gaps the team should fill with the client. */
  missingKnowledgeFields: string[];
}

/** Layer 2 — what the media is and whether it can carry a caption. */
export interface MediaUnderstanding {
  mediaType: string;
  /** Visible subject only when known/provided; never invented. */
  visibleSubject?: string;
  usability: MediaUsability;
  qualityLabel: MediaQualityLabel;
  /** Short questions to send the client when context is missing. */
  missingContextQuestions: string[];
  /** Gate: when false, the pipeline must NOT generate captions. */
  captionDraftingAllowed: boolean;
}

/** Layer 3 — the customer decision moment the post should catch. */
export interface CustomerMomentAnalysis {
  moment: CustomerMoment;
  momentLabel: string;
  why: string;
  bestMealWindow: string;
  confidence: AiConfidenceLevel;
}

/** Layer 4 — the editorial angle (team-facing reasoning, not client hype). */
export interface ContentAngleAnalysis {
  primaryAngle: ContentAngle;
  primaryAngleLabel: string;
  secondaryAngle?: ContentAngle;
  secondaryAngleLabel?: string;
  why: string;
}

export type CaptionPurpose = "reach_craving" | "trust_story" | "action_visit";

export const CAPTION_PURPOSE_LABELS: Record<CaptionPurpose, string> = {
  reach_craving: "Reach / craving",
  trust_story: "Trust / story",
  action_visit: "Action / visit",
};

export type SocialPlatform = "instagram" | "facebook" | "tiktok" | "google_business_profile";

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  google_business_profile: "Google Business Profile",
};

/** Layer 5 — a single strategic caption draft. */
export interface CaptionDraft {
  purpose: CaptionPurpose;
  purposeLabel: string;
  draftText: string;
  draftPurpose: string;
  bestPlatform: SocialPlatform;
  bestPlatformLabel: string;
  recommendedUse: string;
  riskFlags: string[];
  needsClientConfirmation: boolean;
}

/** Layer 5 — the set of strategic caption drafts (A/B/C) or a gated hold. */
export interface CaptionDraftSet {
  /** True when the media/context gate allowed caption drafting. */
  draftingAllowed: boolean;
  drafts: CaptionDraft[];
  /** When drafting is gated, the question to ask the client instead. */
  clarificationQuestion?: string;
  /** Plain-language team note, e.g. the "needs client context" message. */
  teamNote: string;
  confidence: AiConfidenceLevel;
}

/** Layer 6 — per-platform adaptation notes for an approved draft. */
export interface PlatformAdaptation {
  platform: SocialPlatform;
  platformLabel: string;
  note: string;
}

/** Layer 6 — scheduling recommendation tied to the customer moment. */
export interface ScheduleRecommendation {
  recommendedWindow: string;
  reason: string;
  moment: CustomerMoment;
  momentLabel: string;
  /** Always true here — there is no live publishing connection. */
  publishingConnectionPending: true;
  approvalRequired: true;
}

/** Layer 7 — claim / risk review protecting against invented facts. */
export interface ClaimRiskReview {
  claimRisk: AiRiskLevel;
  missingInfo: string[];
  /** Specific invented-fact risks detected in provided text, if any. */
  inventedFactRisk: string[];
  clientConfirmationRequired: boolean;
  approvalGate: string;
}

export type TeamNextAction = "approve" | "edit" | "ask_client" | "hold" | "reject";

export const TEAM_NEXT_ACTION_LABELS: Record<TeamNextAction, string> = {
  approve: "Approve",
  edit: "Edit",
  ask_client: "Ask client",
  hold: "Hold",
  reject: "Reject",
};

/** Layer 7 — the recommendation the team acts on. */
export interface TeamRecommendation {
  /** Index of the recommended best draft, or null when gated. */
  bestDraftIndex: number | null;
  bestDraftPurposeLabel?: string;
  nextAction: TeamNextAction;
  nextActionLabel: string;
  rationale: string;
  confidence: AiConfidenceLevel;
}

/** Placeholder for a future learning loop (no learning happens today). */
export interface LearningSignal {
  /** Not active yet — outcomes are not tracked or fed back. */
  status: "not_active";
  note: string;
}

/** Client-safe status — the only content statuses a client may see. */
export type ClientContentIntelligenceStatus =
  | "Submitted"
  | "Being reviewed"
  | "Needs your input"
  | "Prepared by Veroxa";

/** The full per-upload intelligence output. */
export interface RestaurantContentIntelligence {
  submissionId: string;
  restaurantKnowledge: RestaurantKnowledge;
  mediaUnderstanding: MediaUnderstanding;
  customerMoment: CustomerMomentAnalysis;
  contentAngle: ContentAngleAnalysis;
  captionDraftSet: CaptionDraftSet;
  platformAdaptations: PlatformAdaptation[];
  scheduleRecommendation: ScheduleRecommendation;
  claimRiskReview: ClaimRiskReview;
  teamRecommendation: TeamRecommendation;
  learningSignal: LearningSignal;
  /** The only status safe to render on client pages. */
  clientStatus: ClientContentIntelligenceStatus;
  /** True for every output — nothing is final without team approval. */
  humanApprovalRequired: true;
}

// ===========================================================================
// Deterministic helpers
// ===========================================================================

function stableHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Claim language captions must never assert unless the client provides it. */
const CLAIM_RISK_TERMS = [
  "halal",
  "authentic",
  "family-owned",
  "family owned",
  "best",
  "guaranteed",
  "guarantee",
  "discount",
  "% off",
  "percent off",
  "free",
  "healthy",
  "healthiest",
  "cheapest",
  "voted",
  "award",
];

const CAPTION_SAFETY_RISK_NOTE =
  "No invented menu items, prices, specials, or halal/authentic/family-owned/health/best-in-town claims.";

// ===========================================================================
// STAGE 2 — Layer 1: Restaurant Knowledge
// ===========================================================================

function buildRestaurantKnowledge(
  submission: ContentIntelligenceInput,
  restaurantName: string,
): RestaurantKnowledge {
  const desc = submission.description.toLowerCase();
  const knownMenuItems: string[] = [];
  const confirmedClaims: string[] = [];

  // Only treat a claim as "confirmed" when the client explicitly stated it.
  for (const term of ["halal", "authentic", "family-owned", "family owned"]) {
    if (desc.includes(term)) confirmedClaims.push(term);
  }

  const missingKnowledgeFields: string[] = [];
  if (submission.description.trim().length < 30) {
    missingKnowledgeFields.push("Dish name / what the item is");
    missingKnowledgeFields.push("When the client usually wants to promote it");
  }
  if (confirmedClaims.length === 0) {
    missingKnowledgeFields.push("Any verified claims (halal, awards, etc.)");
  }

  return {
    restaurantName,
    cuisineOrCategory: undefined,
    knownMenuItems,
    confirmedClaims,
    toneGuidance:
      "Warm, owner-voiced, and simple. One clear invitation. No hype, no guarantees.",
    missingKnowledgeFields,
  };
}

// ===========================================================================
// STAGE 2 — Layer 2: Media Understanding (the caption gate)
// ===========================================================================

function qualityLabelForScore(score: number): MediaQualityLabel {
  if (score >= 80) return "Strong";
  if (score >= 65) return "Good";
  if (score >= 50) return "Mixed";
  return "Needs context";
}

function buildMediaUnderstanding(
  submission: ContentIntelligenceInput,
): MediaUnderstanding {
  const hasContext = submission.description.trim().length >= 30;
  const base = 55 + (stableHash(submission.id) % 34);
  const contextBonus = hasContext ? 6 : -6;
  const statusPenalty =
    submission.status === "blocked"
      ? -15
      : submission.status === "needs_client_clarification"
        ? -8
        : 0;
  const score = Math.max(20, Math.min(95, base + contextBonus + statusPenalty));
  const qualityLabel = qualityLabelForScore(score);

  const isMedia =
    submission.submissionType === "media" ||
    submission.workType === "media_review" ||
    submission.workType === "content";
  const mediaType = isMedia ? "Photo / video upload" : "Request / update (no media)";

  let usability: MediaUsability;
  if (submission.status === "blocked") {
    usability = "not_recommended";
  } else if (!hasContext || submission.status === "needs_client_clarification") {
    usability = "needs_context";
  } else if (score >= 80) {
    usability = "usable_now";
  } else if (score >= 60) {
    usability = "save_for_later";
  } else {
    usability = "needs_context";
  }

  const missingContextQuestions: string[] = [];
  if (usability === "needs_context") {
    missingContextQuestions.push(
      "Can you tell us what this item is and when you usually want to promote it?",
    );
  }
  if (usability === "not_recommended") {
    missingContextQuestions.push(
      "This one may need a reshoot — is a clearer photo available?",
    );
  }

  // The gate: captions are allowed only when media is usable now or a safe
  // filler ("save_for_later"). Needs-context / not-recommended hold drafting.
  const captionDraftingAllowed =
    usability === "usable_now" || usability === "save_for_later";

  return {
    mediaType,
    visibleSubject: undefined,
    usability,
    qualityLabel,
    missingContextQuestions,
    captionDraftingAllowed,
  };
}

// ===========================================================================
// STAGE 3 — Layer 3: Customer Moment + Layer 4: Content Angle
// ===========================================================================

const MOMENT_POOL: CustomerMoment[] = [
  "lunch_decision",
  "dinner_craving",
  "weekend_family_meal",
  "late_night_snack",
  "office_lunch",
  "halal_food_search",
  "comfort_food",
  "new_customer_trust",
  "repeat_customer_reminder",
  "special_menu_discovery",
  "behind_the_scenes_trust",
];

function chooseCustomerMoment(
  submission: ContentIntelligenceInput,
  hasContext: boolean,
): CustomerMomentAnalysis {
  const desc = submission.description.toLowerCase();
  let moment: CustomerMoment;

  if (submission.submissionType === "promotion") {
    moment = "special_menu_discovery";
  } else if (submission.submissionType === "menu_update") {
    moment = "special_menu_discovery";
  } else if (desc.includes("halal")) {
    moment = "halal_food_search";
  } else if (desc.includes("family")) {
    moment = "weekend_family_meal";
  } else if (desc.includes("lunch")) {
    moment = "lunch_decision";
  } else if (desc.includes("dinner")) {
    moment = "dinner_craving";
  } else if (submission.workType === "media_review") {
    moment = "behind_the_scenes_trust";
  } else {
    moment = MOMENT_POOL[stableHash(submission.id) % MOMENT_POOL.length] as CustomerMoment;
  }

  const windowInfo = CUSTOMER_MOMENT_WINDOWS[moment];
  return {
    moment,
    momentLabel: CUSTOMER_MOMENT_LABELS[moment],
    why: `${windowInfo.reason} Chosen from the upload type and any context the client provided.`,
    bestMealWindow: windowInfo.window,
    confidence: hasContext ? "medium" : "low",
  };
}

function chooseContentAngle(
  submission: ContentIntelligenceInput,
  moment: CustomerMoment,
): ContentAngleAnalysis {
  let primary: ContentAngle;
  let secondary: ContentAngle | undefined;

  switch (moment) {
    case "special_menu_discovery":
      primary = "menu_education";
      secondary = "visit_action";
      break;
    case "halal_food_search":
      primary = "trust_story";
      secondary = "craving";
      break;
    case "weekend_family_meal":
      primary = "family_group";
      secondary = "craving";
      break;
    case "behind_the_scenes_trust":
      primary = "behind_the_scenes";
      secondary = "trust_story";
      break;
    case "new_customer_trust":
      primary = "review_trust";
      secondary = "trust_story";
      break;
    case "repeat_customer_reminder":
      primary = "visit_action";
      secondary = "craving";
      break;
    case "lunch_decision":
    case "office_lunch":
    case "dinner_craving":
    case "late_night_snack":
    case "comfort_food":
    default:
      primary = "craving";
      secondary = "visit_action";
      break;
  }

  if (submission.submissionType === "promotion") {
    primary = "offer_special_if_provided";
    secondary = "visit_action";
  }
  if (submission.workType === "google_update") {
    primary = "google_profile_freshness";
    secondary = undefined;
  }

  return {
    primaryAngle: primary,
    primaryAngleLabel: CONTENT_ANGLE_LABELS[primary],
    secondaryAngle: secondary,
    secondaryAngleLabel: secondary ? CONTENT_ANGLE_LABELS[secondary] : undefined,
    why: "Angle chosen to improve reach and remind nearby customers — for team review, not client-facing hype.",
  };
}

// ===========================================================================
// STAGE 4 — Layer 5: Three strategic caption drafts
// ===========================================================================

function detectClaimRisks(text: string): string[] {
  const lower = text.toLowerCase();
  return CLAIM_RISK_TERMS.filter((t) => lower.includes(t));
}

function buildCaptionDraftSet(
  submission: ContentIntelligenceInput,
  restaurantName: string,
  media: MediaUnderstanding,
  hasContext: boolean,
): CaptionDraftSet {
  if (!media.captionDraftingAllowed) {
    const clarificationQuestion =
      media.missingContextQuestions[0] ??
      "Can you tell us what this item is and when you usually want to promote it?";
    return {
      draftingAllowed: false,
      drafts: [],
      clarificationQuestion,
      teamNote: "Needs client context before caption drafting.",
      confidence: "low",
    };
  }

  const name = restaurantName;
  const claimRisks = detectClaimRisks(submission.description);
  // When context is weak we still draft, but generic + safe + low confidence.
  const confidence: AiConfidenceLevel = hasContext ? "medium" : "low";

  const drafts: CaptionDraft[] = [
    {
      purpose: "reach_craving",
      purposeLabel: CAPTION_PURPOSE_LABELS.reach_craving,
      draftText: `Fresh from our kitchen today — come see what's on at ${name}.`,
      draftPurpose: "Catch attention and spark a craving for new reach.",
      bestPlatform: "instagram",
      bestPlatformLabel: SOCIAL_PLATFORM_LABELS.instagram,
      recommendedUse: "Lead visual post — short, appetite-first caption.",
      riskFlags: [CAPTION_SAFETY_RISK_NOTE],
      needsClientConfirmation: !hasContext,
    },
    {
      purpose: "trust_story",
      purposeLabel: CAPTION_PURPOSE_LABELS.trust_story,
      draftText: `Made with care and served with a smile — that's the everyday at ${name}.`,
      draftPurpose: "Build trust with a warm, community-minded story.",
      bestPlatform: "facebook",
      bestPlatformLabel: SOCIAL_PLATFORM_LABELS.facebook,
      recommendedUse: "Warmer community post — relationship over reach.",
      riskFlags: [CAPTION_SAFETY_RISK_NOTE],
      needsClientConfirmation: !hasContext,
    },
    {
      purpose: "action_visit",
      purposeLabel: CAPTION_PURPOSE_LABELS.action_visit,
      draftText: `Planning your next meal out? Stop by ${name} this week — we'd love to have you.`,
      draftPurpose: "Invite a concrete visit without any guarantee or hype.",
      bestPlatform: "google_business_profile",
      bestPlatformLabel: SOCIAL_PLATFORM_LABELS.google_business_profile,
      recommendedUse: "Search-friendly, direct invitation with clear intent.",
      riskFlags: [CAPTION_SAFETY_RISK_NOTE],
      needsClientConfirmation: !hasContext,
    },
  ];

  let teamNote = hasContext
    ? "Three strategic drafts prepared (reach, trust, action). Team review required."
    : "Context is light — drafts kept generic but safe. Recommend asking the client for specifics. Team review required.";

  if (claimRisks.length > 0) {
    for (const d of drafts) {
      d.needsClientConfirmation = true;
      d.riskFlags.push(`Possible claim to verify: ${claimRisks.join(", ")}.`);
    }
    teamNote += " Possible claims detected — confirm with the client before public use.";
  }

  return {
    draftingAllowed: true,
    drafts,
    teamNote,
    confidence,
  };
}

// ===========================================================================
// STAGE 5 — Layer 6: Platform adaptation
// ===========================================================================

function buildPlatformAdaptations(angle: ContentAngle): PlatformAdaptation[] {
  return [
    {
      platform: "instagram",
      platformLabel: SOCIAL_PLATFORM_LABELS.instagram,
      note: "Short, visual, craving-first caption. Lead with the dish; keep words minimal.",
    },
    {
      platform: "facebook",
      platformLabel: SOCIAL_PLATFORM_LABELS.facebook,
      note: "Warmer, community-minded caption with a little more story.",
    },
    {
      platform: "tiktok",
      platformLabel: SOCIAL_PLATFORM_LABELS.tiktok,
      note: "Strong hook in the first line, then a short caption. No invented trends or claims.",
    },
    {
      platform: "google_business_profile",
      platformLabel: SOCIAL_PLATFORM_LABELS.google_business_profile,
      note:
        angle === "google_profile_freshness"
          ? "Direct, search-friendly update. Keep menu and location details clear and current."
          : "Direct, search-friendly post. Clear menu/location context; no hashtags needed.",
    },
  ];
}

// ===========================================================================
// STAGE 6 — Layer 6: Scheduling intelligence
// ===========================================================================

function buildScheduleRecommendation(
  moment: CustomerMomentAnalysis,
): ScheduleRecommendation {
  return {
    recommendedWindow: moment.bestMealWindow,
    reason: moment.why,
    moment: moment.moment,
    momentLabel: moment.momentLabel,
    publishingConnectionPending: true,
    approvalRequired: true,
  };
}

// ===========================================================================
// STAGE 7 — Layer 7: Claim/risk review + team recommendation
// ===========================================================================

function buildClaimRiskReview(
  submission: ContentIntelligenceInput,
  knowledge: RestaurantKnowledge,
  media: MediaUnderstanding,
): ClaimRiskReview {
  const inventedFactRisk = detectClaimRisks(submission.description).filter(
    (t) => !knowledge.confirmedClaims.includes(t),
  );
  const missingInfo = [...knowledge.missingKnowledgeFields];
  if (!media.captionDraftingAllowed) {
    missingInfo.push("Usable media or context before captioning");
  }

  let claimRisk: AiRiskLevel = "info";
  if (inventedFactRisk.length > 0) claimRisk = "warning";
  if (submission.status === "blocked") claimRisk = "warning";

  const clientConfirmationRequired =
    inventedFactRisk.length > 0 || !media.captionDraftingAllowed;

  return {
    claimRisk,
    missingInfo,
    inventedFactRisk,
    clientConfirmationRequired,
    approvalGate: "Claims confirmed and content approved before any public use.",
  };
}

function buildTeamRecommendation(
  captionSet: CaptionDraftSet,
  claimReview: ClaimRiskReview,
  media: MediaUnderstanding,
): TeamRecommendation {
  if (!captionSet.draftingAllowed) {
    return {
      bestDraftIndex: null,
      nextAction: "ask_client",
      nextActionLabel: TEAM_NEXT_ACTION_LABELS.ask_client,
      rationale: "Needs client context before caption drafting can begin.",
      confidence: "low",
    };
  }
  if (media.usability === "not_recommended") {
    return {
      bestDraftIndex: null,
      nextAction: "hold",
      nextActionLabel: TEAM_NEXT_ACTION_LABELS.hold,
      rationale: "Media quality is unlikely to carry a post — hold or request a reshoot.",
      confidence: "low",
    };
  }

  // Default best draft: action/visit (index 2) drives the clearest outcome,
  // unless claims need confirming — then recommend editing first.
  const bestDraftIndex = 2;
  const best = captionSet.drafts[bestDraftIndex];
  if (claimReview.clientConfirmationRequired) {
    return {
      bestDraftIndex,
      bestDraftPurposeLabel: best?.purposeLabel,
      nextAction: "ask_client",
      nextActionLabel: TEAM_NEXT_ACTION_LABELS.ask_client,
      rationale: "Drafts are ready, but a claim or detail needs client confirmation first.",
      confidence: captionSet.confidence,
    };
  }

  return {
    bestDraftIndex,
    bestDraftPurposeLabel: best?.purposeLabel,
    nextAction: captionSet.confidence === "low" ? "edit" : "approve",
    nextActionLabel:
      captionSet.confidence === "low"
        ? TEAM_NEXT_ACTION_LABELS.edit
        : TEAM_NEXT_ACTION_LABELS.approve,
    rationale:
      captionSet.confidence === "low"
        ? "Drafts are safe but generic — light edit recommended before approval."
        : "Action/visit draft is the strongest call to visit — approve or lightly edit.",
    confidence: captionSet.confidence,
  };
}

// ===========================================================================
// Client-safe status
// ===========================================================================

function clientStatusFor(
  submission: ContentIntelligenceInput,
  media: MediaUnderstanding,
  captionSet: CaptionDraftSet,
): ClientContentIntelligenceStatus {
  if (
    submission.status === "needs_client_clarification" ||
    !media.captionDraftingAllowed
  ) {
    return "Needs your input";
  }
  if (submission.status === "completed" || submission.status === "archived") {
    return "Prepared by Veroxa";
  }
  if (captionSet.draftingAllowed) {
    return "Being reviewed";
  }
  return "Submitted";
}

// ===========================================================================
// Main entry point — analyze one submission end to end.
// ===========================================================================

export function analyzeRestaurantContent(
  submission: ContentIntelligenceInput,
  restaurantName = "your restaurant",
): RestaurantContentIntelligence {
  const hasContext = submission.description.trim().length >= 30;

  const restaurantKnowledge = buildRestaurantKnowledge(submission, restaurantName);
  const mediaUnderstanding = buildMediaUnderstanding(submission);
  const customerMoment = chooseCustomerMoment(submission, hasContext);
  const contentAngle = chooseContentAngle(submission, customerMoment.moment);
  const captionDraftSet = buildCaptionDraftSet(
    submission,
    restaurantName,
    mediaUnderstanding,
    hasContext,
  );
  const platformAdaptations = buildPlatformAdaptations(contentAngle.primaryAngle);
  const scheduleRecommendation = buildScheduleRecommendation(customerMoment);
  const claimRiskReview = buildClaimRiskReview(
    submission,
    restaurantKnowledge,
    mediaUnderstanding,
  );
  const teamRecommendation = buildTeamRecommendation(
    captionDraftSet,
    claimRiskReview,
    mediaUnderstanding,
  );

  return {
    submissionId: submission.id,
    restaurantKnowledge,
    mediaUnderstanding,
    customerMoment,
    contentAngle,
    captionDraftSet,
    platformAdaptations,
    scheduleRecommendation,
    claimRiskReview,
    teamRecommendation,
    learningSignal: {
      status: "not_active",
      note: "Outcome learning is not active yet — no performance data is tracked or fed back.",
    },
    clientStatus: clientStatusFor(submission, mediaUnderstanding, captionDraftSet),
    humanApprovalRequired: true,
  };
}

// ---------------------------------------------------------------------------
// Compact summary for dashboards / queues.
// ---------------------------------------------------------------------------

export interface ContentIntelligenceSummary {
  draftsReady: number;
  needsContext: number;
  readyForSchedulingPrep: number;
  claimReviewNeeded: number;
  topNextAction: string;
}

export function summarizeContentIntelligence(
  submissions: ContentIntelligenceInput[],
  restaurantName = "your restaurant",
): ContentIntelligenceSummary {
  let draftsReady = 0;
  let needsContext = 0;
  let readyForSchedulingPrep = 0;
  let claimReviewNeeded = 0;
  let topNextAction = "Queue is clear — plan the next content capture.";
  let pickedTop = false;

  for (const s of submissions) {
    const intel = analyzeRestaurantContent(s, restaurantName);
    if (!intel.captionDraftSet.draftingAllowed) {
      needsContext += 1;
    } else {
      draftsReady += 1;
      if (intel.teamRecommendation.nextAction === "approve") {
        readyForSchedulingPrep += 1;
      }
    }
    if (intel.claimRiskReview.clientConfirmationRequired) {
      claimReviewNeeded += 1;
    }
    if (!pickedTop && intel.teamRecommendation.nextAction !== "approve") {
      topNextAction = `${intel.teamRecommendation.nextActionLabel}: ${intel.teamRecommendation.rationale}`;
      pickedTop = true;
    }
  }

  return {
    draftsReady,
    needsContext,
    readyForSchedulingPrep,
    claimReviewNeeded,
    topNextAction,
  };
}

/**
 * Phase 5 rule-based automation helpers.
 *
 * Deterministic, team-side assistance only: no live AI calls, no storage,
 * no publishing integrations, no messages, and no metrics fabrication. These
 * helpers prepare safe review-mode guidance for Faraz to approve, hold, skip,
 * ask the client about, or execute manually outside Veroxa.
 */

import type {
  DemoMediaItem,
  DemoMonthlyReport,
  DemoWeeklyReport,
} from "@/data/demoData";
import type { WorkflowItem } from "@/data/workflows/clientTeamWorkflow";
import type { PreparedAction } from "@/domain/preparedActions";

export type RuleRiskLevel = "low" | "medium" | "high" | "sensitive";

export interface MediaReviewAssistOutput {
  clientSafeStatus:
    | "Prepared by Veroxa"
    | "In review"
    | "More content needed"
    | "Saved for later";
  teamSuggestedUse:
    | "Usable food photo"
    | "Needs better media"
    | "Good for Google update"
    | "Good for social post"
    | "Good for Reels/TikTok support"
    | "Good for best-seller visibility"
    | "Save for later"
    | "Needs client context"
    | "Needs design prep";
  suggestedNextAction: string;
  clientInputNeeded: boolean;
  includeInReport: boolean;
  designPrepStatus:
    | "Needs design prep"
    | "Ready for design prep"
    | "Edited externally"
    | "Final asset pending"
    | "Not needed";
}

export function reviewMediaRules(
  item: Pick<
    DemoMediaItem,
    "type" | "title" | "status" | "qualityNote" | "suggestedUse"
  >,
): MediaReviewAssistOutput {
  const text =
    `${item.title} ${item.qualityNote} ${item.suggestedUse}`.toLowerCase();

  if (
    item.status === "Blurry" ||
    /blurry|needs replacement|reshoot|bad angle|dark/.test(text)
  ) {
    return {
      clientSafeStatus: "More content needed",
      teamSuggestedUse: "Needs better media",
      suggestedNextAction:
        "Ask client for a sharper replacement with better angle/lighting.",
      clientInputNeeded: true,
      includeInReport: true,
      designPrepStatus: "Not needed",
    };
  }

  if (item.status === "Duplicate") {
    return {
      clientSafeStatus: "Saved for later",
      teamSuggestedUse: "Save for later",
      suggestedNextAction:
        "Hold this duplicate angle unless the stronger version is unavailable.",
      clientInputNeeded: false,
      includeInReport: false,
      designPrepStatus: "Not needed",
    };
  }

  if (item.status === "Pending Review") {
    return {
      clientSafeStatus: "In review",
      teamSuggestedUse: text.includes("motion blur")
        ? "Needs client context"
        : "Needs design prep",
      suggestedNextAction: text.includes("motion blur")
        ? "Review manually and ask client whether a cleaner version is available."
        : "Review for manual design prep before scheduling.",
      clientInputNeeded: text.includes("motion blur"),
      includeInReport: true,
      designPrepStatus: "Needs design prep",
    };
  }

  if (item.type === "Video" || /reel|tiktok|clip|slow-mo|pour/.test(text)) {
    return {
      clientSafeStatus: "Prepared by Veroxa",
      teamSuggestedUse: "Good for Reels/TikTok support",
      suggestedNextAction:
        "Prepare a short-form caption and hold for Faraz approval before manual posting.",
      clientInputNeeded: false,
      includeInReport: true,
      designPrepStatus: "Ready for design prep",
    };
  }

  if (/google|profile|storefront|outside|front/.test(text)) {
    return {
      clientSafeStatus: "Prepared by Veroxa",
      teamSuggestedUse: "Good for Google update",
      suggestedNextAction:
        "Prepare a Google visibility update and queue it for approval.",
      clientInputNeeded: false,
      includeInReport: true,
      designPrepStatus: "Ready for design prep",
    };
  }

  if (
    /platter|taco|shawarma|kebab|latte|hero|close-up|lunch|dinner|special/.test(
      text,
    )
  ) {
    return {
      clientSafeStatus: "Prepared by Veroxa",
      teamSuggestedUse: "Good for best-seller visibility",
      suggestedNextAction:
        "Pair with a best-seller caption template and approve for manual execution.",
      clientInputNeeded: false,
      includeInReport: true,
      designPrepStatus: "Ready for design prep",
    };
  }

  return {
    clientSafeStatus: "Prepared by Veroxa",
    teamSuggestedUse: "Good for social post",
    suggestedNextAction: "Use as a supporting social post after Faraz review.",
    clientInputNeeded: false,
    includeInReport: true,
    designPrepStatus: "Ready for design prep",
  };
}

export type CaptionTemplateCategory =
  | "best_seller_highlight"
  | "lunch_push"
  | "dinner_push"
  | "weekend_reminder"
  | "family_local_trust"
  | "fresh_photo_post"
  | "google_update"
  | "special_event"
  | "catering_holiday"
  | "behind_the_scenes"
  | "review_reputation_reminder";

export interface CaptionDraftTemplate {
  category: CaptionTemplateCategory;
  internalTitle: string;
  suggestedChannel: string;
  captionBody: string;
  requiresClientConfirmation: boolean;
  riskNotes: string;
  suggestedMediaType: string;
  suggestedCta: string;
}

export const captionDraftTemplates: CaptionDraftTemplate[] = [
  {
    category: "best_seller_highlight",
    internalTitle: "Best-seller highlight",
    suggestedChannel: "Instagram / Facebook / Google update",
    captionBody:
      "A guest favourite is ready for your next meal. Fresh, simple, and easy to order today.",
    requiresClientConfirmation: false,
    riskNotes:
      "Do not name a best seller unless the restaurant has confirmed it.",
    suggestedMediaType: "Clear food close-up or platter photo",
    suggestedCta: "Order ahead or visit today",
  },
  {
    category: "lunch_push",
    internalTitle: "Lunch push",
    suggestedChannel: "Facebook / Instagram",
    captionBody:
      "Lunch plans can be simple today — stop in or order ahead for a fresh plate.",
    requiresClientConfirmation: false,
    riskNotes:
      "Avoid exact prices, discounts, or limited offers unless confirmed.",
    suggestedMediaType: "Bright food photo",
    suggestedCta: "Order lunch today",
  },
  {
    category: "dinner_push",
    internalTitle: "Dinner push",
    suggestedChannel: "Instagram / Facebook",
    captionBody:
      "Make dinner easier tonight with a fresh favourite from the kitchen.",
    requiresClientConfirmation: false,
    riskNotes:
      "Keep wording calm; no guaranteed wait times or delivery promises.",
    suggestedMediaType: "Dinner plate, platter, or warm interior photo",
    suggestedCta: "Plan dinner with us",
  },
  {
    category: "weekend_reminder",
    internalTitle: "Weekend reminder",
    suggestedChannel: "Google update / social post",
    captionBody:
      "Weekend meals are better when they are easy to plan. Save this spot for your next local bite.",
    requiresClientConfirmation: false,
    riskNotes: "Confirm holiday hours separately when relevant.",
    suggestedMediaType: "Group platter or atmosphere photo",
    suggestedCta: "Save for the weekend",
  },
  {
    category: "family_local_trust",
    internalTitle: "Family/local trust",
    suggestedChannel: "Facebook / Instagram",
    captionBody:
      "A local table, fresh food, and a meal worth sharing with the people around you.",
    requiresClientConfirmation: false,
    riskNotes: "Avoid claiming family-owned unless confirmed.",
    suggestedMediaType: "Dining room, team, or shared plate photo",
    suggestedCta: "Visit this week",
  },
  {
    category: "fresh_photo_post",
    internalTitle: "Fresh photo post",
    suggestedChannel: "Instagram / Facebook",
    captionBody: "Fresh from the kitchen and ready when you are.",
    requiresClientConfirmation: false,
    riskNotes: "Use only with recent/current menu items.",
    suggestedMediaType: "Recent food photo",
    suggestedCta: "Order or stop in",
  },
  {
    category: "google_update",
    internalTitle: "Google update",
    suggestedChannel: "Google Business Profile",
    captionBody:
      "Fresh food, updated photos, and an easy way to plan your next visit.",
    requiresClientConfirmation: false,
    riskNotes: "No Google ranking claims or fake live metrics.",
    suggestedMediaType: "Food or storefront photo",
    suggestedCta: "View menu or order ahead",
  },
  {
    category: "special_event",
    internalTitle: "Special/event",
    suggestedChannel: "Google update / social post",
    captionBody:
      "A timely update is coming soon — details will be shared after the restaurant confirms them.",
    requiresClientConfirmation: true,
    riskNotes:
      "Event dates, offers, prices, and availability must be confirmed by the client.",
    suggestedMediaType: "Event, menu, or hero food photo",
    suggestedCta: "Check back for details",
  },
  {
    category: "catering_holiday",
    internalTitle: "Catering/holiday",
    suggestedChannel: "Google update / Facebook",
    captionBody:
      "Planning food for a group or holiday? Confirm availability with the restaurant before sharing details publicly.",
    requiresClientConfirmation: true,
    riskNotes:
      "Catering availability, lead times, menus, and prices require client confirmation.",
    suggestedMediaType: "Tray, platter, or group serving photo",
    suggestedCta: "Ask about availability",
  },
  {
    category: "behind_the_scenes",
    internalTitle: "Behind-the-scenes",
    suggestedChannel: "Reels/TikTok support",
    captionBody:
      "A quick look behind the scenes at what is being prepared today.",
    requiresClientConfirmation: false,
    riskNotes: "Avoid staff names or sensitive kitchen claims unless approved.",
    suggestedMediaType: "Short kitchen/process clip",
    suggestedCta: "Follow for more",
  },
  {
    category: "review_reputation_reminder",
    internalTitle: "Review/reputation reminder",
    suggestedChannel: "Internal client reminder",
    captionBody:
      "If a guest had a great experience, a short review can help future customers choose with confidence.",
    requiresClientConfirmation: false,
    riskNotes: "No incentives for reviews; keep it optional and honest.",
    suggestedMediaType: "None required",
    suggestedCta: "Ask happy guests naturally",
  },
];

export interface BrandVoiceGuardResult {
  riskLevel: RuleRiskLevel;
  issueLabel: string;
  suggestedSaferLanguage: string;
  clientConfirmationRequired: boolean;
  farazApprovalRequired: true;
}

const brandVoicePatterns: Array<
  [RegExp, Omit<BrandVoiceGuardResult, "farazApprovalRequired">]
> = [
  [
    /\b(guarantee|guaranteed).{0,40}(rank|ranking|google|maps|top|first)\b/i,
    {
      riskLevel: "high",
      issueLabel: "Guaranteed ranking claim",
      suggestedSaferLanguage:
        "This work is intended to improve findability over time.",
      clientConfirmationRequired: false,
    },
  ],
  [
    /\b(guarantee|guaranteed|promise).{0,40}(revenue|customer|walk-?in|sales|orders)\b/i,
    {
      riskLevel: "high",
      issueLabel: "Guaranteed outcome claim",
      suggestedSaferLanguage:
        "This work supports more customer opportunity, without guaranteeing outcomes.",
      clientConfirmationRequired: false,
    },
  ],
  [
    /\b(halal|organic|gluten[- ]free|healthy|allergy|allergen)\b/i,
    {
      riskLevel: "sensitive",
      issueLabel: "Dietary/health claim",
      suggestedSaferLanguage:
        "Use only client-confirmed dietary or health wording.",
      clientConfirmationRequired: true,
    },
  ],
  [
    /(\$\d+|\bprice\b|\bdiscount\b|\boffer\b|\bdeal\b|\bspecial\b)/i,
    {
      riskLevel: "sensitive",
      issueLabel: "Price/offer claim",
      suggestedSaferLanguage:
        "Confirm exact price, offer, and availability before public use.",
      clientConfirmationRequired: true,
    },
  ],
  [
    /\b(angry|terrible|refund|complaint|food safety|lawsuit|sue|never come back)\b/i,
    {
      riskLevel: "sensitive",
      issueLabel: "Sensitive complaint language",
      suggestedSaferLanguage:
        "Use a calm reply and ask the client before serious complaint responses.",
      clientConfirmationRequired: true,
    },
  ],
  [
    /\b(best in town|number one|#1|the best)\b/i,
    {
      riskLevel: "medium",
      issueLabel: "Unsupported superlative",
      suggestedSaferLanguage:
        "Use softer wording such as guest favourite or local favourite when true.",
      clientConfirmationRequired: false,
    },
  ],
  [
    /\b(we handle (dm|dms|comments|refunds|complaints|orders)|customer service)\b/i,
    {
      riskLevel: "high",
      issueLabel: "Customer-service promise",
      suggestedSaferLanguage:
        "Veroxa prepares visibility and content work; the restaurant handles customer conversations.",
      clientConfirmationRequired: false,
    },
  ],
  [
    /\b(ad spend included|ads budget included|free ad spend)\b/i,
    {
      riskLevel: "high",
      issueLabel: "Ad spend confusion",
      suggestedSaferLanguage:
        "Ad spend is separate and paid directly by the restaurant.",
      clientConfirmationRequired: false,
    },
  ],
  [
    /\b(live ai|ai is live|live storage|cloud storage connected|auto[- ]?publish|automatic publishing|payments connected)\b/i,
    {
      riskLevel: "high",
      issueLabel: "Live system claim",
      suggestedSaferLanguage:
        "Use review-mode language: prepared for manual review or future integration.",
      clientConfirmationRequired: false,
    },
  ],
];

export function checkBrandVoiceRules(copy: string): BrandVoiceGuardResult[] {
  return brandVoicePatterns
    .filter(([pattern]) => pattern.test(copy))
    .map(([, result]) => ({ ...result, farazApprovalRequired: true }));
}

export interface SchedulingSuggestion {
  suggestedWindow: string;
  reason: string;
  priority: "low" | "medium" | "high";
  clientTimingConfirmationNeeded: boolean;
  holdForLater: boolean;
}

export function suggestManualSchedule(input: {
  mealTime?: string;
  mediaType?: string;
  contentAngle?: string;
  preferredTiming?: string;
  platformType?: string;
  urgency?: "low" | "medium" | "high";
  weekendOrEvent?: boolean;
}): SchedulingSuggestion {
  if (input.preferredTiming) {
    return {
      suggestedWindow: input.preferredTiming,
      reason:
        "Client preferred timing is present; confirm if it changes business-truth details.",
      priority: input.urgency ?? "medium",
      clientTimingConfirmationNeeded: true,
      holdForLater: false,
    };
  }
  const angle =
    `${input.mealTime ?? ""} ${input.contentAngle ?? ""} ${input.platformType ?? ""}`.toLowerCase();
  if (input.weekendOrEvent)
    return {
      suggestedWindow: "Thu/Fri afternoon for weekend planning",
      reason: "Gives guests time to plan before the weekend or event.",
      priority: "high",
      clientTimingConfirmationNeeded: true,
      holdForLater: false,
    };
  if (/lunch/.test(angle))
    return {
      suggestedWindow: "Late morning before lunch",
      reason:
        "Matches lunch decision timing without scheduling anything automatically.",
      priority: input.urgency ?? "medium",
      clientTimingConfirmationNeeded: false,
      holdForLater: false,
    };
  if (/dinner/.test(angle))
    return {
      suggestedWindow: "Late afternoon before dinner",
      reason: "Matches dinner planning timing for manual posting.",
      priority: input.urgency ?? "medium",
      clientTimingConfirmationNeeded: false,
      holdForLater: false,
    };
  if (/reel|tiktok|video/.test(`${input.mediaType ?? ""} ${angle}`))
    return {
      suggestedWindow: "Early evening review window",
      reason:
        "Short-form video can be prepared for manual review during a high-attention window.",
      priority: input.urgency ?? "medium",
      clientTimingConfirmationNeeded: false,
      holdForLater: false,
    };
  return {
    suggestedWindow: "Next available team review window",
    reason: "No timing-specific signal; keep it in manual review mode.",
    priority: input.urgency ?? "low",
    clientTimingConfirmationNeeded: false,
    holdForLater: input.urgency === "low",
  };
}

export interface ReportDraftSection {
  title: string;
  items: string[];
}

export interface RuleBasedReportDraft {
  reportType: "weekly" | "monthly";
  reviewStatus:
    | "Draft needed"
    | "Ready for review"
    | "Missing data"
    | "Reviewed"
    | "Included in client portal"
    | "Hold";
  sections: ReportDraftSection[];
  honestLimitations: string[];
  nextAction: string;
}

export function buildRuleBasedReportDraft(input: {
  reportType: "weekly" | "monthly";
  restaurantName: string;
  weekly?: DemoWeeklyReport;
  monthly?: DemoMonthlyReport;
  mediaUsed?: string[];
  workCompleted?: string[];
}): RuleBasedReportDraft {
  const hasWork = (input.workCompleted?.length ?? 0) > 0;
  const hasMedia = (input.mediaUsed?.length ?? 0) > 0;
  const sections: ReportDraftSection[] = [
    {
      title: "Work completed",
      items: input.workCompleted?.length
        ? input.workCompleted
        : ["No completed work is connected to this draft yet."],
    },
    {
      title: "Media used/prepared",
      items: input.mediaUsed?.length
        ? input.mediaUsed
        : [input.weekly?.mediaStatus ?? "Media usage is not connected yet."],
    },
    {
      title: "Customer opportunity work",
      items: [
        "Summarize findability, trust, choice, media freshness, and best-seller visibility work only from reviewed items.",
      ],
    },
    {
      title: "Google/local visibility progress",
      items: input.monthly?.strategicNotes ?? [
        "No live Google/local metrics are connected yet; use only reviewed visibility notes.",
      ],
    },
    {
      title: "What Veroxa needs from client",
      items: [
        input.weekly?.notes ??
          "Confirm any missing media, hours, menu details, offers, or catering details before public use.",
      ],
    },
  ];
  const honestLimitations = [
    "No fake ROI, ranking changes, calls, directions, or clicks should be added without real connected data.",
    "Report draft is review-mode and must be verified before it becomes client-visible.",
  ];
  return {
    reportType: input.reportType,
    reviewStatus: hasWork || hasMedia ? "Ready for review" : "Missing data",
    sections,
    honestLimitations,
    nextAction:
      hasWork || hasMedia
        ? "Verify the draft, remove unavailable metrics, and include approved work only."
        : "Collect reviewed work/media before drafting the report.",
  };
}

export type ManualPublishingStatus =
  | "Prepared"
  | "Needs approval"
  | "Approved for manual execution"
  | "Manually posted"
  | "Included in report"
  | "Held"
  | "Skipped"
  | "Needs client confirmation";

export interface ManualExecutionPack {
  restaurantName: string;
  channel: string;
  mediaNote: string;
  captionDraft: string;
  suggestedPostingWindow: string;
  requiredConfirmation: string;
  riskNotes: string[];
  manualChecklist: string[];
  reportInclusionNote: string;
  status: ManualPublishingStatus;
}

export function buildManualExecutionPack(
  action: PreparedAction,
): ManualExecutionPack {
  const draft =
    action.payload.preparedText ??
    action.payload.keywordAngle ??
    "Prepare final copy manually before using.";
  const risks = checkBrandVoiceRules(draft);
  const schedule = suggestManualSchedule({
    contentAngle: action.type.replace(/_/g, " "),
    platformType: action.channel,
    urgency: action.priority === "high" ? "high" : "medium",
    weekendOrEvent: /catering|holiday|event/.test(draft.toLowerCase()),
  });
  return {
    restaurantName: action.restaurantName,
    channel: action.channel.replace(/_/g, " "),
    mediaNote:
      action.payload.mediaReference ??
      "Use only approved media or a manual asset placeholder.",
    captionDraft: draft,
    suggestedPostingWindow: schedule.suggestedWindow,
    requiredConfirmation:
      action.payload.requiresClientConfirmation ||
      action.approvalRequirement === "client_confirmation_required"
        ? "Client confirmation needed before use."
        : "Faraz approval required before public use.",
    riskNotes: risks.length
      ? risks.map((r) => `${r.issueLabel}: ${r.suggestedSaferLanguage}`)
      : ["No deterministic copy risks flagged; Faraz review still required."],
    manualChecklist: [
      "Confirm client/business truth if required",
      "Review copy and media",
      "Approve for manual execution",
      "Post manually outside Veroxa if appropriate",
      "Mark included in report after manual follow-through",
    ],
    reportInclusionNote:
      "Include only as prepared/approved/manually completed based on actual manual follow-through.",
    status:
      action.approvalRequirement === "client_confirmation_required"
        ? "Needs client confirmation"
        : action.status === "approved"
          ? "Approved for manual execution"
          : action.status === "queued_for_execution"
            ? "Prepared"
            : action.status === "skipped"
              ? "Skipped"
              : "Needs approval",
  };
}

export interface ClientConfirmationWorkflow {
  category:
    | "Hours"
    | "Holiday hours"
    | "Menu items"
    | "Prices"
    | "Discounts/offers"
    | "Catering availability"
    | "Halal/organic/health claims"
    | "Serious complaint responses";
  status:
    | "Confirmation needed"
    | "Asked client"
    | "Confirmed by client"
    | "Not confirmed"
    | "Hold"
    | "Safe to prepare"
    | "Do not use";
  whyConfirmationMatters: string;
  suggestedClientQuestion: string;
  safeFallbackIfUnconfirmed: string;
  farazApprovalStillRequired: true;
}

export function getClientConfirmationWorkflow(
  text: string,
): ClientConfirmationWorkflow[] {
  const categories: Array<
    [ClientConfirmationWorkflow["category"], RegExp, string]
  > = [
    ["Hours", /\bhours\b/i, "Hours affect whether guests can visit or order."],
    [
      "Holiday hours",
      /holiday hours|holiday/i,
      "Holiday timing must be accurate before public use.",
    ],
    [
      "Menu items",
      /menu|dish|item/i,
      "Menu details must match what the restaurant can serve.",
    ],
    [
      "Prices",
      /price|\$\d+/i,
      "Prices must be confirmed to avoid misleading guests.",
    ],
    [
      "Discounts/offers",
      /discount|offer|deal|special/i,
      "Offers must be confirmed before promotion.",
    ],
    [
      "Catering availability",
      /catering|group order/i,
      "Catering availability and lead times are business-truth details.",
    ],
    [
      "Halal/organic/health claims",
      /halal|organic|healthy|gluten|allergy|allergen/i,
      "Dietary and health claims require exact client confirmation.",
    ],
    [
      "Serious complaint responses",
      /complaint|refund|food safety|serious/i,
      "Serious responses can affect reputation and must be client-confirmed.",
    ],
  ];
  return categories
    .filter(([, pattern]) => pattern.test(text))
    .map(([category, , whyConfirmationMatters]) => ({
      category,
      status: "Confirmation needed",
      whyConfirmationMatters,
      suggestedClientQuestion: `Can you confirm the correct ${category.toLowerCase()} details before Veroxa prepares public wording?`,
      safeFallbackIfUnconfirmed:
        "Hold the item and use general visibility/content wording that avoids unconfirmed business details.",
      farazApprovalStillRequired: true,
    }));
}

export interface CustomerOpportunityScore {
  status: "Strong opportunity" | "Moderate opportunity" | "Blocked opportunity";
  score: number;
  dimensions: Record<
    | "findability"
    | "trust"
    | "choice"
    | "mediaFreshness"
    | "bestSellerVisibility"
    | "googleLocalReadiness"
    | "reviewReputationSupport"
    | "contentConsistency"
    | "clientCooperation"
    | "blockers",
    number
  >;
  mainOpportunity: string;
  mainBlocker: string;
  suggestedNextAction: string;
  confidenceLevel: "low" | "medium" | "high";
}

export function scoreCustomerOpportunity(input: {
  mediaHealth?: "Healthy" | "Low" | "Critical";
  healthScore?: number;
  visibilityIssues?: number;
  pendingApprovals?: number;
  waitingOnClient?: number;
  reportOverdue?: boolean;
  bestSellerVisible?: boolean;
}): CustomerOpportunityScore {
  const mediaFreshness =
    input.mediaHealth === "Healthy"
      ? 90
      : input.mediaHealth === "Low"
        ? 55
        : 25;
  const trust = Math.max(20, Math.min(95, input.healthScore ?? 70));
  const blockerPenalty =
    (input.waitingOnClient ?? 0) * 12 +
    (input.pendingApprovals ?? 0) * 6 +
    (input.reportOverdue ? 12 : 0);
  const dimensions = {
    findability: Math.max(25, 85 - (input.visibilityIssues ?? 0) * 10),
    trust,
    choice: input.bestSellerVisible ? 82 : 48,
    mediaFreshness,
    bestSellerVisibility: input.bestSellerVisible ? 85 : 45,
    googleLocalReadiness: Math.max(25, 88 - (input.visibilityIssues ?? 0) * 12),
    reviewReputationSupport: trust,
    contentConsistency: mediaFreshness,
    clientCooperation: Math.max(20, 90 - (input.waitingOnClient ?? 0) * 20),
    blockers: Math.max(0, 100 - blockerPenalty),
  };
  const score = Math.round(
    Object.values(dimensions).reduce((sum, value) => sum + value, 0) /
      Object.values(dimensions).length,
  );
  const mediaBlocked =
    input.mediaHealth === "Critical" || (input.waitingOnClient ?? 0) > 1;
  return {
    status:
      mediaBlocked || score < 55
        ? "Blocked opportunity"
        : score >= 75
          ? "Strong opportunity"
          : "Moderate opportunity",
    score,
    dimensions,
    mainOpportunity: input.bestSellerVisible
      ? "Keep best-seller and fresh media visible across Google/social."
      : "Make best sellers easier to find and choose.",
    mainBlocker: mediaBlocked
      ? "Client input/media supply is blocking customer opportunity work."
      : (input.visibilityIssues ?? 0) > 0
        ? "Open visibility issues are reducing findability."
        : "Approval and reporting follow-through need manual review.",
    suggestedNextAction: mediaBlocked
      ? "Ask client for better media/context, then prepare approved manual work."
      : "Prioritize approval-ready visibility and best-seller actions.",
    confidenceLevel: input.healthScore == null ? "low" : "medium",
  };
}

export interface TeamAlert {
  label: string;
  severity: "info" | "warning" | "critical";
  restaurantName: string;
  whyItMatters: string;
  suggestedNextAction: string;
  route: string;
}

export function buildTeamAlerts(input: {
  restaurantName: string;
  mediaHealth?: "Healthy" | "Low" | "Critical";
  waitingOnClient?: number;
  pendingApprovals?: number;
  reportDue?: boolean;
  visibilityIssues?: number;
  premiumCandidate?: boolean;
  businessTruthConfirmationRequired?: boolean;
  heldItems?: number;
  inactive?: boolean;
}): TeamAlert[] {
  const alerts: TeamAlert[] = [];
  if (input.mediaHealth === "Low" || input.mediaHealth === "Critical")
    alerts.push({
      label: "Low media supply",
      severity: input.mediaHealth === "Critical" ? "critical" : "warning",
      restaurantName: input.restaurantName,
      whyItMatters:
        "Content and customer opportunity work slow down without usable media.",
      suggestedNextAction:
        "Ask client for a small batch of fresh photos/videos.",
      route: "/team/upload-inbox",
    });
  if ((input.waitingOnClient ?? 0) > 0)
    alerts.push({
      label: "Waiting on client input",
      severity: "warning",
      restaurantName: input.restaurantName,
      whyItMatters: "Business-truth or media gaps can block public-safe work.",
      suggestedNextAction:
        "Prepare a confirmation question and hold public use until confirmed.",
      route: "/team/direction-queue",
    });
  if ((input.pendingApprovals ?? 0) > 0)
    alerts.push({
      label: "Pending approvals",
      severity: "info",
      restaurantName: input.restaurantName,
      whyItMatters:
        "Prepared actions cannot move to manual execution without Faraz approval.",
      suggestedNextAction: "Review approve/hold/skip/ask-client decisions.",
      route: "/team/approval-queue",
    });
  if (input.reportDue)
    alerts.push({
      label: "Report due",
      severity: "warning",
      restaurantName: input.restaurantName,
      whyItMatters:
        "Client-visible progress needs honest weekly/monthly review.",
      suggestedNextAction:
        "Build a rule-based report draft from verified work only.",
      route: "/team/report-queue",
    });
  if ((input.visibilityIssues ?? 0) > 0)
    alerts.push({
      label: "Visibility issue open",
      severity: "info",
      restaurantName: input.restaurantName,
      whyItMatters: "Google/local gaps can reduce findability and choice.",
      suggestedNextAction: "Prepare the safest visibility action for approval.",
      route: "/team/visibility-audit",
    });
  if (input.premiumCandidate)
    alerts.push({
      label: "Premium readiness candidate",
      severity: "info",
      restaurantName: input.restaurantName,
      whyItMatters:
        "Premium still requires readiness assessment, client approval, and separate ad budget.",
      suggestedNextAction:
        "Review readiness only; do not imply ads are active.",
      route: "/team/first-client-readiness",
    });
  if (input.businessTruthConfirmationRequired)
    alerts.push({
      label: "Business-truth confirmation required",
      severity: "critical",
      restaurantName: input.restaurantName,
      whyItMatters:
        "Hours/menu/prices/offers/dietary claims need client confirmation before public use.",
      suggestedNextAction:
        "Ask client, then route back through Faraz approval.",
      route: "/team/direction-queue",
    });
  if (input.inactive)
    alerts.push({
      label: "Inactive demo account",
      severity: "warning",
      restaurantName: input.restaurantName,
      whyItMatters: "Inactive accounts hide blockers until review catches up.",
      suggestedNextAction:
        "Confirm whether to hold, skip, or restart manual work.",
      route: "/team/work-queue",
    });
  if ((input.heldItems ?? 0) > 3)
    alerts.push({
      label: "Too many held items",
      severity: "warning",
      restaurantName: input.restaurantName,
      whyItMatters: "Held work can stall customer opportunity progress.",
      suggestedNextAction:
        "Choose what to ask client, include in report, or skip.",
      route: "/team/work-queue",
    });
  return alerts;
}

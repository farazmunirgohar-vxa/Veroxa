export const STARTER_INTERNAL_MINIMUM_ACTIONS_PER_DAY = 20;
export const STARTER_PROOF_WINDOW_DAYS = 60;
export const STARTER_COST_JUSTIFICATION_WINDOW_DAYS = 90;
export const PROFIT_PROGRESS_WINDOW_DAYS_MIN = 180;
export const PROFIT_PROGRESS_WINDOW_DAYS_MAX = 270;

export type OnlineInfluencedActionType =
  | "online_order"
  | "phone_click"
  | "direction_click"
  | "menu_click"
  | "order_link_click"
  | "website_click"
  | "google_profile_action"
  | "customer_mention"
  | "repeat_customer_signal"
  | "social_to_order_signal"
  | "manual_owner_reported";

export type ActionSignalConfidence =
  | "confirmed"
  | "strong_signal"
  | "directional"
  | "owner_reported"
  | "unknown";

export type ProofStage =
  | "foundation_setup"
  | "two_month_minimum_check"
  | "cost_justification"
  | "profit_progress"
  | "online_presence_order_channel";

export type ProofStatus =
  | "on_track"
  | "watch"
  | "at_risk"
  | "not_enough_data";

export interface OnlineInfluencedActionSummary {
  onlineOrders?: number;
  phoneClicks?: number;
  directionClicks?: number;
  menuClicks?: number;
  orderLinkClicks?: number;
  websiteClicks?: number;
  googleProfileActions?: number;
  customerMentions?: number;
  repeatCustomerSignals?: number;
  socialToOrderSignals?: number;
  manualOwnerReported?: number;
}

export interface OnlineInfluencedActionProgressInput {
  summary?: OnlineInfluencedActionSummary;
  daysSinceStart?: number;
  minimumTarget?: number;
}

export interface OnlineInfluencedActionResult {
  totalDailyActions: number;
  confirmedDailyActions: number;
  directionalDailyActions: number;
  confidence: ActionSignalConfidence;
  proofStage: ProofStage;
  proofStatus: ProofStatus;
  minimumTarget: number;
  daysSinceStart?: number;
  summary: string;
  internalOnlyDisclaimer: string;
}

export type VeroxaMetricTier =
  | "business_outcome"
  | "conversion_action"
  | "attention"
  | "engagement"
  | "execution";

export interface VeroxaMetricGroup {
  tier: VeroxaMetricTier;
  label: string;
  priority: number;
  metrics: string[];
  internalUseNote: string;
}

export const ONLINE_INFLUENCED_ACTIONS_INTERNAL_ONLY_DISCLAIMER =
  "Internal only Veroxa planning model for online-influenced orders/actions. This is not public/client-facing guarantee language and does not promise exact attribution, orders, profit, revenue, ROI, rankings, customers, or walk-ins.";

function safeNumber(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

export function sumOnlineInfluencedActions(
  summary: OnlineInfluencedActionSummary = {},
): number {
  return roundOne(
    safeNumber(summary.onlineOrders) +
      safeNumber(summary.phoneClicks) +
      safeNumber(summary.directionClicks) +
      safeNumber(summary.menuClicks) +
      safeNumber(summary.orderLinkClicks) +
      safeNumber(summary.websiteClicks) +
      safeNumber(summary.googleProfileActions) +
      safeNumber(summary.customerMentions) +
      safeNumber(summary.repeatCustomerSignals) +
      safeNumber(summary.socialToOrderSignals) +
      safeNumber(summary.manualOwnerReported),
  );
}

function sumConfirmed(summary: OnlineInfluencedActionSummary = {}): number {
  return roundOne(
    safeNumber(summary.onlineOrders) +
      safeNumber(summary.customerMentions) +
      safeNumber(summary.repeatCustomerSignals),
  );
}

function sumDirectional(summary: OnlineInfluencedActionSummary = {}): number {
  return roundOne(
    safeNumber(summary.phoneClicks) +
      safeNumber(summary.directionClicks) +
      safeNumber(summary.menuClicks) +
      safeNumber(summary.orderLinkClicks) +
      safeNumber(summary.websiteClicks) +
      safeNumber(summary.googleProfileActions) +
      safeNumber(summary.socialToOrderSignals),
  );
}

export function classifyActionConfidence(
  summary: OnlineInfluencedActionSummary = {},
): ActionSignalConfidence {
  const confirmed = sumConfirmed(summary);
  const strongSignals =
    safeNumber(summary.phoneClicks) +
    safeNumber(summary.directionClicks) +
    safeNumber(summary.menuClicks) +
    safeNumber(summary.orderLinkClicks) +
    safeNumber(summary.googleProfileActions);
  const directional = sumDirectional(summary);
  const ownerReported = safeNumber(summary.manualOwnerReported);
  const total = sumOnlineInfluencedActions(summary);

  if (total <= 0) return "unknown";
  if (confirmed > 0 && confirmed >= total * 0.5) return "confirmed";
  if (strongSignals > 0 && strongSignals >= total * 0.5) return "strong_signal";
  if (directional > 0) return "directional";
  if (ownerReported > 0) return "owner_reported";
  return "unknown";
}

export function getProofStage(daysSinceStart?: number): ProofStage {
  if (typeof daysSinceStart !== "number" || !Number.isFinite(daysSinceStart)) {
    return "foundation_setup";
  }
  if (daysSinceStart <= 30) return "foundation_setup";
  if (daysSinceStart <= STARTER_PROOF_WINDOW_DAYS) {
    return "two_month_minimum_check";
  }
  if (daysSinceStart <= STARTER_COST_JUSTIFICATION_WINDOW_DAYS) {
    return "cost_justification";
  }
  if (daysSinceStart < 365) return "profit_progress";
  return "online_presence_order_channel";
}

function classifyProofStatus(
  totalDailyActions: number,
  minimumTarget: number,
  confidence: ActionSignalConfidence,
  stage: ProofStage,
): ProofStatus {
  if (totalDailyActions <= 0 || confidence === "unknown") return "not_enough_data";
  if (stage === "foundation_setup") return "not_enough_data";
  if (totalDailyActions >= minimumTarget) return "on_track";
  if (totalDailyActions >= minimumTarget * 0.7) return "watch";
  return "at_risk";
}

export function evaluateOnlineInfluencedActionProgress(
  input: OnlineInfluencedActionProgressInput = {},
): OnlineInfluencedActionResult {
  const summary = input.summary ?? {};
  const minimumTarget = input.minimumTarget ?? STARTER_INTERNAL_MINIMUM_ACTIONS_PER_DAY;
  const totalDailyActions = sumOnlineInfluencedActions(summary);
  const confirmedDailyActions = sumConfirmed(summary);
  const directionalDailyActions = sumDirectional(summary);
  const confidence = classifyActionConfidence(summary);
  const proofStage = getProofStage(input.daysSinceStart);
  const proofStatus = classifyProofStatus(
    totalDailyActions,
    minimumTarget,
    confidence,
    proofStage,
  );

  return {
    totalDailyActions,
    confirmedDailyActions,
    directionalDailyActions,
    confidence,
    proofStage,
    proofStatus,
    minimumTarget,
    daysSinceStart: input.daysSinceStart,
    summary:
      proofStatus === "not_enough_data"
        ? "Not enough tracked action data yet. Confirm average ticket, margin, capacity, and current online-influenced actions before selling."
        : `Internal proof check is ${proofStatus.replaceAll("_", " ")} with ${totalDailyActions} online-influenced actions/orders per day and ${confidence.replaceAll("_", " ")} attribution confidence.`,
    internalOnlyDisclaimer: ONLINE_INFLUENCED_ACTIONS_INTERNAL_ONLY_DISCLAIMER,
  };
}

export function formatOnlineInfluencedActionSummary(
  result: OnlineInfluencedActionResult,
): string {
  return `${result.summary} Starter internal minimum: ${result.minimumTarget}/day. Stage: ${result.proofStage.replaceAll("_", " ")}. ${result.internalOnlyDisclaimer}`;
}

export function getMetricTierLabel(tier: VeroxaMetricTier): string {
  switch (tier) {
    case "business_outcome":
      return "Business outcome signals";
    case "conversion_action":
      return "Conversion/action signals";
    case "attention":
      return "Attention signals";
    case "engagement":
      return "Engagement signals";
    case "execution":
      return "Execution signals";
  }
}

export function getMetricTierPriority(tier: VeroxaMetricTier): number {
  switch (tier) {
    case "business_outcome":
      return 1;
    case "conversion_action":
      return 2;
    case "attention":
      return 3;
    case "engagement":
      return 4;
    case "execution":
      return 5;
  }
}

export function getVeroxaMetricHierarchy(): VeroxaMetricGroup[] {
  return [
    {
      tier: "business_outcome",
      label: getMetricTierLabel("business_outcome"),
      priority: getMetricTierPriority("business_outcome"),
      metrics: [
        "online orders",
        "phone clicks",
        "direction clicks",
        "menu/order-link clicks",
        "website clicks",
        "customer mentions",
        "walk-in/order signals",
        "repeat customer signals",
      ],
      internalUseNote:
        "Highest-value internal reporting tier; still requires attribution confidence and careful language.",
    },
    {
      tier: "conversion_action",
      label: getMetricTierLabel("conversion_action"),
      priority: getMetricTierPriority("conversion_action"),
      metrics: [
        "Google profile actions",
        "calls from Google",
        "direction requests",
        "menu views",
        "order button clicks",
        "reservation/catering inquiries",
        "contact clicks",
      ],
      internalUseNote:
        "Strong action signals, not guaranteed completed purchases or visits.",
    },
    {
      tier: "attention",
      label: getMetricTierLabel("attention"),
      priority: getMetricTierPriority("attention"),
      metrics: [
        "reach",
        "impressions",
        "profile views",
        "follower growth",
        "reel/video views",
        "search/discovery views",
      ],
      internalUseNote:
        "Useful awareness indicators that should not be translated into exact order-profit claims.",
    },
    {
      tier: "engagement",
      label: getMetricTierLabel("engagement"),
      priority: getMetricTierPriority("engagement"),
      metrics: [
        "likes",
        "comments",
        "shares",
        "saves",
        "story interactions",
        "post clicks",
        "best-performing content",
        "best-performing menu items",
      ],
      internalUseNote:
        "Content learning signals for team planning and selected client-safe reporting later.",
    },
    {
      tier: "execution",
      label: getMetricTierLabel("execution"),
      priority: getMetricTierPriority("execution"),
      metrics: [
        "posts completed",
        "Google updates completed",
        "photos refreshed",
        "media used",
        "best sellers highlighted",
        "client requests handled",
        "reports delivered",
        "approvals completed",
        "content health status",
        "items waiting on client",
      ],
      internalUseNote:
        "Service delivery activity; important but lower than tracked business/action signals.",
    },
  ];
}

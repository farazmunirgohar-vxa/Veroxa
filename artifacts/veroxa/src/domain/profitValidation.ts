import type { ActionSignalConfidence } from "@/domain/onlineInfluencedActions";
import {
  ONLINE_INFLUENCED_ACTIONS_INTERNAL_ONLY_DISCLAIMER,
  STARTER_INTERNAL_MINIMUM_ACTIONS_PER_DAY,
} from "@/domain/onlineInfluencedActions";
import { evaluateBreakEvenProgress } from "@/domain/breakEvenProgress";

export type VeroxaValidationPhase =
  | "foundation"
  | "break_even_validation"
  | "cost_justified"
  | "profit_progress"
  | "order_channel";

export type VeroxaValidationStatus =
  | "healthy"
  | "watch"
  | "at_risk"
  | "not_enough_data";

export interface VeroxaProfitValidationInput {
  daysSinceStart?: number;
  monthlyFee: number;
  averageTicket?: number;
  estimatedNetMargin?: number;
  onlineInfluencedActionsPerDay?: number;
  hasCapacityForMoreOrders?: boolean;
  trackingConfidence?: ActionSignalConfidence;
}

export interface VeroxaProfitValidationResult {
  phase: VeroxaValidationPhase;
  status: VeroxaValidationStatus;
  requiredOrdersPerDay: number;
  currentOnlineInfluencedActionsPerDay?: number;
  starterMinimumTarget: number;
  progressPercent?: number;
  headline: string;
  nextAction: string;
  internalOnlyDisclaimer: string;
}

function getValidationPhase(daysSinceStart?: number): VeroxaValidationPhase {
  if (typeof daysSinceStart !== "number" || !Number.isFinite(daysSinceStart)) {
    return "foundation";
  }
  if (daysSinceStart <= 30) return "foundation";
  if (daysSinceStart <= 60) return "break_even_validation";
  if (daysSinceStart <= 90) return "cost_justified";
  if (daysSinceStart >= 365) return "order_channel";
  return "profit_progress";
}

function statusFor(
  phase: VeroxaValidationPhase,
  current: number | undefined,
  requiredOrdersPerDay: number,
  capacity: boolean | undefined,
  confidence: ActionSignalConfidence | undefined,
): VeroxaValidationStatus {
  if (capacity === false) return "at_risk";
  if (phase === "foundation") return "not_enough_data";
  if (current === undefined || confidence === "unknown") return "not_enough_data";

  const validationTarget = Math.max(
    STARTER_INTERNAL_MINIMUM_ACTIONS_PER_DAY,
    requiredOrdersPerDay,
  );
  if (current >= validationTarget) return "healthy";
  if (current >= validationTarget * 0.7) return "watch";
  return "at_risk";
}

function headlineFor(
  phase: VeroxaValidationPhase,
  status: VeroxaValidationStatus,
): string {
  if (phase === "foundation") {
    return "Foundation setup: tracking, Google/Maps cleanup, best sellers, and order/contact paths come first.";
  }
  if (status === "not_enough_data") {
    return "Not enough tracked action data yet for profit validation.";
  }
  return `Profit validation is ${status.replaceAll("_", " ")} in the ${phase.replaceAll("_", " ")} phase.`;
}

function nextActionFor(
  phase: VeroxaValidationPhase,
  status: VeroxaValidationStatus,
): string {
  if (status === "not_enough_data") {
    return "Confirm average ticket, margin, capacity, tracking confidence, and current online-influenced action signals before selling or renewing the recommendation.";
  }
  if (status === "at_risk") {
    return "Do not overpromise. Review fit, order paths, Google/Maps completeness, best sellers, media supply, and whether the restaurant can handle more demand.";
  }
  if (status === "watch") {
    return "Keep improving conversion paths and gathering stronger attribution confidence before treating the account as validated.";
  }
  if (phase === "profit_progress") {
    return "Shift review from service delivery alone toward profit progress signals while keeping attribution careful.";
  }
  if (phase === "order_channel") {
    return "Assess whether online presence is becoming a meaningful order channel without claiming exact causation.";
  }
  return "Continue the plan and keep proof language internal.";
}

export function evaluateVeroxaProfitValidation(
  input: VeroxaProfitValidationInput,
): VeroxaProfitValidationResult {
  const breakEven = evaluateBreakEvenProgress({
    monthlyFee: input.monthlyFee,
    averageTicket: input.averageTicket,
    estimatedNetMargin: input.estimatedNetMargin,
    onlineInfluencedActionsPerDay: input.onlineInfluencedActionsPerDay,
  });
  const phase = getValidationPhase(input.daysSinceStart);
  const status = statusFor(
    phase,
    breakEven.currentOnlineInfluencedActionsPerDay,
    breakEven.requiredOrdersPerDay,
    input.hasCapacityForMoreOrders,
    input.trackingConfidence,
  );

  return {
    phase,
    status,
    requiredOrdersPerDay: breakEven.requiredOrdersPerDay,
    currentOnlineInfluencedActionsPerDay:
      breakEven.currentOnlineInfluencedActionsPerDay,
    starterMinimumTarget: STARTER_INTERNAL_MINIMUM_ACTIONS_PER_DAY,
    progressPercent: breakEven.progressPercent,
    headline: headlineFor(phase, status),
    nextAction: nextActionFor(phase, status),
    internalOnlyDisclaimer: ONLINE_INFLUENCED_ACTIONS_INTERNAL_ONLY_DISCLAIMER,
  };
}

export function formatVeroxaProfitValidation(
  result: VeroxaProfitValidationResult,
): string {
  const current =
    result.currentOnlineInfluencedActionsPerDay === undefined
      ? "current signal volume not confirmed"
      : `${result.currentOnlineInfluencedActionsPerDay} online-influenced actions/day`;
  return `${result.headline} Current: ${current}. Break-even progress target: ${result.requiredOrdersPerDay}/day. Starter internal proof floor: ${result.starterMinimumTarget}/day. Next: ${result.nextAction} ${result.internalOnlyDisclaimer}`;
}

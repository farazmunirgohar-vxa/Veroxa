import {
  calculateBreakEvenOrders,
  DEFAULT_AVERAGE_TICKET,
  DEFAULT_NET_MARGIN,
} from "@/domain/profitFit";
import { ONLINE_INFLUENCED_ACTIONS_INTERNAL_ONLY_DISCLAIMER } from "@/domain/onlineInfluencedActions";

export type BreakEvenProgressStatus =
  | "above_break_even"
  | "near_break_even"
  | "below_break_even"
  | "not_enough_data";

export interface BreakEvenProgressInput {
  monthlyFee: number;
  averageTicket?: number;
  estimatedNetMargin?: number;
  onlineInfluencedActionsPerDay?: number;
}

export interface BreakEvenProgressResult {
  requiredOrdersPerDay: number;
  currentOnlineInfluencedActionsPerDay?: number;
  progressPercent?: number;
  status: BreakEvenProgressStatus;
  summary: string;
  internalOnlyDisclaimer: string;
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function roundPercent(value: number): number {
  return Math.round(value);
}

export function evaluateBreakEvenProgress(
  input: BreakEvenProgressInput,
): BreakEvenProgressResult {
  const base = calculateBreakEvenOrders({
    monthlyFee: input.monthlyFee,
    averageTicket: input.averageTicket ?? DEFAULT_AVERAGE_TICKET,
    estimatedNetMargin: input.estimatedNetMargin ?? DEFAULT_NET_MARGIN,
  });
  const current = input.onlineInfluencedActionsPerDay;
  const hasCurrent =
    typeof current === "number" && Number.isFinite(current) && current >= 0;
  const progressPercent =
    hasCurrent && base.requiredOrdersPerDay > 0
      ? roundPercent((current / base.requiredOrdersPerDay) * 100)
      : undefined;
  const status: BreakEvenProgressStatus = !hasCurrent
    ? "not_enough_data"
    : current >= base.requiredOrdersPerDay
      ? "above_break_even"
      : current >= base.requiredOrdersPerDay * 0.7
        ? "near_break_even"
        : "below_break_even";

  return {
    requiredOrdersPerDay: roundOne(base.requiredOrdersPerDay),
    currentOnlineInfluencedActionsPerDay: hasCurrent ? roundOne(current) : undefined,
    progressPercent,
    status,
    summary:
      status === "not_enough_data"
        ? "Break-even progress needs current online-influenced action data before it can be evaluated."
        : `Break-even progress is ${status.replaceAll("_", " ")} at ${progressPercent}% of the internal target signal requirement.`,
    internalOnlyDisclaimer: ONLINE_INFLUENCED_ACTIONS_INTERNAL_ONLY_DISCLAIMER,
  };
}

export function formatBreakEvenProgress(result: BreakEvenProgressResult): string {
  const current =
    result.currentOnlineInfluencedActionsPerDay === undefined
      ? "current online-influenced actions/day not confirmed"
      : `${result.currentOnlineInfluencedActionsPerDay} online-influenced actions/day`;
  return `${result.summary} Required break-even progress target: ${result.requiredOrdersPerDay}/day; current: ${current}. ${result.internalOnlyDisclaimer}`;
}

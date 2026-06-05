export const INTERNAL_VALUE_PROOF_BASELINE_MONTHLY_FEE = 495;
export const INTERNAL_VALUE_PROOF_BASELINE_NET_MARGIN = 0.05;
export const INTERNAL_MINIMUM_ONLINE_INFLUENCED_CHANNEL_VALUE = 9900;
export const INTERNAL_HEALTHY_ONLINE_INFLUENCED_CHANNEL_VALUE_RANGE = "$15k–$25k/month";
export const INTERNAL_STRONG_ONLINE_INFLUENCED_CHANNEL_VALUE = "$25k+/month";

export function getInternalValueProofBaselineNote(): string {
  return "$9,900/month is the internal-only minimum online-influenced sales channel value baseline for a $495 client at 5% margin. This is not extra new sales and must not be shown on public/client pages.";
}

export interface InternalCostAssumptions {
  monthlyFee: number;
  averageTicket: number;
  netMargin: number;
  days: number;
}
export function calculateInternalRequiredDailyOrders(
  input: InternalCostAssumptions,
): number {
  return input.monthlyFee / input.netMargin / input.averageTicket / input.days;
}
export function buildTeamOnlyCostJustificationLabel(
  input: InternalCostAssumptions,
): string {
  const target = calculateInternalRequiredDailyOrders(input);
  if (target <= 20)
    return "Team-only value proof target is within the conservative preview range.";
  return "Team-only value proof needs careful signal review before calling the account healthy.";
}

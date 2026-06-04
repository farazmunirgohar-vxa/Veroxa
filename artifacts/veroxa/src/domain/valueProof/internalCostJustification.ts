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

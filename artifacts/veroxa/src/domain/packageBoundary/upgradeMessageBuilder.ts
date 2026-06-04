import type { PlanId, ClientRequestType } from "./types";
const label: Record<PlanId, string> = {
  starter: "Starter",
  growth: "Growth",
  premium: "Premium",
};
export function buildUpgradeMessage(
  currentPlan: PlanId,
  requiredPlan: PlanId,
  type: ClientRequestType,
): string {
  if (type === "ad_management_request")
    return "This request is included in Premium. Your current plan does not include ad management.";
  return `This request is included in ${label[requiredPlan]}. Your current plan does not include this service. Veroxa can prepare this after you upgrade or adjust the request to match your current plan.`;
}
export function buildIncludedMessage(): string {
  return "This request is included in your current plan. Veroxa will review it and respond within 24 hours.";
}

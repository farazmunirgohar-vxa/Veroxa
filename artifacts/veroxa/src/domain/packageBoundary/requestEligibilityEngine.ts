import {
  buildIncludedMessage,
  buildUpgradeMessage,
} from "./upgradeMessageBuilder";
import { classifyClientRequest } from "./requestClassifier";
import {
  customerServiceBlockedTypes,
  getRequiredPlan,
  isRequestIncludedInPlan,
  offerConfirmationTypes,
  planOrder,
} from "./planCapabilities";
import type {
  PackageBoundaryDecision,
  PackageBoundaryRequestInput,
  PlanId,
} from "./types";
const planLabel: Record<PlanId, string> = {
  starter: "Starter",
  growth: "Growth",
  premium: "Premium",
};
export function decidePackageBoundary(
  input: PackageBoundaryRequestInput,
): PackageBoundaryDecision {
  const requestType = classifyClientRequest(input.title, input.message);
  const requiredPlan = getRequiredPlan(requestType);
  const createdAt = input.createdAt ?? new Date().toISOString();
  if (customerServiceBlockedTypes.includes(requestType))
    return {
      requestId: input.requestId,
      clientId: input.clientId,
      currentPlan: input.currentPlan,
      requestType,
      eligibilityStatus: "not_supported_at_launch",
      includedInPlan: false,
      clientSafeMessage:
        "Customer-service replies are not included at launch. Please handle guest conversations, inboxes, complaints, refunds, and order questions directly.",
      teamReason: "All plans block customer-service conversations at launch.",
      nextAction:
        "Decline safely and remind client to use the portal for routine Veroxa work only.",
      blockedReason: "customer_service_not_supported",
      createdAt,
    };
  if (offerConfirmationTypes.includes(requestType))
    return {
      requestId: input.requestId,
      clientId: input.clientId,
      currentPlan: input.currentPlan,
      requestType,
      eligibilityStatus: "needs_confirmation",
      includedInPlan: false,
      clientSafeMessage:
        "Veroxa can only prepare copy for an existing offer after you confirm the exact details. Veroxa does not invent discounts or new promotions.",
      teamReason:
        "Offer or discount language requires client-provided existing details and confirmation.",
      nextAction:
        "Ask client to confirm exact existing offer details or adjust request away from offer language.",
      blockedReason: "offer_confirmation_required",
      createdAt,
    };
  if (!requiredPlan || requestType === "unknown_request")
    return {
      requestId: input.requestId,
      clientId: input.clientId,
      currentPlan: input.currentPlan,
      requestType,
      eligibilityStatus: "unclear",
      includedInPlan: false,
      clientSafeMessage:
        "Veroxa needs one more detail before deciding how to handle this request. We will respond within 24 hours.",
      teamReason: "Request type is unclear and needs Faraz review.",
      nextAction:
        "Review request, clarify scope, and classify before manual work.",
      createdAt,
    };
  const included = isRequestIncludedInPlan(input.currentPlan, requestType);
  if (included)
    return {
      requestId: input.requestId,
      clientId: input.clientId,
      currentPlan: input.currentPlan,
      requestType,
      eligibilityStatus: "included",
      includedInPlan: true,
      requiredPlan,
      clientSafeMessage: buildIncludedMessage(),
      teamReason: `Included in ${planLabel[input.currentPlan]} package boundary.`,
      nextAction: "Review and respond in the portal within 24 hours.",
      createdAt,
    };
  const upgradePath = `${planLabel[input.currentPlan]} → ${planLabel[requiredPlan]}`;
  return {
    requestId: input.requestId,
    clientId: input.clientId,
    currentPlan: input.currentPlan,
    requestType,
    eligibilityStatus: "needs_upgrade",
    includedInPlan: false,
    requiredPlan,
    clientSafeMessage: buildUpgradeMessage(
      input.currentPlan,
      requiredPlan,
      requestType,
    ),
    teamReason: `${planLabel[input.currentPlan]} does not include this request. Required plan rank ${planOrder.indexOf(requiredPlan)}.`,
    nextAction:
      "Route as upgrade opportunity; do not absorb out-of-tier work manually.",
    upgradePath,
    blockedReason: "package_upgrade_required",
    createdAt,
  };
}

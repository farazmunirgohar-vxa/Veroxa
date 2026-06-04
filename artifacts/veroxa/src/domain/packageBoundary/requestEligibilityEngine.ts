import { buildComingSoonMessage, buildIncludedMessage, buildNotSupportedMessage } from "./upgradeMessageBuilder";
import { classifyClientRequest } from "./requestClassifier";
import { addOnAvailableTypes, comingSoonNotIncludedTypes, customerServiceBlockedTypes, getAddOnPrice, getRequiredPlan, isRequestIncludedInPlan, offerConfirmationTypes, websiteBlockedTypes, normalizePlan } from "./planCapabilities";
import type { PackageBoundaryDecision, PackageBoundaryRequestInput } from "./types";

export function decidePackageBoundary(input: PackageBoundaryRequestInput): PackageBoundaryDecision {
  const requestType = classifyClientRequest(input.title, input.message);
  const requiredPlan = getRequiredPlan(requestType);
  const createdAt = input.createdAt ?? new Date().toISOString();
  const currentPlan = normalizePlan(input.currentPlan);

  if (customerServiceBlockedTypes.includes(requestType)) return {
    requestId: input.requestId,
    clientId: input.clientId,
    currentPlan,
    requestType,
    eligibilityStatus: "not_supported_at_launch",
    includedInPlan: false,
    clientSafeMessage: buildNotSupportedMessage(requestType),
    teamReason: "Complete Online Presence blocks customer-service conversations at launch.",
    nextAction: "Decline safely and keep routine Veroxa work portal-first.",
    blockedReason: "customer_service_not_supported",
    createdAt,
  };

  if (websiteBlockedTypes.includes(requestType)) return {
    requestId: input.requestId,
    clientId: input.clientId,
    currentPlan,
    requestType,
    eligibilityStatus: "not_supported_at_launch",
    includedInPlan: false,
    clientSafeMessage: buildNotSupportedMessage(requestType),
    teamReason: "Launch package includes website alignment/refinement, not full development or technical support.",
    nextAction: "Explain website alignment scope and ask for only small correction/access details if relevant.",
    blockedReason: "full_website_development_not_included",
    createdAt,
  };

  if (offerConfirmationTypes.includes(requestType)) return {
    requestId: input.requestId,
    clientId: input.clientId,
    currentPlan,
    requestType,
    eligibilityStatus: "needs_confirmation",
    includedInPlan: false,
    clientSafeMessage: "Veroxa can only prepare copy for an existing offer after you confirm the exact details. Veroxa does not invent discounts, BOGO offers, price cuts, lower prices, or new promotions.",
    teamReason: "Offer or discount language requires client-provided existing details and confirmation.",
    nextAction: "Ask client to confirm exact existing offer details or adjust the request away from offer language.",
    blockedReason: "offer_confirmation_required",
    createdAt,
  };

  if (addOnAvailableTypes.includes(requestType)) {
    const addOn = getAddOnPrice(requestType);
    return {
      requestId: input.requestId,
      clientId: input.clientId,
      currentPlan,
      requestType,
      eligibilityStatus: "add_on_available",
      includedInPlan: false,
      clientSafeMessage: requestType === "new_basic_website_request"
        ? "A new basic website is available as a $95 add-on. Veroxa will review scope first; no checkout or live website work is started here."
        : "Missing social profile creation is available as a $45/profile add-on for Facebook or Instagram. Yelp setup is coming soon and no live platform account creation happens here.",
      teamReason: "Request maps to a launch add-on, not an included service or upgrade path.",
      nextAction: "Confirm add-on scope manually; do not create checkout, payment, or live platform work.",
      addOnPrice: addOn?.price,
      addOnDisplayPrice: addOn?.displayPrice,
      blockedReason: "add_on_available",
      createdAt,
    };
  }

  if (comingSoonNotIncludedTypes.includes(requestType)) return {
    requestId: input.requestId,
    clientId: input.clientId,
    currentPlan,
    requestType,
    eligibilityStatus: "coming_soon_not_included",
    includedInPlan: false,
    clientSafeMessage: buildComingSoonMessage(requestType),
    teamReason: "Coming soon / not included in the one launch package; no upgrade/payment flow exists.",
    nextAction: "Route to coming soon, outside current package, or manual review without suggesting payment flow.",
    blockedReason: "coming_soon_not_included",
    createdAt,
  };

  if (!requiredPlan || requestType === "unknown_request") return {
    requestId: input.requestId,
    clientId: input.clientId,
    currentPlan,
    requestType,
    eligibilityStatus: "unclear",
    includedInPlan: false,
    clientSafeMessage: "Veroxa needs one more detail before deciding how to handle this request. We will respond within 24 hours.",
    teamReason: "Request type is unclear and needs Faraz review.",
    nextAction: "Review request, clarify scope, and classify before manual work.",
    createdAt,
  };

  const included = isRequestIncludedInPlan(currentPlan, requestType);
  return {
    requestId: input.requestId,
    clientId: input.clientId,
    currentPlan,
    requestType,
    eligibilityStatus: included ? "included" : "needs_team_review",
    includedInPlan: included,
    requiredPlan,
    clientSafeMessage: included ? buildIncludedMessage() : "This request is outside the current Complete Online Presence package.",
    teamReason: included ? "Included in Complete Online Presence package boundary." : "Not included in current launch package.",
    nextAction: included ? "Review and respond in the portal within 24 hours." : "Manual review; do not create payment or upgrade flow.",
    createdAt,
  };
}

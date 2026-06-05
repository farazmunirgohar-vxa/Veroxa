import type { OnboardingChecklistItem, RestaurantOnboardingProfile } from "./types";

const truthMap = [
  ["hoursConfirmed", "Hours", "Confirm regular hours before Veroxa references them publicly."],
  ["holidayHoursConfirmed", "Holiday hours", "Confirm holiday hours before Veroxa mentions them."],
  ["phoneConfirmed", "Phone", "Confirm phone number before public copy."],
  ["addressConfirmed", "Address", "Confirm address before public copy."],
  ["menuItemsConfirmed", "Menu items", "Confirm menu items before Veroxa highlights them."],
  ["menuPricesConfirmed", "Menu prices if mentioned", "Only confirm prices if the restaurant wants prices mentioned."],
  ["existingOfferConfirmed", "Existing offer details", "Please confirm the exact offer, dates, terms, and pricing before Veroxa prepares anything public."],
  ["cateringAvailabilityConfirmed", "Catering availability", "Confirm catering availability before Veroxa references it."],
  ["dietaryClaimsConfirmed", "Dietary or health claims", "Confirm halal, organic, health, or similar claims before public copy."],
  ["orderingReservationLinksConfirmed", "Ordering/reservation links", "Confirm links before Veroxa points guests to them."],
] as const;

export function getBusinessTruthChecklist(profile: RestaurantOnboardingProfile): OnboardingChecklistItem[] {
  const items: OnboardingChecklistItem[] = truthMap.map(([key, label, description]) => {
    const required = key !== "menuPricesConfirmed" || profile.businessTruth.menuPricesMentioned;
    const existingOfferCheck = key === "existingOfferConfirmed";
    const offerRelevant = !existingOfferCheck || profile.businessTruth.existingOfferProvided;
    const active = required && offerRelevant;
    const complete = Boolean(profile.businessTruth[key]);
    return { id: key, label, description, status: !active ? "not_needed" : complete ? "complete" : "review" as const, clientLabel: !active ? "Not needed right now" : complete ? "Complete" : "Veroxa team review", teamLabel: !active ? "Not needed for this package" : complete ? "Ready for review" : "Confirm before public copy", requiredFor: ["starter", "growth", "premium"], value: complete ? "Confirmed" : "Needs confirmation" };
  });
  if (profile.packageId === "premium") {
    items.push({ id: "premiumAdBudgetAcknowledged", label: "Premium ad budget acknowledgement", description: "Ad spend is separate and client approval is required before ad planning.", status: profile.businessTruth.premiumAdBudgetAcknowledged ? "complete" : "review", clientLabel: profile.businessTruth.premiumAdBudgetAcknowledged ? "Complete" : "Veroxa team review", teamLabel: "Confirm before public copy", requiredFor: ["premium"], value: profile.businessTruth.premiumAdBudgetAcknowledged ? "Acknowledged" : "Needs acknowledgement" });
    items.push({ id: "premiumReadinessAssessmentAcknowledged", label: "Advanced readiness assessment", description: "Premium is selective and requires readiness review before ad support.", status: profile.businessTruth.premiumReadinessAssessmentAcknowledged ? "complete" : "review", clientLabel: profile.businessTruth.premiumReadinessAssessmentAcknowledged ? "Complete" : "Veroxa team review", teamLabel: "Needs verification", requiredFor: ["premium"], value: profile.businessTruth.premiumReadinessAssessmentAcknowledged ? "Acknowledged" : "Assessment needed" });
  }
  return items;
}

export function getBusinessTruthItemsToConfirm(profile: RestaurantOnboardingProfile): string[] {
  return getBusinessTruthChecklist(profile).filter((check) => check.status === "review").map((check) => check.label);
}

export function getBusinessTruthStatus(profile: RestaurantOnboardingProfile): string {
  const missing = getBusinessTruthItemsToConfirm(profile);
  if (missing.length === 0) return "Business details are ready for Veroxa team review.";
  return `Details to confirm: ${missing.slice(0, 4).join(", ")}${missing.length > 4 ? ", and remaining details" : ""}.`;
}

export function buildClientBusinessTruthRequest(profile: RestaurantOnboardingProfile): string {
  const missing = getBusinessTruthItemsToConfirm(profile);
  const offerLine = profile.businessTruth.existingOfferProvided && !profile.businessTruth.existingOfferConfirmed ? " Please confirm the exact offer, dates, terms, and pricing before Veroxa prepares anything public." : "";
  if (missing.length === 0) return "Veroxa has the key business details needed for team review. We may still ask you to confirm details before anything public is prepared.";
  return `Please confirm these details so Veroxa can prepare work accurately: ${missing.join(", ")}.${offerLine} Nothing goes live without Veroxa team review.`;
}

export const businessTruthConfirmationRequirements = [
  "hours",
  "holiday hours",
  "address",
  "phone",
  "menu items",
  "menu prices",
  "existing offers/promotions",
  "catering availability",
  "halal/organic/health claims",
  "order links",
  "reservation links",
] as const;

export function getBusinessTruthConfirmationNotice(): string {
  return "Please confirm the exact details before Veroxa prepares anything public. Veroxa does not invent discounts, BOGO offers, price cuts, lower prices, or new promotions.";
}

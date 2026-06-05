import type { OnboardingChecklistItem, OnboardingReadiness, RestaurantOnboardingProfile } from "./types";

const hasText = (value: string) => value.trim().length > 0;
const hasList = (value: string[]) => value.length > 0;

function item(id: string, label: string, description: string, complete: boolean, value?: string): OnboardingChecklistItem {
  return { id, label, description, status: complete ? "complete" : "needed", clientLabel: complete ? "Complete" : "Needs your input", teamLabel: complete ? "Use in first-week setup" : "Missing business info", requiredFor: ["complete_online_presence"], value };
}

export function getBusinessInfoChecklist(profile: RestaurantOnboardingProfile): OnboardingChecklistItem[] {
  return [
    item("restaurantName", "Restaurant name", "The public restaurant name Veroxa should use.", hasText(profile.restaurantName), profile.restaurantName),
    item("contactName", "Contact person", "The person Veroxa should contact during setup.", hasText(profile.contactName), profile.contactName),
    item("phone", "Phone", "Primary restaurant phone number.", hasText(profile.phone), profile.phone),
    item("email", "Email", "Best setup email for Veroxa communication.", hasText(profile.email), profile.email),
    item("address", "Address", "Primary public location address.", hasText(profile.address), profile.address),
    item("website", "Website", "Restaurant website if available.", hasText(profile.websiteUrl), profile.websiteUrl),
    item("cuisineType", "Cuisine type", "Simple food category to guide profile and content language.", hasText(profile.cuisineType), profile.cuisineType),
    item("bestSellers", "Best sellers", "Menu items Veroxa can safely prioritize after review.", hasList(profile.bestSellers), profile.bestSellers.join(", ")),
    item("foodCategories", "Food categories", "Main menu categories for organizing media and captions.", hasList(profile.foodCategories), profile.foodCategories.join(", ")),
    item("busyDaysTimes", "Busy days/times", "When the restaurant is usually most active.", hasList(profile.busyDays) && hasList(profile.busyTimes), [...profile.busyDays, ...profile.busyTimes].join(", ")),
    item("customerTypes", "Customer types", "The people Veroxa should keep in mind when preparing work.", hasList(profile.customerTypes), profile.customerTypes.join(", ")),
  ];
}

export function getMissingBusinessInfo(profile: RestaurantOnboardingProfile): string[] {
  return getBusinessInfoChecklist(profile).filter((check) => check.status === "needed").map((check) => check.label);
}

export function getBusinessInfoReadiness(profile: RestaurantOnboardingProfile): OnboardingReadiness {
  const checklist = getBusinessInfoChecklist(profile);
  const missing = getMissingBusinessInfo(profile);
  const completed = checklist.length - missing.length;
  return { level: missing.length === 0 ? "ready" : completed > 0 ? "partial" : "not_ready", completed, totalRequired: checklist.length, missing, nextAction: getBusinessInfoNextAction(profile) };
}

export function getBusinessInfoNextAction(profile: RestaurantOnboardingProfile): string {
  const missing = getMissingBusinessInfo(profile);
  if (missing.length === 0) return "Business info is ready for Veroxa team review.";
  return `Please confirm: ${missing.slice(0, 4).join(", ")}${missing.length > 4 ? ", and remaining basics" : ""}.`;
}

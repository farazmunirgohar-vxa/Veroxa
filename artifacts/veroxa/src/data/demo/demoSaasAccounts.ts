import { COMPLETE_ONLINE_PRESENCE_PRICE_MONTHLY } from "@/data/pricing/veroxaPricing";
import { evaluateAccountActivation } from "@/domain/saas/accountActivation";
import type { AccountPlanState, RestaurantAccount, RestaurantProfile } from "@/domain/saas/saasTypes";

const DEMO_NOW = "2026-06-03T00:00:00.000Z";

export const demoSaasRestaurants: RestaurantAccount[] = [
  { id: "demo-bistro", name: "Harbor & Basil Bistro", slug: "harbor-basil-bistro", timezone: "America/New_York", cuisineType: "Mediterranean", status: "demo", dataMode: "demo", createdAt: DEMO_NOW, updatedAt: DEMO_NOW },
  { id: "demo-pizzeria", name: "Maple Stone Pizzeria", slug: "maple-stone-pizzeria", timezone: "America/Chicago", cuisineType: "Pizza", status: "demo", dataMode: "demo", createdAt: DEMO_NOW, updatedAt: DEMO_NOW },
  { id: "demo-catering-kitchen", name: "Sunrise Catering Kitchen", slug: "sunrise-catering-kitchen", timezone: "America/Los_Angeles", cuisineType: "Catering", status: "demo", dataMode: "demo", createdAt: DEMO_NOW, updatedAt: DEMO_NOW },
  { id: "demo-noodle-house", name: "Cedar Noodle House", slug: "cedar-noodle-house", timezone: "America/New_York", cuisineType: "Noodles", status: "demo", dataMode: "demo", createdAt: DEMO_NOW, updatedAt: DEMO_NOW },
];

export const demoSaasProfiles: RestaurantProfile[] = demoSaasRestaurants.map((restaurant) => ({
  restaurantId: restaurant.id,
  bestSellers: ["Signature plate", "Family special", "Seasonal side"],
  customerTypes: ["Local regulars", "Weekend families"],
  busyDays: ["Friday", "Saturday"],
  busyTimes: ["Lunch", "Dinner"],
  preferredPostingDays: ["Tuesday", "Thursday"],
  preferredPostingTimes: ["Afternoon"],
  brandVoiceNotes: "Demo-only brand notes for portal review.",
  mediaGuidanceNotes: "Keep sending clear photos of best sellers and dining room details.",
  businessTruthNotes: "Demo business truth confirmed for sample state.",
  clientConfirmedAt: DEMO_NOW,
  updatedAt: DEMO_NOW,
}));

export const demoSaasPlans: AccountPlanState[] = [
  { restaurantId: "demo-bistro", currentPlanId: "complete_online_presence", planStatus: "demo", billingMode: "manual", monthlyPriceCents: COMPLETE_ONLINE_PRESENCE_PRICE_MONTHLY * 100, foundingDiscountEligible: true, foundingDiscountActive: true, premiumReadinessStatus: "not_eligible", adBudgetConfirmed: false, createdAt: DEMO_NOW, updatedAt: DEMO_NOW },
  { restaurantId: "demo-pizzeria", currentPlanId: "complete_online_presence", planStatus: "demo", billingMode: "manual", monthlyPriceCents: COMPLETE_ONLINE_PRESENCE_PRICE_MONTHLY * 100, foundingDiscountEligible: true, foundingDiscountActive: false, premiumReadinessStatus: "not_eligible", adBudgetConfirmed: false, createdAt: DEMO_NOW, updatedAt: DEMO_NOW },
  { restaurantId: "demo-catering-kitchen", currentPlanId: "complete_online_presence", planStatus: "demo", billingMode: "manual", monthlyPriceCents: COMPLETE_ONLINE_PRESENCE_PRICE_MONTHLY * 100, foundingDiscountEligible: false, foundingDiscountActive: false, premiumReadinessStatus: "not_eligible", adBudgetConfirmed: false, createdAt: DEMO_NOW, updatedAt: DEMO_NOW },
  { restaurantId: "demo-noodle-house", currentPlanId: "complete_online_presence", planStatus: "paused", billingMode: "manual", monthlyPriceCents: COMPLETE_ONLINE_PRESENCE_PRICE_MONTHLY * 100, foundingDiscountEligible: true, foundingDiscountActive: false, premiumReadinessStatus: "not_eligible", adBudgetConfirmed: false, createdAt: DEMO_NOW, updatedAt: DEMO_NOW },
];

export const demoAccountActivationSummaries = demoSaasRestaurants.map((restaurant) => {
  const profile = demoSaasProfiles.find((item) => item.restaurantId === restaurant.id);
  const plan = demoSaasPlans.find((item) => item.restaurantId === restaurant.id);
  return {
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    planId: plan?.currentPlanId ?? "complete_online_presence",
    result: evaluateAccountActivation({
      restaurantStatus: restaurant.status,
      planStatus: plan?.planStatus,
      hasActiveClientMembership: true,
      hasRestaurantProfile: Boolean(profile),
      hasConfirmedBusinessTruth: Boolean(profile?.clientConfirmedAt),
      hasUsableMedia: true,
      hasPublishedClientReport: restaurant.id === "demo-pizzeria",
      hasActivityLogScaffold: true,
      dataMode: "demo",
    }),
  };
});

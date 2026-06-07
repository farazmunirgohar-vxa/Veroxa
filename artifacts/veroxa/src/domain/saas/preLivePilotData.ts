import { COMPLETE_ONLINE_PRESENCE_PRICE_MONTHLY } from "@/data/pricing/veroxaPricing";
import type { AccountPlanState, RestaurantAccount, RestaurantProfile } from "./saasTypes";

export const MOMO_HOUSE_RESTAURANT_ID = "pilot-momo-house-san-antonio";
const NOW = "2026-06-07T00:00:00.000Z";

export const momoHousePilotRestaurant: RestaurantAccount = {
  id: MOMO_HOUSE_RESTAURANT_ID,
  name: "Momo House San Antonio",
  slug: "momo-house-san-antonio",
  primaryLocationName: "Momo House De Zavala",
  addressLine1: "4447 De Zavala Rd",
  city: "San Antonio",
  state: "TX",
  postalCode: "78249",
  timezone: "America/Chicago",
  phone: "(210) 492-1711",
  websiteUrl: "https://momohousesa.com",
  instagramUrl: "Presence known — link/access needs owner verification",
  facebookUrl: "Presence known — link/access needs owner verification",
  menuUrl: "https://momohousesa.com",
  orderingUrl: "https://momohousesa.com",
  cuisineType: "Nepali-style dumplings / momo",
  status: "onboarding",
  dataMode: "placeholder_review",
  createdAt: NOW,
  updatedAt: NOW,
};

export const momoHousePilotProfile: RestaurantProfile = {
  restaurantId: MOMO_HOUSE_RESTAURANT_ID,
  bestSellers: ["Steamed momo", "Fried momo", "Soup momo"],
  customerTypes: ["First-time momo customers", "De Zavala / UTSA locals", "Catering inquiries"],
  busyDays: [],
  busyTimes: [],
  preferredPostingDays: [],
  preferredPostingTimes: [],
  brandVoiceNotes: "Internal pilot positioning: good online pieces becoming a consistent growth system. Use educational momo content and owner-confirmed claims only.",
  mediaGuidanceNotes: "Request current food photos/videos, best-seller media, menu/order links, and optional dining area/logo photos.",
  businessTruthNotes: "Hours, menu items/prices, ordering links, catering availability, and dietary/health/halal/organic claims need owner verification before public copy.",
  updatedAt: NOW,
};

export const momoHousePilotPlan: AccountPlanState = {
  restaurantId: MOMO_HOUSE_RESTAURANT_ID,
  currentPlanId: "complete_online_presence",
  planStatus: "onboarding",
  billingMode: "manual",
  monthlyPriceCents: COMPLETE_ONLINE_PRESENCE_PRICE_MONTHLY * 100,
  foundingDiscountEligible: false,
  foundingDiscountActive: false,
  premiumReadinessStatus: "not_eligible",
  adBudgetConfirmed: false,
  createdAt: NOW,
  updatedAt: NOW,
};

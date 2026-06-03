import { VEROXA_PLANS } from "@/data/pricing/veroxaPricing";
import { buildProfitValidationSnapshot } from "@/domain/saas/profitValidationPersistence";

export const demoProfitValidationSnapshots = [
  buildProfitValidationSnapshot({
    restaurantId: "demo-bistro",
    dataMode: "demo",
    daysSinceStart: 45,
    monthlyFee: VEROXA_PLANS.starter.priceMonthly,
    averageTicket: 18,
    estimatedNetMargin: 0.07,
    onlineInfluencedActionsPerDay: 14,
    trackingConfidence: "directional",
    createdAt: "2026-06-03T00:00:00.000Z",
  }),
  buildProfitValidationSnapshot({
    restaurantId: "demo-pizzeria",
    dataMode: "demo",
    daysSinceStart: 75,
    monthlyFee: VEROXA_PLANS.growth.priceMonthly,
    averageTicket: 24,
    estimatedNetMargin: 0.08,
    onlineInfluencedActionsPerDay: 28,
    trackingConfidence: "strong_signal",
    createdAt: "2026-06-03T00:00:00.000Z",
  }),
  buildProfitValidationSnapshot({
    restaurantId: "demo-catering-kitchen",
    dataMode: "demo",
    daysSinceStart: 18,
    monthlyFee: VEROXA_PLANS.premium.priceMonthly,
    averageTicket: 32,
    estimatedNetMargin: 0.1,
    onlineInfluencedActionsPerDay: 9,
    trackingConfidence: "unknown",
    createdAt: "2026-06-03T00:00:00.000Z",
  }),
];

import { isReachSignal } from "./proofSignalCatalog";
import type { ReachSignal, ReachSource } from "./types";
export const currentLaunchReachSources: ReachSource[] = ["google_search", "google_maps", "google_business_profile", "website", "menu_link", "order_link", "facebook", "instagram", "owner_reported"];
export const comingSoonReachSources: ReachSource[] = ["yelp", "tiktok"];

export function getRestaurantReachSignals(
  signals: ReachSignal[],
): ReachSignal[] {
  return signals.filter((s) => isReachSignal(s.signalType) && currentLaunchReachSources.includes(s.source));
}
export function summarizeRestaurantReach(signals: ReachSignal[]): string {
  const reach = getRestaurantReachSignals(signals);
  if (!reach.length) return "Reach signals are not connected yet.";
  return `${reach.length} current launch reach signal groups are visible in preview: Google/search, Maps, website/menu/order link clarity, Facebook, Instagram, phone/directions/profile actions, customer mentions, and owner-reported activity stay separate from coming-soon Yelp/TikTok/Reels/ads reach.`;
}

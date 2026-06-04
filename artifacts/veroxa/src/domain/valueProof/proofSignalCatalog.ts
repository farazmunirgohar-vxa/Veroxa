import type { ReachSignalType } from "./types";
export const reachSignalTypes: ReachSignalType[] = [
  "profile_view",
  "search_impression",
  "maps_view",
  "social_reach",
  "reel_view",
  "post_view",
  "profile_visit",
  "media_engagement",
];
export const customerActionSignalTypes: ReachSignalType[] = [
  "website_click",
  "menu_click",
  "order_link_click",
  "call_click",
  "direction_click",
  "reservation_interest",
  "catering_interest",
  "customer_mention",
  "repeat_attention",
];
export function isCustomerActionSignal(type: ReachSignalType): boolean {
  return customerActionSignalTypes.includes(type);
}
export function isReachSignal(type: ReachSignalType): boolean {
  return reachSignalTypes.includes(type);
}

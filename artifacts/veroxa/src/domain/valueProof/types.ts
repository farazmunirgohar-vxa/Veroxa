export type ReachSource =
  | "google_search"
  | "google_maps"
  | "google_business_profile"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "yelp"
  | "ads"
  | "website"
  | "menu_link"
  | "order_link"
  | "owner_reported"
  | "manual_note";
export type ReachSignalType =
  | "profile_view"
  | "search_impression"
  | "maps_view"
  | "social_reach"
  | "reel_view"
  | "post_view"
  | "profile_visit"
  | "website_click"
  | "menu_click"
  | "order_link_click"
  | "call_click"
  | "direction_click"
  | "reservation_interest"
  | "catering_interest"
  | "customer_mention"
  | "repeat_attention"
  | "media_engagement"
  | "unknown";
export type AttributionConfidence =
  | "confirmed"
  | "strong_signal"
  | "directional"
  | "owner_reported"
  | "unknown";
export type ValueProofStatus =
  | "not_enough_data"
  | "weak"
  | "developing"
  | "strong"
  | "at_risk"
  | "needs_adjustment";
export interface ReachSignal {
  id: string;
  clientId: string;
  source: ReachSource;
  platform: string;
  signalType: ReachSignalType;
  label: string;
  value: number;
  period: string;
  confidence: AttributionConfidence;
  clientSafe: boolean;
  teamOnly: boolean;
  notes: string;
}
export interface ValueProofSummary {
  clientId: string;
  restaurantName: string;
  status: ValueProofStatus;
  reachSignals: ReachSignal[];
  customerActionSignals: ReachSignal[];
  clientSafeSummary: string;
  teamSummary: string;
  nextAction: string;
}

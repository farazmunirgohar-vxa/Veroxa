import { getCustomerActionSignals } from "./onlineInfluencedActionEngine";
import { getRestaurantReachSignals } from "./restaurantReachEngine";
import { determineValueProofStatus } from "./valueStatusEngine";
import type { ReachSignal, ValueProofSummary } from "./types";
export const valueProofSeedSignals: ReachSignal[] = [
  {
    id: "reach-search-1",
    clientId: "demo-c",
    source: "google_search",
    platform: "Google",
    signalType: "search_impression",
    label: "Local search visibility",
    value: 0,
    period: "preview",
    confidence: "directional",
    clientSafe: true,
    teamOnly: false,
    notes: "Deterministic preview placeholder; not live analytics.",
  },
  {
    id: "reach-maps-1",
    clientId: "demo-c",
    source: "google_maps",
    platform: "Maps",
    signalType: "maps_view",
    label: "Maps visibility",
    value: 0,
    period: "preview",
    confidence: "directional",
    clientSafe: true,
    teamOnly: false,
    notes: "Reach, not a customer action.",
  },
  {
    id: "reach-social-1",
    clientId: "demo-c",
    source: "instagram",
    platform: "Instagram",
    signalType: "social_reach",
    label: "Social reach",
    value: 0,
    period: "preview",
    confidence: "unknown",
    clientSafe: true,
    teamOnly: false,
    notes: "No fake live metric.",
  },
  {
    id: "action-menu-1",
    clientId: "demo-c",
    source: "menu_link",
    platform: "Menu link",
    signalType: "menu_click",
    label: "Menu interest",
    value: 0,
    period: "preview",
    confidence: "unknown",
    clientSafe: true,
    teamOnly: false,
    notes: "Action signal when connected later.",
  },
  {
    id: "action-direction-1",
    clientId: "demo-c",
    source: "google_maps",
    platform: "Maps",
    signalType: "direction_click",
    label: "Directions interest",
    value: 0,
    period: "preview",
    confidence: "unknown",
    clientSafe: true,
    teamOnly: false,
    notes: "Action signal when connected later.",
  },
  {
    id: "team-note-1",
    clientId: "demo-c",
    source: "manual_note",
    platform: "Team note",
    signalType: "customer_mention",
    label: "Customer mention",
    value: 0,
    period: "preview",
    confidence: "owner_reported",
    clientSafe: false,
    teamOnly: true,
    notes: "Team-only owner-reported signal awaiting verification.",
  },
];
export function buildValueProofSummary(
  clientId = "demo-c",
  restaurantName = "Complete Online Presence benchmark",
): ValueProofSummary {
  const signals = valueProofSeedSignals.filter((s) => s.clientId === clientId);
  const reachSignals = getRestaurantReachSignals(signals);
  const customerActionSignals = getCustomerActionSignals(signals);
  const status = determineValueProofStatus(signals);
  return {
    clientId,
    restaurantName,
    status,
    reachSignals,
    customerActionSignals,
    clientSafeSummary:
      "Customer-action signals are developing. Calls, directions, website clicks, menu/order clicks, profile actions, Facebook/Instagram reach, customer mentions, owner-reported signals, and media working/not-working notes become stronger proof signals when reviewed later.",
    teamSummary:
      "Team-only preview separates reach from customer actions and keeps $9,900/month internal online-influenced sales channel baseline, healthy $15k–$25k/month range, and strong $25k+/month review internal. This is not extra new sales.",
    nextAction:
      "Review local reach quality, customer-action signals, and media supply before the next report.",
  };
}
export const valueProofSeedSummaries = [buildValueProofSummary()];

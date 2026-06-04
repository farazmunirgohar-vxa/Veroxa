import { getCustomerActionSignals } from "./onlineInfluencedActionEngine";
import { getRestaurantReachSignals } from "./restaurantReachEngine";
import type { ReachSignal, ValueProofStatus } from "./types";
export function determineValueProofStatus(
  signals: ReachSignal[],
): ValueProofStatus {
  const actions = getCustomerActionSignals(signals);
  const reach = getRestaurantReachSignals(signals);
  if (signals.length < 3) return "not_enough_data";
  if (actions.length >= 4 && reach.length >= 4) return "strong";
  if (actions.length >= 2) return "developing";
  if (reach.length >= 3 && actions.length === 0) return "needs_adjustment";
  return "weak";
}

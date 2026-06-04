import { isReachSignal } from "./proofSignalCatalog";
import type { ReachSignal } from "./types";
export function getRestaurantReachSignals(
  signals: ReachSignal[],
): ReachSignal[] {
  return signals.filter((s) => isReachSignal(s.signalType));
}
export function summarizeRestaurantReach(signals: ReachSignal[]): string {
  const reach = getRestaurantReachSignals(signals);
  if (!reach.length) return "Reach signals are not connected yet.";
  return `${reach.length} reach signal groups are visible in preview: search, Maps, social, and media reach stay separate from customer actions.`;
}

import { isCustomerActionSignal } from "./proofSignalCatalog";
import type { ReachSignal } from "./types";
export function getCustomerActionSignals(
  signals: ReachSignal[],
): ReachSignal[] {
  return signals.filter((s) => isCustomerActionSignal(s.signalType));
}
export function summarizeCustomerActions(signals: ReachSignal[]): string {
  const actions = getCustomerActionSignals(signals);
  if (!actions.length) return "Customer-action signals are not connected yet.";
  return "Customer-action signals are developing across calls, directions, menu clicks, order-link clicks, profile visits, mentions, and owner-reported notes.";
}

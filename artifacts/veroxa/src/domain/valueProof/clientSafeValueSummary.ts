import type { ValueProofSummary } from "./types";
export function buildClientSafeValueSummary(
  summary: ValueProofSummary,
): string {
  return `${summary.clientSafeSummary} More media and connected action signals will make reporting clearer. No ranking, revenue, or order guarantee is implied.`;
}

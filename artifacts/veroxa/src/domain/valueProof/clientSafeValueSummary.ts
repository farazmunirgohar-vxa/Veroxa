import type { ValueProofSummary } from "./types";
export function buildClientSafeValueSummary(
  summary: ValueProofSummary,
): string {
  return `${summary.clientSafeSummary} Weekly updates and the monthly online presence report show what Veroxa handled, what worked, what did not work, what media is needed next, and what needs confirmation. Yelp is coming soon, no raw internal scores or profit math are shown, and no ranking, revenue, order, ROI, profit, customer, walk-in, or growth guarantee is implied.`;
}

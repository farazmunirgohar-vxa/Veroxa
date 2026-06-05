import type { ValueProofSummary } from "./types";
export function buildClientSafeValueSummary(
  summary: ValueProofSummary,
): string {
  return `${summary.clientSafeSummary} Weekly updates and the monthly online presence report show what Veroxa handled, what worked, what did not work, what media is needed next, and what needs confirmation. Yelp is coming soon. Client reporting stays focused on online-influenced customer actions and channel importance without private team targets or outcome promises.`;
}

export function getClientSafeOnlinePresenceChannelSummary(): string {
  return "Veroxa tracks online-influenced customer actions such as calls, directions, website/menu clicks, profile actions, content reach, and customer mentions to understand whether the online presence channel is meaningful. Early reports may say there is not enough data yet.";
}

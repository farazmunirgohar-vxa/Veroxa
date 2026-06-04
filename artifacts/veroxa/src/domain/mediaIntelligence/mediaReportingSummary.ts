import type { MediaAssetInsight } from "./types";
import { splitWorkingNotWorking } from "./workingNotWorkingEngine";
export function buildClientSafeMediaSummary(
  insights: MediaAssetInsight[],
): string {
  const grouped = splitWorkingNotWorking(insights);
  return `Media notes: ${grouped.working.length} item types look useful or promising, ${grouped.weak.length} need improvement, and ${grouped.notEnoughData.length} need more context. No live analytics are implied.`;
}
export function buildTeamMediaSummary(insights: MediaAssetInsight[]): string {
  const grouped = splitWorkingNotWorking(insights);
  return `Team media intelligence preview: working/promising ${grouped.working.length}, weak ${grouped.weak.length}, not enough data ${grouped.notEnoughData.length}. Review package fit before recommending Reels, TikTok, daily posting, or ads.`;
}

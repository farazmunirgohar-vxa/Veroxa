import type { MediaAssetInsight } from "./types";
export function splitWorkingNotWorking(insights: MediaAssetInsight[]) {
  return {
    working: insights.filter((i) =>
      ["working", "promising"].includes(i.performanceStatus),
    ),
    weak: insights.filter((i) =>
      ["weak", "platform_mismatch", "overused"].includes(i.performanceStatus),
    ),
    notEnoughData: insights.filter(
      (i) => i.performanceStatus === "not_enough_data",
    ),
  };
}

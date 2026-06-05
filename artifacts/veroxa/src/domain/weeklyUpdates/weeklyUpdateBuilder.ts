import { weeklyUpdateSeedData } from "./weeklyUpdateSeedData";
import { buildWeeklyUpdateReadiness } from "./weeklyUpdateStatusEngine";
import type { WeeklyUpdateRecord } from "./types";

export function getLatestWeeklyUpdate(clientId = "preview-client"): WeeklyUpdateRecord {
  return weeklyUpdateSeedData.find((update) => update.clientId === clientId) ?? weeklyUpdateSeedData[0];
}

export function buildClientWeeklyUpdatePreview(update: WeeklyUpdateRecord = getLatestWeeklyUpdate()) {
  return { update, readiness: buildWeeklyUpdateReadiness(update) };
}

import type { QualityStatus } from "./types";
export function getMediaQualityStatus(notes: string): QualityStatus {
  const text = notes.toLowerCase();
  if (text.includes("blurry")) return "blurry";
  if (text.includes("dark")) return "needs_better_lighting";
  if (text.includes("duplicate")) return "duplicate";
  if (text.includes("claim") || text.includes("price"))
    return "needs_confirmation";
  if (text.includes("strong") || text.includes("clear")) return "ready";
  return "usable";
}
export function getTeamQualityLabel(status: QualityStatus): string {
  return status.replaceAll("_", " ");
}

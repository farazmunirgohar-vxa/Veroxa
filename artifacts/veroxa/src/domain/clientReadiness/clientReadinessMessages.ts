import type { ClientReadinessScoreLabel, ClientSafeReadinessStatus } from "./types";

export function getClientSafeReadinessMessage(label: ClientReadinessScoreLabel, nextAction: string): string {
  if (label === "Ready for Veroxa review") return "Your setup is ready for Veroxa team review. Veroxa will continue preparing work before anything goes live.";
  if (label === "Almost ready") return `Your workspace is almost ready. Next step: ${nextAction}.`;
  if (label === "Some items ready") return `Some setup items are ready. Next step: ${nextAction}.`;
  return `Veroxa is preparing your workspace. Next step: ${nextAction}.`;
}

export function getReadinessStatusHelp(status: ClientSafeReadinessStatus): string {
  switch (status) {
    case "Needs your input": return "Veroxa needs a detail, confirmation, access item, or media from the restaurant.";
    case "Waiting on media": return "More usable photos will help Veroxa keep weekly content steady.";
    case "Waiting on access": return "Access is not connected here; this checklist only shows what Veroxa may need manually.";
    case "Coming soon": return "This is not included at launch and is saved for later roadmap review.";
    case "Add-on available": return "This can be reviewed manually as an optional add-on; no payment flow is connected.";
    default: return "Veroxa will review before anything customer-visible goes live.";
  }
}

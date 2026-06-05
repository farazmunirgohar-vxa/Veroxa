import type { WeeklyUpdateReadiness, WeeklyUpdateRecord, WeeklyUpdateStatus } from "./types";

export function getWeeklyUpdateStatusLabel(status: WeeklyUpdateStatus): string {
  const labels: Record<WeeklyUpdateStatus, string> = {
    not_started: "Not started",
    preparing: "Preparing weekly update",
    needs_media: "Needs media",
    needs_confirmation: "Needs confirmations",
    ready_for_review: "Ready for Veroxa review",
    ready_to_share: "Ready to share",
    shared_preview: "Shared in preview",
  };
  return labels[status];
}

export function buildWeeklyUpdateReadiness(update: WeeklyUpdateRecord): WeeklyUpdateReadiness {
  const blockers = [...update.mediaNeeded, ...update.clientConfirmationsNeeded];
  if (update.status === "ready_to_share" || update.status === "shared_preview") return { status: update.status, label: getWeeklyUpdateStatusLabel(update.status), nextAction: "Review the weekly update in the portal.", canSharePreview: true, blockers: [] };
  if (update.mediaNeeded.length > 0) return { status: "needs_media", label: getWeeklyUpdateStatusLabel("needs_media"), nextAction: "Send usable restaurant photos so Veroxa can keep the weekly rhythm steady.", canSharePreview: false, blockers };
  if (update.clientConfirmationsNeeded.length > 0) return { status: "needs_confirmation", label: getWeeklyUpdateStatusLabel("needs_confirmation"), nextAction: "Confirm exact business details before Veroxa prepares anything public.", canSharePreview: false, blockers };
  return { status: "ready_for_review", label: getWeeklyUpdateStatusLabel("ready_for_review"), nextAction: "Wait for Veroxa team review before anything goes live.", canSharePreview: false, blockers: [] };
}

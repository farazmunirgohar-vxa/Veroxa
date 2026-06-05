import type { WeeklyUpdateRecord } from "./types";

export function getClientWeeklyUpdateReminder(update: WeeklyUpdateRecord): string {
  if (update.mediaNeeded.length > 0) return "More usable photos help Veroxa keep weekly updates and picture-based posts consistent.";
  if (update.clientConfirmationsNeeded.length > 0) return "Please confirm exact details before Veroxa prepares public-facing copy.";
  return "Veroxa will review the weekly update before anything is shared.";
}

export function getPortalRequestResponseReminder(): string {
  return "Portal request response means Veroxa reviews, answers, or gives the next step within 24 hours; it is not a guaranteed completion time.";
}

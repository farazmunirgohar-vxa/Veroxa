import type { ManualExecutionPack, ManualPublishStatus } from "./types";
import { requiresClientConfirmation } from "./clientConfirmationWorkflow";

export function getManualPublishingStatus(pack: ManualExecutionPack): ManualPublishStatus {
  return pack.manualPublishStatus;
}

export function getManualPublishingChecklist(pack: ManualExecutionPack): readonly string[] {
  const checklist = [
    "Team reviewed caption/update.",
    "Client-provided media is usable.",
    "Business-truth claims checked.",
    "Hours/menu/prices/offers confirmed if mentioned.",
    "Platform access available manually.",
    "Copied into correct platform manually.",
    "Screenshot or proof saved manually later.",
    "Marked as completed manually in tracker later.",
  ];
  if (requiresClientConfirmation(pack)) {
    return ["Client confirmation received before any manual execution.", ...checklist];
  }
  return checklist;
}

export function getManualPublishingBlockers(pack: ManualExecutionPack): readonly string[] {
  const blockers: string[] = [];
  if (pack.blockedReason) blockers.push(pack.blockedReason);
  if (pack.riskFlags.includes("missing_media")) blockers.push("More media needed before manual execution.");
  if (pack.riskFlags.includes("low_media_quality")) blockers.push("Current media needs review or replacement.");
  if (pack.riskFlags.includes("platform_access_needed")) blockers.push("Manual platform access must be available before posting.");
  if (requiresClientConfirmation(pack) && pack.confirmationStatus !== "confirmed") {
    blockers.push("Client confirmation needed before manual execution.");
  }
  if (pack.riskFlags.includes("no_usable_action")) blockers.push("No usable manual action is recommended yet.");
  return [...new Set(blockers)];
}

export function getManualPublishingTimelinePreview(pack: ManualExecutionPack): readonly string[] {
  const steps = ["Prepared", "Team reviewed"];
  if (requiresClientConfirmation(pack)) steps.push("Client confirmed if required");
  steps.push("Copied manually", "Posted manually later", "Logged manually later", "Included in report later");
  return steps;
}

export function getManualPublishingCompletionLabel(pack: ManualExecutionPack): string {
  const labels: Record<ManualPublishStatus, string> = {
    not_ready: "Not ready for manual execution",
    ready_for_manual_execution: "Ready for manual execution",
    copied_by_team: "Copied by team preview",
    manually_posted: "Manually posted preview",
    manually_logged: "Manually logged preview",
    skipped: "Skipped manually",
    blocked: "Blocked before manual execution",
  };
  return labels[pack.manualPublishStatus];
}

export const CLIENT_MEDIA_LIFECYCLE_STAGES = [
  "Uploaded",
  "Reviewed",
  "Ready",
  "Scheduled",
  "Posted",
] as const;

export type ClientMediaLifecycleStage =
  (typeof CLIENT_MEDIA_LIFECYCLE_STAGES)[number];

export const CLIENT_MEDIA_EXCEPTION_STATUSES = [
  "Needs better media",
  "Saved for later",
  "Waiting for direction",
  "Not usable",
  "Already used",
] as const;

export type ClientMediaExceptionStatus =
  (typeof CLIENT_MEDIA_EXCEPTION_STATUSES)[number];

export type ClientMediaDisplayStatus =
  | ClientMediaLifecycleStage
  | ClientMediaExceptionStatus;

const lifecycleIndexes: Record<ClientMediaLifecycleStage, number> = {
  Uploaded: 0,
  Reviewed: 1,
  Ready: 2,
  Scheduled: 3,
  Posted: 4,
};

export function getClientMediaLifecycleIndex(
  status: ClientMediaDisplayStatus,
): number {
  if (status in lifecycleIndexes) {
    return lifecycleIndexes[status as ClientMediaLifecycleStage];
  }
  return 0;
}

export function isClientMediaLifecycleStage(
  status: ClientMediaDisplayStatus,
): status is ClientMediaLifecycleStage {
  return CLIENT_MEDIA_LIFECYCLE_STAGES.includes(
    status as ClientMediaLifecycleStage,
  );
}

export function getClientMediaStatusTone(status: ClientMediaDisplayStatus) {
  if (status === "Posted" || status === "Already used") return "complete";
  if (status === "Needs better media" || status === "Waiting for direction") {
    return "attention";
  }
  if (status === "Not usable") return "muted";
  if (status === "Ready" || status === "Scheduled") return "ready";
  return "progress";
}

export function normalizeClientMediaDisplayStatus(
  input?: string | null,
): ClientMediaDisplayStatus {
  const value = (input ?? "").trim().toLowerCase();

  if (["uploaded", "submitted", "new", "received by veroxa"].includes(value)) {
    return "Uploaded";
  }
  if (
    [
      "reviewed",
      "in review",
      "being reviewed",
      "needs review",
      "veroxa is working on it",
      "in progress",
    ].includes(value)
  ) {
    return "Reviewed";
  }
  if (
    [
      "ready",
      "accepted",
      "accepted — in progress",
      "prepared by veroxa",
      "ready for editing",
      "good for google post",
    ].includes(value)
  ) {
    return "Ready";
  }
  if (["scheduled", "on schedule"].includes(value)) return "Scheduled";
  if (
    ["posted", "completed", "included in report", "published"].includes(value)
  ) {
    return "Posted";
  }
  if (
    [
      "needs better media",
      "needs better lighting",
      "more content needed",
    ].includes(value)
  ) {
    return "Needs better media";
  }
  if (["saved for later", "on hold"].includes(value)) return "Saved for later";
  if (
    [
      "waiting for direction",
      "needs your input",
      "veroxa needs your input",
      "waiting on you",
      "blocked",
    ].includes(value)
  ) {
    return "Waiting for direction";
  }
  if (["not usable", "not recommended"].includes(value)) return "Not usable";
  if (["already used", "used media"].includes(value)) return "Already used";

  return "Uploaded";
}

export function getClientMediaNextStepCopy(
  status: ClientMediaDisplayStatus,
): string {
  switch (status) {
    case "Uploaded":
      return "Veroxa received it and will review if it is useful for upcoming updates.";
    case "Reviewed":
      return "Veroxa checked it and is deciding the best use.";
    case "Ready":
      return "Ready for use when it fits the next update.";
    case "Scheduled":
      return "Planned for posting or use in an upcoming update.";
    case "Posted":
      return "Live or already used in Veroxa work.";
    case "Needs better media":
      return "Please provide a clearer version if this item still matters.";
    case "Waiting for direction":
      return "Veroxa needs a quick note before using this.";
    case "Saved for later":
      return "Saved for a future moment, but not urgent right now.";
    case "Not usable":
      return "Not recommended for Veroxa to use as-is.";
    case "Already used":
      return "Already posted or used in previous Veroxa work.";
  }
}

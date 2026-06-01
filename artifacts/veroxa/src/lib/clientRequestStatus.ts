export const CLIENT_REQUEST_TYPES = [
  "Use this media",
  "Save for later",
  "Push a special/event",
  "Avoid an item",
  "General note",
] as const;

export type ClientRequestType = (typeof CLIENT_REQUEST_TYPES)[number];

export const CLIENT_REQUEST_TYPE_DESCRIPTIONS: Record<
  ClientRequestType,
  string
> = {
  "Use this media": "Tell Veroxa which photo or video matters now.",
  "Save for later": "Keep an item for a better future moment.",
  "Push a special/event":
    "Point Veroxa toward a special, event, or seasonal push.",
  "Avoid an item": "Tell Veroxa not to use a dish, angle, or media item.",
  "General note": "Share any simple direction for the account.",
};

export type ClientRequestStatus =
  | "Received"
  | "In Review"
  | "Handled"
  | "Waiting for you";

export function toClientRequestStatus(status: string): ClientRequestStatus {
  const value = status.toLowerCase();
  if (
    value.includes("done") ||
    value.includes("complete") ||
    value.includes("posted") ||
    value.includes("handled") ||
    value.includes("included")
  ) {
    return "Handled";
  }
  if (
    value.includes("blocked") ||
    value.includes("client") ||
    value.includes("waiting") ||
    value.includes("needs your input")
  ) {
    return "Waiting for you";
  }
  if (
    value.includes("progress") ||
    value.includes("review") ||
    value.includes("prepar") ||
    value.includes("ready")
  ) {
    return "In Review";
  }
  return "Received";
}

export function buildClientRequestTitle(
  type: ClientRequestType,
  note: string,
): string {
  const trimmed = note.trim();
  return `${type}: ${trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed}`;
}

export function toTeamRequestPreviewStatus(status: string): string {
  const clientStatus = toClientRequestStatus(status);
  switch (clientStatus) {
    case "Received":
      return "Ready for review";
    case "In Review":
      return "Veroxa team review";
    case "Handled":
      return "Handled";
    case "Waiting for you":
      return "Needs client input";
  }
}

export const CLIENT_REQUEST_TYPES = [
  "Use this media",
  "Save for later",
  "Push a special/event",
  "Avoid an item",
  "General note",
] as const;

export type ClientRequestType = (typeof CLIENT_REQUEST_TYPES)[number];

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

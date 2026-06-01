export const CLIENT_REQUEST_TYPES = [
  "Use this media",
  "Save for later",
  "Push a special/event",
  "Avoid an item",
  "General note",
] as const;

export type ClientRequestType = (typeof CLIENT_REQUEST_TYPES)[number];

export const CLIENT_REQUEST_STATUSES = [
  "Received",
  "In Review",
  "Handled",
  "Waiting for you",
] as const;

export type ClientRequestStatus = (typeof CLIENT_REQUEST_STATUSES)[number];

export function getClientRequestStatus(status: string): ClientRequestStatus {
  const value = status.toLowerCase();
  if (
    value.includes("done") ||
    value.includes("complete") ||
    value.includes("posted")
  )
    return "Handled";
  if (
    value.includes("blocked") ||
    value.includes("client") ||
    value.includes("waiting")
  )
    return "Waiting for you";
  if (
    value.includes("progress") ||
    value.includes("review") ||
    value.includes("accepted")
  )
    return "In Review";
  return "Received";
}

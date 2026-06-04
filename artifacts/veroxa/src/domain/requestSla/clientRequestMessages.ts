import type { PortalRequest } from "./types";
export function buildClientRequestWindowMessage(
  request: PortalRequest,
): string {
  if (request.status === "completed")
    return "This request has been answered or completed after Veroxa team review.";
  return "Portal requests are the normal channel for routine work. Veroxa will respond within 24 hours; larger work may take longer after review.";
}

import type { RequestEligibilityStatus } from "../packageBoundary";
import type { RequestStatus } from "./types";
export function statusFromEligibility(
  status: RequestEligibilityStatus,
): RequestStatus {
  if (status === "included") return "in_review";
  if (status === "needs_upgrade") return "upgrade_required";
  if (status === "needs_confirmation") return "needs_client_input";
  if (status === "not_supported_at_launch") return "not_supported";
  if (status === "unclear") return "received";
  return "in_review";
}
export function isSlaSatisfied(status: RequestStatus): boolean {
  return [
    "needs_client_input",
    "upgrade_required",
    "scheduled_for_manual_work",
    "completed",
    "declined",
    "not_supported",
    "paused",
  ].includes(status);
}

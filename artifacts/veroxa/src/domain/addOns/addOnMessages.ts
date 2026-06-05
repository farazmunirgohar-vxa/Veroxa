import type { AddOnReadinessStatus } from "./types";
export function getAddOnStatusMessage(status: AddOnReadinessStatus): string {
  switch (status) {
    case "add_on_available": return "This add-on is available for manual review; no payment flow is connected.";
    case "needs_client_approval": return "The restaurant must approve the add-on scope before Veroxa prepares manual work.";
    case "ready_for_manual_review": return "Ready for Veroxa team review in preview/manual mode.";
    case "not_connected_to_payment": return "Add-on pricing is informational only here; checkout is not connected.";
    case "may_be_needed": return "This may be useful if access/profile/website gaps remain.";
    default: return "No add-on is needed right now.";
  }
}

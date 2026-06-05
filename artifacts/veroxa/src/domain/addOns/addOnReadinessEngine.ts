import { addOnCatalog } from "./addOnCatalog";
import { getAddOnStatusMessage } from "./addOnMessages";
import type { AddOnReadinessInput, AddOnReadinessItem, AddOnReadinessStatus } from "./types";
function statusFor(needed: boolean | undefined, approved: boolean | undefined): AddOnReadinessStatus {
  if (!needed) return "not_needed";
  if (approved) return "ready_for_manual_review";
  return "add_on_available";
}
export function buildAddOnReadiness(input: AddOnReadinessInput = {}): AddOnReadinessItem[] {
  const statusById = {
    new_basic_website: statusFor(input.needsBasicWebsite, input.clientApproved),
    missing_facebook_profile: statusFor(input.missingFacebook, input.clientApproved),
    missing_instagram_profile: statusFor(input.missingInstagram, input.clientApproved),
  } as const;
  return addOnCatalog.map((item) => ({ id: item.id, label: item.label, displayPrice: item.displayPrice, status: statusById[item.id], message: getAddOnStatusMessage(statusById[item.id]), nextAction: statusById[item.id] === "not_needed" ? "No action needed" : "Review add-on scope manually; no checkout is connected" }));
}

import type { OnboardingChecklistItem, RestaurantOnboardingProfile } from "./types";

function proofItem(id: string, label: string, description: string, complete: boolean, optional = false): OnboardingChecklistItem {
  return { id, label, description, status: complete ? "complete" : optional ? "optional" : "needed", clientLabel: complete ? "Complete" : optional ? "Optional" : "Needs your input", teamLabel: complete ? "Use in first-week setup" : "Needs verification", requiredFor: ["complete_online_presence"] };
}

export function getProofInputChecklist(profile: RestaurantOnboardingProfile): OnboardingChecklistItem[] {
  const proof = profile.proofInputs;
  return [
    proofItem("averageTicket", "Average ticket", "Optional internal context if the restaurant wants to provide it.", Boolean(proof.averageTicket), true),
    proofItem("currentMonthlyCustomerGoal", "Current monthly customer goal", "Optional owner context for future review conversations.", Boolean(proof.currentMonthlyCustomerGoal), true),
    proofItem("mainCustomerType", "Main customer type", "Who Veroxa should keep in mind when reviewing online actions.", Boolean(proof.mainCustomerType)),
    proofItem("mostWantedAction", "Most wanted action", "Calls, visits, orders, catering, or repeat-customer attention.", Boolean(proof.mostWantedAction)),
    proofItem("bestSellers", "Best sellers", "Items to use when evaluating what online presence should support.", profile.bestSellers.length > 0),
    proofItem("currentWeakPoints", "Current weak points", "What currently feels unclear, inconsistent, or under-supported online.", proof.currentWeakPoints.length > 0),
    proofItem("orderMenuAvailability", "Order/menu link availability", "Whether key action paths are available for review.", proof.orderLinkAvailable || proof.menuLinkAvailable),
    proofItem("confidence", "Google/social confidence", "Owner-reported confidence level for later signal review.", Boolean(proof.googleConfidence || proof.socialConfidence), true),
    proofItem("ownerNotes", "Owner-reported baseline notes", "Optional notes for future internal value review.", Boolean(proof.ownerReportedBaselineNotes), true),
    proofItem("trackingSignalsLater", "Tracking signals available later", "Whether future online-action signals may be reviewed.", proof.trackingSignalsAvailableLater, true),
  ];
}

export function getProofInputStatus(profile: RestaurantOnboardingProfile): string {
  const missing = getMissingProofInputs(profile);
  if (missing.length === 0) return "Proof inputs are ready for internal review.";
  return `Proof inputs still needed: ${missing.slice(0, 4).join(", ")}.`;
}

export function getMissingProofInputs(profile: RestaurantOnboardingProfile): string[] {
  return getProofInputChecklist(profile).filter((check) => check.status === "needed").map((check) => check.label);
}

export function getClientSafeProofInputCopy(profile: RestaurantOnboardingProfile): string {
  const missing = getMissingProofInputs(profile);
  if (missing.length === 0) return "Veroxa uses these details to understand what online actions matter most to your restaurant.";
  return `Veroxa uses these details to understand what online actions matter most to your restaurant. Helpful next details: ${missing.join(", ")}.`;
}

export function getTeamProofInputNotes(profile: RestaurantOnboardingProfile): string[] {
  return [
    "Use these inputs later for internal value proof and online-influenced action tracking.",
    `Most wanted action: ${profile.proofInputs.mostWantedAction ?? "not provided"}.`,
    `Current weak points: ${profile.proofInputs.currentWeakPoints.join(", ") || "not provided"}.`,
    "Do not expose break-even math or make ROI/order/profit promises to the client.",
  ];
}

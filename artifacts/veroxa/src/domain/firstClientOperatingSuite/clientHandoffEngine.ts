import type { ClientHandoffPack, FirstClientOperatingSnapshot } from "./types";

export function buildClientHandoffPack(
  snapshot: FirstClientOperatingSnapshot,
): ClientHandoffPack {
  return {
    onboardingChecklist: [
      "Confirm business name, address, phone, website, and ordering path.",
      "Confirm menu link or menu images and top menu items.",
      "Confirm best sellers and any business details before public-facing work.",
      "Collect social profile links if available.",
      "Give the restaurant simple media guidance.",
    ],
    clientSafeWelcomeNoteDraft:
      "Welcome to Veroxa. Veroxa will prepare online presence work for team review, and we may ask you to confirm business details before they are used. Please provide usable food, storefront, and best-seller media when available. Nothing goes live without Veroxa team review.",
    mediaRequestDraft:
      "Please send clear recent photos or short clips of best sellers, storefront/signage, menu highlights, and any seasonal items you want Veroxa to consider. Natural light and uncluttered backgrounds help us prepare better work.",
    firstWeekSetupChecklist: [
      "Review business details and online links.",
      "Review Google/local visibility basics.",
      "Review available media and identify gaps.",
      "Prepare first manual execution pack only after team review.",
      "Draft a simple weekly update if enough context exists.",
    ],
    businessTruthConfirmationChecklist:
      snapshot.onboardingStatus.itemsRequiringConfirmation.length > 0
        ? snapshot.onboardingStatus.itemsRequiringConfirmation
        : ["No immediate business-truth confirmation item in this snapshot."],
    internalTeamSetupChecklist: [
      "Create manual service notes without creating production accounts.",
      "Keep work in review mode until future production systems are approved.",
      "Check package fit and media rhythm before promising posting cadence.",
      "Prepare manual-only copy packs and hold anything needing confirmation.",
    ],
    serviceStartReadinessLabel:
      snapshot.onboardingStatus.status === "complete" && !snapshot.mediaRhythmStatus.shouldSlowPostingDueToMedia
        ? "Ready for manual service start review"
        : "Needs setup before a calm service start",
  };
}

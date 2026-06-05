import type { WeeklyUpdateRecord } from "./types";

export const weeklyUpdateSeedData: WeeklyUpdateRecord[] = [
  {
    id: "weekly-preview-setup",
    clientId: "preview-client",
    weekLabel: "Preview week",
    restaurantName: "Your restaurant",
    completedThisWeek: ["Reviewed setup status", "Prepared request boundaries", "Checked what media and confirmations are still needed"],
    preparedThisWeek: ["Weekly update format", "Media guidance", "Website/Google/Facebook/Instagram access checklist"],
    pendingItems: ["Restaurant details confirmation", "Usable best-seller photos", "Manual Veroxa review"],
    mediaNeeded: ["Clear best-seller food photos", "Storefront or dining-room photo", "Menu/contact photo if useful"],
    clientConfirmationsNeeded: ["Hours/menu/prices if mentioned", "Order/menu/contact links", "Existing offer details only if the restaurant already has one"],
    requestsAnswered: ["Portal requests receive review/answer/next step within 24 hours"],
    nextWeekFocus: ["Finish onboarding details", "Prepare picture-based content only after media is usable", "Keep Google/Maps and website alignment ready for manual review"],
    status: "needs_media",
    clientSafeSummary: "Veroxa is preparing the weekly update rhythm. More usable media and confirmed business details are the next step.",
    createdAt: "2026-06-05T00:00:00.000Z",
  },
];

import type { ClientReadinessAreaInput } from "./types";

export const clientReadinessSeedAreas: ClientReadinessAreaInput[] = [
  { id: "account_activation_state", label: "Account setup", status: "Getting prepared", detail: "Veroxa is preparing the account workspace in preview/manual mode.", nextAction: "Wait for Veroxa review", required: true, weight: 10 },
  { id: "onboarding", label: "Onboarding", status: "Needs your input", detail: "Restaurant details and expectations need review before routine work begins.", nextAction: "Review expectations", required: true, weight: 12 },
  { id: "media_supply", label: "Media supply", status: "Waiting on media", detail: "Usable best-seller and storefront photos are needed for a steady weekly rhythm.", nextAction: "Provide media", required: true, weight: 12 },
  { id: "request_channel", label: "Portal requests", status: "Prepared by Veroxa", detail: "Routine requests are handled in the portal with review/answer/next step within 24 hours.", nextAction: "Use portal requests", required: true, weight: 8 },
  { id: "weekly_updates", label: "Weekly updates", status: "Ready for weekly update", detail: "Weekly update format is ready once Veroxa has work, media, or pending items to summarize.", nextAction: "Send media or confirmations", required: true, weight: 10 },
  { id: "monthly_reports", label: "Monthly report", status: "Ready for monthly report", detail: "Monthly report baseline is prepared after enough manual review signals exist.", nextAction: "Wait for first report baseline", required: true, weight: 10 },
  { id: "website_alignment", label: "Website alignment", status: "Waiting on access", detail: "Veroxa can align basic restaurant info and links if access is provided.", nextAction: "Provide website access or link", required: true, weight: 10 },
  { id: "google_maps_local_visibility", label: "Google/Maps visibility", status: "Waiting on access", detail: "Google Business Profile link or access helps Veroxa prepare local visibility actions.", nextAction: "Provide Google profile link/access", required: true, weight: 10 },
  { id: "facebook_instagram_content", label: "Facebook/Instagram", status: "Waiting on access", detail: "Facebook and Instagram links/access plus usable photos support picture-based content.", nextAction: "Provide Facebook/Instagram access", required: true, weight: 10 },
  { id: "add_ons", label: "Add-ons", status: "Add-on available", detail: "New basic website and missing Facebook/Instagram profile creation are manual add-ons if needed.", nextAction: "Review add-on need", required: false, weight: 4 },
  { id: "missing_confirmations", label: "Confirmations", status: "Needs your input", detail: "Hours, menu, prices if mentioned, links, and existing offer details require confirmation before public copy.", nextAction: "Confirm hours/menu/prices", required: true, weight: 8 },
];

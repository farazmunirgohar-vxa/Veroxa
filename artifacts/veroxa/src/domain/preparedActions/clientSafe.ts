/**
 * Prepared Actions — client-safe translation layer (foundation).
 *
 * Turns internal prepared-action state into calm, plain-language progress the
 * restaurant partner can see — WITHOUT exposing any internal machinery. Clients
 * must never see AI, connectors, APIs, risk scores, action IDs, execution modes,
 * or backend terms. This is the foundation for future client-visible progress;
 * it is intentionally not surfaced heavily in client UI yet.
 */

import type { PreparedAction, PreparedActionChannel } from "./types";

/**
 * What the client should be shown a prepared action is doing for them, in one
 * short reassuring phrase. Never mentions internal mechanics.
 */
export function getClientSafeActionStatus(action: PreparedAction): string {
  switch (action.status) {
    case "needs_client_confirmation":
      return "Veroxa needs a quick confirmation from you.";
    case "approved":
    case "queued_for_execution":
      return "Veroxa is getting this ready to go live.";
    case "executed":
      return "Done — this is live.";
    case "skipped":
    case "archived":
      return "No action needed right now.";
    case "failed":
      return "Veroxa is looking into this.";
    case "prepared":
    case "needs_review":
    case "edited":
    default:
      return "Veroxa is preparing this for you.";
  }
}

const CHANNEL_CLIENT_SUMMARY: Record<PreparedActionChannel, string> = {
  google_business_profile: "Veroxa is preparing a visibility update for your Google profile.",
  social_media: "Veroxa is preparing a social post to bring in more customers.",
  website: "Veroxa needs confirmation before updating your business details.",
  seo: "Veroxa is improving how easily new customers find you.",
  reviews: "Veroxa is preparing a response to a customer review.",
  client_communication: "Veroxa has a quick request to help with your content.",
  reports: "Veroxa is preparing your progress update.",
  internal_task: "Veroxa is working on your growth behind the scenes.",
};

/**
 * A friendly one-line summary of what Veroxa is doing, safe to show the client.
 * For sensitive/business-truth items it leads with the confirmation ask.
 */
export function getClientSafeActionSummary(action: PreparedAction): string {
  if (action.status === "needs_client_confirmation") {
    return "Veroxa needs confirmation before updating your business details.";
  }
  return CHANNEL_CLIENT_SUMMARY[action.channel];
}

/**
 * Whether a prepared action should be visible to the client at all. Internal,
 * skipped, archived, and failed items stay hidden; clients only see things that
 * either need their input or represent real forward progress.
 */
export function shouldShowActionToClient(action: PreparedAction): boolean {
  if (action.executionMode === "internal_only") return false;
  if (action.channel === "internal_task" || action.channel === "seo") return false;
  switch (action.status) {
    case "needs_client_confirmation":
    case "approved":
    case "queued_for_execution":
    case "executed":
      return true;
    default:
      return false;
  }
}

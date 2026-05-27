/**
 * clientPortalReadOnlyTypes.ts — M008
 *
 * UI-safe, normalized data shapes for the Client Portal.
 *
 * Rules:
 *   - These types describe what the UI is allowed to render.
 *   - They must NOT include internal-only fields:
 *       internal_note, raw rejection_reason, staff quality notes,
 *       owner/operator private notes, audit fields, raw activity-log
 *       JSON, performed_by_user_id, old/new value JSON,
 *       internal database policy details, RLS error details.
 *   - When in doubt, omit the field. A safer, smaller payload is
 *     always preferred over leaking server detail to the browser.
 */

export type ClientPortalSectionStatus =
  | "live"        // section came back from Supabase with real data
  | "fallback"    // attempted read, fell back to fixtures (RLS/empty/error)
  | "fixture"     // fixture mode — never attempted
  | "skipped";    // intentionally not implemented yet (no client-safe view)

export interface ClientPortalDataSourceStatus {
  /** Coarse-grained source for the whole portal. */
  source: "supabase_readonly" | "supabase" | "fallback" | "fixture" | "demo";
  /** Human-friendly one-liner shown on internal data-source badges. */
  message: string;
  /** True iff at least one section returned real Supabase rows. */
  isReadOnlyLive: boolean;
  /** Populated when the portal fell back to fixtures. */
  fallbackReason: string | null;
}

export interface ClientPortalSummary {
  clientId: string;
  businessName: string;
  platformsCount: number;
  mediaAssetsCount: number;
  postsCount: number;
  weeklyReportsCount: number;
  monthlyReportsCount: number;
  latestReportStatus: string;
}

export interface ClientPortalMediaItem {
  id: string;
  title: string;
  /** Public/preview URL only. Never a signed staff URL. */
  imageUrl: string | null;
  uploadedAt: string | null;          // ISO date
  clientFriendlyStatus: string;       // "Approved" | "Scheduled" | "Pending review" | …
  statusTone: "good" | "ready" | "warn" | "neutral";
  /** Light, UI-safe suggestion. May be empty. Never staff quality notes. */
  suggestion: string | null;
}

export interface ClientPortalCalendarItem {
  id: string;
  day: string;                         // "Friday"
  time: string;                        // "11:30 AM"
  scheduledFor: string | null;         // ISO timestamp
  platform: string;
  /** Short caption preview only — full text intentionally trimmed. */
  captionPreview: string | null;
  status: "Scheduled" | "In Review" | "Posted" | string;
  /** Preview image URL if the view safely exposes one. */
  imageUrl: string | null;
}

export interface ClientPortalReportPreview {
  id: string;
  period: string;                      // "Week 3 — May 19–25" / "May 2026"
  status: string;                      // "Available" | "In progress" | …
  publishedAt: string | null;
  /** Short, sanitized summary. No internal validation notes. */
  summary: string | null;
}

export interface ClientPortalUpdateItem {
  id: string;
  week: string;
  summary: string;
  postsPublished: number | null;
  estimatedReach: string | null;
  status: string;
}

export interface ClientPortalRequestItem {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string | null;
  createdAt: string | null;
}

export interface ClientPortalGoogleSnapshot {
  views: number | null;
  searches: number | null;
  calls: number | null;
  websiteClicks: number | null;
  directionRequests: number | null;
  /** Human period label, e.g. "Last 30 days". */
  periodLabel: string;
}

export interface ClientPortalAccountProfile {
  clientId: string;
  businessName: string;
  /** Plan name only (no monthly_fee_cents). */
  planName: string | null;
  /** Public-facing status, never the internal `risk_status` enum. */
  publicStatus: string | null;
}

/** Envelope all read-only adapter functions return. */
export type ReadOnlyEnvelope<T> =
  | { status: "live";     data: T;    error: null }
  | { status: "fallback"; data: null; error: string }
  | { status: "skipped";  data: null; error: string };

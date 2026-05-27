/**
 * clientPortalTransforms.ts — M008
 *
 * Maps loosely-typed Supabase view rows into UI-safe Client Portal
 * objects. Every function in this file is pure and defensive:
 *
 *   - Reads only well-known columns from `client_portal_*` views.
 *   - Coerces missing/null fields to safe defaults.
 *   - Strips fields the client should never see (internal_note,
 *     rejection_reason, performed_by_user_id, raw activity JSON, etc.)
 *   - Never throws.
 *
 * If you ever need a field that doesn't exist on the client_portal_*
 * view, extend the VIEW — not this file. See PORTAL_QUERY_SAFETY_PLAN.md.
 */

import type {
  ClientPortalMediaItem,
  ClientPortalCalendarItem,
  ClientPortalReportPreview,
  ClientPortalRequestItem,
  ClientPortalSummary,
  ClientPortalAccountProfile,
} from "./clientPortalReadOnlyTypes";

type Row = Record<string, unknown>;

// ── Small helpers ─────────────────────────────────────────────────────────────

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : v == null ? fallback : String(v);

const strOrNull = (v: unknown): string | null =>
  typeof v === "string" && v.length > 0 ? v : null;

const num = (v: unknown, fallback = 0): number => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
};

const numOrNull = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.length > 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const truncate = (v: unknown, max = 140): string | null => {
  const s = strOrNull(v);
  if (!s) return null;
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

// ── Media ─────────────────────────────────────────────────────────────────────

const REVIEW_STATUS_LABELS: Record<string, { label: string; tone: ClientPortalMediaItem["statusTone"] }> = {
  approved:   { label: "Approved",       tone: "good"    },
  scheduled:  { label: "Scheduled",      tone: "ready"   },
  in_review:  { label: "Pending review", tone: "warn"    },
  rejected:   { label: "Needs another",  tone: "warn"    },
  draft:      { label: "Draft",          tone: "neutral" },
};

export function transformMediaItem(row: Row, index = 0): ClientPortalMediaItem {
  const reviewStatusRaw = str(row.review_status ?? row.status, "").toLowerCase();
  const mapped = REVIEW_STATUS_LABELS[reviewStatusRaw] ?? { label: "Submitted", tone: "neutral" as const };

  return {
    id: str(row.id ?? row.media_id ?? `media-${index}`),
    title: str(row.title ?? row.file_name ?? "Untitled photo", "Untitled photo"),
    imageUrl: strOrNull(row.public_url ?? row.preview_url ?? row.file_url),
    uploadedAt: strOrNull(row.uploaded_at ?? row.created_at),
    clientFriendlyStatus: mapped.label,
    statusTone: mapped.tone,
    suggestion: truncate(row.suggested_use ?? null, 120),
  };
}

export function transformMediaList(rows: unknown): ClientPortalMediaItem[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r, i) => transformMediaItem((r ?? {}) as Row, i));
}

// ── Calendar ──────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatDay(iso: string | null): string {
  if (!iso) return "Unscheduled";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unscheduled";
  return DAY_NAMES[d.getDay()] ?? "Unscheduled";
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function transformCalendarItem(row: Row, index = 0): ClientPortalCalendarItem {
  const scheduledFor = strOrNull(row.scheduled_for ?? row.scheduled_at);
  const statusRaw = str(row.post_status ?? row.status, "scheduled").toLowerCase();
  const statusLabel =
    statusRaw === "published" ? "Posted" :
    statusRaw === "in_review" ? "In Review" :
    "Scheduled";

  return {
    id: str(row.id ?? row.post_id ?? `cal-${index}`),
    day: formatDay(scheduledFor),
    time: formatTime(scheduledFor),
    scheduledFor,
    platform: str(row.platform ?? row.platform_name, "Instagram"),
    captionPreview: truncate(row.caption_preview ?? null, 100),
    status: statusLabel,
    imageUrl: strOrNull(row.preview_url ?? row.media_url),
  };
}

export function transformCalendarList(rows: unknown): ClientPortalCalendarItem[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r, i) => transformCalendarItem((r ?? {}) as Row, i));
}

// ── Reports ───────────────────────────────────────────────────────────────────

export function transformWeeklyReport(row: Row, index = 0): ClientPortalReportPreview {
  const weekStart = strOrNull(row.week_start);
  const weekEnd = strOrNull(row.week_end);
  let period = "Weekly report";
  if (weekStart) {
    period = weekEnd ? `Week of ${weekStart} – ${weekEnd}` : `Week of ${weekStart}`;
  }
  return {
    id: str(row.id ?? `wr-${index}`),
    period,
    status: str(row.status ?? "Published", "Published"),
    publishedAt: strOrNull(row.published_at ?? row.created_at),
    summary: truncate(row.client_safe_summary, 240),
  };
}

export function transformMonthlyReport(row: Row, index = 0): ClientPortalReportPreview {
  const monthKey = str(row.month_key, "");
  return {
    id: str(row.id ?? `mr-${index}`),
    period: monthKey ? `Month ${monthKey}` : "Monthly report",
    status: str(row.status ?? "Published", "Published"),
    publishedAt: strOrNull(row.published_at ?? row.created_at),
    summary: truncate(row.client_safe_summary, 280),
  };
}

export function transformReportList(
  rows: unknown,
  kind: "weekly" | "monthly"
): ClientPortalReportPreview[] {
  if (!Array.isArray(rows)) return [];
  const tx = kind === "weekly" ? transformWeeklyReport : transformMonthlyReport;
  return rows.map((r, i) => tx((r ?? {}) as Row, i));
}

// ── Requests ──────────────────────────────────────────────────────────────────

export function transformRequest(row: Row, index = 0): ClientPortalRequestItem {
  return {
    id: str(row.id ?? row.request_id ?? `req-${index}`),
    title: str(row.title ?? "Request", "Request"),
    type: str(row.request_type ?? row.type ?? "general", "general"),
    status: str(row.status ?? "Open", "Open"),
    priority: strOrNull(row.priority),
    createdAt: strOrNull(row.created_at),
  };
}

export function transformRequestList(rows: unknown): ClientPortalRequestItem[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r, i) => transformRequest((r ?? {}) as Row, i));
}

// ── Summary & account ────────────────────────────────────────────────────────

export function transformSummary(row: Row | null | undefined, counts: {
  platformsCount: number;
  mediaAssetsCount: number;
  postsCount: number;
  weeklyReportsCount: number;
  monthlyReportsCount: number;
  latestReportStatus: string;
}): ClientPortalSummary {
  const r = (row ?? {}) as Row;
  return {
    clientId: str(r.client_id ?? r.id ?? "demo-a", "demo-a"),
    businessName: str(r.business_name ?? "Demo Grill House", "Demo Grill House"),
    ...counts,
  };
}

export function transformAccountProfile(row: Row | null | undefined): ClientPortalAccountProfile {
  const r = (row ?? {}) as Row;
  return {
    clientId: str(r.client_id ?? r.id ?? "demo-a", "demo-a"),
    businessName: str(r.business_name ?? "Demo Grill House", "Demo Grill House"),
    planName: strOrNull(r.plan_name),
    publicStatus: strOrNull(r.public_status ?? r.status),
  };
}

export const PortalTransforms = {
  numOrNull,
};

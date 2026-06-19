import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isConfirmedProfileFieldStatus,
  summarizeUnconfirmedBusinessTruthFields,
} from "@/lib/momoReadiness/businessTruthStatus";

export const MOMO_READINESS_STATUSES = [
  "ready",
  "not_ready",
  "blocked",
  "needs_review",
  "needs_owner_confirmation",
  "not_configured",
  "future_pr_required",
] as const;
export const MOMO_READINESS_SEVERITIES = [
  "critical",
  "warning",
  "info",
] as const;
export type MomoReadinessStatus = (typeof MOMO_READINESS_STATUSES)[number];
export type MomoReadinessSeverity = (typeof MOMO_READINESS_SEVERITIES)[number];

export interface MomoReadinessItem {
  id: string;
  category: string;
  title: string;
  status: MomoReadinessStatus;
  severity: MomoReadinessSeverity;
  description: string;
  evidence: string;
  action_hint: string;
  route_href?: string;
}

export interface MomoReadinessSummary {
  overall_status: MomoReadinessStatus;
  ready_count: number;
  blocker_count: number;
  owner_confirmation_count: number;
  review_count: number;
  total_count: number;
}

export interface MomoLivePilotReadiness {
  summary: MomoReadinessSummary;
  checklist: MomoReadinessItem[];
  blockers: MomoReadinessItem[];
}

type Row = Record<string, any>;
const MOMO_NAME_PATTERN = "%Momo%";

async function maybeRowsForRestaurant(
  client: SupabaseClient,
  table: string,
  restaurantId: string,
  select = "*",
  limit = 25,
): Promise<Row[]> {
  const { data, error } = await client
    .from(table)
    .select(select)
    .eq("restaurant_id", restaurantId)
    .limit(limit);
  if (error) return [];
  return (data ?? []) as Row[];
}

async function findMomoRestaurant(client: SupabaseClient): Promise<Row | null> {
  const { data, error } = await client
    .from("restaurants")
    .select("*")
    .ilike("name", MOMO_NAME_PATTERN)
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return (data as Row | null) ?? null;
}

function item(input: MomoReadinessItem): MomoReadinessItem {
  return input;
}

export async function getMomoReadinessChecklist(
  client: SupabaseClient,
): Promise<MomoReadinessItem[]> {
  const restaurant = await findMomoRestaurant(client);
  const restaurantId = restaurant?.id as string | undefined;
  const [
    profileFields,
    media,
    messages,
    corrections,
    activity,
    drafts,
    reports,
    approvals,
  ] = await Promise.all([
    restaurantId
      ? maybeRowsForRestaurant(
          client,
          "restaurant_profile_fields",
          restaurantId,
          "id,restaurant_id,section,label,value,status,created_at",
          50,
        )
      : Promise.resolve([]),
    restaurantId
      ? maybeRowsForRestaurant(
          client,
          "media_assets",
          restaurantId,
          "id,status,restaurant_id,created_at",
          50,
        )
      : Promise.resolve([]),
    restaurantId
      ? maybeRowsForRestaurant(
          client,
          "messages",
          restaurantId,
          "id,status,restaurant_id,created_at",
          50,
        )
      : Promise.resolve([]),
    restaurantId
      ? maybeRowsForRestaurant(
          client,
          "profile_corrections",
          restaurantId,
          "id,status,restaurant_id,field_id,field_label,created_at",
          50,
        )
      : Promise.resolve([]),
    restaurantId
      ? maybeRowsForRestaurant(
          client,
          "activity_log",
          restaurantId,
          "id,restaurant_id,report_eligible,visibility,created_at",
          50,
        )
      : Promise.resolve([]),
    restaurantId
      ? maybeRowsForRestaurant(
          client,
          "ai_drafts",
          restaurantId,
          "id,status,restaurant_id,safety_flags,created_at",
          50,
        )
      : Promise.resolve([]),
    restaurantId
      ? maybeRowsForRestaurant(
          client,
          "reports",
          restaurantId,
          "id,status,restaurant_id,created_at",
          50,
        )
      : Promise.resolve([]),
    restaurantId
      ? maybeRowsForRestaurant(
          client,
          "approvals",
          restaurantId,
          "id,status,restaurant_id,created_at",
          50,
        )
      : Promise.resolve([]),
  ]);
  const truthSummary = summarizeUnconfirmedBusinessTruthFields(profileFields);
  const confirmedProfileFields = profileFields.filter(
    (field) =>
      isConfirmedProfileFieldStatus(field.status) &&
      String(field.value ?? "").trim().length > 0,
  );
  const hasTruth = Boolean(
    restaurant?.address &&
    restaurant?.phone &&
    (restaurant?.timezone || confirmedProfileFields.length),
  );
  const pendingTruth = corrections.filter((r) =>
    ["requested", "under_veroxa_review", "needs_owner_input"].includes(
      String(r.status),
    ),
  );
  const needsTruthReview = truthSummary.reviewRequired.length > 0;
  return [
    item({
      id: "restaurant-record",
      category: "Restaurant Identity",
      title: "Momo’s House restaurant record",
      status: restaurant ? "ready" : "blocked",
      severity: restaurant ? "info" : "critical",
      description:
        "Checks whether a Momo’s House restaurant record exists before any controlled pilot decision.",
      evidence: restaurant
        ? `Found restaurant record ${restaurant.id}.`
        : "No Momo’s House restaurant record was found.",
      action_hint: restaurant
        ? "Review identity fields before any later activation consideration."
        : "Create or confirm the real restaurant record in an approved future setup step.",
      route_href: "/team/profile-corrections",
    }),
    item({
      id: "business-truth",
      category: "Restaurant Identity",
      title: "Business-truth fields",
      status:
        !hasTruth || needsTruthReview
          ? "needs_owner_confirmation"
          : "needs_review",
      severity: !hasTruth || needsTruthReview ? "critical" : "warning",
      description:
        "Name, address, phone, hours, menu, and brand identity must be confirmed before public use.",
      evidence: hasTruth
        ? truthSummary.evidenceText
        : `Required business-truth fields are not confirmed or not readable. ${truthSummary.evidenceText}`,
      action_hint: "Business-truth changes still require owner confirmation.",
      route_href: "/team/profile-corrections",
    }),
    item({
      id: "client-access",
      category: "Client Access Readiness",
      title: "Access boundary",
      status: "not_configured",
      severity: "warning",
      description:
        "Real auth is not activated by this PR and roles remain client/team only.",
      evidence:
        "/api/pilot-access remains the placeholder access path until explicit activation approval.",
      action_hint:
        "Keep access review internal; do not create live Momo credentials here.",
    }),
    item({
      id: "media",
      category: "Media Readiness",
      title: "Media foundation and assets",
      status: media.length ? "needs_review" : "not_ready",
      severity: media.length ? "warning" : "critical",
      description:
        "Media upload/storage foundation can be checked for existing Momo assets only.",
      evidence: `${media.length} Momo media asset record(s) found for review scope.`,
      action_hint: media.length
        ? "Review media status in the upload inbox; do not post automatically."
        : "Request usable media only through an approved future client flow.",
      route_href: "/team/upload-inbox",
    }),
    item({
      id: "messages",
      category: "Messaging Readiness",
      title: "Portal message foundation",
      status: "needs_review",
      severity: "info",
      description:
        "Messages are portal-only and never SMS, email, DM, or external outreach.",
      evidence: `${messages.length} Momo message record(s) found for review scope.`,
      action_hint:
        "Review portal thread readiness only; do not send external messages.",
      route_href: "/team/messages",
    }),
    item({
      id: "profile-corrections",
      category: "Profile Corrections Readiness",
      title: "Profile correction queue",
      status: pendingTruth.length ? "needs_owner_confirmation" : "needs_review",
      severity: pendingTruth.length ? "critical" : "info",
      description:
        "Pending business-truth corrections require owner confirmation and Team approval.",
      evidence: `${pendingTruth.length} Momo pending correction(s) found; no platform update is implied.`,
      action_hint:
        "Resolve confirmation requirements before any controlled activation consideration.",
      route_href: "/team/profile-corrections",
    }),
    item({
      id: "activity-log",
      category: "Activity Log Readiness",
      title: "Activity memory",
      status: activity.length ? "needs_review" : "not_ready",
      severity: activity.length ? "info" : "warning",
      description:
        "Activity Log is a real work-history layer and is not report generation by itself.",
      evidence: `${activity.length} Momo activity record(s) found for review scope.`,
      action_hint: "Use only real Veroxa activity as future report input.",
      route_href: "/team/activity-log",
    }),
    item({
      id: "ai-drafts",
      category: "AI Draft Readiness",
      title: "Internal draft preparation",
      status: drafts.length ? "needs_review" : "not_configured",
      severity: "warning",
      description:
        "AI drafts are internal-only with no raw client visibility and no auto-approval.",
      evidence: `${drafts.length} Momo AI draft record(s) found for review scope.`,
      action_hint: "Review drafts internally before any customer-visible use.",
      route_href: "/team/ai-drafts",
    }),
    item({
      id: "control-center",
      category: "Team Control Center Readiness",
      title: "Internal control surface",
      status: "ready",
      severity: "info",
      description:
        "Team Control Center foundation exists as Team-only/internal-only review surface.",
      evidence:
        "Existing /team/control-center route is the internal queue summary.",
      action_hint: "Use existing Team pages for review only.",
      route_href: "/team/control-center",
    }),
    item({
      id: "reports",
      category: "Reports From Activity Readiness",
      title: "Report foundation",
      status: reports.length ? "needs_review" : "not_configured",
      severity: "warning",
      description:
        "Reports must be based on real Veroxa activity only, with no external analytics or invented metrics.",
      evidence: `${reports.length} Momo report record(s) and ${approvals.length} Momo approval record(s) found for review scope.`,
      action_hint:
        "Client-visible reports require review and portal-only publication.",
      route_href: "/team/reports-from-activity",
    }),
    item({
      id: "activation-boundary",
      category: "Activation Boundaries",
      title: "Post-PR111 activation boundary",
      status: "needs_review",
      severity: "warning",
      description:
        "PR #109 readiness gate, PR #110 readiness alignment, and PR #111 Controlled Momo Pilot Activation Gate are already merged; no next activation PR is approved by default.",
      evidence:
        "Future real-world activation, real-auth activation, external platform setup, or Momo owner walkthrough requires separate explicit Faraz approval.",
      action_hint: "Keep Momo owner walkthrough blocked until Faraz approval.",
    }),
  ];
}

export async function getMomoReadinessBlockers(
  client: SupabaseClient,
): Promise<MomoReadinessItem[]> {
  const checklist = await getMomoReadinessChecklist(client);
  return checklist.filter(
    (entry) =>
      entry.severity === "critical" ||
      ["blocked", "needs_owner_confirmation", "future_pr_required"].includes(
        entry.status,
      ),
  );
}

export function getMomoReadinessSummary(
  checklist: MomoReadinessItem[],
): MomoReadinessSummary {
  const blocker_count = checklist.filter(
    (entry) => entry.status === "blocked" || entry.severity === "critical",
  ).length;
  const owner_confirmation_count = checklist.filter(
    (entry) => entry.status === "needs_owner_confirmation",
  ).length;
  const review_count = checklist.filter(
    (entry) => entry.status === "needs_review",
  ).length;
  return {
    overall_status: blocker_count
      ? "blocked"
      : review_count || owner_confirmation_count
        ? "needs_review"
        : "ready",
    ready_count: checklist.filter((entry) => entry.status === "ready").length,
    blocker_count,
    owner_confirmation_count,
    review_count,
    total_count: checklist.length,
  };
}

export async function getMomoLivePilotReadiness(
  client: SupabaseClient,
): Promise<MomoLivePilotReadiness> {
  const checklist = await getMomoReadinessChecklist(client);
  return {
    checklist,
    blockers: checklist.filter(
      (entry) =>
        entry.severity === "critical" ||
        ["blocked", "needs_owner_confirmation", "future_pr_required"].includes(
          entry.status,
        ),
    ),
    summary: getMomoReadinessSummary(checklist),
  };
}

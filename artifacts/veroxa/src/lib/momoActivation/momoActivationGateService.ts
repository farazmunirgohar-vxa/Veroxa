import type { SupabaseClient } from "@supabase/supabase-js";
import { getMomoLivePilotReadiness } from "@/lib/momoReadiness/momoReadinessService";
import { summarizeUnconfirmedBusinessTruthFields } from "@/lib/momoReadiness/businessTruthStatus";

export const MOMO_ACTIVATION_GATE_STATUSES = [
  "blocked",
  "not_allowed",
  "needs_review",
  "needs_owner_confirmation",
  "needs_manual_setup",
  "ready_for_faraz_decision",
  "future_step_required",
] as const;
export const MOMO_ACTIVATION_GATE_SEVERITIES = [
  "critical",
  "warning",
  "info",
] as const;
export type MomoActivationGateStatus =
  (typeof MOMO_ACTIVATION_GATE_STATUSES)[number];
export type MomoActivationGateSeverity =
  (typeof MOMO_ACTIVATION_GATE_SEVERITIES)[number];

export interface MomoActivationGateItem {
  id: string;
  category: string;
  title: string;
  status: MomoActivationGateStatus;
  severity: MomoActivationGateSeverity;
  description: string;
  evidence: string;
  action_hint: string;
  route_href?: string;
}

export interface MomoActivationDecisionSummary {
  overall_status: MomoActivationGateStatus;
  blocker_count: number;
  owner_confirmation_count: number;
  manual_setup_count: number;
  future_step_count: number;
  faraz_decision_count: number;
  total_count: number;
  decision_text: string;
}

export interface MomoActivationGate {
  summary: MomoActivationDecisionSummary;
  checklist: MomoActivationGateItem[];
  blockers: MomoActivationGateItem[];
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

const activationItem = (
  input: MomoActivationGateItem,
): MomoActivationGateItem => input;

export async function getMomoActivationChecklist(
  client: SupabaseClient,
): Promise<MomoActivationGateItem[]> {
  const [readiness, restaurant] = await Promise.all([
    getMomoLivePilotReadiness(client),
    findMomoRestaurant(client),
  ]);
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
          75,
        )
      : Promise.resolve([]),
    restaurantId
      ? maybeRowsForRestaurant(
          client,
          "media_assets",
          restaurantId,
          "id,status,restaurant_id,created_at",
          75,
        )
      : Promise.resolve([]),
    restaurantId
      ? maybeRowsForRestaurant(
          client,
          "messages",
          restaurantId,
          "id,status,restaurant_id,created_at",
          75,
        )
      : Promise.resolve([]),
    restaurantId
      ? maybeRowsForRestaurant(
          client,
          "profile_corrections",
          restaurantId,
          "id,status,restaurant_id,field_id,field_label,created_at",
          75,
        )
      : Promise.resolve([]),
    restaurantId
      ? maybeRowsForRestaurant(
          client,
          "activity_log",
          restaurantId,
          "id,restaurant_id,report_eligible,visibility,created_at",
          75,
        )
      : Promise.resolve([]),
    restaurantId
      ? maybeRowsForRestaurant(
          client,
          "ai_drafts",
          restaurantId,
          "id,status,restaurant_id,safety_flags,created_at",
          75,
        )
      : Promise.resolve([]),
    restaurantId
      ? maybeRowsForRestaurant(
          client,
          "reports",
          restaurantId,
          "id,status,restaurant_id,created_at",
          75,
        )
      : Promise.resolve([]),
    restaurantId
      ? maybeRowsForRestaurant(
          client,
          "approvals",
          restaurantId,
          "id,status,restaurant_id,created_at",
          75,
        )
      : Promise.resolve([]),
  ]);
  const pendingTruth = corrections.filter((r) =>
    ["requested", "under_veroxa_review", "needs_owner_input"].includes(
      String(r.status),
    ),
  );
  const truthSummary = summarizeUnconfirmedBusinessTruthFields(profileFields);
  const unconfirmedFields = truthSummary.reviewRequired;
  const criticalReadinessBlockers = readiness.blockers.filter(
    (entry) =>
      entry.severity === "critical" ||
      ["blocked", "needs_owner_confirmation"].includes(entry.status),
  );
  const readinessBlockers = criticalReadinessBlockers.length;
  const hasCurrentReadinessBlocker =
    readiness.summary.overall_status === "blocked" || readinessBlockers > 0;
  const hasUnconfirmedBusinessTruth = unconfirmedFields.length > 0;
  const hasCriticalGateBlocker =
    pendingTruth.length > 0 || hasUnconfirmedBusinessTruth;
  const readyForDecision =
    Boolean(restaurant) &&
    !hasCurrentReadinessBlocker &&
    pendingTruth.length === 0 &&
    !hasUnconfirmedBusinessTruth &&
    !hasCriticalGateBlocker;

  return [
    activationItem({
      id: "readiness-foundation",
      category: "Readiness Foundation",
      title: "PR #109 and PR #110 readiness foundation",
      status: readinessBlockers ? "needs_review" : "ready_for_faraz_decision",
      severity: readinessBlockers ? "warning" : "info",
      description:
        "PR #109 readiness gate and PR #110 readiness alignment are treated as merged evidence for this internal decision gate.",
      evidence: `Readiness checklist returned ${readiness.summary.total_count} item(s) and ${readinessBlockers} blocker(s).`,
      action_hint:
        "Review the existing readiness page before any later setup step.",
      route_href: "/team/momo-live-readiness",
    }),
    activationItem({
      id: "business-truth-confirmation",
      category: "Business Truth Confirmation",
      title: "Business-truth confirmation",
      status:
        pendingTruth.length || unconfirmedFields.length
          ? "needs_owner_confirmation"
          : "needs_review",
      severity:
        pendingTruth.length || unconfirmedFields.length
          ? "critical"
          : "warning",
      description:
        "Business name, address, phone, hours, menu, links, profile fields, and sensitive claims require confirmation before public use.",
      evidence: `${pendingTruth.length} pending correction(s). ${truthSummary.evidenceText}`,
      action_hint:
        "Resolve owner-confirmation items before any future real-world setup.",
      route_href: "/team/profile-corrections",
    }),
    activationItem({
      id: "access-boundary",
      category: "Access Boundary",
      title: "Access and auth boundary",
      status: "not_allowed",
      severity: "critical",
      description:
        "AUTH_MODE remains placeholder, /api/pilot-access remains active, roles remain client/team, and this PR does not turn on real auth.",
      evidence:
        "Activation gate itself requires real auth and its feature flag, so placeholder mode cannot present a live decision as active.",
      action_hint:
        "Keep access in review; future real-auth activation needs separate explicit approval.",
    }),
    activationItem({
      id: "client-portal-boundary",
      category: "Client Portal Boundary",
      title: "Client-facing review boundary",
      status: "needs_review",
      severity: "warning",
      description:
        "Reports, messages, media, profile surfaces, and draft-derived content stay review-gated with no raw AI output shown to the client.",
      evidence: `${reports.length} report record(s), ${messages.length} message record(s), ${media.length} media record(s), and ${drafts.length} draft record(s) found for read-only review.`,
      action_hint:
        "Use existing Team routes for review; do not push draft content automatically.",
      route_href: "/team/reports-from-activity",
    }),
    activationItem({
      id: "team-control-boundary",
      category: "Team Control Boundary",
      title: "Team-only decision surface",
      status: "ready_for_faraz_decision",
      severity: "info",
      description:
        "The Team Control Center exists and this activation gate remains internal Team-only with Faraz decision required.",
      evidence:
        "Existing /team/control-center route is available; this route adds no activation action.",
      action_hint:
        "Faraz reviews and decides whether a later manual/setup action should be approved.",
      route_href: "/team/control-center",
    }),
    activationItem({
      id: "external-platform-boundary",
      category: "External Platform Boundary",
      title: "External platforms remain disconnected",
      status: "future_step_required",
      severity: "critical",
      description:
        "Google, Meta, Yelp, TikTok, and delivery platform integrations are not connected by this PR.",
      evidence:
        "No token handling, platform connection, or external call is part of this read-only gate.",
      action_hint:
        "Any future platform setup requires separate explicit approval and setup.",
    }),
    activationItem({
      id: "publishing-boundary",
      category: "Publishing Boundary",
      title: "No external publishing",
      status: "not_allowed",
      severity: "critical",
      description:
        "Nothing posts externally and no Google, Meta, Instagram, Facebook, TikTok, Yelp, website, or delivery-platform update is performed.",
      evidence: `${approvals.length} approval record(s) were read only as evidence; no approval is executed here.`,
      action_hint:
        "Keep prepared work in Team review until a later approved execution path exists.",
    }),
    activationItem({
      id: "report-boundary",
      category: "Report Boundary",
      title: "Reports stay portal-only",
      status: "needs_review",
      severity: "warning",
      description:
        "Reports are portal-only and based on Veroxa activity, with no invented metrics or external analytics.",
      evidence: `${activity.length} activity record(s) and ${reports.length} report record(s) found for read-only review.`,
      action_hint: "Review report evidence in the reports-from-activity page.",
      route_href: "/team/activity-log",
    }),
    activationItem({
      id: "final-decision",
      category: "Final Decision",
      title: "Final Faraz decision required",
      status: readyForDecision ? "ready_for_faraz_decision" : "blocked",
      severity: readyForDecision ? "info" : "critical",
      description:
        "Even if ready for Faraz decision, this gate does not activate anything; human decision and later manual/setup action are required.",
      evidence: readyForDecision
        ? `No critical readiness blocker, pending correction, or unconfirmed business-truth field was returned by the read-only evidence check. ${truthSummary.evidenceText}`
        : `The gate remains blocked or needs confirmation based on current evidence. ${truthSummary.evidenceText}`,
      action_hint:
        "Momo owner walkthrough remains blocked until Faraz explicitly approves a later step.",
    }),
  ];
}

export async function getMomoActivationBlockers(
  client: SupabaseClient,
): Promise<MomoActivationGateItem[]> {
  const checklist = await getMomoActivationChecklist(client);
  return checklist.filter(
    (entry) =>
      entry.severity === "critical" ||
      [
        "blocked",
        "not_allowed",
        "needs_owner_confirmation",
        "needs_manual_setup",
        "future_step_required",
      ].includes(entry.status),
  );
}

export function getMomoActivationDecisionSummary(
  checklist: MomoActivationGateItem[],
): MomoActivationDecisionSummary {
  const blocker_count = checklist.filter(
    (entry) =>
      entry.status === "blocked" ||
      entry.status === "not_allowed" ||
      entry.severity === "critical",
  ).length;
  const owner_confirmation_count = checklist.filter(
    (entry) => entry.status === "needs_owner_confirmation",
  ).length;
  const manual_setup_count = checklist.filter(
    (entry) => entry.status === "needs_manual_setup",
  ).length;
  const future_step_count = checklist.filter(
    (entry) => entry.status === "future_step_required",
  ).length;
  const faraz_decision_count = checklist.filter(
    (entry) => entry.status === "ready_for_faraz_decision",
  ).length;
  const overall_status: MomoActivationGateStatus = blocker_count
    ? "blocked"
    : owner_confirmation_count
      ? "needs_owner_confirmation"
      : manual_setup_count
        ? "needs_manual_setup"
        : faraz_decision_count
          ? "ready_for_faraz_decision"
          : "needs_review";
  return {
    overall_status,
    blocker_count,
    owner_confirmation_count,
    manual_setup_count,
    future_step_count,
    faraz_decision_count,
    total_count: checklist.length,
    decision_text:
      overall_status === "ready_for_faraz_decision"
        ? "Ready for Faraz decision only; no pilot activation is performed."
        : "Activation is blocked or still requires review, owner confirmation, future setup, or manual decision.",
  };
}

export async function getMomoActivationGate(
  client: SupabaseClient,
): Promise<MomoActivationGate> {
  const checklist = await getMomoActivationChecklist(client);
  return {
    checklist,
    blockers: checklist.filter(
      (entry) =>
        entry.severity === "critical" ||
        [
          "blocked",
          "not_allowed",
          "needs_owner_confirmation",
          "needs_manual_setup",
          "future_step_required",
        ].includes(entry.status),
    ),
    summary: getMomoActivationDecisionSummary(checklist),
  };
}

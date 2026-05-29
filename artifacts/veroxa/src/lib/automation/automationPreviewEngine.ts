/**
 * automationPreviewEngine.ts — rule-based automation PREVIEW generator.
 *
 * SIMULATED ONLY. Every function is a pure transformation over existing
 * fixture/work-item shapes. No real external actions, no writes, no
 * notifications, no publishing, no client auto-messaging. The output describes
 * what Veroxa WOULD prepare and what a human must still approve.
 */

import type { TeamWorkItem } from "@/lib/repositories/clientTeamWorkRepository";
import type {
  AutomationPreview,
  AutomationSnapshot,
  AutomationTrigger,
} from "./automationTypes";

const FUTURE_INTEGRATIONS = {
  storage: "File storage (uploads) — future",
  publishing: "Google/Meta publishing APIs — future",
  notifications: "Email/SMS/WhatsApp notifications — future",
  supabase: "Supabase tables + write paths — future",
  calendar: "Calendar/reminder workflows — future",
} as const;

/**
 * The static catalog of automation previews Veroxa supports. Each entry shows
 * the trigger, condition, what would be prepared, approval gate, blocked
 * reason (if any), and the future integration that real execution would need.
 */
export function automationCatalog(): AutomationPreview[] {
  return [
    {
      automationName: "Prepare media review",
      trigger: "media_uploaded",
      condition: "A client uploads new media.",
      preparedAction:
        "AI media review is prepared (quality label, angle, recommended usage).",
      destination: "team_queue",
      approvalRequired: true,
      status: "prepared",
      auditTrailNote:
        "Preview only — no media is published or moved. Team reviews the result.",
    },
    {
      automationName: "Prepare client clarification task",
      trigger: "media_needs_context",
      condition: "Media lacks the context needed to caption it.",
      preparedAction:
        "A clarification task is prepared with a suggested question for the team to send.",
      destination: "team_queue",
      approvalRequired: true,
      status: "awaiting_approval",
      blockedReason: "Needs client context before drafting can continue.",
      futureIntegration: FUTURE_INTEGRATIONS.notifications,
      auditTrailNote:
        "Preview only — no message is sent automatically. Team sends after review.",
    },
    {
      automationName: "Prepare caption draft task",
      trigger: "content_angle_ready",
      condition: "A content angle has been prepared and reviewed.",
      preparedAction:
        "A caption-draft task is prepared (2–3 short drafts, claim-risk checked).",
      destination: "team_queue",
      approvalRequired: true,
      status: "prepared",
      auditTrailNote:
        "Preview only — captions are drafts. No specials or claims are invented.",
    },
    {
      automationName: "Prepare scheduling suggestion",
      trigger: "caption_approved",
      condition: "A caption has been approved by the team.",
      preparedAction:
        "A scheduling suggestion is prepared (recommended window, content type).",
      destination: "scheduling_prep",
      approvalRequired: true,
      status: "awaiting_approval",
      futureIntegration: FUTURE_INTEGRATIONS.publishing,
      auditTrailNote:
        "Preview only — nothing is posted. Publishing requires future integration.",
    },
    {
      automationName: "Prepare weekly update draft",
      trigger: "weekly_cycle_due",
      condition: "The weekly reporting cycle is due.",
      preparedAction:
        "A weekly update draft is prepared from completed work for team review.",
      destination: "report_queue",
      approvalRequired: true,
      status: "prepared",
      auditTrailNote:
        "Preview only — draft is not client-visible until the team verifies it.",
    },
    {
      automationName: "Prepare monthly report draft",
      trigger: "month_end_due",
      condition: "The month has ended.",
      preparedAction:
        "A monthly summary draft is prepared from the month's work for verification.",
      destination: "report_queue",
      approvalRequired: true,
      status: "prepared",
      auditTrailNote:
        "Preview only — metrics are noted as pending until connected.",
    },
    {
      automationName: "Prepare onboarding checklist",
      trigger: "lead_audit_completed",
      condition: "An audit lead is marked won / ready to convert.",
      preparedAction:
        "An onboarding checklist is prepared (local only — no account is created).",
      destination: "onboarding_checklist",
      approvalRequired: true,
      status: "awaiting_approval",
      futureIntegration: FUTURE_INTEGRATIONS.supabase,
      auditTrailNote:
        "Preview only — no client record is written. Conversion stays manual.",
    },
    {
      automationName: "Prepare report verification task",
      trigger: "missing_metrics",
      condition: "A report draft is missing connected metrics.",
      preparedAction:
        "A verification task is prepared so the team confirms workflow-based copy.",
      destination: "report_queue",
      approvalRequired: true,
      status: "blocked",
      blockedReason: "Performance metrics are not connected yet.",
      futureIntegration: FUTURE_INTEGRATIONS.supabase,
      auditTrailNote:
        "Preview only — no metrics are invented. Draft uses workflow activity only.",
    },
  ];
}

/** Filter the catalog to the triggers currently relevant to live work items. */
export function previewAutomationsForWorkItems(
  items: TeamWorkItem[],
): AutomationPreview[] {
  const active = new Set<AutomationTrigger>();
  for (const item of items) {
    if (item.workType === "media_review") active.add("media_uploaded");
    if (item.teamWorkStatus === "waiting_on_client")
      active.add("media_needs_context");
    if (item.workType === "content") active.add("content_angle_ready");
    if (item.teamWorkStatus === "ready_for_review") active.add("caption_approved");
    if (item.workType === "reporting") active.add("weekly_cycle_due");
  }
  // Always surface weekly/monthly cadence + lead onboarding as standing previews.
  active.add("weekly_cycle_due");
  active.add("lead_audit_completed");
  const all = automationCatalog();
  return all.filter((a) => active.has(a.trigger));
}

/** Aggregate a snapshot for the team command center. */
export function previewAutomationSnapshot(
  items: TeamWorkItem[],
): AutomationSnapshot {
  const previews = previewAutomationsForWorkItems(items);
  return {
    preparedCount: previews.filter((p) => p.status === "prepared").length,
    awaitingApprovalCount: previews.filter(
      (p) => p.status === "awaiting_approval",
    ).length,
    blockedCount: previews.filter((p) => p.status === "blocked").length,
    futureIntegrationCount: previews.filter(
      (p) => p.status === "future_integration_required" || !!p.futureIntegration,
    ).length,
    previews,
  };
}

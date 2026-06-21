export type MomoWorkQueueStatus =
  | "internal_review_only"
  | "blocked"
  | "needs_faraz_review"
  | "needs_owner_confirmation"
  | "needs_media_rights_confirmation"
  | "disabled_by_default"
  | "ready_for_internal_review_only"
  | "future_step_required";

export type MomoWorkQueueRisk = "low" | "medium" | "high" | "critical";

export type MomoWorkQueueLane =
  | "Work Queue Overview"
  | "Messages"
  | "Upload Inbox"
  | "Profile Corrections"
  | "AI Drafts"
  | "Momo AI Approval"
  | "Activity Log"
  | "Reports Follow Through"
  | "Blocked Work"
  | "Safe Next Actions"
  | "Safety Boundaries";

export type MomoWorkQueueItem = {
  id: string;
  lane: MomoWorkQueueLane;
  title: string;
  status: MomoWorkQueueStatus;
  risk: MomoWorkQueueRisk;
  summary: string;
  work_rule: string;
  blocked_if: string;
  safe_next_step: string;
  route_href?: string;
  secondary_route_href?: string;
};

export const momoWorkQueueLanes: MomoWorkQueueLane[] = [
  "Work Queue Overview",
  "Messages",
  "Upload Inbox",
  "Profile Corrections",
  "AI Drafts",
  "Momo AI Approval",
  "Activity Log",
  "Reports Follow Through",
  "Blocked Work",
  "Safe Next Actions",
  "Safety Boundaries",
];

export const momoWorkQueueBoard: MomoWorkQueueItem[] = [
  {
    id: "overview-daily-internal-board",
    lane: "Work Queue Overview",
    title: "Daily internal execution board",
    status: "internal_review_only",
    risk: "medium",
    summary: "`/team/momo/work` is the daily internal execution board. It organizes existing Team pages only; it does not create work automatically, create fake counts, contact Momo, or publish.",
    work_rule: "Use this board as a routing and review map for Team Faraz only.",
    blocked_if: "Any action would activate the pilot, contact Momo’s House, publish externally, invent work, or imply live queue totals.",
    safe_next_step: "Choose an existing internal Team surface to review; keep all work internal unless separately approved.",
    route_href: "/team/momo",
  },
  {
    id: "messages-internal-review-only",
    lane: "Messages",
    title: "Message review stays internal",
    status: "internal_review_only",
    risk: "high",
    summary: "Messages are portal/internal review only unless separately approved. This board sends no SMS, email, DM, external messaging, owner outreach, or client-visible promise.",
    work_rule: "Review internal message surfaces without sending or promising anything externally.",
    blocked_if: "A message requires owner outreach, external delivery, or a client-visible commitment not explicitly approved.",
    safe_next_step: "Open Messages for internal review only.",
    route_href: "/team/messages",
  },
  {
    id: "upload-inbox-media-rights-gated",
    lane: "Upload Inbox",
    title: "Upload/media review is rights-gated",
    status: "needs_media_rights_confirmation",
    risk: "high",
    summary: "Upload review is internal only. No media upload is triggered from this page, no fake media is created, and media usage rights require owner confirmation before public use.",
    work_rule: "Review existing upload-inbox surfaces without uploading, creating, seeding, or approving media rights.",
    blocked_if: "Media rights are unconfirmed or the next step would make media public/customer-visible.",
    safe_next_step: "Open Upload Inbox and review internally.",
    route_href: "/team/upload-inbox",
  },
  {
    id: "profile-corrections-business-truth-gated",
    lane: "Profile Corrections",
    title: "Business-truth corrections require confirmation",
    status: "needs_owner_confirmation",
    risk: "critical",
    summary: "Business-truth changes require owner confirmation before public/customer-visible use. There is no Google, Meta, or public profile sync; corrections remain internal review unless separately approved.",
    work_rule: "Review profile corrections internally and keep facts unconfirmed until owner confirmation exists.",
    blocked_if: "The correction touches hours, menu, prices, offers, platform links, sensitive claims, or any public profile update without owner confirmation.",
    safe_next_step: "Open Profile Corrections for internal review only.",
    route_href: "/team/profile-corrections",
  },
  {
    id: "ai-drafts-no-generation-or-publishing",
    lane: "AI Drafts",
    title: "AI drafts remain internal-only",
    status: "disabled_by_default",
    risk: "critical",
    summary: "AI drafts remain internal-only. This board does not generate AI output, expose raw AI output to clients, auto-approve, or publish.",
    work_rule: "Review draft foundations only; do not call providers or make drafts customer-visible.",
    blocked_if: "The next step would generate AI now, auto-approve output, publish, or expose raw AI output to a client.",
    safe_next_step: "Open AI Drafts for internal review only.",
    route_href: "/team/ai-drafts",
  },
  {
    id: "momo-ai-approval-team-review-required",
    lane: "Momo AI Approval",
    title: "Momo AI approval requires Team/Faraz review",
    status: "needs_faraz_review",
    risk: "high",
    summary: "The Momo AI approval queue exists, with no auto-approval and no auto-publishing. Drafts may move forward only after Team/Faraz review; owner-confirmation-needed is a blocker, not outreach.",
    work_rule: "Review approval state internally and keep publishing disabled.",
    blocked_if: "A draft depends on unconfirmed owner facts, unconfirmed media rights, sensitive claims, or publishing approval.",
    safe_next_step: "Open Momo AI Approval for internal review only.",
    route_href: "/team/momo-ai-approval",
  },
  {
    id: "activity-log-real-work-only",
    lane: "Activity Log",
    title: "Activity log records real work only",
    status: "internal_review_only",
    risk: "high",
    summary: "Activity log must reflect real Veroxa work only. This board creates no fake activity, has no external side effects, and creates no client-visible activity unless separately approved.",
    work_rule: "Record or review only real internal work; do not invent activity for progress optics.",
    blocked_if: "The activity is simulated, externally triggered, client-visible without approval, or not actually completed by Veroxa.",
    safe_next_step: "Open Activity Log when real internal work needs review or recording.",
    route_href: "/team/activity-log",
  },
  {
    id: "reports-follow-through-real-activity-only",
    lane: "Reports Follow Through",
    title: "Reports follow real activity only",
    status: "needs_faraz_review",
    risk: "high",
    summary: "Reports must be based on real Veroxa activity only. No fake reports, fake metrics, ROI/sales/ranking/reach claims, or client-visible reports without review/approval.",
    work_rule: "Use report surfaces for internal follow-through on real activity, not invented performance.",
    blocked_if: "The report would include fake metrics, fake readiness, performance claims, or unreviewed client-visible statements.",
    safe_next_step: "Review Momo Reports or Reports From Activity internally.",
    route_href: "/team/momo/reports",
    secondary_route_href: "/team/reports-from-activity",
  },
  {
    id: "blocked-work-hard-stops",
    lane: "Blocked Work",
    title: "Known blocked work remains blocked",
    status: "blocked",
    risk: "critical",
    summary: "Blocked examples: owner confirmation required, media rights unconfirmed, sensitive claim unconfirmed, real-auth activation not approved, external platform setup not approved, owner walkthrough not approved, and AI generation disabled by default.",
    work_rule: "Treat blockers as stop signs, not outreach instructions or implied approval.",
    blocked_if: "The work depends on activation, real auth, credentials, owner contact, integrations, publishing, AI generation, or unconfirmed truth/rights.",
    safe_next_step: "Escalate risky items to Faraz and keep the owner walkthrough blocked.",
    route_href: "/team/momo/readiness",
  },
  {
    id: "safe-next-internal-actions-only",
    lane: "Safe Next Actions",
    title: "Allowed internal actions today",
    status: "ready_for_internal_review_only",
    risk: "medium",
    summary: "Allowed actions: review messages, upload inbox, profile corrections, AI drafts, Momo AI approval queue, record real internal activity only, review reports/activity, escalate risky items to Faraz, and keep owner walkthrough blocked.",
    work_rule: "Only internal review and real internal activity are allowed from this board.",
    blocked_if: "The next step would contact the owner, invite the client, activate the pilot, go live, publish, post, connect platforms, turn on real auth, generate AI now, or approve for publishing.",
    safe_next_step: "Open an allowed internal route and continue review without external side effects.",
    route_href: "/team/control-center",
  },
  {
    id: "safety-boundaries-no-activation",
    lane: "Safety Boundaries",
    title: "Hard safety boundaries",
    status: "blocked",
    risk: "critical",
    summary: "No pilot activation, no real auth activation, no credentials, no Momo contact, no publishing, no external integrations, no AI generation, no fake work items, no fake counts, and no next activation PR approved by default.",
    work_rule: "Keep this board static/internal and do not wire live systems, background jobs, external platforms, or AI providers.",
    blocked_if: "Any implementation or UI action would suggest activation, outreach, publishing, platform connection, AI generation, fake data, or next-step approval.",
    safe_next_step: "Keep the Work Queue as an internal organization board only.",
    route_href: "/team/momo/work",
  },
];

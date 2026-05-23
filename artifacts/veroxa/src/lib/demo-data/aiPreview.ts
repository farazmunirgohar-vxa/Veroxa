// ─────────────────────────────────────────────────────────────────────────────
// AI Preview card text data — demo/simulation only.
// Icon references remain in the portal components (they require React imports).
// ─────────────────────────────────────────────────────────────────────────────

// ── Team Portal — AI Agent Preview ───────────────────────────────────────────

export const teamAgentCards = [
  {
    key: "media-review",
    name: "Media Review Agent",
    status: "Reviewed 12 uploads",
    purpose: "Scores uploaded media for lighting, blur, food visibility, and duplicate risk.",
    statusColor: "emerald" as const,
  },
  {
    key: "content-strategist",
    name: "Content Strategist Agent",
    status: "4 concepts prepared",
    purpose: "Suggests content angles — product spotlight, family meal, behind-the-scenes, review highlight, or promotion.",
    statusColor: "blue" as const,
  },
  {
    key: "caption",
    name: "Caption Agent",
    status: "3 draft variants generated",
    purpose: "Creates Safe, Engagement, and Sales caption options for the selected concept.",
    statusColor: "violet" as const,
  },
  {
    key: "brand-voice",
    name: "Brand Voice Agent",
    status: "Tone check passed",
    purpose: "Checks captions sound premium, clear, restaurant-focused, and not too generic.",
    statusColor: "emerald" as const,
  },
  {
    key: "scheduling",
    name: "Scheduling Agent",
    status: "3 posts ready for timing",
    purpose: "Suggests posting slots based on the client's preferred windows and content balance.",
    statusColor: "blue" as const,
  },
  {
    key: "reporting",
    name: "Reporting Agent",
    status: "Weekly summary updated",
    purpose: "Pulls demo performance signals into weekly update cards for client review.",
    statusColor: "violet" as const,
  },
  {
    key: "alert",
    name: "Alert Agent",
    status: "1 content warning active",
    purpose: "Flags low content supply, failed posts, or client health risks before they escalate.",
    statusColor: "amber" as const,
  },
] as const;

// ── Operator Portal — AI Oversight Preview ───────────────────────────────────

export const operatorOversightSignals = [
  {
    key: "content-supply-risk",
    name: "Content Supply Risk",
    status: "6 clients need attention",
    meaning: "Flags clients with low usable media supply or an empty upcoming content pipeline.",
    color: "amber" as const,
  },
  {
    key: "publishing-risk",
    name: "Publishing Risk",
    status: "3 failed posts detected",
    meaning: "Highlights failed posts, expired platform access, or posts needing reschedule.",
    color: "red" as const,
  },
  {
    key: "report-quality",
    name: "Report Quality Check",
    status: "4 reports pending review",
    meaning: "Prepares report summaries — operator approval still required before client release.",
    color: "blue" as const,
  },
  {
    key: "client-health-watch",
    name: "Client Health Watch",
    status: "5 accounts below threshold",
    meaning: "Watches content supply, posting consistency, Google visibility, and recurring issues.",
    color: "violet" as const,
  },
  {
    key: "escalation-signal",
    name: "Escalation Signal",
    status: "2 critical alerts",
    meaning: "Recommends which problems should reach operator or owner-level visibility.",
    color: "red" as const,
  },
] as const;

// ── Owner Portal — AI Business Snapshot ──────────────────────────────────────

export const ownerSnapshotSignals = [
  {
    key: "revenue-signal",
    name: "Revenue Signal",
    status: "MRR up 8.7%",
    meaning: "Highlights business-level revenue movement and whether growth is healthy.",
    color: "emerald" as const,
  },
  {
    key: "client-risk",
    name: "Client Risk Signal",
    status: "6 clients need attention",
    meaning: "Summarises client health problems without surfacing daily execution clutter.",
    color: "amber" as const,
  },
  {
    key: "retention-watch",
    name: "Retention Watch",
    status: "2 accounts at elevated churn risk",
    meaning: "Flags accounts that may need owner awareness due to recurring content, performance, or communication issues.",
    color: "red" as const,
  },
  {
    key: "growth-opportunity",
    name: "Growth Opportunity",
    status: "3 expansion candidates",
    meaning: "Identifies clients ready for ads, upsell, referral request, or case study.",
    color: "violet" as const,
  },
  {
    key: "critical-escalation",
    name: "Critical Escalation",
    status: "2 owner-level alerts",
    meaning: "Surfaces only serious problems that require strategic attention.",
    color: "red" as const,
  },
] as const;

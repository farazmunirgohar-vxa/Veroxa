// demoClientHealth.ts — future: client_health signals / computed health state
// Covers health scores, KPI snapshots, client priority board, and health distributions.

import type { HealthLevel } from "./demoClients";

export type NotificationCategory = "critical" | "warning" | "info" | "success";

export const notificationCategoryOrder: Record<NotificationCategory, number> = {
  critical: 0,
  warning:  1,
  success:  2,
  info:     3,
};

// ── DemoClientHealth — future: client_health (computed signals) ───
export interface DemoClientHealth {
  clientId: string;
  level: HealthLevel;
  score: number;
  mainIssue: string;
  recommendedAction: string;
  lastActivity: string;
  signals: {
    mediaInventory:     { value: number; max: number; note: string };
    postingConsistency: { label: string; status: "good" | "warn" | "bad" };
    googleVisibility:   { score: number; trend: "up" | "flat" | "down" };
    reviewActivity:     { recent: number; note: string };
    onboardingComplete: number;
    reportStatus: "Approved" | "Pending" | "Draft" | "Overdue";
  };
}

export const demoClientHealth: DemoClientHealth[] = [
  {
    clientId: "mamadali",
    level: "healthy",
    score: 88,
    mainIssue: "Posting schedule healthy",
    recommendedAction: "No action needed",
    lastActivity: "Today, 9:15 AM",
    signals: {
      mediaInventory:     { value: 18, max: 20, note: "Healthy supply" },
      postingConsistency: { label: "On schedule", status: "good" },
      googleVisibility:   { score: 82, trend: "up" },
      reviewActivity:     { recent: 4, note: "Steady positive flow" },
      onboardingComplete: 100,
      reportStatus:       "Approved",
    },
  },
  {
    clientId: "urban",
    level: "attention",
    score: 64,
    mainIssue: "Weekly report pending operator review",
    recommendedAction: "Operator should review monthly report",
    lastActivity: "Yesterday, 6:30 PM",
    signals: {
      mediaInventory:     { value: 9, max: 20, note: "Trending low" },
      postingConsistency: { label: "Mostly on schedule", status: "warn" },
      googleVisibility:   { score: 71, trend: "flat" },
      reviewActivity:     { recent: 1, note: "Slow week" },
      onboardingComplete: 90,
      reportStatus:       "Pending",
    },
  },
  {
    clientId: "crescent",
    level: "healthy",
    score: 81,
    mainIssue: "Google reviews improving",
    recommendedAction: "Schedule Google review follow-up",
    lastActivity: "Today, 11:02 AM",
    signals: {
      mediaInventory:     { value: 14, max: 20, note: "Good supply" },
      postingConsistency: { label: "On schedule", status: "good" },
      googleVisibility:   { score: 77, trend: "up" },
      reviewActivity:     { recent: 3, note: "+9 this month" },
      onboardingComplete: 100,
      reportStatus:       "Approved",
    },
  },
  {
    clientId: "alnoor",
    level: "critical",
    score: 38,
    mainIssue: "Onboarding missing menu photos, low media inventory",
    recommendedAction: "Request 5 new food photos",
    lastActivity: "May 22 — 4 days ago",
    signals: {
      mediaInventory:     { value: 2, max: 20, note: "Critically low" },
      postingConsistency: { label: "Inconsistent", status: "bad" },
      googleVisibility:   { score: 58, trend: "down" },
      reviewActivity:     { recent: 0, note: "No new reviews" },
      onboardingComplete: 55,
      reportStatus:       "Overdue",
    },
  },
];

// ── KPI Snapshots ─────────────────────────────────────────────────
export const demoOwnerKpis = {
  totalClients:            4,
  activeClients:           4,
  monthlyRevenueDemo:      "$5,388",
  scheduledPosts:          28,
  publishedPosts:          19,
  googleVisibilityScore:   72,
  reviewGrowthThisMonth:   9,
  clientsNeedingAttention: 2,
};

export const demoOperatorKpis = {
  tasksCompletedThisWeek:  23,
  reportsPendingReview:     2,
  mediaItemsPendingReview:  5,
  approvedContentReady:    11,
  postsScheduledThisWeek:   9,
  clientIssuesOpen:         3,
};

// ── Client health distribution — future: computed aggregate ───────
export const demoClientHealthDistribution = [
  { status: "Excellent", count: 0, color: "bg-emerald-500" },
  { status: "Healthy",   count: 2, color: "bg-sky-500"     },
  { status: "Warning",   count: 1, color: "bg-amber-500"   },
  { status: "Critical",  count: 1, color: "bg-rose-500"    },
] as const;

// ── DemoHealthScore — future: computed health aggregates ──────────
export interface DemoHealthScore {
  label:  string;
  score:  number;
  status: "Excellent" | "Healthy" | "Warning" | "Critical";
  detail: string;
}

export const demoHealthScores: DemoHealthScore[] = [
  { label: "Client Health",    score: 79, status: "Healthy",   detail: "Portfolio average — 1 critical, 1 warning, 2 healthy." },
  { label: "Inventory Health", score: 64, status: "Warning",   detail: "2 clients below 14-day runway." },
  { label: "Workflow Health",  score: 86, status: "Healthy",   detail: "1 blocked item, no SLA breaches today." },
  { label: "Reporting Health", score: 88, status: "Healthy",   detail: "12 weekly drafted, 88% validation rate." },
  { label: "Team Health",      score: 84, status: "Healthy",   detail: "Utilisation 84% — no burnout signals." },
  { label: "Business Health",  score: 91, status: "Excellent", detail: "MRR +12% MoM, retention 94%." },
];

// ── Client priority board — future: computed operator priority view
export type ClientPriorityLevel = "Critical" | "High" | "Normal" | "Low";
export type ClientHealthStatus  = "Excellent" | "Healthy" | "Warning" | "Critical";

export interface DemoClientPriority {
  clientId:          string;
  healthStatus:      ClientHealthStatus;
  priorityLevel:     ClientPriorityLevel;
  nextAction:        string;
  lastUpdate:        string;
  priorityReason:    string;
  riskFactors:       string[];
  recommendedAction: string;
}

export const demoClientPriorities: DemoClientPriority[] = [
  {
    clientId:         "alnoor",
    healthStatus:     "Critical",
    priorityLevel:    "Critical",
    nextAction:       "Request 5 new food photos and resolve missing onboarding items immediately.",
    lastUpdate:       "May 22 — no activity since",
    priorityReason:   "Onboarding incomplete, media critically low, client unresponsive for 3 days.",
    riskFactors:      ["Low media inventory", "Inactive client", "Onboarding incomplete"],
    recommendedAction: "Call client, request media, escalate to owner if no response by EOD.",
  },
  {
    clientId:         "urban",
    healthStatus:     "Warning",
    priorityLevel:    "High",
    nextAction:       "Validate weekly report and resolve operator review backlog.",
    lastUpdate:       "Yesterday, 6:30 PM",
    priorityReason:   "Weekly report in operator queue 28+ hours. Media supply trending low.",
    riskFactors:      ["Reporting overdue", "Media supply dropping"],
    recommendedAction: "Validate report now. Schedule media refresh call within 48 hours.",
  },
  {
    clientId:         "mamadali",
    healthStatus:     "Healthy",
    priorityLevel:    "Normal",
    nextAction:       "Final approval on dinner reel before Thursday post window.",
    lastUpdate:       "Today, 10:48 AM",
    priorityReason:   "Content ready, minor sign-off pending. No urgent risks.",
    riskFactors:      [],
    recommendedAction: "Approve reel, confirm Thursday scheduling window.",
  },
  {
    clientId:         "crescent",
    healthStatus:     "Healthy",
    priorityLevel:    "Normal",
    nextAction:       "Schedule olive oil reel and confirm caption.",
    lastUpdate:       "Today, 11:02 AM",
    priorityReason:   "On track. Caption draft approved. No blockers.",
    riskFactors:      [],
    recommendedAction: "Confirm caption, lock Thursday evening slot.",
  },
];

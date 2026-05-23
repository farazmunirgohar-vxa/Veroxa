import type { WeeklyReport, MonthlyReport } from "../database/models";
import { WeeklyReportStatus, MonthlyReportStatus } from "../database/enums";

// ── Typed demo weekly reports — Mamadali Kebab House ─────────────────────────

export const mamadaliWeeklyReports: WeeklyReport[] = [
  {
    id: "weekly-mamadali-w20",
    clientId: "client-mamadali-001",
    weekStartDate: "2026-05-19",
    weekEndDate: "2026-05-25",
    status: WeeklyReportStatus.published,
    postsPublished: 4,
    postsPlanned: 4,
    completionRate: 100,
    summaryText: "4 posts published across Instagram and Facebook. Google impressions up 18%. Kebab platter post drove highest reach. 2 new 5-star reviews. Next shoot booked Thursday 29 May at 11am.",
    generatedAt: "2026-05-23T07:00:00Z",
    publishedAt: "2026-05-23T08:00:00Z",
    createdAt: "2026-05-23T07:00:00Z",
    updatedAt: "2026-05-23T08:00:00Z",
  },
  {
    id: "weekly-mamadali-w19",
    clientId: "client-mamadali-001",
    weekStartDate: "2026-05-12",
    weekEndDate: "2026-05-18",
    status: WeeklyReportStatus.published,
    postsPublished: 4,
    postsPlanned: 4,
    completionRate: 100,
    summaryText: "Strong week — all 4 slots filled. Mixed grill platter drove 4,820 reach on Instagram.",
    generatedAt: "2026-05-18T18:30:00Z",
    publishedAt: "2026-05-18T19:00:00Z",
    createdAt: "2026-05-18T18:30:00Z",
    updatedAt: "2026-05-18T19:00:00Z",
  },
];

// ── Typed demo monthly reports — Mamadali Kebab House ────────────────────────

export const mamadaliMonthlyReports: MonthlyReport[] = [
  {
    id: "monthly-mamadali-apr2026",
    clientId: "client-mamadali-001",
    month: 4,
    year: 2026,
    status: MonthlyReportStatus.approved,
    postsPublished: 18,
    postsPlanned: 20,
    completionRate: 90,
    summaryText: "April 2026 — 18 posts published. Total reach 41,200. Google impressions 12,580. 6 new reviews.",
    operatorReviewedAt: "2026-05-03T10:00:00Z",
    approvedAt: "2026-05-03T11:00:00Z",
    publishedAt: "2026-05-03T11:30:00Z",
    createdAt: "2026-05-01T09:00:00Z",
    updatedAt: "2026-05-03T11:30:00Z",
  },
];

// ── Operator Portal — Report approvals display ────────────────────────────────

export const reportApprovals = [
  { client: "Sushi Nori Shoreditch",  period: "April 2026", preparedBy: "Jordan D.", status: "Ready"     },
  { client: "Cafe Levant",            period: "April 2026", preparedBy: "Sarah M.",  status: "Ready"     },
  { client: "Bayleaf Indian Kitchen", period: "April 2026", preparedBy: "Alex K.",   status: "In Review" },
  { client: "Mamadali Kebab House",   period: "April 2026", preparedBy: "Jordan D.", status: "In Review" },
] as const;

// ── Owner Portal — MRR trend chart data ──────────────────────────────────────

export const revenueData = [
  { month: "Dec", rev: 28400 },
  { month: "Jan", rev: 31200 },
  { month: "Feb", rev: 33800 },
  { month: "Mar", rev: 36500 },
  { month: "Apr", rev: 40100 },
  { month: "May", rev: 43600 },
] as const;

// ── Owner Portal — Critical alerts display ────────────────────────────────────

export const ownerCriticalAlerts = [
  { client: "The Grill House",       issue: "Google Business Profile disconnected — visibility paused.", severity: "Critical" },
  { client: "Mamadali Kebab House",  issue: "No posts scheduled next week — pipeline empty.",            severity: "Critical" },
  { client: "Rosso Trattoria",       issue: "No media uploaded in 18 days — shoot overdue.",             severity: "Warning"  },
] as const;

// ── Owner Portal — Growth summary display ────────────────────────────────────

export const growthSummary = [
  { label: "New clients onboarded (May)",   value: "3",    positive: true  },
  { label: "Churned clients (May)",         value: "0",    positive: true  },
  { label: "Avg posts per client / month",  value: "16.4", positive: true  },
  { label: "Avg Google visibility lift",    value: "+38%", positive: true  },
  { label: "Clients below health threshold", value: "6",   positive: false },
  { label: "Failed posts requiring action", value: "3",    positive: false },
] as const;

// ── Owner Portal — Activity feed display ──────────────────────────────────────

export const activities = [
  { title: "New client onboarded",       target: "Saffron Street Kitchen",              time: "1 hour ago",  positive: true  },
  { title: "Monthly report approved",    target: "Sushi Nori Shoreditch — April 2026",  time: "3 hours ago", positive: true  },
  { title: "Critical alert raised",      target: "The Grill House — GBP disconnected",  time: "2 days ago",  positive: false },
  { title: "MRR milestone reached",      target: "Agency crossed $43k MRR",             time: "3 days ago",  positive: true  },
  { title: "Client health drop detected", target: "Rosso Trattoria — score fell to 44", time: "4 days ago",  positive: false },
] as const;

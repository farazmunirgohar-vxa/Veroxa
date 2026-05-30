// demoFinancials.ts — future: billing / analytics aggregates
// Covers owner business metrics, revenue trend, service plans, and BI analytics.
//
// Pricing model reference: src/data/pricing/veroxaPricing.ts
//   * Essential = $497/mo
//   * Growth    = $697/mo
//   * Premium   = $997/mo (ad spend separate)
// No contract. Cancel anytime. Essential max 1 picture post/day; Premium max 2 content posts/day total (1 picture + 1 reel), media-dependent.

import type { BizSeverity } from "./demoOwner";

// ── Owner business metrics ────────────────────────────────────────
// Demo MRR = $697 + $697 + $997 + $497 = $2,888
//   demo-a: Growth    $697
//   demo-b: Growth    $697
//   demo-c: Premium   $997
//   demo-d: Essential $497
export const demoOwnerMetrics = {
  totalActiveClients: 4,
  monthlyRecurringRevenue: 2888,
  projectedRevenue: 3585,
  clientHealthAverage: 79,
  teamUtilization: 84,
  retentionScore: 94,
  reportingCompletionRate: 88,
  onboardingCompletionRate: 76,
  monthOverMonthGrowth: 12,
};

// ── Revenue trend — future: revenue_events aggregated ────────────
export interface DemoRevenuePoint {
  month: string;
  revenue: number;
  clients: number;
}

export const demoRevenueTrend: DemoRevenuePoint[] = [
  { month: "Dec", revenue: 697, clients: 1 },
  { month: "Jan", revenue: 1194, clients: 2 },
  { month: "Feb", revenue: 1891, clients: 3 },
  { month: "Mar", revenue: 1891, clients: 3 },
  { month: "Apr", revenue: 2391, clients: 3 },
  { month: "May", revenue: 2888, clients: 4 },
];

// ── Service plans — future: service_plans config ──────────────────
export interface DemoPlanRow {
  plan: string;
  price: number;
  clients: number;
  color: string;
}

export const demoServicePlans: DemoPlanRow[] = [
  { plan: "Essential", price: 497, clients: 1, color: "bg-emerald-500" },
  { plan: "Growth", price: 697, clients: 2, color: "bg-sky-500" },
  { plan: "Premium", price: 997, clients: 1, color: "bg-violet-500" },
];

// ── BI Center trend type ──────────────────────────────────────────
export interface DemoTrendPoint {
  label: string;
  value: number;
}

// ── BI Center multi-series metrics (6 months) ─────────────────────
export const demoBiMetrics = {
  clientGrowth: [
    { label: "Dec", value: 2 },
    { label: "Jan", value: 2 },
    { label: "Feb", value: 3 },
    { label: "Mar", value: 3 },
    { label: "Apr", value: 4 },
    { label: "May", value: 4 },
  ] as DemoTrendPoint[],
  revenueGrowth: [
    { label: "Dec", value: 697 },
    { label: "Jan", value: 1194 },
    { label: "Feb", value: 1891 },
    { label: "Mar", value: 1891 },
    { label: "Apr", value: 2391 },
    { label: "May", value: 2888 },
  ] as DemoTrendPoint[],
  retention: [
    { label: "Dec", value: 100 },
    { label: "Jan", value: 100 },
    { label: "Feb", value: 100 },
    { label: "Mar", value: 100 },
    { label: "Apr", value: 100 },
    { label: "May", value: 94 },
  ] as DemoTrendPoint[],
  mediaInventoryTrend: [
    { label: "Dec", value: 42 },
    { label: "Jan", value: 38 },
    { label: "Feb", value: 46 },
    { label: "Mar", value: 52 },
    { label: "Apr", value: 48 },
    { label: "May", value: 39 },
  ] as DemoTrendPoint[],
  contentProduction: [
    { label: "Dec", value: 24 },
    { label: "Jan", value: 26 },
    { label: "Feb", value: 38 },
    { label: "Mar", value: 42 },
    { label: "Apr", value: 51 },
    { label: "May", value: 58 },
  ] as DemoTrendPoint[],
  reportingCompletion: [
    { label: "Dec", value: 80 },
    { label: "Jan", value: 84 },
    { label: "Feb", value: 86 },
    { label: "Mar", value: 88 },
    { label: "Apr", value: 90 },
    { label: "May", value: 88 },
  ] as DemoTrendPoint[],
  clientHealthOverTime: [
    { label: "Dec", value: 84 },
    { label: "Jan", value: 85 },
    { label: "Feb", value: 83 },
    { label: "Mar", value: 82 },
    { label: "Apr", value: 80 },
    { label: "May", value: 79 },
  ] as DemoTrendPoint[],
};

// ── Media analytics — future: media_analytics aggregate ──────────
export const demoMediaAnalytics = {
  photosReceived: 142,
  videosReceived: 37,
  unusedInventory: 29,
  inventoryByAge: [
    { bucket: "0–7 days", count: 18, color: "bg-emerald-500" },
    { bucket: "8–30 days", count: 24, color: "bg-sky-500" },
    { bucket: "31–60 days", count: 14, color: "bg-amber-500" },
    { bucket: "60+ days", count: 12, color: "bg-rose-500" },
  ],
  inventoryByClient: [
    { clientId: "demo-a", approved: 24, pending: 6, low: false },
    { clientId: "demo-b", approved: 9, pending: 3, low: true },
    { clientId: "demo-c", approved: 18, pending: 4, low: false },
    { clientId: "demo-d", approved: 2, pending: 1, low: true },
  ],
  upcomingShortages: [
    {
      clientId: "demo-d",
      daysRemaining: 5,
      severity: "Critical" as BizSeverity,
    },
    {
      clientId: "demo-b",
      daysRemaining: 14,
      severity: "Medium" as BizSeverity,
    },
  ],
};

// ── Operations intelligence — future: ops_analytics aggregate ────
export const demoOpsIntelligence = {
  teamWorkload: [
    { label: "Jordan", value: 16 },
    { label: "Priya", value: 14 },
    { label: "Marcus", value: 10 },
    { label: "Ava", value: 16 },
  ] as DemoTrendPoint[],
  reviewQueue: {
    current: 7,
    target: 5,
    status: "above" as "above" | "below" | "on",
  },
  approvalQueue: {
    current: 3,
    target: 5,
    status: "below" as "above" | "below" | "on",
  },
  contentBacklog: {
    current: 5,
    target: 10,
    status: "below" as "above" | "below" | "on",
  },
  reportingBacklog: {
    current: 2,
    target: 0,
    status: "above" as "above" | "below" | "on",
  },
  clientResponsiveness: [
    { clientId: "demo-a", avgHours: 2.4 },
    { clientId: "demo-b", avgHours: 14.0 },
    { clientId: "demo-c", avgHours: 4.1 },
    { clientId: "demo-d", avgHours: 72.0 },
  ],
  riskDistribution: [
    { label: "Critical", value: 2, color: "bg-rose-500" },
    { label: "High", value: 2, color: "bg-amber-500" },
    { label: "Medium", value: 3, color: "bg-yellow-500" },
    { label: "Low", value: 2, color: "bg-muted-foreground/40" },
  ],
};

// ── Reporting analytics — future: reporting_analytics aggregate ───
export const demoReportingAnalytics = {
  weeklyDrafted: 12,
  weeklyValidationRate: 88,
  weeklyPublishRate: 94,
  monthlyDrafted: 4,
  monthlyPublishRate: 100,
  avgDraftToPublishHours: 36,
  historicalCompletion: [
    { label: "Dec", value: 80 },
    { label: "Jan", value: 84 },
    { label: "Feb", value: 86 },
    { label: "Mar", value: 88 },
    { label: "Apr", value: 90 },
    { label: "May", value: 88 },
  ] as DemoTrendPoint[],
};

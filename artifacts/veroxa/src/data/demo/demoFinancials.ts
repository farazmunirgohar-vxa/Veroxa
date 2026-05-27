// demoFinancials.ts — future: billing / analytics aggregates
// Covers owner business metrics, revenue trend, service plans, and BI analytics.

import type { BizSeverity } from "./demoOwner";

// ── Owner business metrics ────────────────────────────────────────
export const demoOwnerMetrics = {
  totalActiveClients:       4,
  monthlyRecurringRevenue:  4788,
  projectedRevenue:         7785,
  clientHealthAverage:      79,
  teamUtilization:          84,
  retentionScore:           94,
  reportingCompletionRate:  88,
  onboardingCompletionRate: 76,
  monthOverMonthGrowth:     12,
};

// ── Revenue trend — future: revenue_events aggregated ────────────
export interface DemoRevenuePoint {
  month:   string;
  revenue: number;
  clients: number;
}

export const demoRevenueTrend: DemoRevenuePoint[] = [
  { month: "Dec", revenue: 2094, clients: 2 },
  { month: "Jan", revenue: 2094, clients: 2 },
  { month: "Feb", revenue: 3191, clients: 3 },
  { month: "Mar", revenue: 3291, clients: 3 },
  { month: "Apr", revenue: 4488, clients: 4 },
  { month: "May", revenue: 4788, clients: 4 },
];

// ── Service plans — future: service_plans config ──────────────────
export interface DemoPlanRow {
  plan:    string;
  price:   number;
  clients: number;
  color:   string;
}

export const demoServicePlans: DemoPlanRow[] = [
  { plan: "Complete · 12-mo",       price:  997, clients: 1, color: "bg-sky-500"     },
  { plan: "Complete · 6-mo",        price: 1097, clients: 1, color: "bg-emerald-500" },
  { plan: "Complete · 3-mo",        price: 1197, clients: 1, color: "bg-amber-500"   },
  { plan: "Complete · No-contract", price: 1497, clients: 1, color: "bg-violet-500"  },
];

// ── BI Center trend type ──────────────────────────────────────────
export interface DemoTrendPoint {
  label: string;
  value: number;
}

// ── BI Center multi-series metrics (6 months) ─────────────────────
export const demoBiMetrics = {
  clientGrowth:        [{ label:"Dec", value:2 },{ label:"Jan", value:2 },{ label:"Feb", value:3 },{ label:"Mar", value:3 },{ label:"Apr", value:4 },{ label:"May", value:4 }] as DemoTrendPoint[],
  revenueGrowth:       [{ label:"Dec", value:2094 },{ label:"Jan", value:2094 },{ label:"Feb", value:3191 },{ label:"Mar", value:3291 },{ label:"Apr", value:4488 },{ label:"May", value:4788 }] as DemoTrendPoint[],
  retention:           [{ label:"Dec", value:100 },{ label:"Jan", value:100 },{ label:"Feb", value:100 },{ label:"Mar", value:100 },{ label:"Apr", value:100 },{ label:"May", value:94 }] as DemoTrendPoint[],
  mediaInventoryTrend: [{ label:"Dec", value:42 },{ label:"Jan", value:38 },{ label:"Feb", value:46 },{ label:"Mar", value:52 },{ label:"Apr", value:48 },{ label:"May", value:39 }] as DemoTrendPoint[],
  contentProduction:   [{ label:"Dec", value:24 },{ label:"Jan", value:26 },{ label:"Feb", value:38 },{ label:"Mar", value:42 },{ label:"Apr", value:51 },{ label:"May", value:58 }] as DemoTrendPoint[],
  reportingCompletion: [{ label:"Dec", value:80 },{ label:"Jan", value:84 },{ label:"Feb", value:86 },{ label:"Mar", value:88 },{ label:"Apr", value:90 },{ label:"May", value:88 }] as DemoTrendPoint[],
  clientHealthOverTime:[{ label:"Dec", value:84 },{ label:"Jan", value:85 },{ label:"Feb", value:83 },{ label:"Mar", value:82 },{ label:"Apr", value:80 },{ label:"May", value:79 }] as DemoTrendPoint[],
};

// ── Media analytics — future: media_analytics aggregate ──────────
export const demoMediaAnalytics = {
  photosReceived:  142,
  videosReceived:   37,
  unusedInventory:  29,
  inventoryByAge: [
    { bucket: "0–7 days",   count: 18, color: "bg-emerald-500" },
    { bucket: "8–30 days",  count: 24, color: "bg-sky-500"     },
    { bucket: "31–60 days", count: 14, color: "bg-amber-500"   },
    { bucket: "60+ days",   count: 12, color: "bg-rose-500"    },
  ],
  inventoryByClient: [
    { clientId: "mamadali", approved: 24, pending: 6, low: false },
    { clientId: "urban",    approved:  9, pending: 3, low: true  },
    { clientId: "crescent", approved: 18, pending: 4, low: false },
    { clientId: "alnoor",   approved:  2, pending: 1, low: true  },
  ],
  upcomingShortages: [
    { clientId: "alnoor", daysRemaining:  5, severity: "Critical" as BizSeverity },
    { clientId: "urban",  daysRemaining: 14, severity: "Medium"   as BizSeverity },
  ],
};

// ── Operations intelligence — future: ops_analytics aggregate ────
export const demoOpsIntelligence = {
  teamWorkload:         [{ label: "Jordan", value: 16 }, { label: "Priya", value: 14 }, { label: "Marcus", value: 10 }, { label: "Ava", value: 16 }] as DemoTrendPoint[],
  reviewQueue:          { current: 7, target: 5, status: "above"  as "above" | "below" | "on" },
  approvalQueue:        { current: 3, target: 5, status: "below"  as "above" | "below" | "on" },
  contentBacklog:       { current: 5, target: 10, status: "below" as "above" | "below" | "on" },
  reportingBacklog:     { current: 2, target: 0, status: "above"  as "above" | "below" | "on" },
  clientResponsiveness: [
    { clientId: "mamadali", avgHours:  2.4 },
    { clientId: "urban",    avgHours: 14.0 },
    { clientId: "crescent", avgHours:  4.1 },
    { clientId: "alnoor",   avgHours: 72.0 },
  ],
  riskDistribution: [
    { label: "Critical", value: 2, color: "bg-rose-500"            },
    { label: "High",     value: 2, color: "bg-amber-500"           },
    { label: "Medium",   value: 3, color: "bg-yellow-500"          },
    { label: "Low",      value: 2, color: "bg-muted-foreground/40" },
  ],
};

// ── Reporting analytics — future: reporting_analytics aggregate ───
export const demoReportingAnalytics = {
  weeklyDrafted:          12,
  weeklyValidationRate:   88,
  weeklyPublishRate:      94,
  monthlyDrafted:          4,
  monthlyPublishRate:     100,
  avgDraftToPublishHours:  36,
  historicalCompletion: [{ label:"Dec", value:80 },{ label:"Jan", value:84 },{ label:"Feb", value:86 },{ label:"Mar", value:88 },{ label:"Apr", value:90 },{ label:"May", value:88 }] as DemoTrendPoint[],
};

// demoWeeklyReports.ts — future: weekly_reports table
// Covers weekly report drafts, team validation state, and reporting operations.

// ── DemoWeeklyReport — future: weekly_reports ────────────────────
export type WeeklyReportStatus =
  | "Draft" | "Team Review" | "Ready for Client" | "Published";

export interface DemoWeeklyReport {
  clientId:     string;
  weekRange:    string;
  status:       WeeklyReportStatus;
  summary:      string;
  metrics:      { label: string; value: string }[];
  topContent:   { title: string; engagement: string };
  mediaStatus:  string;
  nextWeekPlan: string[];
  notes:        string;
}

export const demoWeeklyReports: DemoWeeklyReport[] = [
  {
    clientId: "demo-a", weekRange: "May 19 – May 25, 2026", status: "Ready for Client",
    summary: "A strong week — 5 posts published, 3 new Google reviews, and visibility improving across search.",
    metrics: [
      { label: "Posts published",          value: "5"     },
      { label: "Google profile updates",   value: "2"     },
      { label: "New reviews",              value: "3"     },
      { label: "Approved media remaining", value: "12"    },
      { label: "Visibility estimate",      value: "+8.4%" },
    ],
    topContent:   { title: "Chicken Shawarma Reel", engagement: "Top engagement of the week" },
    mediaStatus:  "Healthy supply — 12 approved items remaining.",
    nextWeekPlan: ["Schedule weekend family-platter promo", "Shoot 2 reels for new menu item", "Operator review of monthly draft"],
    notes:        "Client is responsive and onboarding is complete.",
  },
  {
    clientId: "demo-b", weekRange: "May 19 – May 25, 2026", status: "Team Review",
    summary: "Mixed week — content supply trending low, but Google visibility held steady.",
    metrics: [
      { label: "Posts published",          value: "2"    },
      { label: "Google profile updates",   value: "1"    },
      { label: "New reviews",              value: "1"    },
      { label: "Approved media remaining", value: "9"    },
      { label: "Visibility estimate",      value: "flat" },
    ],
    topContent:   { title: "Carnitas Tacos flat-lay", engagement: "Solid lunchtime engagement" },
    mediaStatus:  "Trending low — recommend new shoot.",
    nextWeekPlan: ["Coordinate content shoot", "Plan reels for new salsa", "Operator follow-up call"],
    notes:        "Awaiting team review before client delivery.",
  },
  {
    clientId: "demo-c", weekRange: "May 19 – May 25, 2026", status: "Ready for Client",
    summary: "Excellent week — 4 posts, premium media quality, +9 reviews trend continuing.",
    metrics: [
      { label: "Posts published",          value: "4"     },
      { label: "Google profile updates",   value: "2"     },
      { label: "New reviews",              value: "3"     },
      { label: "Approved media remaining", value: "14"    },
      { label: "Visibility estimate",      value: "+5.1%" },
    ],
    topContent:   { title: "Mediterranean Platter", engagement: "Best post of the month" },
    mediaStatus:  "Good supply — premium-quality stock available.",
    nextWeekPlan: ["Schedule Google review follow-up", "Launch olive-oil reels series", "Plan monthly executive draft"],
    notes:        "Client engagement is high.",
  },
  {
    clientId: "demo-d", weekRange: "May 19 – May 25, 2026", status: "Draft",
    summary: "At-risk week — onboarding incomplete and media supply critical. Posting paused.",
    metrics: [
      { label: "Posts published",          value: "0"     },
      { label: "Google profile updates",   value: "0"     },
      { label: "New reviews",              value: "3"     },
      { label: "Approved media remaining", value: "2"     },
      { label: "Visibility estimate",      value: "-2.1%" },
    ],
    topContent:   { title: "No content published", engagement: "—" },
    mediaStatus:  "Critically low — only 2 approved items.",
    nextWeekPlan: ["Request 5 new food photos", "Complete onboarding sections", "Schedule discovery call"],
    notes:        "Owner attention recommended.",
  },
];

// ── Upcoming reports widget ───────────────────────────────────────
export const demoUpcomingReports = [
  { clientId: "demo-b",    type: "Weekly",  status: "Team Review", due: "Today"  },
  { clientId: "demo-a", type: "Weekly",  status: "Team Review", due: "Today"  },
  { clientId: "demo-c", type: "Monthly", status: "Draft",           due: "May 31" },
];

// ── DemoReportOp — future: weekly_reports / monthly_reports (ops view) ──
export type ReportOpStatus =
  | "Not Started" | "Drafting" | "Validation Needed"
  | "Ready to Publish" | "Published" | "Needs Revision";

export interface DemoReportOp {
  id:                      string;
  clientId:                string;
  period:                  string;
  type:                    "Weekly" | "Monthly";
  status:                  ReportOpStatus;
  draftOwner:              string;
  validationOwner:         string;
  publishedDate?:          string;
  metricsSummary:          string;
  internalValidationNote?: string;
  clientFacingSummary:     string;
}

export const demoReportingOps: DemoReportOp[] = [
  { id: "rp1", clientId: "demo-a", period: "May 13–19, 2026", type: "Weekly",  status: "Published",         draftOwner: "Priya",  validationOwner: "Lina",   publishedDate: "May 20", metricsSummary: "5 posts · 3.2k impressions · 4.1% engagement", internalValidationNote: "Clean.", clientFacingSummary: "A strong week — your reels drove most of the reach." },
  { id: "rp2", clientId: "demo-a", period: "May 20–26, 2026", type: "Weekly",  status: "Drafting",          draftOwner: "Priya",  validationOwner: "Lina",                            metricsSummary: "Draft in progress.",                            clientFacingSummary: "Coming Wednesday — preview snapshot inside." },
  { id: "rp3", clientId: "demo-b",    period: "May 13–19, 2026", type: "Weekly",  status: "Validation Needed", draftOwner: "Daniel", validationOwner: "Lina",                            metricsSummary: "4 posts · 2.1k impressions · 3.4% engagement", internalValidationNote: "Awaiting validation 36h.", clientFacingSummary: "Solid week — see breakdown inside." },
  { id: "rp4", clientId: "demo-b",    period: "May 20–26, 2026", type: "Weekly",  status: "Not Started",       draftOwner: "Daniel", validationOwner: "Lina",                            metricsSummary: "—",                                             clientFacingSummary: "Will publish Wednesday." },
  { id: "rp5", clientId: "demo-c", period: "May 13–19, 2026", type: "Weekly",  status: "Ready to Publish",  draftOwner: "Priya",  validationOwner: "Lina",                            metricsSummary: "6 posts · 4.8k impressions · 5.2% engagement", internalValidationNote: "Approved.", clientFacingSummary: "Your best week this quarter — full numbers inside." },
  { id: "rp6", clientId: "demo-c", period: "April 2026",      type: "Monthly", status: "Published",         draftOwner: "Priya",  validationOwner: "Lina",   publishedDate: "May 4",  metricsSummary: "22 posts · 18.6k impressions · 4.7% engagement", internalValidationNote: "Clean.", clientFacingSummary: "Strong month — engagement up MoM. Highlights inside." },
  { id: "rp7", clientId: "demo-d",   period: "May 13–19, 2026", type: "Weekly",  status: "Needs Revision",    draftOwner: "Priya",  validationOwner: "Daniel",                          metricsSummary: "3 posts · 0.9k impressions · 2.1% engagement", internalValidationNote: "Tone needs softening — flagged.", clientFacingSummary: "Quieter week — we'll regroup with you on cadence." },
  { id: "rp8", clientId: "demo-d",   period: "April 2026",      type: "Monthly", status: "Drafting",          draftOwner: "Priya",  validationOwner: "Daniel",                          metricsSummary: "Draft in progress.",                            clientFacingSummary: "Coming next week." },
];

export const reportOpStatusColor: Record<ReportOpStatus, string> = {
  "Not Started":       "border-muted-foreground/40 text-muted-foreground bg-muted/30",
  "Drafting":          "border-sky-500/40 text-sky-300 bg-sky-500/10",
  "Validation Needed": "border-amber-500/40 text-amber-300 bg-amber-500/10",
  "Ready to Publish":  "border-violet-500/40 text-violet-300 bg-violet-500/10",
  "Published":         "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  "Needs Revision":    "border-rose-500/40 text-rose-300 bg-rose-500/10",
};

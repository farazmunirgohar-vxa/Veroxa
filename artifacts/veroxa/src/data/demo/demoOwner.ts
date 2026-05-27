// demoOwner.ts — future: owner-layer business data
// Covers business command center, permissions matrix, automation roadmap,
// system map, daily briefing, and internal operator notes.

// ── BizSeverity / BizCategory — shared severity for owner-layer signals ──
export type BizSeverity = "Critical" | "High" | "Medium" | "Low";
export type BizCategory =
  | "Business Risk"
  | "Growth Opportunity"
  | "Team Bottleneck"
  | "Client Risk"
  | "Revenue Risk"
  | "Operational Warning";

// ── DemoOwnerCommandItem — future: owner_alerts / business_signals ─
export interface DemoOwnerCommandItem {
  id:                string;
  category:          BizCategory;
  severity:          BizSeverity;
  title:             string;
  description:       string;
  recommendedAction: string;
}

export const demoOwnerCommandItems: DemoOwnerCommandItem[] = [
  {
    id: "oc1", category: "Revenue Risk",       severity: "Critical",
    title: "Demo Cafe at risk of churn",
    description: "Critical health status, onboarding stalled, client unresponsive. $1,097 MRR at risk.",
    recommendedAction: "Schedule rescue call this week; consider 30-day extension or service downgrade.",
  },
  {
    id: "oc2", category: "Client Risk",        severity: "High",
    title: "Demo Taco Bar health declining",
    description: "Reports overdue, media supply trending down. Health dropped from 82 → 68 this month.",
    recommendedAction: "Operator intervention plus media-refresh shoot scheduled within 5 business days.",
  },
  {
    id: "oc3", category: "Team Bottleneck",    severity: "High",
    title: "Reporting workload concentration",
    description: "60% of weekly reports flow through Priya. Risk of single-point delay.",
    recommendedAction: "Cross-train Jordan and Ava on Reporting Agent validation by end of month.",
  },
  {
    id: "oc4", category: "Growth Opportunity", severity: "Medium",
    title: "Demo Grill House ready for upsell",
    description: "Healthy metrics, engaged client, 3 months on Complete 6-mo plan. Upgrade to Complete 3-mo = +$100/mo.",
    recommendedAction: "Owner-led upsell conversation about plan benefits and add-on shoot package.",
  },
  {
    id: "oc5", category: "Growth Opportunity", severity: "Medium",
    title: "3 qualified leads in late-stage discovery",
    description: "Discovery calls complete. $3,291 in potential new MRR if all 3 sign.",
    recommendedAction: "Send personalized proposals within 48 hours; offer 14-day onboarding fast track.",
  },
  {
    id: "oc6", category: "Operational Warning", severity: "Medium",
    title: "Onboarding completion below target",
    description: "Portfolio onboarding rate is 76% — below the 90% target. Affects content quality downstream.",
    recommendedAction: "Audit onboarding checklist; introduce a 14-day onboarding SLA for new clients.",
  },
  {
    id: "oc7", category: "Business Risk",      severity: "Low",
    title: "Brand asset library aging",
    description: "Demo Cafe brand guidelines flagged for refresh. Low-priority but recurring across portfolio.",
    recommendedAction: "Annual brand-audit cycle; bundle into onboarding refresh checklist.",
  },
  {
    id: "oc8", category: "Revenue Risk",       severity: "Low",
    title: "No plan upgrades in last 60 days",
    description: "Expansion revenue stagnant. Pro plan has zero upgrades since March.",
    recommendedAction: "Quarterly account-review meetings + upgrade-incentive program.",
  },
];

// ── Permissions matrix — future: rbac_permissions config ─────────
export type RoleAccess = "Full" | "Own Only" | "View" | "None";

export interface DemoPermissionRow {
  module:   string;
  client:   RoleAccess;
  team:     RoleAccess;
  operator: RoleAccess;
  owner:    RoleAccess;
}

export const demoPermissionsMatrix: DemoPermissionRow[] = [
  { module: "Own onboarding",        client: "Full",     team: "View", operator: "Full", owner: "Full" },
  { module: "Own content pipeline",  client: "Own Only", team: "Full", operator: "Full", owner: "Full" },
  { module: "Own weekly reports",    client: "Own Only", team: "View", operator: "Full", owner: "Full" },
  { module: "Own monthly reports",   client: "Own Only", team: "View", operator: "Full", owner: "Full" },
  { module: "Own media library",     client: "Own Only", team: "Full", operator: "Full", owner: "Full" },
  { module: "All clients view",      client: "None",     team: "Full", operator: "Full", owner: "Full" },
  { module: "Content review queue",  client: "None",     team: "Full", operator: "Full", owner: "View" },
  { module: "Team work queue",       client: "None",     team: "Full", operator: "Full", owner: "View" },
  { module: "Report approvals",      client: "None",     team: "View", operator: "Full", owner: "Full" },
  { module: "Risk & alert center",   client: "None",     team: "View", operator: "Full", owner: "Full" },
  { module: "AI agent settings",     client: "None",     team: "None", operator: "View", owner: "Full" },
  { module: "Revenue & billing",     client: "None",     team: "None", operator: "None", owner: "Full" },
  { module: "Team management",       client: "None",     team: "None", operator: "View", owner: "Full" },
  { module: "Business intelligence", client: "None",     team: "None", operator: "View", owner: "Full" },
  { module: "Automation roadmap",    client: "None",     team: "None", operator: "None", owner: "Full" },
];

export const demoRoleResponsibilities = [
  { role: "Client",   summary: "Submit media, approve content, view own performance.",           color: "border-sky-500/40 text-sky-300 bg-sky-500/10"           },
  { role: "Team",     summary: "Execute assigned work — review media, draft captions, publish.", color: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10" },
  { role: "Operator", summary: "Oversee all client operations, validate reports, manage risks.", color: "border-amber-500/40 text-amber-300 bg-amber-500/10"      },
  { role: "Owner",    summary: "Lead the business — revenue, growth, strategy, team.",           color: "border-violet-500/40 text-violet-300 bg-violet-500/10"   },
];

// ── Automation roadmap — future: automation_configs ───────────────
export type AutomationStatus = "Planned" | "Prototype" | "Future Build";

export interface DemoAutomation {
  id:          string;
  name:        string;
  description: string;
  status:      AutomationStatus;
  category:    string;
  targetEta:   string;
}

export const demoAutomationRoadmap: DemoAutomation[] = [
  { id: "a1", name: "Media Review Automation",      description: "Auto-score uploaded media and route to reshoot or approval.",  status: "Prototype",    category: "Content",      targetEta: "Q3 2026" },
  { id: "a2", name: "Caption Automation",           description: "Generate 3 caption variants per post in client voice.",        status: "Prototype",    category: "Content",      targetEta: "Q3 2026" },
  { id: "a3", name: "Scheduling Automation",        description: "Auto-select optimal posting window across platforms.",         status: "Planned",      category: "Operations",   targetEta: "Q4 2026" },
  { id: "a4", name: "Publishing Automation",        description: "Direct publishing to social channels with retry logic.",       status: "Future Build", category: "Operations",   targetEta: "Q1 2027" },
  { id: "a5", name: "Weekly Reporting Automation",  description: "Auto-assemble weekly reports with operator validation.",       status: "Prototype",    category: "Reporting",    targetEta: "Q3 2026" },
  { id: "a6", name: "Monthly Reporting Automation", description: "Auto-assemble monthly reports with narrative highlights.",     status: "Planned",      category: "Reporting",    targetEta: "Q4 2026" },
  { id: "a7", name: "Risk Monitoring Automation",   description: "Continuous monitoring with severity-ranked alerts.",           status: "Planned",      category: "Intelligence", targetEta: "Q4 2026" },
  { id: "a8", name: "Owner Briefing Automation",    description: "Daily owner briefing generated automatically every morning.",  status: "Future Build", category: "Executive",    targetEta: "Q1 2027" },
];

// ── System map — future: architecture reference ───────────────────
export interface DemoSystemLayer {
  id:          string;
  name:        string;
  description: string;
  modules:     string[];
  color:       string;
}

export const demoSystemMap: DemoSystemLayer[] = [
  { id: "client",     name: "Client Layer",            description: "What clients see and interact with.",                modules: ["Onboarding", "Workspace", "Content Pipeline", "Media", "Reports", "Notifications"],                                     color: "border-sky-500/40 bg-sky-500/10"         },
  { id: "team",       name: "Team Layer",              description: "Execution surface for content + media work.",        modules: ["Tasks", "Media Review", "Caption Drafting", "Scheduling", "Drafts"],                                                   color: "border-emerald-500/40 bg-emerald-500/10" },
  { id: "operator",   name: "Operator Layer",          description: "Oversight, validation, and risk management.",        modules: ["Priority Board", "Action Center", "Risk Center", "Reporting Command", "Team Oversight"],                               color: "border-amber-500/40 bg-amber-500/10"     },
  { id: "owner",      name: "Owner Layer",             description: "Strategic, business, and revenue command.",          modules: ["Executive Dashboard", "Command Center", "Revenue", "Daily Briefing"],                                                  color: "border-violet-500/40 bg-violet-500/10"   },
  { id: "ai",         name: "AI Layer",                description: "Simulated intelligence orchestrating the workflow.", modules: ["Media Review", "Content Strategist", "Caption", "Brand Voice", "Scheduling", "Reporting", "Risk", "Operator Asst.", "Owner Asst."], color: "border-primary/40 bg-primary/10"   },
  { id: "reporting",  name: "Reporting Layer",         description: "Weekly + monthly report generation and delivery.",   modules: ["Weekly Reports", "Monthly Reports", "Report Approvals", "Historical Archives"],                                        color: "border-cyan-500/40 bg-cyan-500/10"       },
  { id: "analytics",  name: "Analytics Layer",         description: "Cross-portfolio business intelligence.",             modules: ["BI Center", "Client Analytics", "Media Analytics", "Reporting Analytics", "Operations Intelligence"],                  color: "border-pink-500/40 bg-pink-500/10"       },
  { id: "automation", name: "Future Automation Layer", description: "Planned automations that will close the loop.",      modules: ["Auto Media Review", "Auto Captions", "Auto Scheduling", "Auto Publishing", "Auto Reporting"],                          color: "border-muted-foreground/40 bg-muted/20"  },
];

// ── Owner daily briefing — future: owner_briefings (generated daily) ─
export interface DemoOwnerBriefingSection {
  category: string;
  summary:  string;
  items:    string[];
}

export const demoOwnerBriefing: DemoOwnerBriefingSection[] = [
  {
    category: "Business Summary",
    summary:  "Revenue up 12% MoM. Portfolio stable with 1 at-risk client.",
    items: [
      "MRR: $4,788 (+12% vs. April).",
      "4 active clients across 4 plans.",
      "Retention score 94% — slight dip due to Demo Cafe risk.",
    ],
  },
  {
    category: "Revenue Summary",
    summary:  "Solid growth, $1,097 MRR at churn risk.",
    items: [
      "Projected MRR: $7,785 if 3 qualified leads close.",
      "$1,097 at risk if Demo Cafe churns.",
      "Net pipeline movement: +$2,997 over next 60 days.",
    ],
  },
  {
    category: "Risk Summary",
    summary:  "1 critical, 1 high, 2 medium.",
    items: [
      "Demo Cafe: media + onboarding + inactivity → escalation needed.",
      "Demo Taco Bar: reports overdue, supply trending low → operator intervention.",
      "Team workload concentration on Priya → cross-train this month.",
    ],
  },
  {
    category: "Client Summary",
    summary:  "2 healthy, 1 warning, 1 critical.",
    items: [
      "Demo Grill House — Healthy, upsell candidate.",
      "Demo Mediterranean Grill — Healthy, on track.",
      "Demo Taco Bar — Warning, intervention scheduled.",
      "Demo Cafe — Critical, rescue call this week.",
    ],
  },
  {
    category: "Team Summary",
    summary:  "Utilisation 84%, no immediate burnout signals.",
    items: [
      "4 team members across content, client, media, and captions.",
      "Reporting workload concentrated on Priya — cross-train.",
      "Average turnaround 1.2 days — within SLA.",
    ],
  },
  {
    category: "Recommendations",
    summary:  "Focus the week on rescue, validation, and upsell.",
    items: [
      "Personally call Demo Cafe owner today.",
      "Validate Demo Taco Bar weekly report this morning.",
      "Open upsell conversation with Demo Grill House.",
      "Send proposals to all 3 qualified leads within 48 hours.",
    ],
  },
];

// ── Internal notes — future: internal_notes table ────────────────
export type NoteType =
  | "Client preference"
  | "Risk note"
  | "Content note"
  | "Reporting note"
  | "Operations note";

export interface DemoInternalNote {
  id:         string;
  clientId:   string;
  type:       NoteType;
  author:     string;
  authorRole: "Owner" | "Operator" | "Team";
  timestamp:  string;
  body:       string;
}

export const demoInternalNotes: DemoInternalNote[] = [
  { id: "n1", clientId: "mamadali", type: "Client preference", author: "Lina",   authorRole: "Operator", timestamp: "May 24", body: "Owner prefers reels over carousels. Avoid pricing in captions."             },
  { id: "n2", clientId: "mamadali", type: "Content note",       author: "Priya",  authorRole: "Team",     timestamp: "May 23", body: "New menu launching June 5 — plan a 3-post teaser series."                  },
  { id: "n3", clientId: "urban",    type: "Risk note",          author: "Daniel", authorRole: "Operator", timestamp: "Today",  body: "Owner unresponsive 4 days. Escalate if no reply by EoD Wed."               },
  { id: "n4", clientId: "urban",    type: "Reporting note",     author: "Daniel", authorRole: "Operator", timestamp: "May 24", body: "Weekly report drafted, awaiting validation. Push manually if needed."     },
  { id: "n5", clientId: "crescent", type: "Operations note",    author: "Lina",   authorRole: "Operator", timestamp: "May 22", body: "Olive-oil supplier story is the strongest brand angle this quarter."       },
  { id: "n6", clientId: "alnoor",   type: "Risk note",          author: "Owner",  authorRole: "Owner",    timestamp: "Today",  body: "Rescue plan: 1-on-1 with owner, reset cadence to bi-weekly until trust returns." },
  { id: "n7", clientId: "alnoor",   type: "Content note",       author: "Jordan", authorRole: "Team",     timestamp: "May 18", body: "2 of 4 uploads flagged for reshoot. Storefront shot critical."             },
];

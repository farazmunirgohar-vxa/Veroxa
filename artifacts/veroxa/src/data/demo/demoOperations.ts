// demoOperations.ts — future: team-layer operational data
// Covers work queue, content review queue, team metrics, pipeline stages,
// risk center, action center, AI assistant insights, daily digest, and bottlenecks.

import type { ContentType } from "./demoPosts";
import type { BizSeverity }  from "./demoOwner";

// ── Work queue — future: tasks / work_items ───────────────────────
export type WorkQueueStatus =
  | "Healthy"
  | "Attention Needed"
  | "Waiting On Client"
  | "Ready To Post"
  | "Reporting Due";

export interface DemoWorkQueueItem {
  clientId:     string;
  status:       WorkQueueStatus;
  priority:     "High" | "Medium" | "Low";
  lastActivity: string;
  nextAction:   string;
  assignedTo:   string;
}

export const demoWorkQueue: DemoWorkQueueItem[] = [
  {
    clientId:     "demo-a",
    status:       "Ready To Post",
    priority:     "Medium",
    lastActivity: "Today, 10:48 AM",
    nextAction:   "Final sign-off on Tuesday dinner reel before scheduling.",
    assignedTo:   "Jordan",
  },
  {
    clientId:     "demo-b",
    status:       "Attention Needed",
    priority:     "High",
    lastActivity: "Yesterday, 6:30 PM",
    nextAction:   "Weekly report pending Veroxa team review — follow up today.",
    assignedTo:   "Priya",
  },
  {
    clientId:     "demo-c",
    status:       "Healthy",
    priority:     "Low",
    lastActivity: "Today, 11:02 AM",
    nextAction:   "Schedule olive-oil reel for Thursday evening slot.",
    assignedTo:   "Jordan",
  },
  {
    clientId:     "demo-d",
    status:       "Waiting On Client",
    priority:     "High",
    lastActivity: "May 22",
    nextAction:   "Request 5 new food photos — onboarding still incomplete.",
    assignedTo:   "Priya",
  },
];

// ── Content review queue — future: content_review_queue ──────────
export type ContentReviewStatus =
  | "Pending"
  | "In Review"
  | "Approved"
  | "Needs Revision";

export interface DemoContentReviewItem {
  id:               string;
  title:            string;
  clientId:         string;
  contentType:      ContentType;
  stage:            string;
  aiRecommendation: string;
  assignedReviewer: string;
  dueDate:          string;
  status:           ContentReviewStatus;
}

export const demoContentReviewQueue: DemoContentReviewItem[] = [
  {
    id: "cr1", title: "Chicken Shawarma close-up",   clientId: "demo-a", contentType: "Photo",
    stage: "Team Review",    aiRecommendation: "Strong lighting — approve for dinner-window slot.",
    assignedReviewer: "Jordan", dueDate: "Today",    status: "In Review",
  },
  {
    id: "cr2", title: "Charcoal grill slow-mo reel", clientId: "demo-a", contentType: "Reel",
    stage: "Team Review",    aiRecommendation: "Quality passed — caption draft ready.",
    assignedReviewer: "Jordan", dueDate: "Today",    status: "Pending",
  },
  {
    id: "cr3", title: "BTS — kitchen prep clip",     clientId: "demo-a", contentType: "Story",
    stage: "Caption Drafting", aiRecommendation: "3 caption variants generated — select preferred.",
    assignedReviewer: "Jordan", dueDate: "Tomorrow", status: "Pending",
  },
  {
    id: "cr4", title: "Lunch special reel",          clientId: "demo-b",    contentType: "Reel",
    stage: "AI Review",      aiRecommendation: "Minor brightness issue — review before caption.",
    assignedReviewer: "Priya",  dueDate: "Today",    status: "In Review",
  },
  {
    id: "cr5", title: "Olive oil pour reel",         clientId: "demo-c", contentType: "Reel",
    stage: "Caption Drafting", aiRecommendation: "Editorial caption drafted — tone check passed.",
    assignedReviewer: "Jordan", dueDate: "Tomorrow", status: "Approved",
  },
  {
    id: "cr6", title: "Google review highlight",     clientId: "demo-d",   contentType: "Carousel",
    stage: "Caption Drafting", aiRecommendation: "Caption too generic — rewrite with warmer tone.",
    assignedReviewer: "Priya",  dueDate: "Tomorrow", status: "Needs Revision",
  },
  {
    id: "cr7", title: "Cardamom latte morning shot", clientId: "demo-d",   contentType: "Photo",
    stage: "AI Review",      aiRecommendation: "Lighting strong — proceed to caption stage.",
    assignedReviewer: "Priya",  dueDate: "May 27",   status: "Pending",
  },
];

// ── Team metrics snapshot ─────────────────────────────────────
export const demoOperationsMetrics = {
  totalActiveClients:        4,
  healthyClients:            2,
  clientsRequiringAttention: 2,
  weeklyReportsPending:      3,
  monthlyReportsPending:     1,
  onboardingIssues:          2,
  mediaInventoryWarnings:    2,
  contentPipelineDelays:     1,
};

// ── Pipeline stage counts — future: computed from posts ───────────
export interface DemoPipelineStage {
  stage:    string;
  count:    number;
  change:   string;
  positive: boolean;
}

export const demoPipelineMetrics: DemoPipelineStage[] = [
  { stage: "Media Received",    count: 12, change: "+4 this week",      positive: true  },
  { stage: "In Review",         count: 5,  change: "–2 from last week", positive: false },
  { stage: "Drafting",          count: 7,  change: "+1 today",          positive: true  },
  { stage: "Awaiting Approval", count: 3,  change: "No change",         positive: true  },
  { stage: "Scheduled",         count: 4,  change: "+2 this week",      positive: true  },
  { stage: "Posted",            count: 18, change: "+6 this month",     positive: true  },
];

// ── Risk center — future: risk_alerts ────────────────────────────
export type RiskSeverityLevel = "Critical" | "High" | "Medium" | "Low";

export interface DemoRiskItem {
  id:          string;
  title:       string;
  description: string;
  clientId?:   string;
  severity:    RiskSeverityLevel;
  category:    string;
  time:        string;
}

export const demoRiskItems: DemoRiskItem[] = [
  {
    id: "r1", severity: "Critical", category: "Media",
    title: "Media inventory critically low — Demo Cafe",
    description: "Only 2 approved media items remain. Cannot sustain next week's schedule without emergency shoot.",
    clientId: "demo-d", time: "Today, 8:42 AM",
  },
  {
    id: "r2", severity: "Critical", category: "Onboarding",
    title: "Onboarding blocked — Demo Cafe",
    description: "4 of 8 onboarding steps incomplete, including menu info and brand guidelines. Content quality at risk.",
    clientId: "demo-d", time: "Today, 7:30 AM",
  },
  {
    id: "r3", severity: "High", category: "Reporting",
    title: "Weekly report overdue — Demo Taco Bar",
    description: "Report has been in team validation queue for 28+ hours. Client visibility window missed.",
    clientId: "demo-b", time: "Yesterday, 5:15 PM",
  },
  {
    id: "r4", severity: "High", category: "Client",
    title: "Inactive client — Demo Cafe",
    description: "No client activity detected in 3 days. Emails unanswered. Escalation recommended.",
    clientId: "demo-d", time: "3 days ago",
  },
  {
    id: "r5", severity: "Medium", category: "Media",
    title: "Content supply trending low — Demo Taco Bar",
    description: "9 approved items remaining. At current posting frequency, supply runs out in 14 days.",
    clientId: "demo-b", time: "2 days ago",
  },
  {
    id: "r6", severity: "Medium", category: "Google",
    title: "Google profile photos outdated — Demo Cafe",
    description: "Profile photos are 6+ months old. Affects Google visibility and first impressions.",
    clientId: "demo-d", time: "3 days ago",
  },
  {
    id: "r7", severity: "Low", category: "Content",
    title: "Content backlog forming — Demo Mediterranean Grill",
    description: "3 items in caption drafting stage. Minor delay — no immediate risk.",
    clientId: "demo-c", time: "Today, 9:00 AM",
  },
  {
    id: "r8", severity: "Low", category: "Brand",
    title: "Brand guideline refresh pending — Demo Cafe",
    description: "Logo marked for update. Brand assets should be refreshed before next campaign.",
    clientId: "demo-d", time: "May 20",
  },
];

// ── Team action center — future: team_actions ────────────
export type ActionUrgency = "Immediate" | "Today" | "This Week";

export interface DemoTeamAction {
  id:          string;
  title:       string;
  description: string;
  clientId?:   string;
  urgency:     ActionUrgency;
  category:    string;
}

export const demoTeamActions: DemoTeamAction[] = [
  {
    id: "oa1", urgency: "Immediate", category: "Client",
    title: "Contact Demo Cafe — media emergency",
    description: "Request at least 5 new food photos via WhatsApp and email. Media queue critically low.",
    clientId: "demo-d",
  },
  {
    id: "oa2", urgency: "Immediate", category: "Report",
    title: "Validate Demo Taco Bar weekly report",
    description: "Report sitting in team queue 28+ hours. Approve and publish to unlock client visibility.",
    clientId: "demo-b",
  },
  {
    id: "oa3", urgency: "Today", category: "Onboarding",
    title: "Follow up on Demo Cafe onboarding blockers",
    description: "4 onboarding steps incomplete. Escalate to owner if no response by 5 PM.",
    clientId: "demo-d",
  },
  {
    id: "oa4", urgency: "Today", category: "Content",
    title: "Approve Demo Grill House dinner reel",
    description: "Final sign-off required before Thursday 7 PM posting window. Caption is ready.",
    clientId: "demo-a",
  },
  {
    id: "oa5", urgency: "This Week", category: "Media",
    title: "Schedule media refresh for Demo Taco Bar",
    description: "Content supply dropping. Coordinate a new shoot for next week to replenish 2-week buffer.",
    clientId: "demo-b",
  },
  {
    id: "oa6", urgency: "This Week", category: "Google",
    title: "Update Google Business profile — Demo Cafe",
    description: "Photos are 6 months old. Upload 3–4 new hero images to improve local search visibility.",
    clientId: "demo-d",
  },
  {
    id: "oa7", urgency: "This Week", category: "Report",
    title: "Review Demo Mediterranean Grill monthly report",
    description: "Monthly report due end of week. Verify growth metrics and approve before distribution.",
    clientId: "demo-c",
  },
];

// ── AI team assistant insights ───────────────────────────────
export type AssistantSeverity = "info" | "warning" | "critical";

export interface DemoAssistantInsight {
  id:        string;
  agent:     string;
  insight:   string;
  clientId?: string;
  severity:  AssistantSeverity;
}

export const demoTeamAssistant: DemoAssistantInsight[] = [
  {
    id: "ai1", agent: "Risk Monitoring Agent", severity: "critical",
    insight: "Demo Cafe media inventory may run out within 5 days at current posting frequency.",
    clientId: "demo-d",
  },
  {
    id: "ai2", agent: "Reporting Agent", severity: "critical",
    insight: "Demo Taco Bar monthly report validation is overdue by 28 hours. Immediate team action required.",
    clientId: "demo-b",
  },
  {
    id: "ai3", agent: "Content Strategist Agent", severity: "warning",
    insight: "Demo Taco Bar posting consistency dropped to 3 posts/week vs. 5 target. Recommend scheduling emergency content.",
    clientId: "demo-b",
  },
  {
    id: "ai4", agent: "Media Review Agent", severity: "warning",
    insight: "Recommend requesting additional video content for Demo Cafe — only photo assets in queue.",
    clientId: "demo-d",
  },
  {
    id: "ai5", agent: "Scheduling Agent", severity: "info",
    insight: "Demo Grill House Thursday dinner slot is pre-loaded. Final content sign-off needed by noon.",
    clientId: "demo-a",
  },
  {
    id: "ai6", agent: "Content Strategist Agent", severity: "info",
    insight: "Demo Mediterranean Grill olive oil reel is on track. Caption approved. No action needed.",
    clientId: "demo-c",
  },
  {
    id: "ai7", agent: "Risk Monitoring Agent", severity: "warning",
    insight: "Portfolio-level media supply is 18% below the recommended 3-week buffer. Review all client queues.",
  },
  {
    id: "ai8", agent: "Reporting Agent", severity: "info",
    insight: "3 weekly reports are pending for this cycle. 1 is team-ready, 2 need validation.",
  },
];

// ── Daily digest ──────────────────────────────────────────────────
export interface DemoDailyDigestSection {
  category: string;
  items:    string[];
}

export const demoDailyDigest: DemoDailyDigestSection[] = [
  {
    category: "Today's Priorities",
    items: [
      "Validate Demo Taco Bar weekly report — 28 hours overdue.",
      "Approve Demo Grill House dinner reel before noon (Thursday window).",
      "Contact Demo Cafe re: media emergency — 2 items remaining.",
    ],
  },
  {
    category: "Urgent Alerts",
    items: [
      "Demo Cafe: media critically low — 2 approved items. Risk of posting gap next week.",
      "Demo Taco Bar: weekly report stuck in team queue.",
      "Demo Cafe: client unresponsive for 3 days — escalation may be needed.",
    ],
  },
  {
    category: "Clients Needing Attention",
    items: [
      "Demo Cafe — Critical: media low, onboarding incomplete, client inactive.",
      "Demo Taco Bar — High: report overdue, content supply trending down.",
    ],
  },
  {
    category: "Reports Due",
    items: [
      "Demo Taco Bar weekly report — validate and publish today.",
      "Demo Grill House weekly report — in draft, review by Friday.",
      "Demo Mediterranean Grill monthly report — due by end of week.",
    ],
  },
  {
    category: "Media Shortages",
    items: [
      "Demo Cafe: 2 approved items — critical shortage.",
      "Demo Taco Bar: 9 items — 14-day supply at current pace.",
    ],
  },
  {
    category: "Pipeline Bottlenecks",
    items: [
      "5 items stuck in 'In Review' — review queue needs attention.",
      "3 caption items awaiting Veroxa team review before scheduling.",
    ],
  },
];

// ── Bottlenecks — future: computed from tasks / pipeline stages ───
export type BottleneckType =
  | "Media Review Overdue"
  | "Caption Drafting Delayed"
  | "Report Validation Pending"
  | "Client Has Not Uploaded"
  | "Onboarding Incomplete"
  | "Content Queue Below Target";

export interface DemoBottleneck {
  id:                string;
  type:              BottleneckType;
  clientId:          string;
  severity:          BizSeverity;
  detail:            string;
  recommendedAction: string;
}

export const demoBottlenecks: DemoBottleneck[] = [
  { id: "b1", type: "Caption Drafting Delayed",   clientId: "demo-b",    severity: "High",     detail: "Caption flagged by Brand Voice Agent 22h ago — no rewrite yet.",  recommendedAction: "Reassign to Ava with 4h SLA."                       },
  { id: "b2", type: "Client Has Not Uploaded",    clientId: "demo-d",   severity: "Critical", detail: "No uploads in 9 days. 5 days of content runway left.",            recommendedAction: "Trigger reshoot brief and book rescue call."          },
  { id: "b3", type: "Report Validation Pending",  clientId: "demo-b",    severity: "High",     detail: "Weekly report drafted 36h ago. Validation owner offline.",        recommendedAction: "Reassign validation to Lina (team)."             },
  { id: "b4", type: "Onboarding Incomplete",      clientId: "demo-b",    severity: "Medium",   detail: "Posting-window preferences still missing.",                       recommendedAction: "Send client request reminder; followup in 48h."       },
  { id: "b5", type: "Content Queue Below Target", clientId: "demo-d",   severity: "Critical", detail: "Only 2 scheduled posts vs target of 6.",                          recommendedAction: "Block out catch-up cadence after reshoot lands."      },
  { id: "b6", type: "Media Review Overdue",       clientId: "demo-d",   severity: "Medium",   detail: "4 uploads from May 15 still in Media Review.",                    recommendedAction: "Jordan to clear backlog before EoD."                  },
];

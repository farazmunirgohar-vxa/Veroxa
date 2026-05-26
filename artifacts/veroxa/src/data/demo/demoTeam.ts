// demoTeam.ts — future: team_members / user table
// Covers team member profiles, performance, alerts, and oversight rows.

// ── DemoTeamMember — future: team_members / users ────────────────
export interface DemoTeamMember {
  name:              string;
  role:              string;
  clientsManaged:    number;
  reportsCompleted:  number;
  contentApproved:   number;
  avgTurnaround:     string;
  clientHealthScore: number;
}

export const demoTeamMembers: DemoTeamMember[] = [
  { name: "Jordan", role: "Content Lead",      clientsManaged: 2, reportsCompleted: 8,  contentApproved: 34, avgTurnaround: "1.2 days", clientHealthScore: 85 },
  { name: "Priya",  role: "Client Manager",    clientsManaged: 2, reportsCompleted: 6,  contentApproved: 21, avgTurnaround: "1.6 days", clientHealthScore: 71 },
  { name: "Marcus", role: "Media Reviewer",    clientsManaged: 3, reportsCompleted: 4,  contentApproved: 48, avgTurnaround: "0.9 days", clientHealthScore: 82 },
  { name: "Ava",    role: "Caption Specialist", clientsManaged: 2, reportsCompleted: 10, contentApproved: 29, avgTurnaround: "1.1 days", clientHealthScore: 90 },
];

// ── Team alerts — future: notifications (team-targeted) ──────────
export type AlertSeverity = "Critical" | "High" | "Medium" | "Low";
export type AlertCategory = "Media" | "Report" | "Google" | "Onboarding" | "Brand";

export interface DemoTeamAlert {
  id:          string;
  title:       string;
  description: string;
  clientId?:   string;
  severity:    AlertSeverity;
  time:        string;
  category:    AlertCategory;
}

export const demoTeamAlerts: DemoTeamAlert[] = [
  {
    id: "ta1", severity: "Critical", category: "Media",
    title: "Media inventory critically low",
    description: "Al Noor Cafe has only 2 approved items. Next week's posting queue is at risk.",
    clientId: "alnoor", time: "Today, 8:42 AM",
  },
  {
    id: "ta2", severity: "Critical", category: "Onboarding",
    title: "Onboarding stalled — 4 steps missing",
    description: "Al Noor Cafe onboarding is 55% complete. Menu info and brand guidelines are missing.",
    clientId: "alnoor", time: "Today, 7:30 AM",
  },
  {
    id: "ta3", severity: "High", category: "Report",
    title: "Weekly report overdue — operator not reviewed",
    description: "Urban Tacos weekly report has been in operator queue for 28 hours without review.",
    clientId: "urban", time: "Yesterday, 5:15 PM",
  },
  {
    id: "ta4", severity: "High", category: "Media",
    title: "Content supply trending low",
    description: "Urban Tacos media supply dropped to 9 approved items. Recommend scheduling a shoot.",
    clientId: "urban", time: "2 days ago",
  },
  {
    id: "ta5", severity: "Medium", category: "Report",
    title: "Scheduled post requires final approval",
    description: "Mamadali Kebab House dinner reel is ready but awaiting team sign-off before publish.",
    clientId: "mamadali", time: "Today, 10:48 AM",
  },
  {
    id: "ta6", severity: "Medium", category: "Google",
    title: "Google Business Profile update needed",
    description: "Al Noor Cafe profile photos are 6 months old. Recommend updating with fresh media.",
    clientId: "alnoor", time: "3 days ago",
  },
  {
    id: "ta7", severity: "Low", category: "Brand",
    title: "Brand guideline — logo refresh pending",
    description: "Al Noor Cafe logo marked for refresh. Brand assets should be updated before next campaign.",
    clientId: "alnoor", time: "May 20",
  },
  {
    id: "ta8", severity: "Low", category: "Onboarding",
    title: "Social media access unconfirmed",
    description: "Urban Tacos social access status is 'In Progress' — confirm before next posting cycle.",
    clientId: "urban", time: "May 21",
  },
];

// ── Team metrics snapshot ─────────────────────────────────────────
export const demoTeamMetrics = {
  activeClients:            4,
  clientsNeedingAttention:  2,
  contentWaitingReview:     5,
  reportsDueThisWeek:       3,
  mediaInventoryAlerts:     2,
  tasksDueToday:            7,
};

// ── Team oversight table — future: computed from tasks + team_members
export interface DemoTeamOversightRow {
  name:                  string;
  role:                  string;
  assignedClientIds:     string[];
  openTasks:             number;
  completedTasks:        number;
  contentAwaitingReview: number;
  reportWorkload:        number;
}

export const demoTeamOversight: DemoTeamOversightRow[] = [
  { name: "Jordan", role: "Content Lead",      assignedClientIds: ["mamadali", "crescent"],         openTasks: 4, completedTasks: 12, contentAwaitingReview: 3, reportWorkload: 2 },
  { name: "Priya",  role: "Client Manager",    assignedClientIds: ["urban", "alnoor"],              openTasks: 6, completedTasks: 8,  contentAwaitingReview: 4, reportWorkload: 3 },
  { name: "Marcus", role: "Media Reviewer",    assignedClientIds: ["mamadali", "urban", "crescent"],openTasks: 3, completedTasks: 19, contentAwaitingReview: 7, reportWorkload: 1 },
  { name: "Ava",    role: "Caption Specialist", assignedClientIds: ["mamadali", "alnoor"],           openTasks: 2, completedTasks: 14, contentAwaitingReview: 2, reportWorkload: 4 },
];

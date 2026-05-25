// Central demo data source for Veroxa staged features (Client Health,
// Notification Center, Owner Command Center). All data is illustrative —
// no live backend, analytics, or automation is connected.

export type HealthLevel = "healthy" | "attention" | "critical";
export type NotificationCategory = "critical" | "warning" | "info" | "success";
export type ActivityRole =
  | "client"
  | "team"
  | "operator"
  | "owner"
  | "agent"
  | "system";

export interface DemoRestaurant {
  id: string;
  name: string;
  cuisine: string;
  assignedTeam: string;
  assignedOperator: string;
}

export interface DemoClientHealth {
  clientId: string;
  level: HealthLevel;
  score: number;
  mainIssue: string;
  recommendedAction: string;
  lastActivity: string;
  signals: {
    mediaInventory: { value: number; max: number; note: string };
    postingConsistency: { label: string; status: "good" | "warn" | "bad" };
    googleVisibility: { score: number; trend: "up" | "flat" | "down" };
    reviewActivity: { recent: number; note: string };
    onboardingComplete: number;
    reportStatus: "Approved" | "Pending" | "Draft" | "Overdue";
  };
}

export interface DemoNotification {
  id: string;
  title: string;
  clientId: string;
  category: NotificationCategory;
  priority: "P1" | "P2" | "P3";
  time: string;
  description: string;
  suggestedAction: string;
}

export interface DemoActivityEvent {
  id: string;
  timestamp: string;
  eventType: string;
  clientId: string;
  description: string;
  status: "completed" | "in_progress" | "warning";
  role: ActivityRole;
}

// ── Restaurants ──────────────────────────────────────────────────
export const demoRestaurants: DemoRestaurant[] = [
  { id: "mamadali", name: "Mamadali Kebab House", cuisine: "Modern Levantine",      assignedTeam: "Team A", assignedOperator: "Lina"   },
  { id: "urban",    name: "Urban Tacos",          cuisine: "Mexican street food",   assignedTeam: "Team B", assignedOperator: "Daniel" },
  { id: "crescent", name: "Crescent Grill",       cuisine: "Mediterranean grill",   assignedTeam: "Team A", assignedOperator: "Lina"   },
  { id: "alnoor",   name: "Al Noor Cafe",         cuisine: "Specialty cafe",        assignedTeam: "Team C", assignedOperator: "Daniel" },
];

// ── Client Health ────────────────────────────────────────────────
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

// ── Notifications ────────────────────────────────────────────────
export const demoNotifications: DemoNotification[] = [
  {
    id: "n1", title: "Low media inventory", clientId: "alnoor",
    category: "critical", priority: "P1", time: "Today, 8:42 AM",
    description: "Al Noor Cafe has only 2 approved media items remaining. Next week's posting schedule is at risk.",
    suggestedAction: "Request 5 new food photos from the restaurant team this week.",
  },
  {
    id: "n2", title: "Onboarding incomplete", clientId: "alnoor",
    category: "critical", priority: "P1", time: "Today, 7:30 AM",
    description: "Al Noor Cafe onboarding is missing menu photos and brand tone notes (55% complete).",
    suggestedAction: "Follow up with restaurant owner to complete onboarding sections.",
  },
  {
    id: "n3", title: "Weekly report ready for review", clientId: "urban",
    category: "warning", priority: "P2", time: "Yesterday, 5:15 PM",
    description: "Urban Tacos weekly report has been generated and is awaiting operator review before sending to the client.",
    suggestedAction: "Open the report, verify content, and approve for delivery.",
  },
  {
    id: "n4", title: "Scheduled post needs final review", clientId: "mamadali",
    category: "warning", priority: "P2", time: "Today, 10:48 AM",
    description: "One scheduled post for Mamadali Kebab House requires final team sign-off before its dinner-window publish time.",
    suggestedAction: "Review the draft and approve scheduling.",
  },
  {
    id: "n5", title: "3 new Google reviews", clientId: "alnoor",
    category: "success", priority: "P3", time: "Today, 9:20 AM",
    description: "Al Noor Cafe received 3 new positive Google reviews this week (4–5 stars).",
    suggestedAction: "Send a brief thank-you note to the client.",
  },
  {
    id: "n6", title: "Posting consistency dipped", clientId: "urban",
    category: "warning", priority: "P2", time: "2 days ago",
    description: "Urban Tacos posted only 2 of 4 planned items this week. Media supply is trending low.",
    suggestedAction: "Plan a content shoot or request reels footage.",
  },
  {
    id: "n7", title: "Onboarding completed", clientId: "crescent",
    category: "info", priority: "P3", time: "3 days ago",
    description: "Crescent Grill completed all onboarding sections. Account is ready for the next reporting cycle.",
    suggestedAction: "No action needed.",
  },
];

// ── Activity Timeline ────────────────────────────────────────────
export const demoActivityEvents: DemoActivityEvent[] = [
  { id: "a1",  timestamp: "Today, 11:02 AM",   eventType: "Report generated",         clientId: "crescent", description: "Weekly report draft created for review.",                            status: "in_progress", role: "agent"    },
  { id: "a2",  timestamp: "Today, 10:48 AM",   eventType: "Post scheduled",           clientId: "mamadali", description: "Chicken Shawarma reel scheduled for Tuesday 6:30 PM dinner window.", status: "in_progress", role: "team"     },
  { id: "a3",  timestamp: "Today, 9:20 AM",    eventType: "Review received",          clientId: "alnoor",   description: "3 new Google reviews received (4–5 stars).",                         status: "completed",   role: "system"   },
  { id: "a4",  timestamp: "Today, 9:15 AM",    eventType: "Media reviewed",           clientId: "mamadali", description: "Approved 8 of 12 uploaded photos. 2 blurry, 2 duplicates.",          status: "completed",   role: "agent"    },
  { id: "a5",  timestamp: "Yesterday, 6:30 PM",eventType: "Draft created",            clientId: "urban",    description: "Caption Agent generated 3 caption options for taco lunch promo.",     status: "completed",   role: "agent"    },
  { id: "a6",  timestamp: "Yesterday, 5:15 PM",eventType: "Weekly report generated",  clientId: "urban",    description: "Weekly report compiled and queued for operator review.",             status: "in_progress", role: "agent"    },
  { id: "a7",  timestamp: "Yesterday, 2:00 PM",eventType: "Post published",           clientId: "crescent", description: "Mediterranean platter post published to Instagram and Facebook.",     status: "completed",   role: "team"     },
  { id: "a8",  timestamp: "May 23",            eventType: "Google profile updated",   clientId: "crescent", description: "Updated business hours and added 4 new menu photos.",                status: "completed",   role: "team"     },
  { id: "a9",  timestamp: "May 22",            eventType: "Operator reviewed report", clientId: "mamadali", description: "Operator approved last week's report and sent to client.",           status: "completed",   role: "operator" },
  { id: "a10", timestamp: "May 22",            eventType: "Client notification sent", clientId: "urban",    description: "Weekly update email delivered to client contact.",                   status: "completed",   role: "system"   },
];

// ── KPI Snapshots ────────────────────────────────────────────────
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

// ── AI Agent Summary (Owner Command Center widget) ───────────────
export const demoAiAgentSummary = {
  agentsInDemoMode:     10,
  recentPreviewOutputs: 6,
  alertsGenerated:      2,
};

// ── Upcoming Reports (Owner Command Center widget) ───────────────
export const demoUpcomingReports = [
  { clientId: "urban",    type: "Weekly",  status: "Operator Review", due: "Today"  },
  { clientId: "mamadali", type: "Weekly",  status: "Operator Review", due: "Today"  },
  { clientId: "crescent", type: "Monthly", status: "Draft",           due: "May 31" },
];

// ── Helpers ──────────────────────────────────────────────────────
export function getRestaurant(id: string): DemoRestaurant | undefined {
  return demoRestaurants.find((r) => r.id === id);
}

export function getRestaurantName(id: string): string {
  return getRestaurant(id)?.name ?? id;
}

export const healthLevelOrder: Record<HealthLevel, number> = {
  critical:  0,
  attention: 1,
  healthy:   2,
};

export function sortByHealthLevel<T extends { level: HealthLevel }>(arr: T[]): T[] {
  return [...arr].sort(
    (a, b) => healthLevelOrder[a.level] - healthLevelOrder[b.level]
  );
}

export const notificationCategoryOrder: Record<NotificationCategory, number> = {
  critical: 0,
  warning:  1,
  success:  2,
  info:     3,
};

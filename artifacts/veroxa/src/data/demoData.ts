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

// ── AI Agents (Prompt 2) ─────────────────────────────────────────
export interface DemoAgent {
  id: string;
  name: string;
  purpose: string;
  exampleOutput: string;
  confidence: number;
  lastActivity: string;
  relatedClientId?: string;
  workflowStage: string;
}

export const demoAgents: DemoAgent[] = [
  { id: "media-review",       name: "Media Review Agent",        purpose: "Scores uploaded media for lighting, blur, food visibility, and duplicate risk.",                exampleOutput: "Reviewed 12 uploaded photos. 8 approved, 2 blurry, 2 duplicates.",                  confidence: 94, lastActivity: "Today, 9:15 AM",     relatedClientId: "mamadali", workflowStage: "Media intake"      },
  { id: "content-strategist", name: "Content Strategist Agent",  purpose: "Suggests content angles — product spotlight, family meal, behind-the-scenes, review highlight, or promotion.", exampleOutput: "Recommended 4 content angles for Crescent Grill weekend coverage.",                  confidence: 88, lastActivity: "Today, 8:20 AM",     relatedClientId: "crescent", workflowStage: "Planning"          },
  { id: "caption",            name: "Caption Agent",             purpose: "Creates Safe, Engagement, and Sales caption options for the selected concept.",                exampleOutput: "Generated 3 caption options for Chicken Shawarma lunch promotion.",                  confidence: 91, lastActivity: "Yesterday, 6:30 PM", relatedClientId: "mamadali", workflowStage: "Drafting"          },
  { id: "brand-voice",        name: "Brand Voice Agent",         purpose: "Checks captions sound premium, clear, restaurant-focused, and not too generic.",               exampleOutput: "Tone check passed on 5 of 6 drafts. 1 flagged as too generic.",                      confidence: 90, lastActivity: "Yesterday, 6:35 PM", relatedClientId: "urban",    workflowStage: "Quality check"     },
  { id: "scheduling",         name: "Scheduling Agent",          purpose: "Suggests posting slots based on the client's preferred windows and content balance.",           exampleOutput: "Recommended Tuesday 6:30 PM based on dinner engagement patterns.",                   confidence: 86, lastActivity: "Today, 10:48 AM",    relatedClientId: "mamadali", workflowStage: "Scheduling"        },
  { id: "publishing",         name: "Publishing Agent",          purpose: "Coordinates the publish queue and handles retry suggestions for failed posts.",                exampleOutput: "4 posts queued for publication. 1 post recommended for reschedule.",                 confidence: 82, lastActivity: "Today, 11:00 AM",    relatedClientId: "crescent", workflowStage: "Publishing"        },
  { id: "reporting",          name: "Reporting Agent",           purpose: "Compiles weekly and monthly client reports from demo signals.",                                exampleOutput: "Weekly visibility improved by an estimated 8.4%.",                                   confidence: 89, lastActivity: "Today, 11:02 AM",    relatedClientId: "urban",    workflowStage: "Reporting"         },
  { id: "alert-risk",         name: "Alert & Risk Agent",        purpose: "Flags low content supply, failed posts, or client health risks before they escalate.",          exampleOutput: "Client has fewer than 3 approved media items remaining.",                            confidence: 96, lastActivity: "Today, 8:42 AM",     relatedClientId: "alnoor",   workflowStage: "Risk monitoring"   },
  { id: "operator-assistant", name: "Operator Assistant",        purpose: "Surfaces what the operator should review next across the portfolio.",                          exampleOutput: "2 reports awaiting your approval. 1 critical media risk to confirm.",                confidence: 87, lastActivity: "Today, 7:55 AM",                                  workflowStage: "Operator workflow" },
  { id: "owner-assistant",    name: "Owner Assistant",           purpose: "Summarises portfolio health for the owner in plain language.",                                 exampleOutput: "3 clients healthy, 1 client needs attention because media inventory is low.",        confidence: 93, lastActivity: "Today, 8:00 AM",                                  workflowStage: "Executive summary" },
];

// ── Media Inventory (Prompt 7) ───────────────────────────────────
export type MediaStatus =
  | "Approved" | "Pending Review" | "Blurry" | "Duplicate"
  | "Scheduled" | "Used" | "Reserved";
export type MediaType = "Photo" | "Video";

export interface DemoMediaItem {
  id: string;
  clientId: string;
  type: MediaType;
  title: string;
  status: MediaStatus;
  qualityNote: string;
  suggestedUse: string;
  campaign?: string;
  dateAdded: string;
}

export const demoMediaItems: DemoMediaItem[] = [
  { id: "mi1",  clientId: "mamadali", type: "Photo", title: "Mixed grill platter — overhead", status: "Approved",       qualityNote: "Good lighting, strong food close-up", suggestedUse: "Use for weekend promotion",       campaign: "Family Platter Weekend", dateAdded: "May 22" },
  { id: "mi2",  clientId: "mamadali", type: "Photo", title: "Chicken shawarma plate",         status: "Scheduled",      qualityNote: "Crisp focus, vibrant colour",         suggestedUse: "Tuesday dinner slot",             campaign: "Lunch Promo",            dateAdded: "May 21" },
  { id: "mi3",  clientId: "mamadali", type: "Video", title: "Charcoal grill — slow-mo clip",  status: "Approved",       qualityNote: "Strong action shot",                  suggestedUse: "Reels — kitchen series",                                              dateAdded: "May 20" },
  { id: "mi4",  clientId: "mamadali", type: "Photo", title: "Lamb kebab close-up",            status: "Pending Review", qualityNote: "Pending operator review",             suggestedUse: "Maybe Friday feature",                                                dateAdded: "May 23" },
  { id: "mi5",  clientId: "mamadali", type: "Photo", title: "Saffron rice — angle 2",         status: "Duplicate",      qualityNote: "Duplicate angle",                     suggestedUse: "Archive",                                                             dateAdded: "May 23" },
  { id: "mi6",  clientId: "urban",    type: "Photo", title: "Carnitas tacos flat-lay",        status: "Approved",       qualityNote: "Good for lunch special",              suggestedUse: "Lunch hour slot",                 campaign: "Taco Tuesday",           dateAdded: "May 18" },
  { id: "mi7",  clientId: "urban",    type: "Photo", title: "Salsa bar — overhead",           status: "Pending Review", qualityNote: "Bright but slight motion blur",       suggestedUse: "Story content",                                                       dateAdded: "May 22" },
  { id: "mi8",  clientId: "urban",    type: "Video", title: "Tortilla press — short clip",    status: "Reserved",       qualityNote: "Reserved for next month brand story", suggestedUse: "Reels",                                                               dateAdded: "May 17" },
  { id: "mi9",  clientId: "urban",    type: "Photo", title: "Sidewalk patio",                 status: "Used",           qualityNote: "Published 5 days ago",                suggestedUse: "—",                                                                   dateAdded: "May 10" },
  { id: "mi10", clientId: "crescent", type: "Photo", title: "Mediterranean platter",          status: "Used",           qualityNote: "Published Yesterday",                 suggestedUse: "—",                               campaign: "Weekend Feature",        dateAdded: "May 19" },
  { id: "mi11", clientId: "crescent", type: "Photo", title: "Grilled octopus close-up",       status: "Approved",       qualityNote: "Premium magazine-quality shot",       suggestedUse: "Hero post",                                                           dateAdded: "May 20" },
  { id: "mi12", clientId: "crescent", type: "Video", title: "Olive oil pour",                 status: "Scheduled",      qualityNote: "Atmospheric, ideal for reels",        suggestedUse: "Thursday evening",                                                    dateAdded: "May 21" },
  { id: "mi13", clientId: "alnoor",   type: "Photo", title: "Specialty latte art",            status: "Approved",       qualityNote: "Crisp, slightly cool tone",           suggestedUse: "Morning slot",                                                        dateAdded: "May 14" },
  { id: "mi14", clientId: "alnoor",   type: "Photo", title: "Storefront — late afternoon",    status: "Approved",       qualityNote: "Warm light",                          suggestedUse: "Google profile",                                                      dateAdded: "May 12" },
  { id: "mi15", clientId: "alnoor",   type: "Photo", title: "Cookies tray — top-down",        status: "Blurry",         qualityNote: "Blurry, needs replacement",           suggestedUse: "Reshoot",                                                             dateAdded: "May 22" },
];

export function getMediaSummary() {
  const total          = demoMediaItems.length;
  const approved       = demoMediaItems.filter((m) => m.status === "Approved").length;
  const pendingReview  = demoMediaItems.filter((m) => m.status === "Pending Review").length;
  const scheduledWeek  = demoMediaItems.filter((m) => m.status === "Scheduled").length;
  const lowInvClients  = demoClientHealth.filter((c) => c.signals.mediaInventory.value <= 10).length;
  return { total, approved, pendingReview, scheduledWeek, lowInvClients };
}

// ── Weekly Reports (Prompt 8) ────────────────────────────────────
export type WeeklyReportStatus =
  | "Draft" | "Operator Review" | "Ready for Client" | "Published";

export interface DemoWeeklyReport {
  clientId: string;
  weekRange: string;
  status: WeeklyReportStatus;
  summary: string;
  metrics: { label: string; value: string }[];
  topContent: { title: string; engagement: string };
  mediaStatus: string;
  nextWeekPlan: string[];
  notes: string;
}

export const demoWeeklyReports: DemoWeeklyReport[] = [
  {
    clientId: "mamadali", weekRange: "May 19 – May 25, 2026", status: "Ready for Client",
    summary: "A strong week — 5 posts published, 3 new Google reviews, and visibility improving across search.",
    metrics: [
      { label: "Posts published",           value: "5"     },
      { label: "Google profile updates",    value: "2"     },
      { label: "New reviews",               value: "3"     },
      { label: "Approved media remaining",  value: "12"    },
      { label: "Visibility estimate",       value: "+8.4%" },
    ],
    topContent:   { title: "Chicken Shawarma Reel", engagement: "Top engagement of the week" },
    mediaStatus:  "Healthy supply — 12 approved items remaining.",
    nextWeekPlan: ["Schedule weekend family-platter promo", "Shoot 2 reels for new menu item", "Operator review of monthly draft"],
    notes:        "Client is responsive and onboarding is complete.",
  },
  {
    clientId: "urban", weekRange: "May 19 – May 25, 2026", status: "Operator Review",
    summary: "Mixed week — content supply trending low, but Google visibility held steady.",
    metrics: [
      { label: "Posts published",           value: "2"    },
      { label: "Google profile updates",    value: "1"    },
      { label: "New reviews",               value: "1"    },
      { label: "Approved media remaining",  value: "9"    },
      { label: "Visibility estimate",       value: "flat" },
    ],
    topContent:   { title: "Carnitas Tacos flat-lay", engagement: "Solid lunchtime engagement" },
    mediaStatus:  "Trending low — recommend new shoot.",
    nextWeekPlan: ["Coordinate content shoot", "Plan reels for new salsa", "Operator follow-up call"],
    notes:        "Awaiting operator review before client delivery.",
  },
  {
    clientId: "crescent", weekRange: "May 19 – May 25, 2026", status: "Ready for Client",
    summary: "Excellent week — 4 posts, premium media quality, +9 reviews trend continuing.",
    metrics: [
      { label: "Posts published",           value: "4"     },
      { label: "Google profile updates",    value: "2"     },
      { label: "New reviews",               value: "3"     },
      { label: "Approved media remaining",  value: "14"    },
      { label: "Visibility estimate",       value: "+5.1%" },
    ],
    topContent:   { title: "Mediterranean Platter", engagement: "Best post of the month" },
    mediaStatus:  "Good supply — premium-quality stock available.",
    nextWeekPlan: ["Schedule Google review follow-up", "Launch olive-oil reels series", "Plan monthly executive draft"],
    notes:        "Client engagement is high.",
  },
  {
    clientId: "alnoor", weekRange: "May 19 – May 25, 2026", status: "Draft",
    summary: "At-risk week — onboarding incomplete and media supply critical. Posting paused.",
    metrics: [
      { label: "Posts published",           value: "0"     },
      { label: "Google profile updates",    value: "0"     },
      { label: "New reviews",               value: "3"     },
      { label: "Approved media remaining",  value: "2"     },
      { label: "Visibility estimate",       value: "-2.1%" },
    ],
    topContent:   { title: "No content published", engagement: "—" },
    mediaStatus:  "Critically low — only 2 approved items.",
    nextWeekPlan: ["Request 5 new food photos", "Complete onboarding sections", "Schedule discovery call"],
    notes:        "Owner attention recommended.",
  },
];

// ── Monthly Reports (Prompt 9) ───────────────────────────────────
export interface DemoMonthlyReport {
  clientId: string;
  monthLabel: string;
  growthOverview: string;
  contentPerformance: { label: string; value: string }[];
  visibilityTrend:    { label: string; value: number }[];
  reviewsTrend:       { label: string; value: number }[];
  postingConsistency: { label: string; value: number }[];
  inventoryTrend:     { label: string; value: number }[];
  healthSummary: string;
  strategicNotes: string[];
  nextMonthFocus: string[];
}

export const demoMonthlyReports: DemoMonthlyReport[] = [
  {
    clientId: "mamadali", monthLabel: "May 2026",
    growthOverview: "Google visibility improved from 74% to 82%. Reviews increased by 9 this month. 22 posts were published.",
    contentPerformance: [
      { label: "Posts published",     value: "22"                     },
      { label: "Best post",           value: "Chicken Shawarma Reel"  },
      { label: "Engagement estimate", value: "+12%"                   },
    ],
    visibilityTrend:    [{ label: "W1", value: 74 }, { label: "W2", value: 76 }, { label: "W3", value: 79 }, { label: "W4", value: 82 }],
    reviewsTrend:       [{ label: "W1", value: 1  }, { label: "W2", value: 3  }, { label: "W3", value: 2  }, { label: "W4", value: 3  }],
    postingConsistency: [{ label: "W1", value: 5  }, { label: "W2", value: 6  }, { label: "W3", value: 6  }, { label: "W4", value: 5  }],
    inventoryTrend:     [{ label: "W1", value: 24 }, { label: "W2", value: 20 }, { label: "W3", value: 18 }, { label: "W4", value: 18 }],
    healthSummary:  "Healthy. Posting consistent, media inventory steady.",
    strategicNotes: ["Family platter campaign performed best", "Reels engagement outpaced static posts"],
    nextMonthFocus: ["Test paid reach for top-performing reels", "Plan menu-launch campaign", "Maintain shoot cadence"],
  },
  {
    clientId: "urban", monthLabel: "May 2026",
    growthOverview: "Visibility held steady at ~71%. Reviews flat. 12 posts published — under target.",
    contentPerformance: [
      { label: "Posts published",     value: "12"                       },
      { label: "Best post",           value: "Carnitas Tacos flat-lay"  },
      { label: "Engagement estimate", value: "+3%"                      },
    ],
    visibilityTrend:    [{ label: "W1", value: 72 }, { label: "W2", value: 71 }, { label: "W3", value: 70 }, { label: "W4", value: 71 }],
    reviewsTrend:       [{ label: "W1", value: 2  }, { label: "W2", value: 1  }, { label: "W3", value: 1  }, { label: "W4", value: 1  }],
    postingConsistency: [{ label: "W1", value: 3  }, { label: "W2", value: 4  }, { label: "W3", value: 3  }, { label: "W4", value: 2  }],
    inventoryTrend:     [{ label: "W1", value: 14 }, { label: "W2", value: 12 }, { label: "W3", value: 10 }, { label: "W4", value: 9  }],
    healthSummary:  "Attention needed — media supply trending low.",
    strategicNotes: ["Posting cadence dipped end of month", "Operator review still pending on latest weekly"],
    nextMonthFocus: ["Coordinate fresh shoot", "Plan reels strategy", "Operator follow-up call"],
  },
  {
    clientId: "crescent", monthLabel: "May 2026",
    growthOverview: "Visibility moved from 70% to 77%. Strong review month (+9). 18 posts published.",
    contentPerformance: [
      { label: "Posts published",     value: "18"                       },
      { label: "Best post",           value: "Mediterranean Platter"    },
      { label: "Engagement estimate", value: "+10%"                     },
    ],
    visibilityTrend:    [{ label: "W1", value: 70 }, { label: "W2", value: 72 }, { label: "W3", value: 75 }, { label: "W4", value: 77 }],
    reviewsTrend:       [{ label: "W1", value: 2  }, { label: "W2", value: 3  }, { label: "W3", value: 1  }, { label: "W4", value: 3  }],
    postingConsistency: [{ label: "W1", value: 4  }, { label: "W2", value: 5  }, { label: "W3", value: 5  }, { label: "W4", value: 4  }],
    inventoryTrend:     [{ label: "W1", value: 16 }, { label: "W2", value: 15 }, { label: "W3", value: 14 }, { label: "W4", value: 14 }],
    healthSummary:  "Healthy. Premium media supply, engagement growing.",
    strategicNotes: ["Olive-oil reels concept landed well", "Google review follow-up cadence is working"],
    nextMonthFocus: ["Expand reels series", "Plan executive case study", "Continue review cadence"],
  },
  {
    clientId: "alnoor", monthLabel: "May 2026",
    growthOverview: "At-risk month — visibility down from 64% to 58%. Onboarding incomplete and media supply critical.",
    contentPerformance: [
      { label: "Posts published",     value: "4"                  },
      { label: "Best post",           value: "Latte art photo"    },
      { label: "Engagement estimate", value: "-4%"                },
    ],
    visibilityTrend:    [{ label: "W1", value: 64 }, { label: "W2", value: 62 }, { label: "W3", value: 60 }, { label: "W4", value: 58 }],
    reviewsTrend:       [{ label: "W1", value: 0  }, { label: "W2", value: 1  }, { label: "W3", value: 0  }, { label: "W4", value: 3  }],
    postingConsistency: [{ label: "W1", value: 2  }, { label: "W2", value: 1  }, { label: "W3", value: 1  }, { label: "W4", value: 0  }],
    inventoryTrend:     [{ label: "W1", value: 6  }, { label: "W2", value: 4  }, { label: "W3", value: 3  }, { label: "W4", value: 2  }],
    healthSummary:  "Critical. Posting paused, onboarding incomplete.",
    strategicNotes: ["Owner attention recommended", "Reshoot required for blurry items"],
    nextMonthFocus: ["Complete onboarding", "Capture 20+ new media items", "Reset posting cadence"],
  },
];

// ── Client Workspace (Prompt 5) ──────────────────────────────────
export interface DemoRestaurantProfile {
  clientId: string;
  address: string;
  phone: string;
  website: string;
  cuisineType: string;
  hours: string;
  primaryContact: { name: string; role: string; email: string };
  secondaryContact: { name: string; role: string; email: string };
  servicePlan: "Lite" | "Growth" | "Premium" | "Enterprise";
  accountStatus: "Active" | "Onboarding" | "Paused" | "At Risk";
}

export const demoRestaurantProfiles: DemoRestaurantProfile[] = [
  {
    clientId: "mamadali",
    address: "248 Yonge St, Toronto, ON M5B 2L7",
    phone: "+1 (416) 555-0142",
    website: "mamadalikebab.com",
    cuisineType: "Modern Levantine",
    hours: "Mon–Sun · 11:00 AM – 11:00 PM",
    primaryContact:   { name: "Adel Mansour",  role: "Owner",            email: "adel@mamadalikebab.com" },
    secondaryContact: { name: "Layla Rahimi",  role: "Marketing lead",   email: "layla@mamadalikebab.com" },
    servicePlan: "Premium",
    accountStatus: "Active",
  },
  {
    clientId: "urban",
    address: "1190 Queen St W, Toronto, ON M6J 1J4",
    phone: "+1 (416) 555-0188",
    website: "urbantacos.ca",
    cuisineType: "Mexican street food",
    hours: "Tue–Sun · 12:00 PM – 10:00 PM",
    primaryContact:   { name: "Diego Alvarez", role: "Owner",            email: "diego@urbantacos.ca" },
    secondaryContact: { name: "Maya Costa",    role: "General manager",  email: "maya@urbantacos.ca" },
    servicePlan: "Growth",
    accountStatus: "Active",
  },
  {
    clientId: "crescent",
    address: "55 King St E, Toronto, ON M5C 1E5",
    phone: "+1 (647) 555-0117",
    website: "crescentgrill.com",
    cuisineType: "Mediterranean grill",
    hours: "Mon–Sat · 5:00 PM – 12:00 AM",
    primaryContact:   { name: "Sofia Haddad",  role: "Owner / Chef",     email: "sofia@crescentgrill.com" },
    secondaryContact: { name: "Karim Saliba",  role: "Operations",       email: "karim@crescentgrill.com" },
    servicePlan: "Premium",
    accountStatus: "Active",
  },
  {
    clientId: "alnoor",
    address: "3210 Bathurst St, Toronto, ON M6A 2A7",
    phone: "+1 (647) 555-0204",
    website: "alnoorcafe.ca",
    cuisineType: "Specialty cafe",
    hours: "Mon–Sun · 7:00 AM – 9:00 PM",
    primaryContact:   { name: "Yusuf Khan",    role: "Owner",            email: "yusuf@alnoorcafe.ca" },
    secondaryContact: { name: "Hana Park",     role: "Shift supervisor", email: "hana@alnoorcafe.ca" },
    servicePlan: "Lite",
    accountStatus: "At Risk",
  },
];

// ── Menu Items ───────────────────────────────────────────────────
export type MenuItemGroup = "featured" | "popular" | "seasonal";
export type MenuItemStatus = "Available" | "Limited" | "Out of stock" | "Coming soon";

export interface DemoMenuItem {
  id: string;
  clientId: string;
  name: string;
  category: string;
  group: MenuItemGroup;
  description: string;
  status: MenuItemStatus;
  promotionAngle: string;
}

export const demoMenuItems: DemoMenuItem[] = [
  // Mamadali
  { id: "mn1",  clientId: "mamadali", name: "Mixed Grill Platter",      category: "Mains",      group: "featured", description: "Lamb, chicken, kofta, charred vegetables, saffron rice.", status: "Available",   promotionAngle: "Anchor weekend family-dinner promo." },
  { id: "mn2",  clientId: "mamadali", name: "Chicken Shawarma Plate",   category: "Mains",      group: "popular",  description: "Marinated chicken, garlic sauce, pickles, fresh pita.",   status: "Available",   promotionAngle: "Lunch-window reel with chef hand-shot." },
  { id: "mn3",  clientId: "mamadali", name: "Saffron Rice Pudding",     category: "Dessert",    group: "seasonal", description: "Cardamom-infused rice pudding with pistachio crumble.",   status: "Limited",     promotionAngle: "Dessert spotlight — short-form video." },
  // Urban Tacos
  { id: "mn4",  clientId: "urban",    name: "Carnitas Tacos",           category: "Tacos",      group: "popular",  description: "Slow-braised pork, salsa verde, pickled onion, lime.",    status: "Available",   promotionAngle: "Flat-lay photo, Taco Tuesday angle." },
  { id: "mn5",  clientId: "urban",    name: "Birria Quesatacos",        category: "Tacos",      group: "featured", description: "Cheese-crisped tortillas with rich birria broth dip.",    status: "Available",   promotionAngle: "Cheese pull close-up reel." },
  { id: "mn6",  clientId: "urban",    name: "Elote Street Corn",        category: "Sides",      group: "seasonal", description: "Grilled corn, cotija, chipotle aioli, fresh lime.",       status: "Limited",     promotionAngle: "Summer-season social push." },
  // Crescent
  { id: "mn7",  clientId: "crescent", name: "Mediterranean Platter",    category: "Mains",      group: "featured", description: "Grilled lamb, halloumi, fattoush, hummus, warm pita.",    status: "Available",   promotionAngle: "Hero post — magazine-quality photo." },
  { id: "mn8",  clientId: "crescent", name: "Grilled Octopus",          category: "Starters",   group: "popular",  description: "Charred octopus, lemon, olive oil, smoked paprika.",      status: "Available",   promotionAngle: "Premium tasting menu story." },
  { id: "mn9",  clientId: "crescent", name: "Olive Oil Tasting Flight", category: "Experience", group: "seasonal", description: "Three single-origin olive oils with warm sourdough.",     status: "Coming soon", promotionAngle: "Atmospheric reels series — olive oil pour." },
  // Al Noor
  { id: "mn10", clientId: "alnoor",   name: "Cardamom Latte",           category: "Beverages",  group: "featured", description: "Espresso, steamed milk, cardamom syrup, rose petal dust.",status: "Available",   promotionAngle: "Morning ritual content." },
  { id: "mn11", clientId: "alnoor",   name: "Pistachio Croissant",      category: "Bakery",     group: "popular",  description: "House-laminated croissant with pistachio frangipane.",    status: "Available",   promotionAngle: "Pair with morning beverage feature." },
  { id: "mn12", clientId: "alnoor",   name: "Spiced Chai Cookies",      category: "Bakery",     group: "seasonal", description: "Brown butter cookies with chai spice blend.",             status: "Out of stock",promotionAngle: "Re-launch announcement once restocked." },
];

// ── Brand Guidelines ─────────────────────────────────────────────
export interface DemoBrandGuidelines {
  clientId: string;
  brandVoice: string;
  contentStyle: string;
  thingsToAvoid: string[];
  primaryColors: { name: string; hex: string }[];
  logoStatus: "Provided" | "Needs refresh" | "Missing";
  toneExamples: string[];
  captionStyleNotes: string;
}

export const demoBrandGuidelines: DemoBrandGuidelines[] = [
  {
    clientId: "mamadali",
    brandVoice: "Warm, family-led, confident. Speaks to community and tradition.",
    contentStyle: "Rich, warm lighting. Close-ups on charcoal grill and family-style plating.",
    thingsToAvoid: ["Discount-heavy language", "Generic stock food shots", "Trendy slang"],
    primaryColors: [
      { name: "Charcoal",  hex: "#1A1A1A" },
      { name: "Saffron",   hex: "#E0A92E" },
      { name: "Ivory",     hex: "#F2EAD6" },
    ],
    logoStatus: "Provided",
    toneExamples: ["Built on family. Grilled over fire.", "Tonight, your table is ready."],
    captionStyleNotes: "Short, sensory-led. Lead with the food, end with the experience.",
  },
  {
    clientId: "urban",
    brandVoice: "Bold, energetic, street-smart. Speaks to a young weekday-lunch crowd.",
    contentStyle: "High-contrast, daylight shots. Bright salsa colors, hand-held action.",
    thingsToAvoid: ["Overly polished studio shots", "Long captions", "Corporate tone"],
    primaryColors: [
      { name: "Chili red", hex: "#D43A2F" },
      { name: "Lime",      hex: "#9CCB3B" },
      { name: "Off-white", hex: "#FFF5E1" },
    ],
    logoStatus: "Provided",
    toneExamples: ["Tacos that hit. Lunch that moves.", "Real fire. Real flavour."],
    captionStyleNotes: "Punchy. 1–2 lines. End with a clear hook or offer.",
  },
  {
    clientId: "crescent",
    brandVoice: "Premium, calm, considered. Editorial restaurant tone.",
    contentStyle: "Cinematic, low-light, plated close-ups. Olive oil and char detail.",
    thingsToAvoid: ["Casual humour", "Discount messaging", "Cluttered compositions"],
    primaryColors: [
      { name: "Deep olive", hex: "#3A4A2A" },
      { name: "Bone",       hex: "#E8E1D2" },
      { name: "Ember",      hex: "#B5471B" },
    ],
    logoStatus: "Provided",
    toneExamples: ["Coastal fire. Quiet luxury.", "An evening that lingers."],
    captionStyleNotes: "Longer-form is OK. Lead with sensory detail; let the food carry the line.",
  },
  {
    clientId: "alnoor",
    brandVoice: "Friendly, neighborhood-cafe warmth. Inviting and unfussy.",
    contentStyle: "Soft natural light, latte art close-ups, hands-and-cup framing.",
    thingsToAvoid: ["Overly aspirational copy", "Heavy filters", "Trendy hashtags"],
    primaryColors: [
      { name: "Warm cream", hex: "#F4E9D5" },
      { name: "Rose",       hex: "#D2899A" },
      { name: "Espresso",   hex: "#3B2A20" },
    ],
    logoStatus: "Needs refresh",
    toneExamples: ["Mornings, sweetened.", "Your seat is waiting."],
    captionStyleNotes: "Conversational. Lead with the moment, not the menu.",
  },
];

// ── Media Requirements ───────────────────────────────────────────
export interface DemoMediaRequirements {
  clientId: string;
  photos:       { current: number; target: number };
  videos:       { current: number; target: number };
  productShots: { current: number; target: number };
  btsClips:     { current: number; target: number };
  teamOwnerContent: { current: number; target: number };
  weeklyGuidance: string;
}

export const demoMediaRequirements: DemoMediaRequirements[] = [
  { clientId: "mamadali", photos: { current: 12, target: 20 }, videos: { current: 4, target: 10 }, productShots: { current: 8, target: 12 }, btsClips: { current: 3, target: 8 }, teamOwnerContent: { current: 2, target: 4 }, weeklyGuidance: "Strong supply — focus on 2 new charcoal-grill reels this week." },
  { clientId: "urban",    photos: { current: 6,  target: 20 }, videos: { current: 2, target: 10 }, productShots: { current: 4, target: 12 }, btsClips: { current: 1, target: 8 }, teamOwnerContent: { current: 0, target: 4 }, weeklyGuidance: "Trending low — schedule a 2-hour shoot to refresh tacos and elote." },
  { clientId: "crescent", photos: { current: 14, target: 20 }, videos: { current: 6, target: 10 }, productShots: { current: 9, target: 12 }, btsClips: { current: 4, target: 8 }, teamOwnerContent: { current: 3, target: 4 }, weeklyGuidance: "Healthy supply — capture chef-portrait series next." },
  { clientId: "alnoor",   photos: { current: 2,  target: 20 }, videos: { current: 0, target: 10 }, productShots: { current: 1, target: 12 }, btsClips: { current: 0, target: 8 }, teamOwnerContent: { current: 0, target: 4 }, weeklyGuidance: "Critical — request 5 new food photos and 2 latte-art clips immediately." },
];

// ── Client Notes ─────────────────────────────────────────────────
export interface DemoClientNote {
  clientId: string;
  preferences: string[];
  restrictions: string[];
  bestSellers: string[];
  seasonalPriorities: string[];
  importantReminders: string[];
}

export const demoClientNotes: DemoClientNote[] = [
  {
    clientId: "mamadali",
    preferences: ["Posts go live before 7 PM dinner window", "Family-style plating preferred for hero shots"],
    restrictions: ["No alcohol pairings in copy", "Avoid promoting Friday lunch (slow service day)"],
    bestSellers: ["Mixed Grill Platter", "Chicken Shawarma Plate", "Lamb Kofta"],
    seasonalPriorities: ["Ramadan family-platter campaign in March", "Summer patio reels June–Aug"],
    importantReminders: ["Owner reviews captions before publish", "Tag location landmark in every post"],
  },
  {
    clientId: "urban",
    preferences: ["Bright daytime photography", "Short captions, one CTA"],
    restrictions: ["Avoid corporate tone", "No long-form copy"],
    bestSellers: ["Carnitas Tacos", "Birria Quesatacos"],
    seasonalPriorities: ["Summer patio push", "College back-to-school lunch promo"],
    importantReminders: ["Coordinate with chef for shoot days", "Tuesday is best for Taco Tuesday campaigns"],
  },
  {
    clientId: "crescent",
    preferences: ["Cinematic low-light style", "Editorial captions are welcome"],
    restrictions: ["No discount language", "Avoid casual humour"],
    bestSellers: ["Mediterranean Platter", "Grilled Octopus", "Olive Oil Flight"],
    seasonalPriorities: ["Olive harvest storytelling Oct–Nov", "Holiday tasting menu December"],
    importantReminders: ["Reservations link must appear in bio CTAs", "Tag head chef in chef-feature posts"],
  },
  {
    clientId: "alnoor",
    preferences: ["Soft, warm morning lighting", "Conversational captions"],
    restrictions: ["Avoid heavy filters", "Don't promote out-of-stock pastries"],
    bestSellers: ["Cardamom Latte", "Pistachio Croissant"],
    seasonalPriorities: ["Autumn warm-drink push", "Holiday gift card promotion in December"],
    importantReminders: ["Logo needs refresh before next campaign", "Confirm pastry stock before scheduling"],
  },
];

// ── Onboarding Steps ─────────────────────────────────────────────
export type OnboardingStatus = "Complete" | "In Progress" | "Missing";
export type OnboardingOwner = "Client" | "Veroxa Team" | "Operator";
export type OnboardingPriority = "High" | "Medium" | "Low";

export interface DemoOnboardingStep {
  id: string;
  clientId: string;
  step: string;
  description: string;
  status: OnboardingStatus;
  owner: OnboardingOwner;
  dueDate: string;
  priority: OnboardingPriority;
}

const onboardingTemplate: Omit<DemoOnboardingStep, "id" | "clientId" | "status">[] = [
  { step: "Restaurant Information",       description: "Address, hours, contact, and basic account details.",       owner: "Client",       dueDate: "Week 1", priority: "High"   },
  { step: "Menu Information",             description: "Featured, popular, and seasonal items with descriptions.",   owner: "Client",       dueDate: "Week 1", priority: "High"   },
  { step: "Brand Guidelines",             description: "Voice, content style, colors, and tone examples.",           owner: "Veroxa Team",  dueDate: "Week 2", priority: "High"   },
  { step: "Initial Media Submitted",      description: "At least 10 photos and 3 short clips to seed the library.",  owner: "Client",       dueDate: "Week 2", priority: "High"   },
  { step: "Google Business Profile",      description: "Hours, photos, and category confirmed on Google.",           owner: "Operator",     dueDate: "Week 2", priority: "Medium" },
  { step: "Social Media Access",          description: "Instagram, Facebook, and TikTok access confirmed.",          owner: "Client",       dueDate: "Week 2", priority: "High"   },
  { step: "Reporting Preferences",        description: "Weekly vs monthly cadence, delivery channel, recipients.",   owner: "Operator",     dueDate: "Week 3", priority: "Medium" },
  { step: "Portal Access Active",         description: "Client portal account live and tested.",                     owner: "Veroxa Team",  dueDate: "Week 3", priority: "Low"    },
];

const onboardingStatusMap: Record<string, OnboardingStatus[]> = {
  mamadali: ["Complete","Complete","Complete","Complete","Complete","Complete","Complete","Complete"],
  urban:    ["Complete","Complete","Complete","Complete","In Progress","Complete","In Progress","Complete"],
  crescent: ["Complete","Complete","Complete","Complete","Complete","Complete","Complete","Complete"],
  alnoor:   ["Complete","In Progress","Missing","Missing","Missing","In Progress","Missing","Complete"],
};

export const demoOnboardingSteps: DemoOnboardingStep[] = demoRestaurants.flatMap((r) =>
  onboardingTemplate.map((t, idx) => ({
    id: `${r.id}-onb-${idx + 1}`,
    clientId: r.id,
    step: t.step,
    description: t.description,
    owner: t.owner,
    dueDate: t.dueDate,
    priority: t.priority,
    status: onboardingStatusMap[r.id][idx] ?? "Missing",
  }))
);

export function getOnboardingSummary(clientId: string) {
  const steps = demoOnboardingSteps.filter((s) => s.clientId === clientId);
  const total = steps.length;
  const complete = steps.filter((s) => s.status === "Complete").length;
  const inProgress = steps.filter((s) => s.status === "In Progress").length;
  const missing = steps.filter((s) => s.status === "Missing").length;
  const pct = total === 0 ? 0 : Math.round(((complete + inProgress * 0.5) / total) * 100);
  const nextAction = steps.find((s) => s.status !== "Complete");
  return { steps, total, complete, inProgress, missing, pct, nextAction };
}

export function getVeroxaNextNeeds(clientId: string): string[] {
  const summary = getOnboardingSummary(clientId);
  const needs = summary.steps
    .filter((s) => s.status !== "Complete")
    .slice(0, 3)
    .map((s) => `${s.status === "Missing" ? "Provide" : "Finish"}: ${s.step}`);
  if (needs.length === 0) {
    return ["Onboarding complete — no outstanding items."];
  }
  return needs;
}

// ── Content Pipeline ─────────────────────────────────────────────
export type PipelineStage =
  | "Media Received"
  | "AI Review"
  | "Caption Drafting"
  | "Team Review"
  | "Scheduled / Posted";

export type ContentType = "Photo" | "Reel" | "Story" | "Carousel";
export type PipelineRole = "Client" | "Media Agent" | "Caption Agent" | "Team" | "Scheduling Agent";
export type PipelineStatus =
  | "New"
  | "Reviewing"
  | "Drafting"
  | "Awaiting Approval"
  | "Approved"
  | "Scheduled"
  | "Posted"
  | "Needs Revision";

export interface DemoPipelineItem {
  id: string;
  clientId: string;
  title: string;
  contentType: ContentType;
  relatedMenuItem: string;
  stage: PipelineStage;
  assignedRole: PipelineRole;
  status: PipelineStatus;
  postingWindow: string;
  confidence: number;
  notes: string;
}

export const demoContentPipelineItems: DemoPipelineItem[] = [
  { id: "cp1", clientId: "mamadali", title: "Chicken Shawarma close-up",   contentType: "Photo",    relatedMenuItem: "Chicken Shawarma Plate",   stage: "Scheduled / Posted", assignedRole: "Scheduling Agent", status: "Scheduled",         postingWindow: "Tue 6:30 PM",   confidence: 94, notes: "Lunch-window post — peak dinner engagement." },
  { id: "cp2", clientId: "mamadali", title: "Charcoal grill slow-mo reel", contentType: "Reel",     relatedMenuItem: "Mixed Grill Platter",      stage: "Team Review",        assignedRole: "Team",             status: "Awaiting Approval", postingWindow: "Fri 7:00 PM",   confidence: 91, notes: "Final color grade pending team sign-off." },
  { id: "cp3", clientId: "mamadali", title: "BTS — kitchen prep clip",     contentType: "Story",    relatedMenuItem: "Mixed Grill Platter",      stage: "Caption Drafting",   assignedRole: "Caption Agent",    status: "Drafting",          postingWindow: "Wed 5:00 PM",   confidence: 86, notes: "3 caption options generated." },
  { id: "cp4", clientId: "urban",    title: "Lunch special reel",          contentType: "Reel",     relatedMenuItem: "Carnitas Tacos",           stage: "AI Review",          assignedRole: "Media Agent",      status: "Reviewing",         postingWindow: "Thu 12:00 PM",  confidence: 88, notes: "Quality check in progress." },
  { id: "cp5", clientId: "urban",    title: "Birria cheese-pull close-up", contentType: "Photo",    relatedMenuItem: "Birria Quesatacos",        stage: "Media Received",     assignedRole: "Client",           status: "New",               postingWindow: "Sat 1:00 PM",   confidence: 0,  notes: "Uploaded — awaiting media review." },
  { id: "cp6", clientId: "crescent", title: "Mediterranean platter hero",  contentType: "Photo",    relatedMenuItem: "Mediterranean Platter",    stage: "Scheduled / Posted", assignedRole: "Scheduling Agent", status: "Posted",            postingWindow: "Posted Mon 8 PM", confidence: 96, notes: "Strong engagement in first 2 hours." },
  { id: "cp7", clientId: "crescent", title: "Olive oil pour reel",         contentType: "Reel",     relatedMenuItem: "Olive Oil Tasting Flight", stage: "Caption Drafting",   assignedRole: "Caption Agent",    status: "Drafting",          postingWindow: "Thu 7:30 PM",   confidence: 90, notes: "Editorial caption with sensory lead-in." },
  { id: "cp8", clientId: "crescent", title: "Owner story clip",            contentType: "Story",    relatedMenuItem: "Grilled Octopus",          stage: "Team Review",        assignedRole: "Team",             status: "Approved",          postingWindow: "Fri 8:00 PM",   confidence: 89, notes: "Approved — moving to scheduling." },
  { id: "cp9", clientId: "alnoor",   title: "Cardamom latte morning shot", contentType: "Photo",    relatedMenuItem: "Cardamom Latte",           stage: "AI Review",          assignedRole: "Media Agent",      status: "Reviewing",         postingWindow: "Mon 8:30 AM",   confidence: 81, notes: "Lighting good — caption next." },
  { id: "cp10",clientId: "alnoor",   title: "Google review highlight",     contentType: "Carousel", relatedMenuItem: "Pistachio Croissant",      stage: "Caption Drafting",   assignedRole: "Caption Agent",    status: "Needs Revision",    postingWindow: "Wed 9:00 AM",   confidence: 78, notes: "Caption flagged as too generic." },
  { id: "cp11",clientId: "alnoor",   title: "Catering announcement",       contentType: "Carousel", relatedMenuItem: "Cardamom Latte",           stage: "Media Received",     assignedRole: "Client",           status: "New",               postingWindow: "Pending",       confidence: 0,  notes: "Awaiting brand-tone review." },
];

export const pipelineStages: PipelineStage[] = [
  "Media Received",
  "AI Review",
  "Caption Drafting",
  "Team Review",
  "Scheduled / Posted",
];

// ── AI Suggestions (Pipeline-linked, Prompt 5) ───────────────────
export type SuggestionAgent =
  | "Media Review Agent"
  | "Content Strategist Agent"
  | "Caption Agent"
  | "Brand Voice Agent"
  | "Scheduling Agent"
  | "Reporting Agent";

export interface DemoAiSuggestion {
  id: string;
  agent: SuggestionAgent;
  clientId: string;
  suggestion: string;
  confidence: number;
  relatedPipelineId?: string;
}

export const demoAiSuggestions: DemoAiSuggestion[] = [
  { id: "as1",  agent: "Media Review Agent",       clientId: "mamadali", suggestion: "Use this chicken platter image for a dinner promotion — strong lighting and composition.", confidence: 94, relatedPipelineId: "cp1"  },
  { id: "as2",  agent: "Content Strategist Agent", clientId: "mamadali", suggestion: "Recommend a family-platter weekend angle leveraging current charcoal-grill media.",        confidence: 88, relatedPipelineId: "cp2"  },
  { id: "as3",  agent: "Caption Agent",            clientId: "mamadali", suggestion: "Caption tone should be warm, family-focused, and rooted in local community.",             confidence: 91, relatedPipelineId: "cp3"  },
  { id: "as4",  agent: "Scheduling Agent",         clientId: "mamadali", suggestion: "Best posting window: Friday 5:30 PM based on dinner-traffic engagement pattern.",         confidence: 87, relatedPipelineId: "cp2"  },
  { id: "as5",  agent: "Brand Voice Agent",        clientId: "urban",    suggestion: "Keep captions punchy — current draft is 60 words. Reduce to 1–2 lines.",                  confidence: 89, relatedPipelineId: "cp4"  },
  { id: "as6",  agent: "Media Review Agent",       clientId: "urban",    suggestion: "Client has low unused video inventory this week — recommend a shoot before Friday.",     confidence: 92                          },
  { id: "as7",  agent: "Content Strategist Agent", clientId: "crescent", suggestion: "Olive-oil reels series should continue — engagement +18% over previous concept.",         confidence: 93, relatedPipelineId: "cp7"  },
  { id: "as8",  agent: "Reporting Agent",          clientId: "crescent", suggestion: "Visibility trending +5% — surface in next weekly client report.",                         confidence: 90                          },
  { id: "as9",  agent: "Brand Voice Agent",        clientId: "alnoor",   suggestion: "Caption flagged as too generic — rewrite with neighborhood-cafe warmth.",                 confidence: 84, relatedPipelineId: "cp10" },
  { id: "as10", agent: "Media Review Agent",       clientId: "alnoor",   suggestion: "Media supply critical — request 5 new food photos this week.",                            confidence: 96                          },
  { id: "as11", agent: "Scheduling Agent",         clientId: "alnoor",   suggestion: "Pause scheduling until media supply recovers above 8 approved items.",                    confidence: 88                          },
  { id: "as12", agent: "Caption Agent",            clientId: "crescent", suggestion: "Editorial caption draft passes brand-tone check on first review.",                        confidence: 92, relatedPipelineId: "cp7"  },
];

// ── Single-client helpers for Workspace ──────────────────────────
export function getRestaurantProfile(clientId: string): DemoRestaurantProfile | undefined {
  return demoRestaurantProfiles.find((p) => p.clientId === clientId);
}
export function getMenuItemsForClient(clientId: string): DemoMenuItem[] {
  return demoMenuItems.filter((m) => m.clientId === clientId);
}
export function getBrandGuidelines(clientId: string): DemoBrandGuidelines | undefined {
  return demoBrandGuidelines.find((b) => b.clientId === clientId);
}
export function getMediaRequirements(clientId: string): DemoMediaRequirements | undefined {
  return demoMediaRequirements.find((m) => m.clientId === clientId);
}
export function getClientNotes(clientId: string): DemoClientNote | undefined {
  return demoClientNotes.find((n) => n.clientId === clientId);
}

// ── Team Operations Center (Prompt 6) ────────────────────────────
export const demoTeamMetrics = {
  activeClients:          4,
  clientsNeedingAttention: 2,
  contentWaitingReview:   5,
  reportsDueThisWeek:     3,
  mediaInventoryAlerts:   2,
  tasksDueToday:          7,
};

// ── Work Queue ───────────────────────────────────────────────────
export type WorkQueueStatus =
  | "Healthy"
  | "Attention Needed"
  | "Waiting On Client"
  | "Ready To Post"
  | "Reporting Due";

export interface DemoWorkQueueItem {
  clientId:    string;
  status:      WorkQueueStatus;
  priority:    "High" | "Medium" | "Low";
  lastActivity: string;
  nextAction:  string;
  assignedTo:  string;
}

export const demoWorkQueue: DemoWorkQueueItem[] = [
  {
    clientId:    "mamadali",
    status:      "Ready To Post",
    priority:    "Medium",
    lastActivity: "Today, 10:48 AM",
    nextAction:  "Final sign-off on Tuesday dinner reel before scheduling.",
    assignedTo:  "Jordan",
  },
  {
    clientId:    "urban",
    status:      "Attention Needed",
    priority:    "High",
    lastActivity: "Yesterday, 6:30 PM",
    nextAction:  "Weekly report pending operator review — follow up today.",
    assignedTo:  "Priya",
  },
  {
    clientId:    "crescent",
    status:      "Healthy",
    priority:    "Low",
    lastActivity: "Today, 11:02 AM",
    nextAction:  "Schedule olive-oil reel for Thursday evening slot.",
    assignedTo:  "Jordan",
  },
  {
    clientId:    "alnoor",
    status:      "Waiting On Client",
    priority:    "High",
    lastActivity: "May 22",
    nextAction:  "Request 5 new food photos — onboarding still incomplete.",
    assignedTo:  "Priya",
  },
];

// ── Content Review Queue ─────────────────────────────────────────
export type ContentReviewStatus =
  | "Pending"
  | "In Review"
  | "Approved"
  | "Needs Revision";

export interface DemoContentReviewItem {
  id:                string;
  title:             string;
  clientId:          string;
  contentType:       ContentType;
  stage:             string;
  aiRecommendation:  string;
  assignedReviewer:  string;
  dueDate:           string;
  status:            ContentReviewStatus;
}

export const demoContentReviewQueue: DemoContentReviewItem[] = [
  {
    id: "cr1", title: "Chicken Shawarma close-up",  clientId: "mamadali", contentType: "Photo",
    stage: "Team Review",   aiRecommendation: "Strong lighting — approve for dinner-window slot.",
    assignedReviewer: "Jordan", dueDate: "Today",       status: "In Review",
  },
  {
    id: "cr2", title: "Charcoal grill slow-mo reel", clientId: "mamadali", contentType: "Reel",
    stage: "Team Review",   aiRecommendation: "Quality passed — caption draft ready.",
    assignedReviewer: "Jordan", dueDate: "Today",       status: "Pending",
  },
  {
    id: "cr3", title: "BTS — kitchen prep clip",     clientId: "mamadali", contentType: "Story",
    stage: "Caption Drafting", aiRecommendation: "3 caption variants generated — select preferred.",
    assignedReviewer: "Jordan", dueDate: "Tomorrow",    status: "Pending",
  },
  {
    id: "cr4", title: "Lunch special reel",          clientId: "urban",    contentType: "Reel",
    stage: "AI Review",     aiRecommendation: "Minor brightness issue — review before caption.",
    assignedReviewer: "Priya",  dueDate: "Today",       status: "In Review",
  },
  {
    id: "cr5", title: "Olive oil pour reel",         clientId: "crescent", contentType: "Reel",
    stage: "Caption Drafting", aiRecommendation: "Editorial caption drafted — tone check passed.",
    assignedReviewer: "Jordan", dueDate: "Tomorrow",    status: "Approved",
  },
  {
    id: "cr6", title: "Google review highlight",     clientId: "alnoor",   contentType: "Carousel",
    stage: "Caption Drafting", aiRecommendation: "Caption too generic — rewrite with warmer tone.",
    assignedReviewer: "Priya",  dueDate: "Tomorrow",    status: "Needs Revision",
  },
  {
    id: "cr7", title: "Cardamom latte morning shot", clientId: "alnoor",   contentType: "Photo",
    stage: "AI Review",     aiRecommendation: "Lighting strong — proceed to caption stage.",
    assignedReviewer: "Priya",  dueDate: "May 27",      status: "Pending",
  },
];

// ── Team Performance ─────────────────────────────────────────────
export interface DemoTeamMember {
  name:               string;
  role:               string;
  clientsManaged:     number;
  reportsCompleted:   number;
  contentApproved:    number;
  avgTurnaround:      string;
  clientHealthScore:  number;
}

export const demoTeamMembers: DemoTeamMember[] = [
  {
    name: "Jordan",   role: "Content Lead",
    clientsManaged: 2, reportsCompleted: 8, contentApproved: 34,
    avgTurnaround: "1.2 days", clientHealthScore: 85,
  },
  {
    name: "Priya",    role: "Client Manager",
    clientsManaged: 2, reportsCompleted: 6, contentApproved: 21,
    avgTurnaround: "1.6 days", clientHealthScore: 71,
  },
  {
    name: "Marcus",   role: "Media Reviewer",
    clientsManaged: 3, reportsCompleted: 4, contentApproved: 48,
    avgTurnaround: "0.9 days", clientHealthScore: 82,
  },
  {
    name: "Ava",      role: "Caption Specialist",
    clientsManaged: 2, reportsCompleted: 10, contentApproved: 29,
    avgTurnaround: "1.1 days", clientHealthScore: 90,
  },
];

// ── Team Alerts ──────────────────────────────────────────────────
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
    clientId: "alnoor",  time: "Today, 8:42 AM",
  },
  {
    id: "ta2", severity: "Critical", category: "Onboarding",
    title: "Onboarding stalled — 4 steps missing",
    description: "Al Noor Cafe onboarding is 55% complete. Menu info and brand guidelines are missing.",
    clientId: "alnoor",  time: "Today, 7:30 AM",
  },
  {
    id: "ta3", severity: "High", category: "Report",
    title: "Weekly report overdue — operator not reviewed",
    description: "Urban Tacos weekly report has been in operator queue for 28 hours without review.",
    clientId: "urban",   time: "Yesterday, 5:15 PM",
  },
  {
    id: "ta4", severity: "High", category: "Media",
    title: "Content supply trending low",
    description: "Urban Tacos media supply dropped to 9 approved items. Recommend scheduling a shoot.",
    clientId: "urban",   time: "2 days ago",
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
    clientId: "alnoor",  time: "3 days ago",
  },
  {
    id: "ta7", severity: "Low", category: "Brand",
    title: "Brand guideline — logo refresh pending",
    description: "Al Noor Cafe logo marked for refresh. Brand assets should be updated before next campaign.",
    clientId: "alnoor",  time: "May 20",
  },
  {
    id: "ta8", severity: "Low", category: "Onboarding",
    title: "Social media access unconfirmed",
    description: "Urban Tacos social access status is 'In Progress' — confirm before next posting cycle.",
    clientId: "urban",   time: "May 21",
  },
];

// ── Operator Command Center (Prompt 7) ───────────────────────────

// Operator overview metrics (extends existing operator overview)
export const demoOperatorMetrics = {
  totalActiveClients:       4,
  healthyClients:           2,
  clientsRequiringAttention: 2,
  weeklyReportsPending:     3,
  monthlyReportsPending:    1,
  onboardingIssues:         2,
  mediaInventoryWarnings:   2,
  contentPipelineDelays:    1,
};

// Client priority board
export type ClientPriorityLevel = "Critical" | "High" | "Normal" | "Low";
export type ClientHealthStatus  = "Excellent" | "Healthy" | "Warning" | "Critical";

export interface DemoClientPriority {
  clientId:       string;
  healthStatus:   ClientHealthStatus;
  priorityLevel:  ClientPriorityLevel;
  nextAction:     string;
  lastUpdate:     string;
  priorityReason: string;
  riskFactors:    string[];
  recommendedAction: string;
}

export const demoClientPriorities: DemoClientPriority[] = [
  {
    clientId:      "alnoor",
    healthStatus:  "Critical",
    priorityLevel: "Critical",
    nextAction:    "Request 5 new food photos and resolve missing onboarding items immediately.",
    lastUpdate:    "May 22 — no activity since",
    priorityReason: "Onboarding incomplete, media critically low, client unresponsive for 3 days.",
    riskFactors:   ["Low media inventory", "Inactive client", "Onboarding incomplete"],
    recommendedAction: "Call client, request media, escalate to owner if no response by EOD.",
  },
  {
    clientId:      "urban",
    healthStatus:  "Warning",
    priorityLevel: "High",
    nextAction:    "Validate weekly report and resolve operator review backlog.",
    lastUpdate:    "Yesterday, 6:30 PM",
    priorityReason: "Weekly report in operator queue 28+ hours. Media supply trending low.",
    riskFactors:   ["Reporting overdue", "Media supply dropping"],
    recommendedAction: "Validate report now. Schedule media refresh call within 48 hours.",
  },
  {
    clientId:      "mamadali",
    healthStatus:  "Healthy",
    priorityLevel: "Normal",
    nextAction:    "Final approval on dinner reel before Thursday post window.",
    lastUpdate:    "Today, 10:48 AM",
    priorityReason: "Content ready, minor sign-off pending. No urgent risks.",
    riskFactors:   [],
    recommendedAction: "Approve reel, confirm Thursday scheduling window.",
  },
  {
    clientId:      "crescent",
    healthStatus:  "Healthy",
    priorityLevel: "Normal",
    nextAction:    "Schedule olive oil reel and confirm caption.",
    lastUpdate:    "Today, 11:02 AM",
    priorityReason: "On track. Caption draft approved. No blockers.",
    riskFactors:   [],
    recommendedAction: "Confirm caption, lock Thursday evening slot.",
  },
];

// Team oversight
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
  {
    name: "Jordan",   role: "Content Lead",
    assignedClientIds: ["mamadali", "crescent"],
    openTasks: 4,  completedTasks: 12, contentAwaitingReview: 3, reportWorkload: 2,
  },
  {
    name: "Priya",    role: "Client Manager",
    assignedClientIds: ["urban", "alnoor"],
    openTasks: 6,  completedTasks: 8,  contentAwaitingReview: 4, reportWorkload: 3,
  },
  {
    name: "Marcus",   role: "Media Reviewer",
    assignedClientIds: ["mamadali", "urban", "crescent"],
    openTasks: 3,  completedTasks: 19, contentAwaitingReview: 7, reportWorkload: 1,
  },
  {
    name: "Ava",      role: "Caption Specialist",
    assignedClientIds: ["mamadali", "alnoor"],
    openTasks: 2,  completedTasks: 14, contentAwaitingReview: 2, reportWorkload: 4,
  },
];

// Content pipeline metrics
export interface DemoPipelineStage {
  stage:    string;
  count:    number;
  change:   string;
  positive: boolean;
}

export const demoPipelineMetrics: DemoPipelineStage[] = [
  { stage: "Media Received",    count: 12, change: "+4 this week",   positive: true  },
  { stage: "In Review",         count: 5,  change: "–2 from last week", positive: false },
  { stage: "Drafting",          count: 7,  change: "+1 today",       positive: true  },
  { stage: "Awaiting Approval", count: 3,  change: "No change",      positive: true  },
  { stage: "Scheduled",         count: 4,  change: "+2 this week",   positive: true  },
  { stage: "Posted",            count: 18, change: "+6 this month",  positive: true  },
];

// Risk center
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
    title: "Media inventory critically low — Al Noor Cafe",
    description: "Only 2 approved media items remain. Cannot sustain next week's schedule without emergency shoot.",
    clientId: "alnoor", time: "Today, 8:42 AM",
  },
  {
    id: "r2", severity: "Critical", category: "Onboarding",
    title: "Onboarding blocked — Al Noor Cafe",
    description: "4 of 8 onboarding steps incomplete, including menu info and brand guidelines. Content quality at risk.",
    clientId: "alnoor", time: "Today, 7:30 AM",
  },
  {
    id: "r3", severity: "High", category: "Reporting",
    title: "Weekly report overdue — Urban Tacos",
    description: "Report has been in operator validation queue for 28+ hours. Client visibility window missed.",
    clientId: "urban", time: "Yesterday, 5:15 PM",
  },
  {
    id: "r4", severity: "High", category: "Client",
    title: "Inactive client — Al Noor Cafe",
    description: "No client activity detected in 3 days. Emails unanswered. Escalation recommended.",
    clientId: "alnoor", time: "3 days ago",
  },
  {
    id: "r5", severity: "Medium", category: "Media",
    title: "Content supply trending low — Urban Tacos",
    description: "9 approved items remaining. At current posting frequency, supply runs out in 14 days.",
    clientId: "urban", time: "2 days ago",
  },
  {
    id: "r6", severity: "Medium", category: "Google",
    title: "Google profile photos outdated — Al Noor Cafe",
    description: "Profile photos are 6+ months old. Affects Google visibility and first impressions.",
    clientId: "alnoor", time: "3 days ago",
  },
  {
    id: "r7", severity: "Low", category: "Content",
    title: "Content backlog forming — Crescent Kitchen",
    description: "3 items in caption drafting stage. Minor delay — no immediate risk.",
    clientId: "crescent", time: "Today, 9:00 AM",
  },
  {
    id: "r8", severity: "Low", category: "Brand",
    title: "Brand guideline refresh pending — Al Noor Cafe",
    description: "Logo marked for update. Brand assets should be refreshed before next campaign.",
    clientId: "alnoor", time: "May 20",
  },
];

// Operator action center
export type ActionUrgency = "Immediate" | "Today" | "This Week";

export interface DemoOperatorAction {
  id:          string;
  title:       string;
  description: string;
  clientId?:   string;
  urgency:     ActionUrgency;
  category:    string;
}

export const demoOperatorActions: DemoOperatorAction[] = [
  {
    id: "oa1", urgency: "Immediate", category: "Client",
    title: "Contact Al Noor Cafe — media emergency",
    description: "Request at least 5 new food photos via WhatsApp and email. Media queue critically low.",
    clientId: "alnoor",
  },
  {
    id: "oa2", urgency: "Immediate", category: "Report",
    title: "Validate Urban Tacos weekly report",
    description: "Report sitting in operator queue 28+ hours. Approve and publish to unlock client visibility.",
    clientId: "urban",
  },
  {
    id: "oa3", urgency: "Today", category: "Onboarding",
    title: "Follow up on Al Noor onboarding blockers",
    description: "4 onboarding steps incomplete. Escalate to owner if no response by 5 PM.",
    clientId: "alnoor",
  },
  {
    id: "oa4", urgency: "Today", category: "Content",
    title: "Approve Mamadali dinner reel",
    description: "Final sign-off required before Thursday 7 PM posting window. Caption is ready.",
    clientId: "mamadali",
  },
  {
    id: "oa5", urgency: "This Week", category: "Media",
    title: "Schedule media refresh for Urban Tacos",
    description: "Content supply dropping. Coordinate a new shoot for next week to replenish 2-week buffer.",
    clientId: "urban",
  },
  {
    id: "oa6", urgency: "This Week", category: "Google",
    title: "Update Google Business profile — Al Noor Cafe",
    description: "Photos are 6 months old. Upload 3–4 new hero images to improve local search visibility.",
    clientId: "alnoor",
  },
  {
    id: "oa7", urgency: "This Week", category: "Report",
    title: "Review Crescent Kitchen monthly report",
    description: "Monthly report due end of week. Verify growth metrics and approve before distribution.",
    clientId: "crescent",
  },
];

// AI Operator Assistant insights
export type AssistantSeverity = "info" | "warning" | "critical";

export interface DemoAssistantInsight {
  id:        string;
  agent:     string;
  insight:   string;
  clientId?: string;
  severity:  AssistantSeverity;
}

export const demoOperatorAssistant: DemoAssistantInsight[] = [
  {
    id: "ai1", agent: "Risk Monitoring Agent", severity: "critical",
    insight: "Al Noor Cafe media inventory may run out within 5 days at current posting frequency.",
    clientId: "alnoor",
  },
  {
    id: "ai2", agent: "Reporting Agent", severity: "critical",
    insight: "Urban Tacos monthly report validation is overdue by 28 hours. Immediate operator action required.",
    clientId: "urban",
  },
  {
    id: "ai3", agent: "Content Strategist Agent", severity: "warning",
    insight: "Urban Tacos posting consistency dropped to 3 posts / week vs. 5 target. Recommend scheduling emergency content.",
    clientId: "urban",
  },
  {
    id: "ai4", agent: "Media Review Agent", severity: "warning",
    insight: "Recommend requesting additional video content for Al Noor Cafe — only photo assets in queue.",
    clientId: "alnoor",
  },
  {
    id: "ai5", agent: "Scheduling Agent", severity: "info",
    insight: "Mamadali Kebab House Thursday dinner slot is pre-loaded. Final content sign-off needed by noon.",
    clientId: "mamadali",
  },
  {
    id: "ai6", agent: "Content Strategist Agent", severity: "info",
    insight: "Crescent Kitchen olive oil reel is on track. Caption approved. No action needed.",
    clientId: "crescent",
  },
  {
    id: "ai7", agent: "Risk Monitoring Agent", severity: "warning",
    insight: "Portfolio-level media supply is 18% below the recommended 3-week buffer. Review all client queues.",
  },
  {
    id: "ai8", agent: "Reporting Agent", severity: "info",
    insight: "3 weekly reports are pending for this cycle. 1 is operator-ready, 2 need validation.",
  },
];

// Daily digest
export interface DemoDailyDigestSection {
  category: string;
  items:    string[];
}

export const demoDailyDigest: DemoDailyDigestSection[] = [
  {
    category: "Today's Priorities",
    items: [
      "Validate Urban Tacos weekly report — 28 hours overdue.",
      "Approve Mamadali dinner reel before noon (Thursday window).",
      "Contact Al Noor Cafe re: media emergency — 2 items remaining.",
    ],
  },
  {
    category: "Urgent Alerts",
    items: [
      "Al Noor Cafe: media critically low — 2 approved items. Risk of posting gap next week.",
      "Urban Tacos: weekly report stuck in operator queue.",
      "Al Noor Cafe: client unresponsive for 3 days — escalation may be needed.",
    ],
  },
  {
    category: "Clients Needing Attention",
    items: [
      "Al Noor Cafe — Critical: media low, onboarding incomplete, client inactive.",
      "Urban Tacos — High: report overdue, content supply trending down.",
    ],
  },
  {
    category: "Reports Due",
    items: [
      "Urban Tacos weekly report — validate and publish today.",
      "Mamadali Kebab House weekly report — in draft, review by Friday.",
      "Crescent Kitchen monthly report — due by end of week.",
    ],
  },
  {
    category: "Media Shortages",
    items: [
      "Al Noor Cafe: 2 approved items — critical shortage.",
      "Urban Tacos: 9 items — 14-day supply at current pace.",
    ],
  },
  {
    category: "Pipeline Bottlenecks",
    items: [
      "5 items stuck in 'In Review' — review queue needs attention.",
      "3 caption items awaiting operator approval before scheduling.",
    ],
  },
];

// ── Owner / Phase 2 (Owner Executive + BI + AI + Permissions + Automation) ──

// Owner business metrics
export const demoOwnerMetrics = {
  totalActiveClients:        4,
  monthlyRecurringRevenue:   4788,   // 997+1097+1197+1497
  projectedRevenue:          7785,
  clientHealthAverage:       79,
  teamUtilization:           84,
  retentionScore:            94,
  reportingCompletionRate:   88,
  onboardingCompletionRate:  76,
  monthOverMonthGrowth:      12,     // %
};

// 6-month revenue + client trend
export interface DemoRevenuePoint {
  month:    string;
  revenue:  number;
  clients:  number;
}
export const demoRevenueTrend: DemoRevenuePoint[] = [
  { month: "Dec", revenue: 2094, clients: 2 },
  { month: "Jan", revenue: 2094, clients: 2 },
  { month: "Feb", revenue: 3191, clients: 3 },
  { month: "Mar", revenue: 3291, clients: 3 },
  { month: "Apr", revenue: 4488, clients: 4 },
  { month: "May", revenue: 4788, clients: 4 },
];

// Service plan distribution (locked pricing $997 / $1,097 / $1,197 / $1,497)
export interface DemoPlanRow {
  plan:    string;
  price:   number;
  clients: number;
  color:   string;
}
export const demoServicePlans: DemoPlanRow[] = [
  { plan: "Essential", price:  997, clients: 1, color: "bg-sky-500"     },
  { plan: "Growth",    price: 1097, clients: 1, color: "bg-emerald-500" },
  { plan: "Pro",       price: 1197, clients: 1, color: "bg-amber-500"   },
  { plan: "Premium",   price: 1497, clients: 1, color: "bg-violet-500"  },
];

// Client health distribution
export const demoClientHealthDistribution = [
  { status: "Excellent", count: 0, color: "bg-emerald-500" },
  { status: "Healthy",   count: 2, color: "bg-sky-500"     },
  { status: "Warning",   count: 1, color: "bg-amber-500"   },
  { status: "Critical",  count: 1, color: "bg-rose-500"    },
] as const;

// Owner Command Center: business-level risks, opportunities, and warnings
export type BizSeverity = "Critical" | "High" | "Medium" | "Low";
export type BizCategory =
  | "Business Risk"
  | "Growth Opportunity"
  | "Team Bottleneck"
  | "Client Risk"
  | "Revenue Risk"
  | "Operational Warning";

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
    title: "Al Noor Cafe at risk of churn",
    description: "Critical health status, onboarding stalled, client unresponsive. $1,097 MRR at risk.",
    recommendedAction: "Schedule rescue call this week; consider 30-day extension or service downgrade.",
  },
  {
    id: "oc2", category: "Client Risk",         severity: "High",
    title: "Urban Tacos health declining",
    description: "Reports overdue, media supply trending down. Health dropped from 82 → 68 this month.",
    recommendedAction: "Operator intervention plus media-refresh shoot scheduled within 5 business days.",
  },
  {
    id: "oc3", category: "Team Bottleneck",     severity: "High",
    title: "Reporting workload concentration",
    description: "60% of weekly reports flow through Priya. Risk of single-point delay.",
    recommendedAction: "Cross-train Jordan and Ava on Reporting Agent validation by end of month.",
  },
  {
    id: "oc4", category: "Growth Opportunity",  severity: "Medium",
    title: "Mamadali Kebab House ready for upsell",
    description: "Healthy metrics, engaged client, 3 months on Growth plan. Upgrade to Pro = +$100/mo.",
    recommendedAction: "Owner-led upsell conversation about Pro plan benefits and add-on shoot package.",
  },
  {
    id: "oc5", category: "Growth Opportunity",  severity: "Medium",
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
    id: "oc7", category: "Business Risk",       severity: "Low",
    title: "Brand asset library aging",
    description: "Al Noor Cafe brand guidelines flagged for refresh. Low-priority but recurring across portfolio.",
    recommendedAction: "Annual brand-audit cycle; bundle into onboarding refresh checklist.",
  },
  {
    id: "oc8", category: "Revenue Risk",        severity: "Low",
    title: "No plan upgrades in last 60 days",
    description: "Expansion revenue stagnant. Pro plan has zero upgrades since March.",
    recommendedAction: "Quarterly account-review meetings + upgrade-incentive program.",
  },
];

// AI Agents v2 — detailed library (9 agents)
export interface DemoAgentDetail {
  id:                  string;
  name:                string;
  shortName:           string;
  category:            "Content" | "Operations" | "Intelligence" | "Executive";
  purpose:             string;
  inputs:              string[];
  outputs:             string[];
  sampleRecommendations: string[];
  recentActivity:      { time: string; event: string }[];
  sampleDecisions:     string[];
}

export const demoAiAgentsV2: DemoAgentDetail[] = [
  {
    id: "media-review", name: "Media Review Agent", shortName: "Media Review", category: "Content",
    purpose: "Reviews uploaded media for technical quality, brand fit, and capture-plan alignment before it enters the pipeline.",
    inputs: ["Raw client uploads", "Brand guidelines", "Capture plan", "Restaurant profile"],
    outputs: ["Quality score", "Approve / reshoot / crop verdict", "Reason notes", "Auto-tags"],
    sampleRecommendations: [
      "Storefront shot underexposed — recommend reshoot at golden hour.",
      "Dessert tray detail strong — crop to 4:5 for Instagram.",
      "Family platter on-brand — surface for weekend promo slot.",
    ],
    recentActivity: [
      { time: "Today, 10:32 AM", event: "Reviewed 8 items for Mamadali Kebab House" },
      { time: "Today, 8:15 AM",  event: "Flagged 2 items for reshoot — Urban Tacos" },
      { time: "Yesterday",        event: "Reviewed 5 items for Crescent Kitchen — all approved" },
    ],
    sampleDecisions: [
      "Approved 6 of 8 items (75%).",
      "Flagged 2 items with 'needs reshoot' tag.",
      "Auto-tagged 4 items as 'hero' candidates.",
    ],
  },
  {
    id: "content-strategist", name: "Content Strategist Agent", shortName: "Content Strategist", category: "Content",
    purpose: "Plans the content calendar across clients, balancing post types, posting cadence, and growth objectives.",
    inputs: ["Approved media inventory", "Client growth goals", "Historical performance", "Posting cadence targets"],
    outputs: ["Weekly content plan", "Post-mix recommendations", "Cadence adjustments"],
    sampleRecommendations: [
      "Increase reel-to-photo ratio for Mamadali — reels outperforming by 2.1x.",
      "Schedule olive-oil reel for Thursday 7 PM window — peak engagement.",
      "Front-load Friday content for Urban Tacos before weekend rush.",
    ],
    recentActivity: [
      { time: "Today, 9:00 AM",  event: "Drafted 5-post plan for Mamadali — week of May 26" },
      { time: "Today, 8:42 AM",  event: "Recommended cadence boost for Crescent Kitchen" },
      { time: "Yesterday",        event: "Surfaced under-utilised BTS clips for Urban Tacos" },
    ],
    sampleDecisions: [
      "Planned 22 posts across the portfolio this week.",
      "Recommended 3 cadence adjustments.",
      "Identified 6 underused assets for reactivation.",
    ],
  },
  {
    id: "caption", name: "Caption Agent", shortName: "Caption", category: "Content",
    purpose: "Generates 3 caption variants per post in the client's brand voice, optimised for engagement and CTA.",
    inputs: ["Post media", "Brand voice profile", "Restaurant context", "CTA goals"],
    outputs: ["3 caption variants", "Hashtag suggestions", "Emoji style hints"],
    sampleRecommendations: [
      "Use warmer, story-first tone for Al Noor Cafe — premium positioning.",
      "Lead with action verb for Urban Tacos — high-energy brand voice.",
      "Include hijri date reference for Mamadali halal audience.",
    ],
    recentActivity: [
      { time: "Today, 10:48 AM", event: "Drafted 3 captions for Mamadali dinner reel" },
      { time: "Today, 9:20 AM",  event: "Drafted 3 captions for Crescent olive-oil reel" },
      { time: "Yesterday",        event: "Drafted 3 captions for Urban Tacos lunch special" },
    ],
    sampleDecisions: [
      "Generated 18 caption variants this week.",
      "Brand voice match score: 94% average.",
      "Recommended hashtag pools updated for 3 clients.",
    ],
  },
  {
    id: "brand-voice", name: "Brand Voice Agent", shortName: "Brand Voice", category: "Content",
    purpose: "Validates that every caption, post, and reply matches the documented brand voice for the client.",
    inputs: ["Draft captions", "Brand voice profile", "Tone examples", "Restricted phrases"],
    outputs: ["Voice match score", "Tone-deviation flags", "Suggested rewrites"],
    sampleRecommendations: [
      "Caption B too generic — rewrite with sensory language.",
      "Avoid corporate phrasing for Al Noor — family-owned brand voice.",
      "Add Urdu phrase variant for Mamadali audience overlap.",
    ],
    recentActivity: [
      { time: "Today, 10:50 AM", event: "Approved 2 of 3 Mamadali captions — voice match 96%" },
      { time: "Today, 9:25 AM",  event: "Flagged Caption C for Crescent — too promotional" },
      { time: "Yesterday",        event: "Updated brand voice profile for Urban Tacos" },
    ],
    sampleDecisions: [
      "Approved 14 captions; flagged 4 for rewrite.",
      "Maintained 90%+ brand voice match across portfolio.",
      "Suggested 6 voice-profile refinements.",
    ],
  },
  {
    id: "scheduling", name: "Scheduling Agent", shortName: "Scheduling", category: "Operations",
    purpose: "Selects the optimal posting window and platform for each approved post based on audience and engagement data.",
    inputs: ["Approved post", "Platform analytics", "Audience timezone", "Posting cadence rules"],
    outputs: ["Recommended slot", "Platform priority", "Conflict warnings"],
    sampleRecommendations: [
      "Thursday 7 PM is peak window for Mamadali — schedule dinner reel.",
      "Avoid Friday morning for Urban Tacos — competing local event.",
      "Push Crescent olive-oil reel to Sunday brunch window — higher engagement.",
    ],
    recentActivity: [
      { time: "Today, 11:00 AM", event: "Scheduled 4 posts for Mamadali this week" },
      { time: "Today, 9:30 AM",  event: "Reshuffled Crescent calendar — peak-window optimisation" },
      { time: "Yesterday",        event: "Flagged scheduling conflict for Urban Tacos Sunday slot" },
    ],
    sampleDecisions: [
      "Locked 18 posting windows this cycle.",
      "Avoided 3 conflicts based on local events.",
      "Recommended 2 cadence rebalances.",
    ],
  },
  {
    id: "reporting", name: "Reporting Agent", shortName: "Reporting", category: "Operations",
    purpose: "Assembles weekly and monthly reports, validates metrics, and prepares them for operator sign-off.",
    inputs: ["Posting log", "Engagement metrics", "Client goals", "Prior period baseline"],
    outputs: ["Weekly report draft", "Monthly report draft", "Highlight + concern callouts"],
    sampleRecommendations: [
      "Highlight Mamadali 2.1x reel engagement week-over-week.",
      "Flag Urban Tacos posting consistency drop in monthly report.",
      "Surface Crescent menu launch as a 'win of the month' story.",
    ],
    recentActivity: [
      { time: "Today, 7:15 AM",  event: "Drafted weekly report for Mamadali" },
      { time: "Yesterday",        event: "Drafted weekly report for Urban Tacos — pending validation" },
      { time: "2 days ago",       event: "Published monthly report for Crescent Kitchen" },
    ],
    sampleDecisions: [
      "Drafted 8 reports this week.",
      "Auto-validated 6; routed 2 to operator review.",
      "Surfaced 12 highlight moments across the portfolio.",
    ],
  },
  {
    id: "risk", name: "Risk Monitoring Agent", shortName: "Risk Monitoring", category: "Intelligence",
    purpose: "Watches every client signal — media supply, onboarding, posting cadence, client activity — and flags risks early.",
    inputs: ["All client metrics", "Inventory levels", "Activity logs", "Health thresholds"],
    outputs: ["Risk score per client", "Severity-ranked alerts", "Forecast warnings"],
    sampleRecommendations: [
      "Al Noor Cafe will run out of media in 5 days at current pace.",
      "Urban Tacos posting consistency below 70% target — intervene.",
      "Mamadali onboarding 100% — ready for service expansion conversation.",
    ],
    recentActivity: [
      { time: "Today, 8:42 AM",  event: "Raised CRITICAL alert — Al Noor media inventory" },
      { time: "Today, 7:30 AM",  event: "Raised CRITICAL alert — Al Noor onboarding stalled" },
      { time: "Yesterday",        event: "Raised HIGH alert — Urban Tacos report overdue" },
    ],
    sampleDecisions: [
      "Raised 8 risk alerts this week (2 critical, 3 high, 3 medium).",
      "Forecast 1 likely churn event within 30 days if no action.",
      "Recommended 4 portfolio-level interventions.",
    ],
  },
  {
    id: "operator-assistant", name: "Operator Assistant", shortName: "Operator Asst.", category: "Executive",
    purpose: "Synthesises all agent outputs into a daily operator briefing with prioritised actions.",
    inputs: ["All agent outputs", "Risk alerts", "Team workload", "Daily SLAs"],
    outputs: ["Prioritised action list", "Daily digest", "Bottleneck warnings"],
    sampleRecommendations: [
      "Validate Urban Tacos report first — 28 hours overdue.",
      "Approve Mamadali dinner reel by noon — Thursday slot.",
      "Contact Al Noor Cafe today — media emergency.",
    ],
    recentActivity: [
      { time: "Today, 6:00 AM",  event: "Generated operator daily digest" },
      { time: "Today, 5:55 AM",  event: "Compiled 7 recommended actions for today" },
      { time: "Yesterday, 6:00 AM", event: "Generated operator daily digest" },
    ],
    sampleDecisions: [
      "Surfaced 4 immediate actions and 3 same-week actions today.",
      "Identified 2 team-workload bottlenecks.",
      "Flagged 1 SLA breach risk.",
    ],
  },
  {
    id: "owner-assistant", name: "Owner Assistant", shortName: "Owner Asst.", category: "Executive",
    purpose: "Generates the owner's daily executive briefing — business health, revenue trends, top risks, top opportunities.",
    inputs: ["Operator digest", "Revenue & client metrics", "Risk forecast", "Growth opportunities"],
    outputs: ["Owner daily briefing", "Strategic recommendations", "Weekly business pulse"],
    sampleRecommendations: [
      "Revenue up 12% MoM — celebrate with team.",
      "Al Noor Cafe rescue call this week — $1,097 MRR at risk.",
      "3 qualified leads close to signing — prepare proposals.",
    ],
    recentActivity: [
      { time: "Today, 5:30 AM",  event: "Generated owner daily briefing" },
      { time: "Yesterday, 5:30 AM", event: "Generated owner daily briefing" },
      { time: "Monday, 5:30 AM",  event: "Generated weekly business pulse" },
    ],
    sampleDecisions: [
      "Identified 2 strategic risks and 3 growth opportunities.",
      "Flagged $1,097 MRR-at-risk client for immediate attention.",
      "Surfaced potential $3,291 expansion in next 30 days.",
    ],
  },
];

// Agent workflow (Section 4)
export interface DemoWorkflowStep {
  step:        number;
  label:       string;
  description: string;
  type:        "client" | "agent" | "stage" | "team";
}

export const demoAgentWorkflow: DemoWorkflowStep[] = [
  { step: 1,  type: "client", label: "Client uploads media",      description: "Photos and videos arrive via client portal."                              },
  { step: 2,  type: "agent",  label: "Media Review Agent",        description: "Scores quality, matches capture plan, approves or flags reshoots."        },
  { step: 3,  type: "agent",  label: "Content Strategist Agent",  description: "Plans post-mix and cadence across the week."                              },
  { step: 4,  type: "agent",  label: "Caption Agent",             description: "Drafts 3 caption variants in the client's brand voice."                   },
  { step: 5,  type: "agent",  label: "Brand Voice Agent",         description: "Validates tone, flags deviations, suggests rewrites."                     },
  { step: 6,  type: "team",   label: "Team / Operator Approval",  description: "Human-in-the-loop sign-off before content is scheduled."                  },
  { step: 7,  type: "agent",  label: "Scheduling Agent",          description: "Selects optimal posting window for each platform."                        },
  { step: 8,  type: "stage",  label: "Publishing Stage",          description: "Posts are queued and (in production) published to social channels."       },
  { step: 9,  type: "agent",  label: "Reporting Agent",           description: "Assembles weekly and monthly reports with highlights and callouts."       },
  { step: 10, type: "agent",  label: "Risk Monitoring Agent",     description: "Watches every signal and raises early-warning alerts."                    },
  { step: 11, type: "agent",  label: "Operator Assistant",        description: "Synthesises agent outputs into the operator daily digest."                },
  { step: 12, type: "agent",  label: "Owner Assistant",           description: "Generates the owner executive briefing every morning."                    },
];

// BI Center metrics (multi-series, 6 months)
export interface DemoTrendPoint {
  label: string;
  value: number;
}
export const demoBiMetrics = {
  clientGrowth:        [{ label:"Dec", value:2 },{ label:"Jan", value:2 },{ label:"Feb", value:3 },{ label:"Mar", value:3 },{ label:"Apr", value:4 },{ label:"May", value:4 }] as DemoTrendPoint[],
  revenueGrowth:       [{ label:"Dec", value:2094 },{ label:"Jan", value:2094 },{ label:"Feb", value:3191 },{ label:"Mar", value:3291 },{ label:"Apr", value:4488 },{ label:"May", value:4788 }] as DemoTrendPoint[],
  retention:           [{ label:"Dec", value:100 },{ label:"Jan", value:100 },{ label:"Feb", value:100 },{ label:"Mar", value:100 },{ label:"Apr", value:100 },{ label:"May", value:94  }] as DemoTrendPoint[],
  mediaInventoryTrend: [{ label:"Dec", value:42 },{ label:"Jan", value:38 },{ label:"Feb", value:46 },{ label:"Mar", value:52 },{ label:"Apr", value:48 },{ label:"May", value:39 }] as DemoTrendPoint[],
  contentProduction:   [{ label:"Dec", value:24 },{ label:"Jan", value:26 },{ label:"Feb", value:38 },{ label:"Mar", value:42 },{ label:"Apr", value:51 },{ label:"May", value:58 }] as DemoTrendPoint[],
  reportingCompletion: [{ label:"Dec", value:80 },{ label:"Jan", value:84 },{ label:"Feb", value:86 },{ label:"Mar", value:88 },{ label:"Apr", value:90 },{ label:"May", value:88 }] as DemoTrendPoint[],
  clientHealthOverTime:[{ label:"Dec", value:84 },{ label:"Jan", value:85 },{ label:"Feb", value:83 },{ label:"Mar", value:82 },{ label:"Apr", value:80 },{ label:"May", value:79 }] as DemoTrendPoint[],
};

// Media Analytics
export const demoMediaAnalytics = {
  photosReceived:    142,
  videosReceived:    37,
  unusedInventory:   29,
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

// Operations Intelligence
export const demoOpsIntelligence = {
  teamWorkload:        [{ label: "Jordan", value: 16 }, { label: "Priya", value: 14 }, { label: "Marcus", value: 10 }, { label: "Ava", value: 16 }] as DemoTrendPoint[],
  reviewQueue:         { current: 7, target: 5, status: "above" as "above" | "below" | "on" },
  approvalQueue:       { current: 3, target: 5, status: "below" as "above" | "below" | "on" },
  contentBacklog:      { current: 5, target: 10, status: "below" as "above" | "below" | "on" },
  reportingBacklog:    { current: 2, target: 0, status: "above" as "above" | "below" | "on" },
  clientResponsiveness:[{ clientId: "mamadali", avgHours:  2.4 }, { clientId: "urban", avgHours: 14.0 }, { clientId: "crescent", avgHours: 4.1 }, { clientId: "alnoor", avgHours: 72.0 }],
  riskDistribution:    [{ label: "Critical", value: 2, color: "bg-rose-500" }, { label: "High", value: 2, color: "bg-amber-500" }, { label: "Medium", value: 3, color: "bg-yellow-500" }, { label: "Low", value: 2, color: "bg-muted-foreground/40" }],
};

// Reporting Analytics
export const demoReportingAnalytics = {
  weeklyDrafted:        12,
  weeklyValidationRate: 88,
  weeklyPublishRate:    94,
  monthlyDrafted:        4,
  monthlyPublishRate:  100,
  avgDraftToPublishHours: 36,
  historicalCompletion: [{ label:"Dec", value:80 },{ label:"Jan", value:84 },{ label:"Feb", value:86 },{ label:"Mar", value:88 },{ label:"Apr", value:90 },{ label:"May", value:88 }] as DemoTrendPoint[],
};

// Permissions matrix
export type RoleAccess = "Full" | "Own Only" | "View" | "None";
export interface DemoPermissionRow {
  module:    string;
  client:    RoleAccess;
  team:      RoleAccess;
  operator:  RoleAccess;
  owner:     RoleAccess;
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
  { role: "Client",   summary: "Submit media, approve content, view own performance.",          color: "border-sky-500/40 text-sky-300 bg-sky-500/10"      },
  { role: "Team",     summary: "Execute assigned work — review media, draft captions, publish.", color: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10" },
  { role: "Operator", summary: "Oversee all client operations, validate reports, manage risks.", color: "border-amber-500/40 text-amber-300 bg-amber-500/10"  },
  { role: "Owner",    summary: "Lead the business — revenue, growth, strategy, team.",          color: "border-violet-500/40 text-violet-300 bg-violet-500/10" },
];

// Automation roadmap
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
  { id: "a1",  name: "Media Review Automation",       description: "Auto-score uploaded media and route to reshoot or approval.",  status: "Prototype",    category: "Content",      targetEta: "Q3 2026" },
  { id: "a2",  name: "Caption Automation",            description: "Generate 3 caption variants per post in client voice.",         status: "Prototype",    category: "Content",      targetEta: "Q3 2026" },
  { id: "a3",  name: "Scheduling Automation",         description: "Auto-select optimal posting window across platforms.",          status: "Planned",      category: "Operations",   targetEta: "Q4 2026" },
  { id: "a4",  name: "Publishing Automation",         description: "Direct publishing to social channels with retry logic.",        status: "Future Build", category: "Operations",   targetEta: "Q1 2027" },
  { id: "a5",  name: "Weekly Reporting Automation",   description: "Auto-assemble weekly reports with operator validation.",        status: "Prototype",    category: "Reporting",    targetEta: "Q3 2026" },
  { id: "a6",  name: "Monthly Reporting Automation",  description: "Auto-assemble monthly reports with narrative highlights.",      status: "Planned",      category: "Reporting",    targetEta: "Q4 2026" },
  { id: "a7",  name: "Risk Monitoring Automation",    description: "Continuous monitoring with severity-ranked alerts.",            status: "Planned",      category: "Intelligence", targetEta: "Q4 2026" },
  { id: "a8",  name: "Owner Briefing Automation",     description: "Daily owner briefing generated automatically every morning.",   status: "Future Build", category: "Executive",    targetEta: "Q1 2027" },
];

// System map layers
export interface DemoSystemLayer {
  id:          string;
  name:        string;
  description: string;
  modules:     string[];
  color:       string;
}
export const demoSystemMap: DemoSystemLayer[] = [
  { id: "client",     name: "Client Layer",            description: "What clients see and interact with.",                modules: ["Onboarding", "Workspace", "Content Pipeline", "Media", "Reports", "Notifications"],                  color: "border-sky-500/40 bg-sky-500/10"      },
  { id: "team",       name: "Team Layer",              description: "Execution surface for content + media work.",        modules: ["Tasks", "Media Review", "Caption Drafting", "Scheduling", "Drafts"],                                  color: "border-emerald-500/40 bg-emerald-500/10" },
  { id: "operator",   name: "Operator Layer",          description: "Oversight, validation, and risk management.",        modules: ["Priority Board", "Action Center", "Risk Center", "Reporting Command", "Team Oversight"],            color: "border-amber-500/40 bg-amber-500/10"   },
  { id: "owner",      name: "Owner Layer",             description: "Strategic, business, and revenue command.",          modules: ["Executive Dashboard", "Command Center", "Revenue", "Daily Briefing"],                                color: "border-violet-500/40 bg-violet-500/10" },
  { id: "ai",         name: "AI Layer",                description: "Simulated intelligence orchestrating the workflow.", modules: ["Media Review", "Content Strategist", "Caption", "Brand Voice", "Scheduling", "Reporting", "Risk", "Operator Asst.", "Owner Asst."], color: "border-primary/40 bg-primary/10" },
  { id: "reporting",  name: "Reporting Layer",         description: "Weekly + monthly report generation and delivery.",   modules: ["Weekly Reports", "Monthly Reports", "Report Approvals", "Historical Archives"],                      color: "border-cyan-500/40 bg-cyan-500/10"     },
  { id: "analytics",  name: "Analytics Layer",         description: "Cross-portfolio business intelligence.",             modules: ["BI Center", "Client Analytics", "Media Analytics", "Reporting Analytics", "Operations Intelligence"], color: "border-pink-500/40 bg-pink-500/10"     },
  { id: "automation", name: "Future Automation Layer", description: "Planned automations that will close the loop.",      modules: ["Auto Media Review", "Auto Captions", "Auto Scheduling", "Auto Publishing", "Auto Reporting"],         color: "border-muted-foreground/40 bg-muted/20" },
];

// Owner Daily Briefing
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
      "Retention score 94% — slight dip due to Al Noor risk.",
    ],
  },
  {
    category: "Revenue Summary",
    summary:  "Solid growth, $1,097 MRR at churn risk.",
    items: [
      "Projected MRR: $7,785 if 3 qualified leads close.",
      "$1,097 at risk if Al Noor churns.",
      "Net pipeline movement: +$2,997 over next 60 days.",
    ],
  },
  {
    category: "Risk Summary",
    summary:  "1 critical, 1 high, 2 medium.",
    items: [
      "Al Noor Cafe: media + onboarding + inactivity → escalation needed.",
      "Urban Tacos: reports overdue, supply trending low → operator intervention.",
      "Team workload concentration on Priya → cross-train this month.",
    ],
  },
  {
    category: "Client Summary",
    summary:  "2 healthy, 1 warning, 1 critical.",
    items: [
      "Mamadali Kebab House — Healthy, upsell candidate.",
      "Crescent Kitchen — Healthy, on track.",
      "Urban Tacos — Warning, intervention scheduled.",
      "Al Noor Cafe — Critical, rescue call this week.",
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
      "Personally call Al Noor Cafe owner today.",
      "Validate Urban Tacos weekly report this morning.",
      "Open Pro-plan upsell conversation with Mamadali Kebab House.",
      "Send proposals to all 3 qualified leads within 48 hours.",
    ],
  },
];

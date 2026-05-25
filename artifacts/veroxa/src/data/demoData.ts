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

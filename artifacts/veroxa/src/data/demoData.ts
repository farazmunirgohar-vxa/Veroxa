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

// demoActivityLogs.ts — future: activity_logs table
// Covers team activity timeline events and per-client activity log.

// ── Shared role type ──────────────────────────────────────────────
export type ActivityRole =
  | "client"
  | "team"
  | "agent"
  | "system";

// ── DemoActivityEvent — future: activity_logs (simplified display view) ──
export interface DemoActivityEvent {
  id: string;
  timestamp: string;
  eventType: string;
  clientId: string;
  description: string;
  status: "completed" | "in_progress" | "warning";
  role: ActivityRole;
}

export const demoActivityEvents: DemoActivityEvent[] = [
  { id: "a1",  timestamp: "Today, 11:02 AM",    eventType: "Report generated",         clientId: "demo-c", description: "Weekly report draft created for review.",                            status: "in_progress", role: "agent"    },
  { id: "a2",  timestamp: "Today, 10:48 AM",    eventType: "Post scheduled",           clientId: "demo-a", description: "Chicken Shawarma reel scheduled for Tuesday 6:30 PM dinner window.", status: "in_progress", role: "team"     },
  { id: "a3",  timestamp: "Today, 9:20 AM",     eventType: "Review received",          clientId: "demo-d",   description: "3 new Google reviews received (4–5 stars).",                         status: "completed",   role: "system"   },
  { id: "a4",  timestamp: "Today, 9:15 AM",     eventType: "Media reviewed",           clientId: "demo-a", description: "Approved 8 of 12 uploaded photos. 2 blurry, 2 duplicates.",          status: "completed",   role: "agent"    },
  { id: "a5",  timestamp: "Yesterday, 6:30 PM", eventType: "Draft created",            clientId: "demo-b",    description: "Caption Agent generated 3 caption options for taco lunch promo.",     status: "completed",   role: "agent"    },
  { id: "a6",  timestamp: "Yesterday, 5:15 PM", eventType: "Weekly report generated",  clientId: "demo-b",    description: "Weekly report compiled and queued for Veroxa team review.",               status: "in_progress", role: "agent"    },
  { id: "a7",  timestamp: "Yesterday, 2:00 PM", eventType: "Post published",           clientId: "demo-c", description: "Mediterranean platter post published to Instagram and Facebook.",       status: "completed",   role: "team"     },
  { id: "a8",  timestamp: "May 23",             eventType: "Google profile updated",   clientId: "demo-c", description: "Updated business hours and added 4 new menu photos.",                  status: "completed",   role: "team"     },
  { id: "a9",  timestamp: "May 22",             eventType: "Team reviewed report", clientId: "demo-a", description: "Team approved last week's report and sent to client.",             status: "completed",   role: "team" },
  { id: "a10", timestamp: "May 22",             eventType: "Client notification sent", clientId: "demo-b",    description: "Weekly update email delivered to client contact.",                     status: "completed",   role: "system"   },
];

// ── DemoActivity — future: activity_logs (per-client portal view) ─
export type ActivityKind = "upload" | "report" | "google" | "schedule" | "warning" | "milestone";

export interface DemoActivity {
  id:        string;
  clientId:  string;
  kind:      ActivityKind;
  title:     string;
  detail?:   string;
  timestamp: string;
}

export const demoActivityLog: DemoActivity[] = [
  { id: "act1",  clientId: "demo-a", kind: "upload",    title: "Uploaded 8 new media items",   detail: "6 photos, 2 reels.",                                          timestamp: "Today, 9:14 AM"        },
  { id: "act2",  clientId: "demo-a", kind: "schedule",  title: "Content scheduled",             detail: "Friday dinner reel — Thursday 7 PM slot.",                    timestamp: "Today, 11:00 AM"       },
  { id: "act3",  clientId: "demo-a", kind: "report",    title: "Weekly report published",       detail: "Week of May 13 — 5 posts, 3.2k impressions.",                 timestamp: "Yesterday, 9:00 AM"    },
  { id: "act4",  clientId: "demo-a", kind: "milestone", title: "100% onboarding complete",      detail: "All onboarding milestones signed off.",                        timestamp: "Apr 28, 2026"          },
  { id: "act5",  clientId: "demo-b",    kind: "warning",   title: "Media inventory warning",       detail: "Below 2-week runway at current cadence.",                     timestamp: "Today, 8:42 AM"        },
  { id: "act6",  clientId: "demo-b",    kind: "report",    title: "Weekly report overdue",         detail: "Drafted, awaiting validation.",                                timestamp: "Yesterday, 4:00 PM"    },
  { id: "act7",  clientId: "demo-b",    kind: "schedule",  title: "Content scheduled",             detail: "Lunch special — Tuesday 12 PM slot.",                         timestamp: "May 22, 10:00 AM"      },
  { id: "act8",  clientId: "demo-c", kind: "report",    title: "Monthly report published",      detail: "April performance summary delivered.",                         timestamp: "May 4, 2026"           },
  { id: "act9",  clientId: "demo-c", kind: "google",    title: "Google optimisation completed", detail: "Profile keywords + photo set refreshed.",                      timestamp: "May 18, 2026"          },
  { id: "act10", clientId: "demo-c", kind: "upload",    title: "Uploaded 5 media items",        detail: "All approved on first review.",                                timestamp: "May 23, 7:30 AM"       },
  { id: "act11", clientId: "demo-d",   kind: "warning",   title: "Media inventory critical",      detail: "5 days of runway remaining.",                                  timestamp: "Today, 8:42 AM"        },
  { id: "act12", clientId: "demo-d",   kind: "warning",   title: "Onboarding stalled",            detail: "3 outstanding tasks. No client response in 8 days.",           timestamp: "Yesterday"             },
  { id: "act13", clientId: "demo-d",   kind: "upload",    title: "Uploaded 4 media items",        detail: "2 flagged for reshoot by Media Review Agent.",                  timestamp: "May 15, 10:00 AM"      },
];

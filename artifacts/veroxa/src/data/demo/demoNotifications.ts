// demoNotifications.ts — future: notifications table
// Covers operator-facing alerts and role-segmented client/team/operator/owner notifications.

import type { NotificationCategory } from "./demoClientHealth";

// ── DemoNotification — future: notifications (operator-facing) ───
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

// ── Role-segmented notifications — future: notifications with targetRole ─
export type NotificationKind = "success" | "info" | "warning" | "reminder";

export interface DemoRoleNotification {
  id:        string;
  title:     string;
  body:      string;
  kind:      NotificationKind;
  timestamp: string;
  clientId?: string;
}

export const demoRoleNotifications: {
  client:   DemoRoleNotification[];
  team:     DemoRoleNotification[];
  operator: DemoRoleNotification[];
  owner:    DemoRoleNotification[];
} = {
  client: [
    { id: "cn1", title: "Weekly report available",  body: "Your May 13–19 performance summary is ready.",              kind: "success",  timestamp: "Yesterday",   clientId: "mamadali" },
    { id: "cn2", title: "Media needed",             body: "We're running low — please upload more photos this week.",  kind: "reminder", timestamp: "Today",        clientId: "urban"    },
    { id: "cn3", title: "Content scheduled",        body: "Friday dinner reel is locked for 7 PM Thursday.",          kind: "info",     timestamp: "Today",        clientId: "mamadali" },
    { id: "cn4", title: "Onboarding item missing",  body: "We still need your preferred posting windows.",             kind: "warning",  timestamp: "2 days ago",   clientId: "urban"    },
  ],
  team: [
    { id: "tn1", title: "Task assigned",   body: "Review 4 new uploads — Al Noor.",          kind: "info",     timestamp: "Today, 9:14 AM"  },
    { id: "tn2", title: "Review needed",   body: "3 caption variants — Mamadali.",            kind: "reminder", timestamp: "Today, 10:30 AM" },
    { id: "tn3", title: "Content overdue", body: "Urban Tacos lunch post — caption rewrite.", kind: "warning",  timestamp: "Today, 11:00 AM" },
  ],
  operator: [
    { id: "on1", title: "Client risk",               body: "Al Noor inventory critical — 5 days runway.",         kind: "warning",  timestamp: "Today, 8:42 AM"  },
    { id: "on2", title: "Report pending validation", body: "Urban Tacos weekly — drafted, awaiting sign-off.",    kind: "reminder", timestamp: "Today, 9:00 AM"  },
    { id: "on3", title: "Bottleneck detected",       body: "Brand Review backlog — 2 items > 24h.",              kind: "warning",  timestamp: "Today, 10:12 AM" },
  ],
  owner: [
    { id: "wn1", title: "Business risk",        body: "1 client at critical risk — rescue plan in motion.", kind: "warning", timestamp: "Today"     },
    { id: "wn2", title: "Revenue change",       body: "MRR +12% MoM. Pro plan signups trending up.",       kind: "success", timestamp: "Today"     },
    { id: "wn3", title: "Client health trend",  body: "Portfolio average dropped 4 pts week-over-week.",   kind: "info",    timestamp: "Yesterday" },
  ],
};

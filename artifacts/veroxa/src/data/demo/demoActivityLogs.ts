import type { ActivityLogRecord, RestaurantId } from "@/domain/saas/saasTypes";

const DEMO_NOW = "2026-06-03T00:00:00.000Z";

export const demoActivityLogs: ActivityLogRecord[] = [
  {
    id: "demo-activity-map-profile-review",
    restaurantId: "demo-bistro",
    dataMode: "demo",
    entityType: "prepared_action",
    entityId: "demo-action-map-profile-review",
    action: "created",
    actorLabel: "Veroxa demo",
    summary: "Prepared a Google Maps visibility cleanup action for team review.",
    visibility: "team_internal",
    isPersisted: false,
    createdAt: DEMO_NOW,
  },
  {
    id: "demo-activity-client-safe-media",
    restaurantId: "demo-bistro",
    dataMode: "demo",
    entityType: "media_asset",
    entityId: "demo-media-best-seller",
    action: "reviewed",
    actorLabel: "Veroxa team",
    summary: "A best-seller photo was marked useful for a future visibility update.",
    visibility: "client_safe",
    isPersisted: false,
    createdAt: DEMO_NOW,
  },
  {
    id: "demo-activity-report-preview",
    restaurantId: "demo-pizzeria",
    dataMode: "demo",
    entityType: "report",
    entityId: "demo-report-weekly",
    action: "snapshot_previewed",
    actorLabel: "Veroxa demo",
    summary: "Weekly report preview prepared with honest limitations.",
    visibility: "team_internal",
    isPersisted: false,
    createdAt: DEMO_NOW,
  },
];

export function getDemoActivityLogs(restaurantId?: RestaurantId): ActivityLogRecord[] {
  if (!restaurantId) return demoActivityLogs;
  const exact = demoActivityLogs.filter((log) => log.restaurantId === restaurantId);
  return exact.length > 0 ? exact : demoActivityLogs.slice(0, 2).map((log) => ({ ...log, restaurantId }));
}

export type ActivityRole = "client" | "team" | "agent" | "system";
export type ActivityKind = "upload" | "report" | "google" | "schedule" | "warning" | "milestone";

export interface DemoActivityEvent {
  id: string;
  clientId: string;
  role: ActivityRole;
  eventType: string;
  description: string;
  timestamp: string;
  status: "completed" | "in_progress" | "warning";
}

export interface DemoActivity {
  id: string;
  clientId: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  timestamp: string;
}

export const demoActivityEvents: DemoActivityEvent[] = [
  { id: "demo-event-team-visibility", clientId: "demo-bistro", role: "team", eventType: "visibility_review", description: "Prepared a visibility review for sample account activation.", timestamp: "2026-06-03 09:00", status: "completed" },
  { id: "demo-event-client-media", clientId: "demo-bistro", role: "client", eventType: "media_direction", description: "Sample client asked Veroxa to review best-seller media direction.", timestamp: "2026-06-03 10:00", status: "in_progress" },
  { id: "demo-event-system-report", clientId: "demo-pizzeria", role: "system", eventType: "report_preview", description: "Sample report preview entered Veroxa team review.", timestamp: "2026-06-03 11:00", status: "completed" },
];

export const demoActivityLog: DemoActivity[] = [
  { id: "demo-log-media", clientId: "demo-bistro", kind: "upload", title: "Media reviewed", detail: "Best-seller photo marked useful for future visibility update.", timestamp: "2026-06-03 09:30" },
  { id: "demo-log-request", clientId: "demo-bistro", kind: "schedule", title: "Request in review", detail: "Menu link visibility request is waiting for confirmation.", timestamp: "2026-06-03 10:15" },
  { id: "demo-log-report", clientId: "demo-pizzeria", kind: "report", title: "Report preview", detail: "Weekly report preview prepared with honest limitations.", timestamp: "2026-06-03 11:20" },
];

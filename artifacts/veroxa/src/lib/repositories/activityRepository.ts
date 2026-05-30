/**
 * activityRepository.ts — read-only adapter that maps demo activity
 * fixtures into the `ActivityEvent` contract.
 *
 * Read-only. No writes. No network.
 */

import {
  demoActivityEvents,
  demoActivityLog,
  type DemoActivity,
  type DemoActivityEvent,
  type ActivityRole,
} from "@/data/demo/demoActivityLogs";
import type {
  ActivityEvent,
  ActivityVisibility,
  VeroxaRole,
} from "@/lib/data/veroxaDataContracts";

function mapRole(r: ActivityRole): VeroxaRole {
  if (r === "client" || r === "team") return r;
  return "system";
}

function fromEvent(e: DemoActivityEvent): ActivityEvent {
  const visibility: ActivityVisibility =
    e.role === "team" || e.role === "agent" ? "internal_only" : "client_visible";
  return {
    eventId: e.id,
    clientId: e.clientId,
    role: mapRole(e.role),
    action: e.eventType,
    description: e.description,
    createdAt: e.timestamp,
    visibility,
  };
}

function fromClientActivity(a: DemoActivity): ActivityEvent {
  return {
    eventId: a.id,
    clientId: a.clientId,
    role: "system",
    action: a.kind,
    description: a.detail ? `${a.title} — ${a.detail}` : a.title,
    createdAt: a.timestamp,
    visibility: "client_visible",
  };
}

export function getInternalActivityFeed(): ActivityEvent[] {
  return demoActivityEvents.map(fromEvent);
}

export function getActivityForClient(clientId: string): ActivityEvent[] {
  return [
    ...demoActivityEvents.filter((e) => e.clientId === clientId).map(fromEvent),
    ...demoActivityLog.filter((a) => a.clientId === clientId).map(fromClientActivity),
  ];
}

export function getClientVisibleActivity(clientId: string): ActivityEvent[] {
  return getActivityForClient(clientId).filter((e) => e.visibility === "client_visible");
}

export function getRecentSystemEvents(limit = 10): ActivityEvent[] {
  return getInternalActivityFeed().slice(0, limit);
}

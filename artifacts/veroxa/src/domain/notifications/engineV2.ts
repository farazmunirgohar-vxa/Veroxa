import { NotificationRepository } from "./repository";
import type { Notification, RoleNotification, Role } from "./types";

export type NotificationChannel = "in-app" | "email" | "sms" | "push";
export type NotificationPriorityV2 = "low" | "normal" | "high" | "critical";

export interface ChannelPreference {
  role:    Role;
  channel: NotificationChannel;
  enabled: boolean;
}

const defaultPrefs: ChannelPreference[] = (["client", "team"] as Role[]).flatMap((role) => [
  { role, channel: "in-app", enabled: true },
  { role, channel: "email",  enabled: role !== "client" },
  { role, channel: "sms",    enabled: role === "team" },
  { role, channel: "push",   enabled: false },
]);

/**
 * Map either shape to a V2 priority:
 *  - legacy `Notification` carries `category` (critical | warning | info | success)
 *  - per-role `RoleNotification` carries `kind` (success | info | warning | reminder)
 */
function priorityOf(n: Notification | RoleNotification): NotificationPriorityV2 {
  if ("category" in n) {
    if (n.category === "critical") return "critical";
    if (n.category === "warning")  return "high";
    if (n.category === "info")     return "normal";
    return "low"; // success
  }
  // RoleNotification — keyed by `kind`
  if (n.kind === "warning")  return "high";
  if (n.kind === "reminder") return "high";
  if (n.kind === "info")     return "normal";
  return "low"; // success
}

const priorityWeight: Record<NotificationPriorityV2, number> = { critical: 0, high: 1, normal: 2, low: 3 };

export const NotificationEngineV2 = {
  channels(): NotificationChannel[] { return ["in-app", "email", "sms", "push"]; },
  preferencesFor(role: Role): ChannelPreference[] {
    return defaultPrefs.filter((p) => p.role === role);
  },
  enabledChannelsFor(role: Role): NotificationChannel[] {
    return defaultPrefs.filter((p) => p.role === role && p.enabled).map((p) => p.channel);
  },
  forRoleSorted(role: Role): RoleNotification[] {
    return [...NotificationRepository.forRole(role)].sort(
      (a, b) => priorityWeight[priorityOf(a)] - priorityWeight[priorityOf(b)],
    );
  },
  byPriority(priority: NotificationPriorityV2): Notification[] {
    return NotificationRepository.legacy().filter((n) => priorityOf(n) === priority);
  },
  /** Demo-only dispatch — logs intent, does not send. */
  dispatch(_role: Role, _channel: NotificationChannel, _payload: { title: string; body?: string }): { ok: true; channel: NotificationChannel } {
    return { ok: true, channel: _channel };
  },
};

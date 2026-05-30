import type { Role } from "./roles";
import type { PermissionAction } from "./actions";
import type { PermissionResource } from "./resources";

// ─────────────────────────────────────────────────────────────────────────────
// Veroxa Portal Permission Matrix
// Schema/contracts only — not enforced at runtime yet.
// Active human roles are Client and Team/Internal Admin. System remains for
// automated internal processes only and has no portal experience.
// ─────────────────────────────────────────────────────────────────────────────

type Matrix = Readonly<
  Record<Role, Partial<Record<PermissionResource, ReadonlyArray<PermissionAction>>>>
>;

export const permissionMatrix: Matrix = {
  // ── Client ─────────────────────────────────────────────────────────────────
  // Client-safe progress and media submission only. No internal workflow access.
  client: {
    account_profile: ["view", "edit"],
    platform_access: ["view", "edit"],
    media_library: ["create", "edit"],
    post_schedule: ["view"],
    publish_log: ["view"],
    weekly_reports: ["view"],
    monthly_reports: ["view"],
    alerts: ["receive_alert"],
  },

  // ── Team / Internal Admin ──────────────────────────────────────────────────
  // Owns internal workflow, report review, alerts, content health, and
  // automation controls in the two-role architecture.
  team: {
    account_profile: ["view", "edit"],
    onboarding: ["view", "edit"],
    platform_access: ["view", "edit"],
    media_library: ["view", "create", "edit", "approve"],
    content_concepts: ["view", "create", "edit", "approve"],
    draft_sets: ["view", "create", "edit", "approve"],
    draft_variants: ["view", "create", "edit", "approve"],
    post_schedule: ["view", "create", "edit", "approve", "trigger"],
    publish_log: ["view", "create"],
    weekly_reports: ["view", "create", "edit", "approve", "trigger"],
    monthly_reports: ["view", "create", "edit", "approve", "trigger"],
    alerts: ["view", "create", "edit", "trigger", "receive_alert"],
    client_health: ["view", "edit"],
    activity_logs: ["view", "create"],
  },

  // ── System ─────────────────────────────────────────────────────────────────
  // Automated processes only. No human portal user.
  system: {
    activity_logs: ["create"],
    alerts: ["create", "trigger"],
    client_health: ["edit"],
    weekly_reports: ["create", "edit"],
    monthly_reports: ["create", "edit"],
    media_library: ["edit"],
    draft_variants: ["edit"],
    post_schedule: ["edit"],
    publish_log: ["create"],
  },
} as const;

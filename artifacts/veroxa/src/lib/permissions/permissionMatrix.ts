import type { Role } from "./roles";
import type { PermissionAction } from "./actions";
import type { PermissionResource } from "./resources";

// ─────────────────────────────────────────────────────────────────────────────
// Veroxa Portal Permission Matrix
// Schema/contracts only — not enforced at runtime yet.
// Future API/auth layer must enforce these same rules server-side.
// ─────────────────────────────────────────────────────────────────────────────

type Matrix = Readonly<
  Record<Role, Partial<Record<PermissionResource, ReadonlyArray<PermissionAction>>>>
>;

export const permissionMatrix: Matrix = {

  // ── Client ─────────────────────────────────────────────────────────────────
  // High-level visibility only. No access to internal team workflow.
  client: {
    account_profile:  ["view", "edit"],
    platform_access:  ["view", "edit"],      // submit/update their own access details
    media_library:    ["create", "edit"],    // upload before assets enter the review pipeline
    post_schedule:    ["view"],
    publish_log:      ["view"],
    weekly_reports:   ["view"],
    monthly_reports:  ["view"],
    alerts:           ["receive_alert"],
    // Explicitly excluded: content_concepts, draft_sets, draft_variants,
    // internal rejection reasons, internal comments, team tasks.
  },

  // ── Team ───────────────────────────────────────────────────────────────────
  // Executes the content workflow. Manages media → concepts → drafts → schedule.
  team: {
    account_profile:  ["view"],
    platform_access:  ["view", "edit"],
    media_library:    ["view", "edit", "approve"],
    content_concepts: ["view", "approve"],
    draft_sets:       ["create", "edit", "approve"],
    draft_variants:   ["create", "edit", "approve"],
    post_schedule:    ["create", "edit", "trigger"],
    publish_log:      ["view"],
    weekly_reports:   ["trigger"],
    monthly_reports:  ["create", "edit"],    // drafts only — operator approves
    alerts:           ["view", "edit"],
    client_health:    ["view"],
  },

  // ── Operator ────────────────────────────────────────────────────────────────
  // Oversight layer. Reviews team work, approves reports, manages escalations.
  // Should NOT approve every post — that belongs to the team workflow.
  operator: {
    account_profile:  ["view"],
    platform_access:  ["view"],
    media_library:    ["view"],
    content_concepts: ["view"],
    draft_sets:       ["view"],
    draft_variants:   ["view"],
    post_schedule:    ["view"],
    publish_log:      ["view"],
    weekly_reports:   ["view"],
    monthly_reports:  ["view", "approve"],
    alerts:           ["view", "edit", "trigger"], // trigger = escalate
    client_health:    ["view", "edit"],
  },

  // ── Owner ───────────────────────────────────────────────────────────────────
  // Strategic layer. High-level visibility and commercial control only.
  // Should NOT manage daily execution tasks.
  owner: {
    account_profile:    ["view", "edit"],   // commercial/lifecycle fields
    onboarding:         ["view"],
    platform_access:    ["view"],
    media_library:      ["view"],
    content_concepts:   ["view"],
    draft_sets:         ["view"],
    draft_variants:     ["view"],
    post_schedule:      ["view"],
    publish_log:        ["view"],
    weekly_reports:     ["view"],
    monthly_reports:    ["view"],
    alerts:             ["view", "receive_alert"],
    client_health:      ["view"],
    user_admin:         ["create", "edit"],  // internal user management
    revenue_dashboard:  ["view"],
    activity_logs:      ["view"],
  },

  // ── System ──────────────────────────────────────────────────────────────────
  // Automated processes only. No human portal user.
  system: {
    activity_logs:    ["create"],
    alerts:           ["create", "trigger"],  // create + escalate
    client_health:    ["edit"],               // update derived health scores
    weekly_reports:   ["create", "edit"],     // aggregate reporting
    monthly_reports:  ["create", "edit"],     // aggregate reporting
    media_library:    ["edit"],               // mark status after simulated publish
    draft_variants:   ["edit"],               // mark as used after simulated publish
    post_schedule:    ["edit"],               // mark slot status after simulated publish
    publish_log:      ["create"],
  },
} as const;

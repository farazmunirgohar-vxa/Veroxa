/**
 * onboardingHandoffTypes.ts — types for the Audit Lead → onboarding handoff.
 *
 * LOCAL / SESSION ONLY. No Supabase, no provisioning, no payments, no account
 * creation. The handoff state and checklist live in the browser only and
 * describe what a future backend WOULD do — they never actually do it.
 */

// ---------------------------------------------------------------------------
// Handoff lifecycle — from won lead toward an active client (simulated).
// ---------------------------------------------------------------------------

export type HandoffStatus =
  | "not_started"
  | "walkthrough_scheduled"
  | "package_selected"
  | "account_prepared"
  | "onboarding_in_progress"
  | "client_active";

export const HANDOFF_STATUS_LABELS: Record<HandoffStatus, string> = {
  not_started: "Not started",
  walkthrough_scheduled: "Walkthrough scheduled",
  package_selected: "Package selected",
  account_prepared: "Account prepared",
  onboarding_in_progress: "Onboarding in progress",
  client_active: "Client active",
};

export const HANDOFF_STATUS_ORDER: HandoffStatus[] = [
  "not_started",
  "walkthrough_scheduled",
  "package_selected",
  "account_prepared",
  "onboarding_in_progress",
  "client_active",
];

// ---------------------------------------------------------------------------
// Local onboarding checklist — toggled in-browser only.
// ---------------------------------------------------------------------------

export type OnboardingChecklistKey =
  | "confirm_package"
  | "schedule_walkthrough"
  | "collect_brand_basics"
  | "set_first_seven_day_focus"
  | "share_portal_access"
  | "human_review_complete";

export const ONBOARDING_CHECKLIST_ITEMS: {
  key: OnboardingChecklistKey;
  label: string;
}[] = [
  { key: "confirm_package", label: "Confirm recommended package with the owner" },
  { key: "schedule_walkthrough", label: "Schedule the onboarding walkthrough" },
  { key: "collect_brand_basics", label: "Collect brand basics (logo, tone, hours)" },
  {
    key: "set_first_seven_day_focus",
    label: "Agree the first 7-day content focus",
  },
  { key: "share_portal_access", label: "Prepare portal access to share" },
  {
    key: "human_review_complete",
    label: "Human review of the handoff complete",
  },
];

// ---------------------------------------------------------------------------
// Per-lead handoff record (browser-only).
// ---------------------------------------------------------------------------

export interface OnboardingHandoffState {
  leadId: string;
  status: HandoffStatus;
  /** Map of checklist key → completed. Missing key means not done. */
  checklist: Partial<Record<OnboardingChecklistKey, boolean>>;
  /** Optional free-text first 7-day focus the team agreed. */
  firstSevenDayFocus?: string;
  /** Plain marker that this is simulated only. */
  simulatedOnly: true;
}

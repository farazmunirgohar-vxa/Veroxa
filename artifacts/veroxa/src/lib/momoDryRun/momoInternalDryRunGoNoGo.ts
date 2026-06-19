export type MomoDryRunStatus =
  | "not_started"
  | "blocked"
  | "needs_business_truth_confirmation"
  | "needs_media_rights_confirmation"
  | "needs_ai_rules_review"
  | "needs_ai_approval_review"
  | "needs_faraz_review"
  | "ready_for_internal_dry_run_only"
  | "no_go"
  | "go_for_internal_review_only"
  | "future_step_required";

export type MomoDryRunRisk = "low" | "medium" | "high" | "critical";

export type MomoDryRunCategory =
  | "Dry Run Scope"
  | "Preflight Requirements"
  | "Business Truth Readiness"
  | "Media Content Readiness"
  | "Brand AI Readiness"
  | "AI Generation Readiness"
  | "AI Approval Readiness"
  | "Activity Log Readiness"
  | "Report Readiness"
  | "Client Visibility Boundaries"
  | "Real Auth / Access Blockers"
  | "No-Publication Boundaries"
  | "Go / No-Go Decision"
  | "Safe Internal Next Decision";

export type MomoDryRunItem = {
  id: string;
  category: MomoDryRunCategory;
  title: string;
  status: MomoDryRunStatus;
  risk: MomoDryRunRisk;
  description: string;
  evidence_note: string;
  blocked_if: string;
  safe_internal_next_step: string;
  route_href?: string;
};

export const MOMO_DRY_RUN_CATEGORIES: MomoDryRunCategory[] = [
  "Dry Run Scope",
  "Preflight Requirements",
  "Business Truth Readiness",
  "Media Content Readiness",
  "Brand AI Readiness",
  "AI Generation Readiness",
  "AI Approval Readiness",
  "Activity Log Readiness",
  "Report Readiness",
  "Client Visibility Boundaries",
  "Real Auth / Access Blockers",
  "No-Publication Boundaries",
  "Go / No-Go Decision",
  "Safe Internal Next Decision",
];

export const MOMO_DRY_RUN_ALLOWED_DECISION_STATES: MomoDryRunStatus[] = [
  "no_go",
  "blocked",
  "needs_faraz_review",
  "ready_for_internal_dry_run_only",
  "go_for_internal_review_only",
  "future_step_required",
];

export const MOMO_DRY_RUN_SAFETY_COPY = [
  "Internal dry run and go/no-go review only.",
  "This does not activate the pilot.",
  "This does not turn on real auth.",
  "This does not create credentials.",
  "This does not contact Momo’s House.",
  "This does not expose anything to the client.",
  "This does not generate AI output.",
  "This does not create fake AI drafts.",
  "This does not create fake approvals.",
  "This does not create fake reports.",
  "This does not upload, create, seed, generate, or fake media.",
  "This does not publish externally.",
  "This does not connect Google, Meta, Yelp, TikTok, or delivery platforms.",
  "Business-truth changes still require owner confirmation.",
  "Media usage rights require owner confirmation before public use.",
  "Sensitive claims are blocked until owner-confirmed.",
  "Momo owner walkthrough remains blocked.",
  "No next activation PR is approved by default.",
  "Future real-world activation requires separate explicit Faraz approval.",
];

const item = (category: MomoDryRunCategory, id: string, title: string, status: MomoDryRunStatus, risk: MomoDryRunRisk, description: string, route_href?: string): MomoDryRunItem => ({
  id,
  category,
  title,
  status,
  risk,
  description,
  evidence_note: "Static Team-only review item for PR #120; no records, writes, generated output, or external side effects are created.",
  blocked_if: "Blocked if this dry run needs client visibility, external action, unconfirmed business truth, unconfirmed media rights, generated output, public posting, real auth, credentials, platform connections, or implied completion.",
  safe_internal_next_step: "Review the linked internal Team surface, keep blockers explicit, and require separate Faraz approval before any future real-world step.",
  route_href,
});

export const MOMO_DRY_RUN_ITEMS: MomoDryRunItem[] = [
  item("Dry Run Scope", "scope-team-only", "Internal Team-only dry run boundary", "ready_for_internal_dry_run_only", "medium", "Simulates the operating workflow internally with no client visibility, owner visibility, external publishing, real auth activation, platform connections, fake data, fake success state, or automated execution.", "/team/control-center"),
  item("Preflight Requirements", "preflight-foundations", "Foundations to review before dry run", "needs_faraz_review", "high", "Checks Momo Prep Pack, Business Truth Review, Media + Content Inventory, Brand Voice + AI Rules, Controlled AI Generation Foundation, AI Draft Approval Queue, Activity Log foundation, Reports From Activity foundation, Readiness Gate, and Activation Gate.", "/team/momo-pilot-prep"),
  item("Business Truth Readiness", "truth-blockers", "Business-truth confirmation blockers", "needs_business_truth_confirmation", "critical", "No-go if required business truth, menu/prices/hours/order links, delivery/catering status, sensitive claims, or owner confirmation remain unresolved.", "/team/momo-business-truth"),
  item("Media Content Readiness", "media-rights-blockers", "Media/content rights and accuracy blockers", "needs_media_rights_confirmation", "critical", "No-go if media usage rights are unconfirmed, food photos/videos are critically missing, staff/customer consent is needed, media could mislead customers, generated media is required, or snack/drink availability is unconfirmed.", "/team/momo-media-content"),
  item("Brand AI Readiness", "brand-ai-rules", "Brand and prompt-rule safety", "needs_ai_rules_review", "high", "No-go if brand voice rules are incomplete, unsafe tone remains unresolved, sensitive claim rules are not checked, prompt boundaries are missing, or local SEO rules could invent claims.", "/team/momo-brand-ai-rules"),
  item("AI Generation Readiness", "ai-generation-off", "AI generation foundation must stay controlled", "blocked", "critical", "No-go if generation is enabled by default, provider calls are active without approval, the feature flag is unclear, client-visible AI output exists, auto-generation exists, scheduled/background generation exists, or confirmed truth/media rights are missing.", "/team/momo-ai-generation"),
  item("AI Approval Readiness", "ai-approval-states", "AI draft approval queue review", "needs_ai_approval_review", "critical", "No-go if Team review, Faraz escalation, hold/reject/edit-needed states, owner-confirmation-needed blockers, manual execution readiness criteria, or auto-approval protections are missing.", "/team/momo-ai-approval"),
  item("Activity Log Readiness", "activity-log-real-structures", "Activity log structures only", "needs_faraz_review", "high", "Dry run may reference real Veroxa activity structures only; no fake activity, external activity implication, client-visible activity creation, or side-effecting activity behavior is allowed.", "/team/activity-log"),
  item("Report Readiness", "reports-no-fake-results", "Report readiness without fake reports", "needs_faraz_review", "high", "Dry run prepares report readiness only; no fake metrics, fake results, performance claims, ROI/ranking/sales/customer/reach/engagement/growth claims, or unapproved client-visible reports.", "/team/reports-from-activity"),
  item("Client Visibility Boundaries", "client-boundary", "Client and owner visibility blocked", "blocked", "critical", "No-go if a dry-run page is client-visible, AI output is client-visible, owner walkthrough route is active, client invite or credentials are created, or an external message is sent."),
  item("Real Auth / Access Blockers", "auth-access-boundary", "Real auth and access boundary", "blocked", "critical", "No-go if real auth is active, AUTH_MODE is not placeholder, /api/pilot-access is removed without approval, roles expand beyond client/team, owner/operator/admin surfaces appear, or access setup implies platform connections."),
  item("No-Publication Boundaries", "no-publication", "No-publication and no-connector boundary", "blocked", "critical", "No-go if publish/post/send controls, external sync, Google/Meta/TikTok/Yelp/delivery connections, token handling, scheduled jobs, webhooks, background jobs, payments appear."),
  item("Go / No-Go Decision", "decision-states", "Conservative internal decision states only", "no_go", "high", "Allowed states are no_go, blocked, needs_faraz_review, ready_for_internal_dry_run_only, go_for_internal_review_only, and future_step_required; these do not imply launch, production, publication, client, or owner walkthrough readiness."),
  item("Safe Internal Next Decision", "safe-next-step", "Safe next internal decision", "future_step_required", "medium", "If no-go, fix internal blockers. If go-for-internal-review-only, Faraz reviews before the next PR. Any future external step requires separate explicit approval; no client or owner outreach happens here."),
];

export type MomoWorkspaceSnapshotStatus =
  | "blocked"
  | "needs_faraz_review"
  | "needs_owner_confirmation"
  | "needs_media_rights_confirmation"
  | "internal_review_only"
  | "disabled_by_default"
  | "ready_for_internal_review_only"
  | "future_step_required";

export type MomoWorkspaceSnapshotRisk = "low" | "medium" | "high" | "critical";

export type MomoWorkspaceSnapshotCategory =
  | "Operating Baseline"
  | "Top Blockers"
  | "Business Truth"
  | "Media Content"
  | "Brand AI Rules"
  | "AI Generation"
  | "AI Approval"
  | "Reports Activity"
  | "Readiness Dry Run"
  | "Safety Boundaries"
  | "Safe Next Actions";

export type MomoWorkspaceSnapshotItem = {
  id: string;
  category: MomoWorkspaceSnapshotCategory;
  title: string;
  status: MomoWorkspaceSnapshotStatus;
  risk: MomoWorkspaceSnapshotRisk;
  summary: string;
  evidence_note: string;
  safe_next_step: string;
  route_href?: string;
  secondary_route_href?: string;
};

export const momoWorkspaceOperatingSnapshot: MomoWorkspaceSnapshotItem[] = [
  {
    id: "operating-baseline-pr120",
    category: "Operating Baseline",
    title: "Current source-of-truth baseline",
    status: "internal_review_only",
    risk: "medium",
    summary: "PR #120 remains the current operating baseline; PR #126 grouped Momo Workspace exists; PR #128 made the grouped workspace the primary Team navigation path while standalone Momo routes remain compatibility/detail routes. The dashboard is internal-only.",
    evidence_note: "Uses the locked post-PR120 operating model and grouped Momo Workspace direction.",
    safe_next_step: "Use this dashboard as a review map only; do not treat it as activation approval.",
    route_href: "/team/momo/work",
  },
  {
    id: "top-blockers-confirmations-and-activation",
    category: "Top Blockers",
    title: "Blocking approvals remain unresolved",
    status: "blocked",
    risk: "critical",
    summary: "Business truth is not owner-confirmed, media usage rights are not owner-confirmed, sensitive claims remain blocked, AI generation is disabled by default, owner walkthrough is not approved, real auth is not approved, and external platforms are not approved.",
    evidence_note: "These are blockers, not outreach tasks or implied approvals.",
    safe_next_step: "Review blockers internally and keep owner walkthrough, real auth, publishing, and integrations blocked.",
    route_href: "/team/momo/readiness",
  },
  {
    id: "business-truth-owner-confirmation-required",
    category: "Business Truth",
    title: "Business truth review exists but is not public-ready",
    status: "needs_owner_confirmation",
    risk: "critical",
    summary: "Business truth review exists, but public/customer-visible use requires owner confirmation. Sensitive claims are blocked until owner-confirmed, and menu, prices, hours, offers, and platform claims cannot be invented.",
    evidence_note: "Business-truth changes require owner confirmation before customer-visible use.",
    safe_next_step: "Review business truth internally without confirming or publishing anything automatically.",
    route_href: "/team/momo-business-truth",
    secondary_route_href: "/team/momo/intelligence",
  },
  {
    id: "media-content-rights-required",
    category: "Media Content",
    title: "Media/content inventory is rights-gated",
    status: "needs_media_rights_confirmation",
    risk: "high",
    summary: "Media/content inventory exists, but media usage rights require owner confirmation. This dashboard does not upload, create, seed, or fake media; later AI may only use confirmed business truth and permissioned media.",
    evidence_note: "Media rights are a blocker for public/customer-visible use.",
    safe_next_step: "Review the media/content inventory internally and keep rights confirmation unresolved until explicitly confirmed.",
    route_href: "/team/momo-media-content",
    secondary_route_href: "/team/momo/intelligence",
  },
  {
    id: "brand-ai-rules-review",
    category: "Brand AI Rules",
    title: "Brand/AI prompt rules constrain future drafts",
    status: "needs_faraz_review",
    risk: "high",
    summary: "Brand/AI prompt rules exist. AI must not invent menu, prices, hours, offers, claims, delivery/catering, halal/dietary claims, awards, ownership, authenticity, health claims, or platform access. All future AI output requires Team/Faraz review.",
    evidence_note: "Rules are internal guardrails; they do not generate output by themselves.",
    safe_next_step: "Review rules for completeness before any future approved AI work.",
    route_href: "/team/momo-brand-ai-rules",
    secondary_route_href: "/team/momo/content-ai",
  },
  {
    id: "ai-generation-disabled",
    category: "AI Generation",
    title: "Controlled AI generation remains disabled by default",
    status: "disabled_by_default",
    risk: "critical",
    summary: "Controlled AI generation foundation exists, but AI generation remains disabled by default: no provider calls, no AI provider keys, no client-visible AI output, no auto-generation, and no publishing.",
    evidence_note: "This snapshot does not call providers or create AI drafts.",
    safe_next_step: "Review generation blockers and keep generation disabled unless a later explicit approval changes scope.",
    route_href: "/team/momo-ai-generation",
    secondary_route_href: "/team/momo/content-ai",
  },
  {
    id: "ai-approval-no-auto-approval",
    category: "AI Approval",
    title: "AI approval queue requires Team review",
    status: "internal_review_only",
    risk: "high",
    summary: "AI approval queue exists with no auto-approval and no auto-publishing. Drafts may move forward only after Team/Faraz review, and owner-confirmation-needed remains a blocker, not an outreach action.",
    evidence_note: "Approval queue state does not equal publishing permission.",
    safe_next_step: "Review the approval queue internally without approving, publishing, or contacting the owner automatically.",
    route_href: "/team/momo-ai-approval",
    secondary_route_href: "/team/momo/content-ai",
  },
  {
    id: "reports-activity-real-only",
    category: "Reports Activity",
    title: "Reports and activity must be real-work based",
    status: "internal_review_only",
    risk: "high",
    summary: "Reports must be based on real Veroxa activity only. No fake reports, fake metrics, ROI/sales/ranking/reach claims, or unreviewed client-visible reports are allowed.",
    evidence_note: "This dashboard does not create reports, activity, metrics, or performance claims.",
    safe_next_step: "Review activity/report foundations and keep any client-visible report gated by review/approval.",
    route_href: "/team/momo/reports",
    secondary_route_href: "/team/activity-log",
  },
  {
    id: "readiness-dry-run-not-activation",
    category: "Readiness Dry Run",
    title: "Readiness and dry-run remain internal review only",
    status: "ready_for_internal_review_only",
    risk: "critical",
    summary: "Readiness, activation gate, and dry-run/go-no-go remain internal review only. Activation is not approved, owner walkthrough remains blocked, real auth remains off, and future real-world activation requires separate explicit Faraz approval.",
    evidence_note: "Dry-run review is not activation and does not authorize outreach.",
    safe_next_step: "Review dry-run/go-no-go internally and keep all activation gates closed.",
    route_href: "/team/momo/readiness",
    secondary_route_href: "/team/momo-dry-run-go-no-go",
  },
  {
    id: "safety-boundaries-hard-lock",
    category: "Safety Boundaries",
    title: "Hard boundaries remain locked",
    status: "blocked",
    risk: "critical",
    summary: "No pilot activation, No real auth activation, no credentials, No Momo contact, no publishing, no external integrations, no AI generation, no fake data, and no next activation PR approved by default.",
    evidence_note: "Boundaries are explicit operating locks for this dashboard PR.",
    safe_next_step: "Keep the dashboard as a read-only internal operating snapshot.",
    route_href: "/team/control-center",
  },
  {
    id: "safe-next-internal-actions-only",
    category: "Safe Next Actions",
    title: "Safe internal review actions only",
    status: "future_step_required",
    risk: "medium",
    summary: "Safe actions are to review business truth, media/content inventory, brand/AI rules, AI generation blockers, AI approval queue, dry-run/go-no-go gate, reports/activity, and keep owner walkthrough blocked.",
    evidence_note: "No action here contacts the owner, invites a client, activates the pilot, goes live, publishes, connects platforms, turns on real auth, or generates AI now.",
    safe_next_step: "Continue internal review across the grouped Momo Workspace and detail routes.",
    route_href: "/team/momo/work",
  },
];

export const momoWorkspaceSnapshotCategories: MomoWorkspaceSnapshotCategory[] = [
  "Operating Baseline",
  "Top Blockers",
  "Business Truth",
  "Media Content",
  "Brand AI Rules",
  "AI Generation",
  "AI Approval",
  "Reports Activity",
  "Readiness Dry Run",
  "Safety Boundaries",
  "Safe Next Actions",
];

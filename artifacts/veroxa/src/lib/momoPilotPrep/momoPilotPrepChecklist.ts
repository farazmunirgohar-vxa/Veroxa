export type MomoPilotPrepStatus =
  | "blocked"
  | "not_started"
  | "needs_faraz_review"
  | "needs_owner_confirmation"
  | "needs_media"
  | "needs_access_confirmation"
  | "ready_for_internal_review_only"
  | "future_step_required";

export type MomoPilotPrepSeverity = "critical" | "warning" | "info";

export type MomoPilotPrepCategory =
  | "Business Truth Confirmation"
  | "Missing / Uncertain Fields"
  | "Media Needs"
  | "Access / Account Needs"
  | "Internal Owner Walkthrough Prep"
  | "Activation Boundaries"
  | "Next Decision";

export type MomoPilotPrepChecklistItem = {
  id: string;
  category: MomoPilotPrepCategory;
  title: string;
  status: MomoPilotPrepStatus;
  severity: MomoPilotPrepSeverity;
  description: string;
  evidence: string;
  safe_next_step: string;
  route_href?: string;
};

export const MOMO_PILOT_PREP_CATEGORIES: MomoPilotPrepCategory[] = [
  "Business Truth Confirmation",
  "Missing / Uncertain Fields",
  "Media Needs",
  "Access / Account Needs",
  "Internal Owner Walkthrough Prep",
  "Activation Boundaries",
  "Next Decision",
];

export const MOMO_PILOT_PREP_CHECKLIST: MomoPilotPrepChecklistItem[] = [
  {
    id: "business-truth-name-address-phone",
    category: "Business Truth Confirmation",
    title: "Restaurant legal/display name, address, and phone",
    status: "needs_owner_confirmation",
    severity: "critical",
    description: "Confirm exact public name, legal/display naming preference, address formatting, and phone number before any customer-visible use.",
    evidence: "Known only from Veroxa/internal context until owner confirmation is documented.",
    safe_next_step: "Keep as owner-confirmation blocker; do not mark complete from internal memory alone.",
    route_href: "/team/profile-corrections",
  },
  {
    id: "business-truth-hours-menu-links",
    category: "Business Truth Confirmation",
    title: "Hours, menu, prices, website, order, and delivery links",
    status: "needs_owner_confirmation",
    severity: "critical",
    description: "Hours, menu items, pricing, website links, ordering links, and delivery/catering status are business-truth fields.",
    evidence: "Current repo guardrails require owner/client confirmation for public-facing business-truth changes.",
    safe_next_step: "List unknowns internally and require owner confirmation before any public copy or profile correction.",
    route_href: "/team/momo-live-readiness",
  },
  {
    id: "business-truth-identity-claims",
    category: "Business Truth Confirmation",
    title: "Cuisine, identity, halal/dietary/ownership/sensitive claims",
    status: "needs_owner_confirmation",
    severity: "critical",
    description: "Cuisine positioning, halal or dietary language, ownership claims, and sensitive claims must not be invented or assumed.",
    evidence: "Locked safety rules classify sensitive public claims as confirmation-required.",
    safe_next_step: "Prepare an internal questions list only; no public claim is approved by this prep pack.",
  },
  {
    id: "missing-uncertain-fields",
    category: "Missing / Uncertain Fields",
    title: "Separate internally known context from owner-confirmed truth",
    status: "needs_faraz_review",
    severity: "warning",
    description: "Fields must be labeled as internally known, unknown, or owner-confirmed; this pack must avoid claiming completion.",
    evidence: "PR #114 is internal preparation only and cannot create readiness evidence.",
    safe_next_step: "Faraz reviews the internal list and keeps unconfirmed fields blocked before any client-facing walkthrough decision.",
  },
  {
    id: "media-food-video-logo-storefront",
    category: "Media Needs",
    title: "Food photos, short videos, logo, storefront/interior, and prep visuals",
    status: "needs_media",
    severity: "warning",
    description: "Collect usable media requirements including food photos, short clips, logo, storefront/interior if available, Momo prep/behind-the-scenes, and international snack/drink visuals if used.",
    evidence: "Media requirements are checklist needs only; no media is created, seeded, or published by this pack.",
    safe_next_step: "Review existing upload inbox and record gaps internally; media is not published automatically.",
    route_href: "/team/upload-inbox",
  },
  {
    id: "access-account-needs",
    category: "Access / Account Needs",
    title: "Google, Meta, Instagram/Facebook, website, email, domain, and delivery access notes",
    status: "needs_access_confirmation",
    severity: "critical",
    description: "Track access/account needs as checklist items only for Google Business Profile, Meta Business Suite / Business Portfolio, Instagram/Facebook, website/domain/email, and delivery platforms.",
    evidence: "No connect buttons, OAuth, token storage, platform sync, credentials, or external platform setup are added.",
    safe_next_step: "Keep access needs internal until a separate approved activation/access plan exists.",
  },
  {
    id: "internal-walkthrough-talking-points",
    category: "Internal Owner Walkthrough Prep",
    title: "Internal draft talking points for Faraz only",
    status: "blocked",
    severity: "critical",
    description: "Draft talking points should explain that Veroxa helps restaurants become easier to find, trust, and choose while keeping the Momo owner walkthrough blocked.",
    evidence: "No owner walkthrough is unlocked by PR #114.",
    safe_next_step: "Use this as internal prep language only; do not treat it as outreach or an invitation.",
  },
  {
    id: "activation-boundaries",
    category: "Activation Boundaries",
    title: "PR #114 safety boundary",
    status: "blocked",
    severity: "critical",
    description: "PR #114 does not activate the pilot, does not create credentials, does not contact Momo’s House, does not publish externally, and does not connect platforms.",
    evidence: "Future real-world activation requires separate explicit Faraz approval; no next activation PR is approved by default.",
    safe_next_step: "Keep this route internal and review-only.",
    route_href: "/team/momo-activation-gate",
  },
  {
    id: "next-decision",
    category: "Next Decision",
    title: "Faraz internal review before any future decision",
    status: "future_step_required",
    severity: "info",
    description: "Faraz reviews internal prep, fixes internal blockers, or collects more internal information if incomplete.",
    evidence: "No client/owner outreach, activation, or owner walkthrough decision is made by this PR.",
    safe_next_step: "Stay inside existing Team pages and require a separate explicit approval for any future real-world step.",
    route_href: "/team/control-center",
  },
];

export const MOMO_PILOT_PREP_ALLOWED_TEAM_LINKS = [
  "/team/momo-live-readiness",
  "/team/momo-activation-gate",
  "/team/control-center",
  "/team/profile-corrections",
  "/team/upload-inbox",
  "/team/messages",
  "/team/activity-log",
  "/team/ai-drafts",
  "/team/reports-from-activity",
] as const;

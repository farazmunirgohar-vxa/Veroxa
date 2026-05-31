import type { ReadinessArea, ReadinessCheck } from "./types";

const readinessChecks: readonly ReadinessCheck[] = [
  {
    key: "client-dashboard-safe-states",
    area: "client_portal",
    label: "Client Dashboard has safe empty/review states",
    description: "The client home can show account-preparation status without pretending live client data is connected.",
    status: "passing",
    severity: "blocker",
    recommendedAction: "Keep the client dashboard calm and review-safe before launch.",
  },
  {
    key: "client-media-dependency",
    area: "media_workflow",
    label: "Client Media page explains media dependency",
    description: "Posting support stays tied to usable client-provided media.",
    status: "passing",
    severity: "blocker",
    recommendedAction: "Continue making media requests specific and easy for the client.",
  },
  {
    key: "client-requests-input",
    area: "client_requests",
    label: "Client Requests page supports client input",
    description: "The client has a place to understand what Veroxa needs next.",
    status: "passing",
    severity: "blocker",
    recommendedAction: "Use requests for business-truth confirmation and missing context.",
  },
  {
    key: "client-updates-no-fake-metrics",
    area: "client_updates",
    label: "Client Updates page avoids fake metrics",
    description: "Updates focus on real preparation status and reviewed work.",
    status: "passing",
    severity: "blocker",
    recommendedAction: "Keep updates about actual work, review status, and next needs.",
  },
  {
    key: "client-reports-no-fake-metrics",
    area: "reports",
    label: "Client Reports page avoids fake metrics",
    description: "Reports do not invent revenue, clicks, rankings, walk-ins, follower growth, review growth, or ad results.",
    status: "passing",
    severity: "blocker",
    recommendedAction: "Report completed work and verified account activity only.",
  },
  {
    key: "team-upload-inbox-exists",
    area: "team_portal",
    label: "Team Upload Inbox exists",
    description: "Faraz can review incoming media and client submissions manually.",
    status: "passing",
    severity: "blocker",
    recommendedAction: "Use the inbox to triage media before any public work.",
  },
  {
    key: "team-approval-queue-exists",
    area: "approval_gates",
    label: "Team Approval Queue exists",
    description: "Prepared actions have a review surface before any public/customer-visible action.",
    status: "passing",
    severity: "blocker",
    recommendedAction: "Keep every public action behind Veroxa team review.",
  },
  {
    key: "team-report-queue-exists",
    area: "reports",
    label: "Team Report Queue exists",
    description: "Reports can be reviewed manually before clients receive updates.",
    status: "passing",
    severity: "warning",
    recommendedAction: "Keep reports concise and grounded in verified work.",
  },
  {
    key: "pricing-guardrails-pass",
    area: "pricing_alignment",
    label: "Pricing guardrails pass",
    description: "Active pricing remains aligned to Essential, Growth, and Premium source of truth.",
    status: "passing",
    severity: "blocker",
    recommendedAction: "Run pricing drift checks before shipping pricing-adjacent changes.",
  },
  {
    key: "portal-separation-guardrails-pass",
    area: "role_separation",
    label: "Portal separation guardrails pass",
    description: "Public demo, client portal, and team portal routes stay separated.",
    status: "passing",
    severity: "blocker",
    recommendedAction: "Keep demo preview and real portal routes separate.",
  },
  {
    key: "business-guardrails-pass",
    area: "launch_guardrails",
    label: "Business guardrails pass",
    description: "Service boundaries, route roles, and core launch rules remain protected.",
    status: "passing",
    severity: "blocker",
    recommendedAction: "Run business guardrails before first-client readiness changes ship.",
  },
  {
    key: "no-auto-publishing-claim",
    area: "service_boundaries",
    label: "No automatic publishing claim",
    description: "The product does not imply public work goes live without review.",
    status: "passing",
    severity: "blocker",
    recommendedAction: "Use manual review and queue-for-later language.",
  },
  {
    key: "no-owner-operator-active-role",
    area: "role_separation",
    label: "No inactive role is active",
    description: "Only Restaurant Partner / Client and Veroxa Team / Faraz are active today.",
    status: "passing",
    severity: "blocker",
    recommendedAction: "Do not add parked role dashboards without explicit instruction.",
  },
  {
    key: "max-one-post-per-day",
    area: "pricing_alignment",
    label: "Max 1 post/day rule is preserved",
    description: "All active plans remain capped at max 1 post/day depending on usable client-provided media.",
    status: "passing",
    severity: "blocker",
    recommendedAction: "Keep posting-volume copy aligned to the locked pricing model.",
  },
  {
    key: "premium-same-posting-cap",
    area: "pricing_alignment",
    label: "Premium does not increase posting cap",
    description: "Premium adds readiness/support for ads after assessment, not a higher public posting cap.",
    status: "passing",
    severity: "blocker",
    recommendedAction: "Keep Premium copy clear that ad spend is separate and posting cap remains unchanged.",
  },
  {
    key: "no-customer-service-claim",
    area: "service_boundaries",
    label: "No customer-service conversation claim",
    description: "Veroxa does not claim to handle DMs, comments, inboxes, complaints, refunds, or order questions at launch.",
    status: "passing",
    severity: "blocker",
    recommendedAction: "Keep client and public copy focused on online presence and reviewed work.",
  },
  {
    key: "business-truth-confirmation",
    area: "approval_gates",
    label: "Business-truth changes require client confirmation",
    description: "Hours, menu, prices, offers, and sensitive claims need client confirmation before public use.",
    status: "passing",
    severity: "blocker",
    recommendedAction: "Ask the client before approving business-truth changes.",
  },
  {
    key: "client-safe-language",
    area: "data_readiness",
    label: "No public client sees internal language",
    description: "Client-visible surfaces avoid technical and internal operating terms.",
    status: "passing",
    severity: "blocker",
    recommendedAction: "Use client-safe labels such as Prepared by Veroxa, In review, and Needs your input.",
  },
];

export function getFirstClientReadinessChecks(): readonly ReadinessCheck[] {
  return readinessChecks;
}

export function getChecksByArea(area: ReadinessArea): readonly ReadinessCheck[] {
  return readinessChecks.filter((check) => check.area === area);
}

export function getBlockingChecks(checks: readonly ReadinessCheck[] = readinessChecks): readonly ReadinessCheck[] {
  return checks.filter((check) => check.severity === "blocker" && check.status !== "passing");
}

export function getWarningChecks(checks: readonly ReadinessCheck[] = readinessChecks): readonly ReadinessCheck[] {
  return checks.filter((check) => check.status === "warning" || check.severity === "warning");
}

export function getPassingChecks(checks: readonly ReadinessCheck[] = readinessChecks): readonly ReadinessCheck[] {
  return checks.filter((check) => check.status === "passing");
}

export function getRecommendedNextReadinessAction(checks: readonly ReadinessCheck[] = readinessChecks): string {
  const blockingCheck = getBlockingChecks(checks)[0];
  if (blockingCheck) return blockingCheck.recommendedAction;

  const warningCheck = getWarningChecks(checks).find((check) => check.status !== "passing");
  if (warningCheck) return warningCheck.recommendedAction;

  return "Review the first 1–5 benchmark scenarios with Faraz before launching the first client account.";
}

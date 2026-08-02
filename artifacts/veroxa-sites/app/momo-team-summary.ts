import type { MomoWorkspaceData } from "./momo-data.ts";
import {
  momoConnectionIsCurrentlyEligible,
  momoTruthFieldIsCurrentlyUsable,
} from "./momo-operating-gates.ts";

export type MomoTeamDestination =
  | "team-intelligence"
  | "team-media"
  | "team-content"
  | "team-presence"
  | "team-work"
  | "team-reports"
  | "team-readiness";

export type MomoTeamAttention = {
  key: string;
  title: string;
  detail: string;
  action: string;
  destination: MomoTeamDestination;
  tone: "urgent" | "decision" | "standard";
};

export type MomoTeamStageStatus =
  | "Complete"
  | "In progress"
  | "Needs attention"
  | "Waiting on Momo"
  | "Blocked"
  | "Not started";

export type MomoTeamStage = {
  key: string;
  title: string;
  status: MomoTeamStageStatus;
  detail: string;
  destination: MomoTeamDestination;
};

export type MomoTeamRecentUpdate = {
  id: string;
  title: string;
  occurredAt: string;
};

const providerCapability = (provider: string) =>
  provider === "google_business" ? "google_business_publish"
    : provider === "facebook" ? "facebook_publish"
      : provider === "instagram" ? "instagram_publish"
        : null;

const recentUpdateTitle = (eventType: string) => {
  const value = eventType.toLowerCase();
  if (value.includes("media")) return "Media updated";
  if (value.includes("content") || value.includes("approval")) return "Content review updated";
  if (value.includes("report")) return "Report updated";
  if (value.includes("work") || value.includes("task")) return "Task updated";
  if (value.includes("presence") || value.includes("connection")) return "Online presence updated";
  if (value.includes("onboarding") || value.includes("truth") || value.includes("confirmation")) return "Restaurant details updated";
  if (value.includes("publish")) return "Publishing status updated";
  return "Momo workspace updated";
};

const incidentTitle = (stage: string) => {
  if (stage === "media_intake") return "Media upload needs attention";
  if (stage === "rights_reconciliation") return "Media permission needs attention";
  if (stage === "automation_reservation") return "Automatic preparation could not start";
  if (stage === "content_processing") return "Content preparation needs recovery";
  return "Content package failed verification";
};

const incidentDetail = (value: unknown): string => {
  if (!Array.isArray(value)) return "Open the exception to review its verified evidence and safest next action.";
  const messages = value.filter((item): item is string => typeof item === "string")
    .map((item) => item.replaceAll("_", " "));
  return messages.length ? messages.join(" · ") : "Open the exception to review its verified evidence and safest next action.";
};

export function buildMomoTeamSummary(data: MomoWorkspaceData) {
  const currentOwnerTruth = data.truth.filter((item) => momoTruthFieldIsCurrentlyUsable(data, item.id)).length;
  const eligibleConnections = data.connections.filter((connection) => {
    const capability = providerCapability(connection.provider);
    return capability ? momoConnectionIsCurrentlyEligible(connection, capability) : false;
  }).length;
  const pendingConfirmations = data.confirmations.filter((item) => ["pending", "in_review"].includes(item.status)).length;
  const pendingReportApprovals = data.approvals.filter((item) =>
    item.status === "pending" && item.subject_type === "report").length;
  const blockedWork = data.work.filter((item) => item.status === "blocked" || Boolean(item.blocked_reason)).length;
  const failedWork = data.work.filter((item) => item.status === "failed").length;
  const openAlerts = data.alerts.filter((item) => ["open", "active"].includes(item.status)).length;
  const openIncidents = (data.exceptionIncidentsV2 ?? []).filter((item) => item.status === "open");
  const mediaIncidents = openIncidents.filter((item) => ["media_intake", "rights_reconciliation", "automation_reservation"].includes(item.stage));
  const contentIncidents = openIncidents.filter((item) => ["content_processing", "content_validation"].includes(item.stage));
  const latestAutomationRunByIdentity = new Map<string, MomoWorkspaceData["contentAiRuns"][number]>();
  for (const run of data.contentAiRuns) {
    if (run.decision_mode === "automation_policy_v2" && run.automation_identity_id &&
      !latestAutomationRunByIdentity.has(run.automation_identity_id)) {
      latestAutomationRunByIdentity.set(run.automation_identity_id, run);
    }
  }
  const veroxaReady = (data.veroxaReadyPackagesV2 ?? []).filter((item) =>
    !item.identity_id || !latestAutomationRunByIdentity.has(item.identity_id) ||
    latestAutomationRunByIdentity.get(item.identity_id)?.id === item.content_ai_run_id
  );
  const automationRuns = [...latestAutomationRunByIdentity.values()].filter((item) =>
    !["materialized", "rejected", "failed"].includes(item.status) &&
    !veroxaReady.some((ready) => ready.content_ai_run_id === item.id)
  );
  const identityLinks = data.mediaIdentityLinksV2 ?? [];
  const canonicalMediaCount = identityLinks.length
    ? new Set(identityLinks.map((item) => item.identity_id)).size
    : new Set(data.media.map((item) => item.content_sha256 || item.id)).size;
  const readyCanonicalCount = new Set(veroxaReady.map((item) => item.identity_id || item.canonical_asset_id)).size;

  const attention: MomoTeamAttention[] = [];
  for (const incident of openIncidents) attention.push({
    key: `momo-exception-${incident.id}`,
    title: incidentTitle(incident.stage),
    detail: `${incidentDetail(incident.blockers)}${incident.occurrence_count > 1 ? ` · ${incident.occurrence_count} matching occurrences consolidated` : ""}`,
    action: "Review exception",
    destination: ["content_processing", "content_validation"].includes(incident.stage) ? "team-content" : "team-media",
    tone: ["content_processing", "content_validation"].includes(incident.stage) ? "urgent" : "standard",
  });
  if (openAlerts || failedWork) attention.push({
    key: "recovery",
    title: `${openAlerts + failedWork} urgent ${openAlerts + failedWork === 1 ? "issue needs" : "issues need"} review`,
    detail: "Open the work area to see the problem, owner, and safest next action.",
    action: "Review issue",
    destination: "team-work",
    tone: "urgent",
  });
  if (pendingConfirmations) attention.push({
    key: "restaurant-decisions",
    title: `${pendingConfirmations} restaurant ${pendingConfirmations === 1 ? "detail is" : "details are"} waiting for you`,
    detail: "Review the proposed Momo information and either accept it or request a correction.",
    action: "Review details",
    destination: "team-intelligence",
    tone: "decision",
  });
  if (pendingReportApprovals) attention.push({
    key: "report-decisions",
    title: `${pendingReportApprovals} report ${pendingReportApprovals === 1 ? "decision" : "decisions"} waiting`,
    detail: "Check the evidence and wording before a progress update can be released.",
    action: "Review report",
    destination: "team-reports",
    tone: "decision",
  });
  if (blockedWork) attention.push({
    key: "blocked-work",
    title: `${blockedWork} ${blockedWork === 1 ? "task is" : "tasks are"} blocked`,
    detail: "See what is missing and whether Veroxa or Momo owns the next step.",
    action: "Resolve blocker",
    destination: "team-work",
    tone: "urgent",
  });
  if (attention.length === 0 && data.readinessGate?.blocker_count) attention.push({
    key: "readiness-blockers",
    title: `${data.readinessGate.blocker_count} readiness ${data.readinessGate.blocker_count === 1 ? "blocker remains" : "blockers remain"}`,
    detail: "Review the exact unfinished requirements before the pilot can advance.",
    action: "Review progress",
    destination: "team-readiness",
    tone: "standard",
  });

  const releasedReports = data.reports.filter((item) => ["approved", "published"].includes(item.status)).length;
  const stages: MomoTeamStage[] = [
    {
      key: "restaurant",
      title: "Restaurant setup",
      status: data.truth.length === 0 ? "Not started" : pendingConfirmations ? "Needs attention" : currentOwnerTruth === data.truth.length ? "Complete" : currentOwnerTruth ? "In progress" : "Waiting on Momo",
      detail: data.truth.length ? `${currentOwnerTruth} of ${data.truth.length} details owner-confirmed` : "No restaurant details recorded",
      destination: "team-intelligence",
    },
    {
      key: "media",
      title: "Media readiness",
      status: data.media.length === 0 ? "Waiting on Momo" : mediaIncidents.length ? "Needs attention" : readyCanonicalCount > 0 && readyCanonicalCount >= canonicalMediaCount ? "Complete" : "In progress",
      detail: data.media.length ? mediaIncidents.length ? `${mediaIncidents.length} consolidated media exception${mediaIncidents.length === 1 ? "" : "s"}` : `${readyCanonicalCount} canonical media package${readyCanonicalCount === 1 ? "" : "s"} Veroxa Ready; routine work stays automatic` : "No media uploaded",
      destination: "team-media",
    },
    {
      key: "content",
      title: "Content readiness",
      status: contentIncidents.length ? "Needs attention" : veroxaReady.length ? "Complete" : automationRuns.length ? "In progress" : "Not started",
      detail: contentIncidents.length ? `${contentIncidents.length} consolidated content exception${contentIncidents.length === 1 ? "" : "s"}` : veroxaReady.length ? `${veroxaReady.length} unscheduled package${veroxaReady.length === 1 ? "" : "s"} Veroxa Ready; posting is off` : automationRuns.length ? `${automationRuns.length} automatic preparation${automationRuns.length === 1 ? " is" : "s are"} in progress` : "No v2 package prepared",
      destination: "team-content",
    },
    {
      key: "presence",
      title: "Online presence",
      status: data.connections.length === 0 ? "Not started" : eligibleConnections === data.connections.length ? "Complete" : eligibleConnections ? "In progress" : "Waiting on Momo",
      detail: data.connections.length ? `${eligibleConnections} of ${data.connections.length} connections ready` : "No connections recorded",
      destination: "team-presence",
    },
    {
      key: "reporting",
      title: "Reporting",
      status: pendingReportApprovals ? "Needs attention" : data.reports.length === 0 ? "Not started" : "In progress",
      detail: data.reports.length ? `${releasedReports} of ${data.reports.length} reports released` : "No report prepared",
      destination: "team-reports",
    },
    {
      key: "readiness",
      title: "Final readiness",
      status: data.readinessGate?.can_activate ? "Complete" : data.readinessGate?.blocker_count ? "Blocked" : data.readinessGate ? "In progress" : "Not started",
      detail: data.readinessGate ? `${data.readinessGate.verified_count} of ${data.readinessGate.required_count} requirements verified` : "Final gate not evaluated",
      destination: "team-readiness",
    },
  ];

  const recentUpdates: MomoTeamRecentUpdate[] = data.activity.slice(0, 3).map((item) => ({
    id: item.id,
    title: recentUpdateTitle(item.event_type),
    occurredAt: item.occurred_at,
  }));

  return {
    attention: attention.slice(0, 5),
    stages,
    recentUpdates,
    nextAction: attention[0] ?? stages.find((stage) => stage.status !== "Complete") ?? null,
  };
}

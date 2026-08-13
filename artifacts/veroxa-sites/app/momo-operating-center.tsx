"use client";

/* Signed private URLs cannot use the Next image optimizer. */
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { VeroxaRole } from "./veroxa-supabase";
import {
  MOMO_MANUAL_REPORT_NARRATIVES,
  momoContentAiRunNeedsRecovery,
  momoConnectionIsCurrentlyEligible as connectionIsCurrentlyEligible,
  momoMediaIsCurrentlyUsable as mediaIsCurrentlyUsable,
  momoOriginalMediaMeetsPlatformReadyProfile,
  momoReportNarrativeIsSafeWithoutProviderMetrics,
  momoTruthFieldIsCurrentlyUsable,
  normalizedMomoHttpsUrl as normalizedHttpsUrl,
  resolveMomoAssetPipeline,
  resolveMomoContentPackageReadiness,
  resolveLatestMomoPresenceConfirmation,
} from "./momo-operating-gates";
import { MomoTeamPreconnectionCenter } from "./momo-team-preconnection-center";
import { momoMediaReviewCanSave, momoMediaReviewSaveBlockers } from "./momo-media-guidance";
import { buildMomoTeamSummary } from "./momo-team-summary";
import {
  uploadMomoClientMedia,
  uploadMomoTeamPrivateMedia,
} from "./momo-client-data";
import type {
  VeroxaMediaRestaurantAssociation,
  VeroxaPrivateMediaAssessment,
} from "./veroxa-private-media-assessment";
import {
  MOMO_CONTENT_AI_PROMPT_VERSION,
  MOMO_CONTENT_AI_VALIDATOR_VERSION,
  MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION,
} from "./momo-content-ai-contract";
import {
  addMomoMediaTag,
  applyMomoMediaUploadInstruction,
  appendMomoRequestMessage,
  completeMomoRecoveryRun,
  approveMomoContentPackage,
  createMomoReportDraft,
  createMomoClientRequest,
  createMomoTeamRequest,
  createMomoClientRequestWork,
  createMomoWorkItem,
  decideMomoReadyPackageV2,
  decideMomoApproval,
  emptyMomoWorkspaceData,
  getMomoMediaPreviewUrl,
  getMomoReadyReviewStatusV2,
  getMomoReadyPackageStatus,
  getMomoVerifiedMediaPreviewObjectUrl,
  generateMomoContentPackage,
  loadMomoWorkspaceData,
  loadMomoClientRequests,
  loadMomoRequestThread,
  momoReadyReviewAllowsManualExport,
  momoReadyReviewCanApprove,
  momoReadyReviewCanDiscard,
  newMomoRequestIdempotencyKey,
  requestMomoApproval,
  requestMomoContentPackageRevision,
  retryMomoMediaVerification,
  recordMomoMediaReuse,
  recordMomoMonitorCheck,
  reviseMomoReportDraft,
  retryMomoWorkItem,
  reviewMomoMedia,
  revokeMomoMediaRights,
  saveMomoContact,
  saveMomoTruthRevisions,
  startMomoRecoveryRun,
  submitMomoContentConfirmation,
  submitMomoConfirmation,
  transitionMomoWorkItem,
  transitionMomoClientRequest,
  transitionMomoAlert,
  updateMomoOnboardingStep,
  updateMomoPresenceProfile,
  runMomoProviderPreflight,
  runMomoNoGoRehearsal,
  type MomoApproval,
  type MomoConfirmation,
  type MomoContentAiRun,
  type MomoReadyPackage,
  type MomoReadyReviewStatusV2,
  type MomoMediaAsset,
  type MomoClientRequest,
  type MomoRequestReasonCategory,
  type MomoRequestMessage,
  type MomoWorkspaceData,
  type MomoWorkspaceSection,
  type MomoProviderPreflight,
} from "./momo-data";

type Props = {
  view: string;
  access: { role: VeroxaRole; displayName: string; restaurantId: string | null };
  onNavigate: (view: string) => void;
  notify: (message: string) => void;
};

type LoadState =
  | { status: "loading"; data: MomoWorkspaceData; error: null }
  | { status: "ready"; data: MomoWorkspaceData; error: null }
  | { status: "error"; data: MomoWorkspaceData; error: string };

const sectionForView = (view: string): MomoWorkspaceSection => {
  if (view === "requests" || view === "team-requests") return "requests";
  if (view === "onboarding" || view === "team-intelligence") return "intelligence";
  if (view === "media" || view === "team-media") return "media";
  if (view === "content" || view === "team-content") return "content";
  if (view === "services" || view === "team-presence") return "connections";
  if (view === "reports" || view === "team-reports" || view === "team-work") return "operations";
  if (view === "team-readiness") return "readiness";
  return "dashboard";
};

const labelStatus = (value: string | null | undefined) =>
  (value || "not recorded").replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());

const momoApprovalPairIsAllowed = (approval: Pick<MomoApproval, "subject_type" | "approval_kind">) => new Set([
  "content_strategy:team_review",
  "content_item:team_review",
  "content_variant:team_review",
  "content_variant:publishing",
  "report:report_release",
]).has(`${approval.subject_type}:${approval.approval_kind}`);

const latestSubjectConfirmation = (
  confirmations: readonly MomoConfirmation[],
  subjectType: string,
  subjectId: string,
) => confirmations
  .filter((item) => item.subject_type === subjectType && item.subject_id === subjectId)
  .map((item, index) => ({ item, index, timestamp: Date.parse(item.created_at) }))
  .sort((left, right) => (Number.isFinite(right.timestamp) ? right.timestamp : 0) - (Number.isFinite(left.timestamp) ? left.timestamp : 0) || left.index - right.index)[0]?.item;

const subjectHasNoContraryOwnerIntent = (
  confirmations: readonly MomoConfirmation[],
  subjectType: string,
  subjectId: string,
) => {
  const latest = latestSubjectConfirmation(confirmations, subjectType, subjectId);
  return !latest || (latest.status === "approved" && ["confirm", "correct"].includes(latest.decision || ""));
};

const valueText = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(valueText).filter(Boolean).join(", ");
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.text === "string") return record.text;
    if (typeof record.value === "string") return record.value;
    return Object.entries(record).map(([key, item]) => `${labelStatus(key)}: ${valueText(item)}`).join(" · ");
  }
  return value == null ? "" : String(value);
};

const jsonList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(valueText).filter(Boolean);
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(([key, item]) => `${labelStatus(key)}: ${valueText(item)}`);
  }
  return valueText(value) ? [valueText(value)] : [];
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Not recorded" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

const formatZonedDate = (value: string | null | undefined, timeZone: string) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Not recorded";
  try {
    return new Intl.DateTimeFormat([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone,
      timeZoneName: "short",
    }).format(date);
  } catch {
    return formatDate(value);
  }
};

const momoLocalDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
};

const MOMO_MEDIA_DEFAULT_SCOPE = ["instagram", "facebook", "google_business"] as const;
const MOMO_CHICAGO_SCHEDULE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/u;

const momoChicagoLocalMinute = (value: Date): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
};

const momoChicagoScheduleIsFuture = (value: string, now: number): boolean =>
  MOMO_CHICAGO_SCHEDULE_PATTERN.test(value) && value > momoChicagoLocalMinute(new Date(now));

const MOMO_ACTION_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  unsupported_media_type: "Use a JPG image.",
  invalid_media_type: "Use a JPG image.",
  invalid_media_size: "Choose a JPG between 10 KB and 5 MB.",
  media_not_platform_ready: "Use a JPG from 320 × 250 px up to a 12,000 px maximum edge, with an aspect ratio from 4:5 to 1.91:1.",
  media_verification_failed: "The upload was stored privately, but server byte verification did not complete. It is not eligible for content preparation.",
  media_verification_unavailable: "Secure verification is temporarily unavailable. The private upload is preserved and queued for recovery; Momo does not need to retry or re-upload.",
  media_instruction_awaiting_private_assessment: "The upload instruction is saved, but its private verification or assessment is not complete. Veroxa is confirming the recovery receipt; do not ask Momo to retry or re-upload.",
  media_instruction_needs_restaurant_fact_or_permission: "The upload instruction is saved, but applying it requires a real restaurant fact or permission. Contact Momo only for that specific fact or permission—not for verification or another upload.",
  media_instruction_processor_failed: "The saved upload instruction could not be applied from current evidence. Nothing was connected or posted; review the Team exception without asking Momo to retry.",
  content_ai_disabled: "Content preparation is paused. No AI call was started and nothing was marked Ready.",
  content_ai_configuration_unavailable: "The secure AI connection is not configured for Momo. No AI call was started and nothing was marked Ready.",
  content_ai_budget_unavailable: "Momo’s authorized AI budget is unavailable or exhausted. No paid AI call was started and nothing was marked Ready.",
  content_ai_budget_contract_exceeded: "The provider reported usage outside the approved per-package cost contract. The attempt was blocked and nothing was marked Ready.",
  content_ai_in_progress: "This exact image already has a content package in progress. A second paid AI call was not started; refresh shortly.",
  content_ai_previous_attempt_failed: "The previous preparation attempt is closed. Refresh to review its blocked status before Team starts a reviewed replacement.",
  content_ai_provider_failed: "The AI provider did not return a usable package. The attempt was recorded, no automatic retry was made, and nothing was marked Ready.",
  content_ai_provider_incomplete: "The AI provider stopped before returning a complete package. The attempt was recorded, no automatic retry was made, and nothing was marked Ready.",
  content_ai_recovery_unavailable: "The stored AI result could not be checked right now. The same paid request remains recoverable; refresh this card later and do not start a new one.",
  content_ai_token_budget_exhausted: "The AI provider reached its output limit before finishing the package. The attempt was recorded and nothing was marked Ready.",
  content_ai_finalization_uncertain: "The AI call may have completed, but Veroxa could not confirm its final audit record. Do not retry yet; refresh first to avoid a duplicate paid call.",
  content_ai_quality_gate_failed: "The package did not pass the factual, SEO, hashtag, or accessibility gate. Nothing was marked ready.",
  content_ai_unavailable: "Content preparation is temporarily unavailable. No package was marked Ready; refresh before retrying.",
  source_not_ready: "The exact image, rights, media review, or owner-truth evidence no longer passes. Open Media and review the current blockers.",
  idempotency_conflict: "This action no longer matches the original content request. Refresh before trying again.",
  content_schedule_must_be_future: "Choose a future America/Chicago time for every platform. Nothing was marked Ready.",
  invalid_schedule: "Choose a future America/Chicago time for every platform. Nothing was marked Ready.",
  content_package_not_reviewable: "This package is no longer awaiting Team review. Refresh to see its current status.",
  content_package_hash_mismatch: "The reviewed copy no longer matches the immutable package. Refresh before taking another action.",
  content_package_approval_unavailable: "The Ready record could not be confirmed. Nothing is being represented as Ready; refresh before retrying.",
  content_package_no_longer_ready: "This plan is no longer Ready because current rights, media, timing, or another release gate changed. Open Media to rebuild it from current evidence.",
  ready_review_input_invalid: "This Ready review no longer matches the exact package. Refresh before deciding.",
  ready_review_discard_reason_required: "Add a clear discard reason between 4 and 500 characters.",
  ready_review_decision_failed: "The Ready decision was not accepted against the current evidence. Nothing was exported or deleted; refresh before retrying.",
  ready_review_replay_blocked: "The exact earlier decision was recovered, but its evidence is no longer current. Manual export remains blocked; review the refreshed package.",
  revision_note_required: "Add a clear revision note of at least 10 characters.",
  team_prefill_required: "Team Faraz must create the review field before the owner can submit a correction.",
  owner_confirmation_locked: "This owner-confirmed fact is locked. Request a new owner correction instead of overwriting it.",
  retry_limit_reached: "This item reached its retry limit. Start a reviewed recovery action instead.",
  manual_cycle_invalid: "The manual content inputs changed or are not verified. Validate the no-cost brief again before saving.",
  variant_claim_evidence_invalid: "This caption contains a sensitive claim without an explicitly selected, semantically matching owner-confirmed truth field.",
};

const momoActionErrorMessage = (code: string): string => Object.hasOwn(MOMO_ACTION_ERROR_MESSAGES, code)
  ? MOMO_ACTION_ERROR_MESSAGES[code]
  : "The database did not accept this change. Nothing is being represented as complete.";

const momoWorkspaceErrorMessage = (code: string, section: string): string => {
  if (code === "configuration_unavailable") return "The secure Momo data connection is not configured for this deployment. No cached or sample records are being shown.";
  if (code === "active_momo_client_required") return "This signed Client account is not currently linked to an active Momo restaurant. No cached or sample records are being shown.";
  if (code === "workspace_snapshot_failed") return `Verified Momo data could not be loaded for the ${labelStatus(section)} view. Retry after checking the signed session; no cached or sample records are being shown.`;
  return `Verified Momo data could not be loaded for the ${labelStatus(section)} view. Retry when the database connection is available; no cached or sample records are being shown.`;
};

const externalEvidenceWorkTypes = new Set([
  "publishing",
  "google",
  "seo",
  "reviews",
  "website",
  "monitoring",
]);

function StatusBadge({ status }: { status: string }) {
  const visibleStatus = status === "approved_for_manual_export"
    ? "Approved for manual export"
    : labelStatus(status);
  return <span className={`momo-status ${status.toLowerCase().replaceAll("_", "-")}`}>{visibleStatus}</span>;
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <section className="momo-empty" aria-live="polite"><strong>{title}</strong><p>{detail}</p></section>;
}

function MomoIntro({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: React.ReactNode }) {
  return <div className="momo-intro"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{actions && <div className="momo-intro-actions">{actions}</div>}</div>;
}

function SafetyBoundary({ role }: { role: VeroxaRole }) {
  if (role === "team") return null;
  return <section className="momo-boundary">
    <strong>Owner-confirmation workspace</strong>
    <span>Your confirmation is stored as a pending proposal for Team review. It does not change public restaurant truth or give Veroxa permission to publish automatically.</span>
    <em>Protected workspace</em>
  </section>;
}

function TeamSystemTools({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) {
  const [opened, setOpened] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const toggle = () => {
    setOpened(true);
    setExpanded((current) => !current);
  };
  return <section className="team-system-tools">
    <button type="button" onClick={toggle} aria-expanded={expanded}>
      <span><strong>{title}</strong><small>{detail}</small></span><em>{expanded ? "Hide" : "Open only when needed"}</em>
    </button>
    {opened && <div className="team-system-tools-body" hidden={!expanded}>{children}</div>}
  </section>;
}

export function MomoOperatingCenter({ view, access, onNavigate, notify }: Props) {
  const section = sectionForView(view);
  const [state, setState] = useState<LoadState>({ status: "loading", data: emptyMomoWorkspaceData(), error: null });
  const [busy, setBusy] = useState(false);
  const workspaceLoadSequence = useRef(0);

  const reload = useCallback(async () => {
    const requestSequence = ++workspaceLoadSequence.current;
    if (!access.restaurantId) {
      if (requestSequence === workspaceLoadSequence.current) {
        setState({ status: "error", data: emptyMomoWorkspaceData(), error: "This account has no active Momo restaurant membership." });
      }
      return;
    }
    setState((current) => ({ status: "loading", data: current.data, error: null }));
    try {
      const data = await loadMomoWorkspaceData(access.restaurantId, section, access.role);
      if (requestSequence === workspaceLoadSequence.current) setState({ status: "ready", data, error: null });
    } catch (error) {
      if (requestSequence === workspaceLoadSequence.current) {
        setState({ status: "error", data: emptyMomoWorkspaceData(), error: momoWorkspaceErrorMessage(error instanceof Error ? error.message : "", section) });
      }
    }
  }, [access.restaurantId, access.role, section]);

  useEffect(() => {
    if (!access.restaurantId) {
      const requestSequence = ++workspaceLoadSequence.current;
      Promise.resolve().then(() => {
        if (requestSequence === workspaceLoadSequence.current) {
          setState({ status: "error", data: emptyMomoWorkspaceData(), error: "This account has no active Momo restaurant membership." });
        }
      });
      return;
    }
    let active = true;
    const requestSequence = ++workspaceLoadSequence.current;
    const restaurantId = access.restaurantId;
    void loadMomoWorkspaceData(restaurantId, section, access.role)
      .then((data) => {
        if (active && requestSequence === workspaceLoadSequence.current) setState({ status: "ready", data, error: null });
      })
      .catch((error) => {
        if (active && requestSequence === workspaceLoadSequence.current) {
          setState({ status: "error", data: emptyMomoWorkspaceData(), error: momoWorkspaceErrorMessage(error instanceof Error ? error.message : "", section) });
        }
      });
    return () => { active = false; };
  }, [access.restaurantId, access.role, section]);

  useEffect(() => {
    if (!access.restaurantId) return;
    const refreshVisibleWorkspace = () => {
      if (document.visibilityState === "visible") void reload();
    };
    window.addEventListener("focus", refreshVisibleWorkspace);
    document.addEventListener("visibilitychange", refreshVisibleWorkspace);
    const timer = window.setInterval(refreshVisibleWorkspace, 45_000);
    return () => {
      window.removeEventListener("focus", refreshVisibleWorkspace);
      document.removeEventListener("visibilitychange", refreshVisibleWorkspace);
      window.clearInterval(timer);
    };
  }, [access.restaurantId, reload]);

  const run = async (action: () => Promise<void>, success: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      notify(success);
      await reload();
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      notify(momoActionErrorMessage(code));
    } finally {
      setBusy(false);
    }
  };

  if (state.status === "loading" && Object.values(state.data).every((value) => value == null || (Array.isArray(value) && value.length === 0))) {
    return <div className="momo-loading"><strong>Loading verified Momo records…</strong><span>No fixture data is used.</span></div>;
  }
  if (state.status === "error") {
    return <div className="view"><MomoIntro eyebrow="MOMO WORKSPACE" title="Data unavailable" description={state.error} actions={<button className="secondary-button" onClick={() => void reload()}>Try again</button>} /><SafetyBoundary role={access.role} /></div>;
  }

  const shared = {
    data: state.data,
    role: access.role,
    restaurantId: access.restaurantId!,
    busy,
    run,
    reloadWorkspace: reload,
    notify,
    onNavigate,
  };

  if (view === "requests" || view === "team-requests") return <RequestsPanel role={access.role} restaurantId={access.restaurantId!} notify={notify} onNavigate={onNavigate} />;
  if (view === "onboarding" || view === "team-intelligence") return <IntelligencePanel {...shared} />;
  if (view === "media" || view === "team-media") return <MediaPanel {...shared} />;
  if (view === "content" || view === "team-content") return <ContentPanel {...shared} onNavigate={onNavigate} />;
  if (view === "services" || view === "team-presence") return <ConnectionsPanel {...shared} />;
  if (view === "team-work") return <OperationsPanel {...shared} mode="work" />;
  if (view === "reports" || view === "team-reports") return <OperationsPanel {...shared} mode="reports" />;
  if (view === "team-readiness") return <ReadinessPanel {...shared} />;
  return <DashboardPanel {...shared} onNavigate={onNavigate} />;
}

type PanelProps = {
  data: MomoWorkspaceData;
  role: VeroxaRole;
  restaurantId: string;
  busy: boolean;
  run: (action: () => Promise<void>, success: string) => Promise<void>;
  reloadWorkspace: () => Promise<void>;
  notify: (message: string) => void;
  onNavigate?: (view: string) => void;
};

function DashboardPanel({ data, role, onNavigate }: PanelProps & { onNavigate: (view: string) => void }) {
  const pendingApprovals = data.approvals.filter((item) => item.status === "pending").length;
  const blockedWork = data.work.filter((item) => item.status === "blocked" || item.blocked_reason).length;
  const approvedMedia = data.media.filter((item) => mediaIsCurrentlyUsable(data, item.id)).length;
  const eligibleConnections = data.connections.filter((connection) => connection.provider === "google_business"
    ? connectionIsCurrentlyEligible(connection, "google_business_publish")
    : connectionIsCurrentlyEligible(connection, "facebook_publish") || connectionIsCurrentlyEligible(connection, "instagram_publish")).length;
  const currentOwnerTruth = data.truth.filter((item) => momoTruthFieldIsCurrentlyUsable(data, item.id)).length;
  const gate = data.readinessGate;
  if (role === "team") {
    const summary = buildMomoTeamSummary(data);
    const nextAction = summary.nextAction;
    const activeWork = data.work
      .filter((item) => ["waiting_approval", "blocked", "failed", "in_progress", "retrying", "queued"].includes(item.status))
      .slice(0, 4);
    return <div className="view team-today-view">
      <MomoIntro eyebrow="MOMO’S HOUSE" title="Today" description="Your decisions, Veroxa’s active work, and the next useful step—nothing else." />

      <section className="team-live-strip" aria-label="Momo operating boundary">
        <span><i/><strong>Momo is live</strong><small>Upload → Veroxa Ready → Team decision</small></span>
        <em>External posting off</em>
      </section>

      <section className="team-focus-grid">
        <article className="team-attention-panel">
          <header><div><p className="eyebrow">DO NOW</p><h2>Needs your attention</h2><p>Ordered by urgency and impact.</p></div><span>{summary.attention.length}</span></header>
          {summary.attention.length === 0 ? <div className="team-all-clear"><span>✓</span><div><strong>No immediate decision is waiting.</strong><p>You can continue with the next Momo milestone.</p></div></div> : <div className="team-attention-list">
            {summary.attention.map((item, index) => <button type="button" key={item.key} className={`team-attention-item ${item.tone}`} onClick={() => onNavigate(item.destination)}>
              <span>{index + 1}</span><span><strong>{item.title}</strong><small>{item.detail}</small></span><b>{item.action} →</b>
            </button>)}
          </div>}
        </article>

        <aside className="team-next-card">
          <p className="eyebrow">NEXT MOVE</p>
          <span className="team-next-mark">→</span>
          <h2>{nextAction?.title || "Keep the pilot moving"}</h2>
          <p>{nextAction?.detail || "Open Work to continue the next Momo task."}</p>
          <button type="button" onClick={() => onNavigate(nextAction?.destination || "team-work")}>{nextAction && "action" in nextAction ? nextAction.action : "Open work"}</button>
          <small>Posting stays off in this release.</small>
        </aside>
      </section>

      <section className="team-bottom-grid">
        <article className="team-active-panel">
          <header><div><p className="eyebrow">VEROXA IS WORKING ON</p><h2>Active Momo work</h2></div>{activeWork.length > 0 && <button type="button" onClick={() => onNavigate("team-work")}>Open Work</button>}</header>
          {activeWork.length === 0 ? <div className="team-recent-empty"><strong>No active task is recorded.</strong><p>Add the next Momo task only when there is real work to perform.</p></div> : <div className="team-active-list">
            {activeWork.map((item) => <button type="button" key={item.id} onClick={() => onNavigate("team-work")}><span><strong>{item.title}</strong><small>{labelStatus(item.work_type)}</small></span><StatusBadge status={item.status} /></button>)}
          </div>}
        </article>
        <article className="team-recent-panel">
          <header><div><p className="eyebrow">COMPLETED RECENTLY</p><h2>Latest recorded updates</h2></div></header>
          {summary.recentUpdates.length === 0 ? <div className="team-recent-empty"><strong>No progress update has been recorded yet.</strong><p>Completed Momo work will appear here automatically.</p></div> : <div className="team-recent-list">{summary.recentUpdates.map((item) => <div key={item.id}><span>✓</span><strong>{item.title}</strong><small>{formatDate(item.occurredAt)}</small></div>)}</div>}
        </article>
      </section>
    </div>;
  }
  return <div className="view">
    <MomoIntro eyebrow="MOMO’S HOUSE SAN ANTONIO · ONLY OPERATING CLIENT" title="Momo’s House workspace" description="One focused place for today’s work, restaurant setup, media, content approvals, online presence, reports, and readiness." />
    <SafetyBoundary role={role} />
    <section className="momo-metrics">
      <article><span>Truth fields</span><strong>{data.truth.length}</strong><small>{currentOwnerTruth} current owner confirmed</small></article>
      <article><span>Usable media</span><strong>{approvedMedia}</strong><small>{data.media.length} total assets</small></article>
      <article><span>Approvals</span><strong>{pendingApprovals}</strong><small>pending decisions</small></article>
      <article><span>Blocked work</span><strong>{blockedWork}</strong><small>requires action</small></article>
    </section>
    <section className="momo-module-grid">
      <Module title="Client requests" detail="A private request thread can start the manual work loop without activating services, publishing, or inventing completion." status="manual_only" action="Open requests" onClick={() => onNavigate("requests")} />
      <Module title="Restaurant setup" detail={data.truth.length ? `${data.truth.length} persistent fields available.` : "No owner-confirmed restaurant truth yet."} status={data.truth.length ? "in_progress" : "not_started"} action="Open restaurant setup" onClick={() => onNavigate("onboarding")} />
      <Module title="Media library" detail={data.media.length ? `${data.media.length} assets; ${data.mediaRights.length} rights records.` : "No Momo media has been uploaded."} status={data.media.length ? "in_progress" : "not_started"} action="Open media library" onClick={() => onNavigate("media")} />
      <Module title="Content & approvals" detail={data.contentItems.length ? `${data.contentItems.length} content items; ${pendingApprovals} pending approvals.` : "No strategy or content draft exists."} status={pendingApprovals ? "approval_required" : data.contentItems.length ? "in_progress" : "not_started"} action="Open content" onClick={() => onNavigate("content")} />
      <Module title="Online presence" detail={data.connections.length ? `${eligibleConnections} of ${data.connections.length} provider records have current owner authorization, capability, and verification.` : "Meta and Google are not represented as connected."} status={eligibleConnections > 0 ? "connected" : "blocked"} action="Review online presence" onClick={() => onNavigate("services")} />
      <Module title="Reporting" detail={data.reports.length ? `${data.reports.length} evidence-backed report records.` : "No reviewed report is available."} status={data.reports.length ? "in_progress" : "not_started"} action="Open reports" onClick={() => onNavigate("reports")} />
      <Module title="Final readiness gate" detail={gate ? `${gate.verified_count} of ${gate.required_count} required dimensions verified; ${gate.blocker_count} blockers.` : "The production readiness gate has no evaluated record."} status={gate?.overall_status || "not_evaluated"} action="Review readiness" onClick={() => onNavigate("onboarding")} />
    </section>
  </div>;
}

const requestErrorMessage = (code: string) => {
  if (["active_client_request_author_required", "request_thread_access_denied", "momo_team_request_create_required", "momo_team_request_transition_required", "momo_team_client_request_work_required", "request_list_access_or_limit_denied", "request_thread_access_or_limit_denied"].includes(code)) {
    return "This signed account no longer has the required Momo request access. Nothing was changed.";
  }
  if (["invalid_client_request_payload", "invalid_team_request_payload", "invalid_request_message_payload", "invalid_client_request_transition", "invalid_client_request_work_payload"].includes(code)) {
    return "The request details are outside the allowed length, type, priority, or state boundary. Review the highlighted fields and try again.";
  }
  if (["client_request_idempotency_conflict", "team_request_idempotency_conflict", "request_message_idempotency_conflict", "client_request_transition_idempotency_conflict", "client_request_work_idempotency_conflict"].includes(code)) {
    return "This retry no longer matches its original payload. Reload the request before trying again.";
  }
  if (["client_request_rate_or_open_limit_reached", "team_request_rate_or_open_limit_reached", "request_message_rate_or_thread_limit_reached"].includes(code)) {
    return "The bounded request limit was reached. Wait before adding another record.";
  }
  if (code === "request_thread_is_closed") return "This request is closed. Its private history remains visible, but no new messages can be added.";
  if (code === "invalid_client_request_state_transition") return "That request state changed. Reload it before choosing the next step.";
  if (code === "request_data_invalid") return "The request response did not match the verified contract, so it was not displayed.";
  return "The database did not accept this request action. Nothing is being represented as complete.";
};

type RequestsPanelProps = {
  role: VeroxaRole;
  restaurantId: string;
  notify: (message: string) => void;
  onNavigate: (view: string) => void;
};

function RequestsPanel({ role, restaurantId, notify, onNavigate }: RequestsPanelProps) {
  const [requests, setRequests] = useState<MomoClientRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listState, setListState] = useState<"loading" | "ready" | "error">("loading");
  const [thread, setThread] = useState<MomoRequestMessage[]>([]);
  const [threadState, setThreadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [threadRequestId, setThreadRequestId] = useState<string | null>(null);
  const threadLoadSequence = useRef(0);
  const [actionBusy, setActionBusy] = useState(false);
  const [requestType, setRequestType] = useState<MomoClientRequest["requestType"]>("support");
  const [requestTitle, setRequestTitle] = useState("");
  const [requestDetails, setRequestDetails] = useState("");
  const [requestPriority, setRequestPriority] = useState<MomoClientRequest["priority"]>("normal");
  const [requestKey, setRequestKey] = useState(() => newMomoRequestIdempotencyKey("request"));
  const [requestCategory, setRequestCategory] = useState<MomoRequestReasonCategory>("owner_clarification");
  const [requestPlatform, setRequestPlatform] = useState("");
  const [requestCorrection, setRequestCorrection] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageKey, setMessageKey] = useState(() => newMomoRequestIdempotencyKey("message"));
  const [transitionNotes, setTransitionNotes] = useState("");
  const [transitionAttempt, setTransitionAttempt] = useState<{ signature: string; key: string } | null>(null);
  const [workType, setWorkType] = useState("onboarding");
  const [workTitle, setWorkTitle] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [workPriority, setWorkPriority] = useState(3);
  const [workDueAt, setWorkDueAt] = useState("");
  const [workKey, setWorkKey] = useState(() => newMomoRequestIdempotencyKey("work"));
  const [lastLinkedWorkId, setLastLinkedWorkId] = useState<string | null>(null);

  const reloadRequests = useCallback(async (preferredId?: string) => {
    setListState("loading");
    try {
      const next = await loadMomoClientRequests({ restaurantId, limit: 25 });
      setRequests(next);
      setSelectedId((current) => {
        const preferred = preferredId && next.some((request) => request.id === preferredId) ? preferredId : null;
        const retained = current && next.some((request) => request.id === current) ? current : null;
        return preferred || retained || next[0]?.id || null;
      });
      setListState("ready");
    } catch (error) {
      setRequests([]);
      setSelectedId(null);
      setListState("error");
      notify(requestErrorMessage(error instanceof Error ? error.message : ""));
    }
  }, [notify, restaurantId]);

  const reloadThread = useCallback(async (requestId: string) => {
    const sequence = ++threadLoadSequence.current;
    setThread([]);
    setThreadRequestId(null);
    setThreadState("loading");
    try {
      const next = await loadMomoRequestThread({ requestId, limit: 50 });
      if (sequence !== threadLoadSequence.current) return;
      setThread(next);
      setThreadRequestId(requestId);
      setThreadState("ready");
    } catch (error) {
      if (sequence !== threadLoadSequence.current) return;
      setThread([]);
      setThreadRequestId(requestId);
      setThreadState("error");
      notify(requestErrorMessage(error instanceof Error ? error.message : ""));
    }
  }, [notify]);

  useEffect(() => {
    void Promise.resolve().then(() => reloadRequests());
  }, [reloadRequests]);
  useEffect(() => {
    if (!selectedId) {
      threadLoadSequence.current += 1;
      Promise.resolve().then(() => {
        setThread([]);
        setThreadRequestId(null);
        setThreadState("idle");
      });
      return;
    }
    let active = true;
    const requestId = selectedId;
    const sequence = ++threadLoadSequence.current;
    Promise.resolve().then(() => {
      if (!active || sequence !== threadLoadSequence.current) return;
      setThread([]);
      setThreadRequestId(null);
      setThreadState("loading");
    });
    void loadMomoRequestThread({ requestId, limit: 50 })
      .then((next) => {
        if (!active || sequence !== threadLoadSequence.current) return;
        setThread(next);
        setThreadRequestId(requestId);
        setThreadState("ready");
      })
      .catch(() => {
        if (!active || sequence !== threadLoadSequence.current) return;
        setThread([]);
        setThreadRequestId(requestId);
        setThreadState("error");
      });
    return () => { active = false; };
  }, [selectedId]);

  const selected = requests.find((request) => request.id === selectedId) || null;
  const requestClosed = selected ? ["completed", "cancelled"].includes(selected.status) : false;
  const visibleThread = threadRequestId === selectedId ? thread : [];
  const visibleThreadState = threadRequestId === selectedId ? threadState : selectedId ? "loading" : "idle";
  const requestFormValid = requestTitle.trim().length >= 3 && requestTitle.trim().length <= 200
    && requestDetails.trim().length >= 3 && requestDetails.trim().length <= 5000;
  const messageValid = messageBody.trim().length >= 1 && messageBody.trim().length <= 5000;
  const transitionValid = transitionNotes.trim().length >= 5 && transitionNotes.trim().length <= 2000;
  const dueDate = workDueAt ? new Date(workDueAt) : null;
  const workFormValid = workTitle.trim().length >= 3 && workTitle.trim().length <= 200
    && workDescription.length <= 5000 && Number.isInteger(workPriority) && workPriority >= 1 && workPriority <= 5
    && (!dueDate || (!Number.isNaN(dueDate.valueOf()) && dueDate > new Date()));

  async function performRequestAction<T>(action: () => Promise<T>, success: string, preferredId?: (value: T) => string | undefined) {
    if (actionBusy) return { ok: false as const };
    setActionBusy(true);
    try {
      const value = await action();
      const nextId = preferredId?.(value) || selectedId || undefined;
      notify(success);
      await reloadRequests(nextId);
      if (nextId) await reloadThread(nextId);
      return { ok: true as const, value };
    } catch (error) {
      notify(requestErrorMessage(error instanceof Error ? error.message : ""));
      return { ok: false as const };
    } finally {
      setActionBusy(false);
    }
  }

  const submitClientRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (role !== "client" || !requestFormValid) return;
    const result = await performRequestAction(
      () => createMomoClientRequest({ restaurantId, requestType, title: requestTitle, details: requestDetails, priority: requestPriority, idempotencyKey: requestKey }),
      "Private Momo request recorded. This does not activate services or approve public work.",
      (requestId) => requestId,
    );
    if (result.ok) {
      setRequestTitle("");
      setRequestDetails("");
      setRequestPriority("normal");
      setRequestKey(newMomoRequestIdempotencyKey("request"));
    }
  };

  const submitTeamRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (role !== "team" || !requestFormValid) return;
    const result = await performRequestAction(
      () => createMomoTeamRequest({
        restaurantId,
        requestType,
        title: requestTitle,
        details: requestDetails,
        priority: requestPriority,
        requestCategory,
        context: {
          affectedPlatform: requestPlatform.trim() || undefined,
          suggestedCorrection: requestCorrection.trim() || undefined,
        },
        idempotencyKey: requestKey,
      }),
      "Request sent to Momo. Its response will appear in this shared thread.",
      (requestId) => requestId,
    );
    if (result.ok) {
      setRequestTitle("");
      setRequestDetails("");
      setRequestPriority("normal");
      setRequestCategory("owner_clarification");
      setRequestPlatform("");
      setRequestCorrection("");
      setRequestKey(newMomoRequestIdempotencyKey("request"));
    }
  };

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || requestClosed || !messageValid) return;
    const result = await performRequestAction(
      () => appendMomoRequestMessage({ requestId: selected.id, body: messageBody, idempotencyKey: messageKey }),
      "Message added to the private request thread.",
      () => selected.id,
    );
    if (result.ok) {
      setMessageBody("");
      setMessageKey(newMomoRequestIdempotencyKey("message"));
    }
  };

  const transitionRequest = async (targetStatus: "acknowledged" | "in_progress" | "completed" | "cancelled") => {
    if (role !== "team" || !selected || !transitionValid) return;
    const signature = `${selected.id}:${targetStatus}:${transitionNotes.trim()}`;
    const idempotencyKey = transitionAttempt?.signature === signature
      ? transitionAttempt.key
      : newMomoRequestIdempotencyKey("transition");
    setTransitionAttempt({ signature, key: idempotencyKey });
    const result = await performRequestAction(
      () => transitionMomoClientRequest({ requestId: selected.id, targetStatus, notes: transitionNotes, idempotencyKey }),
      `Request moved to ${labelStatus(targetStatus)} with a recorded Team note.`,
      () => selected.id,
    );
    if (result.ok) {
      setTransitionNotes("");
      setTransitionAttempt(null);
    }
  };

  const submitLinkedWork = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (role !== "team" || !selected || !workFormValid || !["acknowledged", "in_progress"].includes(selected.status)) return;
    const result = await performRequestAction(
      () => createMomoClientRequestWork({ requestId: selected.id, workType, title: workTitle, description: workDescription, priority: workPriority, idempotencyKey: workKey, dueAt: workDueAt || undefined }),
      "Request-linked work queued through the private Team contract.",
      () => selected.id,
    );
    if (result.ok) {
      setLastLinkedWorkId(result.value);
      setWorkTitle("");
      setWorkDescription("");
      setWorkDueAt("");
      setWorkKey(newMomoRequestIdempotencyKey("work"));
    }
  };

  const nextTransitions = selected?.status === "open" ? ["acknowledged", "cancelled"] as const
    : selected?.status === "acknowledged" ? ["in_progress", "cancelled"] as const
      : selected?.status === "in_progress" ? ["completed", "cancelled"] as const
        : [] as const;

  return <div className="view momo-request-view">
    <MomoIntro eyebrow="MOMO INBOX" title={role === "team" ? "Requests that need a response" : "Ask Veroxa for help"} description={role === "team" ? "Read the request, reply, and record the next clear step." : "Create a private request for Team Faraz and keep its conversation in one place. Requests do not approve public work or turn on any service."} />
    <SafetyBoundary role={role} />
    <section className="momo-request-no-go" role="status">
      <div><strong>Manual pilot remains No-Go</strong><span>A request is operating evidence only. Verified owner identity, all 18 truth confirmations, media rights, readiness evidence, and the full reviewed recovery loop are still separate requirements.</span></div>
      <StatusBadge status="no_go" />
    </section>

    {role === "client" && <form className="momo-panel momo-form momo-request-create" onSubmit={(event) => void submitClientRequest(event)}>
      <div className="momo-panel-heading"><div><p className="eyebrow">NEW PRIVATE REQUEST</p><h2>What do you need?</h2><small>Saved only under this signed Client identity.</small></div><StatusBadge status="manual_only" /></div>
      <div className="momo-form-grid">
        <label>Request type<select value={requestType} onChange={(event) => { setRequestType(event.target.value as MomoClientRequest["requestType"]); setRequestKey(newMomoRequestIdempotencyKey("request")); }}><option value="support">General support</option><option value="onboarding">Onboarding</option><option value="truth_update">Restaurant information</option><option value="media">Media</option><option value="content">Content</option><option value="website">Website</option><option value="reporting">Reporting</option></select></label>
        <label>Priority<select value={requestPriority} onChange={(event) => { setRequestPriority(event.target.value as MomoClientRequest["priority"]); setRequestKey(newMomoRequestIdempotencyKey("request")); }}><option value="normal">Normal</option><option value="urgent">Urgent</option></select></label>
        <label className="wide">Short title<input value={requestTitle} minLength={3} maxLength={200} onChange={(event) => { setRequestTitle(event.target.value); setRequestKey(newMomoRequestIdempotencyKey("request")); }} placeholder="Example: Help confirm holiday hours" required /></label>
        <label className="wide">Useful detail<textarea value={requestDetails} minLength={3} maxLength={5000} rows={4} onChange={(event) => { setRequestDetails(event.target.value); setRequestKey(newMomoRequestIdempotencyKey("request")); }} placeholder="Describe the requested outcome without sharing passwords or payment details." required /></label>
      </div>
      <p className="momo-form-note">Team Faraz must acknowledge the request before linking work. Urgent is a queue label, not a guarantee of immediate completion.</p>
      <button className="secondary-button" disabled={actionBusy || !requestFormValid}>Send private request</button>
    </form>}

    {role === "team" && <form className="momo-panel momo-form momo-request-create" onSubmit={(event) => void submitTeamRequest(event)}>
      <div className="momo-panel-heading"><div><p className="eyebrow">NEW MESSAGE TO MOMO</p><h2>Request clarification or a change</h2><small>This creates a shared request visible in the Momo client portal. It never changes owner truth.</small></div><StatusBadge status="owner_response" /></div>
      <div className="momo-form-grid">
        <label>Request type<select value={requestType} onChange={(event) => { setRequestType(event.target.value as MomoClientRequest["requestType"]); setRequestKey(newMomoRequestIdempotencyKey("request")); }}><option value="truth_update">Restaurant information</option><option value="website">Website / SEO</option><option value="content">Content</option><option value="media">Media</option><option value="onboarding">Onboarding</option><option value="reporting">Reporting</option><option value="support">General support</option></select></label>
        <label>Reason<select value={requestCategory} onChange={(event) => { setRequestCategory(event.target.value as MomoRequestReasonCategory); setRequestKey(newMomoRequestIdempotencyKey("request")); }}>{(Object.keys(momoRequestReasonLabels) as MomoRequestReasonCategory[]).map((category) => <option key={category} value={category}>{momoRequestReasonLabels[category]}</option>)}</select></label>
        <label className="wide">Request title<input value={requestTitle} minLength={3} maxLength={200} onChange={(event) => { setRequestTitle(event.target.value); setRequestKey(newMomoRequestIdempotencyKey("request")); }} placeholder="Example: Confirm holiday hours before the SEO update" required /></label>
        <label>Affected platform or surface<input value={requestPlatform} maxLength={200} onChange={(event) => { setRequestPlatform(event.target.value); setRequestKey(newMomoRequestIdempotencyKey("request")); }} placeholder="Example: Google Business Profile" /></label>
        <label>Priority<select value={requestPriority} onChange={(event) => { setRequestPriority(event.target.value as MomoClientRequest["priority"]); setRequestKey(newMomoRequestIdempotencyKey("request")); }}><option value="normal">Normal</option><option value="urgent">Urgent</option></select></label>
        <label className="wide">Message to Momo<textarea value={requestDetails} minLength={3} maxLength={5000} rows={4} onChange={(event) => { setRequestDetails(event.target.value); setRequestKey(newMomoRequestIdempotencyKey("request")); }} placeholder="Explain what Momo needs to confirm, correct, or provide. Do not request passwords or payment details." required /></label>
        <label className="wide">Suggested correction, if known<textarea value={requestCorrection} maxLength={2000} rows={3} onChange={(event) => { setRequestCorrection(event.target.value); setRequestKey(newMomoRequestIdempotencyKey("request")); }} placeholder="Leave blank when Momo needs to supply the fact." /></label>
      </div>
      <p className="momo-form-note">The request category, affected surface, and suggested correction are retained with the tenant-scoped request record and thread.</p>
      <button className="secondary-button" disabled={actionBusy || !requestFormValid}>{actionBusy ? "Sending…" : "Send request to Momo"}</button>
    </form>}

    <section className="momo-request-layout">
      <article className="momo-panel momo-request-list-panel">
        <div className="momo-panel-heading"><div><p className="eyebrow">SHARED REQUEST QUEUE</p><h2>{role === "team" ? "Messages from Momo" : "Messages & requests"}</h2><small>Bounded to the 25 most recent tenant-scoped records.</small></div><span>{requests.length}</span></div>
        {listState === "loading" && requests.length === 0 ? <EmptyState title="Loading private requests…" detail="No fixture or cached request is shown." />
          : listState === "error" ? <EmptyState title="Requests are unavailable." detail="No request is being inferred. Reload when database access is restored." />
            : requests.length === 0 ? <EmptyState title="No request records exist." detail={role === "team" ? "No Momo Client request has been persisted. Team work will not be invented to make this queue look active." : "Your signed Client identity has not created a request. The manual pilot remains safely empty."} />
              : <div className="momo-request-list">{requests.map((request) => <button type="button" key={request.id} className={selectedId === request.id ? "active" : ""} onClick={() => { threadLoadSequence.current += 1; setThread([]); setThreadRequestId(null); setThreadState("loading"); setSelectedId(request.id); setWorkKey(newMomoRequestIdempotencyKey("work")); setLastLinkedWorkId(null); }} aria-pressed={selectedId === request.id}><span><strong>{request.title}</strong><small>{request.createdByRole === "team" ? "From Team" : "From Momo"} · {request.requestCategory ? momoRequestReasonLabels[request.requestCategory] : labelStatus(request.requestType)} · {formatDate(request.createdAt)}</small></span><span><StatusBadge status={request.status} />{request.priority === "urgent" && <em>Urgent</em>}</span></button>)}</div>}
        <button type="button" className="momo-request-refresh" disabled={listState === "loading" || actionBusy} onClick={() => void reloadRequests(selectedId || undefined)}>Refresh verified records</button>
      </article>

      <article className="momo-panel momo-request-thread-panel">
        {!selected ? <EmptyState title="Choose a request." detail="Its private thread, allowed next state, and linked-work control will appear here." /> : <>
          <div className="momo-request-detail-head"><div><p className="eyebrow">{selected.requestCategory ? momoRequestReasonLabels[selected.requestCategory] : labelStatus(selected.requestType)} · {labelStatus(selected.priority)} priority</p><h2>{selected.title}</h2><p>{selected.details}</p>{(selected.context?.affectedPlatform || selected.context?.suggestedCorrection) && <div className="momo-request-reference"><small>{selected.context.affectedPlatform ? `Affected surface: ${selected.context.affectedPlatform}` : ""}{selected.context.affectedPlatform && selected.context.suggestedCorrection ? " · " : ""}{selected.context.suggestedCorrection ? `Suggested correction: ${selected.context.suggestedCorrection}` : ""}</small></div>}<small>Created {formatDate(selected.createdAt)} · updated {formatDate(selected.updatedAt)}</small></div><StatusBadge status={selected.status} /></div>
          <section className="momo-request-thread" aria-label={`Private messages for ${selected.title}`}>
            {visibleThreadState === "loading" ? <EmptyState title="Loading the private thread…" detail="Only database messages are shown." />
              : visibleThreadState === "error" ? <EmptyState title="Thread unavailable." detail="No message is being inferred or cached." />
                : visibleThread.length === 0 ? <EmptyState title="No messages yet." detail="The request details above are the only persisted context." />
                  : [...visibleThread].reverse().map((message) => <article className={message.senderRole === role ? "mine" : ""} key={message.id}><header><strong>{message.senderRole === "team" ? "Team Faraz" : "Momo Client"}</strong><small>{formatDate(message.createdAt)}</small></header><p>{message.body}</p></article>)}
          </section>
          {requestClosed
            ? <p className="momo-form-note">This request is closed. Its private history remains visible and immutable; new messages cannot be added.</p>
            : <form className="momo-request-message-form" onSubmit={(event) => void submitMessage(event)}><label><span>Add a private message</span><textarea value={messageBody} maxLength={5000} rows={3} onChange={(event) => { setMessageBody(event.target.value); setMessageKey(newMomoRequestIdempotencyKey("message")); }} placeholder="Add useful context. Do not share passwords or payment details." /></label><button className="secondary-button" disabled={actionBusy || !messageValid}>Send message</button></form>}

          {role === "team" && <section className="momo-request-team-controls">
            <div><p className="eyebrow">TEAM STATE CONTROL</p><h3>Record the next reviewed state</h3><p>Each transition writes the note into the same private thread and emits bounded activity.</p></div>
            {nextTransitions.length === 0 ? <p className="momo-form-note">This request is closed. Its history remains visible and immutable.</p> : <><label>Transition note<textarea value={transitionNotes} minLength={5} maxLength={2000} rows={3} onChange={(event) => { setTransitionNotes(event.target.value); setTransitionAttempt(null); }} placeholder="Explain what was reviewed or why the request is closing." /></label><div className="momo-request-actions">{nextTransitions.map((target) => <button type="button" key={target} disabled={actionBusy || !transitionValid} onClick={() => void transitionRequest(target)}>{target === "cancelled" ? "Cancel with reason" : target === "acknowledged" ? "Acknowledge request" : target === "in_progress" ? "Start request" : "Complete request"}</button>)}</div></>}
          </section>}

          {role === "team" && ["acknowledged", "in_progress"].includes(selected.status) && <form className="momo-request-work-form" onSubmit={(event) => void submitLinkedWork(event)}>
            <div><p className="eyebrow">REQUEST-LINKED WORK</p><h3>Queue one traceable work item</h3><p>The request link is assigned only inside the database RPC; the browser never writes either private request table.</p></div>
            <div className="momo-form-grid"><label>Work type<select value={workType} onChange={(event) => { setWorkType(event.target.value); setWorkKey(newMomoRequestIdempotencyKey("work")); }}><option value="onboarding">Onboarding</option><option value="truth_review">Truth review</option><option value="media">Media</option><option value="content">Content</option><option value="publishing">Publishing</option><option value="google">Google</option><option value="seo">SEO</option><option value="reviews">Reviews</option><option value="website">Website</option><option value="reporting">Reporting</option><option value="monitoring">Monitoring</option><option value="recovery">Recovery</option></select></label><label>Priority (1–5)<input type="number" min={1} max={5} step={1} value={workPriority} onChange={(event) => { setWorkPriority(Number(event.target.value)); setWorkKey(newMomoRequestIdempotencyKey("work")); }} /></label><label className="wide">Work title<input value={workTitle} minLength={3} maxLength={200} onChange={(event) => { setWorkTitle(event.target.value); setWorkKey(newMomoRequestIdempotencyKey("work")); }} required /></label><label className="wide">Internal detail<textarea value={workDescription} maxLength={5000} rows={3} onChange={(event) => { setWorkDescription(event.target.value); setWorkKey(newMomoRequestIdempotencyKey("work")); }} /></label><label>Optional due time<input type="datetime-local" value={workDueAt} onChange={(event) => { setWorkDueAt(event.target.value); setWorkKey(newMomoRequestIdempotencyKey("work")); }} /></label></div>
            <button className="secondary-button" disabled={actionBusy || !workFormValid}>Queue linked work</button>
            {lastLinkedWorkId && <div className="momo-callout"><strong>Linked work recorded</strong><p>Work reference {lastLinkedWorkId.slice(0, 8)}… is now traceable from this request.</p><button type="button" onClick={() => onNavigate("team-work")}>Open Work Board</button></div>}
          </form>}
        </>}
      </article>
    </section>
  </div>;
}

function Module({ title, detail, status, action, onClick }: { title: string; detail: string; status: string; action: string; onClick: () => void }) {
  return <article className="momo-module"><div><h2>{title}</h2><StatusBadge status={status} /></div><p>{detail}</p><button onClick={onClick}>{action} <span aria-hidden="true">→</span></button></article>;
}

const truthDefinitions = [
  ["identity.display_name", "identity", "Restaurant name", "text"],
  ["identity.legal_name", "identity", "Legal business name", "text"],
  ["identity.cuisine", "identity", "Cuisine and specialties", "textarea"],
  ["address.primary", "address", "Street address", "text"],
  ["phone.primary", "phone", "Public phone", "tel"],
  ["hours.regular", "hours", "Regular business hours", "textarea"],
  ["hours.special", "hours", "Special or holiday hours", "textarea"],
  ["menu.primary", "menu", "Menu URL or description", "textarea"],
  ["services.active", "services", "Active services (comma separated)", "textarea"],
  ["services.delivery", "services", "Delivery services", "textarea"],
  ["services.catering", "services", "Catering services", "textarea"],
  ["claims.dietary", "claims", "Dietary claims", "textarea"],
  ["claims.halal", "claims", "Halal claim", "halal_select"],
  ["brand.voice", "brand", "Brand voice", "textarea"],
  ["brand.positioning", "brand", "Brand positioning", "textarea"],
  ["goals.primary", "goals", "Primary restaurant goals", "textarea"],
  ["goals.audience", "goals", "Priority audience", "textarea"],
  ["goals.customer_action", "goals", "Desired customer action", "textarea"],
] as const;

const momoRequestReasonLabels: Record<MomoRequestReasonCategory, string> = {
  factual_error: "Factual error",
  seo_improvement: "SEO improvement",
  missing_evidence: "Missing evidence",
  outdated_information: "Outdated information",
  compliance: "Compliance",
  owner_clarification: "Owner clarification",
  operational_change: "Operational change",
};

type MomoProfileSection = "profile" | "owner" | "setup";

function IntelligencePanel(props: PanelProps) {
  const { data, role, busy, run, onNavigate } = props;
  const [activeSection, setActiveSection] = useState<MomoProfileSection>("profile");
  const [ownerRequest, setOwnerRequest] = useState<MomoConfirmation | null>(null);
  const [ownerRequestCategory, setOwnerRequestCategory] = useState<MomoRequestReasonCategory>("owner_clarification");
  const [ownerRequestTitle, setOwnerRequestTitle] = useState("");
  const [ownerRequestDetails, setOwnerRequestDetails] = useState("");
  const [ownerRequestPlatform, setOwnerRequestPlatform] = useState("");
  const [ownerRequestCorrection, setOwnerRequestCorrection] = useState("");
  const currentTruthFields = data.truth.filter((item) => item.is_current);
  const historicalTruthFields = data.truth.filter((item) => !item.is_current);
  const currentOwnerTruth = currentTruthFields.filter((item) => momoTruthFieldIsCurrentlyUsable(data, item.id)).length;
  const currentOwnerContacts = data.contacts.filter((item) => item.status === "owner_confirmed" && subjectHasNoContraryOwnerIntent(data.confirmations, "contact", item.id)).length;
  const currentVerifiedOnboarding = data.onboarding.filter((item) => {
    const latest = latestSubjectConfirmation(data.confirmations, "onboarding_step", item.id);
    return item.status === "verified" && latest?.status === "approved" && ["confirm", "correct"].includes(latest.decision || "");
  }).length;
  const pendingConfirmations = data.confirmations.filter((item) => ["pending", "in_review"].includes(item.status));
  const confirmationHistory = data.confirmations.filter((item) => !["pending", "in_review"].includes(item.status));
  const openOwnerRequest = (confirmation: MomoConfirmation) => {
    setOwnerRequest(confirmation);
    setOwnerRequestCategory("owner_clarification");
    setOwnerRequestTitle(`Owner clarification: ${labelStatus(confirmation.confirmation_kind)}`);
    setOwnerRequestDetails(confirmation.notes || "Please review this response and confirm or correct the information in the Momo portal.");
    setOwnerRequestPlatform("");
    setOwnerRequestCorrection(valueText(confirmation.proposed_value));
  };
  const submitOwnerRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (role !== "team" || !ownerRequest || ownerRequestDetails.trim().length < 3 || ownerRequestTitle.trim().length < 3) return;
    const requestType = ownerRequestCategory === "seo_improvement" ? "website" : "truth_update";
    void run(async () => {
      await createMomoTeamRequest({
        restaurantId: props.restaurantId,
        requestType,
        title: ownerRequestTitle,
        details: ownerRequestDetails,
        priority: "normal",
        requestCategory: ownerRequestCategory,
        subjectType: ownerRequest.subject_type || undefined,
        subjectId: ownerRequest.subject_id || undefined,
        context: {
          affectedField: labelStatus(ownerRequest.subject_type),
          affectedPlatform: ownerRequestPlatform.trim() || undefined,
          suggestedCorrection: ownerRequestCorrection.trim() || undefined,
        },
        idempotencyKey: newMomoRequestIdempotencyKey("request"),
      });
      setOwnerRequest(null);
    }, "Request sent to Momo. The owner response remains pending until Momo confirms or corrects it.");
  };
  const confirmationRecord = (confirmation: MomoWorkspaceData["confirmations"][number]) => {
    return <article key={confirmation.id}>
      <div>
        <strong>{labelStatus(confirmation.confirmation_kind)}</strong>
        <p>{valueText(confirmation.proposed_value) || confirmation.notes || "No proposed value"}</p>
        <small>{labelStatus(confirmation.subject_type)} · Owner response: {labelStatus(confirmation.decision)} · {formatDate(confirmation.created_at)}</small>
      </div>
      <StatusBadge status={confirmation.status} />
      {role === "team" && ["pending", "in_review"].includes(confirmation.status) && <div className="momo-decision">
        <button type="button" disabled={busy} onClick={() => openOwnerRequest(confirmation)}>Request owner change</button>
      </div>}
    </article>;
  };
  const profileEditor = <>
    <RestaurantTruthForm key={data.truth.map((item) => `${item.id}:${item.updated_at}`).join("|")} {...props} />
    <ContactForm key={data.contacts.map((item) => `${item.id}:${item.updated_at}`).join("|")} {...props} />
  </>;
  const ownerReview = <section className="momo-panel">
    <div className="momo-panel-heading"><div><p className="eyebrow">OWNER REVIEW</p><h2>Responses waiting now</h2><small>Team monitors the response. Momo confirms or corrects restaurant truth in the client portal.</small></div><span>{pendingConfirmations.length}</span></div>
    {role === "team" && <div className="momo-callout"><strong>Owner authority stays with Momo</strong><p>Use a request when facts, evidence, SEO, or operations need clarification. Team cannot approve or apply an owner response.</p><button type="button" onClick={() => onNavigate?.("team-requests")}>Open Messages &amp; requests</button></div>}
    {pendingConfirmations.length === 0 ? <EmptyState title="No owner response is waiting." detail="Owner changes appear here only after a real submission." /> : <div className="momo-record-list">{pendingConfirmations.map(confirmationRecord)}</div>}
    {role === "team" && ownerRequest && <form className="momo-form momo-owner-request-form" onSubmit={submitOwnerRequest}>
      <div className="momo-panel-heading"><div><p className="eyebrow">REQUEST OWNER CHANGE</p><h2>Send a clear request to Momo</h2><small>Linked to {labelStatus(ownerRequest.subject_type)}. This does not change the owner response.</small></div><button type="button" onClick={() => setOwnerRequest(null)}>Close</button></div>
      <div className="momo-form-grid">
        <label>Reason<select value={ownerRequestCategory} onChange={(event) => setOwnerRequestCategory(event.target.value as MomoRequestReasonCategory)}>{(Object.keys(momoRequestReasonLabels) as MomoRequestReasonCategory[]).map((category) => <option key={category} value={category}>{momoRequestReasonLabels[category]}</option>)}</select></label>
        <label>Affected platform or surface<input value={ownerRequestPlatform} onChange={(event) => setOwnerRequestPlatform(event.target.value)} placeholder="Example: Google Business Profile" /></label>
        <label className="wide">Request title<input value={ownerRequestTitle} minLength={3} maxLength={200} onChange={(event) => setOwnerRequestTitle(event.target.value)} required /></label>
        <label className="wide">Message to Momo<textarea value={ownerRequestDetails} minLength={3} maxLength={5000} rows={4} onChange={(event) => setOwnerRequestDetails(event.target.value)} required /></label>
        <label className="wide">Suggested correction, if known<textarea value={ownerRequestCorrection} maxLength={2000} rows={3} onChange={(event) => setOwnerRequestCorrection(event.target.value)} placeholder="Leave blank when Momo needs to supply the fact." /></label>
      </div>
      <p className="momo-form-note">The request, category, linked record, and message are stored in the shared private thread visible to Team and Momo.</p>
      <button className="secondary-button" disabled={busy || ownerRequestTitle.trim().length < 3 || ownerRequestDetails.trim().length < 3}>{busy ? "Sending…" : "Send request to Momo"}</button>
    </form>}
    {confirmationHistory.length > 0 && <details className="momo-work-history momo-profile-history"><summary><span><strong>Decision history</strong><small>Open only when you need the audit trail.</small></span><b>{confirmationHistory.length}</b></summary><div className="momo-record-list">{confirmationHistory.map(confirmationRecord)}</div></details>}
  </section>;
  const setupNextAction = pendingConfirmations.length > 0
    ? "Review Momo's response in Owner review."
    : currentOwnerTruth < currentTruthFields.length
      ? "Momo still needs to confirm current business details."
      : data.onboarding.some((step) => ["blocked", "not_started"].includes(step.status))
        ? "Review setup items with blockers or missing evidence."
        : "No owner response or setup blocker is waiting.";
  const setupDetails = <div className="momo-setup-details">
    {role === "team" && <section className="momo-profile-summary momo-setup-summary" aria-label="Setup progress">
      <span><strong>{currentOwnerTruth}/{currentTruthFields.length}</strong> confirmed facts</span>
      <span><strong>{currentOwnerContacts}</strong> confirmed contacts</span>
      <span><strong>{currentVerifiedOnboarding}/{data.onboarding.length}</strong> verified setup steps</span>
      <span className="momo-setup-next"><strong>Next action</strong><small>{setupNextAction}</small></span>
      <em>Posting off</em>
    </section>}
    <details className="momo-setup-disclosure" open={role === "client" ? true : undefined}>
      <summary><span><strong>Current restaurant information</strong><small>Business facts and owner-confirmation status.</small></span><b>{currentTruthFields.length}</b></summary>
      <div className="momo-setup-disclosure-body">
        {currentTruthFields.length === 0 ? <EmptyState title="No current restaurant truth has been recorded." detail="Use Profile to add facts. Unconfirmed facts remain absent." /> : <div className="momo-record-list">{currentTruthFields.map((field) => <article key={field.id}><div><strong>{labelStatus(field.field_key)}</strong><p>{valueText(field.value_json) || "Empty value"}</p><small>{labelStatus(field.section)} · {field.source} · Current record</small></div><StatusBadge status={field.status === "owner_confirmed" && !momoTruthFieldIsCurrentlyUsable(data, field.id) ? "owner_blocked" : field.status} /></article>)}</div>}
        {historicalTruthFields.length > 0 && <details className="momo-setup-history"><summary><span><strong>View superseded field history</strong><small>Older values remain available for audit but are not active.</small></span><b>{historicalTruthFields.length}</b></summary><div className="momo-record-list">{historicalTruthFields.map((field) => <article key={field.id}><div><strong>{labelStatus(field.field_key)}</strong><p>{valueText(field.value_json) || "Empty value"}</p><small>{labelStatus(field.section)} · {field.source} · Historical record</small></div><StatusBadge status="superseded" /></article>)}</div></details>}
      </div>
    </details>
    <details className="momo-setup-disclosure">
      <summary><span><strong>Required setup</strong><small>Progress, evidence, and blockers—one item at a time.</small></span><b>{data.onboarding.length}</b></summary>
      <div className="momo-setup-disclosure-body">
        {data.onboarding.length === 0 ? <EmptyState title="No onboarding steps exist." detail="A step is never complete without a stored record and evidence." /> : <div className="momo-record-list momo-setup-item-list">{data.onboarding.map((step) => <OnboardingStepDisclosure key={step.id} step={step} {...props} />)}</div>}
      </div>
    </details>
    <details className="momo-setup-disclosure">
      <summary><span><strong>Access &amp; connections</strong><small>Public profile records and access status. Nothing is connected or published.</small></span><b>{data.presence.length}</b></summary>
      <div className="momo-setup-disclosure-body">
        {data.presence.length === 0 ? <EmptyState title="No public profile is configured." detail="Google, Instagram, Facebook, website, and ordering links remain unverified." /> : <div className="momo-card-grid momo-setup-presence-grid">{data.presence.map((profile) => <PresenceProfileCard key={profile.id} profile={profile} {...props} />)}</div>}
      </div>
    </details>
  </div>;

  return <div className="view">
    <MomoIntro eyebrow="MOMO’S HOUSE" title="Momo profile" description="Restaurant facts, responsible contacts, owner decisions, and required setup." />
    <SafetyBoundary role={role} />
    {role === "team" ? <>
      <nav className="momo-content-tabs momo-profile-tabs" aria-label="Momo profile sections">
        <button type="button" className={activeSection === "profile" ? "active" : ""} onClick={() => setActiveSection("profile")}>Profile</button>
        <button type="button" className={activeSection === "owner" ? "active" : ""} onClick={() => setActiveSection("owner")}>Owner review{pendingConfirmations.length > 0 && <b>{pendingConfirmations.length}</b>}</button>
        <button type="button" className={activeSection === "setup" ? "active" : ""} onClick={() => setActiveSection("setup")}>Setup details</button>
      </nav>
      <section hidden={activeSection !== "profile"}>{profileEditor}</section>
      <section hidden={activeSection !== "owner"}>{ownerReview}</section>
      <section hidden={activeSection !== "setup"}>{setupDetails}</section>
    </> : <>{profileEditor}{ownerReview}{setupDetails}</>}
  </div>;
}

function OnboardingStepRow({ step, data, role, restaurantId, busy, run }: PanelProps & { step: MomoWorkspaceData["onboarding"][number] }) {
  const [status, setStatus] = useState(step.status);
  const [evidence, setEvidence] = useState(jsonList(step.completion_evidence).join("\n"));
  const [blockerReason, setBlockerReason] = useState(step.blocker_reason || "");
  const latestOwnerDecision = data.confirmations
    .filter((item) => item.subject_type === "onboarding_step" && item.subject_id === step.id)
    .map((item, index) => ({ item, index, timestamp: Date.parse(item.created_at) }))
    .sort((left, right) => (Number.isFinite(right.timestamp) ? right.timestamp : 0) - (Number.isFinite(left.timestamp) ? left.timestamp : 0) || left.index - right.index)[0]?.item;
  const pending = Boolean(latestOwnerDecision && ["pending", "in_review"].includes(latestOwnerDecision.status));
  const contraryOwnerIntent = Boolean(latestOwnerDecision && ["reject", "needs_help"].includes(latestOwnerDecision.decision || ""));
  const approvedConfirmation = latestOwnerDecision?.status === "approved" && ["confirm", "correct"].includes(latestOwnerDecision.decision || "") ? latestOwnerDecision : undefined;
  const evidenceItems = evidence.split("\n").map((item) => item.trim()).filter(Boolean);
  const invalidVerified = status === "verified" && (evidenceItems.length === 0 || !approvedConfirmation || contraryOwnerIntent);
  const invalidBlocked = status === "blocked" && !blockerReason.trim();
  const readyForOwnerConfirmation = step.status === "ready_for_review";
  return <article><div><strong>{step.title}</strong><p>{step.blocker_reason || valueText(step.completion_evidence) || "No evidence recorded"}</p></div><StatusBadge status={pending ? "pending" : contraryOwnerIntent ? "owner_blocked" : step.status} />{role === "client" && <div className="momo-decision"><button type="button" disabled={busy || pending || !readyForOwnerConfirmation} onClick={() => void run(() => submitMomoConfirmation({ restaurantId, subjectType: "onboarding_step", subjectId: step.id, confirmationKind: "onboarding", decision: "confirm", proposedValue: { stepKey: step.step_key } }), "Onboarding step confirmation queued for Team review.")}>Confirm complete</button><button type="button" disabled={busy || pending} onClick={() => void run(() => submitMomoConfirmation({ restaurantId, subjectType: "onboarding_step", subjectId: step.id, confirmationKind: "onboarding", decision: "needs_help", notes: `Owner requested help with ${step.title}.` }), "Onboarding step marked as needing help.")}>Need help</button>{!readyForOwnerConfirmation && <small>Team evidence must reach Ready for review before completion can be confirmed.</small>}</div>}{role === "team" && <div className="momo-form momo-compact-form"><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="not_started">Not started</option><option value="foundation_ready">Foundation ready</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="ready_for_review">Ready for review</option><option value="verified">Verified</option></select></label><label>Evidence, one item per line<textarea value={evidence} onChange={(event) => setEvidence(event.target.value)} rows={2} /></label><label>Blocker reason<input value={blockerReason} onChange={(event) => setBlockerReason(event.target.value)} /></label>{contraryOwnerIntent && <p className="momo-warning">The latest owner decision blocks verification until a newer exact owner confirmation is approved.</p>}<button type="button" disabled={busy || pending || contraryOwnerIntent || invalidVerified || invalidBlocked} onClick={() => void run(() => updateMomoOnboardingStep({ restaurantId, stepId: step.id, status: status as Parameters<typeof updateMomoOnboardingStep>[0]["status"], completionEvidence: evidenceItems, blockerReason, confirmationId: approvedConfirmation?.id }), "Onboarding evidence and status updated.")}>Save step review</button></div>}</article>;
}

function OnboardingStepDisclosure(props: PanelProps & { step: MomoWorkspaceData["onboarding"][number] }) {
  const { step, data } = props;
  const latestOwnerDecision = latestSubjectConfirmation(data.confirmations, "onboarding_step", step.id);
  const status = latestOwnerDecision && ["pending", "in_review"].includes(latestOwnerDecision.status)
    ? "pending"
    : latestOwnerDecision && ["reject", "needs_help"].includes(latestOwnerDecision.decision || "")
      ? "owner_blocked"
      : step.status;
  const summary = step.blocker_reason || (jsonList(step.completion_evidence).length > 0
    ? "Evidence recorded; open to review."
    : "No evidence recorded yet.");
  return <details className="momo-setup-item">
    <summary><span><strong>{step.title}</strong><small>{summary}</small></span><StatusBadge status={status} /></summary>
    <div className="momo-setup-item-body"><OnboardingStepRow {...props} /></div>
  </details>;
}

function PresenceProfileCard({ profile, data, role, restaurantId, busy, run }: PanelProps & { profile: MomoWorkspaceData["presence"][number] }) {
  const [publicUrl, setPublicUrl] = useState(profile.public_url || "");
  const [accessStatus, setAccessStatus] = useState(profile.access_status);
  const [truthStatus, setTruthStatus] = useState(profile.truth_status);
  const [notes, setNotes] = useState(profile.notes || "");
  const [accessAuthorized, setAccessAuthorized] = useState(false);
  const normalizedPublicUrl = normalizedHttpsUrl(publicUrl);
  const presenceResolution = resolveLatestMomoPresenceConfirmation(
    data.confirmations.filter((item) => item.subject_type === "presence_profile" && item.subject_id === profile.id),
    normalizedPublicUrl,
  );
  const pending = presenceResolution.pending;
  const approvedConfirmation = presenceResolution.approved;
  const ownerConfirmedUrl = presenceResolution.exactUrlConfirmed;
  const ownerAuthorizedAccess = presenceResolution.accessAuthorized;
  const invalidUrl = Boolean(publicUrl.trim()) && !normalizedPublicUrl;
  const ownerTruthWithoutEvidence = truthStatus === "owner_confirmed" && !ownerConfirmedUrl;
  const connectedWithoutEvidence = ["connected", "degraded"].includes(accessStatus) && (
    truthStatus !== "owner_confirmed" || !ownerConfirmedUrl || !ownerAuthorizedAccess || notes.trim().length < 10
  );
  const contraryOwnerIntent = Boolean(presenceResolution.latest && !(
    presenceResolution.latest.status === "approved" && ["confirm", "correct"].includes(presenceResolution.latest.decision || "")
  ));
  return <details className="momo-setup-item momo-presence-item">
    <summary><span><strong>{labelStatus(profile.provider)}</strong><small>{profile.public_url || "No public URL recorded"}</small></span><StatusBadge status={pending ? "pending" : contraryOwnerIntent ? "owner_blocked" : profile.access_status} /></summary>
    <div className="momo-setup-item-body">
    <p className="momo-setup-item-evidence">Truth: {labelStatus(profile.truth_status)} · checked {formatDate(profile.last_checked_at)}</p>
    {role === "client" && <div className="momo-form momo-compact-form">
      <label>Correct public URL<input type="url" value={publicUrl} placeholder="https://" onChange={(event) => setPublicUrl(event.target.value)} /></label>
      <label className="momo-check"><input type="checkbox" checked={accessAuthorized} onChange={(event) => setAccessAuthorized(event.target.checked)} /><span>I authorize Veroxa to use access I separately provide for this profile. This does not connect or publish anything now.</span></label>
      <div className="momo-decision">
        <button type="button" disabled={busy || pending || !normalizedHttpsUrl(profile.public_url)} onClick={() => void run(() => submitMomoConfirmation({ restaurantId, subjectType: "presence_profile", subjectId: profile.id, confirmationKind: "presence", decision: "confirm", proposedValue: { publicUrl: profile.public_url, accessAuthorized } }), "Presence URL and access choice queued for Team review.")}>Confirm URL and choice</button>
        <button type="button" disabled={busy || pending || !normalizedPublicUrl || normalizedPublicUrl === normalizedHttpsUrl(profile.public_url)} onClick={() => void run(() => submitMomoConfirmation({ restaurantId, subjectType: "presence_profile", subjectId: profile.id, confirmationKind: "presence", decision: "correct", proposedValue: { publicUrl: normalizedPublicUrl, accessAuthorized } }), "Presence correction and access choice queued for Team review.")}>Submit correction</button>
        <button type="button" disabled={busy || pending} onClick={() => void run(() => submitMomoConfirmation({ restaurantId, subjectType: "presence_profile", subjectId: profile.id, confirmationKind: "presence", decision: "reject", notes: `Owner withdrew approval for the ${labelStatus(profile.provider)} presence profile.` }), "Presence withdrawal queued for Team review. New provider actions remain subject to the server-side withdrawal gate.")}>Withdraw profile approval</button>
        <button type="button" disabled={busy || pending} onClick={() => void run(() => submitMomoConfirmation({ restaurantId, subjectType: "presence_profile", subjectId: profile.id, confirmationKind: "presence", decision: "needs_help", notes: `Owner requested help with ${labelStatus(profile.provider)} access.` }), "Presence profile marked as needing help.")}>Need help</button>
      </div>
    </div>}
    {role === "team" && <div className="momo-form momo-compact-form">
      <label>Public URL<input type="url" value={publicUrl} placeholder="https://" onChange={(event) => setPublicUrl(event.target.value)} /></label>
      <label>Access status<select value={accessStatus} onChange={(event) => setAccessStatus(event.target.value)}><option value="not_connected">Not connected</option><option value="awaiting_owner_access">Awaiting owner access</option><option value="connected">Connected</option><option value="degraded">Degraded</option><option value="revoked">Revoked</option></select></label>
      <label>Truth status<select value={truthStatus} onChange={(event) => setTruthStatus(event.target.value)}><option value="unverified">Unverified</option><option value="team_prefilled">Team prefilled</option><option value="needs_owner_confirmation">Needs owner confirmation</option><option value="owner_confirmed">Owner confirmed</option><option value="rejected">Rejected</option><option value="superseded">Superseded</option></select></label>
      <label>Review notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} /></label>
      {ownerTruthWithoutEvidence && <p className="momo-warning">An approved owner confirmation is required before this profile can be marked owner confirmed.</p>}
      {connectedWithoutEvidence && <p className="momo-warning">Connected or degraded requires owner-confirmed profile truth, approved owner access authorization, the confirmed HTTPS URL, and at least 10 characters of review evidence.</p>}
      <button type="button" disabled={busy || invalidUrl || ownerTruthWithoutEvidence || connectedWithoutEvidence} onClick={() => void run(() => updateMomoPresenceProfile({ restaurantId, presenceProfileId: profile.id, publicUrl: publicUrl.trim() || undefined, accessStatus: accessStatus as Parameters<typeof updateMomoPresenceProfile>[0]["accessStatus"], truthStatus: truthStatus as Parameters<typeof updateMomoPresenceProfile>[0]["truthStatus"], notes, confirmationId: ownerConfirmedUrl ? approvedConfirmation?.id : undefined }), "Presence evidence and status updated.")}>Save presence review</button>
    </div>}
    </div>
  </details>;
}

function RestaurantTruthForm({ data, role, restaurantId, busy, run }: PanelProps) {
  const current = useMemo(() => Object.fromEntries(data.truth.filter((item) => item.is_current).map((item) => [item.field_key, valueText(item.value_json)])), [data.truth]);
  const [values, setValues] = useState<Record<string, string>>(current);
  const changedFields = useMemo(() => truthDefinitions.filter(([key]) =>
    (values[key] || "").trim() && (values[key] || "").trim() !== (current[key] || "").trim()
  ), [current, values]);

  const storedValue = (key: string, raw: string) => key === "claims.halal"
    ? [raw.trim().toLowerCase()]
    : key.startsWith("services.") || key.startsWith("goals.") || key.startsWith("claims.")
    ? raw.split(",").map((item) => item.trim()).filter(Boolean)
    : { text: raw.trim() };

  if (role === "client") {
    return <section className="momo-panel momo-form">
      <div className="momo-panel-heading"><div><p className="eyebrow">OWNER CONFIRMATION</p><h2>Restaurant profile</h2></div><StatusBadge status="owner_confirmation" /></div>
      <p className="momo-form-note">Confirm each accurate Team prefill, submit a correction, reject it, or ask for help. Every decision is queued for Team review; nothing is published automatically.</p>
      <div className="momo-record-list">{truthDefinitions.map(([key,, label, type]) => {
        const existing = data.truth.find((item) => item.field_key === key && item.is_current);
        const pending = data.confirmations.some((item) => item.subject_type === "truth_field" && item.subject_id === existing?.id && ["pending", "in_review"].includes(item.status));
        const raw = values[key] || "";
        const hasPrefill = Boolean(existing && valueText(existing.value_json));
        return <article key={key}><div><strong>{label}</strong>{type === "textarea" ? <textarea value={raw} onChange={(event) => setValues((previous) => ({ ...previous, [key]: event.target.value }))} rows={2} /> : type === "halal_select" ? <select value={raw} onChange={(event) => setValues((previous) => ({ ...previous, [key]: event.target.value }))}><option value="">Select owner-confirmable status</option><option value="yes">Yes</option><option value="no">No</option></select> : <input type={type} value={raw} onChange={(event) => setValues((previous) => ({ ...previous, [key]: event.target.value }))} />}<small>{existing ? `Current state: ${labelStatus(existing.status)}` : "Awaiting Team prefill"}</small></div><StatusBadge status={pending ? "pending" : existing?.status || "not_started"} />{existing && <div className="momo-decision"><button type="button" disabled={busy || pending || !hasPrefill} onClick={() => void run(() => submitMomoConfirmation({ restaurantId, subjectType: "truth_field", subjectId: existing.id, confirmationKind: "business_truth", decision: "confirm", proposedValue: existing.value_json }), `${label} confirmation queued for Team review.`)}>Confirm as shown</button><button type="button" disabled={busy || pending || !raw.trim() || raw.trim() === (current[key] || "").trim()} onClick={() => void run(() => submitMomoConfirmation({ restaurantId, subjectType: "truth_field", subjectId: existing.id, confirmationKind: "business_truth", decision: "correct", proposedValue: storedValue(key, raw) }), `${label} correction queued for Team review.`)}>Submit correction</button><button type="button" disabled={busy || pending} onClick={() => void run(() => submitMomoConfirmation({ restaurantId, subjectType: "truth_field", subjectId: existing.id, confirmationKind: "business_truth", decision: "needs_help", notes: `Owner requested help with ${label}.` }), `${label} marked as needing help.`)}>Need help</button><button type="button" disabled={busy || pending || !hasPrefill} onClick={() => void run(() => submitMomoConfirmation({ restaurantId, subjectType: "truth_field", subjectId: existing.id, confirmationKind: "business_truth", decision: "reject", notes: `Owner rejected the current ${label} prefill.` }), `${label} rejection queued for Team review.`)}>Reject</button></div>}</article>;
      })}</div>
    </section>;
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (changedFields.length === 0) return;
    void run(() => saveMomoTruthRevisions({
      restaurantId,
      revisions: changedFields.map(([key, section]) => {
        const existing = data.truth.find((item) => item.field_key === key && item.is_current);
        const raw = values[key].trim();
        const value = storedValue(key, raw);
        return { existingId: existing?.id, existingStatus: existing?.status, fieldKey: key, section, value };
      }),
    }), "Team business truth revisions saved atomically.");
  };

  return <form className="momo-panel momo-form" onSubmit={submit}>
    <div className="momo-panel-heading"><div><p className="eyebrow">TEAM PREFILL</p><h2>Restaurant profile</h2></div><StatusBadge status="team_review" /></div>
    <div className="momo-form-grid">{truthDefinitions.map(([key,, label, type]) => <label className={type === "textarea" ? "wide" : ""} key={key}>{label}{type === "textarea" ? <textarea value={values[key] || ""} onChange={(event) => setValues((previous) => ({ ...previous, [key]: event.target.value }))} rows={3} /> : type === "halal_select" ? <select value={values[key] || ""} onChange={(event) => setValues((previous) => ({ ...previous, [key]: event.target.value }))}><option value="">Select status</option><option value="yes">Yes</option><option value="no">No</option></select> : <input type={type} value={values[key] || ""} onChange={(event) => setValues((previous) => ({ ...previous, [key]: event.target.value }))} />}</label>)}</div>
    <p className="momo-form-note">Only populated, changed fields are saved as Team-prefilled review data. “Save Team revisions” persists a prefill; Momo must still confirm or correct each field before it becomes owner truth.</p>
    <div className="momo-review-save-status" aria-live="polite"><strong>{changedFields.length > 0 ? `${changedFields.length} unsaved prefill change${changedFields.length === 1 ? "" : "s"}` : "No unsaved prefill changes"}</strong><span>Save persists the Team prefill; it never confirms owner truth.</span></div>
    <button className="primary-button" type="submit" disabled={busy || changedFields.length === 0}>{busy ? "Saving prefill…" : "Save Team prefill"}</button>
  </form>;
}

function ContactForm({ data, role, restaurantId, busy, run }: PanelProps) {
  const primary = data.contacts.find((item) => item.is_primary);
  const [name, setName] = useState(primary?.name || "");
  const [email, setEmail] = useState(primary?.email || "");
  const [phone, setPhone] = useState(primary?.phone || "");
  const [contactKind, setContactKind] = useState(primary?.contact_kind || "owner");
  const [isPrimary, setIsPrimary] = useState(true);
  return <section className="momo-panel"><form className="momo-inline-form" onSubmit={(event) => {
    event.preventDefault();
    if (!name.trim() || (!email.trim() && !phone.trim())) return;
    const existing = isPrimary ? primary : undefined;
    const success = role === "team"
      ? "Team contact prefill saved. Momo confirmation is still required."
      : existing
        ? "Contact correction queued for Team review."
        : "Owner-confirmed primary contact registered.";
    void run(() => saveMomoContact({ restaurantId, existingId: existing?.id, existingStatus: existing?.status, contactKind, name, email, phone, isPrimary, role }), success);
  }}>
    <div><p className="eyebrow">{role === "team" ? "TEAM PREFILL" : "CONTACTS"}</p><h2>Owner and responsible managers</h2></div>
    {role === "team" && <label>Kind<select value={contactKind} onChange={(event) => setContactKind(event.target.value)}><option value="owner">Owner</option><option value="primary">Primary</option><option value="manager">Manager</option><option value="secondary">Secondary</option></select></label>}
    <label>Name<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
    <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
    <label>Phone<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
    {role === "team" && <label className="momo-check"><input type="checkbox" checked={isPrimary} onChange={(event) => setIsPrimary(event.target.checked)} /><span>Primary contact</span></label>}
    <button className="secondary-button" disabled={busy || (!email.trim() && !phone.trim())}>{role === "team" ? "Save contact prefill" : "Save contact"}</button>
  </form>{data.contacts.length > 0 && <div className="momo-record-list momo-contact-list">{data.contacts.map((contact) => {
    const pending = data.confirmations.some((item) => item.subject_type === "contact" && item.subject_id === contact.id && ["pending", "in_review"].includes(item.status));
    return <article key={contact.id}><div><strong>{contact.name}</strong><p>{[contact.email, contact.phone].filter(Boolean).join(" · ")}</p><small>{labelStatus(contact.contact_kind)}{contact.is_primary ? " · primary" : ""}</small></div><StatusBadge status={pending ? "pending" : contact.status} />{role === "client" && <div className="momo-decision"><button type="button" disabled={busy || pending} onClick={() => void run(() => submitMomoConfirmation({ restaurantId, subjectType: "contact", subjectId: contact.id, confirmationKind: "contact", decision: "confirm", proposedValue: { name: contact.name, email: contact.email, phone: contact.phone, isPrimary: contact.is_primary } }), "Contact confirmation queued for Team review.")}>Confirm as shown</button><button type="button" disabled={busy || pending} onClick={() => void run(() => submitMomoConfirmation({ restaurantId, subjectType: "contact", subjectId: contact.id, confirmationKind: "contact", decision: "needs_help", notes: "Owner requested help correcting this contact." }), "Contact marked as needing help.")}>Need help</button></div>}</article>;
  })}</div>}</section>;
}

function MediaPanel(props: PanelProps) {
  const { data, role, restaurantId, busy, run } = props;
  const [file, setFile] = useState<File | null>(null);
  const [rights, setRights] = useState(false);
  const [scope, setScope] = useState<string[]>(() => [...MOMO_MEDIA_DEFAULT_SCOPE]);
  const [expiresAt, setExpiresAt] = useState("");
  const [restaurantAssociation, setRestaurantAssociation] =
    useState<VeroxaMediaRestaurantAssociation>("not_for_restaurant");
  const [privateAssessmentRequested, setPrivateAssessmentRequested] =
    useState(false);
  const [recoveryAssetId, setRecoveryAssetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const momoToday = momoLocalDate(new Date().toISOString());
  const invalidExpiry = Boolean(expiresAt && expiresAt < momoToday);
  const orderedMedia = [...data.media].sort((left, right) => {
    const order = { team_review: 0, blocked: 1, uploaded: 2, analyzing: 3, preparing_content: 4, veroxa_ready: 5, ready_to_post: 6 } as const;
    return order[resolveMomoAssetPipeline(data, left.id).state] - order[resolveMomoAssetPipeline(data, right.id).state]
      || Date.parse(right.created_at) - Date.parse(left.created_at);
  });
  const openIncidents = data.exceptionIncidentsV2.filter((item) => item.status === "open" && ["media_intake", "rights_reconciliation", "automation_reservation"].includes(item.stage));
  const recoveryAsset = recoveryAssetId ? data.media.find((asset) => asset.id === recoveryAssetId) : undefined;
  const recoveryEvent = recoveryAssetId
    ? data.exceptionEventsV2.find((event) =>
      event.source_asset_id === recoveryAssetId && event.event_kind !== "resolved" &&
      openIncidents.some((incident) => incident.id === event.incident_id)
    )
    : undefined;
  const historyMedia = orderedMedia.filter((asset) => asset.id !== recoveryAssetId);
  const mediaLibrary = <section className="momo-panel">
    <div className="momo-panel-heading"><div><p className="eyebrow">YOUR MEDIA</p><h2>Private originals and status</h2></div><span>{data.media.length}</span></div>
    {data.media.length === 0 ? <EmptyState title="No media has been uploaded." detail="Nothing enters preparation until a real image and rights record exist." /> : <div className="momo-media-grid">{orderedMedia.map((asset) => <MediaAssetCard key={asset.id} asset={asset} {...props} />)}</div>}
  </section>;
  return <div className="view">
    <MomoIntro eyebrow="MOMO’S HOUSE" title="Media" description={role === "team" ? "Run a private assessment-only food upload or resolve a consolidated exception. Assessment tags never authorize restaurant use or posting." : "Upload a private food image you are authorized to use and follow it to Veroxa Ready."} />
    <SafetyBoundary role={role} />
    {role === "client" ? <form className="momo-panel momo-upload" onSubmit={(event) => {
      event.preventDefault();
      if (!file || !rights || !privateAssessmentRequested || invalidExpiry) return;
      void run(async () => {
        await uploadMomoClientMedia({
          restaurantId,
          file,
          usageScope: scope,
          restaurantAssociation,
          rightsAttested: rights,
          expiresAt,
        });
        setFile(null);
        setRights(false);
        setScope([...MOMO_MEDIA_DEFAULT_SCOPE]);
        setExpiresAt("");
        setRestaurantAssociation("not_for_restaurant");
        setPrivateAssessmentRequested(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }, "Your image and upload instruction are saved. Veroxa and Team Faraz own the remaining processing; nothing was posted or connected.");
    }}>
      <div><p className="eyebrow">PRIVATE MEDIA INTAKE</p><h2>Upload one clear food image you may use</h2><p>It can show any food and does not need to be a confirmed Momo menu item. JPG only · 10 KB–5 MB · 320 × 250 px minimum · 12,000 px maximum edge · ratio 4:5–1.91:1.</p></div>
      <label className="momo-file">Image file<input ref={fileInputRef} type="file" accept="image/jpeg,.jpg,.jpeg" onChange={(event) => setFile(event.target.files?.[0] || null)} required /></label>
      <fieldset className="momo-scope"><legend>Usage scope</legend>{[
        ["instagram", "Instagram"], ["facebook", "Facebook"], ["google_business", "Google Business Profile"],
      ].map(([value, label]) => <label className="momo-check" key={value}><input type="checkbox" checked={scope.includes(value)} onChange={(event) => setScope((current) => event.target.checked ? [...current, value] : current.filter((item) => item !== value))} /><span>{label}</span></label>)}</fieldset>
      <label>Rights expiry (optional)<input type="date" min={momoToday} value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} /></label>
      <label className="momo-check"><input type="checkbox" checked={rights} onChange={(event) => setRights(event.target.checked)} required /><span>I confirm I own this food image or have permission to provide it for the selected Veroxa usage scopes.</span></label>
      <label className="momo-check"><input type="checkbox" checked={privateAssessmentRequested} onChange={(event) => setPrivateAssessmentRequested(event.target.checked)} required /><span>Privately analyze this image now to create visual tags. This request applies only to this upload.</span></label>
      <label>Restaurant association<select value={restaurantAssociation} onChange={(event) => setRestaurantAssociation(event.target.value as VeroxaMediaRestaurantAssociation)}><option value="not_for_restaurant">Reference only — not for restaurant use</option><option value="licensed_generic_only">Licensed generic image — not a confirmed current offering</option><option value="represents_current_restaurant_offering">Current restaurant offering — owner confirmation</option></select></label>
      <p className="momo-form-note">The original stays private. Your association instruction is saved with the upload. After upload, Veroxa and Team Faraz own verification, assessment, and any exception; Momo does not need to retry or re-upload. Nothing is posted or connected.</p>
      <button className="primary-button" disabled={busy || !file || !rights || !privateAssessmentRequested || scope.length === 0 || invalidExpiry}>{busy ? "Saving your upload…" : "Upload once and let Veroxa handle it"}</button>
    </form> : <>
      <TeamPrivateAssessmentIntake
        restaurantId={restaurantId}
        busy={busy}
        run={run}
      />
      <section className="momo-panel" id="momo-media-exceptions"><div className="momo-panel-heading"><div><p className="eyebrow">EXCEPTION-ONLY QUEUE</p><h2>Media issues that need Team Faraz</h2><small>Repeated occurrences with the same canonical asset, stage, policy, and blockers appear once.</small></div><span>{openIncidents.length}</span></div>
        {openIncidents.length === 0 ? <EmptyState title="No media exception needs Team Faraz." detail="Routine verified uploads and exact duplicates continue automatically. Nothing is scheduled, posted, or connected." /> : <div className="momo-record-list">{openIncidents.map((incident) => {
          const latestEvent = data.exceptionEventsV2.find((event) =>
            event.incident_id === incident.id && event.event_kind !== "resolved" && event.source_asset_id
          );
          const sourceAssetId = latestEvent?.source_asset_id ?? null;
          const sourceExists = Boolean(sourceAssetId && data.media.some((asset) => asset.id === sourceAssetId));
          return <article key={incident.id}><div><strong>{incident.stage === "media_intake" ? "Upload verification" : incident.stage === "rights_reconciliation" ? "Rights reconciliation" : "Automatic preparation start"}</strong><p>{jsonList(incident.blockers).map(labelStatus).join(" · ") || "Verified evidence needs review."}</p><small>Canonical incident · {incident.occurrence_count} occurrence{incident.occurrence_count === 1 ? "" : "s"} consolidated · last seen {formatDate(incident.last_seen_at)}</small>{sourceAssetId && <small>Recovery source {sourceAssetId.slice(0, 8)}… · canonical identity {incident.canonical_asset_id.slice(0, 8)}…</small>}{jsonList(incident.warnings).length > 0 && <p className="momo-form-note">Warnings: {jsonList(incident.warnings).map(labelStatus).join(" · ")}</p>}</div><StatusBadge status="needs_attention" /><button type="button" className="momo-provider-action" disabled={!sourceExists} onClick={() => sourceAssetId && setRecoveryAssetId(sourceAssetId)}>{recoveryAssetId === sourceAssetId ? "Recovery controls open" : sourceExists ? "Open recovery controls" : "Recovery source unavailable"}</button></article>;
        })}</div>}
      </section>
      {recoveryAsset && <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">MANUAL RECOVERY</p><h2>Exact exception source</h2><small>Use only for this immutable source event. Canonical identity {recoveryEvent?.canonical_asset_id.slice(0, 8) || "unknown"}… remains separate from the selected upload and its permission history.</small></div><button type="button" onClick={() => setRecoveryAssetId(null)}>Close</button></div><div className="momo-media-grid"><MediaAssetCard asset={recoveryAsset} {...props} /></div></section>}
      {historyMedia.length > 0 && <details className="momo-work-history"><summary><span><strong>Media history & manual recovery</strong><small>Routine and legacy rows stay out of the daily queue. Open only for audit or controlled recovery.</small></span><b>{historyMedia.length}</b></summary><div className="momo-media-grid">{historyMedia.map((asset) => <MediaAssetCard key={asset.id} asset={asset} {...props} />)}</div></details>}
    </>}
    {role === "client" && mediaLibrary}
  </div>;
}

function TeamPrivateAssessmentIntake({
  restaurantId,
  busy,
  run,
}: Pick<PanelProps, "restaurantId" | "busy" | "run">) {
  const [file, setFile] = useState<File | null>(null);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [assessmentRequested, setAssessmentRequested] = useState(false);
  const [assessment, setAssessment] =
    useState<VeroxaPrivateMediaAssessment | null>(null);
  const [localError, setLocalError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectFile = (next: File | null) => {
    setAssessment(null);
    setLocalError("");
    if (!next) {
      setFile(null);
      return;
    }
    if (!["image/jpeg", "image/png"].includes(next.type) ||
      next.size < 10 * 1024 || next.size > 10 * 1024 * 1024) {
      setFile(null);
      setLocalError("Choose a valid JPEG or PNG from 10 KB through 10 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFile(next);
  };
  return <section className="momo-panel" aria-label="Team private food assessment">
    <div className="momo-panel-heading"><div><p className="eyebrow">PRIVATE ASSESSMENT</p><h2>Recognize and tag a food image</h2><small>JPEG or PNG · 10 KB–10 MB · private assessment only</small></div><StatusBadge status="no_external_write" /></div>
    <form className="momo-form momo-upload" onSubmit={(event) => {
      event.preventDefault();
      if (!file || !rightsConfirmed || !assessmentRequested) return;
      setLocalError("");
      void run(async () => {
        const outcome = await uploadMomoTeamPrivateMedia({
          restaurantId,
          file,
        });
        if (outcome.status === "uploaded_but_needs_attention") {
          setLocalError(
            "The private original was retained, but assessment could not finish. No provider or external write was authorized.",
          );
          throw new Error(outcome.errorCode);
        }
        if (!outcome.assessment) {
          setLocalError(
            "The private original was verified, but visual tags are not ready yet.",
          );
          throw new Error(outcome.assessmentErrorCode ||
            "private_media_assessment_unavailable");
        }
        setAssessment(outcome.assessment.assessment);
        setFile(null);
        setRightsConfirmed(false);
        setAssessmentRequested(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }, "Private food recognition and tags are ready. Nothing was posted.");
    }}>
      <label className="momo-file">Food image<input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        onChange={(event) => selectFile(event.target.files?.[0] || null)}
      /></label>
      {localError && <p className="momo-warning" role="alert">{localError}</p>}
      <label className="momo-check"><input type="checkbox" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} /><span>I own this image or have permission to submit it for this private assessment.</span></label>
      <label className="momo-check"><input type="checkbox" checked={assessmentRequested} onChange={(event) => setAssessmentRequested(event.target.checked)} /><span>Analyze the pixels now and create private confidence-aware food tags.</span></label>
      <p className="momo-form-note">Team intake is assessment-only and records development-proxy evidence. It cannot claim a current Momo offering, become Ready, schedule, or post. A real owner must separately upload or confirm eligible media for restaurant use.</p>
      <button className="primary-button" disabled={busy || !file || !rightsConfirmed || !assessmentRequested}>{busy ? "Assessing privately…" : "Upload, recognize, and tag"}</button>
    </form>
    {assessment && <section className="client-private-assessment" aria-label="Latest Team private visual assessment"><p className="eyebrow">VISIBLE EVIDENCE ONLY</p><strong>{assessment.visualSummary}</strong><div className="momo-tag-row">{assessment.tags.map((tag) => <span key={tag.slug} title={tag.uncertainty || "Directly visible"}>{tag.label} · {Math.round(tag.confidence * 100)}%</span>)}</div><small>{assessment.uncertainties.join(" ")}</small><p className="momo-form-note">“Possible” food identities are private visual hypotheses, not restaurant facts. They are never copied into public claims.</p></section>}
  </section>;
}

type MomoContentPreparationState = "idle" | "saving_review" | "queueing" | "refreshing" | "needs_refresh";

function MediaAssetCard({ asset, data, role, restaurantId, busy, run, reloadWorkspace, notify }: PanelProps & { asset: MomoMediaAsset }) {
  const intakeInstruction = (() => {
    if (!asset.intake_notes) return null;
    try {
      const value = JSON.parse(asset.intake_notes) as Record<string, unknown>;
      return value.schemaVersion === "veroxa-media-upload-instruction-v1" &&
        typeof value.requestedAssociation === "string"
        ? value.requestedAssociation
        : null;
    } catch { return null; }
  })();
  const rights = data.mediaRights.find((item) => item.asset_id === asset.id);
  const review = data.mediaReviews.find((item) => item.asset_id === asset.id && item.is_current);
  const intake = data.mediaIntake.find((item) => item.asset_id === asset.id && item.status === "verified");
  const [quality, setQuality] = useState<number | "">(review?.quality_score ?? "");
  const [notes, setNotes] = useState(review?.quality_notes || "");
  const [approved, setApproved] = useState(review?.public_use_approved || false);
  const [tag, setTag] = useState("");
  const [rightsReason, setRightsReason] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewRendered, setPreviewRendered] = useState(false);
  const [inspectionConfirmed, setInspectionConfirmed] = useState(false);
  const [reviewSaveAttempted, setReviewSaveAttempted] = useState(false);
  const [reviewExpanded, setReviewExpanded] = useState(false);
  const [reviewReferenceTime] = useState(() => Date.now());
  const [contentPreparationState, setContentPreparationState] = useState<MomoContentPreparationState>("idle");
  const [contentPreparationError, setContentPreparationError] = useState("");
  const contentPreparationMounted = useRef(true);
  const contentPreparationRequestActive = useRef(false);
  const displayedReviewExpanded = reviewExpanded;
  const pipeline = resolveMomoAssetPipeline(data, asset.id);
  const linkedTags = data.mediaAssetTags.filter((item) => item.asset_id === asset.id).map((link) => data.mediaTags.find((item) => item.id === link.tag_id)?.label).filter(Boolean);
  const approvedForReuse = mediaIsCurrentlyUsable(data, asset.id);
  const approvedForInternalReuse = mediaIsCurrentlyUsable(data, asset.id, "internal");
  const rightsCurrent = Boolean(
    rights?.rights_status === "confirmed" && rights.evidence_class === "real_owner" &&
    (!rights.valid_from || Date.parse(rights.valid_from) <= reviewReferenceTime) &&
    (!rights.expires_at || Date.parse(rights.expires_at) > reviewReferenceTime),
  );
  const verifiedBytes = Boolean(
    intake && asset.content_sha256 && intake.content_sha256 === asset.content_sha256 &&
    intake.detected_mime_type === asset.mime_type && intake.file_size === asset.file_size,
  );
  const platformReadyOriginal = Boolean(verifiedBytes && intake && momoOriginalMediaMeetsPlatformReadyProfile({
    mimeType: intake.detected_mime_type,
    fileSize: intake.file_size,
    width: intake.width,
    height: intake.height,
  }));
  const identityLink = data.mediaIdentityLinksV2.find((item) => item.asset_id === asset.id);
  const automaticContentRun = identityLink
    ? data.contentAiRuns.find((item) =>
      item.decision_mode === "automation_policy_v2" &&
      item.automation_identity_id === identityLink.identity_id
    )
    : undefined;
  const automaticProcessingLink = automaticContentRun
    ? data.mediaIdentityLinksV2.find((item) =>
      item.identity_id === automaticContentRun.automation_identity_id &&
      item.asset_id === automaticContentRun.source_asset_id
    )
    : undefined;
  const latestContentRun = data.contentAiRuns.find((item) =>
    item.decision_mode === "team_review_v1" && item.source_asset_id === asset.id
  );
  const staleContentRun = latestContentRun && momoContentAiRunNeedsRecovery(latestContentRun)
    ? latestContentRun
    : undefined;
  const materializedReadyPackage = latestContentRun?.status === "materialized"
    ? data.readyPackages.find((item) => item.content_ai_run_id === latestContentRun.id)
    : undefined;
  const replacementContentNeeded = latestContentRun?.status === "materialized" && (
    !materializedReadyPackage || !resolveMomoContentPackageReadiness(data, materializedReadyPackage.id).ready
  );
  const activeContentRun = latestContentRun && !["failed", "rejected"].includes(latestContentRun.status) &&
    !replacementContentNeeded
    ? latestContentRun
    : undefined;
  const numericQuality = quality === "" ? null : quality;
  const reviewSaveInput = {
    hasCurrentRealOwnerRights: rightsCurrent,
    verifiedBytes,
    platformReadyOriginal,
    previewRendered,
    inspectionConfirmed,
    notes,
    qualityScore: numericQuality,
    publicUseApproved: approved,
  };
  const reviewSaveBlockers = momoMediaReviewSaveBlockers(reviewSaveInput);
  const reviewCanSave = momoMediaReviewCanSave(reviewSaveInput);
  const contentPreparationBusy = ["saving_review", "queueing", "refreshing"].includes(contentPreparationState);
  const contentPreparationNeedsRefresh = contentPreparationState === "needs_refresh";
  const contentRunInFlight = [activeContentRun, staleContentRun].find((run) =>
    run && ["reserved", "provider_running", "result_staged"].includes(run.status),
  );
  const persistCurrentMediaReview = async (): Promise<string> => {
    if (numericQuality === null) throw new Error("media_quality_score_required");
    const sameCurrentReview = Boolean(
      review && review.status === (approved ? "approved" : "changes_requested") &&
      review.public_use_approved === approved && review.quality_score === numericQuality &&
      (review.quality_notes || "").trim() === notes.trim(),
    );
    const canReuseAcceptedReview = Boolean(
      latestContentRun &&
      ["reserved", "provider_running", "result_staged"].includes(latestContentRun.status),
    );
    return sameCurrentReview && (!latestContentRun || canReuseAcceptedReview)
      ? review!.id
      : reviewMomoMedia({ restaurantId, assetId: asset.id, status: approved ? "approved" : "changes_requested", qualityScore: numericQuality, qualityNotes: notes, publicUseApproved: approved });
  };
  const queueContentPackage = async (reviewId: string) => {
    if (contentPreparationMounted.current) setContentPreparationState("queueing");
    const result = await generateMomoContentPackage({
      restaurantId,
      assetId: asset.id,
      idempotencyKey: `momo-content-${reviewId}`,
    });
    notify(result.status === "queued"
      ? "Content preparation is safely queued. You can leave this page; the verified Momo package will continue in the background."
      : result.status === "provider_running"
      ? "AI preparation is running in the background. No second paid call was started."
      : result.status === "finalizing"
      ? "The AI result is saved and Veroxa is finishing its quality checks."
      : "The high-quality content package is ready for Team review. External posting remains off.");
    if (contentPreparationMounted.current) {
      setContentPreparationState("refreshing");
      await reloadWorkspace();
      if (contentPreparationMounted.current) setContentPreparationState("idle");
    }
  };
  const prepareContentPackage = async () => {
    if (busy || contentPreparationRequestActive.current || contentPreparationState !== "idle" || activeContentRun || contentRunInFlight || !reviewCanSave || !approved) return;
    contentPreparationRequestActive.current = true;
    setContentPreparationError("");
    setContentPreparationState("saving_review");
    try {
      const reviewId = await persistCurrentMediaReview();
      await queueContentPackage(reviewId);
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      const message = momoActionErrorMessage(code);
      notify(message);
      if (contentPreparationMounted.current) {
        setContentPreparationError(message);
        setContentPreparationState("needs_refresh");
      }
    } finally {
      contentPreparationRequestActive.current = false;
    }
  };
  const refreshContentPreparationStatus = async () => {
    if (contentPreparationState === "refreshing") return;
    try {
      setContentPreparationState("refreshing");
      await reloadWorkspace();
      if (contentPreparationMounted.current) {
        setContentPreparationError("");
        setContentPreparationState("idle");
      }
    } catch {
      if (contentPreparationMounted.current) {
        setContentPreparationError("The latest preparation status could not be loaded. The background job remains unchanged.");
        setContentPreparationState("needs_refresh");
      }
    }
  };
  useEffect(() => {
    contentPreparationMounted.current = true;
    return () => { contentPreparationMounted.current = false; };
  }, []);
  useEffect(() => {
    if (!reviewExpanded || !asset.storage_path || previewUrl) return;
    let active = true;
    void getMomoMediaPreviewUrl(asset.storage_path)
      .then((url) => { if (active) setPreviewUrl(url); })
      .catch(() => { if (active) setPreviewError("The private preview could not be opened. Do not approve this asset until it is visible."); });
    return () => { active = false; };
  }, [asset.storage_path, previewUrl, reviewExpanded]);
  return <article id={`momo-media-${asset.id}`} className="momo-media-card">
    <div className="momo-media-icon">{previewUrl ? (asset.mime_type.startsWith("video/") ? <video src={previewUrl} controls onLoadedData={() => setPreviewRendered(true)} onError={() => { setPreviewRendered(false); setInspectionConfirmed(false); setPreviewError("The private video could not be rendered. Do not approve this asset."); }} /> : <img className="momo-image-preview" src={previewUrl} alt={`Private preview of ${asset.display_name || asset.original_file_name || "Momo media"}`} onLoad={() => setPreviewRendered(true)} onError={() => { setPreviewRendered(false); setInspectionConfirmed(false); setPreviewError("The private image could not be rendered. Do not approve this asset."); }} />) : asset.mime_type.startsWith("video/") ? "VIDEO" : "PHOTO"}</div>
    <div className="momo-media-heading"><span><strong>{asset.display_name || asset.original_file_name || asset.storage_path.split("/").at(-1) || "Private media"}</strong><small>{Math.max(1, Math.round(asset.file_size / 1024))} KB · {formatDate(asset.created_at)}</small></span><StatusBadge status={pipeline.state} /></div>
    {intakeInstruction && <p className="momo-form-note"><strong>Momo upload instruction:</strong> {labelStatus(intakeInstruction)} · technical recovery belongs to Team Faraz.</p>}
    {pipeline.blockers[0] && <p className="momo-form-note">{pipeline.blockers[0]}</p>}
    {identityLink && <div className="momo-callout"><strong>{pipeline.state === "veroxa_ready" ? "Veroxa Ready without Team review" : pipeline.state === "preparing_content" ? "Automatic preparation is active" : "Exact-byte identity verified"}</strong><p>{identityLink.link_kind === "exact_duplicate" ? "This upload keeps its own immutable permission record while sharing an exact-byte processing identity with the canonical original." : "This is the canonical exact-byte identity. Every linked upload keeps its own immutable permission record."} {automaticContentRun && automaticProcessingLink ? `Processing uses verified upload ${automaticProcessingLink.asset_id.slice(0, 8)}… and only that upload’s rights evidence.` : "A processing source has not been selected yet."} Nothing is scheduled, posted, or externally connected.</p></div>}
    {role === "team" && intakeInstruction && <button className="momo-preview-button" disabled={busy} onClick={() => void run(() => applyMomoMediaUploadInstruction({ restaurantId, assetId: asset.id }), "Saved upload instruction applied from immutable Momo evidence. Nothing was posted or connected.")}>{busy ? "Applying…" : "Apply saved upload instruction"}</button>}
    {role === "team" && !intake && <button className="momo-preview-button" disabled={busy} onClick={() => void run(() => retryMomoMediaVerification({ restaurantId, assetId: asset.id, storagePath: asset.storage_path }), "Server byte verification completed. This image can now continue through Team-owned assessment and instruction processing.")}>{busy ? "Verifying…" : "Retry secure verification"}</button>}
    {asset.storage_path && <button className="momo-preview-button" disabled={previewBusy} onClick={() => {
      setPreviewBusy(true);
      setPreviewError("");
      setPreviewRendered(false);
      setInspectionConfirmed(false);
      void getMomoMediaPreviewUrl(asset.storage_path)
        .then(setPreviewUrl)
        .catch(() => setPreviewError("The private preview link could not be opened. The asset remains private and unchanged."))
        .finally(() => setPreviewBusy(false));
    }}>{previewBusy ? "Opening…" : previewUrl ? "Refresh private preview" : "Open private preview"}</button>}
    {previewError && <p className="momo-warning" role="alert">{previewError}</p>}
    {linkedTags.length > 0 && <div className="momo-tag-row">{linkedTags.map((item) => <span key={item}>{item}</span>)}</div>}
    {role === "team" && !identityLink && <details className="momo-media-review-controls" open={displayedReviewExpanded} onToggle={(event) => setReviewExpanded(event.currentTarget.open)}>
      <summary><span><strong>{review ? "Media review" : "Review this media"}</strong><small>{review ? `${review.quality_score ?? "No score"} · ${labelStatus(review.status)}` : "Preview, inspect, then prepare the content package"}</small></span><b>{displayedReviewExpanded ? "Hide" : "Open"}</b></summary>
      <div className="momo-review-box">
      <label>Team quality score 0–100<input type="number" min={0} max={100} value={quality} onChange={(event) => setQuality(event.target.value === "" ? "" : Number(event.target.value))} /></label>
      <label className="wide">Review notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} /></label>
      <label className="momo-check wide"><input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} /><span>Accept this exact original for the authorized Ready packages (this does not post)</span></label>
      <label className="momo-check wide"><input type="checkbox" checked={inspectionConfirmed} disabled={!previewRendered} onChange={(event) => setInspectionConfirmed(event.target.checked)} /><span>I inspected the rendered private preview for this review.</span></label>
      <button
        type="button"
        className="momo-review-save"
        disabled={busy || contentPreparationBusy || contentPreparationNeedsRefresh || Boolean(activeContentRun) || Boolean(contentRunInFlight)}
        aria-disabled={!reviewCanSave || busy || contentPreparationBusy || contentPreparationNeedsRefresh || Boolean(activeContentRun) || Boolean(contentRunInFlight)}
        aria-describedby={`momo-review-save-status-${asset.id}`}
        onClick={() => {
          if (!reviewCanSave) {
            setReviewSaveAttempted(true);
            return;
          }
          setReviewSaveAttempted(false);
          if (approved) void prepareContentPackage();
          else void run(async () => { await persistCurrentMediaReview(); }, "Media review saved with changes requested.");
        }}
      >{contentPreparationState === "saving_review" ? "Saving approved review…" : contentPreparationState === "queueing" ? "Queueing content preparation…" : contentPreparationState === "refreshing" ? "Refreshing status…" : contentPreparationNeedsRefresh ? "Refresh package status" : busy ? "Saving…" : replacementContentNeeded ? "Rebuild current content package" : approved ? "Approve media and prepare content" : "Save review"}</button>
      {contentPreparationState === "saving_review" && <div className="momo-review-save-status ready wide" role="status" aria-live="polite"><strong>Saving the exact approved media review</strong><p>The paid AI request has not started yet. Other portal actions remain available.</p></div>}
      {contentPreparationState === "queueing" && <div className="momo-review-save-status ready wide" role="status" aria-live="polite"><strong>Queueing this exact Momo package</strong><p>You can continue working or leave the portal after confirmation. Preparation runs in the background, duplicate paid calls are blocked, and external posting remains off.</p></div>}
      {contentPreparationState === "refreshing" && <div className="momo-review-save-status ready wide" role="status" aria-live="polite"><strong>Refreshing the authoritative package status…</strong></div>}
      {contentPreparationError && !contentRunInFlight && <div className="momo-review-save-status blocked emphasized wide" role="alert"><strong>Preparation needs a status refresh</strong><p>{contentPreparationError}</p><button type="button" className="momo-preview-button" disabled={busy || contentPreparationState === "refreshing"} onClick={() => void refreshContentPreparationStatus()}>Refresh package status</button></div>}
      {contentRunInFlight && !contentPreparationBusy && <div className="momo-review-save-status ready wide" role="status" aria-live="polite"><strong>{contentRunInFlight.status === "result_staged" ? "Quality checks are finishing" : contentRunInFlight.status === "provider_running" ? "AI content is being prepared" : "Content preparation is queued"}</strong><p>{contentRunInFlight.status === "result_staged" ? "The exact AI result and cost record are safely stored while Veroxa finishes the Team-review transition." : contentRunInFlight.status === "provider_running" ? "The verified image is with the AI quality pipeline. You can leave this page while it continues." : "The exact image, rights, facts, and budget are reserved for the background worker."} Duplicate paid calls are blocked and external posting remains off.</p><button type="button" className="momo-preview-button" disabled={busy || contentPreparationBusy} onClick={() => void refreshContentPreparationStatus()}>{contentPreparationState === "refreshing" ? "Refreshing…" : "Refresh status"}</button></div>}
      {activeContentRun && !contentRunInFlight && <p className="momo-form-note wide">Content preparation already exists for this accepted image: {labelStatus(activeContentRun.status)}. Open Content when it needs Team review; external posting remains off.</p>}
      {staleContentRun && <p className="momo-warning wide">This preparation is taking longer than normal. Signed background recovery is continuing against the same stored request; Veroxa will not start a second AI call. Refresh only updates what you see here, and external posting remains off.</p>}
      {replacementContentNeeded && <p className="momo-warning wide">The previous immutable plan is no longer Ready. Reinspect this image to create a new reviewed package and future Chicago plan; the old audit record remains unchanged.</p>}
      {reviewCanSave && contentPreparationState === "idle" && !activeContentRun && <div id={`momo-review-save-status-${asset.id}`} className="momo-review-save-status ready wide" role="status" aria-live="polite"><strong>Ready to save</strong></div>}
      {!reviewCanSave && reviewSaveAttempted && <div id={`momo-review-save-status-${asset.id}`} className="momo-review-save-status blocked emphasized wide" role="status" aria-live="polite"><strong>Complete these before saving</strong><ul>{reviewSaveBlockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul></div>}
      {!reviewCanSave && !reviewSaveAttempted && <p id={`momo-review-save-status-${asset.id}`} className="momo-form-note wide">Open the private preview, inspect it, and add useful notes before saving.</p>}
      <details className="team-inline-advanced wide"><summary>More media controls</summary><div>
        <div className="momo-tag-input"><input placeholder="Add an internal media tag" value={tag} onChange={(event) => setTag(event.target.value)} /><button disabled={busy || !tag.trim()} onClick={() => void run(() => addMomoMediaTag({ restaurantId, assetId: asset.id, label: tag }), "Media tag added.")}>Add tag</button></div>
        <p className="momo-form-note">Tags are internal organization aids. Public hashtags are generated and validated separately.</p>
        <button className="momo-provider-action" disabled={busy || !approvedForInternalReuse} onClick={() => void run(() => recordMomoMediaReuse({ restaurantId, assetId: asset.id, platform: "internal", usageKind: "internal_reference" }), "Approved media reuse recorded in the audit trail.")}>Record approved internal reuse</button>
        {approvedForReuse && !approvedForInternalReuse && <p className="momo-form-note">Internal reuse was not included in the owner-approved usage.</p>}
      </div></details>
      </div>
    </details>}
    {role === "client" && rights?.id && rights.rights_status !== "revoked" && <div className="momo-review-box"><label className="wide">Reason to stop future use<textarea value={rightsReason} onChange={(event) => setRightsReason(event.target.value)} rows={2} placeholder="Tell Veroxa why these rights should be revoked" /></label><button className="momo-provider-action" disabled={busy || rightsReason.trim().length < 10} onClick={() => void run(() => revokeMomoMediaRights({ restaurantId, mediaRightsId: rights.id, reason: rightsReason }), "Media rights revoked immediately. New reuse and publication are blocked.")}>Revoke future media use</button><p className="momo-form-note wide">Revocation takes effect immediately and is recorded in the audit trail. It does not delete historical usage records.</p></div>}
    {!rights && role === "client" && <p className="momo-warning">This asset cannot be approved or reused because its rights record is missing.</p>}
  </article>;
}

type ContentWorkspaceSection = "attention" | "ready";

const suggestedMomoSchedule = (window: string, index: number): string => {
  const target = new Date(Date.now() + (24 + index * 2) * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(target);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || "";
  const hour = window === "lunch" ? "11:30" : window === "afternoon" ? "15:00" : window === "dinner" ? "18:30" : "12:00";
  return `${part("year")}-${part("month")}-${part("day")}T${hour}`;
};

function ContentPackageReviewCard({ packageRun, ...props }: PanelProps & { packageRun: MomoContentAiRun }) {
  const { busy, restaurantId, run } = props;
  const output = packageRun.output_payload;
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [mediaRendered, setMediaRendered] = useState(false);
  const [mediaInspected, setMediaInspected] = useState(false);
  const [packageInspected, setPackageInspected] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [scheduleReferenceTime, setScheduleReferenceTime] = useState(() => Date.now());
  const [schedules, setSchedules] = useState<Record<string, string>>(() => Object.fromEntries(
    (output?.variants || []).map((variant, index) => [variant.platform, suggestedMomoSchedule(variant.scheduleWindow, index)]),
  ));
  useEffect(() => () => {
    if (mediaUrl.startsWith("blob:")) URL.revokeObjectURL(mediaUrl);
  }, [mediaUrl]);
  useEffect(() => {
    const timer = window.setInterval(() => setScheduleReferenceTime(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  if (!output) return <article className="momo-content-card"><p className="momo-warning">This package has no verified output and cannot be reviewed.</p></article>;
  const hashtags = new Map(output.hashtags.map((item) => [item.id, item.tag]));
  const seo = new Map(output.seoPhrases.map((item) => [item.id, item.phrase]));
  const mediaQualityPassed = output.assetAssessment.qualityScore >= 4 &&
    output.assetAssessment.qualityIssues.length === 1 && output.assetAssessment.qualityIssues[0] === "none";
  const invalidSchedulePlatforms = output.variants.filter((variant) =>
    !momoChicagoScheduleIsFuture(schedules[variant.platform] || "", scheduleReferenceTime),
  );
  const scheduleReady = invalidSchedulePlatforms.length === 0;
  const earliestChicagoSchedule = momoChicagoLocalMinute(new Date(scheduleReferenceTime + 60_000));
  return <article className="momo-content-card momo-content-package-review">
    <div className="momo-panel-heading"><div><p className="eyebrow">TEAM PACKAGE REVIEW</p><strong>{output.direction.pillar}</strong><small>{output.direction.angle}</small></div><StatusBadge status="team_review" /></div>
    <p>{output.assetAssessment.visualSummary}</p>
    <div className="momo-review-box">
      <button type="button" className="momo-preview-button" disabled={mediaBusy} onClick={() => {
        setMediaBusy(true);
        setMediaError("");
        setMediaRendered(false);
        setMediaInspected(false);
        void getMomoVerifiedMediaPreviewObjectUrl({
          storagePath: packageRun.source_storage_path,
          contentSha256: packageRun.source_content_sha256,
          fileSize: packageRun.source_file_size,
          mimeType: packageRun.source_mime_type,
        })
          .then(setMediaUrl)
          .catch(() => setMediaError("The exact private final image could not be opened. This package cannot become Ready."))
          .finally(() => setMediaBusy(false));
      }}>{mediaBusy ? "Opening…" : mediaUrl ? "Refresh exact final image" : "Open exact final image"}</button>
      {mediaUrl && <img className="momo-image-preview" src={mediaUrl} alt="Exact private Momo image bound to this content package" onLoad={(event) => {
        const exactDimensions = event.currentTarget.naturalWidth === packageRun.source_width && event.currentTarget.naturalHeight === packageRun.source_height;
        setMediaRendered(exactDimensions);
        if (!exactDimensions) {
          setMediaInspected(false);
          setMediaError("The rendered dimensions do not match the immutable media record. This package cannot become Ready.");
        }
      }} onError={() => { setMediaRendered(false); setMediaInspected(false); setMediaError("The exact private final image did not render. This package cannot become Ready."); }} />}
      {mediaError && <p className="momo-warning" role="alert">{mediaError}</p>}
      <label className="momo-check wide"><input type="checkbox" disabled={!mediaRendered} checked={mediaInspected} onChange={(event) => setMediaInspected(event.target.checked)} /><span>I inspected this exact rendered image and confirm it is the final media for every listed platform.</span></label>
      <p className="momo-form-note wide">Immutable source {packageRun.source_content_sha256.slice(0, 12)}… · {packageRun.source_width} × {packageRun.source_height} · {Math.round(packageRun.source_file_size / 1024)} KB</p>
    </div>
    <div className="momo-facts"><span>Media quality<strong>{output.assetAssessment.qualityScore}/5</strong></span><span>Objective<strong>{labelStatus(output.direction.objective)}</strong></span><span>Platforms<strong>{output.variants.length}</strong></span></div>
    {mediaQualityPassed
      ? <div className="momo-callout"><strong>Quality gate passed</strong><p>Clear media · factual grounding · accessibility · local discoverability · platform rules</p></div>
      : <div className="momo-warning" role="alert"><strong>Media quality blocks Ready</strong><p>{output.assetAssessment.qualityIssues.map(labelStatus).join(" · ")} · score {output.assetAssessment.qualityScore}/5</p></div>}
    <details><summary><strong>Master direction and accessibility</strong></summary><div className="momo-review-box"><p className="momo-caption">{output.masterCaption}</p><p><strong>Alt text:</strong> {output.altText}</p><div className="momo-tag-row">{output.seoPhrases.map((item) => <span key={item.id}>{item.phrase}</span>)}</div></div></details>
    <div className="momo-content-list">{output.variants.map((variant) => <details key={variant.platform} open={variant.platform === "instagram"}>
      <summary><span><strong>{labelStatus(variant.platform)}</strong><small>{labelStatus(variant.scheduleWindow)} recommendation</small></span></summary>
      <div className="momo-review-box">
        <p className="momo-caption">{variant.caption}</p>
        {variant.hashtagIds.length > 0 && <div><strong>Hashtags</strong><div className="momo-tag-row">{variant.hashtagIds.map((id) => <span key={id}>{hashtags.get(id)}</span>)}</div></div>}
        <div><strong>Local SEO</strong><div className="momo-tag-row">{variant.seoPhraseIds.map((id) => <span key={id}>{seo.get(id)}</span>)}</div></div>
        <p><strong>Alt text:</strong> {output.altText}</p>
        <p><strong>Call to action:</strong> {variant.cta.text || "No CTA needed for this post."}</p>
        <label>Planned time · America/Chicago<input type="datetime-local" min={earliestChicagoSchedule} aria-invalid={!momoChicagoScheduleIsFuture(schedules[variant.platform] || "", scheduleReferenceTime)} value={schedules[variant.platform] || ""} onChange={(event) => {
          setSchedules((current) => ({ ...current, [variant.platform]: event.target.value }));
          setScheduleReferenceTime(Date.now());
          setPackageInspected(false);
        }} /></label>
      </div>
    </details>)}</div>
    {output.uncertainties.length > 0 && <div className="momo-warning"><strong>Review notes from AI</strong>{output.uncertainties.map((item) => <p key={`${item.field}:${item.reason}`}>{item.reason}</p>)}</div>}
    {!scheduleReady && <p className="momo-warning" role="alert">Choose a future America/Chicago time for {invalidSchedulePlatforms.map((variant) => labelStatus(variant.platform)).join(", ")} before approval.</p>}
    <label className="momo-check wide"><input type="checkbox" checked={packageInspected} onChange={(event) => setPackageInspected(event.target.checked)} /><span>I reviewed the factual claims, every platform caption, SEO phrases, hashtags, alt text, calls to action, and future Chicago timing shown above.</span></label>
    <div className="momo-decision"><button className="primary-button" disabled={busy || !mediaQualityPassed || !scheduleReady || !mediaRendered || !mediaInspected || !packageInspected} onClick={() => void run(async () => {
      const submissionTime = Date.now();
      setScheduleReferenceTime(submissionTime);
      if (!output.variants.every((variant) => momoChicagoScheduleIsFuture(schedules[variant.platform] || "", submissionTime))) {
        throw new Error("content_schedule_must_be_future");
      }
      await approveMomoContentPackage({ restaurantId, runId: packageRun.id, schedules: schedules as Record<"facebook" | "instagram" | "google_business", string>, inspectionAttestation: packageInspected });
    }, "Package approved and saved as Ready to post. External posting remains off.")}>{busy ? "Saving…" : "Approve exact package and save plan"}</button></div>
    {(!mediaRendered || !mediaInspected) && <p className="momo-form-note">Open, render, and inspect the exact final image before approval.</p>}
    <details className="team-inline-advanced"><summary>Reject this package</summary><div className="momo-review-box"><label>Why it should not become Ready<textarea rows={3} value={revisionNotes} onChange={(event) => setRevisionNotes(event.target.value)} /></label><button disabled={busy || revisionNotes.trim().length < 10} onClick={() => void run(() => requestMomoContentPackageRevision({ runId: packageRun.id, notes: revisionNotes }), "Package rejected and kept out of Ready.")}>Reject package</button></div></details>
    <details className="team-inline-advanced"><summary>Audit details</summary><p className="momo-form-note">Model {packageRun.model} · prompt {packageRun.prompt_version} · immutable output {packageRun.output_sha256?.slice(0, 12)}… · external writes disabled</p></details>
  </article>;
}

function ReadyContentPackageCard({
  readyPackage,
  variants,
  reloadWorkspace,
}: {
  readyPackage: MomoReadyPackage;
  variants: MomoWorkspaceData["readyPackageVariants"];
  reloadWorkspace: () => Promise<void>;
}) {
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [copyState, setCopyState] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  useEffect(() => () => {
    if (mediaUrl.startsWith("blob:")) URL.revokeObjectURL(mediaUrl);
  }, [mediaUrl]);
  const runFreshReadyAction = async (action: () => Promise<void> | void) => {
    if (actionBusy) return;
    setActionBusy(true);
    setActionError("");
    try {
      if (await getMomoReadyPackageStatus(readyPackage.id) !== "ready_to_post") {
        setActionError("This plan is no longer Ready. Its current evidence or timing must be rebuilt before use.");
        await reloadWorkspace();
        return;
      }
      await action();
    } catch {
      setActionError("Current Ready status could not be verified. Copy and download remain blocked.");
    } finally {
      setActionBusy(false);
    }
  };
  return <article className="momo-content-card">
    <div className="momo-panel-heading"><div><strong>{readyPackage.approved_payload.direction.pillar}</strong><small>{readyPackage.approved_payload.direction.angle}</small></div><StatusBadge status="ready_to_post" /></div>
    <button type="button" className="momo-preview-button" disabled={mediaBusy} onClick={() => {
      setMediaBusy(true);
      setMediaError("");
      void getMomoVerifiedMediaPreviewObjectUrl({
        storagePath: readyPackage.source_storage_path,
        contentSha256: readyPackage.source_content_sha256,
        fileSize: readyPackage.source_file_size,
        mimeType: readyPackage.source_mime_type,
      }).then(setMediaUrl).catch(() => setMediaError("The exact final image is no longer verifiable. Ready is blocked.")).finally(() => setMediaBusy(false));
    }}>{mediaBusy ? "Verifying…" : mediaUrl ? "Reverify final image" : "Verify final image"}</button>
    {mediaUrl && <><img className="momo-image-preview" src={mediaUrl} alt={readyPackage.approved_payload.altText} /><button type="button" className="secondary-button" disabled={actionBusy} onClick={() => void runFreshReadyAction(() => {
      const link = document.createElement("a");
      link.href = mediaUrl;
      link.download = `momo-ready-${readyPackage.id}.jpg`;
      link.click();
    })}>{actionBusy ? "Rechecking…" : "Download exact JPG"}</button></>}
    {mediaError && <p className="momo-warning" role="alert">{mediaError}</p>}
    {actionError && <p className="momo-warning" role="alert">{actionError}</p>}
    <p className="momo-caption">{readyPackage.approved_payload.masterCaption}</p>
    <div className="momo-content-list">{variants.map((variant) => <details key={variant.id} open={variant.platform === "instagram"}>
      <summary><span><strong>{labelStatus(variant.platform)}</strong><small>{formatZonedDate(variant.scheduled_for, variant.timezone)}</small></span></summary>
      <div className="momo-review-box">
        <p className="momo-caption">{variant.caption}</p>
        {variant.hashtags.length > 0 && <div><strong>Hashtags</strong><div className="momo-tag-row">{variant.hashtags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>}
        <div><strong>Local SEO applied</strong><div className="momo-tag-row">{variant.seo_phrases.map((phrase) => <span key={phrase}>{phrase}</span>)}</div></div>
        <p><strong>Alt text:</strong> {variant.alt_text}</p>
        <p><strong>Call to action:</strong> {variant.call_to_action.text || "No CTA for this post."}</p>
        <button type="button" className="momo-provider-action" disabled={actionBusy} onClick={() => void runFreshReadyAction(async () => {
          const postText = [variant.caption, variant.call_to_action.text, variant.hashtags.join(" ")].filter(Boolean).join("\n\n");
          try {
            await navigator.clipboard.writeText(postText);
            setCopyState(`${variant.platform}:copied`);
          } catch {
            setCopyState(`${variant.platform}:failed`);
          }
        })}>{actionBusy ? "Rechecking…" : copyState === `${variant.platform}:copied` ? "Copied" : "Copy post text"}</button>
        {copyState === `${variant.platform}:failed` && <p className="momo-warning" role="alert">Copy was blocked by this browser. Select the text manually.</p>}
      </div>
    </details>)}</div>
    <p className="momo-form-note">Ready for manual posting with one immutable, verified image. No provider queue or external post exists.</p>
  </article>;
}

function VeroxaReadyPackageCard({
  readyPackage,
  variants,
  packageRun,
  reviewStatus,
  role,
  busy,
  run,
  reloadWorkspace,
}: {
  readyPackage: MomoWorkspaceData["veroxaReadyPackagesV2"][number];
  variants: MomoWorkspaceData["veroxaReadyVariantsV2"];
  packageRun: MomoContentAiRun | undefined;
  reviewStatus: MomoReadyReviewStatusV2 | undefined;
  role: VeroxaRole;
  busy: boolean;
  run: PanelProps["run"];
  reloadWorkspace: PanelProps["reloadWorkspace"];
}) {
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [mediaRendered, setMediaRendered] = useState(false);
  const [reviewConfirmedSnapshotSha256, setReviewConfirmedSnapshotSha256] =
    useState<string | null>(null);
  const [discardReason, setDiscardReason] = useState("");
  const [copyState, setCopyState] = useState("");
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState("");
  useEffect(() => () => {
    if (mediaUrl.startsWith("blob:")) URL.revokeObjectURL(mediaUrl);
  }, [mediaUrl]);
  const reviewConfirmed = Boolean(reviewStatus &&
    reviewConfirmedSnapshotSha256 ===
      reviewStatus.current_review_snapshot_sha256);
  const manualExportAllowed = role === "team" &&
    momoReadyReviewAllowsManualExport(reviewStatus);
  const canApprove = role === "team" && momoReadyReviewCanApprove(reviewStatus);
  const canDiscard = role === "team" && momoReadyReviewCanDiscard(reviewStatus);
  const usesCurrentRecognitionContract =
    packageRun?.prompt_version === MOMO_CONTENT_AI_PROMPT_VERSION &&
    packageRun.validator_version === MOMO_CONTENT_AI_VALIDATOR_VERSION;
  const reviewState = reviewStatus?.review_state ?? "blocked";
  const reviewBlockers = reviewStatus?.blocker_codes ?? ["review_status_unavailable"];
  const runFreshManualExportAction = async (
    action: () => Promise<void> | void,
  ) => {
    if (exportBusy || !reviewStatus) return;
    setExportBusy(true);
    setExportError("");
    try {
      const fresh = await getMomoReadyReviewStatusV2({
        restaurantId: readyPackage.restaurant_id,
        readyPackageId: readyPackage.id,
      });
      if (!momoReadyReviewAllowsManualExport(fresh) ||
        fresh.current_review_snapshot_sha256 !==
          reviewStatus.current_review_snapshot_sha256) {
        setExportError("The exact current approval changed or is no longer valid. Copy and download remain blocked.");
        await reloadWorkspace();
        return;
      }
      await action();
    } catch {
      setExportError("Current Team approval could not be verified. Copy and download remain blocked.");
      await reloadWorkspace().catch(() => undefined);
    } finally {
      setExportBusy(false);
    }
  };
  const decide = (
    decision: "approved_for_manual_export" | "discarded",
  ) => run(async () => {
    const decisionAllowed = decision === "approved_for_manual_export"
      ? momoReadyReviewCanApprove(reviewStatus) && reviewConfirmed
      : momoReadyReviewCanDiscard(reviewStatus);
    if (!reviewStatus || !decisionAllowed) {
      throw new Error("ready_review_input_invalid");
    }
    const result = await decideMomoReadyPackageV2({
      readyPackageId: readyPackage.id,
      decision,
      expectedReviewSnapshotSha256: reviewStatus.current_review_snapshot_sha256,
      reason: decision === "discarded" ? discardReason : null,
    });
    if (result.review_state === "blocked") {
      await reloadWorkspace();
      throw new Error("ready_review_replay_blocked");
    }
  }, decision === "approved_for_manual_export"
    ? "Exact current package approved for manual export. Only manual copy and download are unlocked; external posting remains disabled."
    : "Exact source media discarded from future content and Veroxa Ready. All same-byte duplicates for this restaurant are excluded; immutable bytes and evidence remain retained.");
  return <article className="momo-content-card">
    <div className="momo-panel-heading"><div><strong>{readyPackage.output_payload.direction.pillar}</strong><small>{readyPackage.output_payload.direction.angle}</small></div><StatusBadge status={reviewState} /></div>
    <div className="momo-callout"><strong>Unscheduled by design</strong><p>This immutable package has verified media, claims, captions, SEO phrases, hashtags, and alt text. It has no posting time, provider connection, or external write. Manual copy and download stay locked until Team approves this exact current review snapshot.</p></div>
    {reviewState === "awaiting_team_review" && <div className="momo-callout"><strong>Team review required</strong><p>Open and inspect the exact image, visual assessment, tags, and public copy. Approval unlocks only manual copy and download; it never schedules or posts.</p></div>}
    {manualExportAllowed && <div className="momo-callout"><strong>Approved for manual export</strong><p>This exact current snapshot may be copied or downloaded manually. Scheduling, provider posting, and every external write remain disabled.</p></div>}
    {reviewState === "discarded" && <div className="momo-warning"><strong>Source media discarded from future content and Veroxa Ready</strong><p>{reviewStatus?.decision_reason}</p><p>Every upload and asset record for this restaurant with the same exact-byte SHA-256 hash is permanently excluded from future preparation and Ready. The immutable original bytes, package, rights evidence, and decision history remain retained. Nothing was posted.</p></div>}
    {reviewState === "blocked" && <div className="momo-warning" role="alert"><strong>Manual export blocked</strong><p>{reviewBlockers.map(labelStatus).join(" · ") || "Current approval could not be verified."}</p></div>}
    <button type="button" className="momo-preview-button" disabled={mediaBusy} onClick={() => {
      setMediaBusy(true);
      setMediaError("");
      setMediaRendered(false);
      setReviewConfirmedSnapshotSha256(null);
      void getMomoVerifiedMediaPreviewObjectUrl({
        storagePath: readyPackage.source_storage_path,
        contentSha256: readyPackage.source_content_sha256,
        fileSize: readyPackage.source_file_size,
        mimeType: readyPackage.source_mime_type,
      }).then(setMediaUrl).catch(() => setMediaError("The exact private image could not be reverified. The package remains stored, unscheduled, and unposted.")).finally(() => setMediaBusy(false));
    }}>{mediaBusy ? "Verifying…" : mediaUrl ? "Reverify exact image" : "Verify exact image"}</button>
    {mediaUrl && <><img className="momo-image-preview" src={mediaUrl} alt={readyPackage.output_payload.altText} onLoad={() => setMediaRendered(true)} onError={() => {
      setMediaRendered(false);
      setReviewConfirmedSnapshotSha256(null);
      setMediaError("The exact private image did not render. Approval and manual export remain blocked.");
    }} />{manualExportAllowed && <button type="button" className="secondary-button" disabled={exportBusy} onClick={() => void runFreshManualExportAction(() => {
      const link = document.createElement("a");
      link.href = mediaUrl;
      link.download = `momo-veroxa-ready-${readyPackage.id}.jpg`;
      link.click();
    })}>{exportBusy ? "Rechecking approval…" : "Download verified JPG"}</button>}</>}
    {mediaError && <p className="momo-warning" role="alert">{mediaError}</p>}
    {exportError && <p className="momo-warning" role="alert">{exportError}</p>}
    {role === "team" && <section className="momo-review-box" aria-label="Media visual assessment"><strong>{usesCurrentRecognitionContract ? "Food visual assessment" : "Legacy visual assessment"}</strong><p>{readyPackage.output_payload.assetAssessment.visualSummary}</p><small>Subject: {labelStatus(readyPackage.output_payload.assetAssessment.subject)} · quality {readyPackage.output_payload.assetAssessment.qualityScore}/5 · {readyPackage.output_payload.assetAssessment.qualityIssues.map(labelStatus).join(" · ")}</small>{usesCurrentRecognitionContract ? <><div><strong>Generic visual tags</strong><div className="momo-tag-row">{readyPackage.output_payload.internalMediaTags.map((tag) => <span key={tag.slug}>{tag.label} · {Math.round(tag.confidence * 100)}%</span>)}</div></div><p className="momo-form-note">These tags describe visible presentation only. They do not identify a dish, cuisine, brand, or ingredient; public business facts remain grounded in owner-confirmed truth.</p></> : <p className="momo-warning" role="status">This legacy package predates the generic-food recognition contract. Its subject is shown as recorded, but legacy tags are hidden; regenerate it under the current contract before approval.</p>}</section>}
    <p className="momo-caption">{readyPackage.output_payload.masterCaption}</p>
    <div className="momo-content-list">{variants.map((variant) => <details key={variant.id} open={variant.platform === "instagram"}>
      <summary><span><strong>{labelStatus(variant.platform)}</strong><small>No schedule · no posting</small></span></summary>
      <div className="momo-review-box">
        <p className="momo-caption">{variant.caption}</p>
        {variant.hashtags.length > 0 && <div><strong>Validated hashtags</strong><div className="momo-tag-row">{variant.hashtags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>}
        <div><strong>Validated local SEO</strong><div className="momo-tag-row">{variant.seo_phrases.map((phrase) => <span key={phrase}>{phrase}</span>)}</div></div>
        <p><strong>Alt text:</strong> {variant.alt_text}</p>
        <p><strong>Call to action:</strong> {variant.call_to_action.text || "No call to action."}</p>
        <small>{variant.claim_ids.length} validated claim reference{variant.claim_ids.length === 1 ? "" : "s"} · external writes disabled</small>
        {manualExportAllowed && <button type="button" className="momo-provider-action" disabled={exportBusy} onClick={() => void runFreshManualExportAction(async () => {
          const copy = [variant.caption, variant.call_to_action.text, variant.hashtags.join(" ")].filter(Boolean).join("\n\n");
          try {
            await navigator.clipboard.writeText(copy);
            setCopyState(`${variant.platform}:copied`);
          } catch {
            setCopyState(`${variant.platform}:failed`);
          }
        })}>{exportBusy ? "Rechecking approval…" : copyState === `${variant.platform}:copied` ? "Copied manual draft" : "Copy for manual export"}</button>}
        {copyState === `${variant.platform}:failed` && <p className="momo-warning" role="alert">Copy was blocked by this browser. The package remains unchanged and unposted.</p>}
      </div>
    </details>)}</div>
    {(canApprove || canDiscard) && <section className="momo-review-box">{canApprove && <><label className="momo-check wide"><input type="checkbox" checked={reviewConfirmed} onChange={(event) => setReviewConfirmedSnapshotSha256(event.target.checked ? reviewStatus?.current_review_snapshot_sha256 ?? null : null)} disabled={!mediaRendered} /><span>{MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION}</span></label><div className="momo-decision"><button type="button" className="primary-button" disabled={busy || !mediaRendered || !reviewConfirmed} onClick={() => void decide("approved_for_manual_export")}>{busy ? "Saving…" : "Approve for manual export"}</button></div></>}{canDiscard && <details className="team-inline-advanced"><summary>Discard this source media</summary><div className="momo-review-box"><label>Reason retained in decision history<textarea rows={3} minLength={4} maxLength={500} value={discardReason} onChange={(event) => setDiscardReason(event.target.value)} /></label><button type="button" disabled={busy || discardReason.trim().length < 4 || discardReason.trim().length > 500} onClick={() => void decide("discarded")}>Discard source from future Ready</button><p className="momo-form-note">Discard is terminal for these exact image bytes across every same-byte upload and asset record for this restaurant. Future content and Veroxa Ready are blocked, while immutable bytes, the package, rights evidence, and audit history remain retained.</p></div></details>}</section>}
    {!manualExportAllowed && reviewState !== "discarded" && <p className="momo-form-note">Manual copy and download are unavailable until the exact current Team approval is verified.</p>}
    <details className="team-inline-advanced"><summary>Immutable audit evidence</summary><p className="momo-form-note">Canonical identity {readyPackage.canonical_asset_id.slice(0, 8)}… · selected processing upload {readyPackage.source_asset_id.slice(0, 8)}… · rights record {readyPackage.rights_id.slice(0, 8)}… · intake verification {readyPackage.intake_verification_id.slice(0, 8)}…</p><p className="momo-form-note">Policy {readyPackage.policy_version} · output {readyPackage.output_sha256.slice(0, 12)}… · validation {readyPackage.validation_sha256.slice(0, 12)}… · ready {formatDate(readyPackage.ready_at)} · {packageRun?.automation_retry_generation === 1 ? `bounded zero-provider recovery of run ${packageRun.automation_retry_of_run_id?.slice(0, 8)}…` : "initial generation"} · no schedule · no external write</p></details>
  </article>;
}

function ContentPanel(props: PanelProps & { onNavigate: (view: string) => void }) {
  const { data, role, onNavigate } = props;
  const [activeSection, setActiveSection] = useState<ContentWorkspaceSection>("attention");
  const openIncidents = data.exceptionIncidentsV2.filter((item) => item.status === "open" && ["content_processing", "content_validation"].includes(item.stage));
  const legacyReviewRuns = data.contentAiRuns.filter((item) => item.decision_mode === "team_review_v1" && item.status === "pending_review" && item.output_payload);
  const legacyFailedRuns = data.contentAiRuns.filter((item) => item.status === "failed");
  const packageStates = data.readyPackages
    .map((item) => ({ item, readiness: resolveMomoContentPackageReadiness(data, item.id) }))
    .sort((left, right) => Date.parse(right.item.ready_at) - Date.parse(left.item.ready_at));
  const latestPackageByAsset = new Map<string, string>();
  for (const entry of packageStates) {
    if (!latestPackageByAsset.has(entry.item.source_asset_id)) latestPackageByAsset.set(entry.item.source_asset_id, entry.item.id);
  }
  const legacyReadyPackages = packageStates.filter((entry) => entry.readiness.ready);
  const legacyBlockedReadyPackages = packageStates.filter((entry) =>
    !entry.readiness.ready && latestPackageByAsset.get(entry.item.source_asset_id) === entry.item.id,
  );
  const latestAutomationRunByIdentity = new Map<string, string>();
  for (const run of data.contentAiRuns) {
    if (run.decision_mode === "automation_policy_v2" && run.automation_identity_id &&
      !latestAutomationRunByIdentity.has(run.automation_identity_id)) {
      latestAutomationRunByIdentity.set(run.automation_identity_id, run.id);
    }
  }
  const veroxaReadyPackages = data.veroxaReadyPackagesV2.filter((item) =>
    latestAutomationRunByIdentity.get(item.identity_id) === item.content_ai_run_id
  );
  const veroxaReadyPackageIds = new Set(
    veroxaReadyPackages.map((item) => item.id),
  );
  const pendingReadyReviews = data.readyReviewStatusesV2.filter((status) =>
    veroxaReadyPackageIds.has(status.ready_package_id) &&
      (momoReadyReviewCanApprove(status) ||
        (status.terminal_decision === null &&
          momoReadyReviewCanDiscard(status)))
  );
  const legacyHistoryCount = legacyReviewRuns.length + legacyFailedRuns.length + packageStates.length + data.contentItems.length;
  const attentionCount = role === "team"
    ? openIncidents.length + pendingReadyReviews.length
    : data.pendingContentConfirmations.length;
  return <div className="view">
    <MomoIntro eyebrow="MOMO’S HOUSE" title="Content" description="Team Faraz handles consolidated exceptions only. Validated packages become Veroxa Ready without a schedule, post, or external connection." />
    <SafetyBoundary role={role} />
    <div className="momo-content-tabs" role="tablist" aria-label="Content package sections">
      <button type="button" id="content-tab-attention" role="tab" aria-selected={activeSection === "attention"} aria-controls="content-panel-attention" className={activeSection === "attention" ? "active" : ""} onClick={() => setActiveSection("attention")}><span>Needs attention</span><b>{attentionCount}</b></button>
      <button type="button" id="content-tab-ready" role="tab" aria-selected={activeSection === "ready"} aria-controls="content-panel-ready" className={activeSection === "ready" ? "active" : ""} onClick={() => setActiveSection("ready")}><span>Veroxa Ready</span><b>{veroxaReadyPackages.length}</b></button>
    </div>
    <div id="content-panel-attention" className="momo-content-tabpanel" role="tabpanel" aria-labelledby="content-tab-attention" hidden={activeSection !== "attention"}>
      {role === "team" && <><section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">EXCEPTION-ONLY QUEUE</p><h2>Content issues that need Team Faraz</h2><small>Routine processing and legacy pending-review rows stay out of this exception queue.</small></div><span>{openIncidents.length}</span></div>{openIncidents.length === 0 ? <EmptyState title="No content exception needs Team Faraz." detail="Automatic preparation may continue in the background. Nothing is scheduled, posted, or connected." /> : <div className="momo-record-list">{openIncidents.map((incident) => <article key={incident.id}><div><strong>{incident.stage === "content_processing" ? "Content processing needs recovery" : "Content validation needs review"}</strong><p>{jsonList(incident.blockers).map(labelStatus).join(" · ") || "Verified evidence needs review."}</p><small>Canonical incident · {incident.occurrence_count} occurrence{incident.occurrence_count === 1 ? "" : "s"} consolidated · last seen {formatDate(incident.last_seen_at)}</small>{jsonList(incident.warnings).length > 0 && <p className="momo-form-note">Warnings: {jsonList(incident.warnings).map(labelStatus).join(" · ")}</p>}</div><StatusBadge status="needs_attention" /><button type="button" className="momo-provider-action" onClick={() => onNavigate("team-media")}>Open media exception recovery</button></article>)}</div>}</section>{pendingReadyReviews.length > 0 && <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">READY REVIEW QUEUE</p><h2>Packages waiting for a Team decision</h2><small>These packages are Ready inside Veroxa, but manual copy and download remain locked.</small></div><span>{pendingReadyReviews.length}</span></div><button type="button" className="primary-button" onClick={() => setActiveSection("ready")}>Review exact Ready packages</button></section>}</>}
      {role === "client" && <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">YOUR DECISIONS</p><h2>Content confirmations</h2></div><span>{data.pendingContentConfirmations.length}</span></div>{data.pendingContentConfirmations.length === 0 ? <EmptyState title="Nothing needs your decision." detail="Team Faraz will show only a content direction that specifically needs owner confirmation." /> : <div className="momo-content-list">{data.pendingContentConfirmations.map((item) => <PendingContentConfirmationCard key={item.content_item_id} item={item} {...props} />)}</div>}</section>}
    </div>
    <div id="content-panel-ready" className="momo-content-tabpanel" role="tabpanel" aria-labelledby="content-tab-ready" hidden={activeSection !== "ready"}>
      <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">VEROXA READY · UNSCHEDULED</p><h2>Validated Momo packages</h2><small>Ready means evidence-complete inside Veroxa. It never means scheduled, approved to publish, posted, or externally connected.</small></div><span>{veroxaReadyPackages.length}</span></div>
        {veroxaReadyPackages.length === 0 ? <EmptyState title="Nothing is Veroxa Ready yet." detail="Only an exact package with verified media, owner truth, rights, claim validation, captions, SEO, hashtags, and alt text can appear here. Scheduling and posting remain outside this workflow." /> : <div className="momo-content-list">{veroxaReadyPackages.map((item) => <VeroxaReadyPackageCard key={item.id} readyPackage={item} variants={data.veroxaReadyVariantsV2.filter((variant) => variant.ready_package_id === item.id)} packageRun={data.contentAiRuns.find((run) => run.id === item.content_ai_run_id)} reviewStatus={data.readyReviewStatusesV2.find((status) => status.ready_package_id === item.id)} role={role} busy={props.busy} run={props.run} reloadWorkspace={props.reloadWorkspace} />)}</div>}
      </section>
      {role === "team" && legacyHistoryCount > 0 && <details className="momo-work-history"><summary><span><strong>Legacy v1 history & manual recovery</strong><small>Scheduled v1 plans and manual approval controls are preserved for audit or controlled recovery, outside the v2 daily queue.</small></span><b>{legacyHistoryCount}</b></summary><div className="momo-content-list">
        {legacyReviewRuns.map((item) => <ContentPackageReviewCard key={item.id} packageRun={item} {...props} />)}
        {legacyReadyPackages.map(({ item, readiness }) => <ReadyContentPackageCard key={item.id} readyPackage={item} variants={readiness.variants} reloadWorkspace={props.reloadWorkspace} />)}
        {legacyBlockedReadyPackages.map(({ item, readiness }) => <article key={item.id}><div><strong>Plans no longer Ready · {item.approved_payload.direction.pillar}</strong><p>{readiness.blockers.join(" · ")}</p><small>Immutable scheduled v1 history; rebuild only through controlled manual recovery.</small></div><StatusBadge status="blocked" /><button type="button" className="momo-provider-action" onClick={() => onNavigate("team-media")}>Open Media to rebuild</button></article>)}
        {legacyFailedRuns.map((item) => <article key={item.id}><div><strong>Historical content run</strong><p>{labelStatus(item.provider_error_code || "quality gate failed")}</p></div><StatusBadge status="blocked" /></article>)}
        {data.contentItems.map((item) => <article key={item.id}><div><strong>{item.title}</strong><p>{item.concept || "No concept recorded"}</p></div><StatusBadge status={item.status} /></article>)}
      </div></details>}
    </div>
  </div>;
}


function PendingContentConfirmationCard({ item, restaurantId, busy, run }: PanelProps & { item: MomoWorkspaceData["pendingContentConfirmations"][number] }) {
  const [notes, setNotes] = useState("");
  const [correctedTitle, setCorrectedTitle] = useState(item.title);
  const [correctedConcept, setCorrectedConcept] = useState(item.concept || "");
  const [correctedCaption, setCorrectedCaption] = useState(item.master_caption || "");
  const waiting = item.confirmation_status === "pending" || item.confirmation_status === "in_review";
  const correctionChanged = correctedTitle.trim() !== item.title.trim() || correctedConcept.trim() !== (item.concept || "").trim() || correctedCaption.trim() !== (item.master_caption || "").trim();
  return <article className="momo-content-card">
    <div className="momo-panel-heading"><div><strong>{item.title}</strong><small>{item.concept || "No concept detail recorded."}</small></div><StatusBadge status={item.confirmation_status || "needs_owner_confirmation"} /></div>
    <p><strong>Content pillar:</strong> {item.manual_pillar ? labelStatus(item.manual_pillar) : "Not recorded"} · <strong>Media:</strong> {item.media_display_file_name || "Text-only direction"}</p>
    <p className="momo-caption">{item.master_caption || "No caption recorded."}</p>
    <div className="momo-form momo-compact-form"><label>Corrected title<input value={correctedTitle} onChange={(event) => setCorrectedTitle(event.target.value)} /></label><label>Corrected concept<textarea rows={2} value={correctedConcept} onChange={(event) => setCorrectedConcept(event.target.value)} /></label><label>Corrected caption<textarea rows={3} value={correctedCaption} onChange={(event) => setCorrectedCaption(event.target.value)} /></label></div>
    <label>Optional note<textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add context for the Team" /></label>
    <div className="momo-decision"><button disabled={busy || waiting || correctionChanged} onClick={() => void run(() => submitMomoContentConfirmation({ restaurantId, contentItemId: item.content_item_id, notes }), "Content direction confirmation submitted for Team review.")}>{waiting ? "Decision awaiting Team review" : "Confirm this content direction"}</button><button disabled={busy || waiting || !correctionChanged || !correctedTitle.trim() || !correctedConcept.trim() || !correctedCaption.trim()} onClick={() => void run(() => submitMomoConfirmation({ restaurantId, subjectType: "content_item", subjectId: item.content_item_id, confirmationKind: "content_direction", decision: "correct", proposedValue: { title: correctedTitle.trim(), concept: correctedConcept.trim(), masterCaption: correctedCaption.trim() }, notes: notes.trim() || "Owner submitted a content direction correction." }), "Content direction correction submitted for Team review.")}>Submit correction</button><button disabled={busy || waiting || notes.trim().length < 3} onClick={() => void run(() => submitMomoConfirmation({ restaurantId, subjectType: "content_item", subjectId: item.content_item_id, confirmationKind: "content_direction", decision: "reject", notes }), "Content direction rejection submitted for Team review.")}>Reject direction</button><button disabled={busy || waiting} onClick={() => void run(() => submitMomoConfirmation({ restaurantId, subjectType: "content_item", subjectId: item.content_item_id, confirmationKind: "content_direction", decision: "needs_help", notes: notes.trim() || "Owner requested help reviewing this content direction." }), "Content direction marked as needing help.")}>Need help</button></div>
  </article>;
}

function ApprovalRow({ approval, role, busy, run }: PanelProps & { approval: MomoApproval }) {
  const [notes, setNotes] = useState("");
  const allowedPair = momoApprovalPairIsAllowed(approval);
  return <article><div><strong>{labelStatus(approval.approval_kind)}</strong><p>{labelStatus(approval.subject_type)} · requested {formatDate(approval.requested_at)}</p>{approval.decision_notes && <small>{approval.decision_notes}</small>}</div><StatusBadge status={allowedPair ? approval.status : "invalid_contract"} />{!allowedPair && <p className="momo-warning">This legacy approval kind/subject pair is not actionable.</p>}{role === "team" && allowedPair && approval.status === "pending" && <div className="momo-decision"><input aria-label="Decision notes" placeholder="Decision note" value={notes} onChange={(event) => setNotes(event.target.value)} /><button disabled={busy} onClick={() => void run(() => decideMomoApproval(approval.id, "approved", notes), "Team approval recorded and applied.")}>Approve</button><button disabled={busy} onClick={() => void run(() => decideMomoApproval(approval.id, "rejected", notes), "Rejection recorded.")}>Reject</button></div>}</article>;
}


function ConnectionsPanel(props: PanelProps) {
  const { data, role, restaurantId, busy, run } = props;
  const [preflights, setPreflights] = useState<Record<string, MomoProviderPreflight>>({});
  return <div className="view">
    <MomoIntro eyebrow="MOMO ONLINE PRESENCE" title="See what is connected and what is missing" description="Review Google, social accounts, local visibility, website checks, and customer reviews in one place." />
    <SafetyBoundary role={role} />
    <section className="momo-panel">
      <div className="momo-panel-heading"><div><p className="eyebrow">PROVIDER CONNECTIONS</p><h2>Meta and Google access</h2></div><span>{data.connections.length}</span></div>
      {data.connections.length === 0 ? <EmptyState title="No provider is connected." detail="Veroxa has no represented Meta or Google permission. No token or secret is stored in these records." /> : <div className="momo-card-grid">{data.connections.map((connection) => {
        const capabilities = connection.provider === "meta"
          ? ["facebook_publish", "instagram_publish"]
          : ["google_business_publish"];
        const connectionEligible = capabilities.some((capability) => connectionIsCurrentlyEligible(connection, capability));
        return <article className="momo-small-card" key={connection.id}><div><strong>{labelStatus(connection.provider)}</strong><StatusBadge status={connectionEligible ? "connected" : "blocked"} /></div><p>{connection.display_label || "No account label"}</p><small>Owner authorization: {connection.owner_authorized_at ? formatDate(connection.owner_authorized_at) : "not recorded"} · verified: {formatDate(connection.last_verified_at)}</small>{connection.status === "connected" && !connectionEligible && <p className="momo-warning">The stored connection state is not currently usable because owner authorization, capability, or post-authorization verification is incomplete.</p>}{role === "team" && <p className="momo-form-note">Run no-credential preflight for each required capability.</p>}{role === "team" && capabilities.map((capability) => {
          const resultKey = `${connection.provider}:${capability}`;
          const preflight = preflights[resultKey];
          return <div key={resultKey}><button disabled={busy} onClick={() => void run(async () => {
            const result = await runMomoProviderPreflight({ restaurantId, provider: connection.provider as "meta" | "google_business", requiredCapability: capability });
            setPreflights((current) => ({ ...current, [resultKey]: result }));
          }, `${labelStatus(capability)} no-credential preflight completed without a provider call.`)}>Run {labelStatus(capability)} preflight</button>{preflight && <div className={preflight.allowed ? "momo-callout" : "momo-warning"}><strong>{preflight.allowed ? "Contract prerequisites present" : "Execution remains blocked"}</strong><p>{jsonList(preflight.blockers).join(" · ") || "No blocker returned."}</p><small>This preflight reads Veroxa records only. It never contacts Meta or Google.</small></div>}</div>;
        })}{role === "client" && !connection.owner_authorized_at && <p className="momo-warning">Authorization is not yet available in this client-safe workflow. Veroxa cannot connect or publish.</p>}</article>;
      })}</div>}
    </section>
    <section className="momo-split">
      <article className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">LOCAL SEO + WEBSITE</p><h2>Evidence checks</h2></div><span>{data.localChecks.length}</span></div>{data.localChecks.length === 0 ? <EmptyState title="No live presence check exists." detail="Website, menu, hours, ordering links, and Google visibility have not been observed by a verified check." /> : <div className="momo-record-list">{data.localChecks.map((check) => <article key={check.id}><div><strong>{labelStatus(check.check_type)}</strong><p>{jsonList(check.findings).join(" · ") || "No findings recorded"}</p><small>{formatDate(check.observed_at)}</small></div><StatusBadge status={check.status} /></article>)}</div>}</article>
      <article className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">REVIEWS</p><h2>Response approval queue</h2></div><span>{data.reviews.length}</span></div>{data.reviews.length === 0 ? <EmptyState title="No reviews have been imported." detail="No response is drafted, approved, or represented as published." /> : <div className="momo-record-list">{data.reviews.map((review) => <article key={review.id}><div><strong>{labelStatus(review.provider)} · {review.rating ?? "No rating"}</strong><p>{review.response_draft || "No response draft"}</p></div><StatusBadge status={review.response_status} /></article>)}</div>}</article>
    </section>
    <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">VISIBILITY MONITORING</p><h2>Source-backed snapshots</h2></div><span>{data.visibility.length}</span></div>{data.visibility.length === 0 ? <EmptyState title="No visibility baseline exists." detail="Rankings, reach, traffic, and profile metrics are not estimated." /> : <div className="momo-card-grid">{data.visibility.map((snapshot) => {
      const evidenceRecorded = jsonList(snapshot.evidence).length > 0;
      return <article className="momo-small-card" key={snapshot.id}><div><strong>{labelStatus(snapshot.source)}</strong><StatusBadge status={evidenceRecorded ? "evidence_recorded" : "unverified"} /></div><p>{jsonList(snapshot.metrics).join(" · ") || "No metrics recorded"}</p><small>{snapshot.period_start} – {snapshot.period_end}</small>{!evidenceRecorded && <p className="momo-warning">This legacy row has no source evidence and is not treated as verified.</p>}</article>;
    })}</div>}</section>
    {role === "team" && <TeamSystemTools title="SEO system checks" detail="Technical evidence and rehearsal controls stay closed during normal review."><MomoTeamPreconnectionCenter mode="seo" restaurantId={restaurantId} workspace={data} /></TeamSystemTools>}
  </div>;
}

function OperationsPanel(props: PanelProps & { mode: "work" | "reports" }) {
  const { data, role, restaurantId, busy, run, mode } = props;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [workType, setWorkType] = useState("onboarding");
  const [reportType, setReportType] = useState<"weekly" | "monthly">("weekly");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [reportSummary, setReportSummary] = useState<string>(MOMO_MANUAL_REPORT_NARRATIVES[0]);
  const reportNarrativeSafe = momoReportNarrativeIsSafeWithoutProviderMetrics(reportSummary);
  const eligibleEvents = data.activity.filter((event) => {
    if (!event.report_eligible || !["client", "both"].includes(event.visibility) || !periodStart || !periodEnd) return false;
    const eventDate = momoLocalDate(event.occurred_at);
    return eventDate >= periodStart && eventDate <= periodEnd;
  });

  if (mode === "work") {
    const workGroups = [
      { key: "attention", label: "Needs attention", detail: "Approval, blocker, or failure", statuses: ["waiting_approval", "blocked", "failed"] },
      { key: "active", label: "Active work", detail: "In progress, retrying, or ready to begin", statuses: ["in_progress", "retrying", "queued"] },
      { key: "done", label: "Completed", detail: "Recent completed or cancelled work", statuses: ["completed", "cancelled"] },
    ] as const;
    const visibleGroups = workGroups.map((group) => ({
      ...group,
      items: data.work.filter((item) => (group.statuses as readonly string[]).includes(item.status)),
    }));
    const currentGroups = visibleGroups.filter((group) => group.key !== "done" && group.items.length > 0);
    const completedGroup = visibleGroups.find((group) => group.key === "done")!;
    const openAlerts = data.alerts.filter((item) => item.status !== "resolved").length;
    const activeRecovery = data.recovery.filter((item) => ["queued", "in_progress", "retrying"].includes(item.status)).length;

    return <div className="view momo-work-view">
      <MomoIntro eyebrow="MOMO’S HOUSE" title="Work" description="Only active tasks, decisions, and blockers appear by default." />
      <SafetyBoundary role={role} />
      {role === "team" && <details className="team-add-work">
        <summary><span><strong>Add a Momo task</strong><small>Use only when there is real work to perform.</small></span><b>+</b></summary>
        <form className="momo-inline-form momo-work-create" onSubmit={(event) => {
          event.preventDefault();
          void run(() => createMomoWorkItem({ restaurantId, workType, title, description, priority: 3 }), "Momo work item queued.");
        }}><label>Type<select value={workType} onChange={(event) => setWorkType(event.target.value)}><option value="onboarding">Onboarding</option><option value="truth_review">Truth review</option><option value="media">Media</option><option value="content">Content</option><option value="publishing">Ready-to-post preparation</option><option value="google">Google</option><option value="seo">SEO</option><option value="reviews">Reviews</option><option value="website">Website</option><option value="reporting">Reporting</option><option value="monitoring">Monitoring</option><option value="recovery">Recovery</option></select></label><label>Task title<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label><label>Useful detail<input value={description} onChange={(event) => setDescription(event.target.value)} /></label><button className="secondary-button" disabled={busy || !title.trim()}>Add task</button></form>
      </details>}
      {data.work.length === 0 ? <EmptyState title="No Momo work is recorded." detail="Add the first task only when there is real work to begin." /> : <section className="momo-work-stream" aria-label="Momo’s House work">
        {currentGroups.map((group) => <section className={`momo-work-section ${group.key}`} key={group.key}>
          <header><span><strong>{group.label}</strong><small>{group.detail}</small></span><b>{group.items.length}</b></header>
          <div className="momo-work-grid">{group.items.map((item) => <WorkItemCard key={item.id} item={item} {...props} />)}</div>
        </section>)}
        {currentGroups.length === 0 && <EmptyState title="No active task needs attention." detail="Completed history remains available below." />}
        {completedGroup.items.length > 0 && <details className="momo-work-history"><summary><span><strong>Completed work</strong><small>Open only when you need history.</small></span><b>{completedGroup.items.length}</b></summary><div className="momo-work-grid">{completedGroup.items.map((item) => <WorkItemCard key={item.id} item={item} {...props} />)}</div></details>}
      </section>}
      {role === "team" && (openAlerts > 0 || activeRecovery > 0) && <details className="momo-operations-details">
        <summary><span><strong>Monitoring & recovery</strong><small>Open only when an operational exception needs review.</small></span><b>{data.alerts.filter((item) => item.status !== "resolved").length} open alerts</b></summary>
        <div className="momo-operations-detail-body">
          <MonitorCheckForm {...props} />
          <section className="momo-split">
            <article className="momo-panel"><div className="momo-panel-heading"><h2>Alerts</h2><span>{data.alerts.length}</span></div>{data.alerts.length === 0 ? <EmptyState title="No alerts recorded." detail="Absence of records is not proof of health." /> : data.alerts.map((item) => <AlertRow key={item.id} item={item} {...props} />)}</article>
            <article className="momo-panel"><div className="momo-panel-heading"><h2>Recovery</h2><span>{data.recovery.length}</span></div>{data.recovery.length === 0 ? <EmptyState title="No recovery run." detail="No recovery is represented as complete." /> : data.recovery.map((item) => <RecoveryRunRow key={item.id} item={item} {...props} />)}</article>
          </section>
        </div>
      </details>}
    </div>;
  }

  return <div className="view">
    <MomoIntro eyebrow="MOMO PROGRESS UPDATES" title="Clear reports backed by completed work" description="Prepare simple weekly or monthly updates from reviewed Momo activity." />
    <SafetyBoundary role={role} />
    {role === "team" && <form className="momo-panel momo-form" onSubmit={(event) => {
      event.preventDefault();
      void run(async () => {
        if (!reportNarrativeSafe) throw new Error("report_narrative_requires_source_backed_provider_metrics");
        await createMomoReportDraft({ restaurantId, reportType, periodStart, periodEnd, summary: reportSummary, evidenceEventIds: eligibleEvents.map((item) => item.id) });
      }, "Evidence-backed report draft saved for review.");
    }}><div className="momo-panel-heading"><div><p className="eyebrow">REPORT DRAFT</p><h2>Build from eligible activity</h2></div><StatusBadge status="pending" /></div><div className="momo-form-grid"><label>Cadence<select value={reportType} onChange={(event) => setReportType(event.target.value as "weekly" | "monthly")}><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label><label>Start date<input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} required /></label><label>End date<input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} required /></label><label className="wide">Manual-process summary<select value={reportSummary} onChange={(event) => setReportSummary(event.target.value)}>{MOMO_MANUAL_REPORT_NARRATIVES.map((narrative) => <option key={narrative} value={narrative}>{narrative}</option>)}</select></label></div><p className="momo-form-note">{eligibleEvents.length} client-safe, report-eligible activity events occurred inside this date range. Events outside the range or marked Team-only are excluded. This no-cost release accepts fixed process narratives only; it cannot claim provider or business outcomes.</p><button className="secondary-button" disabled={busy || eligibleEvents.length === 0 || !reportNarrativeSafe}>Save report draft</button></form>}
    {role === "team" && data.approvals.some((approval) => approval.subject_type === "report") && <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">REPORT RELEASE QUEUE</p><h2>Human release decisions</h2></div><span>{data.approvals.filter((approval) => approval.subject_type === "report").length}</span></div><div className="momo-record-list">{data.approvals.filter((approval) => approval.subject_type === "report").map((approval) => <ApprovalRow key={approval.id} approval={approval} {...props} />)}</div></section>}
    <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">REPORTS</p><h2>Client-safe evidence</h2></div><span>{data.reports.length}</span></div>{data.reports.length === 0 ? <EmptyState title="No reviewed report exists." detail="Orders, revenue, rankings, ROI, and outcomes are never fabricated." /> : <div className="momo-report-list">{data.reports.map((report) => <ReportCard key={report.id} report={report} {...props} />)}</div>}</section>
    <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">ACTIVITY HISTORY</p><h2>Report eligibility is explicit</h2></div><span>{data.activity.length}</span></div>{data.activity.length === 0 ? <EmptyState title="No operating activity is recorded." detail="Reports remain safe-empty until reviewed work produces eligible evidence." /> : <div className="momo-record-list">{data.activity.map((event) => <article key={event.id}><div><strong>{labelStatus(event.event_type)}</strong><p>{valueText(event.payload) || "No public detail"}</p><small>{formatDate(event.occurred_at)} · {event.visibility}</small></div><StatusBadge status={event.report_eligible ? "report_eligible" : "internal_only"} /></article>)}</div>}</section>
  </div>;
}

function ReportCard({ report, data, role, restaurantId, busy, run }: PanelProps & { report: MomoWorkspaceData["reports"][number] }) {
  const summaryRecord = report.summary && typeof report.summary === "object" ? report.summary as Record<string, unknown> : null;
  const initialNarrative = typeof summaryRecord?.narrative === "string" ? summaryRecord.narrative : "";
  const [revision, setRevision] = useState<string>(momoReportNarrativeIsSafeWithoutProviderMetrics(initialNarrative) ? initialNarrative : MOMO_MANUAL_REPORT_NARRATIVES[0]);
  const releaseApproval = data.approvals.find((item) => item.subject_type === "report" && item.subject_id === report.id && item.approval_kind === "report_release");
  const activeReleaseApproval = releaseApproval && ["pending", "in_review", "approved"].includes(releaseApproval.status) ? releaseApproval : undefined;
  const originalEvidenceIds = new Set(Array.isArray(report.evidence_event_ids)
    ? report.evidence_event_ids.filter((id): id is string => typeof id === "string")
    : []);
  const reportEvidence = data.activity.filter((event) => {
    if (!originalEvidenceIds.has(event.id) || !event.report_eligible || !["client", "both"].includes(event.visibility)) return false;
    const eventDate = momoLocalDate(event.occurred_at);
    return eventDate >= report.period_start && eventDate <= report.period_end;
  });
  const narrativeSafe = momoReportNarrativeIsSafeWithoutProviderMetrics(revision);
  const revisable = ["changes_requested", "rejected"].includes(report.status) && !activeReleaseApproval;
  return <article>
    <div><strong>{labelStatus(report.report_type)}</strong><StatusBadge status={activeReleaseApproval?.status || report.status} /></div>
    <p>{jsonList(report.summary).join(" · ") || "No summary recorded"}</p>
    <small>{report.period_start} – {report.period_end} · approved {formatDate(report.approved_at)}</small>
    {role === "team" && report.status === "pending" && !activeReleaseApproval && <button disabled={busy} onClick={() => void run(() => requestMomoApproval({ restaurantId, subjectType: "report", subjectId: report.id, approvalKind: "report_release" }), "Report release review requested.")}>Request report release</button>}
    {role === "team" && revisable && <div className="momo-form momo-compact-form"><label>Revised manual-process narrative<select value={revision} onChange={(event) => setRevision(event.target.value)}>{MOMO_MANUAL_REPORT_NARRATIVES.map((narrative) => <option key={narrative} value={narrative}>{narrative}</option>)}</select></label><p className="momo-form-note">{reportEvidence.length} eligible event(s) will be revalidated for this fixed report period. Provider and business outcomes remain unavailable.</p><button disabled={busy || reportEvidence.length === 0 || !narrativeSafe} onClick={() => void run(() => reviseMomoReportDraft({ reportId: report.id, summary: revision, evidenceEventIds: reportEvidence.map((event) => event.id) }), "Report revision saved with a new evidence snapshot. A new release review is required.")}>Save report revision</button></div>}
  </article>;
}

function AlertRow({ item, role, busy, run }: PanelProps & { item: MomoWorkspaceData["alerts"][number] }) {
  const [notes, setNotes] = useState("");
  const targetStatus = item.status === "open" ? "acknowledged" : item.status === "acknowledged" ? "resolved" : null;
  return <div className="momo-mini"><span><strong>{item.title}</strong><small>{item.message}</small>{role === "team" && targetStatus && <input value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)} placeholder={targetStatus === "acknowledged" ? "Acknowledgement notes" : "Resolution evidence"} />}</span><StatusBadge status={item.status} />{role === "team" && targetStatus && <button disabled={busy || notes.trim().length < 10} onClick={() => void run(() => transitionMomoAlert({ alertId: item.id, targetStatus, notes }), targetStatus === "acknowledged" ? "Alert acknowledged with Team evidence." : "Alert resolved with Team evidence.")}>{targetStatus === "acknowledged" ? "Acknowledge" : "Resolve"}</button>}</div>;
}

function WorkItemCard({ item, role, busy, run }: PanelProps & { item: MomoWorkspaceData["work"][number] }) {
  const [reason, setReason] = useState("");
  const actionableDetail = reason.trim().length >= 10;
  const requiresExternalEvidence = externalEvidenceWorkTypes.has(item.work_type);
  const visibility = requiresExternalEvidence ? "team" as const : "both" as const;
  const retryDue = !item.next_attempt_at || new Date(item.next_attempt_at) <= new Date();
  const waitingForApproval = item.status === "waiting_approval";
  const canCancel = ["queued", "in_progress", "waiting_approval", "retrying", "blocked"].includes(item.status);
  return <article>
    <div><strong>{item.title}</strong><StatusBadge status={item.status} /></div>
    <p>{item.description || item.blocked_reason || "No detail recorded"}</p>
    {item.client_request_id && <small className="momo-request-reference">Client request · {item.client_request_id.slice(0, 8)}…</small>}
    <small>{labelStatus(item.work_type)} · attempts {item.attempt_count}/{item.max_attempts} · due {formatDate(item.due_at)} · retry after {formatDate(item.next_attempt_at)}</small>
    {role === "team" && !["completed", "cancelled"].includes(item.status) && <label>Evidence or failure detail<input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="At least 10 characters" /></label>}
    {role === "team" && ["queued", "retrying"].includes(item.status) && <button type="button" disabled={busy || (item.status === "retrying" && !retryDue)} onClick={() => void run(() => transitionMomoWorkItem({ workItemId: item.id, targetStatus: "in_progress" }), item.status === "retrying" ? "Due retry started with aligned attempt history." : "Work item started with an auditable transition.")}>{item.status === "retrying" ? "Start due retry" : "Start work"}</button>}
    {role === "team" && waitingForApproval && <>
      <small>Record the approval outcome before choosing the next work state.</small>
      <button type="button" disabled={busy || !actionableDetail} onClick={() => void run(() => transitionMomoWorkItem({ workItemId: item.id, targetStatus: "in_progress", reason }), "Approval evidence recorded; work resumed.")}>Resume after approval</button>
      <button type="button" disabled={busy || !actionableDetail} onClick={() => void run(() => transitionMomoWorkItem({ workItemId: item.id, targetStatus: "blocked", reason }), "Work item blocked with an explicit reason.")}>Block work</button>
    </>}
    {role === "team" && item.status === "in_progress" && <>
      <button type="button" disabled={busy || !actionableDetail} onClick={() => void run(() => transitionMomoWorkItem({ workItemId: item.id, targetStatus: "blocked", reason }), "Work item blocked with an explicit reason.")}>Block work</button>
      <button type="button" disabled={busy || !actionableDetail} onClick={() => void run(() => transitionMomoWorkItem({ workItemId: item.id, targetStatus: "failed", reason }), "Failure and attempt evidence recorded.")}>Record failure</button>
      <button type="button" disabled={busy || !actionableDetail} onClick={() => void run(() => transitionMomoWorkItem({ workItemId: item.id, targetStatus: "completed", reason, visibility, reportEligible: !requiresExternalEvidence, payload: { summary: reason.trim(), workType: item.work_type, evidenceBoundary: requiresExternalEvidence ? "team_only_pending_provider_evidence" : "manual_operating_evidence" } }), requiresExternalEvidence ? "Internal completion recorded. Client/report evidence remains blocked until source-backed provider evidence exists." : "Completion and client-safe report evidence recorded.")}>Complete with evidence</button>
      {requiresExternalEvidence && <small>Completion stays Team-only and report-ineligible until a source-backed external record is validated.</small>}
    </>}
    {role === "team" && canCancel && <button type="button" disabled={busy || !actionableDetail} onClick={() => void run(() => transitionMomoWorkItem({ workItemId: item.id, targetStatus: "cancelled", reason }), "Work item cancelled with an auditable reason.")}>Cancel work</button>}
    {role === "team" && (item.status === "failed" || item.status === "blocked") && <>
      <button type="button" disabled={busy || item.attempt_count >= item.max_attempts || Boolean(item.next_attempt_at && new Date(item.next_attempt_at) > new Date())} onClick={() => void run(() => retryMomoWorkItem(item), "Retry queued within the recorded backoff and attempt limit.")}>Retry when due</button>
      <button type="button" disabled={busy || !actionableDetail} onClick={() => void run(() => startMomoRecoveryRun({ workItemId: item.id, actionKey: reason.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 80) || "manual_recovery" }), "Recovery run started and linked to the failed work item.")}>Start recovery</button>
    </>}
  </article>;
}

function MonitorCheckForm({ restaurantId, busy, run }: PanelProps) {
  const [checkKey, setCheckKey] = useState("momo_manual_operations_rehearsal");
  const [status, setStatus] = useState<"healthy" | "warning" | "critical">("healthy");
  const [details, setDetails] = useState("");
  return <form className="momo-panel momo-inline-form" onSubmit={(event) => {
    event.preventDefault();
    void run(() => recordMomoMonitorCheck({ restaurantId, checkKey, status, details }), "Monitor evidence saved; warning or critical state opens an alert.");
  }}><div><p className="eyebrow">MANUAL MONITOR</p><h2>Record an observed check</h2></div><label>Check key<input value={checkKey} onChange={(event) => setCheckKey(event.target.value)} required /></label><label>Observed state<select value={status} onChange={(event) => setStatus(event.target.value as "healthy" | "warning" | "critical")}><option value="healthy">Healthy</option><option value="warning">Warning</option><option value="critical">Critical</option></select></label><label>Evidence detail<input value={details} onChange={(event) => setDetails(event.target.value)} required minLength={10} /></label><button className="secondary-button" disabled={busy || details.trim().length < 10}>Record check</button></form>;
}

function RecoveryRunRow({ item, data, role, busy, run }: PanelProps & { item: MomoWorkspaceData["recovery"][number] }) {
  const [notes, setNotes] = useState("");
  const active = ["queued", "in_progress", "retrying"].includes(item.status);
  const workItem = data.work.find((work) => work.id === item.subject_id);
  const requiresExternalEvidence = Boolean(workItem && externalEvidenceWorkTypes.has(workItem.work_type));
  const visibility = requiresExternalEvidence ? "team" as const : "both" as const;
  return <div className="momo-mini"><span><strong>{labelStatus(item.action_key)}</strong><small>Attempts {item.attempt_count}/{item.max_attempts}</small>{active && role === "team" && <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Recovery evidence" />}</span><StatusBadge status={item.status} />{active && role === "team" && <div className="momo-decision"><button disabled={busy || notes.trim().length < 10} onClick={() => void run(() => completeMomoRecoveryRun({ recoveryRunId: item.id, succeeded: true, notes, visibility }), requiresExternalEvidence ? "Internal recovery completion recorded. Client/report evidence remains blocked until source-backed provider evidence exists." : "Recovery completed with evidence and activity history.")}>Mark recovered</button><button disabled={busy || notes.trim().length < 10} onClick={() => void run(() => completeMomoRecoveryRun({ recoveryRunId: item.id, succeeded: false, notes, visibility: "team" }), "Recovery failure recorded for follow-up.")}>Record failure</button>{requiresExternalEvidence && <small>Provider-facing recovery remains Team-only until source-backed evidence is validated.</small>}</div>}</div>;
}

function ReadinessPanel({ data, role, restaurantId, busy, run }: PanelProps) {
  const gate = data.readinessGate;
  const required = data.readiness.filter((item) => item.required);
  const [rehearsalResult, setRehearsalResult] = useState<{ status: string; blocker_count: number; can_activate: boolean } | null>(null);
  return <div className="view">
    <MomoIntro eyebrow="MOMO PILOT PROGRESS" title={gate?.can_activate ? "Ready for final review" : "See what remains before launch"} description="Each required stage shows its evidence, blockers, and next action. Partial work is never shown as ready." />
    <SafetyBoundary role={role} />
    <section className={`momo-gate ${gate?.can_activate ? "pass" : "blocked"}`}>
      <div><p className="eyebrow">OVERALL STATE</p><strong>{labelStatus(gate?.overall_status || "not_evaluated")}</strong><span>{gate?.can_activate ? "All database-enforced prerequisites passed. Final human approval is still a separate decision." : "No publishing, account action, or live provider execution may begin."}</span></div>
      <article><strong>{gate?.verified_count ?? 0}</strong><span>required dimensions verified</span></article>
      <article><strong>{gate?.blocker_count ?? required.filter((item) => jsonList(item.blockers).length > 0).length}</strong><span>blocking conditions</span></article>
      <article><strong>{gate?.required_count ?? required.length}</strong><span>required dimensions</span></article>
    </section>
    {data.readiness.length === 0 ? <EmptyState title="No readiness dimensions exist." detail="Momo cannot be marked ready without persisted dimensions and a successful database gate." /> : <section className="momo-readiness-grid">{data.readiness.map((dimension) => <article key={dimension.id}><div><h2>{dimension.label}</h2><StatusBadge status={dimension.status} /></div><section><p className="eyebrow">EVIDENCE</p>{jsonList(dimension.evidence).length ? <ul>{jsonList(dimension.evidence).map((item) => <li key={item}>{item}</li>)}</ul> : <p>No evidence recorded.</p>}</section><section className="momo-blockers"><p className="eyebrow">BLOCKERS</p>{jsonList(dimension.blockers).length ? <ul>{jsonList(dimension.blockers).map((item) => <li key={item}>{item}</li>)}</ul> : <p>No blocker recorded.</p>}</section><small>Last updated {formatDate(dimension.updated_at)}</small></article>)}</section>}
    {role === "team" && <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">ACTIVATION DECISION HISTORY</p><h2>Immutable go / no-go evidence</h2></div><span>{data.activationDecisions.length}</span></div>{data.activationDecisions.length === 0 ? <EmptyState title="No activation decision has been recorded." detail="A no-cost rehearsal writes only a No-Go when blockers remain; no Go action is exposed." /> : <div className="momo-record-list">{data.activationDecisions.map((decision) => <article key={decision.id}><div><strong>{labelStatus(decision.decision)}</strong><p>{decision.reason}</p><small>{labelStatus(decision.mode)} · {formatDate(decision.decided_at)}</small></div><StatusBadge status={decision.decision} /></article>)}</div>}</section>}
    <section className="momo-boundary"><strong>No readiness percentage is calculated</strong><span>The final gate is pass/fail. A count is shown for evidence, but partial completion is never converted into a readiness percentage. Other restaurants remain Restaurant Audit Center records only.</span><em>{gate?.can_activate ? "Review required" : "Blocked"}</em></section>
    {role === "team" && <TeamSystemTools title="Readiness system checks" detail="Automation contracts and rehearsal controls stay closed during normal progress review."><>
      <section className="momo-panel momo-form"><div className="momo-panel-heading"><div><p className="eyebrow">FINAL REHEARSAL</p><h2>Recheck the launch gate</h2></div><StatusBadge status={rehearsalResult?.status || "not_evaluated"} /></div><p className="momo-form-note">This records a new No-Go snapshot when requirements are still unfinished. It cannot activate Momo.</p><button className="secondary-button" disabled={busy} onClick={() => void run(async () => {
        const result = await runMomoNoGoRehearsal({ restaurantId, reason: "No-cost final rehearsal. Activation remains blocked until every required dimension and external authority is verified." });
        setRehearsalResult(result);
      }, "Readiness rehearsal recorded. No activation, provider call, owner contact, or publication occurred.")}>Recheck readiness</button>{rehearsalResult && <div className={rehearsalResult.can_activate ? "momo-callout" : "momo-warning"}><strong>{rehearsalResult.can_activate ? "Requirements passed; final human review is still required" : "Still blocked"}</strong><p>{rehearsalResult.blocker_count} blocker(s) remain.</p></div>}</section>
      <MomoTeamPreconnectionCenter mode="readiness" restaurantId={restaurantId} workspace={data} />
    </></TeamSystemTools>}
  </div>;
}

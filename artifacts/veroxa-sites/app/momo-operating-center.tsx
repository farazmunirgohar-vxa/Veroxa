"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { VeroxaRole } from "./veroxa-supabase";
import {
  MOMO_MANUAL_CONTENT_PILLARS,
  buildMomoManualContentCycle,
  validateMomoPlatformVariantCaption,
  type MomoManualContentPillar,
  type MomoManualContentCycleResult,
} from "./momo-manual-content-cycle";
import {
  MOMO_MANUAL_REPORT_NARRATIVES,
  momoCalendarEntryIsCurrentApproved,
  momoConnectionIsCurrentlyEligible as connectionIsCurrentlyEligible,
  momoContentSelectionsAreCurrent,
  momoMediaIsCurrentlyUsable as mediaIsCurrentlyUsable,
  momoReportNarrativeIsSafeWithoutProviderMetrics,
  momoTruthFieldIsCurrentlyUsable,
  normalizedMomoHttpsUrl as normalizedHttpsUrl,
  resolveLatestMomoPresenceConfirmation,
} from "./momo-operating-gates";
import {
  addMomoMediaTag,
  appendMomoRequestMessage,
  completeMomoRecoveryRun,
  createMomoContentDraft,
  createMomoReportDraft,
  createMomoContentStrategy,
  createMomoPlatformVariant,
  createMomoClientRequest,
  createMomoClientRequestWork,
  createMomoWorkItem,
  decideMomoApproval,
  emptyMomoWorkspaceData,
  getMomoMediaPreviewUrl,
  loadMomoWorkspaceData,
  loadMomoClientRequests,
  loadMomoRequestThread,
  newMomoRequestIdempotencyKey,
  prepareMomoAiJob,
  queueMomoPublication,
  requestMomoApproval,
  recordMomoMediaReuse,
  recordMomoMonitorCheck,
  reviseMomoReportDraft,
  retryMomoWorkItem,
  reviewMomoMedia,
  reviewMomoConfirmation,
  revokeMomoMediaRights,
  saveMomoContact,
  saveMomoTruthRevisions,
  scheduleMomoVariant,
  startMomoRecoveryRun,
  submitMomoContentConfirmation,
  submitMomoConfirmation,
  transitionMomoWorkItem,
  transitionMomoClientRequest,
  transitionMomoAlert,
  updateMomoOnboardingStep,
  updateMomoPresenceProfile,
  uploadMomoMedia,
  runMomoProviderPreflight,
  runMomoNoGoRehearsal,
  type MomoApproval,
  type MomoConfirmation,
  type MomoMediaAsset,
  type MomoClientRequest,
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

const approvalBlocksNewRequest = (approval: MomoApproval | undefined) =>
  Boolean(approval && ["pending", "in_review", "approved"].includes(approval.status));

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

const requiredPublishCapability = (platform: string) =>
  platform === "facebook" ? "facebook_publish"
    : platform === "instagram" ? "instagram_publish"
      : "google_business_publish";

const externalEvidenceWorkTypes = new Set([
  "publishing",
  "google",
  "seo",
  "reviews",
  "website",
  "monitoring",
]);

function StatusBadge({ status }: { status: string }) {
  return <span className={`momo-status ${status.toLowerCase().replaceAll("_", "-")}`}>{labelStatus(status)}</span>;
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <section className="momo-empty" aria-live="polite"><strong>{title}</strong><p>{detail}</p></section>;
}

function MomoIntro({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: React.ReactNode }) {
  return <div className="momo-intro"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{actions && <div className="momo-intro-actions">{actions}</div>}</div>;
}

function SafetyBoundary({ role }: { role: VeroxaRole }) {
  return <section className="momo-boundary">
    <strong>{role === "team" ? "Approval-controlled production workspace" : "Owner-confirmation workspace"}</strong>
    <span>{role === "team"
      ? "Database records are live. AI preparation, Meta, Google, publishing, and review responses remain inactive unless a real connection and the required approval both exist."
      : "Your confirmation is stored as a pending proposal for Team review. It does not change public restaurant truth or give Veroxa permission to publish automatically."}</span>
    <em>Protected workspace</em>
  </section>;
}

export function MomoOperatingCenter({ view, access, onNavigate, notify }: Props) {
  const section = sectionForView(view);
  const [state, setState] = useState<LoadState>({ status: "loading", data: emptyMomoWorkspaceData(), error: null });
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!access.restaurantId) {
      setState({ status: "error", data: emptyMomoWorkspaceData(), error: "This account has no active Momo restaurant membership." });
      return;
    }
    setState((current) => ({ status: "loading", data: current.data, error: null }));
    try {
      const data = await loadMomoWorkspaceData(access.restaurantId, section, access.role);
      setState({ status: "ready", data, error: null });
    } catch {
      setState({ status: "error", data: emptyMomoWorkspaceData(), error: "Verified Momo data could not be loaded. No cached or sample records are being shown." });
    }
  }, [access.restaurantId, access.role, section]);

  useEffect(() => {
    if (!access.restaurantId) {
      Promise.resolve().then(() => setState({ status: "error", data: emptyMomoWorkspaceData(), error: "This account has no active Momo restaurant membership." }));
      return;
    }
    let active = true;
    const restaurantId = access.restaurantId;
    void loadMomoWorkspaceData(restaurantId, section, access.role)
      .then((data) => {
        if (active) setState({ status: "ready", data, error: null });
      })
      .catch(() => {
        if (active) setState({ status: "error", data: emptyMomoWorkspaceData(), error: "Verified Momo data could not be loaded. No cached or sample records are being shown." });
      });
    return () => { active = false; };
  }, [access.restaurantId, access.role, section]);

  const run = async (action: () => Promise<void>, success: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      notify(success);
      await reload();
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      const message = code === "unsupported_media_type" ? "Use JPG, PNG, WebP, HEIC, MP4, MOV, or WebM."
        : code === "invalid_media_size" ? "Choose a non-empty file no larger than 100 MB."
        : code === "team_prefill_required" ? "Team Faraz must create the review field before the owner can submit a correction."
        : code === "owner_confirmation_locked" ? "This owner-confirmed fact is locked. Request a new owner correction instead of overwriting it."
        : code === "retry_limit_reached" ? "This item reached its retry limit. Start a reviewed recovery action instead."
        : code === "manual_cycle_invalid" ? "The manual content inputs changed or are not verified. Validate the no-cost brief again before saving."
        : code === "variant_claim_evidence_invalid" ? "This caption contains a sensitive claim without an explicitly selected, semantically matching owner-confirmed truth field."
        : "The database did not accept this change. Nothing is being represented as complete.";
      notify(message);
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
  };

  if (view === "requests" || view === "team-requests") return <RequestsPanel role={access.role} restaurantId={access.restaurantId!} notify={notify} onNavigate={onNavigate} />;
  if (view === "onboarding" || view === "team-intelligence") return <IntelligencePanel {...shared} />;
  if (view === "media" || view === "team-media") return <MediaPanel {...shared} />;
  if (view === "content" || view === "team-content") return <ContentPanel {...shared} />;
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
      <Module title="Client requests" detail="A private request thread can start the manual work loop without activating services, publishing, or inventing completion." status="manual_only" action="Open requests" onClick={() => onNavigate(role === "team" ? "team-requests" : "requests")} />
      <Module title="Restaurant setup" detail={data.truth.length ? `${data.truth.length} persistent fields available.` : "No owner-confirmed restaurant truth yet."} status={data.truth.length ? "in_progress" : "not_started"} action="Open restaurant setup" onClick={() => onNavigate(role === "team" ? "team-intelligence" : "onboarding")} />
      <Module title="Media library" detail={data.media.length ? `${data.media.length} assets; ${data.mediaRights.length} rights records.` : "No Momo media has been uploaded."} status={data.media.length ? "in_progress" : "not_started"} action="Open media library" onClick={() => onNavigate(role === "team" ? "team-media" : "media")} />
      <Module title="Content & approvals" detail={data.contentItems.length ? `${data.contentItems.length} content items; ${pendingApprovals} pending approvals.` : "No strategy or content draft exists."} status={pendingApprovals ? "approval_required" : data.contentItems.length ? "in_progress" : "not_started"} action="Open content" onClick={() => onNavigate(role === "team" ? "team-content" : "content")} />
      <Module title="Online presence" detail={data.connections.length ? `${eligibleConnections} of ${data.connections.length} provider records have current owner authorization, capability, and verification.` : "Meta and Google are not represented as connected."} status={eligibleConnections > 0 ? "connected" : "blocked"} action="Review online presence" onClick={() => onNavigate(role === "team" ? "team-presence" : "services")} />
      <Module title="Reporting" detail={data.reports.length ? `${data.reports.length} evidence-backed report records.` : "No reviewed report is available."} status={data.reports.length ? "in_progress" : "not_started"} action="Open reports" onClick={() => onNavigate(role === "team" ? "team-reports" : "reports")} />
      <Module title="Final readiness gate" detail={gate ? `${gate.verified_count} of ${gate.required_count} required dimensions verified; ${gate.blocker_count} blockers.` : "The production readiness gate has no evaluated record."} status={gate?.overall_status || "not_evaluated"} action="Review readiness" onClick={() => onNavigate(role === "team" ? "team-readiness" : "onboarding")} />
    </section>
  </div>;
}

const requestErrorMessage = (code: string) => {
  if (["active_client_request_author_required", "request_thread_access_denied", "momo_team_request_transition_required", "momo_team_client_request_work_required", "request_list_access_or_limit_denied", "request_thread_access_or_limit_denied"].includes(code)) {
    return "This signed account no longer has the required Momo request access. Nothing was changed.";
  }
  if (["invalid_client_request_payload", "invalid_request_message_payload", "invalid_client_request_transition", "invalid_client_request_work_payload"].includes(code)) {
    return "The request details are outside the allowed length, type, priority, or state boundary. Review the highlighted fields and try again.";
  }
  if (["client_request_idempotency_conflict", "request_message_idempotency_conflict", "client_request_transition_idempotency_conflict", "client_request_work_idempotency_conflict"].includes(code)) {
    return "This retry no longer matches its original payload. Reload the request before trying again.";
  }
  if (["client_request_rate_or_open_limit_reached", "request_message_rate_or_thread_limit_reached"].includes(code)) {
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
    let active = true;
    void loadMomoClientRequests({ restaurantId, limit: 25 })
      .then((next) => {
        if (!active) return;
        setRequests(next);
        setSelectedId(next[0]?.id || null);
        setListState("ready");
      })
      .catch(() => {
        if (!active) return;
        setRequests([]);
        setSelectedId(null);
        setListState("error");
      });
    return () => { active = false; };
  }, [restaurantId]);
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
    <MomoIntro eyebrow="MOMO’S HOUSE SAN ANTONIO · PRIVATE REQUESTS" title={role === "team" ? "Client request queue" : "Ask Veroxa for help"} description={role === "team" ? "A manual, auditable path from a real Client request to acknowledged work. No request can activate Momo, publish content, or prove readiness by itself." : "Create a private request for Team Faraz and keep its conversation in one place. Requests do not approve public work or turn on any service."} />
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

    <section className="momo-request-layout">
      <article className="momo-panel momo-request-list-panel">
        <div className="momo-panel-heading"><div><p className="eyebrow">REQUEST QUEUE</p><h2>{role === "team" ? "Most recent Client requests" : "Your requests"}</h2><small>Bounded to the 25 most recent accessible records.</small></div><span>{requests.length}</span></div>
        {listState === "loading" && requests.length === 0 ? <EmptyState title="Loading private requests…" detail="No fixture or cached request is shown." />
          : listState === "error" ? <EmptyState title="Requests are unavailable." detail="No request is being inferred. Reload when database access is restored." />
            : requests.length === 0 ? <EmptyState title="No request records exist." detail={role === "team" ? "No Momo Client request has been persisted. Team work will not be invented to make this queue look active." : "Your signed Client identity has not created a request. The manual pilot remains safely empty."} />
              : <div className="momo-request-list">{requests.map((request) => <button type="button" key={request.id} className={selectedId === request.id ? "active" : ""} onClick={() => { threadLoadSequence.current += 1; setThread([]); setThreadRequestId(null); setThreadState("loading"); setSelectedId(request.id); setWorkKey(newMomoRequestIdempotencyKey("work")); setLastLinkedWorkId(null); }} aria-pressed={selectedId === request.id}><span><strong>{request.title}</strong><small>{labelStatus(request.requestType)} · {formatDate(request.createdAt)}</small></span><span><StatusBadge status={request.status} />{request.priority === "urgent" && <em>Urgent</em>}</span></button>)}</div>}
        <button type="button" className="momo-request-refresh" disabled={listState === "loading" || actionBusy} onClick={() => void reloadRequests(selectedId || undefined)}>Refresh verified records</button>
      </article>

      <article className="momo-panel momo-request-thread-panel">
        {!selected ? <EmptyState title="Choose a request." detail="Its private thread, allowed next state, and linked-work control will appear here." /> : <>
          <div className="momo-request-detail-head"><div><p className="eyebrow">{labelStatus(selected.requestType)} · {labelStatus(selected.priority)} priority</p><h2>{selected.title}</h2><p>{selected.details}</p><small>Created {formatDate(selected.createdAt)} · updated {formatDate(selected.updatedAt)}</small></div><StatusBadge status={selected.status} /></div>
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

function IntelligencePanel(props: PanelProps) {
  const { data, role, busy, run } = props;
  const currentOwnerTruth = data.truth.filter((item) => momoTruthFieldIsCurrentlyUsable(data, item.id)).length;
  const currentOwnerContacts = data.contacts.filter((item) => item.status === "owner_confirmed" && subjectHasNoContraryOwnerIntent(data.confirmations, "contact", item.id)).length;
  const currentVerifiedOnboarding = data.onboarding.filter((item) => {
    const latest = latestSubjectConfirmation(data.confirmations, "onboarding_step", item.id);
    return item.status === "verified" && latest?.status === "approved" && ["confirm", "correct"].includes(latest.decision || "");
  }).length;
  return <div className="view">
    <MomoIntro eyebrow="RESTAURANT INTELLIGENCE + ONBOARDING" title="Owner-confirmed business truth" description="Identity, hours, menu, services, dietary claims, contacts, voice, goals, presence, and onboarding evidence are stored with explicit confirmation states." />
    <SafetyBoundary role={role} />
    <RestaurantTruthForm key={data.truth.map((item) => `${item.id}:${item.updated_at}`).join("|")} {...props} />
    <ContactForm key={data.contacts.map((item) => `${item.id}:${item.updated_at}`).join("|")} {...props} />
    <section className="momo-split">
      <article className="momo-panel">
        <div className="momo-panel-heading"><div><p className="eyebrow">CURRENT TRUTH</p><h2>Field-level confirmation</h2></div><span>{data.truth.length}</span></div>
        {data.truth.length === 0 ? <EmptyState title="No restaurant truth has been recorded." detail="Use the form above to add owner-confirmed facts. Unconfirmed facts remain absent." /> : <div className="momo-record-list">
          {data.truth.map((field) => <article key={field.id}><div><strong>{labelStatus(field.field_key)}</strong><p>{valueText(field.value_json) || "Empty value"}</p><small>{labelStatus(field.section)} · {field.source}</small></div><StatusBadge status={field.status === "owner_confirmed" && !momoTruthFieldIsCurrentlyUsable(data, field.id) ? "owner_blocked" : field.status} /></article>)}
        </div>}
      </article>
      <article className="momo-panel">
        <div className="momo-panel-heading"><div><p className="eyebrow">ONBOARDING</p><h2>Evidence-based steps</h2></div><span>{data.onboarding.length}</span></div>
        {data.onboarding.length === 0 ? <EmptyState title="No onboarding steps exist." detail="A step is never treated as complete without a stored record and evidence." /> : <div className="momo-record-list">{data.onboarding.map((step) => <OnboardingStepRow key={step.id} step={step} {...props} />)}</div>}
      </article>
    </section>
    <section className="momo-panel">
      <div className="momo-panel-heading"><div><p className="eyebrow">CONFIRMATION QUEUE</p><h2>Owner proposals and Team decisions</h2></div><span>{data.confirmations.length}</span></div>
      {data.confirmations.length === 0 ? <EmptyState title="No confirmation is waiting." detail="Owner changes and confirmations appear here only after a real submission." /> : <div className="momo-record-list">{data.confirmations.map((confirmation) => {
        const presenceWithdrawal = confirmation.subject_type === "presence_profile" && confirmation.decision === "reject";
        const ownerRejection = confirmation.decision === "reject";
        return <article key={confirmation.id}><div><strong>{labelStatus(confirmation.confirmation_kind)}</strong><p>{valueText(confirmation.proposed_value) || confirmation.notes || "No proposed value"}</p><small>{labelStatus(confirmation.subject_type)} · owner decision: {labelStatus(confirmation.decision)} · {formatDate(confirmation.created_at)}</small></div><StatusBadge status={confirmation.status} />{role === "team" && confirmation.status === "pending" && <div className="momo-decision">{(["confirm", "correct"].includes(confirmation.decision || "") || ownerRejection) && <button disabled={busy} onClick={() => void run(() => reviewMomoConfirmation(confirmation, "approved"), presenceWithdrawal ? "Owner presence withdrawal approved and applied." : ownerRejection ? "Owner rejection approved and applied as a blocking state." : "Owner confirmation approved and applied.")}>{presenceWithdrawal ? "Approve withdrawal" : ownerRejection ? "Approve owner rejection" : "Approve and apply"}</button>}<button disabled={busy} onClick={() => void run(() => reviewMomoConfirmation(confirmation, "changes_requested"), ["reject", "needs_help"].includes(confirmation.decision || "") ? "Owner blocker acknowledged for follow-up." : "Changes requested from the owner.")}>{["reject", "needs_help"].includes(confirmation.decision || "") ? "Acknowledge blocker" : "Request changes"}</button></div>}</article>;
      })}</div>}
    </section>
    <section className="momo-panel">
      <div className="momo-panel-heading"><div><p className="eyebrow">PRESENCE STACK</p><h2>Verified access and public truth</h2></div><span>{data.presence.length}</span></div>
      {data.presence.length === 0 ? <EmptyState title="No presence profile is configured." detail="Google, Instagram, Facebook, website, and ordering links remain unverified." /> : <div className="momo-card-grid">{data.presence.map((profile) => <PresenceProfileCard key={profile.id} profile={profile} {...props} />)}</div>}
    </section>
    {role === "team" && <section className="momo-boundary"><strong>Owner activation handoff is prepared, not executed</strong><span>{currentOwnerTruth} of {data.truth.length} truth fields are currently owner confirmed; {currentOwnerContacts} current confirmed contacts; {currentVerifiedOnboarding} of {data.onboarding.length} onboarding steps currently verified. Client identity provisioning, outreach, and credentials remain blocked until an approved owner contact is supplied.</span><em>Zero-cost hold</em></section>}
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
  return <article className="momo-small-card">
    <div><strong>{labelStatus(profile.provider)}</strong><StatusBadge status={pending ? "pending" : contraryOwnerIntent ? "owner_blocked" : profile.access_status} /></div>
    <p>{profile.public_url || "No public URL recorded"}</p>
    <small>Truth: {labelStatus(profile.truth_status)} · checked {formatDate(profile.last_checked_at)}</small>
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
  </article>;
}

function RestaurantTruthForm({ data, role, restaurantId, busy, run }: PanelProps) {
  const current = useMemo(() => Object.fromEntries(data.truth.filter((item) => item.is_current).map((item) => [item.field_key, valueText(item.value_json)])), [data.truth]);
  const [values, setValues] = useState<Record<string, string>>(current);

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
    const changed = truthDefinitions.filter(([key]) => (values[key] || "").trim() && (values[key] || "").trim() !== (current[key] || "").trim());
    if (changed.length === 0) return;
    void run(() => saveMomoTruthRevisions({
      restaurantId,
      revisions: changed.map(([key, section]) => {
        const existing = data.truth.find((item) => item.field_key === key && item.is_current);
        const raw = values[key].trim();
        const value = storedValue(key, raw);
        return { existingId: existing?.id, existingStatus: existing?.status, fieldKey: key, section, value };
      }),
    }), "Team business truth revisions saved atomically.");
  };

  return <form className="momo-panel momo-form" onSubmit={submit}>
    <div className="momo-panel-heading"><div><p className="eyebrow">TEAM RECORD</p><h2>Restaurant profile</h2></div><StatusBadge status="team_review" /></div>
    <div className="momo-form-grid">{truthDefinitions.map(([key,, label, type]) => <label className={type === "textarea" ? "wide" : ""} key={key}>{label}{type === "textarea" ? <textarea value={values[key] || ""} onChange={(event) => setValues((previous) => ({ ...previous, [key]: event.target.value }))} rows={3} /> : type === "halal_select" ? <select value={values[key] || ""} onChange={(event) => setValues((previous) => ({ ...previous, [key]: event.target.value }))}><option value="">Select status</option><option value="yes">Yes</option><option value="no">No</option></select> : <input type={type} value={values[key] || ""} onChange={(event) => setValues((previous) => ({ ...previous, [key]: event.target.value }))} />}</label>)}</div>
    <p className="momo-form-note">Only populated, changed fields are saved. Public-use claims still require the configured Team review state.</p>
    <button className="primary-button" type="submit" disabled={busy}>{busy ? "Saving…" : "Save Team revisions"}</button>
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
      ? "Team contact record saved."
      : existing
        ? "Contact correction queued for Team review."
        : "Owner-confirmed primary contact registered.";
    void run(() => saveMomoContact({ restaurantId, existingId: existing?.id, existingStatus: existing?.status, contactKind, name, email, phone, isPrimary, role }), success);
  }}>
    <div><p className="eyebrow">CONTACTS</p><h2>Owner and responsible managers</h2></div>
    {role === "team" && <label>Kind<select value={contactKind} onChange={(event) => setContactKind(event.target.value)}><option value="owner">Owner</option><option value="primary">Primary</option><option value="manager">Manager</option><option value="secondary">Secondary</option></select></label>}
    <label>Name<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
    <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
    <label>Phone<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
    {role === "team" && <label className="momo-check"><input type="checkbox" checked={isPrimary} onChange={(event) => setIsPrimary(event.target.checked)} /><span>Primary contact</span></label>}
    <button className="secondary-button" disabled={busy || (!email.trim() && !phone.trim())}>Save contact</button>
  </form>{data.contacts.length > 0 && <div className="momo-record-list momo-contact-list">{data.contacts.map((contact) => {
    const pending = data.confirmations.some((item) => item.subject_type === "contact" && item.subject_id === contact.id && ["pending", "in_review"].includes(item.status));
    return <article key={contact.id}><div><strong>{contact.name}</strong><p>{[contact.email, contact.phone].filter(Boolean).join(" · ")}</p><small>{labelStatus(contact.contact_kind)}{contact.is_primary ? " · primary" : ""}</small></div><StatusBadge status={pending ? "pending" : contact.status} />{role === "client" && <div className="momo-decision"><button type="button" disabled={busy || pending} onClick={() => void run(() => submitMomoConfirmation({ restaurantId, subjectType: "contact", subjectId: contact.id, confirmationKind: "contact", decision: "confirm", proposedValue: { name: contact.name, email: contact.email, phone: contact.phone, isPrimary: contact.is_primary } }), "Contact confirmation queued for Team review.")}>Confirm as shown</button><button type="button" disabled={busy || pending} onClick={() => void run(() => submitMomoConfirmation({ restaurantId, subjectType: "contact", subjectId: contact.id, confirmationKind: "contact", decision: "needs_help", notes: "Owner requested help correcting this contact." }), "Contact marked as needing help.")}>Need help</button></div>}</article>;
  })}</div>}</section>;
}

function MediaPanel(props: PanelProps) {
  const { data, role, restaurantId, busy, run } = props;
  const [file, setFile] = useState<File | null>(null);
  const [rights, setRights] = useState(false);
  const [scope, setScope] = useState<string[]>(["instagram", "facebook", "google_business", "website"]);
  const [expiresAt, setExpiresAt] = useState("");
  const momoToday = momoLocalDate(new Date().toISOString());
  const invalidExpiry = Boolean(expiresAt && expiresAt < momoToday);
  return <div className="view">
    <MomoIntro eyebrow="MEDIA INTAKE + INTELLIGENCE" title="Rights before reuse" description="Every asset is private, tenant-scoped, rights-tracked, quality-reviewed, tagged, and reusable only after explicit approval." />
    <SafetyBoundary role={role} />
    {role === "client" ? <form className="momo-panel momo-upload" onSubmit={(event) => {
      event.preventDefault();
      if (!file || !rights || invalidExpiry) return;
      void run(() => uploadMomoMedia({ restaurantId, file, usageScope: scope, expiresAt }), "Media and usage rights saved for review.");
    }}>
      <div><p className="eyebrow">PRIVATE MEDIA INTAKE</p><h2>Upload Momo media</h2><p>JPG, PNG, WebP, HEIC, MP4, MOV, or WebM · maximum 100 MB.</p></div>
      <label className="momo-file">Media file<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm" onChange={(event) => setFile(event.target.files?.[0] || null)} required /></label>
      <fieldset className="momo-scope"><legend>Usage scope</legend>{[
        ["instagram", "Instagram"], ["facebook", "Facebook"], ["google_business", "Google Business Profile"],
        ["website", "Website"], ["internal", "Internal review and reporting"],
      ].map(([value, label]) => <label className="momo-check" key={value}><input type="checkbox" checked={scope.includes(value)} onChange={(event) => setScope((current) => event.target.checked ? [...current, value] : current.filter((item) => item !== value))} /><span>{label}</span></label>)}</fieldset>
      <label>Rights expiry (optional)<input type="date" min={momoToday} value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} /></label>
      <label className="momo-check"><input type="checkbox" checked={rights} onChange={(event) => setRights(event.target.checked)} required /><span>I confirm I own or have permission to provide this media for the selected Veroxa usage scopes.</span></label>
      <p className="momo-form-note">Consent text is stored as immutable attestation version <code>momo-media-rights-v1</code> with its SHA-256 fingerprint.</p>
      <button className="primary-button" disabled={busy || !file || !rights || scope.length === 0 || invalidExpiry}>{busy ? "Uploading…" : "Upload with rights record"}</button>
    </form> : <section className="momo-boundary"><strong>Owner media intake required</strong><span>Team can review, tag, classify, and record reuse only after the Momo owner uploads the asset and attests its usage rights in the client workspace.</span><em>Awaiting owner</em></section>}
    <section className="momo-panel">
      <div className="momo-panel-heading"><div><p className="eyebrow">MEDIA LIBRARY</p><h2>Real Momo assets</h2></div><span>{data.media.length}</span></div>
      {data.media.length === 0 ? <EmptyState title="No media has been uploaded." detail="Nothing is classified, approved, or reusable until a real asset and rights record exist." /> : <div className="momo-media-grid">{data.media.map((asset) => <MediaAssetCard key={asset.id} asset={asset} {...props} />)}</div>}
    </section>
  </div>;
}

function MediaAssetCard({ asset, data, role, restaurantId, busy, run }: PanelProps & { asset: MomoMediaAsset }) {
  const rights = data.mediaRights.find((item) => item.asset_id === asset.id);
  const review = data.mediaReviews.find((item) => item.asset_id === asset.id && item.is_current);
  const [quality, setQuality] = useState(review?.quality_score || 70);
  const [notes, setNotes] = useState(review?.quality_notes || "");
  const [approved, setApproved] = useState(review?.public_use_approved || false);
  const [tag, setTag] = useState("");
  const [rightsReason, setRightsReason] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const linkedTags = data.mediaAssetTags.filter((item) => item.asset_id === asset.id).map((link) => data.mediaTags.find((item) => item.id === link.tag_id)?.label).filter(Boolean);
  const approvedForReuse = mediaIsCurrentlyUsable(data, asset.id);
  const approvedForInternalReuse = mediaIsCurrentlyUsable(data, asset.id, "internal");
  return <article className="momo-media-card">
    <div className="momo-media-icon">{previewUrl ? (asset.mime_type.startsWith("video/") ? <video src={previewUrl} controls /> : <span className="momo-image-preview" style={{ backgroundImage: `url("${previewUrl.replaceAll('"', "%22")}")` }} role="img" aria-label="Private Momo media preview" />) : asset.mime_type.startsWith("video/") ? "VIDEO" : "PHOTO"}</div>
    <div className="momo-media-heading"><span><strong>{asset.display_name || asset.original_file_name || asset.storage_path.split("/").at(-1) || "Private media"}</strong><small>{Math.max(1, Math.round(asset.file_size / 1024))} KB · {formatDate(asset.created_at)}</small></span><StatusBadge status={asset.status} /></div>
    <div className="momo-facts"><span>Rights<strong>{rights ? labelStatus(rights.rights_status) : "Missing"}</strong><small>{rights?.attestation_version || "No attestation"}</small></span><span>Quality<strong>{review?.quality_score ?? "Not reviewed"}</strong></span><span>Reuse<strong>{asset.reuse_count || 0}</strong></span></div>
    {asset.storage_path && <button className="momo-preview-button" disabled={previewBusy} onClick={() => {
      setPreviewBusy(true);
      setPreviewError("");
      void getMomoMediaPreviewUrl(asset.storage_path)
        .then(setPreviewUrl)
        .catch(() => setPreviewError("The private preview link could not be opened. The asset remains private and unchanged."))
        .finally(() => setPreviewBusy(false));
    }}>{previewBusy ? "Opening…" : previewUrl ? "Refresh private preview" : "Open private preview"}</button>}
    {previewError && <p className="momo-warning" role="alert">{previewError}</p>}
    {linkedTags.length > 0 && <div className="momo-tag-row">{linkedTags.map((item) => <span key={item}>{item}</span>)}</div>}
    {role === "team" && <div className="momo-review-box">
      <label>Quality 0–100<input type="number" min={0} max={100} value={quality} onChange={(event) => setQuality(Number(event.target.value))} /></label>
      <label className="wide">Review notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} /></label>
      <label className="momo-check wide"><input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} /><span>Approved for public use</span></label>
      <button disabled={busy || !rights} onClick={() => void run(() => reviewMomoMedia({ restaurantId, assetId: asset.id, status: approved ? "approved" : "changes_requested", qualityScore: quality, qualityNotes: notes, publicUseApproved: approved }), "Media review saved.")}>Save review</button>
      <div className="momo-tag-input"><input placeholder="Add a tag" value={tag} onChange={(event) => setTag(event.target.value)} /><button disabled={busy || !tag.trim()} onClick={() => void run(() => addMomoMediaTag({ restaurantId, assetId: asset.id, label: tag }), "Media tag added.")}>Add tag</button></div>
      <button className="momo-provider-action" disabled={busy} onClick={() => void run(() => prepareMomoAiJob(restaurantId, "media_classification", "media_asset", asset.id), "Provider-neutral classification job prepared; no AI call was made.")}>Prepare deferred AI classification</button>
      <p className="momo-form-note wide">No-cost route: Team quality review plus human tags is the operational classification. The deferred AI job is recorded only as blocked and makes no provider call.</p>
      <button className="momo-provider-action" disabled={busy || !approvedForInternalReuse} onClick={() => void run(() => recordMomoMediaReuse({ restaurantId, assetId: asset.id, platform: "internal", usageKind: "internal_reference" }), "Approved media reuse recorded in the audit trail.")}>Record approved internal reuse</button>
      {approvedForReuse && !approvedForInternalReuse && <p className="momo-form-note wide">Internal reuse was not included in the owner-attested usage scopes.</p>}
    </div>}
    {role === "client" && rights?.id && rights.rights_status !== "revoked" && <div className="momo-review-box"><label className="wide">Reason to stop future use<textarea value={rightsReason} onChange={(event) => setRightsReason(event.target.value)} rows={2} placeholder="Tell Veroxa why these rights should be revoked" /></label><button className="momo-provider-action" disabled={busy || rightsReason.trim().length < 10} onClick={() => void run(() => revokeMomoMediaRights({ restaurantId, mediaRightsId: rights.id, reason: rightsReason }), "Media rights revoked immediately. New reuse and publication are blocked.")}>Revoke future media use</button><p className="momo-form-note wide">Revocation takes effect immediately and is recorded in the audit trail. It does not delete historical usage records.</p></div>}
    {!rights && <p className="momo-warning">This asset cannot be approved or reused because its rights record is missing.</p>}
  </article>;
}

type ContentWorkspaceSection = "attention" | "create" | "library";

function ContentPanel(props: PanelProps) {
  const { data, role, restaurantId, busy, run } = props;
  const [activeSection, setActiveSection] = useState<ContentWorkspaceSection>("attention");
  const [strategyTitle, setStrategyTitle] = useState("");
  const [goals, setGoals] = useState("");
  const [pillars, setPillars] = useState("");
  const [voice, setVoice] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [concept, setConcept] = useState("");
  const [caption, setCaption] = useState("");
  const [ownerRequired, setOwnerRequired] = useState(true);
  const [strategyId, setStrategyId] = useState("");
  const [mediaAssetId, setMediaAssetId] = useState("");
  const [truthInputIds, setTruthInputIds] = useState<string[]>([]);
  const [requestedPlatforms, setRequestedPlatforms] = useState<Array<"facebook" | "instagram" | "google_business">>(["facebook", "instagram", "google_business"]);
  const [pillar, setPillar] = useState<MomoManualContentPillar>(MOMO_MANUAL_CONTENT_PILLARS[0]);
  const [manualCycle, setManualCycle] = useState<MomoManualContentCycleResult | null>(null);
  const [manualCycleFingerprint, setManualCycleFingerprint] = useState("");
  const currentInputFingerprint = JSON.stringify({
    strategyId,
    mediaAssetId,
    truthInputIds: [...truthInputIds].sort(),
    requestedPlatforms: [...requestedPlatforms].sort(),
    pillar,
    draftTitle,
    concept,
    caption,
    ownerRequired,
  });
  const currentManualCycle = manualCycleFingerprint === currentInputFingerprint ? manualCycle : null;
  const confirmedTruth = data.truth.filter((item) => momoTruthFieldIsCurrentlyUsable(data, item.id) && valueText(item.value_json));
  const readyMedia = data.media.filter((item) => mediaIsCurrentlyUsable(data, item.id));
  const approvedStrategies = data.strategies.filter((item) => item.status === "approved");
  const selectedTruth = confirmedTruth.filter((item) => truthInputIds.includes(item.id));
  const selectedMedia = mediaAssetId ? readyMedia.find((item) => item.id === mediaAssetId) : undefined;
  const selectedStrategy = strategyId ? approvedStrategies.find((item) => item.id === strategyId) : undefined;
  const approvalNeedsAttention = (status: string) => ["pending", "in_review"].includes(status);
  const orderedApprovals = [...data.approvals].sort((left, right) =>
    Number(!approvalNeedsAttention(left.status)) - Number(!approvalNeedsAttention(right.status)));
  const attentionCount = data.pendingContentConfirmations.length
    + data.approvals.filter((approval) => approvalNeedsAttention(approval.status)).length;
  const libraryCount = data.contentItems.length + data.calendar.length;
  const selectionsCurrent = momoContentSelectionsAreCurrent({
    selectedTruthIds: truthInputIds,
    currentTruthIds: confirmedTruth.map((item) => item.id),
    selectedMediaId: mediaAssetId,
    currentMediaIds: readyMedia.map((item) => item.id),
    selectedStrategyId: strategyId,
    currentStrategyIds: approvedStrategies.map((item) => item.id),
  });

  const buildCurrentManualCycle = () => {
    const rights = selectedMedia ? data.mediaRights.find((item) => item.asset_id === selectedMedia.id) : null;
    const review = selectedMedia ? data.mediaReviews.find((item) => item.asset_id === selectedMedia.id && item.is_current) : null;
    return buildMomoManualContentCycle({
      workingTitle: draftTitle,
      pillar,
      internalAngle: [concept, caption].filter(Boolean).join("\n"),
      ownerConfirmedTruth: selectedTruth.map((item) => ({ id: item.id, fieldKey: item.field_key, label: labelStatus(item.field_key), value: valueText(item.value_json) })),
      requestedPlatforms,
      usePublicMedia: Boolean(mediaAssetId),
      media: selectedMedia && rights && review ? {
        id: selectedMedia.id,
        label: selectedMedia.display_name || selectedMedia.original_file_name || "Permissioned media",
        rightsStatus: rights.rights_status as "confirmed" | "pending" | "restricted" | "expired" | "revoked",
        reviewStatus: review.status as "approved" | "pending" | "in_review" | "changes_requested" | "rejected",
        publicUseApproved: review.public_use_approved,
        usageScope: jsonList(rights.usage_scope).filter((item): item is "facebook" | "instagram" | "google_business" => ["facebook", "instagram", "google_business"].includes(item)),
        expiresAt: rights.expires_at,
      } : null,
      asOf: new Date().toISOString(),
    });
  };

  const prepareManualCycle = () => {
    const result = buildCurrentManualCycle();
    setManualCycle(result);
    setManualCycleFingerprint(currentInputFingerprint);
  };
  return <div className="view">
    <MomoIntro eyebrow="AI CONTENT + APPROVAL CALENDAR" title="Prepared, reviewed, controlled" description="Strategy, captions, platform variants, approvals, and calendar entries are persistent. Runtime AI and publishing remain separate gated actions." />
    <SafetyBoundary role={role} />
    <div className="momo-content-tabs" role="tablist" aria-label="Content and approvals sections">
      <button type="button" id="content-tab-attention" role="tab" aria-selected={activeSection === "attention"} aria-controls="content-panel-attention" className={activeSection === "attention" ? "active" : ""} onClick={() => setActiveSection("attention")}><span>Needs attention</span><b>{attentionCount}</b></button>
      {role === "team" && <button type="button" id="content-tab-create" role="tab" aria-selected={activeSection === "create"} aria-controls="content-panel-create" className={activeSection === "create" ? "active" : ""} onClick={() => setActiveSection("create")}><span>Create content</span></button>}
      <button type="button" id="content-tab-library" role="tab" aria-selected={activeSection === "library"} aria-controls="content-panel-library" className={activeSection === "library" ? "active" : ""} onClick={() => setActiveSection("library")}><span>Library &amp; calendar</span><b>{libraryCount}</b></button>
    </div>
    {role === "team" && <div id="content-panel-create" className="momo-content-tabpanel" role="tabpanel" aria-labelledby="content-tab-create" hidden={activeSection !== "create"}>
    <section className="momo-split">
      <form className="momo-panel momo-form" onSubmit={(event) => {
        event.preventDefault();
        void run(() => createMomoContentStrategy({ restaurantId, title: strategyTitle, goals: goals.split(",").map((item) => item.trim()).filter(Boolean), pillars: pillars.split(",").map((item) => item.trim()).filter(Boolean), brandVoice: voice }), "Draft content strategy saved.");
      }}>
        <div className="momo-panel-heading"><div><p className="eyebrow">STRATEGY</p><h2>New strategy draft</h2></div><StatusBadge status="pending" /></div>
        <label>Title<input value={strategyTitle} onChange={(event) => setStrategyTitle(event.target.value)} required /></label>
        <label>Goals<input value={goals} onChange={(event) => setGoals(event.target.value)} placeholder="Comma separated" required /></label>
        <label>Content pillars<textarea value={pillars} onChange={(event) => setPillars(event.target.value)} rows={3} required /></label>
        <label>Brand voice snapshot<textarea value={voice} onChange={(event) => setVoice(event.target.value)} rows={3} required /></label>
        <button className="secondary-button" disabled={busy}>Save strategy draft</button>
      </form>
      <form className="momo-panel momo-form" onSubmit={(event) => {
        event.preventDefault();
        void run(async () => {
          const freshCycle = buildCurrentManualCycle();
          setManualCycle(freshCycle);
          setManualCycleFingerprint(currentInputFingerprint);
          if (!freshCycle.inputsVerified || !selectionsCurrent) throw new Error("manual_cycle_invalid");
          await createMomoContentDraft({ restaurantId, strategyId: selectedStrategy?.id, mediaAssetId: selectedMedia?.id, truthFieldIds: selectedTruth.map((item) => item.id), pillar, title: draftTitle, concept, masterCaption: caption, requiresOwnerConfirmation: ownerRequired });
        }, "Content draft saved without publishing.");
      }}>
        <div className="momo-panel-heading"><div><p className="eyebrow">NO-COST MANUAL CYCLE</p><h2>Human-written master draft</h2></div><StatusBadge status="internal_hypothesis" /></div>
        <label>Locked content pillar<select value={pillar} onChange={(event) => setPillar(event.target.value as MomoManualContentPillar)}>{MOMO_MANUAL_CONTENT_PILLARS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>Approved strategy (optional)<select value={strategyId} onChange={(event) => setStrategyId(event.target.value)}><option value="">No strategy selected</option>{approvedStrategies.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <fieldset className="momo-scope"><legend>Requested public platforms</legend>{(["facebook", "instagram", "google_business"] as const).map((target) => <label className="momo-check" key={target}><input type="checkbox" checked={requestedPlatforms.includes(target)} onChange={(event) => setRequestedPlatforms((current) => event.target.checked ? [...new Set([...current, target])] : current.filter((item) => item !== target))} /><span>{labelStatus(target)}</span></label>)}</fieldset>
        <label>Permissioned media (explicit)<select value={mediaAssetId} onChange={(event) => setMediaAssetId(event.target.value)}><option value="">Text-only internal direction</option>{readyMedia.map((item) => <option key={item.id} value={item.id}>{item.display_name || item.original_file_name || item.id}</option>)}</select></label>
        <label>Title<input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} required /></label>
        <label>Concept<textarea value={concept} onChange={(event) => setConcept(event.target.value)} rows={3} required /></label>
        <label>Master caption<textarea value={caption} onChange={(event) => setCaption(event.target.value)} rows={5} required /></label>
        <fieldset className="momo-scope"><legend>Owner-confirmed truth inputs</legend>{confirmedTruth.length === 0 ? <span>No owner-confirmed truth is available.</span> : confirmedTruth.map((item) => <label className="momo-check" key={item.id}><input type="checkbox" checked={truthInputIds.includes(item.id)} onChange={(event) => setTruthInputIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} /><span>{labelStatus(item.field_key)}</span></label>)}</fieldset>
        <label className="momo-check"><input type="checkbox" checked={ownerRequired} onChange={(event) => setOwnerRequired(event.target.checked)} /><span>Require owner confirmation</span></label>
        <button type="button" className="secondary-button" disabled={busy} onClick={prepareManualCycle}>Validate no-cost manual brief</button>
        {!selectionsCurrent && <p className="momo-warning">A selected truth field, strategy, or media record is no longer currently eligible. Re-select current evidence before validating or saving.</p>}
        {currentManualCycle && <div className={currentManualCycle.inputsVerified ? "momo-callout" : "momo-warning"}><strong>{currentManualCycle.inputsVerified ? "Inputs verified for an internal brief" : "Manual cycle remains blocked"}</strong>{currentManualCycle.issues.map((issue) => <p key={`${issue.code}:${issue.field}`}>{issue.message}</p>)}{currentManualCycle.brief && <p>Three human-editable platform skeletons prepared. Approval, publishing, and readiness remain false until the separate database gates pass.</p>}</div>}
        <button className="secondary-button" disabled={busy || !selectionsCurrent || !currentManualCycle?.inputsVerified || truthInputIds.length === 0}>Save gated content draft</button>
      </form>
    </section>
    </div>}
    <div id="content-panel-attention" className="momo-content-tabpanel" role="tabpanel" aria-labelledby="content-tab-attention" hidden={activeSection !== "attention"}>
    {role === "client" && <section className="momo-panel">
      <div className="momo-panel-heading"><div><p className="eyebrow">OWNER CONTENT CONFIRMATION</p><h2>Directions waiting for your decision</h2></div><span>{data.pendingContentConfirmations.length}</span></div>
      {data.pendingContentConfirmations.length === 0 ? <EmptyState title="No content direction needs confirmation." detail="Only Momo content that explicitly requires owner confirmation appears here." /> : <div className="momo-content-list">{data.pendingContentConfirmations.map((item) => <PendingContentConfirmationCard key={item.content_item_id} item={item} {...props} />)}</div>}
    </section>}
    {role === "team" && <section className="momo-panel">
      <div className="momo-panel-heading"><div><p className="eyebrow">STRATEGIES</p><h2>Strategy review queue</h2></div><span>{data.strategies.length}</span></div>
      {data.strategies.length === 0 ? <EmptyState title="No strategy draft exists." detail="A strategy must be persisted before Team review can be requested." /> : <div className="momo-record-list">{data.strategies.map((strategy) => {
        const approval = data.approvals.find((item) => item.subject_type === "content_strategy" && item.subject_id === strategy.id && item.approval_kind === "team_review");
        return <article key={strategy.id}><div><strong>{strategy.title}</strong><p>{jsonList(strategy.pillars).join(" · ") || "No pillars recorded"}</p></div><StatusBadge status={approval?.status || strategy.status} />{strategy.status !== "approved" && !approvalBlocksNewRequest(approval) && <button disabled={busy} onClick={() => void run(() => requestMomoApproval({ restaurantId, subjectType: "content_strategy", subjectId: strategy.id, approvalKind: "team_review" }), "Strategy review requested.")}>Request Team review</button>}</article>;
      })}</div>}
    </section>}
    <section className="momo-panel">
      <div className="momo-panel-heading"><div><p className="eyebrow">APPROVAL QUEUE</p><h2>Human decisions</h2></div><span>{data.approvals.length}</span></div>
      {data.approvals.length === 0 ? <EmptyState title="No approval requests exist." detail="No content, variant, review response, or publication is treated as approved." /> : <div className="momo-record-list">{orderedApprovals.map((approval) => <ApprovalRow key={approval.id} approval={approval} {...props} />)}</div>}
    </section>
    </div>
    <div id="content-panel-library" className="momo-content-tabpanel" role="tabpanel" aria-labelledby="content-tab-library" hidden={activeSection !== "library"}>
    {role === "team" && <section className="momo-panel">
      <div className="momo-panel-heading"><div><p className="eyebrow">INPUT PROVENANCE</p><h2>Immutable content evidence</h2></div><span>{data.contentInputs.length}</span></div>
      {data.contentInputs.length === 0 ? <EmptyState title="No gated content input has been recorded." detail="Saving a manual draft records owner-confirmed truth and permissioned-media fingerprints here; draft text alone is never treated as verified input." /> : <div className="momo-record-list">{data.contentInputs.map((entry) => <article key={entry.id}><div><strong>{labelStatus(entry.input_kind)}</strong><p>{entry.truth_field_id ? "Owner-confirmed truth snapshot" : entry.media_asset_id ? `Media rights ${entry.rights_attestation_version || "version not recorded"}` : "Recorded content input"}</p><small>Draft {entry.content_item_id.slice(0, 8)} · fingerprint {entry.input_sha256.slice(0, 12)}… · {formatDate(entry.recorded_at)}</small></div><StatusBadge status="immutable" /></article>)}</div>}
    </section>}
    <section className="momo-panel">
      <div className="momo-panel-heading"><div><p className="eyebrow">CONTENT ITEMS</p><h2>Drafts and platform variants</h2></div><span>{data.contentItems.length}</span></div>
      {data.contentItems.length === 0 ? <EmptyState title="No content draft exists." detail="AI does not generate content from missing business truth or unapproved media." /> : <div className="momo-content-list">{data.contentItems.map((item) => <ContentItemCard key={item.id} item={item} {...props} />)}</div>}
    </section>
    <section className="momo-panel">
      <div className="momo-panel-heading"><div><p className="eyebrow">CONTENT CALENDAR</p><h2>Approved schedule records</h2></div><span>{data.calendar.length}</span></div>
      {data.calendar.length === 0 ? <EmptyState title="The calendar is empty." detail="Nothing is scheduled or represented as published." /> : <div className="momo-card-grid">{data.calendar.map((entry) => <article className="momo-small-card" key={entry.id}><div><strong>{data.variants.find((item) => item.id === entry.variant_id)?.platform || "Variant"}</strong><StatusBadge status={entry.status} /></div><p>{formatZonedDate(entry.scheduled_for, entry.timezone)}</p><small>{entry.published_at ? `Published ${formatDate(entry.published_at)}` : `Not published · ${entry.timezone}`}</small></article>)}</div>}
    </section>
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

function ContentItemCard({ item, data, role, restaurantId, busy, run }: PanelProps & { item: MomoWorkspaceData["contentItems"][number] }) {
  const itemVariants = data.variants.filter((variant) => variant.content_item_id === item.id);
  const [platform, setPlatform] = useState("instagram");
  const [caption, setCaption] = useState("");
  const [scheduleVariant, setScheduleVariant] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [preflights, setPreflights] = useState<Record<string, MomoProviderPreflight>>({});
  const asPublicPlatform = (value: string) => value as "facebook" | "instagram" | "google_business";
  const itemTruthInputs = data.contentInputs
    .filter((entry) => entry.content_item_id === item.id && entry.input_kind === "owner_confirmed_truth" && entry.truth_field_id);
  const itemTruthIds = new Set(itemTruthInputs.map((entry) => entry.truth_field_id!));
  const truthInputsCurrent = itemTruthInputs.length > 0 && itemTruthInputs.every((entry) => momoTruthFieldIsCurrentlyUsable(data, entry.truth_field_id));
  const itemOwnerTruth = data.truth
    .filter((truth) => itemTruthIds.has(truth.id) && momoTruthFieldIsCurrentlyUsable(data, truth.id) && valueText(truth.value_json))
    .map((truth) => ({ id: truth.id, fieldKey: truth.field_key, label: labelStatus(truth.field_key), value: valueText(truth.value_json) }));
  const itemClaimIssues = validateMomoPlatformVariantCaption({
    caption: [item.title, item.concept, item.master_caption || ""].join("\n"),
    ownerConfirmedTruth: itemOwnerTruth,
  });
  const proposedVariantIssues = validateMomoPlatformVariantCaption({ caption, ownerConfirmedTruth: itemOwnerTruth });
  const itemHasPublishEligibleMedia = (["facebook", "instagram", "google_business"] as const)
    .some((target) => mediaIsCurrentlyUsable(data, item.primary_media_asset_id, target));
  const selectedPlatformEligible = mediaIsCurrentlyUsable(data, item.primary_media_asset_id, asPublicPlatform(platform));
  const schedulableVariants = itemVariants.filter((variant) => truthInputsCurrent && itemClaimIssues.length === 0 && variant.status === "approved"
    && mediaIsCurrentlyUsable(data, item.primary_media_asset_id, asPublicPlatform(variant.platform))
    && validateMomoPlatformVariantCaption({ caption: variant.caption, ownerConfirmedTruth: itemOwnerTruth }).length === 0);
  const selectedScheduleVariant = schedulableVariants.find((variant) => variant.id === scheduleVariant);
  return <article className="momo-content-card">
    <div className="momo-panel-heading"><div><strong>{item.title}</strong><small>{item.concept}</small></div><StatusBadge status={item.status} /></div>
    <p className="momo-caption">{item.master_caption || "No master caption recorded."}</p>
    <div className="momo-variant-list">{itemVariants.map((variant) => {
      const publishingApproval = data.approvals.find((approval) => approval.subject_id === variant.id && approval.approval_kind === "publishing" && ["content_variant", "publish"].includes(approval.subject_type));
      const provider = variant.platform === "google_business" ? "google_business" : "meta";
      const connection = data.connections.find((item) => item.provider === provider && item.status === "connected");
      const capability = requiredPublishCapability(variant.platform);
      const connectionEligible = connectionIsCurrentlyEligible(connection, capability);
      const queued = data.publishQueue.find((item) => item.variant_id === variant.id);
      const calendarEntry = data.calendar.find((entry) => entry.variant_id === variant.id && momoCalendarEntryIsCurrentApproved(entry));
      const teamReview = data.approvals.find((approval) => approval.subject_id === variant.id && approval.subject_type === "content_variant" && approval.approval_kind === "team_review");
      const variantClaimIssues = validateMomoPlatformVariantCaption({ caption: variant.caption, ownerConfirmedTruth: itemOwnerTruth });
      const publicVariantEligible = truthInputsCurrent && itemClaimIssues.length === 0 && variantClaimIssues.length === 0 && mediaIsCurrentlyUsable(data, item.primary_media_asset_id, asPublicPlatform(variant.platform));
      const scheduledMediaEligible = Boolean(calendarEntry?.scheduled_for && mediaIsCurrentlyUsable(
        data,
        item.primary_media_asset_id,
        asPublicPlatform(variant.platform),
        Date.parse(calendarEntry.scheduled_for),
      ));
      const mediaRights = data.mediaRights.find((rights) => rights.asset_id === item.primary_media_asset_id);
      const mediaReview = data.mediaReviews.find((review) => review.asset_id === item.primary_media_asset_id && review.is_current);
      const preflightKey = [variant.id, connection?.id || "none", connection?.owner_authorized_at || "none", connection?.last_verified_at || "none", capability, calendarEntry?.id || "none", calendarEntry?.scheduled_for || "none", mediaRights?.attestation_sha256 || "none", mediaRights?.valid_from || "none", mediaRights?.expires_at || "none", mediaReview?.id || "none", mediaReview?.reviewed_at || "none"].join(":");
      const preflight = preflights[preflightKey];
      return <article key={variant.id}>
        <span><strong>{labelStatus(variant.platform)}</strong><small>{variant.caption}</small></span>
        <StatusBadge status={queued?.status || teamReview?.status || variant.status} />
        {role === "team" && variant.status !== "approved" && publicVariantEligible && !approvalBlocksNewRequest(teamReview) && <button disabled={busy} onClick={() => void run(() => requestMomoApproval({ restaurantId, subjectType: "content_variant", subjectId: variant.id, approvalKind: "team_review" }), "Variant review requested.")}>Request Team review</button>}
        {role === "team" && variantClaimIssues.map((issue) => <small key={`${variant.id}:${issue.code}:${issue.field}`}>{issue.message}</small>)}
        {role === "team" && !publicVariantEligible && <small>This variant is internal-only until its attached media has current owner rights, public-use review, and matching platform scope.</small>}
        {role === "team" && variant.status === "approved" && publicVariantEligible && calendarEntry && scheduledMediaEligible && !approvalBlocksNewRequest(publishingApproval) && <button disabled={busy} onClick={() => void run(() => requestMomoApproval({ restaurantId, subjectType: "content_variant", subjectId: variant.id, approvalKind: "publishing" }), "Publishing approval requested against the exact current schedule.")}>Request publishing approval</button>}
        {role === "team" && variant.status === "approved" && publicVariantEligible && !calendarEntry && <small>A current future America/Chicago schedule is required before publishing approval.</small>}
        {role === "team" && variant.status === "approved" && publicVariantEligible && calendarEntry && !scheduledMediaEligible && <small>The attached media rights do not cover the exact scheduled publication time.</small>}
        {role === "team" && publishingApproval?.status === "approved" && publicVariantEligible && scheduledMediaEligible && calendarEntry && connectionEligible && !queued && <button disabled={busy} onClick={() => void run(async () => {
          const result = await runMomoProviderPreflight({ restaurantId, provider: provider as "meta" | "google_business", requiredCapability: capability });
          setPreflights((current) => ({ ...current, [preflightKey]: result }));
        }, `${labelStatus(capability)} no-credential preflight completed without a provider call.`)}>Run publication preflight</button>}
        {role === "team" && publishingApproval?.status === "approved" && (!calendarEntry || !publicVariantEligible || !scheduledMediaEligible || !connectionEligible) && <small>Queueing remains blocked until the exact schedule, media rights through the scheduled time, owner authorization, capability, and post-authorization verification are current.</small>}
        {preflight && <div className={preflight.allowed ? "momo-callout" : "momo-warning"}><strong>{preflight.allowed ? "Preflight passed" : "Provider execution remains blocked"}</strong><p>{jsonList(preflight.blockers).join(" · ") || "No provider authority was returned."}</p></div>}
        {role === "team" && publishingApproval?.status === "approved" && publicVariantEligible && scheduledMediaEligible && connection && connectionEligible && preflight?.allowed && !queued && calendarEntry && <button disabled={busy} onClick={() => void run(() => queueMomoPublication({ restaurantId, connectionId: connection.id, variantId: variant.id, approvalId: publishingApproval.id }), "Approved scheduled item added to the dormant provider queue. No external call has run yet.")}>Prepare dormant queue metadata</button>}
      </article>;
    })}</div>
    {role === "team" && <div className="momo-variant-form">
      <select value={platform} onChange={(event) => setPlatform(event.target.value)}><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="google_business">Google Business Profile</option></select>
      <textarea value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Platform-specific caption" rows={3} />
      <button disabled={busy || !truthInputsCurrent || item.status !== "approved" || !caption.trim() || !selectedPlatformEligible || proposedVariantIssues.length > 0 || itemClaimIssues.length > 0} onClick={() => void run(async () => {
        if (validateMomoPlatformVariantCaption({ caption, ownerConfirmedTruth: itemOwnerTruth }).length > 0) throw new Error("variant_claim_evidence_invalid");
        await createMomoPlatformVariant({ restaurantId, contentItemId: item.id, platform, caption });
      }, "Manual platform variant saved.")}>Add manual variant</button>
      {item.status !== "approved" && <p className="momo-warning">Approve the media-backed content direction before creating platform variants.</p>}
      {!truthInputsCurrent && <p className="momo-warning">A recorded owner-truth input is no longer current or has newer unresolved owner intent. Review, variants, schedules, and queueing remain blocked.</p>}
      {proposedVariantIssues.map((issue) => <p className="momo-warning" key={`proposed:${issue.code}:${issue.field}`}>{issue.message}</p>)}
      {itemClaimIssues.map((issue) => <p className="momo-warning" key={`item:${issue.code}:${issue.field}`}>The source direction is blocked: {issue.message}</p>)}
      {!selectedPlatformEligible && <p className="momo-warning">Text-only or stale-media directions remain internal. Attach currently permissioned, reviewed media with {labelStatus(platform)} scope before creating a public variant.</p>}
      <button disabled={busy} onClick={() => void run(() => prepareMomoAiJob(restaurantId, "platform_variants", "content_item", item.id), "Provider-neutral AI job prepared; no model call was made.")}>Prepare AI variants</button>
      {item.requires_owner_confirmation ? <p className="momo-warning">Awaiting owner content-direction confirmation. Team review remains blocked.</p> : !truthInputsCurrent ? <p className="momo-warning">Owner-truth provenance is stale or disputed.</p> : itemClaimIssues.length > 0 ? <p className="momo-warning">This direction contains a sensitive claim without explicit matching owner-truth support.</p> : !itemHasPublishEligibleMedia ? <p className="momo-warning">This content direction remains internal-only; Team/public review requires current permissioned media.</p> : item.status !== "approved" && !approvalBlocksNewRequest(data.approvals.find((approval) => approval.subject_type === "content_item" && approval.subject_id === item.id && approval.approval_kind === "team_review")) && <button disabled={busy} onClick={() => void run(() => requestMomoApproval({ restaurantId, subjectType: "content_item", subjectId: item.id, approvalKind: "team_review" }), "Content review requested.")}>Request Team review</button>}
      {itemVariants.length > 0 && <><select value={scheduleVariant} onChange={(event) => setScheduleVariant(event.target.value)}><option value="">Choose approved media-backed variant</option>{schedulableVariants.map((variant) => <option key={variant.id} value={variant.id}>{labelStatus(variant.platform)}</option>)}</select><input type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} /><button disabled={busy || !selectedScheduleVariant || !scheduledFor} onClick={() => void run(() => scheduleMomoVariant({ restaurantId, variantId: selectedScheduleVariant!.id, scheduledFor, timezone: "America/Chicago" }), "Calendar entry saved. Publishing remains separately gated.")}>Add to calendar</button></>}
    </div>}
  </article>;
}

function ConnectionsPanel(props: PanelProps) {
  const { data, role, restaurantId, busy, run } = props;
  const [preflights, setPreflights] = useState<Record<string, MomoProviderPreflight>>({});
  return <div className="view">
    <MomoIntro eyebrow="META + GOOGLE + LOCAL PRESENCE" title="Connections are permissions, not assumptions" description="Provider access, capabilities, owner authorization, publishing, Google checks, reviews, website/menu truth, and visibility evidence remain separately tracked." />
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
    const workLanes = [
      { key: "attention", label: "Needs attention", detail: "Approval, blocker, or failure", statuses: ["waiting_approval", "blocked", "failed"] },
      { key: "doing", label: "Doing now", detail: "Active or retrying", statuses: ["in_progress", "retrying"] },
      { key: "next", label: "Up next", detail: "Ready to begin", statuses: ["queued"] },
      { key: "done", label: "Done", detail: "Completed or closed", statuses: ["completed", "cancelled"] },
    ] as const;

    return <div className="view momo-work-view">
      <MomoIntro eyebrow="MOMO’S HOUSE SAN ANTONIO · WORK BOARD" title="What needs action now" description="Every task on this board belongs only to Momo’s House. Detailed attempts, evidence, retries, alerts, and recovery remain attached behind each simple work state." />
      <SafetyBoundary role={role} />
      {role === "team" && <form className="momo-panel momo-inline-form momo-work-create" onSubmit={(event) => {
        event.preventDefault();
        void run(() => createMomoWorkItem({ restaurantId, workType, title, description, priority: 3 }), "Momo work item queued.");
      }}><div><p className="eyebrow">ADD MOMO WORK</p><h2>Create one clear task</h2></div><label>Type<select value={workType} onChange={(event) => setWorkType(event.target.value)}><option value="onboarding">Onboarding</option><option value="truth_review">Truth review</option><option value="media">Media</option><option value="content">Content</option><option value="publishing">Publishing</option><option value="google">Google</option><option value="seo">SEO</option><option value="reviews">Reviews</option><option value="website">Website</option><option value="reporting">Reporting</option><option value="monitoring">Monitoring</option><option value="recovery">Recovery</option></select></label><label>Task title<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label><label>Useful detail<input value={description} onChange={(event) => setDescription(event.target.value)} /></label><button className="secondary-button" disabled={busy || !title.trim()}>Add to Momo board</button></form>}
      <section className="momo-work-board" aria-label="Momo’s House San Antonio work board">
        {workLanes.map((lane) => {
          const items = data.work.filter((item) => (lane.statuses as readonly string[]).includes(item.status));
          return <section className={`momo-work-lane ${lane.key}`} key={lane.key}>
            <header><span><strong>{lane.label}</strong><small>{lane.detail}</small></span><b>{items.length}</b></header>
            {items.length === 0 ? <EmptyState title={`Nothing ${lane.label.toLowerCase()}.`} detail="This lane will update from Momo’s persisted work states." /> : <div className="momo-work-grid">{items.map((item) => <WorkItemCard key={item.id} item={item} {...props} />)}</div>}
          </section>;
        })}
      </section>
      {role === "team" && <details className="momo-operations-details">
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
    <MomoIntro eyebrow="MOMO’S HOUSE SAN ANTONIO · REPORTS" title="Reviewed activity before claims" description="Weekly and monthly reports use reviewed, report-eligible Momo activity. Missing outcomes stay missing." />
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
    <MomoIntro eyebrow="FINAL MOMO READINESS GATE" title={gate?.can_activate ? "Eligible for final go / no-go review" : "Activation remains blocked"} description="This gate never infers readiness from deployment, code completion, or a partial score. Every required dimension must be verified and every blocker cleared." />
    <SafetyBoundary role={role} />
    {role === "team" && <section className="momo-panel momo-form"><div className="momo-panel-heading"><div><p className="eyebrow">STEP 7 REHEARSAL</p><h2>Derived final go / no-go evaluation</h2></div><StatusBadge status={rehearsalResult?.status || "not_evaluated"} /></div><p className="momo-form-note">This action derives a new immutable snapshot from current database records. When blockers remain, it records a rehearsal-only No-Go decision. It cannot activate Momo and exposes no Go action.</p><button className="secondary-button" disabled={busy} onClick={() => void run(async () => {
      const result = await runMomoNoGoRehearsal({ restaurantId, reason: "No-cost final rehearsal. Activation remains blocked until every required dimension and external authority is verified." });
      setRehearsalResult(result);
    }, "Readiness rehearsal recorded. No activation, provider call, owner contact, or publication occurred.")}>Run final no-go rehearsal</button>{rehearsalResult && <div className={rehearsalResult.can_activate ? "momo-callout" : "momo-warning"}><strong>{rehearsalResult.can_activate ? "All derived prerequisites passed; separate human authority is still required" : "No-Go recorded"}</strong><p>{rehearsalResult.blocker_count} blocker(s) remain. The rehearsal did not change provider, owner, publishing, or activation state.</p></div>}</section>}
    <section className={`momo-gate ${gate?.can_activate ? "pass" : "blocked"}`}>
      <div><p className="eyebrow">OVERALL STATE</p><strong>{labelStatus(gate?.overall_status || "not_evaluated")}</strong><span>{gate?.can_activate ? "All database-enforced prerequisites passed. Final human approval is still a separate decision." : "No publishing, account action, or live provider execution may begin."}</span></div>
      <article><strong>{gate?.verified_count ?? 0}</strong><span>required dimensions verified</span></article>
      <article><strong>{gate?.blocker_count ?? required.filter((item) => jsonList(item.blockers).length > 0).length}</strong><span>blocking conditions</span></article>
      <article><strong>{gate?.required_count ?? required.length}</strong><span>required dimensions</span></article>
    </section>
    {data.readiness.length === 0 ? <EmptyState title="No readiness dimensions exist." detail="Momo cannot be marked ready without persisted dimensions and a successful database gate." /> : <section className="momo-readiness-grid">{data.readiness.map((dimension) => <article key={dimension.id}><div><h2>{dimension.label}</h2><StatusBadge status={dimension.status} /></div><section><p className="eyebrow">EVIDENCE</p>{jsonList(dimension.evidence).length ? <ul>{jsonList(dimension.evidence).map((item) => <li key={item}>{item}</li>)}</ul> : <p>No evidence recorded.</p>}</section><section className="momo-blockers"><p className="eyebrow">BLOCKERS</p>{jsonList(dimension.blockers).length ? <ul>{jsonList(dimension.blockers).map((item) => <li key={item}>{item}</li>)}</ul> : <p>No blocker recorded.</p>}</section><small>Last updated {formatDate(dimension.updated_at)}</small></article>)}</section>}
    {role === "team" && <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">ACTIVATION DECISION HISTORY</p><h2>Immutable go / no-go evidence</h2></div><span>{data.activationDecisions.length}</span></div>{data.activationDecisions.length === 0 ? <EmptyState title="No activation decision has been recorded." detail="A no-cost rehearsal writes only a No-Go when blockers remain; no Go action is exposed." /> : <div className="momo-record-list">{data.activationDecisions.map((decision) => <article key={decision.id}><div><strong>{labelStatus(decision.decision)}</strong><p>{decision.reason}</p><small>{labelStatus(decision.mode)} · {formatDate(decision.decided_at)}</small></div><StatusBadge status={decision.decision} /></article>)}</div>}</section>}
    <section className="momo-boundary"><strong>No readiness percentage is calculated</strong><span>The final gate is pass/fail. A count is shown for evidence, but partial completion is never converted into a readiness percentage. Other restaurants remain Restaurant Audit Center records only.</span><em>{gate?.can_activate ? "Review required" : "Blocked"}</em></section>
  </div>;
}

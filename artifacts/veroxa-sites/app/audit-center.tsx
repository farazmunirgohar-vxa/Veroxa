"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  AUDIT_ONBOARDING_CONSENT_TEXT,
  addAuditFinding,
  addAuditNote,
  completeGeneratedAuditRun,
  convertReviewedAuditToPendingProfile,
  createTeamAudit,
  getAuditReport,
  listAuditFindings,
  listAuditQueue,
  saveGeneratedAudit,
  saveGeneratedAuditRerun,
  saveAuditReport,
  updateAuditRequestStatus,
  updateAuditRun,
  type AuditFinding,
  type AuditFindingSeverity,
  type AuditQueueRecord,
  type AuditReport,
  type AuditRequestStatus,
  type AuditRun,
  type AuditRunStatus,
  type GeneratedAuditFindingInput,
} from "./veroxa-supabase";
import {
  RESTAURANT_AUDIT_CATEGORY_DEFINITIONS,
  generateRestaurantAuditSnapshot,
  parseRestaurantAuditSnapshot,
  type RestaurantAuditCategoryKey,
  type RestaurantAuditSignalStatus,
  type RestaurantAuditSnapshot,
} from "./restaurant-audit-engine";

const requestStatuses: { value: AuditRequestStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "in_review", label: "In review" },
  { value: "waiting_on_research", label: "Waiting on research" },
  { value: "ready_for_review", label: "Ready for review" },
  { value: "reviewed", label: "Reviewed" },
  { value: "archived", label: "Archived" },
];

const findingSeverities: AuditFindingSeverity[] = [
  "opportunity",
  "low",
  "medium",
  "high",
  "critical",
];

function latestRun(record: AuditQueueRecord | null): AuditRun | null {
  if (!record?.audit_runs?.length) return null;
  return [...record.audit_runs].sort((a, b) => b.run_number - a.run_number)[0];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

type AuditBuilderSignal = {
  status: RestaurantAuditSignalStatus;
  evidenceUrl: string;
  note: string;
};

type AuditBuilderState = {
  restaurantName: string;
  city: string;
  state: string;
  websiteUrl: string;
  googleProfileUrl: string;
  teamNote: string;
  comparisonSummary: string;
  categories: Record<RestaurantAuditCategoryKey, AuditBuilderSignal>;
};

type AuditBuilderTarget =
  | { kind: "new" }
  | { kind: "existing"; requestId: string; runId: string }
  | { kind: "rerun"; requestId: string; previousRunId: string };

function emptyAuditSignals(): Record<RestaurantAuditCategoryKey, AuditBuilderSignal> {
  return Object.fromEntries(
    RESTAURANT_AUDIT_CATEGORY_DEFINITIONS.map((category) => [
      category.key,
      { status: "unknown", evidenceUrl: "", note: "" },
    ]),
  ) as Record<RestaurantAuditCategoryKey, AuditBuilderSignal>;
}

function emptyAuditBuilder(): AuditBuilderState {
  return {
    restaurantName: "",
    city: "",
    state: "",
    websiteUrl: "",
    googleProfileUrl: "",
    teamNote: "",
    comparisonSummary: "",
    categories: emptyAuditSignals(),
  };
}

function validHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function auditScoreStyle(score: number): CSSProperties {
  const safeScore = Math.max(0, Math.min(100, score));
  return { "--audit-score": `${safeScore}%` } as CSSProperties;
}

function generatedAuditPayload(snapshot: RestaurantAuditSnapshot, restaurantName: string) {
  const opportunities = snapshot.improvementAreas.length
    ? snapshot.improvementAreas.map((item) => item.label).join(", ")
    : "no confirmed priority gap in the supplied evidence";
  const executiveSummary = `${restaurantName} has a provisional online-presence score of ${snapshot.overallScore}/100 with ${snapshot.evidenceCoverage}% evidence coverage (${snapshot.confidence} confidence). The current priority areas are ${opportunities}. Team review remains required before this audit is final.`;
  const priorityActions = [
    `Days 0–30: ${snapshot.plan.days_0_30.join(" ")}`,
    `Days 31–60: ${snapshot.plan.days_31_60.join(" ")}`,
    `Days 61–90: ${snapshot.plan.days_61_90.join(" ")}`,
  ].join("\n\n");
  const categories = new Map(snapshot.categories.map((category) => [category.key, category]));
  const findings: GeneratedAuditFindingInput[] = snapshot.improvementAreas
    .filter((item) => item.kind === "confirmed_gap")
    .map((item) => {
      const category = categories.get(item.key);
      return {
        category: item.label,
        severity: item.potentialPoints >= 20 ? "high" : "medium",
        title: item.summary,
        summary: category?.note || item.summary,
        evidenceUrl: category?.evidenceUrl || "",
        evidenceLabel: `${item.label} evidence`,
        recommendedAction: item.recommendedAction,
      };
    });
  return { snapshot, findings, executiveSummary, priorityActions };
}

export function RestaurantAuditCenter({
  notify,
}: {
  notify: (message: string) => void;
}) {
  const [queue, setQueue] = useState<AuditQueueRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [previousFindings, setPreviousFindings] = useState<AuditFinding[]>([]);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showGenerator, setShowGenerator] = useState(true);
  const [builder, setBuilder] = useState<AuditBuilderState>(() => emptyAuditBuilder());
  const [builderTarget, setBuilderTarget] = useState<AuditBuilderTarget>({ kind: "new" });
  const [preview, setPreview] = useState<RestaurantAuditSnapshot | null>(null);
  const [previewSaveKey, setPreviewSaveKey] = useState("");
  const [onboardingConsent, setOnboardingConsent] = useState(false);
  const [onboardingChannel, setOnboardingChannel] = useState<"written" | "email" | "signed_form" | "recorded_call">("written");
  const [onboardingEvidence, setOnboardingEvidence] = useState("");
  const [onboardingTargetKey, setOnboardingTargetKey] = useState("");
  const [note, setNote] = useState("");
  const [comparison, setComparison] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [reportSummary, setReportSummary] = useState("");
  const [reportActions, setReportActions] = useState("");
  const [loadedComparison, setLoadedComparison] = useState("");
  const [loadedFailureReason, setLoadedFailureReason] = useState("");
  const [loadedReportSummary, setLoadedReportSummary] = useState("");
  const [loadedReportActions, setLoadedReportActions] = useState("");
  const [finding, setFinding] = useState({
    category: "Google Business Profile",
    severity: "opportunity" as AuditFindingSeverity,
    title: "",
    summary: "",
    evidenceUrl: "",
    evidenceLabel: "",
    recommendedAction: "",
  });

  const selected = useMemo(
    () => queue.find((item) => item.id === selectedId) || queue[0] || null,
    [queue, selectedId],
  );
  const runs = useMemo(
    () => [...(selected?.audit_runs || [])].sort((a, b) => b.run_number - a.run_number),
    [selected],
  );
  const run = runs.find((item) => item.id === selectedRunId) || runs[0] || null;
  const savedSnapshot = parseRestaurantAuditSnapshot(run?.score_snapshot);
  const isLatestSelectedRun = Boolean(run && run.id === runs[0]?.id);
  const builderTargetMatchesCurrentSelection = builderTarget.kind === "new"
    ? true
    : Boolean(
      selected
        && run
        && isLatestSelectedRun
        && builderTarget.requestId === selected.id
        && (builderTarget.kind === "existing"
          ? builderTarget.runId === run.id
          : builderTarget.previousRunId === run.id),
    );
  const currentOnboardingTargetKey = selected && run && isLatestSelectedRun
    ? `${selected.id}:${run.id}`
    : "";
  const onboardingDraftMatchesCurrentTarget = Boolean(
    currentOnboardingTargetKey && onboardingTargetKey === currentOnboardingTargetKey,
  );
  const hasSavedSnapshotEvidence = Boolean(
    savedSnapshot?.categories.some(
      (category) => category.status !== "unknown" && category.evidenceUrl,
    ),
  );
  const previousRun = run?.previous_run_id
    ? runs.find((item) => item.id === run.previous_run_id) || null
    : runs.find((item) => item.run_number === (run?.run_number || 0) - 1) || null;
  const runRef = useRef(run);
  const previousRunRef = useRef(previousRun);
  const hasFindingDraft = Boolean(
    finding.title.trim() ||
      finding.summary.trim() ||
      finding.evidenceUrl.trim() ||
      finding.evidenceLabel.trim() ||
      finding.recommendedAction.trim(),
  );
  const hasBuilderDraft = Boolean(
    builder.restaurantName.trim()
      || builder.city.trim()
      || builder.state.trim()
      || builder.websiteUrl.trim()
      || builder.googleProfileUrl.trim()
      || builder.teamNote.trim()
      || builder.comparisonSummary.trim()
      || Object.values(builder.categories).some((item) =>
        item.status !== "unknown" || item.evidenceUrl.trim() || item.note.trim(),
      )
  );
  const hasUnsavedDetail = Boolean(
    preview ||
      hasBuilderDraft ||
      onboardingConsent ||
      onboardingEvidence.trim() ||
      onboardingChannel !== "written" ||
    note.trim() ||
      hasFindingDraft ||
      comparison !== loadedComparison ||
      failureReason !== loadedFailureReason ||
      reportSummary !== loadedReportSummary ||
      reportActions !== loadedReportActions,
  );
  const comparisonStats = useMemo(() => {
    const key = (item: AuditFinding) => `${item.category.trim().toLowerCase()}::${item.title.trim().toLowerCase()}`;
    const currentKeys = new Set(findings.map(key));
    const previousKeys = new Set(previousFindings.map(key));
    return {
      added: findings.filter((item) => !previousKeys.has(key(item))).length,
      resolved: previousFindings.filter((item) => !currentKeys.has(key(item))).length,
      currentEvidence: findings.filter((item) => item.evidence_url).length,
      previousEvidence: previousFindings.filter((item) => item.evidence_url).length,
    };
  }, [findings, previousFindings]);
  const submittedWebsite = typeof run?.source_snapshot?.website_url === "string" ? run.source_snapshot.website_url : "";
  const submittedGoogle = typeof run?.source_snapshot?.google_profile_url === "string" ? run.source_snapshot.google_profile_url : "";

  const confirmDiscardDetail = useCallback(() => {
    if (!hasUnsavedDetail) return true;
    return window.confirm("Discard the unsaved notes and draft changes for this audit?");
  }, [hasUnsavedDetail]);

  const refresh = useCallback(async (keepSelected = true) => {
    setLoading(true);
    setError("");
    try {
      const rows = await listAuditQueue();
      setQueue(rows);
      setSelectedId((current) =>
        keepSelected && current && rows.some((row) => row.id === current)
          ? current
          : rows[0]?.id || null,
      );
    } catch {
      setError("The Audit Center could not load. Check Team access and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(false), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    runRef.current = run;
    previousRunRef.current = previousRun;
  }, [run, previousRun]);

  useEffect(() => {
    const activeRun = runRef.current;
    const activePreviousRun = previousRunRef.current;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setDetailLoading(Boolean(activeRun));
      setFindings([]);
      setPreviousFindings([]);
      setReport(null);
      setNote("");
      setFinding({
        category: "Google Business Profile",
        severity: "opportunity",
        title: "",
        summary: "",
        evidenceUrl: "",
        evidenceLabel: "",
        recommendedAction: "",
      });
      const nextComparison = activeRun?.comparison_summary || "";
      const nextFailureReason = activeRun?.failure_reason || "";
      setComparison(nextComparison);
      setLoadedComparison(nextComparison);
      setFailureReason(nextFailureReason);
      setLoadedFailureReason(nextFailureReason);
      setReportSummary("");
      setReportActions("");
      setLoadedReportSummary("");
      setLoadedReportActions("");
      if (!activeRun) {
        setDetailLoading(false);
        return;
      }
      void Promise.all([
        listAuditFindings(activeRun.id),
        getAuditReport(activeRun.id),
        activePreviousRun ? listAuditFindings(activePreviousRun.id) : Promise.resolve([]),
      ])
        .then(([nextFindings, nextReport, nextPreviousFindings]) => {
          if (cancelled) return;
          setFindings(nextFindings);
          setPreviousFindings(nextPreviousFindings);
          setReport(nextReport);
          const nextSummary = nextReport?.executive_summary || "";
          const nextActions = nextReport?.priority_actions || "";
          setReportSummary(nextSummary);
          setReportActions(nextActions);
          setLoadedReportSummary(nextSummary);
          setLoadedReportActions(nextActions);
        })
        .catch(() => {
          if (!cancelled) setError("This audit’s findings or report could not load. Refresh the Audit Center to try again.");
        })
        .finally(() => {
          if (!cancelled) setDetailLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [run?.id, previousRun?.id]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedDetail) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedDetail]);

  async function runAction(action: () => Promise<void>, success: string): Promise<boolean> {
    setBusy(true);
    setError("");
    try {
      await action();
      await refresh();
      notify(success);
      return true;
    } catch {
      setError("That change could not be saved. Your draft is still here; check your connection and Team access, then try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function resetGeneratedAuditDraft(show = false) {
    setBuilder(emptyAuditBuilder());
    setBuilderTarget({ kind: "new" });
    setPreview(null);
    setPreviewSaveKey("");
    setShowGenerator(show);
  }

  function resetOnboardingDraft() {
    setOnboardingConsent(false);
    setOnboardingChannel("written");
    setOnboardingEvidence("");
    setOnboardingTargetKey("");
  }

  function updateOnboardingDraft(update: {
    consent?: boolean;
    channel?: typeof onboardingChannel;
    evidence?: string;
  }) {
    if (!currentOnboardingTargetKey) return;
    const carriesCurrentTarget = onboardingTargetKey === currentOnboardingTargetKey;
    setOnboardingTargetKey(currentOnboardingTargetKey);
    setOnboardingConsent(
      update.consent ?? (carriesCurrentTarget ? onboardingConsent : false),
    );
    setOnboardingChannel(
      update.channel ?? (carriesCurrentTarget ? onboardingChannel : "written"),
    );
    setOnboardingEvidence(
      update.evidence ?? (carriesCurrentTarget ? onboardingEvidence : ""),
    );
  }

  function updateBuilderSignal(
    key: RestaurantAuditCategoryKey,
    update: Partial<AuditBuilderSignal>,
  ) {
    setBuilder((current) => ({
      ...current,
      categories: {
        ...current.categories,
        [key]: { ...current.categories[key], ...update },
      },
    }));
    setPreview(null);
    setPreviewSaveKey("");
  }

  function startNewGeneratedAudit() {
    if (busy) return;
    if (!confirmDiscardDetail()) return;
    resetGeneratedAuditDraft(true);
    resetOnboardingDraft();
    setError("");
  }

  function startGeneratedAuditForSelected() {
    if (!selected || !run || detailLoading) return;
    if (run.id !== runs[0]?.id) {
      setError("Select the latest audit run before generating or comparing an audit.");
      return;
    }
    if (!confirmDiscardDetail()) return;
    const isEmptyRun = ["queued", "in_progress"].includes(run.status)
      && !savedSnapshot
      && findings.length === 0
      && !report;
    const isReviewedRerun = run.status === "reviewed" && report?.status === "reviewed";
    if (!isEmptyRun && !isReviewedRerun) {
      setError("Finish or archive the current audit before starting another generated run for this restaurant.");
      return;
    }
    const signals = emptyAuditSignals();
    if (selected.audit_restaurants.google_profile_url) {
      signals.google_business_profile.evidenceUrl = selected.audit_restaurants.google_profile_url;
    }
    if (selected.audit_restaurants.website_url) {
      signals.website_experience.evidenceUrl = selected.audit_restaurants.website_url;
      signals.menu_and_ordering.evidenceUrl = selected.audit_restaurants.website_url;
      signals.local_search_consistency.evidenceUrl = selected.audit_restaurants.website_url;
    }
    setBuilder({
      ...emptyAuditBuilder(),
      restaurantName: selected.audit_restaurants.restaurant_name,
      city: selected.audit_restaurants.city,
      state: selected.audit_restaurants.state,
      websiteUrl: selected.audit_restaurants.website_url || "",
      googleProfileUrl: selected.audit_restaurants.google_profile_url || "",
      categories: signals,
    });
    setBuilderTarget(isReviewedRerun
      ? { kind: "rerun", requestId: selected.id, previousRunId: run.id }
      : { kind: "existing", requestId: selected.id, runId: run.id });
    setPreview(null);
    setPreviewSaveKey("");
    setShowGenerator(true);
    resetOnboardingDraft();
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function generatePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (
      builder.restaurantName.trim().length < 2
      || builder.city.trim().length < 2
      || builder.state.trim().length < 2
    ) {
      setError("Restaurant name, city, and state are required before generating an audit.");
      return;
    }
    if (builder.websiteUrl.trim() && !validHttpUrl(builder.websiteUrl.trim())) {
      setError("Enter a complete http:// or https:// website URL.");
      return;
    }
    if (builder.googleProfileUrl.trim() && !validHttpUrl(builder.googleProfileUrl.trim())) {
      setError("Enter a complete http:// or https:// Google profile URL.");
      return;
    }
    const reviewedSignals = Object.values(builder.categories).filter((item) => item.status !== "unknown");
    if (reviewedSignals.length === 0) {
      setError("Review at least one audit area before generating the provisional score.");
      return;
    }
    if (reviewedSignals.some((item) => !validHttpUrl(item.evidenceUrl.trim()))) {
      setError("Every confirmed present or confirmed missing signal needs a source URL.");
      return;
    }
    if (builderTarget.kind === "rerun" && builder.comparisonSummary.trim().length < 10) {
      setError("A re-audit needs a specific comparison note of at least 10 characters.");
      return;
    }
    const snapshot = generateRestaurantAuditSnapshot({
      generatedAt: new Date().toISOString(),
      categories: Object.fromEntries(
        RESTAURANT_AUDIT_CATEGORY_DEFINITIONS.map((category) => [
          category.key,
          {
            status: builder.categories[category.key].status,
            evidenceUrl: builder.categories[category.key].evidenceUrl,
            note: builder.categories[category.key].note,
          },
        ]),
      ),
    });
    setPreview(snapshot);
    setPreviewSaveKey(crypto.randomUUID());
  }

  async function saveGeneratedPreview() {
    if (!preview || !previewSaveKey) return;
    if (!builderTargetMatchesCurrentSelection) {
      setError("This generated audit draft no longer matches the selected restaurant and run. Start it again from the latest run.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = {
        ...generatedAuditPayload(preview, builder.restaurantName.trim()),
        saveKey: previewSaveKey,
      };
      const saved = builderTarget.kind === "new"
        ? await saveGeneratedAudit({
          ...payload,
          restaurantName: builder.restaurantName,
          city: builder.city,
          state: builder.state,
          websiteUrl: builder.websiteUrl,
          googleProfileUrl: builder.googleProfileUrl,
          teamNote: builder.teamNote,
        })
        : builderTarget.kind === "existing"
          ? await completeGeneratedAuditRun(builderTarget.runId, payload)
          : await saveGeneratedAuditRerun(
            builderTarget.requestId,
            builderTarget.previousRunId,
            { ...payload, comparisonSummary: builder.comparisonSummary },
          );
      await refresh(false);
      setSelectedId(saved.request_id);
      setSelectedRunId(saved.run_id);
      resetGeneratedAuditDraft(false);
      resetOnboardingDraft();
      notify(`Audit ${saved.reference_code} saved for Team review`);
    } catch {
      setError("The audit could not be saved. The preview is still here; check Team access and try again.");
    } finally {
      setBusy(false);
    }
  }

  function discardGeneratedPreview() {
    resetGeneratedAuditDraft(false);
    notify("Unsaved audit discarded; no generated audit result was written");
  }

  async function prepareOnboardingProfile() {
    if (
      !selected
      || !run
      || run.id !== runs[0]?.id
      || !onboardingDraftMatchesCurrentTarget
      || !onboardingConsent
      || onboardingEvidence.trim().length < 10
    ) return;
    setBusy(true);
    setError("");
    try {
      await convertReviewedAuditToPendingProfile({
        requestId: selected.id,
        consentChannel: onboardingChannel,
        consentEvidenceReference: onboardingEvidence,
        consentedAt: new Date().toISOString(),
        idempotencyKey: crypto.randomUUID(),
      });
      resetOnboardingDraft();
      notify("Pending restaurant profile prepared from the reviewed audit");
    } catch {
      setError("The pending profile could not be prepared. Confirm the latest audit and report are reviewed and the onboarding consent evidence is complete.");
    } finally {
      setBusy(false);
    }
  }

  async function handleManualAudit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    await runAction(async () => {
      const created = await createTeamAudit({
        restaurantName: String(form.get("restaurantName") || ""),
        city: String(form.get("city") || ""),
        state: String(form.get("state") || ""),
        websiteUrl: String(form.get("websiteUrl") || ""),
        googleProfileUrl: String(form.get("googleProfileUrl") || ""),
        contactEmail: String(form.get("contactEmail") || ""),
        contactPhone: String(form.get("contactPhone") || ""),
        teamNote: String(form.get("teamNote") || ""),
      });
      setSelectedId(created.request_id);
      setSelectedRunId(null);
      setShowManual(false);
      formElement.reset();
    }, "Non-client audit record created");
  }

  async function handleFinding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!run) return;
    await runAction(async () => {
      await addAuditFinding(run.id, finding);
      setFindings(await listAuditFindings(run.id));
      setFinding((current) => ({
        ...current,
        title: "",
        summary: "",
        evidenceUrl: "",
        evidenceLabel: "",
        recommendedAction: "",
      }));
    }, "Finding saved with its evidence");
  }

  async function saveNote() {
    if (!selected || !note.trim()) return;
    await runAction(async () => {
      await addAuditNote(selected.id, note);
      setNote("");
    }, "Internal audit note saved");
  }

  async function saveRunState(status: AuditRunStatus) {
    if (!run) return;
    const saved = await runAction(
      () => updateAuditRun(run.id, { status, comparisonSummary: comparison, failureReason }),
      `Audit run marked ${status.replaceAll("_", " ")}`,
    );
    if (!saved) return;
    setLoadedComparison(comparison);
    setLoadedFailureReason(status === "failed" ? failureReason : "");
    if (status !== "failed") setFailureReason("");
  }

  async function saveReportState(status: AuditReport["status"]) {
    if (!run) return;
    await runAction(
      async () => {
        await saveAuditReport(run.id, {
          status,
          executiveSummary: reportSummary,
          priorityActions: reportActions,
        });
        const savedReport = await getAuditReport(run.id);
        setReport(savedReport);
        const savedSummary = savedReport?.executive_summary || reportSummary;
        const savedActions = savedReport?.priority_actions || reportActions;
        setReportSummary(savedSummary);
        setReportActions(savedActions);
        setLoadedReportSummary(savedSummary);
        setLoadedReportActions(savedActions);
      },
      status === "reviewed" ? "Audit report reviewed and locked" : "Audit report saved",
    );
  }

  const openCount = queue.filter((item) => !["reviewed", "archived"].includes(item.status)).length;
  const reviewedCount = queue.filter((item) => item.status === "reviewed").length;
  const publicCount = queue.filter((item) => item.source === "public_intake").length;

  return (
    <div className="view audit-center-view">
      <div className="page-intro">
        <div>
          <p className="eyebrow">NON-CLIENT RESTAURANT AUDITS</p>
          <h1>Restaurant Audit Center</h1>
          <p>Run, save, compare, and review honest online-presence audits without creating another operational client workspace.</p>
        </div>
        <div className="intro-actions">
          <button className="secondary-button" onClick={() => void refresh()} disabled={loading || busy}>Refresh</button>
          <button className="primary-button" onClick={startNewGeneratedAudit} disabled={busy}>Run new audit</button>
        </div>
      </div>

      <section className="team-guardrail audit-guardrail">
        <span className="audit-shield">✓</span>
        <div><strong>Audit-only boundary</strong><span>These are Team-owned prospect records. No client account, onboarding, Momo workspace, publishing, media, or operational reporting is created automatically.</span></div>
        <em>RLS protected</em>
      </section>

      {showGenerator && <section className="panel audit-generator" aria-label="Generate a restaurant audit">
        <div className="panel-heading">
          <div><p className="eyebrow">GENERATE → PREVIEW → SAVE OR DISCARD</p><h2>{builderTarget.kind === "rerun" ? "Run a comparison audit" : builderTarget.kind === "existing" ? "Complete this audit record" : "Run a restaurant audit"}</h2><p>No database record is created or changed until you choose Save audit.</p></div>
          <button type="button" className="text-button" disabled={busy} onClick={() => {
            if ((preview || hasBuilderDraft) && !window.confirm("Discard this unsaved generated audit?")) return;
            resetGeneratedAuditDraft(false);
          }}>Close</button>
        </div>
        <form onSubmit={generatePreview}>
          <div className="audit-field-grid audit-identity-grid">
            <label>Restaurant name<input required minLength={2} value={builder.restaurantName} onChange={(event) => { setBuilder((current) => ({ ...current, restaurantName: event.target.value })); setPreview(null); }}/></label>
            <label>City<input required minLength={2} value={builder.city} onChange={(event) => { setBuilder((current) => ({ ...current, city: event.target.value })); setPreview(null); }}/></label>
            <label>State<input required minLength={2} value={builder.state} onChange={(event) => { setBuilder((current) => ({ ...current, state: event.target.value })); setPreview(null); }}/></label>
            <label>Website<input type="url" placeholder="https://" value={builder.websiteUrl} onChange={(event) => { setBuilder((current) => ({ ...current, websiteUrl: event.target.value })); setPreview(null); }}/></label>
            <label>Google profile<input type="url" placeholder="https://" value={builder.googleProfileUrl} onChange={(event) => { setBuilder((current) => ({ ...current, googleProfileUrl: event.target.value })); setPreview(null); }}/></label>
            <label>Team note<input value={builder.teamNote} onChange={(event) => { setBuilder((current) => ({ ...current, teamNote: event.target.value })); setPreview(null); }} placeholder="Optional internal context"/></label>
            {builderTarget.kind === "rerun" && <label className="wide">What changed since the reviewed audit?<textarea required minLength={10} rows={2} value={builder.comparisonSummary} onChange={(event) => { setBuilder((current) => ({ ...current, comparisonSummary: event.target.value })); setPreview(null); }}/></label>}
          </div>

          <div className="audit-signal-grid">
            {RESTAURANT_AUDIT_CATEGORY_DEFINITIONS.map((category) => {
              const signal = builder.categories[category.key];
              return <fieldset key={category.key} className={`audit-signal-card signal-${signal.status}`}>
                <legend>{category.label}<span>{category.weight} points</span></legend>
                <label>Observed state<select value={signal.status} onChange={(event) => updateBuilderSignal(category.key, { status: event.target.value as RestaurantAuditSignalStatus })}><option value="unknown">Unknown / verify</option><option value="confirmed_present">Confirmed present</option><option value="confirmed_missing">Confirmed missing or weak</option></select></label>
                <label>Source URL<input type="url" required={signal.status !== "unknown"} value={signal.evidenceUrl} onChange={(event) => updateBuilderSignal(category.key, { evidenceUrl: event.target.value })} placeholder={signal.status === "unknown" ? "Optional until verified" : "https:// source checked"}/></label>
                <label>Observation<textarea rows={2} value={signal.note} onChange={(event) => updateBuilderSignal(category.key, { note: event.target.value })} placeholder="What did you observe?"/></label>
              </fieldset>;
            })}
          </div>
          <div className="audit-generate-actions"><span>Unknown areas lower evidence coverage and are never presented as confirmed problems.</span><button className="primary-button" disabled={busy}>Generate audit preview</button></div>
        </form>
      </section>}

      {preview && <section className="panel audit-generated-preview" aria-label="Unsaved generated audit preview">
        <div className="audit-preview-banner"><span>UNSAVED PREVIEW</span><strong>Review this result, then Save or Discard.</strong></div>
        <div className="audit-score-hero">
          <div className="audit-score-value" style={auditScoreStyle(preview.overallScore)}><strong>{preview.overallScore}</strong><span>/100</span></div>
          <div><p className="eyebrow">PROVISIONAL ONLINE-PRESENCE SCORE</p><h2>{builder.restaurantName || "Restaurant audit"}</h2><p>{preview.evidenceCoverage}% evidence coverage · {preview.confidence} confidence</p><p><strong>Room to improve:</strong> {100 - preview.overallScore} points across confirmed gaps and still-unverified areas.</p></div>
        </div>
        <div className="audit-preview-section"><div className="panel-heading"><div><p className="eyebrow">ROOM FOR IMPROVEMENT</p><h3>Top priorities</h3></div></div><div className="audit-improvement-grid">{preview.improvementAreas.length ? preview.improvementAreas.map((item) => <article key={item.key}><span>{item.kind === "confirmed_gap" ? "Confirmed gap" : "Verify first"}</span><strong>{item.label}</strong><p>{item.summary}</p><small>Up to {item.potentialPoints} points · {item.priority} priority</small></article>) : <article><span>Maintain</span><strong>No gap confirmed</strong><p>Keep the evidence current and compare again in 60–90 days.</p></article>}</div></div>
        <div className="audit-preview-section"><div className="panel-heading"><div><p className="eyebrow">WHAT VEROXA FIXES FIRST</p><h3>First actions</h3></div></div><ol className="audit-fix-list">{preview.fixFirst.length ? preview.fixFirst.map((item) => <li key={item.key}><strong>{item.title}</strong><span>{item.action}</span></li>) : <li><strong>Maintain the verified baseline</strong><span>Recheck sources before any future recommendation.</span></li>}</ol></div>
        <div className="audit-plan-grid">
          <article><span>0–30 days</span><strong>Verify and correct</strong><ul>{preview.plan.days_0_30.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article><span>31–60 days</span><strong>Recheck execution</strong><ul>{preview.plan.days_31_60.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article><span>61–90 days</span><strong>Compare and refine</strong><ul>{preview.plan.days_61_90.map((item) => <li key={item}>{item}</li>)}</ul></article>
        </div>
        <details className="audit-breakdown"><summary>Full score breakdown</summary><div>{preview.categories.map((category) => <p key={category.key}><span>{category.label}<small>{category.status.replaceAll("_", " ")}</small></span><strong>{category.score}/{category.weight}</strong></p>)}</div></details>
        <p className="audit-honesty-note">{preview.honestyNote}</p>
        <div className="audit-preview-actions"><button type="button" className="secondary-button audit-discard-button" onClick={discardGeneratedPreview} disabled={busy}>Discard</button><button type="button" className="primary-button" onClick={() => void saveGeneratedPreview()} disabled={busy || !builderTargetMatchesCurrentSelection}>{busy ? "Saving audit…" : "Save audit"}</button></div>
      </section>}

      <section className="metric-row audit-metrics" aria-label="Metrics for the currently loaded audit records">
        <article className="metric-card"><span>Open loaded audits</span><strong>{openCount}</strong><small>Team action in this loaded set</small></article>
        <article className="metric-card"><span>Public loaded audits</span><strong>{publicCount}</strong><small>Public submissions in this loaded set</small></article>
        <article className="metric-card"><span>Reviewed loaded audits</span><strong>{reviewedCount}</strong><small>Reviewed records in this loaded set</small></article>
        <article className="metric-card"><span>Loaded records</span><strong>{queue.length}</strong><small>Up to 100 non-client audits</small></article>
      </section>

      <div className="audit-advanced-toggle"><button type="button" className="text-button" onClick={() => setShowManual((value) => !value)}>{showManual ? "Close manual intake" : "Advanced: create a blank manual audit record"}</button></div>

      {showManual && (
        <form className="panel audit-manual-form" onSubmit={handleManualAudit}>
          <div className="panel-heading"><div><p className="eyebrow">TEAM-OWNED INTAKE</p><h2>Add a non-client restaurant</h2></div><button type="button" className="text-button" onClick={() => setShowManual(false)}>Close</button></div>
          <div className="audit-field-grid">
            <label>Restaurant name<input name="restaurantName" required minLength={2}/></label>
            <label>City<input name="city" required minLength={2}/></label>
            <label>State<input name="state" required minLength={2}/></label>
            <label>Website<input name="websiteUrl" type="url" placeholder="https://"/></label>
            <label>Google profile<input name="googleProfileUrl" type="url" placeholder="https://"/></label>
            <label>Contact email<input name="contactEmail" type="email"/></label>
            <label>Contact phone<input name="contactPhone" type="tel"/></label>
            <label className="wide">Initial Team note<textarea name="teamNote" rows={2}/></label>
          </div>
          <button className="primary-button" disabled={busy}>Create audit record</button>
        </form>
      )}

      {error && <p className="audit-error" role="alert" aria-live="assertive">{error}</p>}
      {loading ? (
        <section className="panel audit-empty" role="status" aria-live="polite"><strong>Loading Audit Center…</strong></section>
      ) : queue.length === 0 ? (
        <section className="panel audit-empty"><strong>No audit records yet.</strong><p>Public submissions and Team-created audits will appear here.</p></section>
      ) : (
        <section className="audit-center-layout">
          <aside className="panel audit-queue" aria-label="Audit queue">
            <div className="panel-heading"><div><p className="eyebrow">TEAM QUEUE</p><h2>Restaurant audits</h2></div><span aria-label={`${queue.length} loaded records`}>{queue.length} loaded</span></div>
            <div className="audit-queue-list">
              {queue.map((item) => {
                const itemRun = latestRun(item);
                return <button key={item.id} disabled={busy} className={selected?.id === item.id ? "active" : ""} aria-pressed={selected?.id === item.id} onClick={() => {
                  if (selected?.id === item.id || !confirmDiscardDetail()) return;
                  resetGeneratedAuditDraft(false);
                  resetOnboardingDraft();
                  setSelectedId(item.id);
                  setSelectedRunId(null);
                }}>
                  <span><strong>{item.audit_restaurants.restaurant_name}</strong><small>{item.audit_restaurants.city}, {item.audit_restaurants.state}</small></span>
                  <em>{item.status.replaceAll("_", " ")}</em>
                  <small>{item.reference_code} · Run {itemRun?.run_number || 1}</small>
                </button>;
              })}
            </div>
          </aside>

          {selected && run && <div className="audit-detail-stack" aria-busy={detailLoading}>
            {detailLoading && <p className="audit-detail-loading" role="status" aria-live="polite">Loading the selected audit details…</p>}
            <section className="panel audit-record-head">
              <div><p className="eyebrow">{selected.reference_code}</p><h2>{selected.audit_restaurants.restaurant_name}</h2><p>{selected.audit_restaurants.city}, {selected.audit_restaurants.state} · Added {formatDate(selected.created_at)}</p></div>
              <label>Status<select value={selected.status} disabled={busy} onChange={(event) => void runAction(() => updateAuditRequestStatus(selected.id, event.target.value as AuditRequestStatus), "Audit queue status updated")}>{requestStatuses.map((item) => <option key={item.value} value={item.value} disabled={item.value === "reviewed" && (run.id !== runs[0]?.id || run.status !== "reviewed" || report?.status !== "reviewed")}>{item.label}</option>)}</select></label>
            </section>

            {savedSnapshot && <section className="panel audit-saved-result">
              <div className="audit-preview-banner saved"><span>SAVED AUDIT · RUN {run.run_number}</span><strong>{run.status === "reviewed" ? "Human reviewed" : "Awaiting Team review"}</strong></div>
              <div className="audit-score-hero compact"><div className="audit-score-value" style={auditScoreStyle(savedSnapshot.overallScore)}><strong>{savedSnapshot.overallScore}</strong><span>/100</span></div><div><p className="eyebrow">SAVED SCORE</p><h2>{100 - savedSnapshot.overallScore} potential points across confirmed gaps and unverified areas</h2><p>{savedSnapshot.evidenceCoverage}% evidence coverage · {savedSnapshot.confidence} confidence</p></div></div>
              <div className="audit-saved-priorities"><p className="eyebrow">SAVED PRIORITIES</p><div className="audit-improvement-grid">{savedSnapshot.improvementAreas.length ? savedSnapshot.improvementAreas.map((item) => <article key={item.key}><span>{item.kind === "confirmed_gap" ? "Confirmed gap" : "Verify first"}</span><strong>{item.label}</strong><p>{item.summary}</p><small>Up to {item.potentialPoints} points · {item.priority} priority</small></article>) : <article><span>Maintain</span><strong>No gap confirmed</strong><p>Keep the reviewed evidence current and compare it again in 60–90 days.</p></article>}</div></div>
              <div className="audit-plan-grid compact"><article><span>0–30 days</span><ul>{savedSnapshot.plan.days_0_30.map((item) => <li key={item}>{item}</li>)}</ul></article><article><span>31–60 days</span><ul>{savedSnapshot.plan.days_31_60.map((item) => <li key={item}>{item}</li>)}</ul></article><article><span>61–90 days</span><ul>{savedSnapshot.plan.days_61_90.map((item) => <li key={item}>{item}</li>)}</ul></article></div>
              <p className="audit-honesty-note">{savedSnapshot.honestyNote}</p>
            </section>}

            <section className="panel audit-contact-card">
              <div><p className="eyebrow">CONTACT + SOURCE</p><h3>{selected.source === "public_intake" ? "Public audit request" : "Team-created audit"}</h3></div>
              <div className="audit-contact-grid">
                <span><small>Name</small><strong>{selected.contact_name || "Not provided"}</strong></span>
                <span><small>Email</small><strong>{selected.contact_email || "Not provided"}</strong></span>
                <span><small>Phone</small><strong>{selected.contact_phone || "Not provided"}</strong></span>
                <span><small>Contact consent</small><strong>{selected.consent_to_contact ? "Provided" : "Not provided"}</strong></span>
              </div>
              {selected.contact_note && <p className="audit-contact-note"><strong>Submitted context:</strong> {selected.contact_note}</p>}
              {selected.audit_restaurants.website_url && <a href={selected.audit_restaurants.website_url} target="_blank" rel="noreferrer">Open website ↗</a>}
              {selected.audit_restaurants.google_profile_url && <a href={selected.audit_restaurants.google_profile_url} target="_blank" rel="noreferrer">Open Google profile ↗</a>}
            </section>

            <section className="panel audit-run-card">
              <div className="panel-heading"><div><p className="eyebrow">AUDIT RUN {run.run_number}</p><h2>{run.status.replaceAll("_", " ")}</h2></div><button type="button" className="secondary-button" disabled={busy || detailLoading || !isLatestSelectedRun} onClick={startGeneratedAuditForSelected}>{!isLatestSelectedRun ? "Latest run only" : run.status === "reviewed" ? "Run comparison audit" : "Generate audit"}</button></div>
              <div className="audit-run-history" aria-label="Audit run history">{runs.map((item) => <button type="button" key={item.id} disabled={busy} className={item.id === run.id ? "active" : ""} aria-pressed={item.id === run.id} onClick={() => {
                if (item.id === run.id || !confirmDiscardDetail()) return;
                resetGeneratedAuditDraft(false);
                resetOnboardingDraft();
                setSelectedRunId(item.id);
              }}>Run {item.run_number}<small>{item.status.replaceAll("_", " ")}</small></button>)}</div>
              {(submittedWebsite || submittedGoogle) && <div className="audit-submitted-sources"><small>Unverified submitted sources</small>{submittedWebsite && <a href={submittedWebsite} target="_blank" rel="noreferrer">Website ↗</a>}{submittedGoogle && <a href={submittedGoogle} target="_blank" rel="noreferrer">Google profile ↗</a>}</div>}
              {previousRun && <div className="audit-comparison-grid"><span><small>Previous findings</small><strong>{previousFindings.length}</strong></span><span><small>Current findings</small><strong>{findings.length}</strong></span><span><small>Added</small><strong>{comparisonStats.added}</strong></span><span><small>Resolved / absent</small><strong>{comparisonStats.resolved}</strong></span><span><small>Evidence links</small><strong>{comparisonStats.previousEvidence} → {comparisonStats.currentEvidence}</strong></span></div>}
              <label>Comparison notes<textarea rows={3} value={comparison} readOnly={run.status === "reviewed"} aria-describedby="comparison-help" onChange={(event) => setComparison(event.target.value)} placeholder="What changed since the previous audit?"/></label>
              <small id="comparison-help" className="audit-field-help">A re-run needs a specific comparison before it can be reviewed.</small>
              <label>Failure reason<textarea rows={2} value={failureReason} readOnly={run.status === "reviewed"} onChange={(event) => setFailureReason(event.target.value)} placeholder="Required when marking a run failed; explain what blocked completion."/></label>
              <div className="audit-run-actions">
                <button type="button" onClick={() => void saveRunState("in_progress")} disabled={busy || detailLoading || run.status === "reviewed"}>Start research</button>
                <button type="button" onClick={() => void saveRunState("ready_for_review")} disabled={busy || detailLoading || run.status === "reviewed"}>Ready for review</button>
                <button type="button" onClick={() => void saveRunState("failed")} disabled={busy || detailLoading || run.status === "reviewed" || failureReason.trim().length < 10}>Mark failed</button>
                <button type="button" onClick={() => void saveRunState("reviewed")} disabled={busy || detailLoading || run.status === "reviewed" || (!findings.some((item) => item.evidence_url) && !hasSavedSnapshotEvidence) || (run.run_number > 1 && comparison.trim().length < 10)}>Mark run reviewed</button>
              </div>
            </section>

            <section className="panel audit-findings-card">
              <div className="panel-heading"><div><p className="eyebrow">EVIDENCE + FINDINGS</p><h2>{findings.length} saved findings</h2></div></div>
              {findings.length > 0 && <div className="audit-findings-list">{findings.map((item) => <article key={item.id}><em className={`severity-${item.severity}`}>{item.severity}</em><span><small>{item.category}</small><strong>{item.title}</strong><p>{item.summary}</p>{item.recommended_action && <p><b>Action:</b> {item.recommended_action}</p>}{item.evidence_url && <a href={item.evidence_url} target="_blank" rel="noreferrer">{item.evidence_label || "View evidence"} ↗</a>}</span></article>)}</div>}
              <form className="audit-finding-form" onSubmit={handleFinding} aria-label="Add an evidence-backed finding">
                <label>Category<select value={finding.category} disabled={run.status === "reviewed"} onChange={(event) => setFinding((current) => ({ ...current, category: event.target.value }))}><option>Google Business Profile</option><option>Website</option><option>Local SEO</option><option>Reviews</option><option>Social media</option><option>Menu and ordering</option><option>Business information</option></select></label>
                <label>Severity<select value={finding.severity} disabled={run.status === "reviewed"} onChange={(event) => setFinding((current) => ({ ...current, severity: event.target.value as AuditFindingSeverity }))}>{findingSeverities.map((severity) => <option key={severity}>{severity}</option>)}</select></label>
                <label className="wide">Finding title<input required minLength={2} readOnly={run.status === "reviewed"} value={finding.title} onChange={(event) => setFinding((current) => ({ ...current, title: event.target.value }))} placeholder="For example: Business hours are inconsistent"/></label>
                <label className="wide">Observation<textarea required minLength={2} readOnly={run.status === "reviewed"} rows={3} value={finding.summary} onChange={(event) => setFinding((current) => ({ ...current, summary: event.target.value }))} placeholder="Describe exactly what was observed."/></label>
                <label className="wide">Evidence URL<input type="url" required readOnly={run.status === "reviewed"} value={finding.evidenceUrl} onChange={(event) => setFinding((current) => ({ ...current, evidenceUrl: event.target.value }))} placeholder="https://… (required for review)"/></label>
                <label className="wide">Evidence label<input readOnly={run.status === "reviewed"} value={finding.evidenceLabel} onChange={(event) => setFinding((current) => ({ ...current, evidenceLabel: event.target.value }))} placeholder="For example: Google profile"/></label>
                <label className="wide">Recommended action<textarea rows={2} readOnly={run.status === "reviewed"} value={finding.recommendedAction} onChange={(event) => setFinding((current) => ({ ...current, recommendedAction: event.target.value }))} placeholder="Describe a practical next action."/></label>
                <button className="primary-button" disabled={busy || run.status === "reviewed"}>{run.status === "reviewed" ? "Reviewed findings are locked" : "Save finding"}</button>
              </form>
            </section>

            <section className="panel audit-report-card">
              <div className="panel-heading"><div><p className="eyebrow">REVIEWED REPORT</p><h2>{report?.status ? report.status.replaceAll("_", " ") : "Draft report"}</h2></div></div>
              <label>Executive summary<textarea rows={5} value={reportSummary} readOnly={report?.status === "reviewed"} onChange={(event) => setReportSummary(event.target.value)} placeholder="Truthful summary of the restaurant’s current online presence"/></label>
              <label>Priority actions<textarea rows={5} value={reportActions} readOnly={report?.status === "reviewed"} onChange={(event) => setReportActions(event.target.value)} placeholder="Reviewed actions, ordered by importance"/></label>
              <p className="audit-honesty-note">This report is an online-presence assessment—not a guarantee of orders, rankings, revenue, profit, ROI, or growth.</p>
              <div className="audit-run-actions"><button type="button" onClick={() => void saveReportState("draft")} disabled={busy || report?.status === "reviewed"}>Save draft</button><button type="button" onClick={() => void saveReportState("ready_for_review")} disabled={busy || report?.status === "reviewed"}>Ready for review</button><button type="button" className="primary-button" onClick={() => void saveReportState("reviewed")} disabled={busy || report?.status === "reviewed" || run.status !== "reviewed" || reportSummary.trim().length < 20 || reportActions.trim().length < 20 || (!findings.some((item) => item.evidence_url) && !hasSavedSnapshotEvidence)}>{report?.status === "reviewed" ? "Reviewed report locked" : "Mark report reviewed"}</button></div>
            </section>

            {isLatestSelectedRun && selected.status === "reviewed" && run.status === "reviewed" && report?.status === "reviewed" && <section className="panel audit-onboarding-card">
              <div className="panel-heading"><div><p className="eyebrow">AUDIT → ONBOARDING PROFILE</p><h2>Reuse the reviewed audit</h2></div><span>Explicit consent required</span></div>
              <p>If the restaurant has agreed to onboard, create a pending restaurant profile prefilled from this reviewed audit. It will not enter the Momo work board, activate services, connect accounts, publish, or create charges.</p>
              <label className="audit-consent-check"><input type="checkbox" checked={onboardingDraftMatchesCurrentTarget && onboardingConsent} onChange={(event) => updateOnboardingDraft({ consent: event.target.checked })}/><span>{AUDIT_ONBOARDING_CONSENT_TEXT}</span></label>
              <div className="audit-onboarding-fields"><label>Consent channel<select value={onboardingDraftMatchesCurrentTarget ? onboardingChannel : "written"} onChange={(event) => updateOnboardingDraft({ channel: event.target.value as typeof onboardingChannel })}><option value="written">Written</option><option value="email">Email</option><option value="signed_form">Signed form</option><option value="recorded_call">Recorded call</option></select></label><label>Evidence reference<input value={onboardingDraftMatchesCurrentTarget ? onboardingEvidence : ""} onChange={(event) => updateOnboardingDraft({ evidence: event.target.value })} placeholder={`Where ${selected.audit_restaurants.restaurant_name}'s onboarding agreement is recorded`} minLength={10} maxLength={1000}/></label></div>
              <button type="button" className="primary-button" disabled={busy || !onboardingDraftMatchesCurrentTarget || !onboardingConsent || onboardingEvidence.trim().length < 10} onClick={() => void prepareOnboardingProfile()}>Create pending restaurant profile</button>
            </section>}

            <section className="panel audit-notes-card">
              <div className="panel-heading"><div><p className="eyebrow">INTERNAL NOTES</p><h2>Team context</h2></div></div>
              {selected.audit_notes.length > 0 && <div className="audit-notes-list">{selected.audit_notes.map((item) => <p key={item.id}><span>{item.body}</span><small>{formatDate(item.created_at)}</small></p>)}</div>}
              <div className="audit-note-input"><label><span>New Team-only note</span><textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add internal context that is not part of the public report."/></label><button type="button" onClick={() => void saveNote()} disabled={busy || !note.trim()}>Add note</button></div>
            </section>
          </div>}
        </section>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  addAuditFinding,
  addAuditNote,
  createTeamAudit,
  getAuditReport,
  listAuditFindings,
  listAuditQueue,
  saveAuditReport,
  startAuditRerun,
  updateAuditRequestStatus,
  updateAuditRun,
  type AuditFinding,
  type AuditFindingSeverity,
  type AuditQueueRecord,
  type AuditReport,
  type AuditRequestStatus,
  type AuditRun,
  type AuditRunStatus,
} from "./veroxa-supabase";

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

export function RestaurantAuditCenter({
  notify,
}: {
  notify: (message: string) => void;
}) {
  const [queue, setQueue] = useState<AuditQueueRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [detailVersion, setDetailVersion] = useState(0);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [previousFindings, setPreviousFindings] = useState<AuditFinding[]>([]);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [comparison, setComparison] = useState("");
  const [reportSummary, setReportSummary] = useState("");
  const [reportActions, setReportActions] = useState("");
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
  const previousRun = run?.previous_run_id
    ? runs.find((item) => item.id === run.previous_run_id) || null
    : runs.find((item) => item.run_number === (run?.run_number || 0) - 1) || null;
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
    const activeRun = run;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setFindings([]);
      setPreviousFindings([]);
      setReport(null);
      setComparison(activeRun?.comparison_summary || "");
      setReportSummary("");
      setReportActions("");
      if (!activeRun) return;
      void Promise.all([
        listAuditFindings(activeRun.id),
        getAuditReport(activeRun.id),
        previousRun ? listAuditFindings(previousRun.id) : Promise.resolve([]),
      ])
        .then(([nextFindings, nextReport, nextPreviousFindings]) => {
          if (cancelled) return;
          setFindings(nextFindings);
          setPreviousFindings(nextPreviousFindings);
          setReport(nextReport);
          setReportSummary(nextReport?.executive_summary || "");
          setReportActions(nextReport?.priority_actions || "");
        })
        .catch(() => {
          if (!cancelled) setError("This audit’s findings or report could not load.");
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [run, previousRun, detailVersion]);

  async function runAction(action: () => Promise<void>, success: string) {
    setBusy(true);
    setError("");
    try {
      await action();
      await refresh();
      setDetailVersion((value) => value + 1);
      notify(success);
    } catch {
      setError("That change could not be saved. Nothing else was changed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleManualAudit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
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
      event.currentTarget.reset();
    }, "Non-client audit record created");
  }

  async function handleFinding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!run) return;
    await runAction(async () => {
      await addAuditFinding(run.id, finding);
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
    await runAction(
      () => updateAuditRun(run.id, { status, comparisonSummary: comparison }),
      `Audit run marked ${status.replaceAll("_", " ")}`,
    );
  }

  async function saveReportState(status: AuditReport["status"]) {
    if (!run) return;
    await runAction(
      () =>
        saveAuditReport(run.id, {
          status,
          executiveSummary: reportSummary,
          priorityActions: reportActions,
        }),
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
          <button className="primary-button" onClick={() => setShowManual((value) => !value)}>Add restaurant audit</button>
        </div>
      </div>

      <section className="team-guardrail audit-guardrail">
        <span className="audit-shield">✓</span>
        <div><strong>Audit-only boundary</strong><span>These are Team-owned prospect records. No client account, onboarding, Momo workspace, publishing, media, or operational reporting is created automatically.</span></div>
        <em>RLS protected</em>
      </section>

      <section className="metric-row audit-metrics">
        <article className="metric-card"><span>Open audits</span><strong>{openCount}</strong><small>Team action required</small></article>
        <article className="metric-card"><span>Public intake</span><strong>{publicCount}</strong><small>Durable submissions</small></article>
        <article className="metric-card"><span>Reviewed</span><strong>{reviewedCount}</strong><small>Human-reviewed reports</small></article>
        <article className="metric-card"><span>Total records</span><strong>{queue.length}</strong><small>Non-client restaurants</small></article>
      </section>

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

      {error && <p className="audit-error" role="alert">{error}</p>}
      {loading ? (
        <section className="panel audit-empty"><strong>Loading Audit Center…</strong></section>
      ) : queue.length === 0 ? (
        <section className="panel audit-empty"><strong>No audit records yet.</strong><p>Public submissions and Team-created audits will appear here.</p></section>
      ) : (
        <section className="audit-center-layout">
          <aside className="panel audit-queue" aria-label="Audit queue">
            <div className="panel-heading"><div><p className="eyebrow">TEAM QUEUE</p><h2>Restaurant audits</h2></div><span>{queue.length}</span></div>
            <div className="audit-queue-list">
              {queue.map((item) => {
                const itemRun = latestRun(item);
                return <button key={item.id} className={selected?.id === item.id ? "active" : ""} onClick={() => { setSelectedId(item.id); setSelectedRunId(null); }}>
                  <span><strong>{item.audit_restaurants.restaurant_name}</strong><small>{item.audit_restaurants.city}, {item.audit_restaurants.state}</small></span>
                  <em>{item.status.replaceAll("_", " ")}</em>
                  <small>{item.reference_code} · Run {itemRun?.run_number || 1}</small>
                </button>;
              })}
            </div>
          </aside>

          {selected && run && <div className="audit-detail-stack">
            <section className="panel audit-record-head">
              <div><p className="eyebrow">{selected.reference_code}</p><h2>{selected.audit_restaurants.restaurant_name}</h2><p>{selected.audit_restaurants.city}, {selected.audit_restaurants.state} · Added {formatDate(selected.created_at)}</p></div>
              <label>Status<select value={selected.status} disabled={busy} onChange={(event) => void runAction(() => updateAuditRequestStatus(selected.id, event.target.value as AuditRequestStatus), "Audit queue status updated")}>{requestStatuses.map((item) => <option key={item.value} value={item.value} disabled={item.value === "reviewed" && report?.status !== "reviewed"}>{item.label}</option>)}</select></label>
            </section>

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
              <div className="panel-heading"><div><p className="eyebrow">AUDIT RUN {run.run_number}</p><h2>{run.status.replaceAll("_", " ")}</h2></div><button className="secondary-button" disabled={busy} onClick={() => void runAction(async () => { const newRunId = await startAuditRerun(selected.id); setSelectedRunId(newRunId); }, "A new comparison run was created")}>Re-run audit</button></div>
              <div className="audit-run-history" aria-label="Audit run history">{runs.map((item) => <button key={item.id} className={item.id === run.id ? "active" : ""} onClick={() => setSelectedRunId(item.id)}>Run {item.run_number}<small>{item.status.replaceAll("_", " ")}</small></button>)}</div>
              {(submittedWebsite || submittedGoogle) && <div className="audit-submitted-sources"><small>Unverified submitted sources</small>{submittedWebsite && <a href={submittedWebsite} target="_blank" rel="noreferrer">Website ↗</a>}{submittedGoogle && <a href={submittedGoogle} target="_blank" rel="noreferrer">Google profile ↗</a>}</div>}
              {previousRun && <div className="audit-comparison-grid"><span><small>Previous findings</small><strong>{previousFindings.length}</strong></span><span><small>Current findings</small><strong>{findings.length}</strong></span><span><small>Added</small><strong>{comparisonStats.added}</strong></span><span><small>Resolved / absent</small><strong>{comparisonStats.resolved}</strong></span><span><small>Evidence links</small><strong>{comparisonStats.previousEvidence} → {comparisonStats.currentEvidence}</strong></span></div>}
              <label>Comparison notes<textarea rows={3} value={comparison} onChange={(event) => setComparison(event.target.value)} placeholder="What changed since the previous audit?"/></label>
              <div className="audit-run-actions">
                <button onClick={() => void saveRunState("in_progress")} disabled={busy || run.status === "reviewed"}>Start research</button>
                <button onClick={() => void saveRunState("ready_for_review")} disabled={busy || run.status === "reviewed"}>Ready for review</button>
                <button onClick={() => void saveRunState("reviewed")} disabled={busy || run.status === "reviewed" || !findings.some((item) => item.evidence_url) || (run.run_number > 1 && comparison.trim().length < 10)}>Mark run reviewed</button>
              </div>
            </section>

            <section className="panel audit-findings-card">
              <div className="panel-heading"><div><p className="eyebrow">EVIDENCE + FINDINGS</p><h2>{findings.length} saved findings</h2></div></div>
              {findings.length > 0 && <div className="audit-findings-list">{findings.map((item) => <article key={item.id}><em className={`severity-${item.severity}`}>{item.severity}</em><span><small>{item.category}</small><strong>{item.title}</strong><p>{item.summary}</p>{item.recommended_action && <p><b>Action:</b> {item.recommended_action}</p>}{item.evidence_url && <a href={item.evidence_url} target="_blank" rel="noreferrer">{item.evidence_label || "View evidence"} ↗</a>}</span></article>)}</div>}
              <form className="audit-finding-form" onSubmit={handleFinding}>
                <select value={finding.category} onChange={(event) => setFinding((current) => ({ ...current, category: event.target.value }))}><option>Google Business Profile</option><option>Website</option><option>Local SEO</option><option>Reviews</option><option>Social media</option><option>Menu and ordering</option><option>Business information</option></select>
                <select value={finding.severity} onChange={(event) => setFinding((current) => ({ ...current, severity: event.target.value as AuditFindingSeverity }))}>{findingSeverities.map((severity) => <option key={severity}>{severity}</option>)}</select>
                <input required minLength={2} value={finding.title} onChange={(event) => setFinding((current) => ({ ...current, title: event.target.value }))} placeholder="Finding title"/>
                <textarea required minLength={2} rows={3} value={finding.summary} onChange={(event) => setFinding((current) => ({ ...current, summary: event.target.value }))} placeholder="What was observed?"/>
                <input type="url" required value={finding.evidenceUrl} onChange={(event) => setFinding((current) => ({ ...current, evidenceUrl: event.target.value }))} placeholder="Evidence URL (required for review)"/>
                <input value={finding.evidenceLabel} onChange={(event) => setFinding((current) => ({ ...current, evidenceLabel: event.target.value }))} placeholder="Evidence label (for example: Google profile)"/>
                <textarea rows={2} value={finding.recommendedAction} onChange={(event) => setFinding((current) => ({ ...current, recommendedAction: event.target.value }))} placeholder="Recommended action"/>
                <button className="primary-button" disabled={busy || run.status === "reviewed"}>{run.status === "reviewed" ? "Reviewed findings are locked" : "Save finding"}</button>
              </form>
            </section>

            <section className="panel audit-report-card">
              <div className="panel-heading"><div><p className="eyebrow">REVIEWED REPORT</p><h2>{report?.status ? report.status.replaceAll("_", " ") : "Draft report"}</h2></div></div>
              <label>Executive summary<textarea rows={5} value={reportSummary} onChange={(event) => setReportSummary(event.target.value)} placeholder="Truthful summary of the restaurant’s current online presence"/></label>
              <label>Priority actions<textarea rows={5} value={reportActions} onChange={(event) => setReportActions(event.target.value)} placeholder="Reviewed actions, ordered by importance"/></label>
              <p className="audit-honesty-note">This report is an online-presence assessment—not a guarantee of orders, rankings, revenue, profit, ROI, or growth.</p>
              <div className="audit-run-actions"><button onClick={() => void saveReportState("draft")} disabled={busy || report?.status === "reviewed"}>Save draft</button><button onClick={() => void saveReportState("ready_for_review")} disabled={busy || report?.status === "reviewed"}>Ready for review</button><button className="primary-button" onClick={() => void saveReportState("reviewed")} disabled={busy || report?.status === "reviewed" || run.status !== "reviewed" || reportSummary.trim().length < 20 || reportActions.trim().length < 20 || !findings.some((item) => item.evidence_url)}>{report?.status === "reviewed" ? "Reviewed report locked" : "Mark report reviewed"}</button></div>
            </section>

            <section className="panel audit-notes-card">
              <div className="panel-heading"><div><p className="eyebrow">INTERNAL NOTES</p><h2>Team context</h2></div></div>
              {selected.audit_notes.length > 0 && <div className="audit-notes-list">{selected.audit_notes.map((item) => <p key={item.id}><span>{item.body}</span><small>{formatDate(item.created_at)}</small></p>)}</div>}
              <div className="audit-note-input"><textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a Team-only note"/><button onClick={() => void saveNote()} disabled={busy || !note.trim()}>Add note</button></div>
            </section>
          </div>}
        </section>
      )}
    </div>
  );
}

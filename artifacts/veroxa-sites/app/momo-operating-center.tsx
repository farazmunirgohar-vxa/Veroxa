"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { VeroxaRole } from "./veroxa-supabase";
import {
  addMomoMediaTag,
  createMomoContentDraft,
  createMomoReportDraft,
  createMomoContentStrategy,
  createMomoPlatformVariant,
  createMomoWorkItem,
  decideMomoApproval,
  emptyMomoWorkspaceData,
  getMomoMediaPreviewUrl,
  loadMomoWorkspaceData,
  prepareMomoAiJob,
  queueMomoPublication,
  requestMomoApproval,
  recordMomoMediaReuse,
  retryMomoWorkItem,
  reviewMomoMedia,
  reviewMomoConfirmation,
  saveMomoContact,
  saveMomoTruthField,
  scheduleMomoVariant,
  submitMomoContentConfirmation,
  uploadMomoMedia,
  type MomoApproval,
  type MomoMediaAsset,
  type MomoWorkspaceData,
  type MomoWorkspaceSection,
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
  if (view === "onboarding" || view === "team-intelligence") return "intelligence";
  if (view === "media") return "media";
  if (view === "content" || view === "team-content") return "content";
  if (view === "services") return "connections";
  if (view === "reports" || view === "team-reports" || view === "team-work") return "operations";
  if (view === "team-readiness") return "readiness";
  return "dashboard";
};

const labelStatus = (value: string | null | undefined) =>
  (value || "not recorded").replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());

const approvalBlocksNewRequest = (approval: MomoApproval | undefined) =>
  Boolean(approval && ["pending", "in_review", "approved"].includes(approval.status));

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

  if (view === "onboarding" || view === "team-intelligence") return <IntelligencePanel {...shared} />;
  if (view === "media") return <MediaPanel {...shared} />;
  if (view === "content" || view === "team-content") return <ContentPanel {...shared} />;
  if (view === "services") return <ConnectionsPanel {...shared} />;
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
  const approvedMedia = data.media.filter((item) => item.status === "ready_to_use").length;
  const gate = data.readinessGate;
  const truthName = data.truth.find((item) => item.field_key === "identity.display_name");
  return <div className="view">
    <MomoIntro eyebrow="MOMO OPERATING SYSTEM" title={truthName ? valueText(truthName.value_json) || "Momo’s House" : "Momo workspace"} description="Live operational records for restaurant truth, media, content, connections, work, reporting, and readiness." />
    <SafetyBoundary role={role} />
    <section className="momo-metrics">
      <article><span>Truth fields</span><strong>{data.truth.length}</strong><small>{data.truth.filter((item) => item.status === "owner_confirmed").length} owner confirmed</small></article>
      <article><span>Usable media</span><strong>{approvedMedia}</strong><small>{data.media.length} total assets</small></article>
      <article><span>Approvals</span><strong>{pendingApprovals}</strong><small>pending decisions</small></article>
      <article><span>Blocked work</span><strong>{blockedWork}</strong><small>requires action</small></article>
    </section>
    <section className="momo-module-grid">
      <Module title="Restaurant intelligence" detail={data.truth.length ? `${data.truth.length} persistent fields available.` : "No owner-confirmed restaurant truth yet."} status={data.truth.length ? "in_progress" : "not_started"} action="Open intelligence" onClick={() => onNavigate(role === "team" ? "team-intelligence" : "onboarding")} />
      <Module title="Media + rights" detail={data.media.length ? `${data.media.length} assets; ${data.mediaRights.length} rights records.` : "No Momo media has been uploaded."} status={data.media.length ? "in_progress" : "not_started"} action={role === "team" ? "Open content" : "Open media"} onClick={() => onNavigate(role === "team" ? "team-content" : "media")} />
      <Module title="Content approvals" detail={data.contentItems.length ? `${data.contentItems.length} content items; ${pendingApprovals} pending approvals.` : "No strategy or content draft exists."} status={pendingApprovals ? "approval_required" : data.contentItems.length ? "in_progress" : "not_started"} action="Open content" onClick={() => onNavigate(role === "team" ? "team-content" : "services")} />
      <Module title="Connections" detail={data.connections.length ? `${data.connections.length} provider connection records.` : "Meta and Google are not represented as connected."} status={data.connections.some((item) => item.status === "connected") ? "connected" : "blocked"} action="Review services" onClick={() => onNavigate(role === "team" ? "team-readiness" : "services")} />
      <Module title="Reporting" detail={data.reports.length ? `${data.reports.length} evidence-backed report records.` : "No reviewed report is available."} status={data.reports.length ? "in_progress" : "not_started"} action="Open reports" onClick={() => onNavigate(role === "team" ? "team-reports" : "reports")} />
      <Module title="Final readiness gate" detail={gate ? `${gate.verified_count} of ${gate.required_count} required dimensions verified; ${gate.blocker_count} blockers.` : "The production readiness gate has no evaluated record."} status={gate?.overall_status || "not_evaluated"} action="Review readiness" onClick={() => onNavigate(role === "team" ? "team-readiness" : "onboarding")} />
    </section>
  </div>;
}

function Module({ title, detail, status, action, onClick }: { title: string; detail: string; status: string; action: string; onClick: () => void }) {
  return <article className="momo-module"><div><h2>{title}</h2><StatusBadge status={status} /></div><p>{detail}</p><button onClick={onClick}>{action} <span aria-hidden="true">→</span></button></article>;
}

const truthDefinitions = [
  ["identity.display_name", "identity", "Restaurant name", "text"],
  ["address.primary", "address", "Street address", "text"],
  ["phone.primary", "phone", "Public phone", "tel"],
  ["hours.regular", "hours", "Regular business hours", "textarea"],
  ["menu.primary", "menu", "Menu URL or description", "textarea"],
  ["services.active", "services", "Active services (comma separated)", "textarea"],
  ["claims.dietary", "claims", "Dietary claims", "textarea"],
  ["claims.halal", "claims", "Halal claim", "textarea"],
  ["brand.voice", "brand", "Brand voice", "textarea"],
  ["goals.primary", "goals", "Primary restaurant goals", "textarea"],
] as const;

function IntelligencePanel(props: PanelProps) {
  const { data, role, busy, run } = props;
  return <div className="view">
    <MomoIntro eyebrow="RESTAURANT INTELLIGENCE + ONBOARDING" title="Owner-confirmed business truth" description="Identity, hours, menu, services, dietary claims, contacts, voice, goals, presence, and onboarding evidence are stored with explicit confirmation states." />
    <SafetyBoundary role={role} />
    <RestaurantTruthForm key={data.truth.map((item) => `${item.id}:${item.updated_at}`).join("|")} {...props} />
    <ContactForm key={data.contacts.map((item) => `${item.id}:${item.updated_at}`).join("|")} {...props} />
    <section className="momo-split">
      <article className="momo-panel">
        <div className="momo-panel-heading"><div><p className="eyebrow">CURRENT TRUTH</p><h2>Field-level confirmation</h2></div><span>{data.truth.length}</span></div>
        {data.truth.length === 0 ? <EmptyState title="No restaurant truth has been recorded." detail="Use the form above to add owner-confirmed facts. Unconfirmed facts remain absent." /> : <div className="momo-record-list">
          {data.truth.map((field) => <article key={field.id}><div><strong>{labelStatus(field.field_key)}</strong><p>{valueText(field.value_json) || "Empty value"}</p><small>{labelStatus(field.section)} · {field.source}</small></div><StatusBadge status={field.status} /></article>)}
        </div>}
      </article>
      <article className="momo-panel">
        <div className="momo-panel-heading"><div><p className="eyebrow">ONBOARDING</p><h2>Evidence-based steps</h2></div><span>{data.onboarding.length}</span></div>
        {data.onboarding.length === 0 ? <EmptyState title="No onboarding steps exist." detail="A step is never treated as complete without a stored record and evidence." /> : <div className="momo-record-list">{data.onboarding.map((step) => <article key={step.id}><div><strong>{step.title}</strong><p>{step.blocker_reason || valueText(step.completion_evidence) || "No evidence recorded"}</p></div><StatusBadge status={step.status} /></article>)}</div>}
      </article>
    </section>
    <section className="momo-panel">
      <div className="momo-panel-heading"><div><p className="eyebrow">CONFIRMATION QUEUE</p><h2>Owner proposals and Team decisions</h2></div><span>{data.confirmations.length}</span></div>
      {data.confirmations.length === 0 ? <EmptyState title="No confirmation is waiting." detail="Owner changes and confirmations appear here only after a real submission." /> : <div className="momo-record-list">{data.confirmations.map((confirmation) => <article key={confirmation.id}><div><strong>{labelStatus(confirmation.confirmation_kind)}</strong><p>{valueText(confirmation.proposed_value) || "No proposed value"}</p><small>{labelStatus(confirmation.subject_type)} · {formatDate(confirmation.created_at)}</small></div><StatusBadge status={confirmation.status} />{role === "team" && confirmation.status === "pending" && <div className="momo-decision"><button disabled={busy} onClick={() => void run(() => reviewMomoConfirmation(confirmation, "approved"), "Owner confirmation approved and applied.")}>Approve</button><button disabled={busy} onClick={() => void run(() => reviewMomoConfirmation(confirmation, "changes_requested"), "Changes requested from the owner.")}>Request changes</button></div>}</article>)}</div>}
    </section>
    <section className="momo-panel">
      <div className="momo-panel-heading"><div><p className="eyebrow">PRESENCE STACK</p><h2>Verified access and public truth</h2></div><span>{data.presence.length}</span></div>
      {data.presence.length === 0 ? <EmptyState title="No presence profile is configured." detail="Google, Instagram, Facebook, website, and ordering links remain unverified." /> : <div className="momo-card-grid">{data.presence.map((profile) => <article className="momo-small-card" key={profile.id}><div><strong>{labelStatus(profile.provider)}</strong><StatusBadge status={profile.access_status} /></div><p>{profile.public_url || "No public URL recorded"}</p><small>Truth: {labelStatus(profile.truth_status)} · checked {formatDate(profile.last_checked_at)}</small></article>)}</div>}
    </section>
  </div>;
}

function RestaurantTruthForm({ data, role, restaurantId, busy, run }: PanelProps) {
  const current = useMemo(() => Object.fromEntries(data.truth.filter((item) => item.is_current).map((item) => [item.field_key, valueText(item.value_json)])), [data.truth]);
  const [values, setValues] = useState<Record<string, string>>(current);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const changed = truthDefinitions.filter(([key]) => (values[key] || "").trim() && (values[key] || "").trim() !== (current[key] || "").trim());
    if (changed.length === 0) return;
    void run(async () => {
      for (const [key, section] of changed) {
        const existing = data.truth.find((item) => item.field_key === key && item.is_current);
        const raw = values[key].trim();
        const value = key.startsWith("services.") || key.startsWith("goals.") || key.startsWith("claims.")
          ? raw.split(",").map((item) => item.trim()).filter(Boolean)
          : { text: raw };
        await saveMomoTruthField({ restaurantId, existingId: existing?.id, existingStatus: existing?.status, fieldKey: key, section, value, role });
      }
    }, role === "client" ? "Owner confirmation saved for Team review." : "Team business truth saved.");
  };

  return <form className="momo-panel momo-form" onSubmit={submit}>
    <div className="momo-panel-heading"><div><p className="eyebrow">{role === "client" ? "OWNER CONFIRMATION" : "TEAM RECORD"}</p><h2>Restaurant profile</h2></div><StatusBadge status={role === "client" ? "owner_confirmation" : "team_review"} /></div>
    <div className="momo-form-grid">{truthDefinitions.map(([key,, label, type]) => <label className={type === "textarea" ? "wide" : ""} key={key}>{label}{type === "textarea" ? <textarea value={values[key] || ""} onChange={(event) => setValues((previous) => ({ ...previous, [key]: event.target.value }))} rows={3} /> : <input type={type} value={values[key] || ""} onChange={(event) => setValues((previous) => ({ ...previous, [key]: event.target.value }))} />}</label>)}</div>
    <p className="momo-form-note">Only populated, changed fields are saved. Public-use claims still require the configured Team review state.</p>
    <button className="primary-button" type="submit" disabled={busy}>{busy ? "Saving…" : role === "client" ? "Confirm these details" : "Save Team record"}</button>
  </form>;
}

function ContactForm({ data, role, restaurantId, busy, run }: PanelProps) {
  const primary = data.contacts.find((item) => item.is_primary);
  const [name, setName] = useState(primary?.name || "");
  const [email, setEmail] = useState(primary?.email || "");
  const [phone, setPhone] = useState(primary?.phone || "");
  return <form className="momo-panel momo-inline-form" onSubmit={(event) => {
    event.preventDefault();
    if (!name.trim() || (!email.trim() && !phone.trim())) return;
    void run(() => saveMomoContact({ restaurantId, existingId: primary?.id, existingStatus: primary?.status, contactKind: "owner", name, email, phone, isPrimary: true, role }), "Primary owner contact saved.");
  }}>
    <div><p className="eyebrow">PRIMARY CONTACT</p><h2>Owner or responsible manager</h2></div>
    <label>Name<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
    <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
    <label>Phone<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
    <button className="secondary-button" disabled={busy || (!email.trim() && !phone.trim())}>Save contact</button>
  </form>;
}

function MediaPanel(props: PanelProps) {
  const { data, role, restaurantId, busy, run } = props;
  const [file, setFile] = useState<File | null>(null);
  const [rights, setRights] = useState(false);
  const [scope, setScope] = useState<string[]>(["instagram", "facebook", "google_business", "website"]);
  const [expiresAt, setExpiresAt] = useState("");
  return <div className="view">
    <MomoIntro eyebrow="MEDIA INTAKE + INTELLIGENCE" title="Rights before reuse" description="Every asset is private, tenant-scoped, rights-tracked, quality-reviewed, tagged, and reusable only after explicit approval." />
    <SafetyBoundary role={role} />
    {role === "client" ? <form className="momo-panel momo-upload" onSubmit={(event) => {
      event.preventDefault();
      if (!file || !rights) return;
      void run(() => uploadMomoMedia({ restaurantId, file, usageScope: scope, expiresAt }), "Media and usage rights saved for review.");
    }}>
      <div><p className="eyebrow">PRIVATE MEDIA INTAKE</p><h2>Upload Momo media</h2><p>JPG, PNG, WebP, HEIC, MP4, MOV, or WebM · maximum 100 MB.</p></div>
      <label className="momo-file">Media file<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm" onChange={(event) => setFile(event.target.files?.[0] || null)} required /></label>
      <fieldset className="momo-scope"><legend>Usage scope</legend>{[
        ["instagram", "Instagram"], ["facebook", "Facebook"], ["google_business", "Google Business Profile"],
        ["website", "Website"], ["internal", "Internal review and reporting"],
      ].map(([value, label]) => <label className="momo-check" key={value}><input type="checkbox" checked={scope.includes(value)} onChange={(event) => setScope((current) => event.target.checked ? [...current, value] : current.filter((item) => item !== value))} /><span>{label}</span></label>)}</fieldset>
      <label>Rights expiry (optional)<input type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} /></label>
      <label className="momo-check"><input type="checkbox" checked={rights} onChange={(event) => setRights(event.target.checked)} required /><span>I own or control this media and authorize use within the scope above.</span></label>
      <button className="primary-button" disabled={busy || !file || !rights || scope.length === 0}>{busy ? "Uploading…" : "Upload with rights record"}</button>
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
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const linkedTags = data.mediaAssetTags.filter((item) => item.asset_id === asset.id).map((link) => data.mediaTags.find((item) => item.id === link.tag_id)?.label).filter(Boolean);
  return <article className="momo-media-card">
    <div className="momo-media-icon">{previewUrl ? (asset.mime_type.startsWith("video/") ? <video src={previewUrl} controls /> : <span className="momo-image-preview" style={{ backgroundImage: `url("${previewUrl.replaceAll('"', "%22")}")` }} role="img" aria-label="Private Momo media preview" />) : asset.mime_type.startsWith("video/") ? "VIDEO" : "PHOTO"}</div>
    <div className="momo-media-heading"><span><strong>{asset.display_name || asset.original_file_name || asset.storage_path.split("/").at(-1) || "Private media"}</strong><small>{Math.max(1, Math.round(asset.file_size / 1024))} KB · {formatDate(asset.created_at)}</small></span><StatusBadge status={asset.status} /></div>
    <div className="momo-facts"><span>Rights<strong>{rights ? labelStatus(rights.rights_status) : "Missing"}</strong></span><span>Quality<strong>{review?.quality_score ?? "Not reviewed"}</strong></span><span>Reuse<strong>{asset.reuse_count || 0}</strong></span></div>
    {asset.storage_path && <button className="momo-preview-button" disabled={previewBusy} onClick={() => {
      setPreviewBusy(true);
      void getMomoMediaPreviewUrl(asset.storage_path).then(setPreviewUrl).finally(() => setPreviewBusy(false));
    }}>{previewBusy ? "Opening…" : previewUrl ? "Refresh private preview" : "Open private preview"}</button>}
    {linkedTags.length > 0 && <div className="momo-tag-row">{linkedTags.map((item) => <span key={item}>{item}</span>)}</div>}
    {role === "team" && <div className="momo-review-box">
      <label>Quality 0–100<input type="number" min={0} max={100} value={quality} onChange={(event) => setQuality(Number(event.target.value))} /></label>
      <label className="wide">Review notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} /></label>
      <label className="momo-check wide"><input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} /><span>Approved for public use</span></label>
      <button disabled={busy || !rights} onClick={() => void run(() => reviewMomoMedia({ restaurantId, assetId: asset.id, status: approved ? "approved" : "changes_requested", qualityScore: quality, qualityNotes: notes, publicUseApproved: approved }), "Media review saved.")}>Save review</button>
      <div className="momo-tag-input"><input placeholder="Add a tag" value={tag} onChange={(event) => setTag(event.target.value)} /><button disabled={busy || !tag.trim()} onClick={() => void run(() => addMomoMediaTag({ restaurantId, assetId: asset.id, label: tag }), "Media tag added.")}>Add tag</button></div>
      <button className="momo-provider-action" disabled={busy} onClick={() => void run(() => prepareMomoAiJob(restaurantId, "media_classification", "media_asset", asset.id), "Provider-neutral classification job prepared; no AI call was made.")}>Prepare AI classification</button>
      <button className="momo-provider-action" disabled={busy || !rights || !review?.public_use_approved} onClick={() => void run(() => recordMomoMediaReuse({ restaurantId, assetId: asset.id, platform: "internal", usageKind: "internal_reference" }), "Media reuse recorded in the audit trail.")}>Record approved reuse</button>
    </div>}
    {!rights && <p className="momo-warning">This asset cannot be approved or reused because its rights record is missing.</p>}
  </article>;
}

function ContentPanel(props: PanelProps) {
  const { data, role, restaurantId, busy, run } = props;
  const [strategyTitle, setStrategyTitle] = useState("");
  const [goals, setGoals] = useState("");
  const [pillars, setPillars] = useState("");
  const [voice, setVoice] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [concept, setConcept] = useState("");
  const [caption, setCaption] = useState("");
  const [ownerRequired, setOwnerRequired] = useState(true);
  return <div className="view">
    <MomoIntro eyebrow="AI CONTENT + APPROVAL CALENDAR" title="Prepared, reviewed, controlled" description="Strategy, captions, platform variants, approvals, and calendar entries are persistent. Runtime AI and publishing remain separate gated actions." />
    <SafetyBoundary role={role} />
    {role === "team" && <section className="momo-split">
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
        void run(() => createMomoContentDraft({ restaurantId, strategyId: data.strategies[0]?.id, mediaAssetId: data.media.find((item) => item.status === "ready_to_use")?.id, title: draftTitle, concept, masterCaption: caption, requiresOwnerConfirmation: ownerRequired }), "Content draft saved without publishing.");
      }}>
        <div className="momo-panel-heading"><div><p className="eyebrow">CONTENT DRAFT</p><h2>Human-written master draft</h2></div><StatusBadge status="pending" /></div>
        <label>Title<input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} required /></label>
        <label>Concept<textarea value={concept} onChange={(event) => setConcept(event.target.value)} rows={3} required /></label>
        <label>Master caption<textarea value={caption} onChange={(event) => setCaption(event.target.value)} rows={5} required /></label>
        <label className="momo-check"><input type="checkbox" checked={ownerRequired} onChange={(event) => setOwnerRequired(event.target.checked)} /><span>Require owner confirmation</span></label>
        <button className="secondary-button" disabled={busy}>Save content draft</button>
      </form>
    </section>}
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
      {data.approvals.length === 0 ? <EmptyState title="No approval requests exist." detail="No content, variant, review response, or publication is treated as approved." /> : <div className="momo-record-list">{data.approvals.map((approval) => <ApprovalRow key={approval.id} approval={approval} {...props} />)}</div>}
    </section>
    <section className="momo-panel">
      <div className="momo-panel-heading"><div><p className="eyebrow">CONTENT ITEMS</p><h2>Drafts and platform variants</h2></div><span>{data.contentItems.length}</span></div>
      {data.contentItems.length === 0 ? <EmptyState title="No content draft exists." detail="AI does not generate content from missing business truth or unapproved media." /> : <div className="momo-content-list">{data.contentItems.map((item) => <ContentItemCard key={item.id} item={item} {...props} />)}</div>}
    </section>
    <section className="momo-panel">
      <div className="momo-panel-heading"><div><p className="eyebrow">CONTENT CALENDAR</p><h2>Approved schedule records</h2></div><span>{data.calendar.length}</span></div>
      {data.calendar.length === 0 ? <EmptyState title="The calendar is empty." detail="Nothing is scheduled or represented as published." /> : <div className="momo-card-grid">{data.calendar.map((entry) => <article className="momo-small-card" key={entry.id}><div><strong>{data.variants.find((item) => item.id === entry.variant_id)?.platform || "Variant"}</strong><StatusBadge status={entry.status} /></div><p>{formatDate(entry.scheduled_for)}</p><small>{entry.published_at ? `Published ${formatDate(entry.published_at)}` : "Not published"}</small></article>)}</div>}
    </section>
  </div>;
}

function PendingContentConfirmationCard({ item, restaurantId, busy, run }: PanelProps & { item: MomoWorkspaceData["pendingContentConfirmations"][number] }) {
  const [notes, setNotes] = useState("");
  const waiting = item.confirmation_status === "pending" || item.confirmation_status === "in_review";
  return <article className="momo-content-card">
    <div className="momo-panel-heading"><div><strong>{item.title}</strong><small>{item.concept || "No concept detail recorded."}</small></div><StatusBadge status={item.confirmation_status || "needs_owner_confirmation"} /></div>
    <p className="momo-caption">{item.master_caption || "No caption recorded."}</p>
    <label>Optional note<textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add context for the Team" /></label>
    <button disabled={busy || waiting} onClick={() => void run(() => submitMomoContentConfirmation({ restaurantId, contentItemId: item.content_item_id, notes }), "Content direction submitted for Team review.")}>{waiting ? "Confirmation awaiting Team review" : "Confirm this content direction"}</button>
  </article>;
}

function ApprovalRow({ approval, role, busy, run }: PanelProps & { approval: MomoApproval }) {
  const [notes, setNotes] = useState("");
  return <article><div><strong>{labelStatus(approval.approval_kind)}</strong><p>{labelStatus(approval.subject_type)} · requested {formatDate(approval.requested_at)}</p>{approval.decision_notes && <small>{approval.decision_notes}</small>}</div><StatusBadge status={approval.status} />{role === "team" && approval.status === "pending" && <div className="momo-decision"><input aria-label="Decision notes" placeholder="Decision note" value={notes} onChange={(event) => setNotes(event.target.value)} /><button disabled={busy} onClick={() => void run(() => decideMomoApproval(approval.id, "approved", notes), "Team approval recorded and applied.")}>Approve</button><button disabled={busy} onClick={() => void run(() => decideMomoApproval(approval.id, "rejected", notes), "Rejection recorded.")}>Reject</button></div>}</article>;
}

function ContentItemCard({ item, data, role, restaurantId, busy, run }: PanelProps & { item: MomoWorkspaceData["contentItems"][number] }) {
  const itemVariants = data.variants.filter((variant) => variant.content_item_id === item.id);
  const [platform, setPlatform] = useState("instagram");
  const [caption, setCaption] = useState("");
  const [scheduleVariant, setScheduleVariant] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  return <article className="momo-content-card">
    <div className="momo-panel-heading"><div><strong>{item.title}</strong><small>{item.concept}</small></div><StatusBadge status={item.status} /></div>
    <p className="momo-caption">{item.master_caption || "No master caption recorded."}</p>
    <div className="momo-variant-list">{itemVariants.map((variant) => {
      const publishingApproval = data.approvals.find((approval) => approval.subject_id === variant.id && approval.approval_kind === "publishing");
      const provider = variant.platform === "google_business" ? "google_business" : "meta";
      const connection = data.connections.find((item) => item.provider === provider && item.status === "connected");
      const queued = data.publishQueue.find((item) => item.variant_id === variant.id);
      const teamReview = data.approvals.find((approval) => approval.subject_id === variant.id && approval.subject_type === "content_variant" && approval.approval_kind === "team_review");
      return <article key={variant.id}><span><strong>{labelStatus(variant.platform)}</strong><small>{variant.caption}</small></span><StatusBadge status={queued?.status || teamReview?.status || variant.status} />{role === "team" && variant.status !== "approved" && !approvalBlocksNewRequest(teamReview) && <button disabled={busy} onClick={() => void run(() => requestMomoApproval({ restaurantId, subjectType: "content_variant", subjectId: variant.id, approvalKind: "team_review" }), "Variant review requested.")}>Request Team review</button>}{role === "team" && variant.status === "approved" && !approvalBlocksNewRequest(publishingApproval) && <button disabled={busy} onClick={() => void run(() => requestMomoApproval({ restaurantId, subjectType: "content_variant", subjectId: variant.id, approvalKind: "publishing" }), "Publishing approval requested.")}>Request publishing approval</button>}{role === "team" && publishingApproval?.status === "approved" && connection && !queued && <button disabled={busy} onClick={() => void run(() => queueMomoPublication({ restaurantId, connectionId: connection.id, variantId: variant.id, approvalId: publishingApproval.id, scheduledFor: scheduledFor || undefined }), "Approved item added to the provider queue. No external call has run yet.")}>Queue approved publication</button>}</article>;
    })}</div>
    {role === "team" && <div className="momo-variant-form">
      <select value={platform} onChange={(event) => setPlatform(event.target.value)}><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="google_business">Google Business Profile</option></select>
      <textarea value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Platform-specific caption" rows={3} />
      <button disabled={busy || !caption.trim()} onClick={() => void run(() => createMomoPlatformVariant({ restaurantId, contentItemId: item.id, platform, caption }), "Manual platform variant saved.")}>Add manual variant</button>
      <button disabled={busy} onClick={() => void run(() => prepareMomoAiJob(restaurantId, "platform_variants", "content_item", item.id), "Provider-neutral AI job prepared; no model call was made.")}>Prepare AI variants</button>
      {item.requires_owner_confirmation ? <p className="momo-warning">Awaiting owner content-direction confirmation. Team review remains blocked.</p> : item.status !== "approved" && !approvalBlocksNewRequest(data.approvals.find((approval) => approval.subject_type === "content_item" && approval.subject_id === item.id && approval.approval_kind === "team_review")) && <button disabled={busy} onClick={() => void run(() => requestMomoApproval({ restaurantId, subjectType: "content_item", subjectId: item.id, approvalKind: "team_review" }), "Content review requested.")}>Request Team review</button>}
      {itemVariants.length > 0 && <><select value={scheduleVariant} onChange={(event) => setScheduleVariant(event.target.value)}><option value="">Choose approved variant</option>{itemVariants.filter((variant) => variant.status === "approved").map((variant) => <option key={variant.id} value={variant.id}>{labelStatus(variant.platform)}</option>)}</select><input type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} /><button disabled={busy || !scheduleVariant || !scheduledFor} onClick={() => void run(() => scheduleMomoVariant({ restaurantId, variantId: scheduleVariant, scheduledFor, timezone: "America/Chicago" }), "Calendar entry saved. Publishing remains separately gated.")}>Add to calendar</button></>}
    </div>}
  </article>;
}

function ConnectionsPanel({ data, role }: PanelProps) {
  return <div className="view">
    <MomoIntro eyebrow="META + GOOGLE + LOCAL PRESENCE" title="Connections are permissions, not assumptions" description="Provider access, capabilities, owner authorization, publishing, Google checks, reviews, website/menu truth, and visibility evidence remain separately tracked." />
    <SafetyBoundary role={role} />
    <section className="momo-panel">
      <div className="momo-panel-heading"><div><p className="eyebrow">PROVIDER CONNECTIONS</p><h2>Meta and Google access</h2></div><span>{data.connections.length}</span></div>
      {data.connections.length === 0 ? <EmptyState title="No provider is connected." detail="Veroxa has no represented Meta or Google permission. No token or secret is stored in these records." /> : <div className="momo-card-grid">{data.connections.map((connection) => <article className="momo-small-card" key={connection.id}><div><strong>{labelStatus(connection.provider)}</strong><StatusBadge status={connection.status} /></div><p>{connection.display_label || "No account label"}</p><small>Owner authorization: {connection.owner_authorized_at ? formatDate(connection.owner_authorized_at) : "not recorded"} · verified: {formatDate(connection.last_verified_at)}</small>{role === "client" && !connection.owner_authorized_at && <p className="momo-warning">Authorization is not yet available in this client-safe workflow. Veroxa cannot connect or publish.</p>}</article>)}</div>}
    </section>
    <section className="momo-split">
      <article className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">LOCAL SEO + WEBSITE</p><h2>Evidence checks</h2></div><span>{data.localChecks.length}</span></div>{data.localChecks.length === 0 ? <EmptyState title="No live presence check exists." detail="Website, menu, hours, ordering links, and Google visibility have not been observed by a verified check." /> : <div className="momo-record-list">{data.localChecks.map((check) => <article key={check.id}><div><strong>{labelStatus(check.check_type)}</strong><p>{jsonList(check.findings).join(" · ") || "No findings recorded"}</p><small>{formatDate(check.observed_at)}</small></div><StatusBadge status={check.status} /></article>)}</div>}</article>
      <article className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">REVIEWS</p><h2>Response approval queue</h2></div><span>{data.reviews.length}</span></div>{data.reviews.length === 0 ? <EmptyState title="No reviews have been imported." detail="No response is drafted, approved, or represented as published." /> : <div className="momo-record-list">{data.reviews.map((review) => <article key={review.id}><div><strong>{labelStatus(review.provider)} · {review.rating ?? "No rating"}</strong><p>{review.response_draft || "No response draft"}</p></div><StatusBadge status={review.response_status} /></article>)}</div>}</article>
    </section>
    <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">VISIBILITY MONITORING</p><h2>Source-backed snapshots</h2></div><span>{data.visibility.length}</span></div>{data.visibility.length === 0 ? <EmptyState title="No visibility baseline exists." detail="Rankings, reach, traffic, and profile metrics are not estimated." /> : <div className="momo-card-grid">{data.visibility.map((snapshot) => <article className="momo-small-card" key={snapshot.id}><div><strong>{labelStatus(snapshot.source)}</strong><StatusBadge status="evidence_recorded" /></div><p>{jsonList(snapshot.metrics).join(" · ") || "No metrics recorded"}</p><small>{snapshot.period_start} – {snapshot.period_end}</small></article>)}</div>}</section>
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
  const [reportSummary, setReportSummary] = useState("");
  const eligibleEvents = data.activity.filter((event) => event.report_eligible);
  return <div className="view">
    <MomoIntro eyebrow={mode === "work" ? "WORK ORCHESTRATION + RECOVERY" : "EVIDENCE-BACKED REPORTING"} title={mode === "work" ? "Real work, explicit blockers" : "Reviewed activity before claims"} description={mode === "work" ? "Assignments, attempts, retry limits, monitoring, alerts, and recovery are persistent and auditable." : "Weekly and monthly reports use reviewed, report-eligible activity. Missing outcomes stay missing."} />
    <SafetyBoundary role={role} />
    {mode === "work" && role === "team" && <form className="momo-panel momo-inline-form" onSubmit={(event) => {
      event.preventDefault();
      void run(() => createMomoWorkItem({ restaurantId, workType, title, description, priority: 3 }), "Work item queued.");
    }}><div><p className="eyebrow">NEW WORK</p><h2>Create an auditable task</h2></div><label>Type<select value={workType} onChange={(event) => setWorkType(event.target.value)}><option value="onboarding">Onboarding</option><option value="truth_review">Truth review</option><option value="media">Media</option><option value="content">Content</option><option value="publishing">Publishing</option><option value="google">Google</option><option value="seo">SEO</option><option value="reviews">Reviews</option><option value="website">Website</option><option value="reporting">Reporting</option><option value="monitoring">Monitoring</option><option value="recovery">Recovery</option></select></label><label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label><label>Description<input value={description} onChange={(event) => setDescription(event.target.value)} /></label><button className="secondary-button" disabled={busy}>Create work item</button></form>}
    {mode === "reports" && role === "team" && <form className="momo-panel momo-form" onSubmit={(event) => {
      event.preventDefault();
      void run(() => createMomoReportDraft({ restaurantId, reportType, periodStart, periodEnd, summary: reportSummary, evidenceEventIds: eligibleEvents.map((item) => item.id) }), "Evidence-backed report draft saved for review.");
    }}><div className="momo-panel-heading"><div><p className="eyebrow">REPORT DRAFT</p><h2>Build from eligible activity</h2></div><StatusBadge status="pending" /></div><div className="momo-form-grid"><label>Cadence<select value={reportType} onChange={(event) => setReportType(event.target.value as "weekly" | "monthly")}><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label><label>Start date<input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} required /></label><label>End date<input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} required /></label><label className="wide">Reviewed summary<textarea value={reportSummary} onChange={(event) => setReportSummary(event.target.value)} rows={5} required /></label></div><p className="momo-form-note">{eligibleEvents.length} report-eligible activity events will be attached. The report cannot be approved without evidence.</p><button className="secondary-button" disabled={busy || eligibleEvents.length === 0}>Save report draft</button></form>}
    {mode === "reports" && role === "team" && data.approvals.some((approval) => approval.subject_type === "report") && <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">REPORT RELEASE QUEUE</p><h2>Human release decisions</h2></div><span>{data.approvals.filter((approval) => approval.subject_type === "report").length}</span></div><div className="momo-record-list">{data.approvals.filter((approval) => approval.subject_type === "report").map((approval) => <ApprovalRow key={approval.id} approval={approval} {...props} />)}</div></section>}
    {mode === "work" && <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">WORK QUEUE</p><h2>Persistent operating board</h2></div><span>{data.work.length}</span></div>{data.work.length === 0 ? <EmptyState title="No work item exists." detail="Nothing is represented as assigned, complete, blocked, or retried." /> : <div className="momo-work-grid">{data.work.map((item) => <article key={item.id}><div><strong>{item.title}</strong><StatusBadge status={item.status} /></div><p>{item.description || item.blocked_reason || "No detail recorded"}</p><small>{labelStatus(item.work_type)} · attempts {item.attempt_count}/{item.max_attempts} · due {formatDate(item.due_at)}</small>{role === "team" && (item.status === "failed" || item.status === "blocked") && <button disabled={busy || item.attempt_count >= item.max_attempts} onClick={() => void run(() => retryMomoWorkItem(item), "Retry queued within the recorded limit.")}>Retry safely</button>}</article>)}</div>}</section>}
    <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">REPORTS</p><h2>Client-safe evidence</h2></div><span>{data.reports.length}</span></div>{data.reports.length === 0 ? <EmptyState title="No reviewed report exists." detail="Orders, revenue, rankings, ROI, and outcomes are never fabricated." /> : <div className="momo-report-list">{data.reports.map((report) => {
      const approval = data.approvals.find((item) => item.subject_type === "report" && item.subject_id === report.id && item.approval_kind === "report_release");
      return <article key={report.id}><div><strong>{labelStatus(report.report_type)}</strong><StatusBadge status={approval?.status || report.status} /></div><p>{jsonList(report.summary).join(" · ") || "No summary recorded"}</p><small>{report.period_start} – {report.period_end} · approved {formatDate(report.approved_at)}</small>{role === "team" && report.status !== "approved" && !approvalBlocksNewRequest(approval) && <button disabled={busy} onClick={() => void run(() => requestMomoApproval({ restaurantId, subjectType: "report", subjectId: report.id, approvalKind: "report_release" }), "Report release review requested.")}>Request report release</button>}</article>;
    })}</div>}</section>
    <section className="momo-triple">
      <article className="momo-panel"><div className="momo-panel-heading"><h2>Monitoring</h2><span>{data.monitors.length}</span></div>{data.monitors.length === 0 ? <EmptyState title="No checks yet." detail="Health is unknown." /> : data.monitors.map((item) => <div className="momo-mini" key={item.id}><span><strong>{labelStatus(item.check_key)}</strong><small>{formatDate(item.checked_at)}</small></span><StatusBadge status={item.status} /></div>)}</article>
      <article className="momo-panel"><div className="momo-panel-heading"><h2>Alerts</h2><span>{data.alerts.length}</span></div>{data.alerts.length === 0 ? <EmptyState title="No alerts recorded." detail="Absence of records is not proof of health." /> : data.alerts.map((item) => <div className="momo-mini" key={item.id}><span><strong>{item.title}</strong><small>{item.message}</small></span><StatusBadge status={item.status} /></div>)}</article>
      <article className="momo-panel"><div className="momo-panel-heading"><h2>Recovery</h2><span>{data.recovery.length}</span></div>{data.recovery.length === 0 ? <EmptyState title="No recovery run." detail="No recovery is represented as complete." /> : data.recovery.map((item) => <div className="momo-mini" key={item.id}><span><strong>{labelStatus(item.action_key)}</strong><small>Attempts {item.attempt_count}/{item.max_attempts}</small></span><StatusBadge status={item.status} /></div>)}</article>
    </section>
    <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">ACTIVITY HISTORY</p><h2>Report eligibility is explicit</h2></div><span>{data.activity.length}</span></div>{data.activity.length === 0 ? <EmptyState title="No operating activity is recorded." detail="Reports remain safe-empty until reviewed work produces eligible evidence." /> : <div className="momo-record-list">{data.activity.map((event) => <article key={event.id}><div><strong>{labelStatus(event.event_type)}</strong><p>{valueText(event.payload) || "No public detail"}</p><small>{formatDate(event.created_at)} · {event.visibility}</small></div><StatusBadge status={event.report_eligible ? "report_eligible" : "internal_only"} /></article>)}</div>}</section>
  </div>;
}

function ReadinessPanel({ data, role }: PanelProps) {
  const gate = data.readinessGate;
  const required = data.readiness.filter((item) => item.required);
  return <div className="view">
    <MomoIntro eyebrow="FINAL MOMO READINESS GATE" title={gate?.can_activate ? "Eligible for final go / no-go review" : "Activation remains blocked"} description="This gate never infers readiness from deployment, code completion, or a partial score. Every required dimension must be verified and every blocker cleared." />
    <SafetyBoundary role={role} />
    <section className={`momo-gate ${gate?.can_activate ? "pass" : "blocked"}`}>
      <div><p className="eyebrow">OVERALL STATE</p><strong>{labelStatus(gate?.overall_status || "not_evaluated")}</strong><span>{gate?.can_activate ? "All database-enforced prerequisites passed. Final human approval is still a separate decision." : "No publishing, account action, or live provider execution may begin."}</span></div>
      <article><strong>{gate?.verified_count ?? 0}</strong><span>required dimensions verified</span></article>
      <article><strong>{gate?.blocker_count ?? required.filter((item) => jsonList(item.blockers).length > 0).length}</strong><span>blocking conditions</span></article>
      <article><strong>{gate?.required_count ?? required.length}</strong><span>required dimensions</span></article>
    </section>
    {data.readiness.length === 0 ? <EmptyState title="No readiness dimensions exist." detail="Momo cannot be marked ready without persisted dimensions and a successful database gate." /> : <section className="momo-readiness-grid">{data.readiness.map((dimension) => <article key={dimension.id}><div><h2>{dimension.label}</h2><StatusBadge status={dimension.status} /></div><section><p className="eyebrow">EVIDENCE</p>{jsonList(dimension.evidence).length ? <ul>{jsonList(dimension.evidence).map((item) => <li key={item}>{item}</li>)}</ul> : <p>No evidence recorded.</p>}</section><section className="momo-blockers"><p className="eyebrow">BLOCKERS</p>{jsonList(dimension.blockers).length ? <ul>{jsonList(dimension.blockers).map((item) => <li key={item}>{item}</li>)}</ul> : <p>No blocker recorded.</p>}</section><small>Last updated {formatDate(dimension.updated_at)}</small></article>)}</section>}
    <section className="momo-boundary"><strong>No readiness percentage is calculated</strong><span>The final gate is pass/fail. A count is shown for evidence, but partial completion is never converted into a readiness percentage. Other restaurants remain Restaurant Audit Center records only.</span><em>{gate?.can_activate ? "Review required" : "Blocked"}</em></section>
  </div>;
}

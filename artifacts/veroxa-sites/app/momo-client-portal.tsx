"use client";

/* Signed private Blob URLs cannot use the Next image optimizer. */
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  appendMomoClientMessage,
  configureMomoClient,
  createMomoClientRequest,
  decideMomoClientAction,
  getMomoClientMediaPreview,
  loadMomoClientMessages,
  loadMomoClientRequests,
  loadMomoClientSnapshot,
  revokeMomoClientMediaRights,
  revokeMomoClientAction,
  signOutMomoClient,
  submitMomoClientDecision,
  uploadMomoClientMedia,
  type MomoClientMessage,
  type MomoClientMediaUploadOutcome,
  type MomoClientAttentionReason,
  type MomoClientPublicConfig,
  type MomoClientRequest,
  type MomoClientSnapshot,
} from "./momo-client-data";
import { resolveMomoMediaWorkflow } from "./momo-media-guidance";
import {
  hasStrongPrivateFoodEvidence,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_DECODED_PIXELS,
  type VeroxaMediaRestaurantAssociation,
} from "./veroxa-private-media-assessment";

type ClientView = "dashboard" | "requests" | "setup" | "media" | "content" | "reports" | "services";
type MomoClientAction = () => Promise<void | string>;
type MomoClientRun = (action: MomoClientAction, success: string) => Promise<void>;

const clientRoutes: Record<ClientView, string> = {
  dashboard: "/client/dashboard",
  requests: "/client/requests",
  setup: "/client/onboarding",
  media: "/client/media",
  content: "/client/content",
  reports: "/client/reports",
  services: "/client/services",
};

const clientLabels: Record<ClientView, string> = {
  dashboard: "Overview",
  requests: "Requests",
  setup: "Setup",
  media: "Media",
  content: "Content",
  reports: "Reports",
  services: "Services",
};

const pathToView = (path: string): ClientView =>
  (Object.entries(clientRoutes).find(([, value]) => value === path)?.[0] as ClientView | undefined) ?? "dashboard";

const EMPTY_SNAPSHOT: MomoClientSnapshot = {
  mediaReadbackAvailable: false,
  mediaPipelineReadbackAvailable: false,
  mediaAssessmentReadbackAvailable: false,
  profile: { truthFields: [], contacts: [], steps: [], presence: [] },
  decisions: [], actionConsents: [], media: [], contentDirections: [], schedule: [], reports: [],
};

const label = (value: string) => value.replace(/[._-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
const clientAttentionMessage: Record<MomoClientAttentionReason, string> = {
  permission_needs_update: "Permission needs to be renewed or confirmed before preparation can continue.",
  image_needs_replacement: "This image needs a clearer replacement before preparation can continue.",
  checking_temporarily_unavailable: "Veroxa cannot confirm this image right now. Please try again later.",
  preparation_needs_veroxa_review: "Team Faraz is reviewing this image and will ask if you need to act.",
};
const when = (value: string | null) => {
  if (!value || !Number.isFinite(Date.parse(value))) return "Not recorded";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
};
const compactValue = (value: unknown): string => {
  if (value === null || value === undefined) return "Not recorded";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(compactValue).join(", ") || "Not recorded";
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.text === "string") return record.text;
    return Object.entries(record).map(([key, item]) => `${label(key)}: ${compactValue(item)}`).join(" · ");
  }
  return "Not recorded";
};

function Mark({ children }: { children: ReactNode }) {
  return <span className="brand-mark"><span>{children}</span></span>;
}

function Status({ value }: { value: string }) {
  return <span className={`status-badge ${value}`}>{label(value)}</span>;
}

function Intro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className="momo-intro"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div></header>;
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><strong>{title}</strong><p>{detail}</p></div>;
}

export function MomoClientPortal({
  initialPath,
  displayName,
  restaurantId,
  supabaseConfig,
}: {
  initialPath: string;
  displayName: string;
  restaurantId: string;
  supabaseConfig: MomoClientPublicConfig;
}) {
  configureMomoClient(supabaseConfig);
  const [view, setView] = useState<ClientView>(() => pathToView(initialPath));
  const [snapshot, setSnapshot] = useState<MomoClientSnapshot>(EMPTY_SNAPSHOT);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const mobileMoreCloseRef = useRef<HTMLButtonElement>(null);

  const refresh = async () => {
    setState("loading");
    try {
      setSnapshot(await loadMomoClientSnapshot(restaurantId));
      setState("ready");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    let active = true;
    void loadMomoClientSnapshot(restaurantId)
      .then((value) => {
        if (!active) return;
        setSnapshot(value);
        setState("ready");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => { active = false; };
  }, [restaurantId]);
  useEffect(() => {
    const sync = () => setView(pathToView(window.location.pathname));
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  useEffect(() => {
    if (!mobileMoreOpen) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMoreOpen(false);
    };
    document.body.style.overflow = "hidden";
    mobileMoreCloseRef.current?.focus();
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      previouslyFocused?.focus();
    };
  }, [mobileMoreOpen]);

  const navigate = (next: ClientView) => {
    const path = clientRoutes[next];
    setMobileMoreOpen(false);
    if (window.location.pathname === path) {
      setView(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.location.assign(path);
  };

  const run = async (action: MomoClientAction, success: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const outcomeMessage = await action();
      await refresh();
      setToast(outcomeMessage || success);
    } catch {
      setToast("That update was not saved. Nothing was changed; please try again.");
    } finally {
      setBusy(false);
      window.setTimeout(() => setToast(""), 4200);
    }
  };
  const signOut = () => void signOutMomoClient().then(() => window.location.assign("/"));

  const nav = Object.keys(clientRoutes) as ClientView[];
  const mobilePrimaryNav: ClientView[] = ["dashboard", "requests", "media", "content"];
  const mobileMoreNav: ClientView[] = ["setup", "reports", "services"];
  return <main className="app-shell" aria-label="Secure Momo client portal">
    <aside className="sidebar">
      <a className="brand" href={clientRoutes.dashboard} aria-label="Veroxa home"><Mark>V</Mark><span className="brand-copy"><strong>VEROXA</strong><small>GROWTH SYSTEMS</small></span></a>
      <nav className="main-nav" aria-label="Main navigation"><p className="nav-label">CLIENT PORTAL</p>{nav.map((item) => <a key={item} href={clientRoutes[item]} className={view === item ? "nav-item active" : "nav-item"} aria-current={view === item ? "page" : undefined}><span>{clientLabels[item]}</span></a>)}</nav>
      <div className="sidebar-spacer" />
      <div className="help-card"><strong>Need something?</strong><p>Send Veroxa a private request. Nothing becomes public without your decision.</p><a href={clientRoutes.requests}>Open requests</a></div>
      <Link className="profile-card" href="/account/security"><span className="avatar">MH</span><span><strong>{displayName}</strong><small>Account security · password</small></span></Link>
    </aside>
    <section className="workspace">
      <header className="topbar"><div className="mobile-brand"><Mark>V</Mark><strong>VEROXA</strong></div><div className="breadcrumbs"><span>Client portal</span><b>/</b><strong>{clientLabels[view]}</strong></div><div className="top-actions"><span className="live-pill"><i/> Signed in</span><Link className="top-avatar" href="/account/security" aria-label="Open account security" title="Account security">MH</Link><button type="button" className="client-sign-out" onClick={signOut}>Sign out</button></div></header>
      <div className="content">
        {state === "loading" && <div className="view"><Intro eyebrow="MOMO’S HOUSE SAN ANTONIO" title="Loading your workspace…" description="Veroxa is checking your private restaurant records." /></div>}
        {state === "error" && <div className="view"><Intro eyebrow="PRIVATE WORKSPACE" title="Workspace temporarily unavailable" description="No data was changed. Try loading the private workspace again." /><button className="primary-button" onClick={() => void refresh()}>Try again</button></div>}
        {state === "ready" && view === "dashboard" && <Dashboard snapshot={snapshot} />}
        {state === "ready" && view === "requests" && <Requests restaurantId={restaurantId} busy={busy} run={run} />}
        {state === "ready" && view === "setup" && <Setup snapshot={snapshot} restaurantId={restaurantId} busy={busy} run={run} />}
        {state === "ready" && view === "media" && <Media snapshot={snapshot} restaurantId={restaurantId} busy={busy} run={run} />}
        {state === "ready" && view === "content" && <Content snapshot={snapshot} restaurantId={restaurantId} busy={busy} run={run} />}
        {state === "ready" && view === "reports" && <Reports snapshot={snapshot} />}
        {state === "ready" && view === "services" && <Services snapshot={snapshot} navigate={navigate} />}
      </div>
      <nav className="mobile-nav client-mobile-nav" aria-label="Mobile navigation">{mobilePrimaryNav.map((item) => <a key={item} href={clientRoutes[item]} className={view === item ? "active" : ""} aria-current={view === item ? "page" : undefined}><span>{clientLabels[item]}</span></a>)}<button type="button" className={mobileMoreOpen || mobileMoreNav.includes(view) ? "active" : ""} aria-expanded={mobileMoreOpen} aria-controls="client-mobile-more" onClick={() => setMobileMoreOpen((open) => !open)}><span>More</span></button></nav>
    </section>
    {mobileMoreOpen && <div className="client-mobile-more-backdrop" onClick={() => setMobileMoreOpen(false)}><section id="client-mobile-more" className="client-mobile-more" role="dialog" aria-modal="true" aria-label="More client sections" onClick={(event) => event.stopPropagation()}><header><div><p className="eyebrow">MOMO’S HOUSE</p><h2>More</h2></div><button ref={mobileMoreCloseRef} type="button" onClick={() => setMobileMoreOpen(false)} aria-label="Close more menu">Close</button></header>{mobileMoreNav.map((item) => <a key={item} href={clientRoutes[item]} className={view === item ? "active" : ""}><strong>{clientLabels[item]}</strong><span>{item === "setup" ? "Review restaurant details" : item === "reports" ? "Read approved updates" : "Review online presence records"}</span></a>)}<Link href="/account/security"><strong>Account</strong><span>Password and sign-in security</span></Link><button type="button" className="client-more-sign-out" onClick={signOut}>Sign out of Veroxa</button></section></div>}
    {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
  </main>;
}

function Dashboard({ snapshot }: { snapshot: MomoClientSnapshot }) {
  const pendingDecisions = snapshot.contentDirections.filter((item) => !["pending", "in_review", "approved"].includes(item.confirmationStatus || "")).length;
  return <div className="view">
    <Intro eyebrow="MOMO’S HOUSE SAN ANTONIO" title="Momo’s House workspace" description="Review restaurant details, share media, make content decisions, send requests, and read approved updates." />
    <section className="momo-boundary"><strong>Your decisions stay in your control</strong><span>Veroxa keeps work private until the required review and your approval are recorded.</span><em>Private</em></section>
    <section className="momo-metrics"><article><span>Profile details</span><strong>{snapshot.profile.truthFields.length}</strong><small>restaurant facts on file</small></article><article><span>Media</span><strong>{snapshot.media.length}</strong><small>private items shared</small></article><article><span>Content decisions</span><strong>{pendingDecisions}</strong><small>waiting for you</small></article><article><span>Approved updates</span><strong>{snapshot.reports.length}</strong><small>available reports</small></article></section>
    <section className="momo-module-grid client-action-grid"><a href={clientRoutes.requests}><strong>Requests</strong><span>Ask Veroxa for help and keep the conversation together.</span><b>Open requests →</b></a><a href={clientRoutes.setup}><strong>Restaurant setup</strong><span>Review the business details Veroxa has on file.</span><b>Review setup →</b></a><a href={clientRoutes.media}><strong>Media library</strong><span>Share a private JPG food image and follow it to unscheduled Veroxa Ready.</span><b>Open media →</b></a><a href={clientRoutes.content}><strong>Content</strong><span>Review only directions that need your decision; routine preparation continues privately.</span><b>Open content →</b></a><a href={clientRoutes.reports}><strong>Reports</strong><span>Read only approved, evidence-backed updates.</span><b>Open reports →</b></a><a href={clientRoutes.services}><strong>Services</strong><span>See public profile records and what information may be needed later.</span><b>Review records →</b></a></section>
  </div>;
}

function Requests({ restaurantId, busy, run }: { restaurantId: string; busy: boolean; run: MomoClientRun }) {
  const [requests, setRequests] = useState<MomoClientRequest[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<MomoClientMessage[]>([]);
  const [requestType, setRequestType] = useState<MomoClientRequest["requestType"]>("support");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [priority, setPriority] = useState<MomoClientRequest["priority"]>("normal");
  const [message, setMessage] = useState("");
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const [messageKey, setMessageKey] = useState(() => crypto.randomUUID());

  const refresh = async () => setRequests(await loadMomoClientRequests(restaurantId));
  useEffect(() => {
    let active = true;
    void loadMomoClientRequests(restaurantId)
      .then((items) => { if (active) setRequests(items); })
      .catch(() => { if (active) setRequests([]); });
    return () => { active = false; };
  }, [restaurantId]);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    void loadMomoClientMessages(selected)
      .then((items) => { if (active) setMessages(items); })
      .catch(() => { if (active) setMessages([]); });
    return () => { active = false; };
  }, [selected]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      await createMomoClientRequest({ restaurantId, requestType, title, details, priority, idempotencyKey: requestKey });
      setTitle(""); setDetails(""); setPriority("normal");
      setRequestKey(crypto.randomUUID());
      await refresh();
    }, "Your private request was sent to Veroxa.");
  };

  return <div className="view"><Intro eyebrow="PRIVATE REQUESTS" title="Ask Veroxa for help" description="Create a request and keep its conversation in one private place." />
    <form className="momo-panel momo-form" onSubmit={submit}><div className="momo-panel-heading"><div><p className="eyebrow">NEW REQUEST</p><h2>What do you need?</h2></div></div><label>Request type<select value={requestType} onChange={(event) => setRequestType(event.target.value as MomoClientRequest["requestType"])}><option value="support">General help</option><option value="onboarding">Restaurant setup</option><option value="truth_update">Business detail update</option><option value="media">Media</option><option value="content">Content</option><option value="website">Website</option><option value="reporting">Report question</option></select></label><label>Title<input value={title} minLength={3} maxLength={120} required onChange={(event) => setTitle(event.target.value)} /></label><label>Details<textarea value={details} minLength={10} maxLength={4000} required rows={4} onChange={(event) => setDetails(event.target.value)} /></label><label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value as MomoClientRequest["priority"])}><option value="normal">Normal</option><option value="urgent">Urgent</option></select></label><button className="primary-button" disabled={busy || title.trim().length < 3 || details.trim().length < 10}>Send request</button></form>
    <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">YOUR REQUESTS</p><h2>Private history</h2></div><span>{requests.length}</span></div>{requests.length === 0 ? <Empty title="No requests yet." detail="Create one above when you need Veroxa’s help." /> : <div className="momo-record-list">{requests.map((item) => <article key={item.id}><button className="momo-record-button" onClick={() => setSelected(item.id)}><span><strong>{item.title}</strong><small>{label(item.requestType)} · {when(item.updatedAt)}</small></span><Status value={item.status} /></button>{selected === item.id && <div className="momo-thread">{messages.map((entry) => <p key={entry.id}><strong>{entry.senderRole === "client" ? "You" : "Veroxa"}</strong><span>{entry.body}</span><small>{when(entry.createdAt)}</small></p>)}{!["completed", "cancelled"].includes(item.status) && <form onSubmit={(event) => { event.preventDefault(); void run(async () => { await appendMomoClientMessage(item.id, message, messageKey); setMessage(""); setMessageKey(crypto.randomUUID()); setMessages(await loadMomoClientMessages(item.id)); }, "Your message was added."); }}><label>Reply<textarea value={message} minLength={1} maxLength={4000} onChange={(event) => setMessage(event.target.value)} /></label><button disabled={busy || !message.trim()}>Send reply</button></form>}</div>}</article>)}</div>}</section>
  </div>;
}

function Setup({ snapshot, restaurantId, busy, run }: { snapshot: MomoClientSnapshot; restaurantId: string; busy: boolean; run: MomoClientRun }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const pendingFor = (subjectId: string) => snapshot.decisions.some((item) => item.subjectId === subjectId && ["pending", "in_review"].includes(item.status));
  return <div className="view"><Intro eyebrow="RESTAURANT SETUP" title="Review Momo’s House details" description="Confirm accurate details, flag an issue, or ask Veroxa for help. Your decision is reviewed before the record changes." />
    <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">BUSINESS DETAILS</p><h2>Restaurant profile</h2></div><span>{snapshot.profile.truthFields.length}</span></div>{snapshot.profile.truthFields.length === 0 ? <Empty title="No business details are ready." detail="Veroxa will add reviewable details here first." /> : <div className="momo-record-list">{snapshot.profile.truthFields.map((item) => { const pending = pendingFor(item.id); return <article key={item.id}><div><strong>{label(item.fieldKey)}</strong><p>{compactValue(item.value)}</p><small>{label(item.status)}</small></div><Status value={pending ? "pending" : item.status} /><label>Optional note<input value={notes[item.id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Add context or describe a correction" /></label><div className="momo-decision"><button disabled={busy || pending} onClick={() => void run(() => submitMomoClientDecision({ restaurantId, subjectType: "truth_field", subjectId: item.id, kind: "business_truth", decision: "confirm", proposedValue: item.value, notes: notes[item.id] }), "Your confirmation was submitted for review.")}>Confirm accurate</button><button disabled={busy || pending || (notes[item.id] || "").trim().length < 3} onClick={() => void run(() => submitMomoClientDecision({ restaurantId, subjectType: "truth_field", subjectId: item.id, kind: "business_truth", decision: "needs_help", notes: notes[item.id] }), "Veroxa was asked to help with this detail.")}>Needs attention</button></div></article>; })}</div>}</section>
    <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">SETUP CHECKLIST</p><h2>Items for your review</h2></div><span>{snapshot.profile.steps.length}</span></div>{snapshot.profile.steps.map((step) => { const pending = pendingFor(step.id); return <article className="momo-mini" key={step.id}><span><strong>{step.title}</strong><small>{label(step.status)}</small></span><Status value={pending ? "pending" : step.status} /><div className="momo-decision"><button disabled={busy || pending || step.status !== "ready_for_review"} onClick={() => void run(() => submitMomoClientDecision({ restaurantId, subjectType: "onboarding_step", subjectId: step.id, kind: "onboarding", decision: "confirm", proposedValue: { stepKey: step.stepKey } }), "This setup item was submitted as complete.")}>Confirm complete</button><button disabled={busy || pending} onClick={() => void run(() => submitMomoClientDecision({ restaurantId, subjectType: "onboarding_step", subjectId: step.id, kind: "onboarding", decision: "needs_help", notes: `Help requested for ${step.title}.` }), "Veroxa was asked to help with this setup item.")}>Need help</button></div></article>; })}</section>
  </div>;
}

function mediaUploadAttentionMessage(errorCode: string): string {
  const handoff = " Your upload is complete. Veroxa and Team Faraz own the next step; you do not need to retry or upload another copy.";
  if (errorCode === "media_not_platform_ready") {
    return `Your original and upload instruction were saved privately. Veroxa found a file-fit exception.${handoff}`;
  }
  if (errorCode === "media_verification_failed") {
    return `Your original and upload instruction were saved privately. Veroxa found a secure-check exception.${handoff}`;
  }
  if (errorCode === "media_registration_response_invalid") {
    return `Your original was saved privately, but its upload receipt needs Team review.${handoff}`;
  }
  return `Your original and upload instruction were saved privately. Veroxa is handling a processing exception.${handoff} Nothing was posted or connected.`;
}

function Media({ snapshot, restaurantId, busy, run }: { snapshot: MomoClientSnapshot; restaurantId: string; busy: boolean; run: MomoClientRun }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [expiresAt, setExpiresAt] = useState("");
  const [scope, setScope] = useState<string[]>(["instagram"]);
  const [restaurantAssociation, setRestaurantAssociation] =
    useState<VeroxaMediaRestaurantAssociation>("not_for_restaurant");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [privateAssessmentRequested, setPrivateAssessmentRequested] =
    useState(false);
  const [uploadError, setUploadError] = useState("");
  const [revokeReason, setRevokeReason] = useState<Record<string, string>>({});
  const toggle = (item: string) => {
    setRightsConfirmed(false);
    setScope((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
  };
  const momoToday = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const invalidExpiry = Boolean(expiresAt && expiresAt < momoToday);
  const chooseFile = async (next: File | null) => {
    setUploadError("");
    setRightsConfirmed(false);
    setPrivateAssessmentRequested(false);
    if (!next) { setFile(null); return; }
    if (!["image/jpeg", "image/png"].includes(next.type)) {
      setFile(null);
      setUploadError("Choose a JPEG or PNG image. WebP, HEIC/HEIF, and video are not supported yet.");
      return;
    }
    if (next.size < 10 * 1024 || next.size > 10 * 1024 * 1024) {
      setFile(null);
      setUploadError("Choose an image between 10 KB and 10 MB.");
      return;
    }
    if (typeof createImageBitmap === "function") {
      try {
        const bitmap = await createImageBitmap(next);
        const pixels = bitmap.width * bitmap.height;
        bitmap.close();
        if (!Number.isSafeInteger(pixels) || pixels < 1 ||
          pixels > VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_DECODED_PIXELS) {
          setFile(null);
          setUploadError(
            "Choose an image with no more than 16,777,216 total pixels.",
          );
          return;
        }
      } catch {
        setFile(null);
        setUploadError(
          "This image could not be fully decoded. Choose a valid JPEG or PNG file.",
        );
        return;
      }
    }
    setFile(next);
  };
  const finishUploadOutcome = (outcome: MomoClientMediaUploadOutcome): string => {
    if (outcome.status === "uploaded_but_needs_attention") {
      const message = mediaUploadAttentionMessage(outcome.errorCode);
      setFile(null);
      setUploadKey((value) => value + 1);
      setExpiresAt("");
      setRightsConfirmed(false);
      setPrivateAssessmentRequested(false);
      setRestaurantAssociation("not_for_restaurant");
      setUploadError(message);
      return message;
    }
    setFile(null);
    setUploadKey((value) => value + 1);
    setExpiresAt("");
    setRightsConfirmed(false);
    setPrivateAssessmentRequested(false);
    setRestaurantAssociation("not_for_restaurant");
    setUploadError("");
    if (!outcome.assessment) {
      return "Your image and upload instruction were saved. Veroxa is handling the remaining private assessment; you do not need to do anything. Nothing was posted or connected.";
    }
    if (!outcome.associationRecorded) {
      return "Your image was assessed privately and its upload instruction is saved. Team Faraz owns any remaining exception; you do not need to do anything.";
    }
    return outcome.assessment.reused
      ? "Veroxa reused the same byte-level assessment. This upload keeps its own permission and restaurant-association record. Nothing was posted."
      : "Your image was assessed and tagged privately. Nothing was posted, scheduled, or connected.";
  };
  const submitUpload = async (): Promise<string> => {
    if (!file) throw new Error("media_file_required");
    setUploadError("");
    return finishUploadOutcome(await uploadMomoClientMedia({
      restaurantId,
      file,
      usageScope: scope,
      restaurantAssociation,
      expiresAt: expiresAt || undefined,
    }));
  };
  const newest = snapshot.media[0];
  const newestAssessable = Boolean(newest &&
    ["image/jpeg", "image/png"].includes(newest.mimeType));
  const newestSourceMediaDiscarded = newest?.sourceMediaDiscarded === true;
  const newestRestaurantContentEligible = Boolean(newest &&
    !newestSourceMediaDiscarded &&
    newest.privateAssessmentStatus === "completed" && newest.platformReady &&
    hasStrongPrivateFoodEvidence(newest.privateAssessment) &&
    newest.mimeType === "image/jpeg" &&
    newest.restaurantAssociation === "represents_current_restaurant_offering" &&
    newest.associationEvidenceClass === "real_owner");
  const newestWorkflow = resolveMomoMediaWorkflow({
    hasAsset: Boolean(newest),
    assetStatus: newest?.status,
    rightsStatus: newest?.rightsStatus,
    rightsValidFrom: newest?.validFrom,
    rightsExpiresAt: newest?.expiresAt,
    reviewStatus: newest?.reviewStatus,
    publicUseApproved: newest?.publicUseApproved,
    renditionStatus: newest?.renditionStatus,
  });
  const newestV2Known = Boolean(newest?.pipelineStatus);
  const newestV2Ready = !newestSourceMediaDiscarded &&
    newest?.pipelineStatus === "veroxa_ready" &&
    newestWorkflow.rightsConfirmed && newestRestaurantContentEligible;
  const newestV2Verified = newest?.pipelineVerificationStatus === "verified";
  const newestV2Preparing = !newestSourceMediaDiscarded &&
    newest?.pipelineStatus === "processing" &&
    newestWorkflow.rightsConfirmed && newestRestaurantContentEligible;
  const newestV2Attention = !newestSourceMediaDiscarded &&
    (newest?.pipelineStatus === "needs_attention" ||
      (newestV2Known && !newestWorkflow.rightsConfirmed));
  const newestReady = newestV2Ready;
  const newestVerified = newestV2Known
    ? newestV2Verified && !newestV2Attention
    : newestWorkflow.reviewApproved;
  const newestPrepared = newestV2Known
    ? newestV2Preparing || newestV2Ready
    : newestWorkflow.improvementReady;

  const readbackUnavailable = Boolean(newest && newestWorkflow.reviewApproved && !snapshot.mediaReadbackAvailable);
  return <div className="view"><Intro eyebrow="PRIVATE MEDIA" title="Share any food image for private assessment" description="Veroxa examines only what is visibly present, creates confidence-aware tags, and keeps dish or ingredient identity uncertain unless the owner confirms it separately. Nothing is posted from this screen." />
    <section className="momo-media-journey" aria-label="Media workflow">
      <div><p className="eyebrow">WHAT HAPPENS NEXT</p><h2>{newestSourceMediaDiscarded ? "Your newest image is excluded from future Ready use" : newestReady ? "Your newest image is Veroxa Ready" : newestV2Attention ? "Team Faraz owns the current exception" : newest?.privateAssessmentStatus === "failed" ? "Team Faraz owns the assessment exception" : newest?.privateAssessmentStatus === "completed" ? "Your newest image has private visual tags" : newest ? "Veroxa is handling your newest upload" : "Your first upload starts here"}</h2><p>{newest && !snapshot.mediaAssessmentReadbackAvailable ? "Your original remains private and unchanged while Veroxa restores the status readback. No action is needed from you." : newestSourceMediaDiscarded ? "Team discarded these exact image bytes from future content and Veroxa Ready for this restaurant. Every duplicate upload and asset record with the same SHA-256 hash is excluded; the immutable original and audit evidence remain stored." : newest && !newestAssessable ? "This earlier original remains private. Team Faraz will contact you only if a replacement is genuinely needed." : newestV2Attention ? "Preparation stopped safely and is in Team Faraz’s exception queue. You do not need to retry or upload another copy." : newest?.privateAssessmentStatus === "failed" ? "The private assessment stopped safely and is now a Team Faraz exception. You do not need to do anything." : newest?.assessmentReusedFromId ? "Veroxa reused only the identical-byte visual assessment. Permissions and restaurant association remain separate for this upload." : newestV2Ready ? "This image is evidence-complete and unscheduled. Team approval is still separate; nothing was posted or connected." : newest?.privateAssessmentStatus === "completed" && !newestRestaurantContentEligible ? "Neutral tags are ready. Team Faraz will resolve any remaining rights or restaurant-fact gate and contact you only if needed." : newestV2Preparing ? "This eligible image is being prepared privately using its current owner records." : newestV2Verified ? "Private checks passed; Veroxa is handling the remaining owner-rights and association gates." : readbackUnavailable ? "Legacy rendition status is temporarily unavailable. Your original remains private and unchanged." : newestWorkflow.nextAction === "confirm_rights" ? "Team Faraz will contact you if the permission record needs to be renewed." : newest ? "Your upload is saved and Veroxa is handling it." : "Choose a JPEG or PNG for private assessment."}</p></div>
      <ol><li className={newestWorkflow.uploaded ? "done" : "current"}><b>1</b><span><strong>Uploaded</strong><small>{newestWorkflow.uploaded ? "Private original saved" : "Choose a file"}</small></span></li><li className={newest?.privateAssessmentStatus === "completed" ? "done" : newestWorkflow.uploaded ? "current" : ""}><b>2</b><span><strong>Assess privately</strong><small>{newest?.privateAssessmentStatus === "completed" ? "Neutral tags ready" : newest?.privateAssessmentStatus === "failed" ? "Assessment stopped safely" : "Visible evidence only"}</small></span></li><li className={!newestSourceMediaDiscarded && newestPrepared ? newestV2Ready ? "done" : "current" : !newestSourceMediaDiscarded && newestVerified ? "current" : ""}><b>3</b><span><strong>Prepare content</strong><small>{newestV2Ready ? "Claims and copy validated" : newestSourceMediaDiscarded ? "Permanently excluded" : "Owner rights + association required"}</small></span></li><li className={newestReady ? "done" : ""}><b>4</b><span><strong>Veroxa Ready</strong><small>{newestReady ? "Evidence complete · unscheduled" : newestSourceMediaDiscarded ? "Future use excluded" : "No schedule or posting"}</small></span></li></ol>
      <em>Private · no posting</em>
    </section>
    <form id="client-media-upload" className="momo-panel momo-form client-media-upload" onSubmit={(event) => { event.preventDefault(); if (!file || !rightsConfirmed || !privateAssessmentRequested || invalidExpiry) return; void run(submitUpload, "Your image passed verification."); }}>
      <div className="momo-panel-heading"><div><p className="eyebrow">STEP 1 · UPLOAD</p><h2>Add a food image</h2><small>JPEG or PNG · portrait or landscape · up to 16,777,216 pixels · 10 KB to 10 MB · original unchanged. WebP, HEIC/HEIF, and video are not supported yet.</small></div></div>
      <label className="client-file-picker">Food image<input key={uploadKey} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={(event) => void chooseFile(event.target.files?.[0] || null)} /><span>{file ? file.name : "Choose from your phone or computer"}</span></label>
      {uploadError && <p className="momo-warning" role="alert">{uploadError}</p>}
      <details className="client-media-permission"><summary><span>Allowed preparation</span><strong>{scope.length ? scope.map(label).join(", ") : "Choose at least one"}</strong></summary><fieldset className="momo-scope"><legend>Where Veroxa may prepare this image</legend>{[["instagram", "Instagram"], ["facebook", "Facebook"], ["google_business", "Google Business"]].map(([value, text]) => <label className="momo-check" key={value}><input type="checkbox" checked={scope.includes(value)} onChange={() => toggle(value)} /><span>{text}</span></label>)}</fieldset><label>Permission end date (optional)<input type="date" min={momoToday} value={expiresAt} onChange={(event) => { setRightsConfirmed(false); setExpiresAt(event.target.value); }} /></label>{invalidExpiry && <p className="momo-warning">Choose today or a future date.</p>}</details>
      <label className="momo-check client-rights-check"><input type="checkbox" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} /><span>I confirm I own this image or have permission to provide it for the selected preparation uses.</span></label>
      <label className="momo-check client-rights-check"><input type="checkbox" checked={privateAssessmentRequested} onChange={(event) => setPrivateAssessmentRequested(event.target.checked)} /><span>Privately analyze this image now to create visual tags. This request applies only to this upload.</span></label>
      <label>Restaurant association<select value={restaurantAssociation} onChange={(event) => setRestaurantAssociation(event.target.value as VeroxaMediaRestaurantAssociation)}><option value="not_for_restaurant">Reference only — not for restaurant use</option><option value="licensed_generic_only">Licensed generic image — not a confirmed current offering</option><option value="represents_current_restaurant_offering">Current restaurant offering — owner confirmation</option></select></label>
      <p className="momo-form-note">Media permission and restaurant association are separate records. The association is final for this exact permission record; correcting it requires a new permission record. Selecting a preparation use does not connect an account or authorize posting. Only a real owner can confirm a current restaurant offering for Momo content.</p>
      <button className="primary-button" disabled={busy || !file || !rightsConfirmed || !privateAssessmentRequested || scope.length === 0 || invalidExpiry}>{busy ? "Saving your upload…" : "Upload once and let Veroxa handle it"}</button>
    </form>
    {!snapshot.mediaPipelineReadbackAvailable && snapshot.media.length > 0 && <p className="momo-warning client-readback-warning" role="status">Preparation status is temporarily unavailable. Originals and permissions remain safe; refresh this page to check again.</p>}
    <section className="momo-panel" id="client-media-library"><div className="momo-panel-heading"><div><p className="eyebrow">YOUR MEDIA</p><h2>Private originals and verified history</h2><small>Newest first. Veroxa uses an unchanged original when it already meets the platform-safe envelope; any actual legacy rendition is labeled separately.</small></div><span>{snapshot.media.length}</span></div>{snapshot.media.length === 0 ? <Empty title="No media has been shared." detail="Upload a first image above when it is ready." /> : <div className="momo-card-grid client-media-grid">{snapshot.media.map((item, index) => <ClientMediaCard key={item.id} item={item} eager={index === 0} readbackAvailable={snapshot.mediaReadbackAvailable} restaurantId={restaurantId} busy={busy} revokeReason={revokeReason[item.id] || ""} setRevokeReason={(value) => setRevokeReason((current) => ({ ...current, [item.id]: value }))} run={run} />)}</div>}</section>
  </div>;
}

function ClientMediaCard({
  item,
  eager,
  readbackAvailable,
  restaurantId,
  busy,
  revokeReason,
  setRevokeReason,
  run,
}: {
  item: MomoClientSnapshot["media"][number];
  eager: boolean;
  readbackAvailable: boolean;
  restaurantId: string;
  busy: boolean;
  revokeReason: string;
  setRevokeReason: (value: string) => void;
  run: MomoClientRun;
}) {
  const workflow = resolveMomoMediaWorkflow({
    hasAsset: true,
    assetStatus: item.status,
    rightsStatus: item.rightsStatus,
    rightsValidFrom: item.validFrom,
    rightsExpiresAt: item.expiresAt,
    reviewStatus: item.reviewStatus,
    publicUseApproved: item.publicUseApproved,
    renditionStatus: item.renditionStatus,
  });

  const assessableImage = ["image/jpeg", "image/png"].includes(item.mimeType);
  const verificationPending = !item.sourceMediaDiscarded &&
    assessableImage && item.status === "uploaded" &&
    item.privateAssessmentStatus === null;
  const restaurantContentEligible = !item.sourceMediaDiscarded &&
    item.privateAssessmentStatus === "completed" &&
    hasStrongPrivateFoodEvidence(item.privateAssessment) &&
    item.platformReady &&
    item.mimeType === "image/jpeg" &&
    item.restaurantAssociation === "represents_current_restaurant_offering" &&
    item.associationEvidenceClass === "real_owner";
  const v2Known = item.pipelineStatus !== null;
  const v2Ready = !item.sourceMediaDiscarded &&
    item.pipelineStatus === "veroxa_ready" &&
    workflow.rightsConfirmed && restaurantContentEligible;
  const v2Verified = item.pipelineVerificationStatus === "verified";
  const v2Preparing = !item.sourceMediaDiscarded &&
    item.pipelineStatus === "processing" &&
    workflow.rightsConfirmed && restaurantContentEligible;
  const v2Attention = !item.sourceMediaDiscarded &&
    (item.pipelineStatus === "needs_attention" ||
      (v2Known && !workflow.rightsConfirmed));
  const v2AttentionReasons: MomoClientAttentionReason[] = workflow.rightsConfirmed
    ? item.pipelineAttentionReasons
    : ["permission_needs_update"];
  const ready = v2Ready;
  const status = item.sourceMediaDiscarded ? "discarded" : v2Attention ? "needs_attention" : item.privateAssessmentStatus === "completed" && !restaurantContentEligible
    ? "assessed_private" : item.pipelineStatus ?? (item.reviewStatus || item.status);
  return <article className="momo-small-card client-media-card">
    <div className={ready ? "client-media-comparison ready" : "client-media-comparison"}><ClientPrivateMediaPreview storagePath={item.storagePath} mimeType={item.mimeType} alt={`Private original ${item.displayFileName}`} label="Original · unchanged" eager={eager} />{item.renditionStatus === "ready" && item.renditionStoragePath && <ClientPrivateMediaPreview storagePath={item.renditionStoragePath} mimeType="image/jpeg" alt={item.renditionAltText || `Prepared version of ${item.displayFileName}`} label={`Legacy rendition · ${item.renditionWidth}×${item.renditionHeight}`} eager={eager} />}</div>
    <div><strong>{item.displayFileName}</strong><Status value={status} /></div>
    <p>{label(item.mimeType)} · {(item.fileSize / 1024 / 1024).toFixed(1)} MB</p>
    <div className="client-media-steps" aria-label={`Workflow status for ${item.displayFileName}`}><span className="done">Uploaded</span><span className={item.privateAssessmentStatus === "completed" ? "done" : item.sourceMediaDiscarded ? "" : "current"}>Assess privately</span><span className={v2Ready ? "done" : !item.sourceMediaDiscarded && restaurantContentEligible && (v2Preparing || v2Verified) ? "current" : ""}>Prepare content</span><span className={ready ? "done" : ""}>Veroxa Ready</span></div>
    <small>Allowed: {item.usageScope.map(label).join(", ") || "No uses"} · {item.expiresAt ? `expires ${when(item.expiresAt)}` : "no expiry set"}</small>
    {item.uploadInstruction && <p className="momo-form-note"><strong>Upload instruction saved:</strong> {label(item.uploadInstruction)}{item.uploadInstructionNote ? ` · ${item.uploadInstructionNote}` : ""}</p>}
    {item.sourceMediaDiscarded && <div className="momo-warning"><strong>Discarded from future content and Veroxa Ready.</strong><p>These exact image bytes and every duplicate upload and asset record for this restaurant with the same SHA-256 hash are permanently excluded from future preparation and Ready. The immutable original, private assessment, and audit evidence remain stored.</p><small>Discarded {when(item.sourceMediaDiscardedAt)} · immutable original and audit retained</small></div>}
    {!item.sourceMediaDiscarded && !assessableImage && <p className="momo-warning">This earlier file remains private, but its format cannot enter the current verified assessment workflow. Team Faraz will contact you only if a replacement is genuinely needed.</p>}
    {assessableImage && item.mimeType !== "image/jpeg" && <p className="momo-form-note">PNG can be fully assessed and tagged privately, but only an eligible unchanged JPEG can proceed to Momo content or Veroxa Ready.</p>}
    {item.privateAssessment && <section className="client-private-assessment" aria-label={`Private visual assessment for ${item.displayFileName}`}><p className="eyebrow">VISIBLE EVIDENCE ONLY</p><strong>{item.privateAssessment.visualSummary}</strong><div className="momo-tag-row">{item.privateAssessment.tags.map((tag) => <span key={tag.slug} title={tag.uncertainty || "Directly visible"}>{tag.label} · {Math.round(tag.confidence * 100)}%</span>)}</div><small>{item.privateAssessment.uncertainties.join(" ")}</small></section>}
    {item.assessmentReusedFromId && <p className="momo-form-note">Identical bytes reused only the private visual assessment. This upload keeps separate permission and restaurant-association records.</p>}
    {item.exactDuplicate && !item.assessmentReusedFromId && <p className="momo-form-note">Veroxa recognized the same bytes. Permission and restaurant association remain separate for this upload.</p>}
    {verificationPending && <div className="momo-warning"><strong>Your original is saved and Veroxa is handling its secure checks.</strong><p>{item.uploadInstruction ? `Your ${label(item.uploadInstruction).toLowerCase()} instruction is saved too. ` : "The association selection from this earlier attempt could not be confirmed. "}Team Faraz owns the exception. You do not need to retry or upload another copy.</p></div>}
    {!item.sourceMediaDiscarded && assessableImage && item.privateAssessmentStatus === null && !verificationPending && <p className="momo-form-note">Veroxa is continuing the private assessment. You do not need to start or retry anything.</p>}
    {!item.sourceMediaDiscarded && item.privateAssessmentStatus === "failed" && <p className="momo-warning">The private assessment stopped safely and is now a Team Faraz exception. You do not need to retry or upload another copy. Nothing was posted or connected.</p>}
    {item.privateAssessmentStatus === "completed" && item.rightsId && item.sourceContentSha256 && (item.associationId ? <details className="client-media-permission"><summary><span>Restaurant association</span><strong>{label(item.restaurantAssociation || "not_for_restaurant")}</strong></summary><p>{item.sourceMediaDiscarded ? `This immutable association remains stored as evidence from ${when(item.associationRecordedAt)}. It cannot change the terminal exclusion from future content and Ready.` : <>This decision was recorded for the exact image bytes and permission record on {when(item.associationRecordedAt)}. It is immutable. To correct it, create a new permission record or <a href={clientRoutes.requests}>ask Veroxa for help</a>.</>}</p><small>Media rights and restaurant association remain separate. This record does not authorize posting, scheduling, or account connection.</small></details> : !item.sourceMediaDiscarded ? <div className="momo-warning"><strong>Your upload instruction is awaiting Veroxa resolution.</strong><p>Team Faraz owns this exception and will contact you only if restaurant facts or permission are genuinely needed.</p></div> : null)}
    {v2Attention && <p className="momo-warning">Preparation stopped safely. {v2AttentionReasons.length ? v2AttentionReasons.map((reason) => clientAttentionMessage[reason]).join(" ") : "Team Faraz is reviewing it and will ask if you need to act."}</p>}
    {v2Preparing && restaurantContentEligible && <p className="momo-form-note">Eligible owner-associated JPEG · private factual preparation is in progress.</p>}
    {v2Ready && <p className="momo-callout"><strong>Veroxa Ready · unscheduled.</strong> This image is evidence-complete. Nothing was posted, scheduled, or connected.</p>}
    {!item.sourceMediaDiscarded && !v2Known && workflow.nextAction === "team_review" && <p className="momo-form-note">Private assessment may continue, but restaurant content stays blocked until current real-owner rights and association are available.</p>}
    {!item.sourceMediaDiscarded && !v2Known && workflow.nextAction === "confirm_rights" && <p className="momo-warning">Permission is missing, expired, or withdrawn. <a href={clientRoutes.requests}>Ask Veroxa to help renew or replace this image.</a></p>}
    {!item.sourceMediaDiscarded && !v2Known && workflow.nextAction === "improve" && (readbackAvailable ? <p className="momo-callout">This legacy item is approved for a separate private rendition. Its unchanged original remains preserved.</p> : <p className="momo-warning">Veroxa cannot verify the legacy rendition status right now. Refresh this page before taking action.</p>)}
    {!item.sourceMediaDiscarded && !v2Known && workflow.nextAction === "ready" && <p className="momo-callout"><strong>Legacy private rendition ready.</strong> Compare any separately labeled rendition with the unchanged original above. Nothing was posted or connected.</p>}
    {!item.sourceMediaDiscarded && item.rightsId && item.rightsStatus === "confirmed" && <details className="client-media-permission"><summary>Withdraw future permission</summary><label>Reason<input value={revokeReason} minLength={10} onChange={(event) => setRevokeReason(event.target.value)} /></label><button type="button" disabled={busy || revokeReason.trim().length < 10} onClick={() => void run(() => revokeMomoClientMediaRights(restaurantId, item.rightsId!, revokeReason), "Permission was withdrawn; new public use is blocked.")}>Withdraw permission</button></details>}
  </article>;
}

function ClientPrivateMediaPreview({ storagePath, mimeType, alt, label: previewLabel, eager }: { storagePath: string; mimeType: string; alt: string; label: string; eager: boolean }) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewState, setPreviewState] = useState<"idle" | "loading" | "ready" | "error">(eager ? "loading" : "idle");
  useEffect(() => {
    if (!eager) return;
    let active = true;
    void getMomoClientMediaPreview(storagePath)
      .then((url) => { if (active) { setPreviewUrl(url); setPreviewState("ready"); } })
      .catch(() => { if (active) setPreviewState("error"); });
    return () => { active = false; };
  }, [eager, storagePath]);
  const loadPreview = () => {
    setPreviewState("loading");
    void getMomoClientMediaPreview(storagePath)
      .then((url) => { setPreviewUrl(url); setPreviewState("ready"); })
      .catch(() => setPreviewState("error"));
  };
  return <figure className="client-media-preview"><figcaption>{previewLabel}</figcaption>{previewState === "idle" ? <button type="button" onClick={loadPreview}>Load private preview</button> : previewState === "loading" ? <span>Opening private preview…</span> : previewState === "error" ? <><span>Preview unavailable</span><button type="button" onClick={loadPreview}>Try again</button></> : <>{mimeType.startsWith("video/") ? <video src={previewUrl} controls preload="metadata" /> : <img src={previewUrl} alt={alt} loading={eager ? "eager" : "lazy"} />}{previewUrl && <a className="momo-preview-button" href={previewUrl} target="_blank" rel="noreferrer">Open full size</a>}</>}</figure>;
}

function Content({ snapshot, restaurantId, busy, run }: { snapshot: MomoClientSnapshot; restaurantId: string; busy: boolean; run: MomoClientRun }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  return <div className="view"><Intro eyebrow="CONTENT REVIEW" title="Content decisions and schedule" description="Only directions that need your decision and approved schedule items appear here." />
    <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">NEEDS YOUR DECISION</p><h2>Content directions</h2></div><span>{snapshot.contentDirections.length}</span></div>{snapshot.contentDirections.length === 0 ? <Empty title="Nothing needs your decision." detail="A direction will appear here only when Veroxa asks you to review it." /> : <div className="momo-content-list">{snapshot.contentDirections.map((item) => { const waiting = ["pending", "in_review"].includes(item.confirmationStatus || ""); return <article className="momo-content-card" key={item.contentItemId}><div className="momo-panel-heading"><div><strong>{item.title}</strong><small>{item.concept}</small></div><Status value={item.confirmationStatus || "needs_review"} /></div><p className="momo-caption">{item.masterCaption || "No caption is included."}</p><small>{item.mediaDisplayFileName || "Text-only direction"}</small><label>Optional note<textarea rows={2} value={notes[item.contentItemId] || ""} onChange={(event) => setNotes((current) => ({ ...current, [item.contentItemId]: event.target.value }))} /></label><div className="momo-decision"><button disabled={busy || waiting} onClick={() => void run(() => submitMomoClientDecision({ restaurantId, subjectType: "content_item", subjectId: item.contentItemId, kind: "content_direction", decision: "confirm", proposedValue: { confirmed: true }, notes: notes[item.contentItemId] }), "Your content decision was submitted for review.")}>Confirm direction</button><button disabled={busy || waiting || (notes[item.contentItemId] || "").trim().length < 3} onClick={() => void run(() => submitMomoClientDecision({ restaurantId, subjectType: "content_item", subjectId: item.contentItemId, kind: "content_direction", decision: "reject", notes: notes[item.contentItemId] }), "Your concern was submitted for review.")}>Do not use</button><button disabled={busy || waiting} onClick={() => void run(() => submitMomoClientDecision({ restaurantId, subjectType: "content_item", subjectId: item.contentItemId, kind: "content_direction", decision: "needs_help", notes: notes[item.contentItemId] || "Help requested with this content direction." }), "Veroxa was asked to help with this direction.")}>Need help</button></div></article>; })}</div>}</section>
    <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">APPROVED SCHEDULE</p><h2>Upcoming and completed content</h2></div><span>{snapshot.schedule.length}</span></div>{snapshot.schedule.length === 0 ? <Empty title="No approved schedule is available." detail="Nothing is represented as scheduled or published." /> : <div className="momo-card-grid">{snapshot.schedule.map((item) => <article className="momo-small-card" key={item.itemId}><div><strong>{label(item.channel)}</strong><Status value={item.status} /></div><p>{item.caption}</p><small>{item.status === "published" ? `Published ${when(item.publishedAt)}` : `Scheduled ${when(item.scheduledFor)} · ${item.timezone}`}</small></article>)}</div>}</section>
  </div>;
}

function Reports({ snapshot }: { snapshot: MomoClientSnapshot }) {
  return <div className="view"><Intro eyebrow="APPROVED REPORTS" title="Evidence-backed updates" description="Only reports reviewed and approved for Momo appear here." /><section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">REPORT HISTORY</p><h2>Available updates</h2></div><span>{snapshot.reports.length}</span></div>{snapshot.reports.length === 0 ? <Empty title="No approved report is available." detail="Veroxa will show an update here only after its evidence and wording are reviewed." /> : <div className="momo-record-list">{snapshot.reports.map((report) => <article key={report.id}><div><strong>{label(report.reportType)}</strong><p>{compactValue(report.summary)}</p><small>{report.periodStart} – {report.periodEnd} · approved {when(report.approvedAt)}</small></div><Status value={report.status} /></article>)}</div>}</section></div>;
}

function ActionScope({ item }: { item: MomoClientSnapshot["actionConsents"][number] }) {
  return <div className="momo-callout">
    <strong>Exact scope</strong>
    <p>Target: {item.scope.target}</p>
    <p>Action: {item.scope.operation}</p>
    {item.scope.before !== undefined && <p>Current value: {compactValue(item.scope.before)}</p>}
    {item.scope.after !== undefined && <p>Proposed value: {compactValue(item.scope.after)}</p>}
    {item.scope.contentPreview && <p>Content: {item.scope.contentPreview}</p>}
    {item.scope.scheduledFor && <p>Scheduled: {when(item.scope.scheduledFor)}</p>}
    <small>{item.scope.batchSize ? `${item.scope.batchSize} action(s) only · ` : ""}Expires {when(item.expiresAt)}</small>
  </div>;
}

function Services({ snapshot, navigate }: { snapshot: MomoClientSnapshot; navigate: (view: ClientView) => void }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [revocationReasons, setRevocationReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const pending = snapshot.actionConsents.filter((item) => item.status === "pending");
  const history = snapshot.actionConsents.filter((item) => item.status !== "pending");

  const perform = async (action: () => Promise<void>, failure: string) => {
    if (busy) return;
    setBusy(true);
    setFeedback("");
    try {
      await action();
      window.location.reload();
    } catch {
      setFeedback(failure);
    } finally {
      setBusy(false);
    }
  };

  return <div className="view">
    <Intro eyebrow="PUBLIC PROFILE RECORDS" title="Online presence setup" description="See public profile records and make a decision only when Veroxa presents an exact action." />
    <section className="momo-boundary"><strong>No account access is needed yet</strong><span>Veroxa will explain the exact access request before any connection is made.</span><em>Waiting</em></section>
    {feedback && <p className="notice" role="status">{feedback}</p>}
    {pending.length > 0 && <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">SPECIFIC DECISIONS</p><h2>Actions waiting for your decision</h2></div><span>{pending.length}</span></div><p className="momo-form-note">Your decision covers only the target, action, value or content, quantity, and time shown below.</p><div className="momo-record-list">{pending.map((item) => <article key={item.id}><div><strong>{label(item.actionKind)}</strong><p>{item.description}</p></div><Status value={item.status} /><ActionScope item={item} /><label>Optional note<input value={notes[item.id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} /></label><div className="momo-decision"><button disabled={busy} onClick={() => void perform(() => decideMomoClientAction(item.id, "approved", notes[item.id]), "This decision could not be saved. It may have expired; ask Veroxa to send a new request.")}>Approve this exact action</button><button disabled={busy} onClick={() => void perform(() => decideMomoClientAction(item.id, "rejected", notes[item.id]), "This decision could not be saved. Please ask Veroxa for help.")}>Do not proceed</button><button disabled={busy} onClick={() => navigate("requests")}>Ask a question</button></div></article>)}</div></section>}
    {history.length > 0 && <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">DECISION HISTORY</p><h2>Past exact actions</h2></div><span>{history.length}</span></div><div className="momo-record-list">{history.map((item) => <article key={item.id}><div><strong>{label(item.actionKind)}</strong><p>{item.description}</p><small>Decided {when(item.decidedAt)}{item.revokedAt ? ` · withdrawn ${when(item.revokedAt)}` : ""}</small></div><Status value={item.status} /><ActionScope item={item} />{item.status === "approved" && <><label>Reason to withdraw approval<input minLength={10} value={revocationReasons[item.id] || ""} onChange={(event) => setRevocationReasons((current) => ({ ...current, [item.id]: event.target.value }))} /></label><button disabled={busy || (revocationReasons[item.id] || "").trim().length < 10} onClick={() => void perform(() => revokeMomoClientAction(item.id, revocationReasons[item.id]), "Approval could not be withdrawn. Please ask Veroxa for help.")}>Withdraw this approval</button></>}</article>)}</div></section>}
    <section className="momo-panel"><div className="momo-panel-heading"><div><p className="eyebrow">PROFILE RECORDS</p><h2>Known public locations</h2></div><span>{snapshot.profile.presence.length}</span></div>{snapshot.profile.presence.length === 0 ? <Empty title="No public profile record is ready." detail="Veroxa will add a reviewable record before asking for anything." /> : <div className="momo-card-grid">{snapshot.profile.presence.map((item) => <article className="momo-small-card" key={item.id}><div><strong>{label(item.channel)}</strong><Status value="on_file" /></div><p>{item.publicUrl || "No public URL recorded"}</p></article>)}</div>}<button className="secondary-button" onClick={() => navigate("requests")}>Ask a question about access</button></section>
  </div>;
}

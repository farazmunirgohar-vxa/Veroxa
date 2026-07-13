"use client";

import { useEffect, useState, type FormEvent } from "react";
import { RestaurantAuditCenter } from "./audit-center";
import { MomoOperatingCenter } from "./momo-operating-center";
import type { MomoReadinessTracker } from "./momo-readiness-types";
import {
  configureVeroxaSupabase,
  getCurrentVeroxaAccess,
  requestVeroxaMagicLink,
  signOutOfVeroxa,
  submitPublicAudit,
  subscribeToVeroxaAuth,
  type VeroxaAccess,
  type VeroxaPublicConfig,
} from "./veroxa-supabase";

type View =
  | "public"
  | "audit"
  | "login"
  | "home"
  | "onboarding"
  | "media"
  | "content"
  | "reports"
  | "services"
  | "team"
  | "team-audits"
  | "team-work"
  | "team-intelligence"
  | "team-content"
  | "team-reports"
  | "team-readiness";
type IconName =
  | "home"
  | "spark"
  | "image"
  | "chart"
  | "grid"
  | "arrow"
  | "check"
  | "clock"
  | "bell"
  | "chevron"
  | "upload"
  | "calendar"
  | "play"
  | "instagram"
  | "google"
  | "star"
  | "message"
  | "globe"
  | "shield"
  | "close";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></>,
    spark: <><path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z"/><path d="m5 15 .8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Z"/></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 2-2 5 5"/></>,
    chart: <><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    upload: <><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 15v5h16v-5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    play: <path d="m9 7 8 5-8 5V7Z"/>,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".7" fill="currentColor" stroke="none"/></>,
    google: <><path d="M20 12h-8"/><path d="M18.5 6.5A8 8 0 1 0 20 12c0 4.4-3.6 8-8 8"/></>,
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6-4.4-4.3 6.1-.9L12 3Z"/>,
    message: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/><path d="M8 9h8M8 13h5"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18"/></>,
    shield: <><path d="M12 3 20 6v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  };
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const clientNav: { id: View; label: string; icon: IconName; path: string }[] = [
  { id: "home", label: "Overview", icon: "home", path: "/client/dashboard" },
  { id: "onboarding", label: "Setup", icon: "spark", path: "/client/onboarding" },
  { id: "media", label: "Media", icon: "image", path: "/client/media" },
  { id: "content", label: "Content", icon: "calendar", path: "/client/content" },
  { id: "reports", label: "Reports", icon: "chart", path: "/client/reports" },
  { id: "services", label: "Services", icon: "grid", path: "/client/services" },
];

const teamNav: { id: View; label: string; icon: IconName; path: string }[] = [
  { id: "team", label: "Dashboard", icon: "home", path: "/team/momo" },
  { id: "team-audits", label: "Audit Center", icon: "shield", path: "/team/audits" },
  { id: "team-work", label: "Work", icon: "grid", path: "/team/momo/work" },
  { id: "team-intelligence", label: "Intelligence", icon: "spark", path: "/team/momo/intelligence" },
  { id: "team-content", label: "Content + AI", icon: "image", path: "/team/momo/content-ai" },
  { id: "team-reports", label: "Reports", icon: "chart", path: "/team/momo/reports" },
  { id: "team-readiness", label: "Readiness", icon: "shield", path: "/team/momo/readiness" },
];

const routeToView: Record<string, View> = {
  "/": "public",
  "/free-audit": "audit",
  "/login": "login",
  "/client/dashboard": "home",
  "/client/onboarding": "onboarding",
  "/client/media": "media",
  "/client/content": "content",
  "/client/reports": "reports",
  "/client/services": "services",
  "/team/dashboard": "team",
  "/team/momo": "team",
  "/team/audits": "team-audits",
  "/team/momo/work": "team-work",
  "/team/momo/intelligence": "team-intelligence",
  "/team/momo/content-ai": "team-content",
  "/team/momo/reports": "team-reports",
  "/team/momo/readiness": "team-readiness",
};

const viewToPath = Object.fromEntries(Object.entries(routeToView).map(([path, view]) => [view, path])) as Record<View, string>;

export default function Home() {
  return <VeroxaApp initialPath="/" />;
}

type AccessSeed = Pick<VeroxaAccess, "role" | "displayName" | "restaurantId">;

export function VeroxaApp({
  initialPath,
  initialAccess,
  initialMomoReadiness,
  initialSupabaseConfig,
}: {
  initialPath: string;
  initialAccess?: AccessSeed;
  initialMomoReadiness?: MomoReadinessTracker;
  initialSupabaseConfig?: VeroxaPublicConfig;
}) {
  configureVeroxaSupabase(initialSupabaseConfig);
  // The server-loaded tracker remains durable RR evidence; the live readiness
  // surface below is authoritative from the scoped Supabase operating model.
  void initialMomoReadiness;
  const [view, setView] = useState<View>(routeToView[initialPath] ?? "public");
  const [toast, setToast] = useState("");
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [access, setAccess] = useState<
    | { status: "loading"; value: null }
    | { status: "guest"; value: null }
    | { status: "authenticated"; value: AccessSeed }
  >(initialAccess ? { status: "authenticated", value: initialAccess } : { status: "loading", value: null });

  useEffect(() => {
    const syncRoute = () => setView(routeToView[window.location.pathname] ?? "public");
    syncRoute();
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  useEffect(() => {
    let active = true;
    const refreshAccess = () => {
      void getCurrentVeroxaAccess()
        .then((next) => {
          if (!active) return;
          setAccess(next
            ? { status: "authenticated", value: next }
            : { status: "guest", value: null });
        })
        .catch(() => {
          if (active) setAccess({ status: "guest", value: null });
        });
    };
    refreshAccess();
    const unsubscribe = subscribeToVeroxaAuth(refreshAccess);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const changeView = (next: View) => {
    if (next === "login" && !initialSupabaseConfig && window.location.pathname !== "/login") {
      window.location.assign("/login");
      return;
    }
    setView(next);
    const nextPath = viewToPath[next] ?? "/";
    if (window.location.pathname !== nextPath) window.history.pushState({}, "", nextPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSignOut = async () => {
    if (signOutBusy) return;
    setSignOutBusy(true);
    try {
      await signOutOfVeroxa();
      window.location.assign("/");
    } catch {
      setToast("Sign-out failed. You are still signed in; check the connection and try again.");
      window.setTimeout(() => setToast(""), 4200);
      setSignOutBusy(false);
    }
  };

  if (view === "public") return <PublicHome onNavigate={changeView} />;
  if (view === "audit") return <AuditPage onNavigate={changeView} />;
  if (view === "login") return <LoginPage onNavigate={changeView} />;

  const isTeam = view.startsWith("team");
  const isProtected = isTeam || ["home", "onboarding", "media", "content", "reports", "services"].includes(view);
  if (isProtected && access.status !== "authenticated") {
    return access.status === "loading"
      ? <main className="login-shell"><section className="login-card"><p className="eyebrow">SECURE ACCESS</p><h1>Checking your session…</h1><p>Veroxa is validating the signed account session and workspace membership.</p></section></main>
      : <LoginPage onNavigate={changeView} />;
  }
  if (isTeam && access.status === "authenticated" && access.value.role !== "team") {
    return <main className="login-shell"><section className="login-card"><p className="eyebrow">WORKSPACE BOUNDARY</p><h1>Team access required.</h1><p>This signed account belongs to the Momo client workspace and cannot open Team Faraz routes.</p><button className="primary-button" onClick={() => window.location.assign("/client/dashboard")}>Open Momo workspace</button></section></main>;
  }
  if (!isTeam && isProtected && access.status === "authenticated" && access.value.role !== "client") {
    return <main className="login-shell"><section className="login-card"><p className="eyebrow">WORKSPACE BOUNDARY</p><h1>Momo client access required.</h1><p>This signed account belongs to Team Faraz and cannot enter a client route.</p><button className="primary-button" onClick={() => window.location.assign("/team/momo")}>Open Team workspace</button></section></main>;
  }
  const activeNav = isTeam ? teamNav : clientNav;
  const activeLabel = activeNav.find((item) => item.id === view)?.label ?? "Dashboard";

  return (
    <main className="app-shell" aria-label={isTeam ? "Secure Team route · Momo-only production boundary" : "Secure Momo client route"}>
      <aside className="sidebar">
        <button className="brand" onClick={() => changeView(isTeam ? "team" : "home")} aria-label="Veroxa home">
          <span className="brand-mark"><span>V</span></span>
          <span className="brand-copy"><strong>VEROXA</strong><small>GROWTH SYSTEMS</small></span>
        </button>

        <nav className="main-nav" aria-label="Main navigation">
          <p className="nav-label">{isTeam ? "TEAM FARAZ" : "CLIENT PORTAL"}</p>
          {activeNav.map((item) => (
            <button key={item.id} className={view === item.id ? "nav-item active" : "nav-item"} onClick={() => changeView(item.id)} aria-current={view === item.id ? "page" : undefined}>
              <Icon name={item.icon} size={19}/><span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <div className="help-card">
          <span className="help-icon"><Icon name="message" size={18}/></span>
          <strong>{isTeam ? "Safety boundary" : "Need something?"}</strong>
          <p>{isTeam ? "No public action without Faraz review and confirmed business truth." : "Verified Momo records will appear only after Team review and owner confirmation."}</p>
          <button onClick={() => { setToast(isTeam ? "Operating guardrails are active" : "Client workspace is safely waiting for verified records"); window.setTimeout(() => setToast(""), 2600); }}>{isTeam ? "Review guardrails" : "View safe status"} <Icon name="arrow" size={15}/></button>
        </div>
        <button className="profile-card" onClick={() => void handleSignOut()} title="Sign out" disabled={signOutBusy}>
          <span className="avatar">{isTeam ? "FM" : "MK"}</span>
          <span><strong>{access.status === "authenticated" ? access.value.displayName : isTeam ? "Team Faraz" : "Momo’s House"}</strong><small>{isTeam ? "Secure Team access · sign out" : "Momo only · sign out"}</small></span>
          <Icon name="chevron" size={16}/>
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><span>V</span></span><strong>VEROXA</strong></div>
          <div className="breadcrumbs"><span>{isTeam ? "Team workspace" : "Client portal"}</span><b>/</b><strong>{activeLabel}</strong></div>
          <div className="top-actions">
            <span className="live-pill"><i/> Authenticated</span>
            <button className="icon-button" aria-label="Notifications"><Icon name="bell" size={19}/></button>
            <button className="top-avatar" aria-label="Sign out" title="Sign out" onClick={() => void handleSignOut()} disabled={signOutBusy}>{isTeam ? "FM" : "MH"}</button>
          </div>
        </header>

        <div className="content">
          {view === "team-audits" && <RestaurantAuditCenter notify={(message) => { setToast(message); window.setTimeout(() => setToast(""), 2600); }} />}
          {view !== "team-audits" && access.status === "authenticated" && (
            <MomoOperatingCenter
              view={view}
              access={access.value}
              onNavigate={(next) => changeView(next as View)}
              notify={(message) => { setToast(message); window.setTimeout(() => setToast(""), 3200); }}
            />
          )}
        </div>

        <nav className={isTeam ? "mobile-nav team-mobile-nav" : "mobile-nav"} aria-label="Mobile navigation">
          {activeNav.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => changeView(item.id)} aria-current={view === item.id ? "page" : undefined}><Icon name={item.icon} size={18}/><span>{item.label}</span></button>)}
          {isTeam && <button onClick={() => void handleSignOut()} disabled={signOutBusy}><Icon name="close" size={18}/><span>{signOutBusy ? "Signing out" : "Sign out"}</span></button>}
        </nav>
      </section>

      {toast && <div className="toast" role="status" aria-live="polite"><Icon name="check" size={17}/>{toast}</div>}
    </main>
  );
}

function PublicHeader({ onNavigate }: { onNavigate: (view: View) => void }) {
  return <header className="public-header">
    <button className="brand public-brand" onClick={() => onNavigate("public")} aria-label="Veroxa home">
      <span className="brand-mark"><span>V</span></span>
      <span className="brand-copy"><strong>VEROXA</strong><small>RESTAURANT GROWTH SYSTEMS</small></span>
    </button>
    <nav aria-label="Public navigation">
      <button onClick={() => onNavigate("public")}>How it works</button>
      <button onClick={() => onNavigate("audit")}>Free audit</button>
      <button className="public-login" onClick={() => onNavigate("login")}>Portal access <Icon name="arrow" size={15}/></button>
    </nav>
  </header>;
}

function PublicHome({ onNavigate }: { onNavigate: (view: View) => void }) {
  return <main className="public-shell">
    <PublicHeader onNavigate={onNavigate} />
    <section className="public-hero">
      <div className="public-hero-copy">
        <p className="eyebrow">RESTAURANT GROWTH INFRASTRUCTURE</p>
        <h1>Be easier to find.<br/>Easier to trust.<br/><em>Easier to choose.</em></h1>
        <p>Veroxa organizes the online presence customers use to discover, understand, and choose a restaurant—without adding another complicated system for the owner to manage.</p>
        <div className="public-actions">
          <button className="primary-button" onClick={() => onNavigate("audit")}>Start with a free audit <Icon name="arrow" size={17}/></button>
          <button className="text-button light" onClick={() => onNavigate("login")}>Open portal access</button>
        </div>
        <div className="public-trust"><span><Icon name="check" size={15}/> No contract</span><span><Icon name="check" size={15}/> Cancel anytime</span><span><Icon name="shield" size={15}/> Veroxa review before public work</span></div>
      </div>
      <div className="public-system-card">
        <div className="system-card-head"><span>VEROXA OPERATING FLOW</span><i>Pre-live</i></div>
        <div className="system-flow">
          <SystemStep number="01" title="Audit" text="Find visibility gaps and restaurant opportunities." />
          <SystemStep number="02" title="Prepare" text="Turn business truth and media into exact actions." />
          <SystemStep number="03" title="Review" text="Faraz reviews public-facing work before release." />
          <SystemStep number="04" title="Report" text="Show what happened, what is blocked, and what is next." />
        </div>
      </div>
    </section>

    <section className="public-modules">
      <article><span><Icon name="spark" size={23}/></span><p className="eyebrow">CLIENT EXPERIENCE</p><h2>Simple for the restaurant.</h2><p>Onboarding, media guidance, requests, weekly updates, reports, and connection status in one calm portal.</p></article>
      <article><span><Icon name="grid" size={23}/></span><p className="eyebrow">TEAM FARAZ</p><h2>Operational behind the scenes.</h2><p>Restaurant intelligence, work queues, approvals, readiness, reporting, and safe next actions organized around Momo’s House.</p></article>
      <article><span><Icon name="shield" size={23}/></span><p className="eyebrow">CONTROLLED EXECUTION</p><h2>Honest by design.</h2><p>No invented results, unconfirmed business facts, or automatic public action. Veroxa prepares; the right person confirms and reviews.</p></article>
    </section>

    <section className="public-offer">
      <div><p className="eyebrow">ACTIVE LAUNCH OFFER</p><h2>Complete Online Presence</h2><p>Google and Maps basics, local SEO basics, website alignment when access is provided, Facebook, Instagram, picture-based content, client portal, weekly updates, and monthly reports.</p></div>
      <div className="public-price"><strong>$495</strong><span>/ month</span><small>No contract · media dependent</small><button onClick={() => onNavigate("audit")}>Check restaurant fit <Icon name="arrow" size={15}/></button></div>
    </section>

  </main>;
}

function SystemStep({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="system-step"><b>{number}</b><span><strong>{title}</strong><small>{text}</small></span><Icon name="chevron" size={16}/></div>;
}

function AuditPage({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "submitting" }
    | { kind: "success"; reference: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [formStartedAt, setFormStartedAt] = useState(() => new Date().toISOString());
  const [idempotencyKey, setIdempotencyKey] = useState("");

  function refreshExpiredAuditSession() {
    if (Date.now() - Date.parse(formStartedAt) < 2 * 60 * 60 * 1000) return;
    setFormStartedAt(new Date().toISOString());
    setIdempotencyKey("");
  }

  async function handleAuditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (Date.now() - Date.parse(formStartedAt) >= 2 * 60 * 60 * 1000) {
      refreshExpiredAuditSession();
      setState({ kind: "error", message: "This audit form session was refreshed for security. Please wait a few seconds, then submit again." });
      return;
    }
    const form = new FormData(formElement);
    const contactEmail = String(form.get("contactEmail") || "").trim();
    const contactPhone = String(form.get("contactPhone") || "").trim();
    if (!contactEmail && !contactPhone) {
      setState({ kind: "error", message: "Enter either a contact email or phone number so Team Faraz can follow up about the audit." });
      formElement.querySelector<HTMLInputElement>('input[name="contactEmail"]')?.focus();
      return;
    }
    setState({ kind: "submitting" });
    const stableIdempotencyKey = idempotencyKey || crypto.randomUUID();
    setIdempotencyKey(stableIdempotencyKey);
    try {
      const result = await submitPublicAudit({
        restaurantName: String(form.get("restaurantName") || ""),
        city: String(form.get("city") || ""),
        state: String(form.get("state") || ""),
        websiteUrl: String(form.get("websiteUrl") || ""),
        googleProfileUrl: String(form.get("googleProfileUrl") || ""),
        contactName: String(form.get("contactName") || ""),
        contactEmail,
        contactPhone,
        contactNote: String(form.get("contactNote") || ""),
        consentToContact: form.get("consent") === "yes",
        consentVersion: "2026-07-12",
        formStartedAt,
        honeypot: String(form.get("companyWebsite") || ""),
        idempotencyKey: stableIdempotencyKey,
      });
      setState({ kind: "success", reference: result.reference_code });
      formElement.reset();
    } catch (error) {
      const code = error instanceof Error ? error.message : "audit_submission_failed";
      setState({
        kind: "error",
        message: code === "rate_limited"
          ? "Too many audit requests were submitted recently. Please wait and try again."
          : code === "validation_failed"
            ? "Check the required fields, contact details, and website links, then submit the request again."
            : code === "request_too_large"
              ? "This request is too large. Shorten the notes or links, then try again."
              : code === "temporarily_unavailable"
                ? "The protected audit queue is temporarily unavailable. Your request was not saved; please try again shortly."
                : "We could not save this audit request. Your entries are still here; please try again shortly.",
      });
    }
  }

  return <main className="public-shell inner-public">
    <PublicHeader onNavigate={onNavigate} />
    <section className="public-inner-hero"><p className="eyebrow">RESTAURANT OPPORTUNITY ENGINE</p><h1>Start with the truth.</h1><p>Veroxa begins by checking whether a restaurant is easy to find, easy to understand, and easy to choose online.</p></section>
    <section className="audit-layout">
      {state.kind !== "success" && <form className="audit-form" onSubmit={handleAuditSubmit} onFocusCapture={(event) => {
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
          refreshExpiredAuditSession();
        }
      }} aria-busy={state.kind === "submitting"}>
        <label>Restaurant name<input name="restaurantName" required minLength={2} maxLength={160} placeholder="Restaurant name" /></label>
        <label>City<input name="city" required minLength={2} maxLength={100} placeholder="San Antonio" /></label>
        <label>State<input name="state" required minLength={2} maxLength={40} placeholder="TX" /></label>
        <label>Website<input name="websiteUrl" type="url" placeholder="https://" /></label>
        <label>Google profile<input name="googleProfileUrl" type="url" placeholder="https://" /></label>
        <label>Contact name<input name="contactName" maxLength={160} placeholder="Your name" /></label>
        <label>Best contact email<input name="contactEmail" type="email" maxLength={320} autoComplete="email" aria-describedby="audit-contact-help" placeholder="owner@restaurant.com" /></label>
        <label>Contact phone<input name="contactPhone" type="tel" maxLength={50} autoComplete="tel" aria-describedby="audit-contact-help" placeholder="(210) 555-0123" /></label>
        <small id="audit-contact-help" className="audit-contact-help">Enter at least one contact method: email or phone.</small>
        <label className="audit-form-wide">What should Team Faraz know?<textarea name="contactNote" maxLength={2000} rows={3} placeholder="Optional context for the audit" /></label>
        <label className="audit-consent"><input name="consent" type="checkbox" value="yes" required /><span>I agree that Veroxa may store this request and contact me about this audit. No public changes or restaurant account are created.</span></label>
        <label className="audit-honeypot" aria-hidden="true">Company website<input name="companyWebsite" tabIndex={-1} autoComplete="off" /></label>
        <button className="primary-button" type="submit" disabled={state.kind === "submitting"}>{state.kind === "submitting" ? "Saving audit request…" : "Send audit request"} <Icon name="arrow" size={16}/></button>
        {state.kind === "error" && <small className="audit-submit-error" role="alert" aria-live="assertive">{state.message}</small>}
        <small>Your request is saved in Veroxa’s protected Audit Center. It does not create a client account, operations workspace, or automatic restaurant contact.</small>
      </form>}
      <aside className="audit-explainer">
        {state.kind === "success" ? <div className="audit-ready" role="status" aria-live="polite"><span><Icon name="check" size={24}/></span><h2>Audit request saved.</h2><p>Reference <strong>{state.reference}</strong> is now in Team Faraz’s protected audit queue. No client workspace, public change, or external contact was created.</p><button onClick={() => { setIdempotencyKey(""); setFormStartedAt(new Date().toISOString()); setState({ kind: "idle" }); }}>Submit another audit <Icon name="arrow" size={15}/></button></div> : <><p className="eyebrow">WHAT VEROXA REVIEWS</p><h2>Five restaurant visibility layers</h2><ul><li>Google Business and Maps readiness</li><li>Business information consistency</li><li>Menu, ordering, website, and contact paths</li><li>Social trust and usable restaurant media</li><li>Whether Veroxa can create practical value honestly</li></ul><p className="audit-note"><Icon name="shield" size={17}/> An audit is a fit and opportunity review—not a promise of orders, rankings, revenue, profit, ROI, or growth.</p></>}
      </aside>
    </section>
  </main>;
}

function LoginPage({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const neutralDeliveryMessage = "If this email is approved for Veroxa, a secure sign-in link may have been sent. If no email arrives, please wait before requesting another link.";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (new URLSearchParams(window.location.search).get("auth_error") === "1") {
        setError("That sign-in link could not be verified. Please request a new link.");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function handleMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setError("Enter your approved account email first.");
      return;
    }
    setState("submitting");
    setError("");
    setMessage("");
    try {
      const returnTo = new URLSearchParams(window.location.search).get("return_to");
      await requestVeroxaMagicLink(email, returnTo);
      setMessage(neutralDeliveryMessage);
    } catch (caught) {
      const failure = caught instanceof Error ? caught.message : "magic_link_failed";
      if (failure === "configuration_unavailable") {
        setError("Portal sign-in is temporarily unavailable while the secure connection is restored.");
      } else {
        setMessage(neutralDeliveryMessage);
      }
    } finally {
      setState("idle");
    }
  }

  return <main className="login-shell">
    <button className="brand login-brand" onClick={() => onNavigate("public")}><span className="brand-mark"><span>V</span></span><span className="brand-copy"><strong>VEROXA</strong><small>SECURE PORTAL ACCESS</small></span></button>
    <section className="login-card">
      <p className="eyebrow">VEROXA ACCOUNT</p><h1>Welcome back.</h1><p>Request a one-time sign-in link for your assigned Team Faraz or Momo’s House account. Role and workspace access are verified against the protected database.</p>
      <form className="login-form" onSubmit={handleMagicLink}>
        <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
        {error && <p className="login-error" role="alert">{error}</p>}
        {message && <p className="login-message" role="status">{message}</p>}
        <button className="primary-button login-submit" type="submit" disabled={state === "submitting"}>{state === "submitting" ? "Sending secure link…" : "Email me a secure sign-in link"} <Icon name="arrow" size={18}/></button>
      </form>
      <div className="login-lock"><Icon name="shield" size={17}/><span>Password sign-in remains disabled until compromised-password protection is enabled. Signed sessions are verified by Supabase Auth, and database access is protected by row-level authorization.</span></div>
    </section>
  </main>;
}

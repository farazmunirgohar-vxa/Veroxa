"use client";

import { useEffect, useMemo, useState } from "react";

type View =
  | "public"
  | "audit"
  | "login"
  | "home"
  | "onboarding"
  | "media"
  | "reports"
  | "services"
  | "team"
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
  { id: "reports", label: "Reports", icon: "chart", path: "/client/reports" },
  { id: "services", label: "Services", icon: "grid", path: "/client/services" },
];

const teamNav: { id: View; label: string; icon: IconName; path: string }[] = [
  { id: "team", label: "Dashboard", icon: "home", path: "/team/momo" },
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
  "/client/reports": "reports",
  "/client/services": "services",
  "/team/dashboard": "team",
  "/team/momo": "team",
  "/team/momo/work": "team-work",
  "/team/momo/intelligence": "team-intelligence",
  "/team/momo/content-ai": "team-content",
  "/team/momo/reports": "team-reports",
  "/team/momo/readiness": "team-readiness",
};

const viewToPath = Object.fromEntries(Object.entries(routeToView).map(([path, view]) => [view, path])) as Record<View, string>;

const mediaItems = [
  { id: 1, type: "Photo", status: "Ready to Use", title: "Momo close-up photo", date: "Reviewed", tone: "ember", emoji: "🥟", metric: "Strong close-up · Good for social content" },
  { id: 2, type: "Photo", status: "Saved for Later", title: "Sauce tray photo", date: "Reviewed", tone: "saffron", emoji: "🥣", metric: "Useful for sauce-focused content" },
  { id: 3, type: "Photo", status: "Better Version Helpful", title: "Dining room angle", date: "Reviewed", tone: "plum", emoji: "🪑", metric: "A brighter version would be helpful" },
  { id: 4, type: "Clip", status: "Under Review", title: "Kitchen prep clip", date: "In review", tone: "olive", emoji: "👩‍🍳", metric: "Veroxa is reviewing future usefulness" },
  { id: 5, type: "Requested", status: "Recommended", title: "Fried momo photo", date: "Next media", tone: "cocoa", emoji: "🥟", metric: "Helpful when convenient" },
  { id: 6, type: "Requested", status: "Recommended", title: "Storefront photo", date: "Next media", tone: "cream", emoji: "🏪", metric: "Helpful for local trust" },
];

const setupSteps = [
  { title: "Restaurant name & cuisine", detail: "Momo’s House · Momo / dumpling restaurant", done: true },
  { title: "Brand tone", detail: "Warm, casual and family-friendly", done: true },
  { title: "Initial media guidance", detail: "First photo recommendations prepared", done: true },
  { title: "Pilot workspace", detail: "Client-safe review space prepared", done: true },
  { title: "Confirm business hours", detail: "Owner confirmation needed before public use", done: false },
  { title: "Confirm menu source", detail: "Send the current menu link, photo or PDF", done: false },
  { title: "Confirm address & phone", detail: "Exact details need owner review", done: false },
  { title: "Google Business access", detail: "Add Veroxa as manager when ready", done: false },
  { title: "Meta Business access", detail: "Needed for Facebook and Instagram support", done: false },
  { title: "Confirm delivery & catering", detail: "Only mentioned publicly after owner confirmation", done: false },
];

export default function Home() {
  return <VeroxaApp initialPath="/" />;
}

export function VeroxaApp({ initialPath }: { initialPath: string }) {
  const [view, setView] = useState<View>(routeToView[initialPath] ?? "public");
  const [mediaFilter, setMediaFilter] = useState("All");
  const [reportRange, setReportRange] = useState("Weekly update");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [completedSetup, setCompletedSetup] = useState<number[]>([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const syncRoute = () => setView(routeToView[window.location.pathname] ?? "public");
    syncRoute();
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  const filteredMedia = useMemo(() => {
    if (mediaFilter === "All") return mediaItems;
    return mediaItems.filter((item) => item.status === mediaFilter || item.type === mediaFilter);
  }, [mediaFilter]);

  const completeStep = (index: number) => {
    setCompletedSetup((current) => current.includes(index) ? current : [...current, index]);
    setToast("Setup progress saved for this session");
    window.setTimeout(() => setToast(""), 2600);
  };

  const changeView = (next: View) => {
    setView(next);
    const nextPath = viewToPath[next] ?? "/";
    if (window.location.pathname !== nextPath) window.history.pushState({}, "", nextPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (view === "public") return <PublicHome onNavigate={changeView} />;
  if (view === "audit") return <AuditPage onNavigate={changeView} />;
  if (view === "login") return <LoginPage onNavigate={changeView} />;

  const isTeam = view.startsWith("team");
  const activeNav = isTeam ? teamNav : clientNav;
  const activeLabel = activeNav.find((item) => item.id === view)?.label ?? "Dashboard";

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => changeView(isTeam ? "team" : "home")} aria-label="Veroxa home">
          <span className="brand-mark"><span>V</span></span>
          <span className="brand-copy"><strong>VEROXA</strong><small>GROWTH SYSTEMS</small></span>
        </button>

        <nav className="main-nav" aria-label="Main navigation">
          <p className="nav-label">{isTeam ? "TEAM FARAZ" : "CLIENT PORTAL"}</p>
          {activeNav.map((item) => (
            <button key={item.id} className={view === item.id ? "nav-item active" : "nav-item"} onClick={() => changeView(item.id)}>
              <Icon name={item.icon} size={19}/><span>{item.label}</span>
              {item.id === "onboarding" && <span className="nav-count">3</span>}
              {item.id === "team-work" && <span className="nav-count">4</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <div className="help-card">
          <span className="help-icon"><Icon name="message" size={18}/></span>
          <strong>{isTeam ? "Safety boundary" : "Need something?"}</strong>
          <p>{isTeam ? "No public action without Faraz review and confirmed business truth." : "Your Veroxa team replies within one business day."}</p>
          <button onClick={() => { setToast(isTeam ? "Operating guardrails are active" : "Message request opened"); window.setTimeout(() => setToast(""), 2600); }}>{isTeam ? "Review guardrails" : "Message team"} <Icon name="arrow" size={15}/></button>
        </div>
        <button className="profile-card">
          <span className="avatar">{isTeam ? "FM" : "MK"}</span>
          <span><strong>{isTeam ? "Team Faraz" : "Momo’s House"}</strong><small>{isTeam ? "Internal operations" : "San Antonio, TX · pilot"}</small></span>
          <Icon name="chevron" size={16}/>
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><span>V</span></span><strong>VEROXA</strong></div>
          <div className="breadcrumbs"><span>{isTeam ? "Team workspace" : "Client portal"}</span><b>/</b><strong>{activeLabel}</strong></div>
          <div className="top-actions">
            <span className="live-pill preview"><i/> Pre-live system</span>
            <button className="icon-button" aria-label="Notifications"><Icon name="bell" size={19}/><span className="notification-dot"/></button>
            <button className="top-avatar">FM</button>
          </div>
        </header>

        <div className="content">
          {view === "home" && <Overview onNavigate={changeView} />}
          {view === "onboarding" && <Setup steps={setupSteps} completed={completedSetup} onComplete={completeStep} />}
          {view === "media" && <Media items={filteredMedia} filter={mediaFilter} setFilter={setMediaFilter} onUpload={() => { setUploadDone(false); setShowUpload(true); }} />}
          {view === "reports" && <Reports range={reportRange} setRange={setReportRange} />}
          {view === "services" && <Services />}
          {view === "team" && <TeamDashboard onNavigate={changeView} />}
          {view === "team-work" && <TeamWork />}
          {view === "team-intelligence" && <TeamIntelligence />}
          {view === "team-content" && <TeamContent />}
          {view === "team-reports" && <TeamReports />}
          {view === "team-readiness" && <TeamReadiness />}
        </div>

        <nav className="mobile-nav" aria-label="Mobile navigation">
          {activeNav.slice(0, 5).map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => changeView(item.id)}><Icon name={item.icon} size={18}/><span>{item.label}</span></button>)}
        </nav>
      </section>

      {showUpload && <UploadModal done={uploadDone} setDone={setUploadDone} onClose={() => setShowUpload(false)} />}
      {toast && <div className="toast"><Icon name="check" size={17}/>{toast}</div>}
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

    <section className="public-values"><span><b>Amanah</b> Trust</span><span><b>Sidq</b> Truthfulness</span><span><b>Ihsan</b> Excellence</span><span><b>Adl</b> Fairness</span></section>
  </main>;
}

function SystemStep({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="system-step"><b>{number}</b><span><strong>{title}</strong><small>{text}</small></span><Icon name="chevron" size={16}/></div>;
}

function AuditPage({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [prepared, setPrepared] = useState(false);
  return <main className="public-shell inner-public">
    <PublicHeader onNavigate={onNavigate} />
    <section className="public-inner-hero"><p className="eyebrow">RESTAURANT OPPORTUNITY ENGINE</p><h1>Start with the truth.</h1><p>Veroxa begins by checking whether a restaurant is easy to find, easy to understand, and easy to choose online.</p></section>
    <section className="audit-layout">
      <form className="audit-form" onSubmit={(event) => { event.preventDefault(); setPrepared(true); }}>
        <label>Restaurant name<input required placeholder="Restaurant name" /></label>
        <label>City and state<input required placeholder="San Antonio, TX" /></label>
        <label>Website or Google profile<input type="url" placeholder="https://" /></label>
        <label>Best contact email<input type="email" required placeholder="owner@restaurant.com" /></label>
        <button className="primary-button" type="submit">Prepare audit request <Icon name="arrow" size={16}/></button>
        <small>This pre-live form prepares the request in your current session. It does not contact the restaurant or submit external changes.</small>
      </form>
      <aside className="audit-explainer">
        {prepared ? <div className="audit-ready"><span><Icon name="check" size={24}/></span><h2>Audit request prepared.</h2><p>The next production integration will place this request into Team Faraz’s audit queue. No restaurant contact or public action has occurred.</p><button onClick={() => onNavigate("login")}>Open Team access <Icon name="arrow" size={15}/></button></div> : <><p className="eyebrow">WHAT VEROXA REVIEWS</p><h2>Five restaurant visibility layers</h2><ul><li>Google Business and Maps readiness</li><li>Business information consistency</li><li>Menu, ordering, website, and contact paths</li><li>Social trust and usable restaurant media</li><li>Whether Veroxa can create practical value honestly</li></ul><p className="audit-note"><Icon name="shield" size={17}/> An audit is a fit and opportunity review—not a promise of orders, rankings, revenue, profit, ROI, or growth.</p></>}
      </aside>
    </section>
  </main>;
}

function LoginPage({ onNavigate }: { onNavigate: (view: View) => void }) {
  return <main className="login-shell">
    <button className="brand login-brand" onClick={() => onNavigate("public")}><span className="brand-mark"><span>V</span></span><span className="brand-copy"><strong>VEROXA</strong><small>SECURE PORTAL ACCESS</small></span></button>
    <section className="login-card">
      <p className="eyebrow">CHOOSE YOUR WORKSPACE</p><h1>Welcome back.</h1><p>Client and Team Faraz remain separate experiences. Production authentication is still locked until it is explicitly activated.</p>
      <button onClick={() => onNavigate("home")}><span><i><Icon name="globe" size={20}/></i><b>Restaurant Partner</b><small>Open the client portal structure</small></span><Icon name="arrow" size={18}/></button>
      <button onClick={() => onNavigate("team")}><span><i><Icon name="shield" size={20}/></i><b>Team Faraz</b><small>Open the internal operating workspace</small></span><Icon name="arrow" size={18}/></button>
      <div className="login-lock"><Icon name="shield" size={17}/><span>This Sites deployment is currently owner-restricted. These buttons demonstrate role routing without creating public credentials.</span></div>
    </section>
  </main>;
}

function TeamDashboard({ onNavigate }: { onNavigate: (view: View) => void }) {
  return <div className="view">
    <PageIntro eyebrow="MOMO WORKSPACE" title="Operating snapshot" description="A calm internal command center for Team Faraz. It organizes the verified Momo’s House operating state without activating the pilot or exposing internal work to the client." />
    <section className="team-guardrail"><Icon name="shield" size={20}/><div><strong>Post-PR133 operating lock is active</strong><span>Placeholder auth, no external publishing, no client exposure, no AI provider calls, and no business-truth changes without confirmation.</span></div><em>Internal only</em></section>
    <section className="metric-row">
      <Metric label="Pilot state" value="Blocked" trend="Pre-live" note="activation not approved" icon="shield" />
      <Metric label="Business truth" value="Review" trend="Open" note="confirmation needed" icon="spark" />
      <Metric label="Media inventory" value="Prepared" trend="Internal" note="review foundation" icon="image" />
      <Metric label="AI generation" value="Locked" trend="No calls" note="approval gate intact" icon="grid" />
    </section>
    <section className="team-module-grid">
      <TeamModule icon="grid" title="Daily work board" text="Organize onboarding, truth review, media, approvals, reports, and blockers." action="Open work" onClick={() => onNavigate("team-work")} />
      <TeamModule icon="spark" title="Restaurant intelligence" text="Review identity, business truth, brand voice, risks, and safe next actions." action="Open intelligence" onClick={() => onNavigate("team-intelligence")} />
      <TeamModule icon="image" title="Content + AI" text="Keep content preparation and AI draft rules behind internal approval gates." action="Review content" onClick={() => onNavigate("team-content")} />
      <TeamModule icon="chart" title="Reports" text="Build honest client-safe updates from reviewed activity only." action="Review reports" onClick={() => onNavigate("team-reports")} />
      <TeamModule icon="shield" title="Readiness" text="See exactly what remains blocked before any future activation decision." action="Check readiness" onClick={() => onNavigate("team-readiness")} />
    </section>
  </div>;
}

function TeamModule({ icon, title, text, action, onClick }: { icon: IconName; title: string; text: string; action: string; onClick: () => void }) {
  return <article className="team-module"><span><Icon name={icon} size={21}/></span><h2>{title}</h2><p>{text}</p><button onClick={onClick}>{action} <Icon name="arrow" size={15}/></button></article>;
}

function TeamWork() {
  return <TeamSection eyebrow="DAILY OPERATING BOARD" title="Momo work queue" description="Static internal organization of safe next work. No card performs a write, contacts the owner, or publishes externally." columns={[
    ["Onboarding", "Review business profile", "Needs confirmation"],
    ["Media", "Classify usable momo assets", "Prepared"],
    ["Content", "Hold first draft direction", "Approval required"],
    ["Reporting", "Assemble activity-based update", "Internal review"],
  ]} />;
}

function TeamIntelligence() {
  return <TeamSection eyebrow="RESTAURANT INTELLIGENCE" title="Verified knowledge, in one place" description="The Team Faraz source for restaurant identity, business truth, media inventory, brand voice, current risks, and safe next actions." columns={[
    ["Restaurant identity", "Momo’s House · San Antonio", "Pilot restaurant"],
    ["Brand direction", "The momo spot · niche craving brand", "Locked strategy"],
    ["Business truth", "Hours, menu, phone, access", "Owner verification needed"],
    ["Primary risk", "No activation approval", "Keep blocked"],
  ]} />;
}

function TeamContent() {
  return <TeamSection eyebrow="CONTENT + AI" title="Prepared, reviewed, controlled" description="Content pillars and prompt rules are organized internally. Runtime AI generation and public execution remain locked." columns={[
    ["Momo cravings", "Close-ups, steam, sauces, bite shots", "Content pillar"],
    ["First-time education", "What momos are and how to order", "Content pillar"],
    ["Behind the scenes", "Folding, steaming, frying, packing", "Content pillar"],
    ["Customer + snack discovery", "Reactions and international snack pairing", "Content pillar"],
  ]} />;
}

function TeamReports() {
  return <TeamSection eyebrow="REPORTING QUEUE" title="Evidence before claims" description="Weekly and monthly reports are assembled from reviewed Veroxa activity. Unconnected analytics and invented outcome metrics stay out." columns={[
    ["Weekly update", "Work completed, pending, media needed, next focus", "Preparing"],
    ["Monthly report", "Presence changes and reviewed activity", "Waiting for history"],
    ["Outcome claims", "Orders, revenue, rankings, profit, ROI", "Never fabricated"],
    ["Release gate", "Client-safe copy and Faraz review", "Required"],
  ]} />;
}

function TeamReadiness() {
  return <TeamSection eyebrow="GO / NO-GO GATE" title="Activation remains a separate decision" description="This page records the current no-go state. Building the interface does not authorize real credentials, owner outreach, platform access, publishing, or client exposure." columns={[
    ["Production auth", "Placeholder mode remains active", "Blocked"],
    ["External connections", "Google, Meta, ordering platforms", "Blocked"],
    ["Owner walkthrough", "Requires explicit Faraz approval", "Blocked"],
    ["Public execution", "Approval and business-truth gates", "Blocked"],
  ]} />;
}

function TeamSection({ eyebrow, title, description, columns }: { eyebrow: string; title: string; description: string; columns: string[][] }) {
  return <div className="view"><PageIntro eyebrow={eyebrow} title={title} description={description} />
    <section className="team-guardrail"><Icon name="shield" size={20}/><div><strong>Internal review surface</strong><span>No external calls, database writes, credential creation, or customer-visible actions are performed here.</span></div><em>Read only</em></section>
    <section className="team-board">{columns.map(([label, value, status]) => <article key={label}><p className="eyebrow">{label}</p><h2>{value}</h2><span><i/>{status}</span><button>Review safely <Icon name="chevron" size={15}/></button></article>)}</section>
  </div>;
}

function PageIntro({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: React.ReactNode }) {
  return <div className="page-intro"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{actions && <div className="intro-actions">{actions}</div>}</div>;
}

function Overview({ onNavigate }: { onNavigate: (view: View) => void }) {
  return <div className="view view-home">
    <section className="hero-panel">
      <div className="hero-copy">
        <div className="week-tag"><span>CONTROLLED PILOT</span><i/> Client-safe workspace</div>
        <h1>Welcome, Momo’s House.</h1>
        <p>Veroxa is preparing your restaurant workspace. Nothing goes live without Veroxa review and owner-confirmed details.</p>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => onNavigate("onboarding")}>Review setup <Icon name="arrow" size={17}/></button>
          <button className="text-button" onClick={() => onNavigate("media")}>Open media guidance</button>
        </div>
      </div>
      <div className="hero-orbit" aria-label="Pilot readiness summary">
        <div className="orbit-ring"><div><span>3</span><small>owner actions</small></div></div>
        <div className="orbit-chip chip-one"><Icon name="google" size={15}/><span><b>Waiting</b> access</span></div>
        <div className="orbit-chip chip-two"><Icon name="image" size={15}/><span><b>4</b> media reviews</span></div>
      </div>
    </section>

    <section className="metric-row">
      <Metric label="Business profile" value="Review" trend="2 details" note="need confirmation" icon="spark" />
      <Metric label="Account access" value="0 of 2" trend="Waiting" note="Meta + Google" icon="google" />
      <Metric label="Media reviewed" value="4" trend="1 ready" note="3 need follow-up" icon="image" />
      <Metric label="Weekly update" value="Draft" trend="Preparing" note="review before release" icon="calendar" />
    </section>

    <section className="overview-grid">
      <div className="panel activity-panel">
        <div className="panel-heading"><div><p className="eyebrow">RECENT PROGRESS</p><h2>Prepared by Veroxa</h2></div><span className="date-range">Pilot setup</span></div>
        <div className="timeline">
          <Activity icon="spark" title="Profile prepared for review" detail="Public details organized into owner-safe confirmation steps" time="Done" />
          <Activity icon="image" title="Initial media guidance prepared" detail="Four files reviewed and next photo needs identified" time="Done" />
          <Activity icon="google" title="Meta and Google access steps identified" detail="Both remain owner-controlled and waiting for access" time="Prepared" />
          <Activity icon="message" title="First weekly update outlined" detail="Activity-based update is under Veroxa review" time="In review" />
        </div>
        <button className="panel-link" onClick={() => onNavigate("services")}>See everything we manage <Icon name="arrow" size={15}/></button>
      </div>

      <div className="panel attention-panel">
        <div className="panel-heading"><div><p className="eyebrow coral">NEEDS YOUR ATTENTION</p><h2>Three owner actions</h2></div><span className="count-badge">3</span></div>
        <button className="attention-item" onClick={() => onNavigate("onboarding")}>
          <span className="attention-icon"><Icon name="clock" size={19}/></span>
          <span><strong>Confirm business hours</strong><small>Veroxa will not use hours publicly until confirmed.</small><em>Review profile</em></span><Icon name="chevron" size={18}/>
        </button>
        <button className="attention-item" onClick={() => onNavigate("onboarding")}>
          <span className="attention-icon lavender"><Icon name="image" size={19}/></span>
          <span><strong>Confirm current menu source</strong><small>Send the current menu link, photo, or PDF.</small><em>Review profile</em></span><Icon name="chevron" size={18}/>
        </button>
        <button className="attention-item compact" onClick={() => onNavigate("onboarding")}>
          <span className="attention-icon"><Icon name="grid" size={19}/></span>
          <span><strong>Add Meta or Google access</strong><small>Owner-controlled access is still waiting.</small><em>Open setup</em></span><Icon name="chevron" size={18}/>
        </button>
        <div className="quiet-note"><Icon name="shield" size={17}/><span>Nothing is published or connected automatically in the current pre-live system.</span></div>
      </div>
    </section>

    <section className="panel upcoming-panel">
      <div className="panel-heading"><div><p className="eyebrow">FIRST-WEEK PLAN</p><h2>What happens next</h2></div><button className="text-button" onClick={() => onNavigate("reports")}>View weekly update <Icon name="arrow" size={15}/></button></div>
      <div className="calendar-strip">
        <CalendarCard day="STEP" date="01" type="Owner review" title="Verify business details" tone="plum" emoji="📝" />
        <CalendarCard day="STEP" date="02" type="Veroxa review" title="Organize momo media" tone="saffron" emoji="🥟" />
        <CalendarCard day="STEP" date="03" type="Prepared work" title="First content direction" tone="ember" emoji="💡" />
        <CalendarCard day="STEP" date="04" type="Reviewed update" title="Release weekly summary" tone="olive" emoji="📋" />
      </div>
    </section>
  </div>;
}

function Metric({ label, value, trend, note, icon }: { label: string; value: string; trend: string; note: string; icon: IconName }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><i><Icon name={icon} size={17}/></i></div><strong>{value}</strong><div className="metric-foot"><em>{trend}</em><small>{note}</small></div></article>;
}

function Activity({ icon, title, detail, time }: { icon: IconName; title: string; detail: string; time: string }) {
  return <div className="activity"><span className="activity-icon"><Icon name={icon} size={17}/></span><span><strong>{title}</strong><small>{detail}</small></span><time>{time}</time></div>;
}

function CalendarCard({ day, date, type, title, tone, emoji }: { day: string; date: string; type: string; title: string; tone: string; emoji: string }) {
  return <article className="calendar-card"><div className="cal-date"><span>{day}</span><strong>{date}</strong></div><div className={`cal-art ${tone}`}><span>{emoji}</span></div><div className="cal-copy"><span>{type}</span><strong>{title}</strong><small><i/> Manual pilot step</small></div></article>;
}

function Setup({ steps, completed, onComplete }: { steps: typeof setupSteps; completed: number[]; onComplete: (index: number) => void }) {
  const doneCount = steps.filter((s, i) => s.done || completed.includes(i)).length;
  return <div className="view">
    <PageIntro eyebrow="RESTAURANT FOUNDATION" title="Setup your growth system" description="Complete the last details so your Veroxa team can operate without chasing you for information." />
    <section className="setup-summary">
      <div className="progress-disc" style={{ "--progress": `${doneCount * 10 * 3.6}deg` } as React.CSSProperties}><div><strong>{doneCount * 10}%</strong><span>complete</span></div></div>
      <div className="setup-summary-copy"><span className="status-label">OWNER REVIEW</span><h2>Your pilot workspace is prepared.</h2><p>{10 - doneCount} details still need confirmation before Veroxa can prepare public work safely.</p></div>
      <div className="setup-stat"><strong>4</strong><span>media reviewed</span></div><div className="setup-stat"><strong>0/2</strong><span>access pending</span></div>
    </section>
    <section className="setup-layout">
      <div className="panel setup-list-panel">
        <div className="panel-heading"><div><p className="eyebrow">CHECKLIST</p><h2>Infrastructure setup</h2></div><span className="date-range">{doneCount} of 10 complete</span></div>
        <div className="setup-list">
          {steps.map((step, index) => {
            const done = step.done || completed.includes(index);
            return <button key={step.title} className={done ? "setup-step done" : "setup-step"} onClick={() => !done && onComplete(index)}>
              <span className="step-check">{done ? <Icon name="check" size={16}/> : index + 1}</span>
              <span><strong>{step.title}</strong><small>{step.detail}</small></span>
              {done ? <em>Complete</em> : <><em className="action">Finish setup</em><Icon name="chevron" size={17}/></>}
            </button>;
          })}
        </div>
      </div>
      <aside className="setup-side">
        <div className="panel connected-panel"><p className="eyebrow">ACCESS STATUS</p><h3>Your presence stack</h3><div className="channel-list"><Channel icon="google" name="Google Business" status="Waiting"/><Channel icon="instagram" name="Meta Business" status="Waiting"/><Channel icon="globe" name="Website" status="Optional"/><Channel icon="grid" name="Menu & ordering links" status="Confirm"/></div></div>
        <div className="principle-card"><Icon name="spark" size={19}/><p>Built on <strong>amanah</strong>: accurate business information, clear ownership, and no promises we cannot measure.</p></div>
        <div className="panel expectation-mini"><p className="eyebrow">SETUP EXPECTATIONS</p><h3>Complete Online Presence</h3><strong>$495 <small>/ month</small></strong><ul><li>Nothing goes live without Veroxa review.</li><li>Business facts require owner confirmation.</li><li>24-hour response means review or next step—not guaranteed completion.</li></ul></div>
      </aside>
    </section>
  </div>;
}

function Channel({ icon, name, status }: { icon: IconName; name: string; status: string }) {
  return <div className="channel"><span><Icon name={icon} size={17}/></span><strong>{name}</strong><em><i/>{status}</em></div>;
}

function Media({ items, filter, setFilter, onUpload }: { items: typeof mediaItems; filter: string; setFilter: (f: string) => void; onUpload: () => void }) {
  const filters = ["All", "Ready to Use", "Under Review", "Recommended", "Photo"];
  return <div className="view">
    <PageIntro eyebrow="MEDIA GUIDANCE" title="Send what is easy. We’ll organize it." description="See what Veroxa recommends, what has been reviewed, and where a better version would help—without pretending files have been published." actions={<button className="primary-button" onClick={onUpload}><Icon name="upload" size={17}/> Try media intake</button>} />
    <section className="media-guidance-note"><Icon name="shield" size={18}/><div><strong>Pre-live media intake</strong><span>Until storage is activated, selected files stay on your device. Veroxa review and public use remain separate steps.</span></div></section>
    <section className="media-toolbar"><div className="filter-pills">{filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}{item === "Ready to Use" && <span>1</span>}</button>)}</div><div className="media-count">{items.length} items</div></section>
    {items.length ? <section className="media-grid">{items.map((item) => <MediaCard key={item.id} item={item} />)}</section> : <section className="empty-state"><Icon name="image" size={30}/><h2>No media in this view</h2><p>Try another filter or add a new file.</p></section>}
  </div>;
}

function MediaCard({ item }: { item: typeof mediaItems[number] }) {
  const [liked, setLiked] = useState(false);
  return <article className="media-card">
    <div className={`media-art ${item.tone}`}><span>{item.emoji}</span>{item.type === "Clip" && <i className="play-badge"><Icon name="play" size={20}/></i>}<div className="media-overlay"><span className={`status status-${item.status.toLowerCase().replace(/\s+/g, "-")}`}>{item.status}</span><button onClick={() => setLiked(!liked)} aria-label="Save media note"><Icon name={liked ? "check" : "message"} size={17}/></button></div></div>
    <div className="media-card-copy"><div><span>{item.type} · {item.date}</span><h3>{item.title}</h3></div><div className="media-meta"><span>{item.metric}</span>{["Recommended", "Better Version Helpful"].includes(item.status) && <button className={liked ? "approved" : ""} onClick={() => setLiked(!liked)}>{liked ? "Noted" : "I can send this"}</button>}</div></div>
  </article>;
}

function Reports({ range, setRange }: { range: string; setRange: (r: string) => void }) {
  return <div className="view">
    <PageIntro eyebrow="REVIEWED ACTIVITY" title="Simple reports. No invented numbers." description="Weekly updates and monthly reports are based on reviewed Veroxa work history—not unconnected external analytics or promised outcomes." actions={<div className="range-switch">{["Weekly update", "Monthly report"].map((r) => <button key={r} className={range === r ? "active" : ""} onClick={() => setRange(r)}>{r}</button>)}</div>} />
    <section className="report-honesty"><Icon name="shield" size={20}/><div><strong>Reports stay honest</strong><span>Only reviewed work appears here. Veroxa does not promise orders, rankings, revenue, profit, ROI, or growth.</span></div><em>Source: Veroxa activity</em></section>
    {range === "Weekly update" ? <>
      <section className="panel weekly-report-hero"><div><p className="eyebrow">THIS WEEK’S UPDATE</p><h2>Momo’s House pilot setup</h2><p>Veroxa is preparing your restaurant workspace, reviewing your profile, and organizing what is needed before public work begins.</p></div><span><Icon name="clock" size={16}/> Under Veroxa review</span></section>
      <section className="weekly-columns">
        <ReportList title="Done" icon="check" tone="green" items={["Profile prepared for review", "Initial media guidance prepared", "Meta and Google access steps identified"]}/>
        <ReportList title="Next" icon="arrow" tone="purple" items={["Confirm business details", "Confirm account access", "Review media recommendations"]}/>
        <ReportList title="Needs Your Attention" icon="bell" tone="coral" items={["Confirm business hours", "Confirm current menu source", "Add Veroxa to Meta or Google"]}/>
      </section>
      <section className="panel report-next"><div><p className="eyebrow">WHAT HAPPENS AFTER CONFIRMATION</p><h2>Veroxa prepares the first content direction.</h2><p>Public work remains behind Veroxa review and owner-confirmed business truth. Nothing is auto-published.</p></div><div className="report-path"><span className="done"><Icon name="check" size={14}/> Workspace</span><i/><span>Owner confirmation</span><i/><span>Veroxa review</span><i/><span>Prepared work</span></div></section>
    </> : <section className="monthly-empty">
      <span><Icon name="chart" size={30}/></span><p className="eyebrow">MONTHLY REPORT</p><h2>Your first report is not ready yet.</h2><p>It will appear after Veroxa has enough reviewed activity to report honestly. The current system does not fabricate reach, calls, orders, rankings, or revenue.</p><div><Icon name="check" size={16}/> Activity summary <Icon name="check" size={16}/> What was prepared <Icon name="check" size={16}/> What needs attention <Icon name="check" size={16}/> Next focus</div>
    </section>}
  </div>;
}

function ReportList({ title, icon, tone, items }: { title: string; icon: IconName; tone: string; items: string[] }) { return <article className={`report-list ${tone}`}><div className="report-list-title"><span><Icon name={icon} size={17}/></span><h3>{title}</h3></div><div>{items.map((item, index) => <p key={item}><b>{String(index + 1).padStart(2, "0")}</b>{item}</p>)}</div></article>; }

function Services() {
  const services: { icon: IconName; title: string; text: string; included: string[]; state: string }[] = [
    { icon: "google", title: "Google & Maps basics", text: "Keep the public restaurant essentials organized and ready for owner-confirmed updates.", included: ["Profile support", "Local visibility basics", "Hours, menu & links review"], state: "Included" },
    { icon: "spark", title: "Local SEO basics", text: "Help Momo’s House become easier to find, understand, and choose in local search.", included: ["Business info consistency", "Restaurant-focused wording", "Search visibility basics"], state: "Included" },
    { icon: "image", title: "Picture-based content", text: "Simple captions and organized photo support, dependent on usable restaurant media.", included: ["Up to 3 updates per week", "Photo guidance", "Veroxa review before use"], state: "Included" },
    { icon: "instagram", title: "Facebook & Instagram", text: "Support for current social profiles and a calm process for preparing reviewed updates.", included: ["Profile support", "Simple post preparation", "Business-truth review"], state: "Included" },
    { icon: "globe", title: "Website alignment", text: "Small, practical improvements to an existing site when access is provided.", included: ["Name, address & phone", "Menu/order/contact links", "Basic local SEO wording"], state: "Included" },
    { icon: "chart", title: "Updates & reports", text: "Activity-based proof of what Veroxa worked on, what is pending, and what comes next.", included: ["Weekly update", "Monthly presence report", "No fake metrics"], state: "Included" },
    { icon: "message", title: "Client portal support", text: "One calm place for routine requests, media guidance, owner input, and reviewed updates.", included: ["Portal access", "Request review within 24 hours", "Clear next-step communication"], state: "Included" },
    { icon: "grid", title: "Optional setup add-ons", text: "Small launch add-ons when a basic website or missing social profile is needed.", included: ["New basic website +$95", "Facebook profile +$45", "Instagram profile +$45"], state: "Optional" },
    { icon: "clock", title: "Coming later", text: "These capabilities are intentionally not represented as active in the current Veroxa pilot.", included: ["Yelp, TikTok & Reels", "Ads management", "Automated publishing & live integrations"], state: "Coming soon" },
  ];
  return <div className="view">
    <PageIntro eyebrow="COMPLETE ONLINE PRESENCE" title="One practical system for restaurant visibility" description="The active Veroxa offer, presented exactly as the current repository defines it—simple, honest, and review-controlled." />
    <section className="service-hero"><div><span>ACTIVE LAUNCH OFFER</span><h2>We organize the presence.<br/>You confirm the truth.</h2><p>No contract. Cancel anytime. No promises of orders, revenue, rankings, profit, ROI, or growth.</p></div><div className="service-price"><span>Complete Online Presence</span><strong>$495 <small>/ month</small></strong><small>Picture-based · media dependent</small><i><Icon name="shield" size={15}/> Veroxa review before anything goes live</i></div></section>
    <section className="services-grid">{services.map((service) => <article className="service-card" key={service.title}><div className="service-card-top"><span><Icon name={service.icon} size={22}/></span><em><i/>{service.state}</em></div><h3>{service.title}</h3><p>{service.text}</p><ul>{service.included.map((item) => <li key={item}><Icon name="check" size={14}/>{item}</li>)}</ul></article>)}</section>
    <section className="values-strip"><div><p className="eyebrow">HOW WE WORK</p><h2>Growth with integrity.</h2></div><div className="values"><span><b>Amanah</b> Trust in every detail</span><span><b>Sidq</b> Honest reporting</span><span><b>Ihsan</b> Excellence in delivery</span><span><b>Adl</b> Fair value and effort</span></div></section>
  </div>;
}

function UploadModal({ done, setDone, onClose }: { done: boolean; setDone: (d: boolean) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  return <div className="modal-backdrop" onMouseDown={(e) => e.currentTarget === e.target && onClose()}><div className="modal" role="dialog" aria-modal="true" aria-label="Add media">
    <button className="modal-close" onClick={onClose} aria-label="Close"><Icon name="close" size={19}/></button>
    {!done ? <><span className="modal-icon"><Icon name="upload" size={23}/></span><p className="eyebrow">PRE-LIVE MEDIA INTAKE</p><h2>Share fresh Momo’s House media</h2><p>Veroxa reviews each file and marks what can be used, saved for later, or improved.</p><label className="drop-zone"><input type="file" accept="image/*,video/*" onChange={(e) => setName(e.target.files?.[0]?.name || "")}/><Icon name="image" size={28}/><strong>{name || "Choose a photo or short clip"}</strong><span>{name ? "Selected on this device" : "JPG, PNG, HEIC or MP4 · storage not active"}</span></label><label className="caption-label">What should Veroxa know?<textarea placeholder="Example: Fresh steamed momos photographed during lunch…"/></label><button className="primary-button modal-submit" onClick={() => setDone(true)} disabled={!name}>Review selection <Icon name="arrow" size={16}/></button><small className="prototype-note">Storage is not activated yet. Your file is not uploaded or sent.</small></> : <div className="upload-success"><span><Icon name="check" size={25}/></span><p className="eyebrow">SELECTION REVIEWED</p><h2>File ready for future intake.</h2><p>When approved storage is connected, this step will place the file into Veroxa review. Nothing was uploaded, saved, or published here.</p><button className="primary-button" onClick={onClose}>Back to media</button></div>}
  </div></div>;
}

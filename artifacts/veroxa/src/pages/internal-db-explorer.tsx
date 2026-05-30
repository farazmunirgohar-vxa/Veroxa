/**
 * Database Explorer — demo-only visual representation of the Veroxa data model.
 * No Supabase, no Prisma, no real DB. Derives all counts and examples from
 * the demoData.ts single source of truth.
 */
import {
  Building2, Image as ImageIcon, Layers, GitBranch, Send,
  CheckSquare, Bell, FileText, FileBarChart, Activity,
  ArrowRight, Database,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { PageHeader, StatusBadge } from "@/components/common";
import type { StatusBadgeTone } from "@/components/common";
import {
  demoRestaurants,
  demoMediaItems,
  demoContentItems,
  demoContentReviewQueue,
  demoCalendarSlots,
  demoTasksV2,
  demoTeamAlerts,
  demoWeeklyReports,
  demoMonthlyReports,
  demoActivityLog,
  demoClientLifecycle,
  getRestaurantName,
} from "@/data/demoData";

// ─── helpers ────────────────────────────────────────────────────────────────

function countBy<T>(arr: T[], key: (item: T) => string): Record<string, number> {
  return arr.reduce<Record<string, number>>((acc, item) => {
    const k = key(item);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}

// ─── flow diagram ────────────────────────────────────────────────────────────

const FLOW_NODES: { label: string; sub: string; colorClass: string; borderClass: string }[] = [
  { label: "Clients",          sub: `${demoRestaurants.length} records`,         colorClass: "text-sky-400",     borderClass: "border-sky-500/40 bg-sky-500/10"      },
  { label: "Media Assets",     sub: `${demoMediaItems.length} records`,           colorClass: "text-amber-400",   borderClass: "border-amber-500/40 bg-amber-500/10"  },
  { label: "Content Concepts", sub: `${demoContentItems.length} records`,          colorClass: "text-violet-400",  borderClass: "border-violet-500/40 bg-violet-500/10" },
  { label: "Draft Sets",       sub: `${demoContentReviewQueue.length} in queue`,   colorClass: "text-emerald-400", borderClass: "border-emerald-500/40 bg-emerald-500/10"},
  { label: "Posts",            sub: `${demoCalendarSlots.length} slots`,           colorClass: "text-rose-400",    borderClass: "border-rose-500/40 bg-rose-500/10"    },
];

const SIDE_ENTITIES = [
  `Weekly Reports (${demoWeeklyReports.length})`,
  `Monthly Reports (${demoMonthlyReports.length})`,
  `Tasks (${demoTasksV2.length})`,
  `Alerts (${demoTeamAlerts.length})`,
  `Activity Log (${demoActivityLog.length})`,
];

function FlowDiagram() {
  return (
    <Card className="bg-card border-border mb-6" data-testid="db-flow-diagram">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" /> Core data flow
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Primary chain */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {FLOW_NODES.map((n, i) => (
            <div key={n.label} className="flex items-center gap-2">
              <div className={`rounded-lg border px-3 py-2 ${n.borderClass}`}>
                <p className="text-[10px] text-muted-foreground">{n.label}</p>
                <p className={`text-xs font-bold tabular-nums ${n.colorClass}`}>{n.sub}</p>
              </div>
              {i < FLOW_NODES.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
        {/* Secondary entities */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50">
          <span className="text-[10px] text-muted-foreground">Also attached to Clients:</span>
          {SIDE_ENTITIES.map((e) => (
            <span key={e} className="text-[10px] rounded-full border border-border px-2 py-0.5 text-muted-foreground">{e}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── entity card ─────────────────────────────────────────────────────────────

interface StatusChip { label: string; count: number; tone: StatusBadgeTone }
interface ExampleRow  { primary: string; secondary: string; badge?: string; tone?: StatusBadgeTone }

interface EntityCardProps {
  icon:        LucideIcon;
  iconClass:   string;
  name:        string;
  count:       number;
  description: string;
  statuses:    StatusChip[];
  examples:    ExampleRow[];
  relations:   string[];
  testId?:     string;
}

function EntityCard({ icon: Icon, iconClass, name, count, description, statuses, examples, relations, testId }: EntityCardProps) {
  return (
    <Card className="bg-card border-border" data-testid={testId}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md bg-muted/30 ${iconClass}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{name}</CardTitle>
              <p className="text-[11px] text-muted-foreground">{description}</p>
            </div>
          </div>
          <span className="text-xl font-bold tabular-nums text-foreground flex-shrink-0">{count}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status breakdown */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Status breakdown</p>
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((s) => (
              <StatusBadge key={s.label} tone={s.tone}>{s.label} · {s.count}</StatusBadge>
            ))}
          </div>
        </div>
        {/* Example records */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Example records</p>
          <div className="space-y-1">
            {examples.map((e, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 rounded-md bg-muted/20 border border-border/50 px-2.5 py-1.5">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium truncate">{e.primary}</p>
                  {e.secondary && <p className="text-[10px] text-muted-foreground truncate">{e.secondary}</p>}
                </div>
                {e.badge && <StatusBadge tone={e.tone ?? "neutral"}>{e.badge}</StatusBadge>}
              </div>
            ))}
          </div>
        </div>
        {/* Relationships */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Relates to</p>
          <div className="flex flex-wrap gap-1">
            {relations.map((r) => (
              <span key={r} className="text-[10px] rounded-full border border-primary/30 text-primary/70 bg-primary/5 px-2 py-0.5">{r}</span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── tone helpers ─────────────────────────────────────────────────────────────

function severityTone(s: string): StatusBadgeTone {
  if (s === "Critical") return "danger";
  if (s === "High")     return "warning";
  if (s === "Medium")   return "caution";
  return "neutral";
}

function weeklyStatusTone(s: string): StatusBadgeTone {
  if (s === "Published" || s === "Ready for Client") return "success";
  if (s === "Team Review")                       return "warning";
  return "neutral";
}

function reviewStatusTone(s: string): StatusBadgeTone {
  if (s === "Approved")        return "success";
  if (s === "In Review")       return "info";
  if (s === "Needs Revision")  return "danger";
  return "neutral";
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function InternalDbExplorer() {
  /* ── Clients ────────────────────────────── */
  const lifecycleCounts = countBy(demoClientLifecycle, (c) => c.lifecycleStage);

  /* ── Media Assets ───────────────────────── */
  const mediaCounts = countBy(demoMediaItems, (m) => m.status);

  /* ── Content Concepts ───────────────────── */
  const contentCounts = countBy(demoContentItems, (c) => c.status);

  /* ── Draft Sets ─────────────────────────── */
  const draftCounts = countBy(demoContentReviewQueue, (d) => d.status);

  /* ── Posts (calendar slots) ─────────────── */
  const postCounts = countBy(demoCalendarSlots, (s) => s.kind);

  /* ── Tasks ──────────────────────────────── */
  const taskCounts = countBy(demoTasksV2, (t) => t.status);

  /* ── Alerts ─────────────────────────────── */
  const alertCounts = countBy(demoTeamAlerts, (a) => a.severity);

  /* ── Weekly Reports ─────────────────────── */
  const weeklyCounts = countBy(demoWeeklyReports, (r) => r.status);

  /* ── Monthly Reports ────────────────────── */
  // Monthly reports have no status field — derive a health label from healthSummary
  const monthlyCounts = countBy(demoMonthlyReports, (r) =>
    r.healthSummary.toLowerCase().startsWith("critical") ? "Critical" :
    r.healthSummary.toLowerCase().startsWith("attention") ? "Attention" : "Healthy"
  );

  /* ── Activity Log ───────────────────────── */
  const activityCounts = countBy(demoActivityLog, (a) => a.kind);

  return (
    <div className="min-h-screen bg-background text-foreground px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto">
      <PageHeader
        title="Database Explorer"
        description="Visual map of every entity in the Veroxa data model — counts, status breakdowns, example records, and relationships."
        testId="header-db-explorer"
      />
      <DemoOnlyBanner
        message="Demo only — all counts and records are derived from demoData.ts. No real database is connected."
        testId="banner-db-explorer"
      />

      {/* Relationship flow */}
      <FlowDiagram />

      {/* Top summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Clients",       value: demoRestaurants.length,                                    accent: "text-sky-400"     },
          { label: "Media Assets",  value: demoMediaItems.length,                                     accent: "text-amber-400"   },
          { label: "Content Items", value: demoContentItems.length,                                    accent: "text-violet-400"  },
          { label: "Reports",       value: demoWeeklyReports.length + demoMonthlyReports.length,      accent: "text-emerald-400" },
          { label: "Activity Logs", value: demoActivityLog.length,                                    accent: "text-rose-400"    },
        ].map(({ label, value, accent }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Entity cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* 1. Clients */}
        <EntityCard
          icon={Building2}
          iconClass="text-sky-400"
          name="Clients"
          count={demoRestaurants.length}
          description="Restaurant accounts managed by Veroxa"
          statuses={Object.entries(lifecycleCounts).map(([label, count]) => ({
            label, count,
            tone: label === "At Risk" ? "warning" : label === "Onboarding" ? "info" : label === "Churned" ? "danger" : "success",
          }))}
          examples={demoRestaurants.map((r) => {
            const lc = demoClientLifecycle.find((c) => c.clientId === r.id);
            return {
              primary:   r.name,
              secondary: r.cuisine,
              badge:     lc?.lifecycleStage ?? "Active",
              tone:      (lc?.lifecycleStage === "At Risk" ? "warning" : lc?.lifecycleStage === "Onboarding" ? "info" : "success") as StatusBadgeTone,
            };
          })}
          relations={["Media Assets", "Content Items", "Weekly Reports", "Monthly Reports", "Tasks", "Activity Log"]}
          testId="entity-clients"
        />

        {/* 2. Media Assets */}
        <EntityCard
          icon={ImageIcon}
          iconClass="text-amber-400"
          name="Media Assets"
          count={demoMediaItems.length}
          description="Photos and videos uploaded per client"
          statuses={Object.entries(mediaCounts).map(([label, count]) => ({
            label, count,
            tone: label === "Approved" ? "success" : label === "Pending Review" ? "warning" : label === "Blurry" || label === "Duplicate" ? "danger" : label === "Scheduled" ? "info" : "neutral",
          }))}
          examples={demoMediaItems.slice(0, 3).map((m) => ({
            primary:   m.title,
            secondary: `${getRestaurantName(m.clientId)} · ${m.type} · ${m.dateAdded}`,
            badge:     m.status,
            tone:      (m.status === "Approved" ? "success" : m.status === "Pending Review" ? "warning" : m.status === "Blurry" ? "danger" : "neutral") as StatusBadgeTone,
          }))}
          relations={["Clients (clientId)", "Content Concepts"]}
          testId="entity-media"
        />

        {/* 3. Content Concepts */}
        <EntityCard
          icon={Layers}
          iconClass="text-violet-400"
          name="Content Concepts"
          count={demoContentItems.length}
          description="Content items moving through the publishing pipeline"
          statuses={Object.entries(contentCounts).map(([label, count]) => ({
            label, count,
            tone: label === "Done" ? "success" : label === "Blocked" ? "danger" : label === "Waiting" ? "warning" : "info",
          }))}
          examples={demoContentItems.slice(0, 3).map((c) => ({
            primary:   c.title,
            secondary: `${getRestaurantName(c.clientId)} · ${c.contentType} · ${c.currentStage}`,
            badge:     c.status,
            tone:      (c.status === "Done" ? "success" : c.status === "Blocked" ? "danger" : c.status === "Waiting" ? "warning" : "info") as StatusBadgeTone,
          }))}
          relations={["Clients", "Media Assets", "Draft Sets"]}
          testId="entity-content"
        />

        {/* 4. Draft Sets */}
        <EntityCard
          icon={GitBranch}
          iconClass="text-emerald-400"
          name="Draft Sets"
          count={demoContentReviewQueue.length}
          description="Caption drafts awaiting team review and approval"
          statuses={Object.entries(draftCounts).map(([label, count]) => ({
            label, count,
            tone: reviewStatusTone(label),
          }))}
          examples={demoContentReviewQueue.slice(0, 3).map((d) => ({
            primary:   d.title,
            secondary: `${getRestaurantName(d.clientId)} · ${d.contentType} · ${d.stage}`,
            badge:     d.status,
            tone:      reviewStatusTone(d.status),
          }))}
          relations={["Content Concepts", "Posts", "Team (assignedReviewer)"]}
          testId="entity-drafts"
        />

        {/* 5. Posts */}
        <EntityCard
          icon={Send}
          iconClass="text-rose-400"
          name="Posts"
          count={demoCalendarSlots.length}
          description="Scheduled, published, and planned posting slots"
          statuses={Object.entries(postCounts).map(([label, count]) => ({
            label, count,
            tone: label === "published" ? "success" : label === "scheduled" ? "info" : label === "planned" ? "warning" : "neutral",
          }))}
          examples={demoCalendarSlots.filter((s) => s.title).slice(0, 3).map((s) => ({
            primary:   s.title ?? "—",
            secondary: `${s.clientId ? getRestaurantName(s.clientId) : "Unassigned"} · ${s.date} ${s.time}`,
            badge:     s.kind,
            tone:      (s.kind === "published" ? "success" : s.kind === "scheduled" ? "info" : "neutral") as StatusBadgeTone,
          }))}
          relations={["Draft Sets", "Clients", "Activity Log"]}
          testId="entity-posts"
        />

        {/* 6. Tasks */}
        <EntityCard
          icon={CheckSquare}
          iconClass="text-cyan-400"
          name="Tasks"
          count={demoTasksV2.length}
          description="Internal team tasks linked to clients and content"
          statuses={Object.entries(taskCounts).map(([label, count]) => ({
            label, count,
            tone: label === "Completed" ? "success" : label === "In Progress" ? "info" : label === "Waiting" ? "warning" : "neutral",
          }))}
          examples={demoTasksV2.slice(0, 3).map((t) => ({
            primary:   t.title,
            secondary: `${t.assignedTo} · ${t.type} · due ${t.dueDate}`,
            badge:     t.status,
            tone:      (t.status === "Completed" ? "success" : t.status === "In Progress" ? "info" : t.status === "Waiting" ? "warning" : "neutral") as StatusBadgeTone,
          }))}
          relations={["Clients", "Content Concepts", "Team"]}
          testId="entity-tasks"
        />

        {/* 7. Alerts */}
        <EntityCard
          icon={Bell}
          iconClass="text-orange-400"
          name="Alerts"
          count={demoTeamAlerts.length}
          description="Operational alerts surfaced to team roles"
          statuses={Object.entries(alertCounts).map(([label, count]) => ({
            label, count,
            tone: severityTone(label),
          }))}
          examples={demoTeamAlerts.slice(0, 3).map((a) => ({
            primary:   a.title,
            secondary: `${a.clientId ? getRestaurantName(a.clientId) + " · " : ""}${a.category} · ${a.time}`,
            badge:     a.severity,
            tone:      severityTone(a.severity),
          }))}
          relations={["Clients", "Media Assets", "Reports"]}
          testId="entity-alerts"
        />

        {/* 8. Weekly Reports */}
        <EntityCard
          icon={FileText}
          iconClass="text-indigo-400"
          name="Weekly Reports"
          count={demoWeeklyReports.length}
          description="Weekly performance summaries per client"
          statuses={Object.entries(weeklyCounts).map(([label, count]) => ({
            label, count,
            tone: weeklyStatusTone(label),
          }))}
          examples={demoWeeklyReports.slice(0, 3).map((r) => ({
            primary:   `${getRestaurantName(r.clientId)} — ${r.weekRange}`,
            secondary: r.summary.slice(0, 60) + "…",
            badge:     r.status,
            tone:      weeklyStatusTone(r.status),
          }))}
          relations={["Clients", "Activity Log", "Team Portal"]}
          testId="entity-weekly-reports"
        />

        {/* 9. Monthly Reports */}
        <EntityCard
          icon={FileBarChart}
          iconClass="text-pink-400"
          name="Monthly Reports"
          count={demoMonthlyReports.length}
          description="Monthly performance reports delivered to client and team"
          statuses={Object.entries(monthlyCounts).map(([label, count]) => ({
            label, count,
            tone: label === "Healthy" ? "success" : label === "Attention" ? "warning" : "danger",
          }))}
          examples={demoMonthlyReports.slice(0, 3).map((r) => ({
            primary:   `${getRestaurantName(r.clientId)} — ${r.monthLabel}`,
            secondary: r.growthOverview.slice(0, 64) + "…",
            badge:     r.healthSummary.toLowerCase().startsWith("critical") ? "Critical" :
                       r.healthSummary.toLowerCase().startsWith("attention") ? "Attention" : "Healthy",
            tone:      (r.healthSummary.toLowerCase().startsWith("critical") ? "danger" :
                       r.healthSummary.toLowerCase().startsWith("attention") ? "warning" : "success") as StatusBadgeTone,
          }))}
          relations={["Clients", "Activity Log", "Team Portal"]}
          testId="entity-monthly-reports"
        />

        {/* 10. Activity Log */}
        <EntityCard
          icon={Activity}
          iconClass="text-teal-400"
          name="Activity Log"
          count={demoActivityLog.length}
          description="Append-only audit trail of all system events"
          statuses={Object.entries(activityCounts).map(([label, count]) => ({
            label, count,
            tone: label === "milestone" ? "success" : label === "warning" ? "danger" : label === "report" ? "info" : "neutral",
          }))}
          examples={demoActivityLog.slice(0, 3).map((a) => ({
            primary:   a.title,
            secondary: `${getRestaurantName(a.clientId)} · ${a.timestamp}`,
            badge:     a.kind,
            tone:      (a.kind === "milestone" ? "success" : a.kind === "warning" ? "danger" : "neutral") as StatusBadgeTone,
          }))}
          relations={["Clients", "Posts", "Reports", "Tasks"]}
          testId="entity-activity-log"
        />

      </div>
    </div>
  );
}

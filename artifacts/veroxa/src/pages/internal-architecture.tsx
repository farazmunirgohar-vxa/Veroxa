import {
  Layers, Database, Cog, ShieldCheck, GitBranch, Bell, Heart,
  Brain, Plug, FolderTree,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { PageHeader } from "@/components/common";
import { rolePermissions, type AppRole } from "@/domain";
import { demoSystemStatus, demoWorkflowStages } from "@/data/demoData";

const domains = [
  { name: "clients",       what: "Client identity, lifecycle, health, risk" },
  { name: "content",       what: "Content items + workflow engine"          },
  { name: "media",         what: "Media library + runway calculation"       },
  { name: "reports",       what: "Weekly/monthly reporting operations"      },
  { name: "tasks",         what: "Internal task queue + assignment"         },
  { name: "notifications", what: "Role-segmented notifications"             },
  { name: "requests",      what: "Outbound client to-dos"                   },
  { name: "operations",    what: "Bottlenecks + operational health"         },
  { name: "ai",            what: "AI agents + recommendations (stubbed)"    },
  { name: "users",         what: "Role permission framework"                },
];

const services = [
  { name: "ClientService",       desc: "Client lookups + portfolio rollups"          },
  { name: "HealthService",       desc: "Per-client + composite health metrics"       },
  { name: "RiskService",         desc: "Ranked at-risk client surface"               },
  { name: "WorkflowService",     desc: "advance / next / previous / validate stage"  },
  { name: "ContentService",      desc: "Content queries + workflow state composition" },
  { name: "MediaService",        desc: "Runway + low-supply detection"               },
  { name: "ReportService",       desc: "Pending + per-client report filtering"       },
  { name: "TaskService",         desc: "Today's focus + overdue queue"               },
  { name: "NotificationService", desc: "Per-role notification feed"                  },
];

const repositories = [
  "ClientRepository", "ContentRepository", "MediaRepository", "ReportRepository",
  "TaskRepository", "NotificationRepository", "RequestRepository", "OperationsRepository", "AIRepository",
];

const futureIntegrations = [
  { label: "PostgreSQL + Drizzle",   status: "Planned" as const, note: "Swap repository internals; pages stay untouched." },
  { label: "Real auth (Clerk)",      status: "Planned" as const, note: "Replace InternalDemoGuard with role-based session check." },
  { label: "Object storage uploads", status: "Planned" as const, note: "Replace media UI stubs with signed-URL uploads." },
  { label: "Real AI providers",      status: "Planned" as const, note: "Wire ai/repository to live model APIs." },
  { label: "Instagram / TikTok",     status: "Future"  as const, note: "Implement Publishing service behind WorkflowService." },
  { label: "Email / SMS",            status: "Future"  as const, note: "Plug NotificationService.emit into provider." },
];

const aiLayers = [
  "Caption Agent",
  "Brand Voice Agent",
  "Media Curation Agent",
  "Scheduling Agent",
  "Reporting Agent",
];

export default function InternalArchitecture() {
  return (
    <div className="min-h-screen bg-background text-foreground px-4 md:px-8 py-6 md:py-10 max-w-5xl mx-auto">
      <PageHeader
        title="System Architecture"
        description="How Veroxa is organized today — and where real backend slots in tomorrow."
        testId="header-architecture"
      />

      <DemoOnlyBanner
        message="Internal architecture reference. Demo today, production tomorrow — the layer boundaries below stay the same."
        testId="banner-architecture"
      />

      {/* Domains */}
      <Card className="bg-card border-border mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-primary" /> Domains ({domains.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {domains.map((d) => (
            <div key={d.name} className="rounded-md border border-border bg-muted/20 px-3 py-2">
              <p className="text-sm font-semibold font-mono">src/domain/{d.name}/</p>
              <p className="text-xs text-muted-foreground">{d.what}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Services + repositories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Cog className="w-4 h-4 text-primary" /> Services ({services.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {services.map((s) => (
              <div key={s.name} className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <p className="text-sm font-semibold font-mono">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Database className="w-4 h-4 text-primary" /> Repositories ({repositories.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {repositories.map((r) => (
              <div key={r} className="rounded-md border border-border bg-muted/20 px-3 py-1.5">
                <p className="text-sm font-mono">{r}</p>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground pt-2">
              Each repository currently reads from <code className="font-mono">src/data/demoData.ts</code>.
              Swap the body for a database client when wiring real persistence — pages don't change.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow */}
      <Card className="bg-card border-border mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><GitBranch className="w-4 h-4 text-primary" /> Workflow engine ({demoWorkflowStages.length} stages)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          {demoWorkflowStages.map((stage, i) => (
            <Badge key={stage} variant="outline" className="text-[10px] border-border">
              {i + 1}. {stage}
            </Badge>
          ))}
        </CardContent>
      </Card>

      {/* Roles */}
      <Card className="bg-card border-border mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Role permission framework</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(Object.keys(rolePermissions) as AppRole[]).map((role) => {
            const rp = rolePermissions[role];
            return (
              <div key={role} className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold">{rp.label}</p>
                  <span className="text-[10px] text-muted-foreground">{rp.allowedActions.length} allowed actions</span>
                </div>
                <p className="text-[11px] text-muted-foreground"><span className="font-medium text-foreground/80">Visible:</span> {rp.visibleModules.join(" · ")}</p>
                {rp.restrictedModules.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-0.5"><span className="font-medium text-rose-300">Restricted:</span> {rp.restrictedModules.join(" · ")}</p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* AI + notifications + health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Brain className="w-4 h-4 text-violet-400" /> AI layers</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {aiLayers.map((a) => (
              <p key={a} className="text-xs text-foreground/85">• {a}</p>
            ))}
            <p className="text-[10px] text-muted-foreground pt-1">Stubbed today. Swap behind ai/repository.</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Notification engine</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-foreground/85">Role-segmented feeds: client, team, operator, owner.</p>
            <p className="text-[10px] text-muted-foreground pt-2">Future: emit → email / SMS / in-app.</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Heart className="w-4 h-4 text-rose-400" /> Health engine</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-foreground/85">Client · Inventory · Workflow · Reporting · Business.</p>
            <p className="text-[10px] text-muted-foreground pt-2">Demo composites. Will become live aggregates.</p>
          </CardContent>
        </Card>
      </div>

      {/* Future integrations */}
      <Card className="bg-card border-border mb-4">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Plug className="w-4 h-4 text-primary" /> Future integrations</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {futureIntegrations.map((f) => (
            <div key={f.label} className="rounded-md border border-border bg-muted/20 px-3 py-2 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{f.label}</p>
                <p className="text-[11px] text-muted-foreground">{f.note}</p>
              </div>
              <Badge variant="outline" className={`text-[10px] ${f.status === "Planned" ? "border-sky-500/40 text-sky-300 bg-sky-500/10" : "border-violet-500/40 text-violet-300 bg-violet-500/10"}`}>{f.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Layers className="w-4 h-4 text-primary" /> Current build status</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {demoSystemStatus.map((s) => (
            <p key={s.label} className="text-[11px] text-muted-foreground">
              <span className="font-mono">{s.label}</span> · <span className={s.state === "Active" ? "text-emerald-300" : s.state === "Placeholder" ? "text-amber-300" : "text-rose-300"}>{s.state}</span>
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

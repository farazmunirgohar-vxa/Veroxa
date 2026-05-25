import { useState } from "react";
import {
  Building2, Heart, ClipboardList, Images, Workflow, FileText, Activity, StickyNote,
  AlertTriangle, ArrowRight, ShieldX, CalendarDays,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { ownerPortalNavItems }    from "@/lib/ownerPortalNav";
import { teamPortalNavItems }     from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import {
  demoRestaurants, demoClientLifecycle, demoInternalNotes, demoClientRequests,
  demoBottlenecks, demoActivityLog, demoMediaRunway, demoReportingOps,
  demoContentItems, demoTasksV2, getRestaurantName, progressFromStage,
  lifecycleStageColor, riskLevelColor, requestStatusColor, requestPriorityColor,
  reportOpStatusColor,
} from "@/data/demoData";

interface Props { role?: "owner" | "operator" | "team" }

const roleShell = {
  owner:    { items: ownerPortalNavItems,    name: "Owner Portal"    },
  operator: { items: operatorPortalNavItems, name: "Operator Portal" },
  team:     { items: teamPortalNavItems,     name: "Team Portal"     },
} as const;

export default function InternalClientDetail({ role = "operator" }: Props) {
  const shell = roleShell[role];
  const [clientId, setClientId] = useState(demoRestaurants[0].id);

  const client    = demoRestaurants.find((r) => r.id === clientId)!;
  const life      = demoClientLifecycle.find((l) => l.clientId === clientId);
  const notes     = demoInternalNotes.filter((n) => n.clientId === clientId);
  const requests  = demoClientRequests.filter((r) => r.clientId === clientId);
  const blocks    = demoBottlenecks.filter((b) => b.clientId === clientId);
  const activity  = demoActivityLog.filter((a) => a.clientId === clientId);
  const runway    = demoMediaRunway.find((m) => m.clientId === clientId);
  const reports   = demoReportingOps.filter((r) => r.clientId === clientId);
  const content   = demoContentItems.filter((c) => c.clientId === clientId);
  const tasks     = demoTasksV2.filter((t) => t.clientId === clientId);

  return (
    <PortalLayout items={shell.items} portalName={shell.name}>
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-client-detail">
          Client Detail
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Internal 360° view — lifecycle, content, reports, activity, notes, risks. Not visible to clients.
        </p>
      </div>

      <DemoOnlyBanner message="Demo only — internal Veroxa staff view. Client portal does not see this page." testId="banner-client-detail" />

      {/* Client picker */}
      <div className="flex flex-wrap gap-2 mb-4">
        {demoRestaurants.map((r) => (
          <button
            key={r.id}
            onClick={() => setClientId(r.id)}
            data-testid={`client-detail-pick-${r.id}`}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${
              r.id === clientId
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted/20 hover:border-primary/40"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />{r.name}
          </button>
        ))}
      </div>

      {/* Overview header */}
      <Card className="bg-card border-primary/30 mb-4">
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> {client.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {client.cuisine} · Team {client.assignedTeam} · Operator {client.assignedOperator}
              </p>
            </div>
            {life && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={`text-[10px] ${lifecycleStageColor[life.lifecycleStage]}`}>{life.lifecycleStage}</Badge>
                <Badge variant="outline" className={`text-[10px] ${riskLevelColor[life.riskLevel]}`}>Risk · {life.riskLevel}</Badge>
              </div>
            )}
          </div>
        </CardHeader>
        {life && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3">
              <Stat label="Plan"        value={life.servicePlan}                       />
              <Stat label="Monthly fee" value={`$${life.monthlyFee.toLocaleString()}`} />
              <Stat label="Start date"  value={life.startDate}                         />
              <Stat label="Contract"    value={`${life.contractMonths} months`}        />
              <Stat label="Health"      value={`${life.healthScore}%`}                 />
              <Stat label="Media"       value={life.mediaStatus}                       />
              <Stat label="Reporting"   value={life.reportingStatus}                   />
              <Stat label="Risk"        value={life.riskLevel}                         />
            </div>
            <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 flex items-start gap-2 text-xs">
              <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-primary flex-shrink-0" />
              <p><span className="font-medium">Next action:</span> {life.nextAction}</p>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Health + media runway */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Heart className="w-4 h-4 text-rose-400" /> Health & runway</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {life && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span>Health score</span><span className="font-semibold">{life.healthScore}%</span>
                </div>
                <Progress value={life.healthScore} className="h-1.5" />
              </div>
            )}
            {runway && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Stat label="Unused photos"  value={String(runway.unusedPhotos)} />
                <Stat label="Unused videos"  value={String(runway.unusedVideos)} />
                <Stat label="Posts / week"   value={String(runway.postsPerWeek)} />
                <Stat label="Days remaining" value={String(runway.daysRemaining)} />
              </div>
            )}
            {runway && (
              <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs">
                <p className="font-medium mb-1">Internal advice</p>
                <p className="text-foreground/80">{runway.internalAdvice}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risks + bottlenecks */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><ShieldX className="w-4 h-4 text-rose-400" /> Risks & bottlenecks</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {blocks.length === 0 ? (
              <p className="text-xs text-emerald-400">No active bottlenecks.</p>
            ) : blocks.map((b) => (
              <div key={b.id} className="rounded-md border border-rose-500/30 bg-rose-500/5 px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">{b.type}</p>
                  <Badge variant="outline" className="text-[9px] border-rose-500/40 text-rose-300 bg-rose-500/10">{b.severity}</Badge>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">{b.detail}</p>
                <p className="text-[11px] text-primary mt-1 flex items-center gap-1"><ArrowRight className="w-3 h-3" />{b.recommendedAction}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Content workflow */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Workflow className="w-4 h-4 text-primary" /> Content in workflow ({content.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {content.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No active content items.</p>
            ) : content.map((c) => (
              <div key={c.id} className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-medium leading-snug">{c.title}</p>
                  <Badge variant="outline" className="text-[9px] border-border">{c.status}</Badge>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{c.currentStage}</span>
                  <span className="tabular-nums">{progressFromStage(c.currentStage)}%</span>
                </div>
                <Progress value={progressFromStage(c.currentStage)} className="h-1 mt-1" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="w-4 h-4 text-primary" /> Tasks ({tasks.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No open tasks.</p>
            ) : tasks.map((t) => (
              <div key={t.id} className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-medium">{t.title}</p>
                  <Badge variant="outline" className="text-[9px] border-border">{t.priority}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">{t.assignedTo} · {t.status} · {t.dueDate}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Reports */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-violet-400" /> Reports ({reports.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-medium">{r.type} · {r.period}</p>
                  <Badge variant="outline" className={`text-[9px] ${reportOpStatusColor[r.status]}`}>{r.status}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">{r.metricsSummary}</p>
                {r.internalValidationNote && (
                  <p className="text-[10px] text-amber-300 mt-1">Validation: {r.internalValidationNote}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Requests */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Images className="w-4 h-4 text-sky-400" /> Outstanding requests ({requests.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-medium leading-snug">{r.title}</p>
                  <Badge variant="outline" className={`text-[9px] ${requestStatusColor[r.status]}`}>{r.status}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mb-1">{r.description}</p>
                <div className="flex items-center gap-2 text-[10px]">
                  <Badge variant="outline" className={`${requestPriorityColor[r.priority]}`}>{r.priority}</Badge>
                  <span className="text-muted-foreground flex items-center gap-1"><CalendarDays className="w-2.5 h-2.5" />{r.dueDate}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Recent activity</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {activity.slice(0, 6).map((a) => (
              <div key={a.id} className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <p className="text-sm font-medium leading-snug">{a.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{a.timestamp}</p>
                {a.detail && <p className="text-xs text-foreground/80 mt-1">{a.detail}</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Internal notes */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><StickyNote className="w-4 h-4 text-amber-400" /> Internal notes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {notes.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No internal notes.</p>
            ) : notes.map((n) => (
              <div key={n.id} className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-300 bg-amber-500/10">{n.type}</Badge>
                  <span className="text-[10px] text-muted-foreground">{n.author} · {n.authorRole} · {n.timestamp}</span>
                </div>
                <p className="text-xs text-foreground/85 leading-relaxed">{n.body}</p>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Internal only — clients never see this section. Demo data: {getRestaurantName(clientId)}.
            </p>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

import { Activity, Users, Clock, AlertTriangle } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoOpsIntelligence, getRestaurantName } from "@/data/demoData";

const queueColor = (status: "above" | "below" | "on") =>
  status === "above" ? "text-rose-400" : status === "below" ? "text-emerald-400" : "text-sky-400";

export default function OwnerOpsIntelligence() {
  const o    = demoOpsIntelligence;
  const wMax = Math.max(...o.teamWorkload.map((m) => m.value));
  const rMax = Math.max(...o.riskDistribution.map((r) => r.value), 1);

  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-ops-intelligence">
          Operations Intelligence
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Team workload, queues, backlogs, client responsiveness, and risk distribution at a glance.
        </p>
      </div>

      <DemoOnlyBanner message="Demo only — operational metrics are sample data." testId="banner-ops-intelligence" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Team workload */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Team workload</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {o.teamWorkload.map((m) => (
              <div key={m.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>{m.label}</span>
                  <span className="text-muted-foreground tabular-nums">{m.value} open</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted/40">
                  <div className="h-2 rounded-full bg-primary/80" style={{ width: `${(m.value / wMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Queues + backlogs */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Queues & backlogs</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <QueueTile label="Review queue"      v={o.reviewQueue}      />
            <QueueTile label="Approval queue"    v={o.approvalQueue}    />
            <QueueTile label="Content backlog"   v={o.contentBacklog}   />
            <QueueTile label="Reporting backlog" v={o.reportingBacklog} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Client responsiveness */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Client responsiveness</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {o.clientResponsiveness.map((c) => {
              const slow = c.avgHours > 24;
              return (
                <div key={c.clientId} className={`rounded-md border ${slow ? "border-amber-500/40 bg-amber-500/5" : "border-border bg-muted/20"} px-3 py-2 flex items-center justify-between`}>
                  <p className="text-sm">{getRestaurantName(c.clientId)}</p>
                  <span className={`text-xs font-semibold tabular-nums ${slow ? "text-amber-300" : ""}`}>{c.avgHours.toFixed(1)}h avg</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Risk distribution */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-primary" /> Risk distribution</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {o.riskDistribution.map((r) => (
              <div key={r.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>{r.label}</span>
                  <span className="text-muted-foreground tabular-nums">{r.value}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted/40">
                  <div className={`h-2 rounded-full ${r.color}`} style={{ width: `${(r.value / rMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}

function QueueTile({ label, v }: { label: string; v: { current: number; target: number; status: "above" | "below" | "on" } }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${queueColor(v.status)}`}>{v.current}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">Target {v.target}</p>
    </div>
  );
}

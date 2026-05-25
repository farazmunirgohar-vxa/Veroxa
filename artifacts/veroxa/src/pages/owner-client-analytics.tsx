import { useState } from "react";
import { Building2, Heart, FileText, Images, Globe } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoRestaurants, demoClientPriorities, demoMediaAnalytics, getRestaurantName } from "@/data/demoData";

const clientPlanMap: Record<string, { plan: string; since: string }> = {
  mamadali: { plan: "Growth",    since: "Feb 2026" },
  urban:    { plan: "Pro",       since: "Mar 2026" },
  crescent: { plan: "Premium",   since: "Dec 2025" },
  alnoor:   { plan: "Essential", since: "Apr 2026" },
};

export default function OwnerClientAnalytics() {
  const [selectedId, setSelectedId] = useState(demoRestaurants[0].id);
  const client    = demoRestaurants.find((r) => r.id === selectedId)!;
  const meta      = clientPlanMap[selectedId] ?? { plan: "—", since: "—" };
  const priority  = demoClientPriorities.find((p) => p.clientId === selectedId);
  const media     = demoMediaAnalytics.inventoryByClient.find((i) => i.clientId === selectedId);

  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-client-analytics">
          Client Analytics
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Per-client deep dive — profile, health, content, media, reporting, and Google activity.
        </p>
      </div>

      <DemoOnlyBanner message="Demo only — per-client analytics are sample data." testId="banner-client-analytics" />

      {/* Client picker */}
      <div className="flex flex-wrap gap-2 mb-4">
        {demoRestaurants.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedId(r.id)}
            data-testid={`client-pick-${r.id}`}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${
              r.id === selectedId
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted/20 hover:border-primary/40"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> {r.name}
          </button>
        ))}
      </div>

      {/* Profile */}
      <Card className="bg-card border-border mb-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> {client.name}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">{client.cuisine} · {meta.plan} plan</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <Stat label="Plan"           value={meta.plan}                       />
            <Stat label="Service since"  value={meta.since}                      />
            <Stat label="Priority level" value={priority?.priorityLevel ?? "—"}  />
            <Stat label="Health status"  value={priority?.healthStatus ?? "—"}   />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Health */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Heart className="w-4 h-4 text-rose-400" /> Health score</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span>Overall health</span>
                <span className="font-semibold">{priority?.healthStatus ?? "—"}</span>
              </div>
              <Progress
                value={priority?.healthStatus === "Excellent" ? 95 : priority?.healthStatus === "Healthy" ? 82 : priority?.healthStatus === "Warning" ? 60 : 32}
                className="h-1.5"
              />
            </div>
            {priority?.riskFactors.length ? (
              <div>
                <p className="text-[11px] text-muted-foreground mb-1.5">Risk factors</p>
                <div className="flex flex-wrap gap-1.5">
                  {priority.riskFactors.map((f) => (
                    <Badge key={f} variant="outline" className="text-[10px] border-rose-500/30 text-rose-300 bg-rose-500/10">{f}</Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-emerald-400">No active risks.</p>
            )}
          </CardContent>
        </Card>

        {/* Media */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Images className="w-4 h-4 text-sky-400" /> Media inventory</CardTitle></CardHeader>
          <CardContent>
            {media ? (
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Approved" value={String(media.approved)} />
                <Stat label="Pending"  value={String(media.pending)}  />
                <Stat label="Status"   value={media.low ? "Low supply" : "Healthy"} />
                <Stat label="Total"    value={String(media.approved + media.pending)} />
              </div>
            ) : <p className="text-xs text-muted-foreground">No media data.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Content + reporting */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-violet-400" /> Reporting history</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-xs text-foreground/85">
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2 flex items-center justify-between">
              <span>Weekly reports (last 4)</span><span className="font-semibold tabular-nums">4 / 4</span>
            </div>
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2 flex items-center justify-between">
              <span>Monthly report (last)</span><span className="font-semibold tabular-nums">Published</span>
            </div>
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2 flex items-center justify-between">
              <span>Avg validation time</span><span className="font-semibold tabular-nums">36 hrs</span>
            </div>
          </CardContent>
        </Card>

        {/* Google activity */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-400" /> Google activity (simulated)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Stat label="Profile views"   value="2,148" />
              <Stat label="Direction asks"  value="312"   />
              <Stat label="Photo views"     value="4,892" />
              <Stat label="Review velocity" value="+8 / mo" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              Sample data for {getRestaurantName(selectedId)} — no Google API connected.
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

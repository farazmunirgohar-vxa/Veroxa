import { Camera, Video, Archive, AlertTriangle } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoMediaAnalytics, getRestaurantName, type BizSeverity } from "@/data/demoData";

const sevColor: Record<BizSeverity, string> = {
  Critical: "border-rose-500/40 text-rose-300 bg-rose-500/10",
  High:     "border-amber-500/40 text-amber-300 bg-amber-500/10",
  Medium:   "border-yellow-500/40 text-yellow-300 bg-yellow-500/10",
  Low:      "border-muted-foreground/40 text-muted-foreground bg-muted/30",
};

export default function OwnerMediaAnalytics() {
  const m       = demoMediaAnalytics;
  const ageMax  = Math.max(...m.inventoryByAge.map((b) => b.count));

  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-media-analytics">
          Media Analytics
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Inventory health across the portfolio — what's coming in, what's aging, and who's at risk.
        </p>
      </div>

      <DemoOnlyBanner message="Demo only — media metrics are sample data." testId="banner-media-analytics" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <Metric icon={Camera}  label="Photos received"   value={String(m.photosReceived)} />
        <Metric icon={Video}   label="Videos received"   value={String(m.videosReceived)} />
        <Metric icon={Archive} label="Unused inventory"  value={String(m.unusedInventory)} accent="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Inventory by age */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base">Inventory by age</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {m.inventoryByAge.map((b) => (
              <div key={b.bucket}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>{b.bucket}</span>
                  <span className="text-muted-foreground tabular-nums">{b.count}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted/40">
                  <div className={`h-2 rounded-full ${b.color}`} style={{ width: `${(b.count / ageMax) * 100}%` }} />
                </div>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground pt-1">Items over 60 days are at risk of staleness.</p>
          </CardContent>
        </Card>

        {/* Inventory by client */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base">Inventory by client</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {m.inventoryByClient.map((i) => (
              <div key={i.clientId} className={`rounded-md border ${i.low ? "border-rose-500/40 bg-rose-500/5" : "border-border bg-muted/20"} px-3 py-2`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{getRestaurantName(i.clientId)}</p>
                  {i.low && <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-300 bg-rose-500/10">Low supply</Badge>}
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                  <span>Approved: <span className="text-foreground font-semibold tabular-nums">{i.approved}</span></span>
                  <span>Pending: <span className="text-foreground font-semibold tabular-nums">{i.pending}</span></span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming shortages */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Upcoming shortages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {m.upcomingShortages.map((s) => (
            <div key={s.clientId} className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 flex items-center gap-3">
              <Badge variant="outline" className={`text-[10px] ${sevColor[s.severity]}`}>{s.severity}</Badge>
              <p className="text-sm flex-1">{getRestaurantName(s.clientId)}</p>
              <span className="text-xs text-amber-300 font-semibold">{s.daysRemaining} days remaining</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

function Metric({ icon: Icon, label, value, accent }: { icon: typeof Camera; label: string; value: string; accent?: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
          <Icon className="w-3.5 h-3.5" />{label}
        </div>
        <p className={`text-2xl font-bold tabular-nums ${accent ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

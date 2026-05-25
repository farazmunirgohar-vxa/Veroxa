import { Crosshair, ArrowRight } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoOwnerCommandItems, type BizSeverity, type BizCategory } from "@/data/demoData";

const severityOrder: BizSeverity[] = ["Critical", "High", "Medium", "Low"];

const sevColor: Record<BizSeverity, string> = {
  Critical: "border-rose-500/40 text-rose-300 bg-rose-500/10",
  High:     "border-amber-500/40 text-amber-300 bg-amber-500/10",
  Medium:   "border-yellow-500/40 text-yellow-300 bg-yellow-500/10",
  Low:      "border-muted-foreground/40 text-muted-foreground bg-muted/30",
};

const sevBorder: Record<BizSeverity, string> = {
  Critical: "border-l-rose-500",
  High:     "border-l-amber-500",
  Medium:   "border-l-yellow-500",
  Low:      "border-l-border",
};

const catColor: Record<BizCategory, string> = {
  "Business Risk":       "border-rose-500/40 text-rose-300 bg-rose-500/10",
  "Growth Opportunity":  "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  "Team Bottleneck":     "border-amber-500/40 text-amber-300 bg-amber-500/10",
  "Client Risk":         "border-pink-500/40 text-pink-300 bg-pink-500/10",
  "Revenue Risk":        "border-orange-500/40 text-orange-300 bg-orange-500/10",
  "Operational Warning": "border-sky-500/40 text-sky-300 bg-sky-500/10",
};

export default function OwnerCommandCenter() {
  const categories = Array.from(new Set(demoOwnerCommandItems.map((i) => i.category))) as BizCategory[];

  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-command-center">
          Command Center
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Business risks, opportunities, and operational warnings — ranked by severity with
          recommended actions.
        </p>
      </div>

      <DemoOnlyBanner message="Demo only — risks and opportunities are sample data." testId="banner-command-center" />

      {/* Severity summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {severityOrder.map((sev) => {
          const n = demoOwnerCommandItems.filter((i) => i.severity === sev).length;
          return (
            <Card key={sev} className="bg-card border-border">
              <CardContent className="p-3 text-center">
                <p className={`text-2xl font-bold tabular-nums ${
                  sev === "Critical" ? "text-rose-400"
                  : sev === "High"   ? "text-amber-400"
                  : sev === "Medium" ? "text-yellow-400"
                  : "text-muted-foreground"
                }`}>{n}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{sev}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-4">
        {categories.map((cat) => {
          const items = demoOwnerCommandItems
            .filter((i) => i.category === cat)
            .sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity));
          return (
            <Card key={cat} className="bg-card border-border" data-testid={`command-cat-${cat.replace(/\s/g, "-").toLowerCase()}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-primary" />
                  <span className={`text-xs font-medium px-2 py-0.5 rounded border ${catColor[cat]}`}>{cat}</span>
                  <span className="text-xs text-muted-foreground ml-1">({items.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.map((it) => (
                  <div key={it.id} className={`rounded-md border border-border border-l-4 ${sevBorder[it.severity]} bg-muted/20 p-3`} data-testid={`command-item-${it.id}`}>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] ${sevColor[it.severity]}`}>{it.severity}</Badge>
                      <p className="text-sm font-medium">{it.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{it.description}</p>
                    <div className="rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1.5 flex items-start gap-1.5 text-xs">
                      <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-primary flex-shrink-0" />
                      <p>{it.recommendedAction}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PortalLayout>
  );
}

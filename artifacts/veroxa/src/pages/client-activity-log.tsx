import { useState, useMemo } from "react";
import { Activity, Upload, FileText, Globe, CalendarDays, AlertTriangle, Award } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoActivityLog, demoRestaurants, type ActivityKind } from "@/data/demoData";

const kindMeta: Record<ActivityKind, { icon: typeof Upload; color: string; label: string }> = {
  upload:    { icon: Upload,        color: "border-sky-500/40 text-sky-300 bg-sky-500/10",             label: "Upload"      },
  report:    { icon: FileText,      color: "border-violet-500/40 text-violet-300 bg-violet-500/10",    label: "Report"      },
  google:    { icon: Globe,         color: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10", label: "Google"      },
  schedule:  { icon: CalendarDays,  color: "border-primary/40 text-primary bg-primary/10",             label: "Schedule"    },
  warning:   { icon: AlertTriangle, color: "border-rose-500/40 text-rose-300 bg-rose-500/10",          label: "Warning"     },
  milestone: { icon: Award,         color: "border-amber-500/40 text-amber-300 bg-amber-500/10",       label: "Milestone"   },
};

export default function ClientActivityLog() {
  const [clientId, setClientId] = useState(demoRestaurants[0].id);
  const [kindFilter, setKindFilter] = useState<"all" | ActivityKind>("all");

  const events = useMemo(() => {
    return demoActivityLog
      .filter((e) => e.clientId === clientId)
      .filter((e) => kindFilter === "all" || e.kind === kindFilter);
  }, [clientId, kindFilter]);

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-activity-log">
          Activity History
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Every milestone, upload, report, and notification for your restaurant — in chronological order.
        </p>
      </div>

      <DemoOnlyBanner message="Demo only — activity log is sample data." testId="banner-activity-log" />

      {/* Client switcher */}
      <div className="flex flex-wrap gap-2 mb-3">
        {demoRestaurants.map((r) => (
          <button
            key={r.id}
            onClick={() => setClientId(r.id)}
            data-testid={`activity-client-${r.id}`}
            className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
              clientId === r.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/20 hover:border-primary/40"
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      {/* Kind filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <FilterChip label="All" active={kindFilter === "all"} onClick={() => setKindFilter("all")} />
        {(Object.entries(kindMeta) as [ActivityKind, typeof kindMeta[ActivityKind]][]).map(([k, m]) => (
          <FilterChip key={k} label={m.label} active={kindFilter === k} onClick={() => setKindFilter(k)} />
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Activity timeline ({events.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-8">No activity matches this filter.</p>
          ) : (
            <ol className="relative border-l-2 border-border/60 ml-2 space-y-3">
              {events.map((e) => {
                const meta = kindMeta[e.kind];
                const Icon = meta.icon;
                return (
                  <li key={e.id} className="ml-4 relative" data-testid={`activity-event-${e.id}`}>
                    <span className={`absolute -left-[22px] top-1 w-3 h-3 rounded-full border-2 border-card ${meta.color.split(" ")[2]}`} />
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="outline" className={`text-[9px] ${meta.color}`}>
                        <Icon className="w-2.5 h-2.5 mr-0.5" />{meta.label}
                      </Badge>
                      <p className="text-sm font-medium">{e.title}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{e.timestamp}</p>
                    {e.detail && <p className="text-xs text-foreground/80 mt-1">{e.detail}</p>}
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      data-testid={`activity-filter-${label.toLowerCase()}`}
      className={`rounded-md border px-2.5 py-1 text-[11px] transition-colors ${
        active ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/20 hover:border-primary/40"
      }`}
    >
      {label}
    </button>
  );
}

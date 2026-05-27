// TODO(client-health-drift): the header pills render `Health` from
//   `demoOwnerMetrics.clientHealthAverage` (hard-coded %) and `Risks "2 / 1"`
//   as a hard-coded literal string. The canonical source is
//   `ClientHealthEngine.portfolioSummary()` (`atRisk`, `broken`) plus
//   `ownerRisks()` in `src/domain/clientHealth/engine.ts`. See
//   `docs/CLIENT_HEALTH_ENGINE_CONTRACT.md` §5.1 (Owner shell). The "2 / 1"
//   string is not bound to any fixture and can drift silently from other
//   surfaces. No fix in this pass — documentation only.
import { Sunrise, TrendingUp, AlertTriangle, Users, UsersRound, Target } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoOwnerBriefing, demoOwnerMetrics } from "@/data/demoData";

const categoryMeta: Record<string, { icon: typeof Sunrise; color: string; bg: string }> = {
  "Business Summary":     { icon: Sunrise,       color: "text-primary",     bg: "bg-primary/10 border-l-primary"     },
  "Revenue Summary":      { icon: TrendingUp,    color: "text-emerald-400", bg: "bg-emerald-500/10 border-l-emerald-500" },
  "Risk Summary":         { icon: AlertTriangle, color: "text-rose-400",    bg: "bg-rose-500/10 border-l-rose-500"   },
  "Client Summary":       { icon: Users,         color: "text-sky-400",     bg: "bg-sky-500/10 border-l-sky-500"     },
  "Team Summary":         { icon: UsersRound,    color: "text-violet-400",  bg: "bg-violet-500/10 border-l-violet-500" },
  "Recommendations":      { icon: Target,        color: "text-amber-400",   bg: "bg-amber-500/10 border-l-amber-500" },
};

const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

export default function OwnerDailyBriefing() {
  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="rounded-xl border border-primary/30 bg-primary/5 px-6 py-5 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Executive Daily Briefing</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-daily-briefing">Good morning</h2>
            <p className="text-muted-foreground text-sm mt-1">{today}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Pill label="MRR"      value={`$${demoOwnerMetrics.monthlyRecurringRevenue.toLocaleString()}`} color="text-emerald-400" />
            <Pill label="Clients"  value={String(demoOwnerMetrics.totalActiveClients)}                     color="text-sky-400"      />
            <Pill label="Risks"    value="2 / 1"                                                            color="text-rose-400"     />
            <Pill label="Health"   value={`${demoOwnerMetrics.clientHealthAverage}%`}                       color="text-violet-400"   />
          </div>
        </div>
      </div>

      <DemoOnlyBanner message="Demo only — briefing content is sample data representing a future automated daily output." testId="banner-daily-briefing" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {demoOwnerBriefing.map((section) => {
          const meta = categoryMeta[section.category] ?? { icon: Sunrise, color: "text-foreground", bg: "bg-muted/30 border-l-border" };
          const Icon = meta.icon;
          return (
            <Card key={section.category} className={`bg-card border border-border border-l-4 ${meta.bg.split(" ").pop()}`} data-testid={`briefing-section-${section.category.replace(/\s/g, "-").toLowerCase()}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className={`p-1.5 rounded-md ${meta.bg.split(" ")[0]}`}>
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                  </span>
                  {section.category}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{section.summary}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/85 leading-relaxed">
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.color}`} style={{ background: "currentColor" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PortalLayout>
  );
}

function Pill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-2 text-center">
      <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

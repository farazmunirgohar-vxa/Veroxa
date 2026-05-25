import { ShieldAlert } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import {
  demoRiskItems,
  getRestaurantName,
  type RiskSeverityLevel,
} from "@/data/demoData";

const severityOrder: RiskSeverityLevel[] = ["Critical", "High", "Medium", "Low"];

const severityColor: Record<RiskSeverityLevel, string> = {
  Critical: "border-rose-500/40 text-rose-300 bg-rose-500/10",
  High:     "border-amber-500/40 text-amber-300 bg-amber-500/10",
  Medium:   "border-yellow-500/40 text-yellow-300 bg-yellow-500/10",
  Low:      "border-muted-foreground/40 text-muted-foreground bg-muted/30",
};

const severityBorderLeft: Record<RiskSeverityLevel, string> = {
  Critical: "border-l-rose-500",
  High:     "border-l-amber-500",
  Medium:   "border-l-yellow-500",
  Low:      "border-l-border",
};

const categoryColor: Record<string, string> = {
  Media:      "border-sky-500/40 text-sky-300 bg-sky-500/10",
  Reporting:  "border-violet-500/40 text-violet-300 bg-violet-500/10",
  Client:     "border-pink-500/40 text-pink-300 bg-pink-500/10",
  Onboarding: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  Google:     "border-cyan-500/40 text-cyan-300 bg-cyan-500/10",
  Brand:      "border-orange-500/40 text-orange-300 bg-orange-500/10",
  Content:    "border-indigo-500/40 text-indigo-300 bg-indigo-500/10",
};

export default function OperatorRiskCenter() {
  const sorted = [...demoRiskItems].sort(
    (a, b) =>
      severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity),
  );

  const counts = severityOrder.map((s) => ({
    severity: s,
    count: sorted.filter((r) => r.severity === s).length,
  }));

  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          data-testid="header-risk-center"
        >
          Client Risk Center
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          All active risks across the portfolio, ranked by severity — from
          critical media shortages to minor brand updates.
        </p>
      </div>

      <DemoOnlyBanner
        message="Demo only — risks are sample data. No real monitoring is connected."
        testId="banner-risk-center"
      />

      {/* Severity summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {counts.map(({ severity, count }) => (
          <Card key={severity} className="bg-card border-border">
            <CardContent className="p-3 text-center">
              <p
                className={`text-2xl font-bold tabular-nums ${
                  severity === "Critical" ? "text-rose-400"
                  : severity === "High"   ? "text-amber-400"
                  : severity === "Medium" ? "text-yellow-400"
                  : "text-muted-foreground"
                }`}
              >
                {count}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{severity}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-primary" />
            All risks ({sorted.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sorted.map((risk) => (
            <div
              key={risk.id}
              className={`rounded-md border border-border border-l-4 ${severityBorderLeft[risk.severity]} bg-muted/20 p-3`}
              data-testid={`risk-item-${risk.id}`}
            >
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded border ${severityColor[risk.severity]}`}
                >
                  {risk.severity}
                </span>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded border ${categoryColor[risk.category] ?? "border-muted-foreground/40 text-muted-foreground bg-muted/30"}`}
                >
                  {risk.category}
                </span>
                <p className="text-sm font-medium">{risk.title}</p>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {risk.time}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {risk.description}
              </p>
              {risk.clientId && (
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Client: {getRestaurantName(risk.clientId)}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

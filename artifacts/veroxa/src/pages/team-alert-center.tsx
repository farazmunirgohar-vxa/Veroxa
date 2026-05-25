import { ShieldAlert } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { PageHeader, StatusBadge } from "@/components/common";
import type { StatusBadgeTone } from "@/components/common";
import {
  demoTeamAlerts, getRestaurantName,
  type AlertSeverity, type AlertCategory,
} from "@/data/demoData";

// Severity → StatusBadge tone (replaces inline severityColor record)
const severityTone: Record<AlertSeverity, StatusBadgeTone> = {
  Critical: "danger",
  High:     "warning",
  Medium:   "caution",
  Low:      "neutral",
};

// Left-border accent per severity (kept inline — structural, not a badge)
const severityBorder: Record<AlertSeverity, string> = {
  Critical: "border-l-rose-500",
  High:     "border-l-amber-500",
  Medium:   "border-l-yellow-500",
  Low:      "border-l-border",
};

// Category → StatusBadge tone (replaces inline categoryColor record)
const categoryTone: Record<AlertCategory, StatusBadgeTone> = {
  Media:      "info",
  Report:     "accent",
  Google:     "info",
  Onboarding: "success",
  Brand:      "danger",
};

const severityOrder: AlertSeverity[] = ["Critical", "High", "Medium", "Low"];

export default function TeamAlertCenter() {
  const sorted = [...demoTeamAlerts].sort(
    (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity),
  );

  const counts = severityOrder.map((s) => ({
    severity: s,
    count: sorted.filter((a) => a.severity === s).length,
  }));

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <PageHeader
        title="Alert Center"
        description="All active alerts sorted by severity — client risks, media issues, and reporting delays."
        testId="header-alert-center"
      />

      <DemoOnlyBanner
        message="Demo only — alert data is sample. No real monitoring is connected."
        testId="banner-alert-center"
      />

      {/* Severity summary tiles */}
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
            All alerts ({sorted.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sorted.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-md border border-border border-l-4 ${severityBorder[alert.severity]} bg-muted/20 p-3`}
              data-testid={`alert-${alert.id}`}
            >
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <StatusBadge tone={severityTone[alert.severity]}>{alert.severity}</StatusBadge>
                <StatusBadge tone={categoryTone[alert.category]}>{alert.category}</StatusBadge>
                <p className="text-sm font-medium">{alert.title}</p>
                <span className="text-[10px] text-muted-foreground ml-auto">{alert.time}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{alert.description}</p>
              {alert.clientId && (
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Client: {getRestaurantName(alert.clientId)}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

import { ShieldAlert } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { PageHeader, StatusBadge } from "@/components/common";
import type { StatusBadgeTone } from "@/components/common";
import {
  demoClientTeamWorkflow,
  type WorkflowItem,
} from "@/data/workflows/clientTeamWorkflow";
import {
  getTeamStatusLabel,
  getWorkflowTone,
  sortWorkflowItems,
} from "@/lib/workflows/workflowStatus";
import { getRestaurantName } from "@/data/demoData";

type AlertSeverity = "Critical" | "High" | "Medium" | "Low";
type WorkflowAlertCategory = "Media" | "Onboarding";

interface WorkflowAlert {
  item: WorkflowItem;
  category: WorkflowAlertCategory;
  severity: AlertSeverity;
}

const categoryTone: Record<WorkflowAlertCategory, StatusBadgeTone> = {
  Media: "info",
  Onboarding: "success",
};

const severityTone: Record<AlertSeverity, StatusBadgeTone> = {
  Critical: "danger",
  High:     "warning",
  Medium:   "caution",
  Low:      "neutral",
};

const severityBorder: Record<AlertSeverity, string> = {
  Critical: "border-l-rose-500",
  High:     "border-l-amber-500",
  Medium:   "border-l-yellow-500",
  Low:      "border-l-border",
};

const severityOrder: AlertSeverity[] = ["Critical", "High", "Medium", "Low"];

function getWorkflowAlertCategory(item: WorkflowItem): WorkflowAlertCategory | null {
  if (item.type === "media") return "Media";
  if (item.type === "request") return "Onboarding";
  return null;
}

function getWorkflowAlertSeverity(item: WorkflowItem): AlertSeverity {
  if (item.priority === "urgent") return "Critical";
  if (item.priority === "high") return "High";
  if (item.priority === "low") return "Low";
  return "Medium";
}

function getWorkflowAlertDescription(item: WorkflowItem): string {
  const status = getTeamStatusLabel(item.stage);
  return `${status}. Due: ${item.dueLabel}. Keep in team review; nothing goes live from this demo alert.`;
}

function getWorkflowAlertTime(item: WorkflowItem): string {
  return item.dueLabel;
}

function buildWorkflowAlerts(items: WorkflowItem[]): WorkflowAlert[] {
  return sortWorkflowItems(items).flatMap((item) => {
    const category = getWorkflowAlertCategory(item);
    if (!category) return [];
    return [{ item, category, severity: getWorkflowAlertSeverity(item) }];
  });
}

export default function TeamAlertCenter() {
  const sorted = buildWorkflowAlerts(demoClientTeamWorkflow).sort(
    (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity),
  );

  const counts = severityOrder.map((s) => ({
    severity: s,
    count: sorted.filter((alert) => alert.severity === s).length,
  }));

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <PageHeader
        title="Alert Center"
        description="Active workflow alerts for media and onboarding follow-up — demo only, read-only, and sorted by severity."
        testId="header-alert-center"
      />

      <DemoOnlyBanner
        message="Demo only — alert data is derived from sample workflow items. No real monitoring or publishing is connected."
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
          {sorted.map(({ item, category, severity }) => (
            <div
              key={item.id}
              className={`rounded-md border border-border border-l-4 ${severityBorder[severity]} bg-muted/20 p-3`}
              data-testid={`alert-${item.id}`}
            >
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <StatusBadge tone={severityTone[severity]}>{severity}</StatusBadge>
                <StatusBadge tone={categoryTone[category]}>{category}</StatusBadge>
                <StatusBadge tone={getWorkflowTone(item.stage)}>{getTeamStatusLabel(item.stage)}</StatusBadge>
                <p className="text-sm font-medium">{item.title}</p>
                <span className="text-[10px] text-muted-foreground ml-auto">{getWorkflowAlertTime(item)}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{getWorkflowAlertDescription(item)}</p>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Client: {getRestaurantName(item.clientId)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

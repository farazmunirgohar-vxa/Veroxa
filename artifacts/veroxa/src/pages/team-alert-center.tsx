import { ArrowRight, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
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
  getTeamAlertWorkflowItems,
  getTeamStatusLabel,
  getTeamSuggestedNextStep,
  getWorkflowSummaryCounts,
} from "@/lib/workflows/workflowStatus";
import { getRestaurantName } from "@/data/demoData";

type AlertSeverity = "Critical" | "High" | "Medium" | "Low";
type WorkflowAlertCategory = "Media" | "Content" | "Client input" | "Onboarding";

interface WorkflowAlert {
  item: WorkflowItem;
  category: WorkflowAlertCategory;
  severity: AlertSeverity;
  whyItMatters: string;
  href: string;
}

const categoryTone: Record<WorkflowAlertCategory, StatusBadgeTone> = {
  Media: "info",
  Content: "accent",
  "Client input": "warning",
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

function getWorkflowAlertCategory(item: WorkflowItem): WorkflowAlertCategory {
  if (item.stage === "needs_client_action" || item.stage === "needs_better_photo") return "Client input";
  if (item.type === "media") return "Media";
  if (item.type === "request") return "Onboarding";
  return "Content";
}

function getWorkflowAlertSeverity(item: WorkflowItem): AlertSeverity {
  if (item.priority === "urgent") return "Critical";
  if (item.priority === "high") return "High";
  if (item.priority === "low") return "Low";
  return "Medium";
}

function getAlertRoute(item: WorkflowItem): string {
  if (item.type === "media") return "/team/media-review";
  if (item.stage === "draft_ready" || item.stage === "team_review" || item.stage === "draft_needed") {
    return "/team/content-review";
  }
  return "/team/work-queue";
}

function getWhyItMatters(item: WorkflowItem): string {
  if (item.stage === "needs_better_photo") {
    return "Content is paused until the restaurant sends a clearer photo.";
  }
  if (item.stage === "needs_client_action") {
    return "The team needs a client detail before this can move forward.";
  }
  if (item.type === "media") {
    return "Fresh media keeps the content queue moving and improves visibility readiness.";
  }
  if (item.stage === "scheduled") {
    return "Approved work should stay queued for later; nothing goes live from this demo.";
  }
  return "This item needs a team decision so the next prepared action stays on track.";
}

function buildWorkflowAlerts(items: WorkflowItem[]): WorkflowAlert[] {
  return getTeamAlertWorkflowItems(items).map((item) => ({
    item,
    category: getWorkflowAlertCategory(item),
    severity: getWorkflowAlertSeverity(item),
    whyItMatters: getWhyItMatters(item),
    href: getAlertRoute(item),
  }));
}

export default function TeamAlertCenter() {
  const summary = getWorkflowSummaryCounts(demoClientTeamWorkflow);
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
        description="Workflow-derived alerts for media, content, onboarding, and client-input follow-up."
        testId="header-alert-center"
      />

      <DemoOnlyBanner
        message="Demo only — alerts are derived from shared workflow items. No monitoring, publishing, or client messaging is connected."
        testId="banner-alert-center"
      />

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Card className="bg-muted/20 border-border">
          <CardContent className="p-3">
            <p className="text-xl font-bold tabular-nums">{summary.teamReviewReady}</p>
            <p className="text-[11px] text-muted-foreground">Items needing review</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-border">
          <CardContent className="p-3">
            <p className="text-xl font-bold tabular-nums">{summary.waitingOnClient}</p>
            <p className="text-[11px] text-muted-foreground">Waiting on client input</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-border">
          <CardContent className="p-3">
            <p className="text-xl font-bold tabular-nums">{summary.readyToQueueOrHold}</p>
            <p className="text-[11px] text-muted-foreground">Ready to queue / hold</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-primary" />
            All alerts ({sorted.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sorted.map(({ item, category, severity, whyItMatters, href }) => (
            <div
              key={item.id}
              className={`rounded-md border border-border border-l-4 ${severityBorder[severity]} bg-muted/20 p-3`}
              data-testid={`alert-${item.id}`}
            >
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <StatusBadge tone={severityTone[severity]}>{severity}</StatusBadge>
                <StatusBadge tone={categoryTone[category]}>{category}</StatusBadge>
                <StatusBadge tone="info">{getTeamStatusLabel(item.stage)}</StatusBadge>
                <p className="text-sm font-medium">{item.title}</p>
                <span className="text-[10px] text-muted-foreground ml-auto">{item.dueLabel}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{whyItMatters}</p>
              <p className="text-[11px] text-primary/85 mt-1.5">
                Next: {getTeamSuggestedNextStep(item)}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                <span>Client: {getRestaurantName(item.clientId)}</span>
                <Link href={href}>
                  <span className="flex items-center gap-1 text-primary hover:underline cursor-pointer">
                    Open surface <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

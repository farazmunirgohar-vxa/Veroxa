import { ChevronRight, TrendingUp, Star, BarChart2, CalendarDays, CheckCircle2 } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { ClientReportsProgress } from "@/components/ClientExecutionReinforcement";
import { ClientVisibilityProgressCard } from "@/components/ClientVisibilityProgressCard";
import { generateClientMonthlyReport } from "@/domain/clientPortalJourney";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { useEffect, useState } from "react";
import {
  getClientWorkflowItems,
  subscribeToWorkflow,
} from "@/lib/workflow/workflowRepository";
import type { WorkflowItem } from "@/lib/workflow/workflowTypes";

const SHOWCASE_ID = "demo-a";

function useReportEligibleItems(clientId: string): WorkflowItem[] {
  const [items, setItems] = useState<WorkflowItem[]>(() =>
    getClientWorkflowItems(clientId),
  );
  useEffect(() => {
    const refresh = () => setItems(getClientWorkflowItems(clientId));
    refresh();
    return subscribeToWorkflow(refresh);
  }, [clientId]);
  return items.filter(
    (i) =>
      i.clientVisibleStatus === "Completed" ||
      i.clientVisibleStatus === "Included in report",
  );
}

const EXTRA_CARDS = [
  {
    id: "weekly",
    icon: CalendarDays,
    title: "Weekly update",
    status: "Available",
    statusClass: "bg-emerald-500/10 text-emerald-400",
    lines: [
      "Weekly progress is summarized in plain language.",
      "Client input needs are highlighted when needed.",
      "Local visibility progress is included safely.",
    ],
  },
  {
    id: "content",
    icon: Star,
    title: "Media and content",
    status: "In progress",
    statusClass: "bg-primary/10 text-primary",
    lines: [
      "Fresh media helps upcoming content.",
      "Prepared content is reviewed before anything goes live.",
      "More content needs appear clearly when helpful.",
    ],
  },
  {
    id: "consistency",
    icon: BarChart2,
    title: "Next focus",
    status: "Planned",
    statusClass: "bg-muted text-muted-foreground",
    lines: [
      "Local visibility improvement opportunities.",
      "Review response support.",
      "Business details confirmation when needed.",
    ],
  },
];

export default function ClientReports() {
  const { source, dataSourceMessage } = useClientPortalData();
  const monthlyReport = generateClientMonthlyReport(SHOWCASE_ID);
  const reportItems = useReportEligibleItems(SHOWCASE_ID);

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          data-testid="header-reports"
        >
          Reports
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Your performance reports — weekly updates, monthly summaries, and top content.
        </p>
        <DataSourceBadge source={source} message={dataSourceMessage} />
      </div>

      {/* Your progress at a glance — plain-language, no invented metrics. */}
      <div className="mb-4">
        <ClientReportsProgress clientId={SHOWCASE_ID} />
      </div>

      {/* Local visibility progress — client-safe Google/local visibility surface. */}
      <div className="mb-4">
        <ClientVisibilityProgressCard clientId={SHOWCASE_ID} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monthly report foundation — client-safe local journey data. */}
        <Card
          className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
          data-testid="monthly-report-preview"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">{monthlyReport.monthLabel} Report</CardTitle>
              </div>
              <Badge
                variant="outline"
                className="border-none text-xs bg-primary/10 text-primary"
              >
                Prepared by Veroxa
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {[
              monthlyReport.executiveSummary,
              monthlyReport.visibilityProgress.nextVisibilityAction,
              monthlyReport.mediaAndContentSummary[0],
              monthlyReport.reviewReputationSummary[0],
            ].map((line) => (
              <div key={line} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>{line}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-primary">
              View full report <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </CardContent>
        </Card>

        {/* Supplementary report cards */}
        {EXTRA_CARDS.map((card) => (
          <Card
            key={card.id}
            className="bg-card/60 border-border hover:border-primary/30 transition-colors"
            data-testid={`report-card-${card.id}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <card.icon className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">{card.title}</CardTitle>
                </div>
                <Badge variant="outline" className={`border-none text-xs ${card.statusClass}`}>
                  {card.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {card.lines.map((line) => (
                <div key={line} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>{line}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Work that's ready for your report — driven by the real workflow
          foundation. We show completed items honestly; performance metrics
          stay blank until account reporting is active (no invented numbers). */}
      {reportItems.length > 0 && (
        <Card
          className="bg-card border-emerald-500/20 mt-4"
          data-testid="card-report-ready-items"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Ready for your report ({reportItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reportItems.map((item) => (
              <div
                key={item.workflowItemId}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/20 px-3 py-2"
                data-testid={`report-item-${item.workflowItemId}`}
              >
                <p className="text-sm font-medium leading-snug">{item.title}</p>
                <Badge
                  variant="outline"
                  className="text-[9px] border-emerald-500/30 bg-emerald-500/10 text-emerald-300 flex-shrink-0"
                >
                  {item.clientVisibleStatus}
                </Badge>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground italic pt-1">
              Performance data will appear here once your account reporting is active.
            </p>
          </CardContent>
        </Card>
      )}

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Items marked ready reflect your account activity. Performance metrics will appear once reporting is active.
      </p>
    </PortalLayout>
  );
}

import { ChevronRight, TrendingUp, Star, BarChart2, CalendarDays } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { previewReportDraft } from "@/lib/ai/aiAgentPreviewEngine";
import { Brain } from "lucide-react";

const EXTRA_CARDS = [
  {
    id: "weekly",
    icon: CalendarDays,
    title: "Weekly Update — Week 3",
    status: "Available",
    statusClass: "bg-emerald-500/10 text-emerald-400",
    metrics: [
      { label: "Posts this week",     value: "3" },
      { label: "Estimated reach",     value: "9,400" },
      { label: "Engagement rate",     value: "4.2%" },
      { label: "Next week posts",     value: "3 planned" },
    ],
  },
  {
    id: "top-post",
    icon: Star,
    title: "Top Post — May 2026",
    status: "Demo data",
    statusClass: "bg-amber-500/10 text-amber-400",
    metrics: [
      { label: "Caption angle",       value: "Weekend Grill" },
      { label: "Platform",            value: "Instagram" },
      { label: "Estimated reach",     value: "14,200" },
      { label: "Engagement",          value: "312 interactions" },
    ],
  },
  {
    id: "consistency",
    icon: BarChart2,
    title: "Content Consistency",
    status: "On track",
    statusClass: "bg-emerald-500/10 text-emerald-400",
    metrics: [
      { label: "Posts last 30 days",  value: "11" },
      { label: "Target posts/month",  value: "12" },
      { label: "Posting consistency", value: "92%" },
      { label: "Platform coverage",   value: "IG + FB" },
    ],
  },
];

export default function ClientReports() {
  const { data, source, dataSourceMessage } = useClientPortalData();
  const report = data.monthlyReportPreview;

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

      {/* AI-assisted report draft status — drafts always reviewed by Veroxa team. */}
      {(() => {
        const draft = previewReportDraft({
          reportTitle: report.title,
          cadence: "monthly",
          hasPublishedPosts: false,
          hasMetrics: false,
        });
        const statusTone =
          draft.status === "ready"
            ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
            : "border-amber-500/40 text-amber-300 bg-amber-500/10";
        return (
          <Card
            className="bg-card border-primary/20 mb-4"
            data-testid="card-reports-ai-draft"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between gap-2 flex-wrap">
                <span className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  Report draft status
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className={`${statusTone} text-[10px]`}>
                    AI-assisted draft prepared
                  </Badge>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-300 bg-amber-500/10 text-[10px]">
                    Team review needed
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-[12px] text-foreground/85">{draft.draftSummary}</p>
              {draft.missingDataFlags.length > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  Performance metrics will connect after backend/reporting activation.
                </p>
              )}
              <p className="text-[10px] text-muted-foreground italic">
                Prepared with AI-assisted organization; final review by the Veroxa team.
              </p>
            </CardContent>
          </Card>
        );
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monthly report — live data from hook */}
        <Card
          className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
          data-testid="monthly-report-preview"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">{report.title}</CardTitle>
              </div>
              <Badge
                variant="outline"
                className={`border-none text-xs ${
                  report.status === "In Review"
                    ? "bg-amber-500/10 text-amber-400"
                    : report.status === "Drafting"
                    ? "bg-muted text-muted-foreground"
                    : "bg-emerald-500/10 text-emerald-400"
                }`}
              >
                {report.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between"><span>Posts published</span><span className="text-foreground font-medium">{report.postsPublished}</span></div>
            <div className="flex justify-between"><span>Total reach</span><span className="text-foreground font-medium">41,200</span></div>
            <div className="flex justify-between"><span>Google impressions</span><span className="text-foreground font-medium">12,580</span></div>
            <div className="flex justify-between"><span>New reviews</span><span className="text-foreground font-medium">6</span></div>
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
              {card.metrics.map((m) => (
                <div key={m.label} className="flex justify-between">
                  <span>{m.label}</span>
                  <span className="text-foreground font-medium">{m.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Demo only — all report figures are illustrative sample data.
      </p>
    </PortalLayout>
  );
}

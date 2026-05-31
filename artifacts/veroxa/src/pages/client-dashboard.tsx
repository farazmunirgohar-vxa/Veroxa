import {
  CalendarDays,
  ImageIcon,
  Layers,
  BarChart2,
  ArrowRight,
  Images,
  ClipboardList,
  Bell,
  FileText,
  CheckCircle2,
  Inbox,
} from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { ClientKeepMovingCard } from "@/components/ClientExecutionReinforcement";
import { ClientVisibilityProgressCard } from "@/components/ClientVisibilityProgressCard";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import {
  getClientProgressSummary,
  getFirstFiveClientPortalViewModels,
} from "@/domain/clientPortalJourney";
import {
  healthRepository,
  reportRepository,
  activityRepository,
} from "@/lib/repositories";
import {
  getClientContentHealthMessage,
  type ContentHealthStatus as MvpContentHealthStatus,
} from "@/domain/veroxa";
import { demoClientTeamWorkflow } from "@/data/workflows/clientTeamWorkflow";
import { WorkflowItemCard } from "@/components/workflows/WorkflowItemCard";
import {
  getClientActionNeededItems,
  getClientVisibleWorkflowItems,
} from "@/lib/workflows/workflowStatus";
import { ClientAccountSummary } from "@/components/client/ClientAccountSummary";
import { ClientPremiumReadinessCard } from "@/components/client/ClientPremiumReadinessCard";
import { ClientPortalEmptyState } from "@/components/client/ClientPortalEmptyState";
import { StatusBadge } from "@/components/common";
import { ClientOperationalStatusGrid } from "@/components/client/ClientOperationalSpine";
import {
  getClientContentWorkflow,
  getClientMediaStatus,
  getClientPlan,
  getClientPremiumReadiness,
  getClientReportWorkflow,
  getClientRiskStatus,
  getCurrentClientAccount,
} from "@/lib/operations";

/** Compute "June 2026 — Week 1" from the real current date. */
function getCurrentPeriodLabel(): string {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "long" });
  const year = now.getFullYear();
  const week = Math.ceil(now.getDate() / 7);
  return `${month} ${year} — Week ${week}`;
}

export default function ClientDashboard() {
  const { loading, data, source, dataSourceMessage } = useClientPortalData();
  const portalDataMode = useRealPortalDataMode();
  const canUseFixtureData =
    portalDataMode.allowDemoFixtures || portalDataMode.isLiveDataConnected;
  const journeySummary = canUseFixtureData
    ? getClientProgressSummary("demo-a")
    : null;
  const recentProgress = journeySummary?.recentProgress.slice(0, 4) ?? [];
  const firstFiveReadiness = canUseFixtureData
    ? getFirstFiveClientPortalViewModels().find(
        (item) => item.key === "growth_reels_ready",
      )
    : null;
  const reviewAccount = getCurrentClientAccount();
  const reviewPlan = getClientPlan(reviewAccount.id);
  const reviewMedia = getClientMediaStatus(reviewAccount.id);
  const reviewContent = getClientContentWorkflow(reviewAccount.id);
  const reviewReport = getClientReportWorkflow(reviewAccount.id);
  const reviewRisk = getClientRiskStatus(reviewAccount.id);
  const reviewPremium = getClientPremiumReadiness(reviewAccount.id);

  const demoSafeClientHref = portalDataMode.isPublicDemoRoute
    ? "/demo/client/dashboard"
    : null;
  const quickActions = [
    { label: "Upload media", href: demoSafeClientHref ?? "/client/media", icon: Images },
    { label: "Send request", href: demoSafeClientHref ?? "/client/requests", icon: ClipboardList },
    { label: "View updates", href: demoSafeClientHref ?? "/client/updates", icon: Bell },
    { label: "View reports", href: demoSafeClientHref ?? "/client/reports", icon: FileText },
  ];

  const summaryCards = [
    {
      label: "Upcoming posts",
      value: loading ? "—" : String(data.scheduledPosts.length),
      icon: CalendarDays,
    },
    {
      label: "Media assets",
      value: loading ? "—" : String(data.mediaAssetsCount),
      icon: ImageIcon,
    },
    {
      label: "Social platforms",
      value: loading ? "—" : String(data.platformsCount),
      icon: Layers,
    },
    {
      label: "Latest report",
      value: loading ? "—" : data.monthlyReportPreview.status,
      icon: BarChart2,
    },
  ];

  const healthSnapshot = canUseFixtureData
    ? healthRepository.getClientHealthSnapshot("demo-a")
    : null;
  const clientReports = canUseFixtureData
    ? reportRepository.getClientReports("demo-a")
    : { monthly: [] };
  const recentActivity = canUseFixtureData
    ? activityRepository.getClientVisibleActivity("demo-a")
    : [];
  const visibleWorkflowItems = canUseFixtureData
    ? getClientVisibleWorkflowItems(demoClientTeamWorkflow, "demo-a", 5)
    : [];
  const openClientActions = canUseFixtureData
    ? getClientActionNeededItems(demoClientTeamWorkflow, "demo-a")
    : [];

  const contentStatusForClient: MvpContentHealthStatus =
    healthSnapshot?.contentHealthStatus === "broken"
      ? "broken_pipeline"
      : (healthSnapshot?.contentHealthStatus ?? "healthy");

  const snapshotItems = [
    healthSnapshot
      ? getClientContentHealthMessage(contentStatusForClient)
      : "Veroxa is monitoring your content supply.",
    journeySummary?.visibilityProgress.nextVisibilityAction ??
      "Live account data is being prepared.",
    clientReports.monthly.length > 0
      ? `Your latest monthly report (${clientReports.monthly[0].monthKey}) is available in Reports.`
      : (journeySummary?.latestReport.summary ??
        "Reports will appear once your account setup is ready."),
    recentActivity.length > 0
      ? `Veroxa is working on your account — ${recentActivity.length} recent updates.`
      : "Veroxa is monitoring your content supply.",
  ];

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />

      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2
            className="text-3xl font-bold tracking-tight text-foreground"
            data-testid="header-welcome"
          >
            {canUseFixtureData ? (loading ? "Restaurant Portal" : data.businessName) : reviewAccount.businessName}
          </h2>
          <p className="text-muted-foreground mt-1">
            Welcome back. Here is a quick overview of your account.
          </p>
          <DataSourceBadge source={source} message={dataSourceMessage} />
        </div>
        <Badge
          variant="outline"
          className="px-3 py-1 bg-card text-card-foreground border-border font-medium self-start md:self-auto"
        >
          {getCurrentPeriodLabel()}
        </Badge>
      </div>

      {/* Account summary — what Veroxa handles for this restaurant. */}
      <ClientAccountSummary
        restaurantName={
          loading || !canUseFixtureData ? undefined : data.businessName
        }
      />

      {canUseFixtureData && (
        <Card
          className="bg-card/50 border-border/50"
          data-testid="card-client-readiness-snapshot"
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Launch readiness snapshot
                </p>
                <h3 className="text-base font-bold text-foreground mt-0.5">
                  {firstFiveReadiness?.packageLabel ?? "Growth"} ·{" "}
                  {firstFiveReadiness?.accountStatus ?? "In review"}
                </h3>
              </div>
              <StatusBadge tone="info">In review</StatusBadge>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Media supply
                </p>
                <p className="text-xs text-foreground/85 mt-1 leading-relaxed">
                  {firstFiveReadiness?.mediaSupplyStatus ??
                    "Media supply is in review."}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Updates
                </p>
                <p className="text-xs text-foreground/85 mt-1 leading-relaxed">
                  {firstFiveReadiness?.weeklyUpdateStatus ??
                    "Weekly update in review"}{" "}
                  ·{" "}
                  {firstFiveReadiness?.monthlyReportStatus ??
                    "Monthly report in review"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Next helpful action
                </p>
                <p className="text-xs text-foreground/85 mt-1 leading-relaxed">
                  {firstFiveReadiness?.nextHelpfulAction ??
                    "Veroxa will ask for anything needed next."}
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground/75 leading-relaxed">
              {firstFiveReadiness?.premiumReadinessLabel ??
                "Premium readiness is reviewed only after the foundation is stable."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick actions — the main things a client can do, one tap away. */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        data-testid="section-quick-actions"
      >
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card
              className="bg-card/50 border-border/50 hover:border-primary/40 hover:bg-card transition-colors cursor-pointer h-full"
              data-testid={`quick-action-${action.href.split("/").pop()}`}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  <action.icon className="w-4 h-4" />
                </span>
                <span className="text-sm font-medium text-foreground">
                  {action.label}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Upload reinforcement — keeps content supply visible to the client. */}
      {canUseFixtureData && <ClientKeepMovingCard clientId="demo-a" />}

      {/* Action needed from you */}
      {openClientActions.length > 0 && (
        <Card
          className="bg-amber-500/5 border-amber-500/30"
          data-testid="card-dashboard-action-needed"
        >
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground mb-1">
                Action needed from you ({openClientActions.length})
              </p>
              <p className="text-xs text-muted-foreground">
                {openClientActions[0].title}
                {openClientActions.length > 1
                  ? ` · +${openClientActions.length - 1} more`
                  : ""}
              </p>
            </div>
            <Link href={demoSafeClientHref ?? "/client/requests"}>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-500/40 hover:bg-amber-500/10 flex-shrink-0"
                data-testid="btn-dashboard-action-open-requests"
              >
                Open Requests
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {openClientActions.length === 0 && (
        <Card
          className="bg-emerald-500/5 border-emerald-500/20"
          data-testid="card-dashboard-nothing-needed"
        >
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-foreground mb-1">
              Nothing needed from you right now
            </p>
            <p className="text-xs text-muted-foreground">
              Veroxa is handling this week&apos;s work. We&apos;ll let you know
              here if we need a quick reply.
            </p>
          </CardContent>
        </Card>
      )}


      {!canUseFixtureData && (
        <ClientOperationalStatusGrid
          account={reviewAccount}
          plan={reviewPlan}
          media={reviewMedia}
          content={reviewContent}
          report={reviewReport}
          risk={reviewRisk}
          premium={reviewPremium}
        />
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <Card
            key={i}
            className="bg-card/50 border-border/50 shadow-sm"
            data-testid={`summary-card-${i}`}
          >
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  {card.label}
                </p>
                <card.icon className="w-4 h-4 text-muted-foreground/40" />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Local visibility progress — client-safe Google/local visibility surface. */}
      {canUseFixtureData ? (
        <ClientVisibilityProgressCard clientId="demo-a" />
      ) : (
        <ClientPortalEmptyState
          icon={<Inbox className="w-8 h-8" />}
          heading="Local visibility data is in review."
          body="Google Maps and local visibility progress will appear after live account data is prepared."
          testId="empty-state-visibility-progress"
        />
      )}

      {/* Premium readiness — light, client-safe concept (demo/local only). */}
      {canUseFixtureData && <ClientPremiumReadinessCard />}

      {/* What Veroxa is working on */}
      <div data-testid="section-veroxa-working-on">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          What Veroxa is working on
        </h3>
        {visibleWorkflowItems.length === 0 ? (
          <ClientPortalEmptyState
            icon={<Inbox className="w-8 h-8" />}
            heading="Nothing actively in progress this week."
            body="Veroxa will show current work items here as they move through your account."
            testId="empty-state-working-on"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleWorkflowItems.map((item) => (
              <WorkflowItemCard
                key={item.id}
                item={item}
                mode="client"
                className="bg-card/60"
              />
            ))}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground/70 mt-2">
          Nothing goes live without Veroxa team review.
        </p>
      </div>

      {/* Recent progress — finished and report-included work. */}
      {recentProgress.length > 0 && (
        <div data-testid="section-recent-progress">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recent progress
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentProgress.map((item) => (
              <Card
                key={item.id}
                className="bg-emerald-500/5 border-emerald-500/20"
                data-testid={`recent-progress-${item.id}`}
              >
                <CardContent className="p-3.5">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500/80 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {item.status} · {item.updatedLabel}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* This week at a glance */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          This week at a glance
        </h3>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5 space-y-3">
            {snapshotItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0 mt-1.5" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}

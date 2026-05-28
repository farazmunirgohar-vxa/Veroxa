import { CalendarDays, ImageIcon, Layers, BarChart2, Sparkles, ArrowRight, PlayCircle } from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import {
  demoClientTeamWorkflow,
} from "@/data/workflows/clientTeamWorkflow";
import { sortWorkflowItems } from "@/lib/workflows/workflowStatus";
import { WorkflowItemCard } from "@/components/workflows/WorkflowItemCard";
import {
  DemoImageCard,
  DemoSchedulePreview,
  DemoFlowTimeline,
  type DemoScheduleItem,
} from "@/components/demo/DemoVisuals";
import { getDemoImage } from "@/data/demo/demoImages";
import { EvidenceRecommendationCard } from "@/components/evidence/EvidenceRecommendationCard";
import { recommendNextPost } from "@/lib/evidence/evidenceSelectionEngine";
import { WeeklyStrategySnapshot } from "@/components/intelligence/WeeklyStrategySnapshot";
import {
  buildAdaptiveRecommendations,
  rankRecommendations,
} from "@/lib/intelligence/adaptiveRules";
import { demoClientDirection } from "@/data/direction/demoClientDirection";
import { demoUploadSubmissions } from "@/data/uploadKeys/demoUploadSubmissions";
import { getLocalDirectionRequests, subscribeToLocalDirectionRequests } from "@/lib/direction/localDirectionStore";
import { getLocalUploadSubmissions, subscribeToLocalUploadSubmissions } from "@/lib/uploadKeys/localUploadStore";
import { Compass } from "lucide-react";
import { useEffect, useState } from "react";
import { healthRepository, reportRepository, activityRepository, clientTeamWorkRepository } from "@/lib/repositories";

const veroxaWeekFlow = [
  { key: "upload",   label: "You upload",    caption: "Food photos from your phone" },
  { key: "ai",       label: "AI drafts",     caption: "Captions + best angles" },
  { key: "review",   label: "Team checks",   caption: "Human review before anything posts" },
  { key: "schedule", label: "It schedules",  caption: "Right time, right platform" },
  { key: "report",   label: "You get a report", caption: "Weekly + monthly results" },
];

const weekMedia = [
  {
    id: "wm-1",
    image: getDemoImage("food-grilled-platter")!,
    title: "Grilled platter — overhead",
    subtitle: "Approved for weekend feature",
    status: "Approved",
    tone: "good" as const,
  },
  {
    id: "wm-2",
    image: getDemoImage("food-bowl-hero")!,
    title: "Signature bowl — hero",
    subtitle: "Scheduled · Tuesday lunch",
    status: "Scheduled",
    tone: "ready" as const,
  },
  {
    id: "wm-3",
    image: getDemoImage("kitchen-chef-plate")!,
    title: "Chef plating — Reels clip",
    subtitle: "Pending Veroxa team review",
    status: "Pending review",
    tone: "warn" as const,
  },
];

const upcomingSchedule: DemoScheduleItem[] = [
  {
    id: "up-1",
    image: getDemoImage("food-grilled-platter")!,
    day: "Friday",
    time: "11:30 AM",
    platform: "Instagram",
    label: "Lunch Special",
  },
  {
    id: "up-2",
    image: getDemoImage("food-bowl-hero")!,
    day: "Saturday",
    time: "2:00 PM",
    platform: "Facebook",
    label: "Behind the Scenes",
  },
  {
    id: "up-3",
    image: getDemoImage("food-plated-dinner")!,
    day: "Sunday",
    time: "6:15 PM",
    platform: "Instagram",
    label: "Dinner Push",
  },
];

const clientEvidenceRec = recommendNextPost("demo-a");

function computeClientWeeklyRecs() {
  return rankRecommendations(
    buildAdaptiveRecommendations({
      clientId: "demo-a",
      direction: [
        ...getLocalDirectionRequests().filter((d) => d.clientId === "demo-a"),
        ...demoClientDirection.filter((d) => d.clientId === "demo-a"),
      ],
      uploads: [
        ...getLocalUploadSubmissions().filter((u) => u.restaurantId === "demo-a"),
        ...demoUploadSubmissions.filter((u) => u.restaurantId === "demo-a"),
      ],
      workflow: demoClientTeamWorkflow.filter((w) => w.clientId === "demo-a"),
    }),
  );
}

function useClientWeeklyRecs() {
  const [recs, setRecs] = useState(() => computeClientWeeklyRecs());
  useEffect(() => {
    const refresh = () => setRecs(computeClientWeeklyRecs());
    refresh();
    const u1 = subscribeToLocalDirectionRequests(refresh);
    const u2 = subscribeToLocalUploadSubmissions(refresh);
    return () => {
      u1();
      u2();
    };
  }, []);
  return recs;
}

export default function ClientDashboard() {
  const { loading, data, source, dataSourceMessage } = useClientPortalData();
  const clientWeeklyRecs = useClientWeeklyRecs();

  const summaryCards = [
    { label: "Upcoming posts",    value: loading ? "—" : String(data.scheduledPosts.length), icon: CalendarDays },
    { label: "Media assets",      value: loading ? "—" : String(data.mediaAssetsCount),       icon: ImageIcon   },
    { label: "Social platforms",  value: loading ? "—" : String(data.platformsCount),         icon: Layers      },
    { label: "Latest report",     value: loading ? "—" : data.monthlyReportPreview.status,    icon: BarChart2   },
  ];

  const healthSnapshot = healthRepository.getClientHealthSnapshot("demo-a");
  const clientReports = reportRepository.getClientReports("demo-a");
  const recentActivity = activityRepository.getClientVisibleActivity("demo-a");
  const openClientActions = clientTeamWorkRepository.getClientOpenActions("demo-a");

  const snapshotItems = [
    healthSnapshot
      ? `You have ${healthSnapshot.unusedUsableMediaCount} approved media items ready — roughly ${healthSnapshot.weeksOfContentLeft} weeks of content at your current cadence.`
      : "Your upcoming content is scheduled and ready for review.",
    "Google visibility data is being tracked for this month.",
    clientReports.monthly.length > 0
      ? `Your latest monthly report (${clientReports.monthly[0].monthKey}) is available in Reports.`
      : "Your latest monthly report is available in Reports.",
    recentActivity.length > 0
      ? `Veroxa is working on your account — ${recentActivity.length} recent updates.`
      : "Veroxa is monitoring your content supply.",
  ];

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">

      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-welcome">
            {loading ? "Demo Grill House" : data.businessName}
          </h2>
          <p className="text-muted-foreground mt-1">Welcome back. Here is a quick overview of your account.</p>
          <DataSourceBadge source={source} message={dataSourceMessage} />
        </div>
        <Badge variant="outline" className="px-3 py-1 bg-card text-card-foreground border-border font-medium self-start md:self-auto">
          May 2026 — Week 3
        </Badge>
      </div>

      {/* Action needed from you — quick callout linking to Requests. */}
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
            <Link href="/demo/client/requests">
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

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <Card key={i} className="bg-card/50 border-border/50 shadow-sm" data-testid={`summary-card-${i}`}>
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                <card.icon className="w-4 h-4 text-muted-foreground/40" />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Direction Center CTA + Weekly Strategy Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" data-testid="section-direction-and-strategy">
        <Card className="bg-card/50 border-border/50 lg:col-span-1" data-testid="card-direction-cta">
          <CardContent className="p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              <p className="text-sm font-semibold">What should Veroxa focus on this week?</p>
            </div>
            <p className="text-xs text-muted-foreground">
              You guide priorities. Veroxa handles the strategy, review, schedule, and
              execution.
            </p>
            <Link
              href="/demo/client/direction"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline self-start"
              data-testid="link-open-direction-center"
            >
              Open Direction Center <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
          <WeeklyStrategySnapshot recommendations={clientWeeklyRecs} audience="client" />
        </div>
      </div>

      {/* This week's media — demo visual strip */}
      <div data-testid="section-week-media">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            This week&apos;s media
          </h3>
          <Badge
            variant="outline"
            className="border-border text-muted-foreground"
          >
            Demo only
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {weekMedia.map((item) => (
            <DemoImageCard
              key={item.id}
              image={item.image}
              title={item.title}
              subtitle={item.subtitle}
              status={item.status}
              tone={item.tone}
              testId={`week-media-${item.id}`}
            />
          ))}
        </div>
      </div>

      {/* Upcoming content — schedule preview with thumbnails */}
      <div data-testid="section-upcoming-content">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Upcoming content
          </h3>
          <Link
            href="/demo/client/ai-draft-preview"
            className="flex items-center gap-1 text-xs text-amber-300 hover:underline"
            data-testid="link-ai-draft-preview"
          >
            <Sparkles className="h-3 w-3" />
            See AI Draft Preview
          </Link>
        </div>
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              From one photo to three scheduled posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DemoSchedulePreview items={upcomingSchedule} testId="dashboard-schedule" />
            <p className="mt-3 text-[11px] text-muted-foreground">
              Demo only — simulated AI. Nothing posted, nothing uploaded.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* What Veroxa is working on — first-client workflow visibility */}
      <div data-testid="section-veroxa-working-on">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          What Veroxa is working on
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortWorkflowItems(
            demoClientTeamWorkflow.filter((i) => i.clientId === "demo-a"),
          )
            .slice(0, 5)
            .map((item) => (
              <WorkflowItemCard key={item.id} item={item} mode="client" />
            ))}
        </div>
        <p className="text-[11px] text-muted-foreground/70 mt-2">
          Demo only — illustrative workflow snapshot. Nothing is published without your approval.
        </p>
      </div>

      {/* Trust strip — what Veroxa needs / what happens after upload */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
        data-testid="dashboard-trust-strip"
      >
        <Card className="bg-card/50 border-border/50" data-testid="dashboard-trust-needs">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              What Veroxa needs from you
            </p>
            <p className="text-[12px] text-muted-foreground">
              A few phone photos each week, plus a quick note in the Direction
              Center about what you want to push. Veroxa takes it from there.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50" data-testid="dashboard-trust-after">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              What happens after upload
            </p>
            <p className="text-[12px] text-muted-foreground">
              Photos are reviewed, captions are drafted, and posts are
              scheduled at the right times. You see everything in your portal
              and approve before anything goes live.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How Veroxa is working this week */}
      <div data-testid="section-veroxa-week-flow">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          How Veroxa is working this week
        </h3>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 space-y-4">
            <DemoFlowTimeline steps={veroxaWeekFlow} testId="client-dashboard-flow" />
            <p className="text-[11px] text-muted-foreground">
              Demo only — illustrative flow. Nothing posts without your Veroxa team&apos;s approval.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CTA card — AI Draft Preview */}
      <Card className="bg-amber-500/5 border-amber-500/30" data-testid="card-ai-draft-cta">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <p className="text-sm font-semibold text-foreground">See your photo become 3 posts</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Upload one food photo and watch Veroxa generate captions, angles, and a schedule.
            </p>
          </div>
          <Link href="/demo/client/ai-draft-preview">
            <Button
              size="sm"
              className="bg-amber-500 text-amber-950 hover:bg-amber-400 flex-shrink-0"
              data-testid="btn-ai-draft-cta"
            >
              Try AI Draft Preview
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Smart Recommendation — evidence engine */}
      <div data-testid="section-smart-recommendation">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Smart recommendation
        </h3>
        <EvidenceRecommendationCard
          recommendation={clientEvidenceRec}
          variant="client"
          ctaHref="/demo/client/ai-draft-preview"
          ctaLabel="Preview Drafts"
          testId="client-evidence-recommendation"
        />
      </div>

      {/* This week at a glance */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">This week at a glance</h3>
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

      {/* Guided Demo CTA — shown only in demo/placeholder mode */}
      <Card className="bg-primary/5 border-primary/20" data-testid="card-guided-demo-cta">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PlayCircle className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">New to Veroxa?</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Start the guided demo to see how upload, drafts, scheduling, reports, and smart recommendations work together.
            </p>
          </div>
          <Link href="/guided-demo">
            <Button
              size="sm"
              variant="outline"
              className="border-primary/40 hover:bg-primary/10 flex-shrink-0"
              data-testid="btn-guided-demo-cta"
            >
              Open Guided Demo
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardContent>
      </Card>

    </PortalLayout>
  );
}

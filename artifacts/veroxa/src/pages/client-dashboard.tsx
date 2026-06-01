import {
  ArrowRight,
  Bell,
  CheckCircle2,
  FileText,
  Images,
  MessageSquare,
  UploadCloud,
} from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { ClientPortalEmptyState } from "@/components/client/ClientPortalEmptyState";
import { ClientOperationalStatusGrid } from "@/components/client/ClientOperationalSpine";
import {
  getClientMediaStatus,
  getCurrentClientAccount,
  getClientContentWorkflow,
  getClientReportWorkflow,
  getClientRiskStatus,
  getClientPremiumReadiness,
  getClientPlan,
} from "@/lib/operations";
import { clientTeamWorkRepository } from "@/lib/repositories";
import { generateClientWeeklyUpdate } from "@/domain/clientPortalJourney";
import { normalizeClientMediaDisplayStatus } from "@/lib/clientMediaLifecycle";

function getCurrentPeriodLabel(): string {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "long" });
  const year = now.getFullYear();
  const week = Math.ceil(now.getDate() / 7);
  return `${month} ${year} — Week ${week}`;
}

export default function ClientDashboard() {
  const { loading, data } = useClientPortalData();
  const portalDataMode = useRealPortalDataMode();
  const canUseFixtureData =
    portalDataMode.allowDemoFixtures || portalDataMode.isLiveDataConnected;
  const reviewAccount = getCurrentClientAccount();
  const reviewMedia = getClientMediaStatus(reviewAccount.id);
  const reviewContent = getClientContentWorkflow(reviewAccount.id);
  const reviewReport = getClientReportWorkflow(reviewAccount.id);
  const reviewRisk = getClientRiskStatus(reviewAccount.id);
  const reviewPremium = getClientPremiumReadiness(reviewAccount.id);
  const reviewPlan = getClientPlan(reviewAccount.id);
  const demoSafeClientHref = portalDataMode.isPublicDemoRoute
    ? "/demo/client/dashboard"
    : null;

  const source = portalDataMode.isLiveDataConnected ? "live" : "demo";
  const dataSourceMessage = portalDataMode.isLiveDataConnected
    ? "Live data connected"
    : "Demo data";

  const mediaItems = canUseFixtureData
    ? clientTeamWorkRepository
        .getClientVisibleSubmissions("demo-a")
        .filter((item) => item.submissionType === "media")
    : [];
  const latestMedia = mediaItems[0];
  const latestMediaStatus = latestMedia
    ? normalizeClientMediaDisplayStatus(
        latestMedia.status === "blocked"
          ? "Needs better media"
          : latestMedia.status,
      )
    : "Uploaded";
  const openClientActions = canUseFixtureData
    ? clientTeamWorkRepository.getClientActionRequiredItems("demo-a")
    : [];
  const weeklyUpdate = generateClientWeeklyUpdate("demo-a");

  const quickCards = [
    {
      label: "Upload media",
      description: "Send fresh photos or videos.",
      href: demoSafeClientHref ?? "/client/media",
      icon: UploadCloud,
      primary: true,
    },
    {
      label: "Send request",
      description: "Give Veroxa direction.",
      href: demoSafeClientHref ?? "/client/requests",
      icon: MessageSquare,
      primary: false,
    },
    {
      label: "View updates",
      description: "See recent progress.",
      href: demoSafeClientHref ?? "/client/updates",
      icon: Bell,
      primary: false,
    },
    {
      label: "View reports",
      description: "Open weekly/monthly reports.",
      href: demoSafeClientHref ?? "/client/reports",
      icon: FileText,
      primary: false,
    },
  ];

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2
            className="text-3xl font-bold tracking-tight text-foreground"
            data-testid="header-welcome"
          >
            {canUseFixtureData
              ? loading
                ? "Restaurant Portal"
                : data.businessName
              : reviewAccount.businessName}
          </h2>
          <p className="text-muted-foreground mt-1">
            Your simple home base for media, updates, requests, and reports.
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

      <div
        className="grid gap-3 md:grid-cols-4"
        data-testid="section-dashboard-quick-actions"
      >
        {quickCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card
              className={`h-full cursor-pointer transition-colors ${card.primary ? "border-primary/40 bg-primary/10 hover:bg-primary/15" : "bg-card/60 border-border hover:border-primary/30"}`}
              data-testid={`quick-card-${card.label.toLowerCase().replaceAll(" ", "-")}`}
            >
              <CardContent className="p-4">
                <card.icon className="w-5 h-5 text-primary mb-3" />
                <p className="text-sm font-semibold text-foreground">
                  {card.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          className="bg-card border-border"
          data-testid="card-dashboard-upload-needed"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Images className="w-4 h-4 text-primary" /> Do you need to upload
              anything?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {reviewMedia.needsMoreMedia
                ? reviewMedia.nextMediaRequest
                : "Fresh food or atmosphere photos are always helpful when available."}
            </p>
            <Link href={demoSafeClientHref ?? "/client/media"}>
              <Button size="sm" data-testid="btn-dashboard-upload-media">
                Upload media <ArrowRight className="ml-2 w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card
          className="bg-card border-border"
          data-testid="card-dashboard-latest-media"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Latest media
              status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestMedia ? (
              <>
                <p className="text-sm font-medium text-foreground">
                  {latestMedia.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {latestMedia.clientVisibleNote}
                </p>
                <Badge
                  variant="outline"
                  className="mt-3 border-primary/30 bg-primary/10 text-primary text-[10px]"
                >
                  {latestMediaStatus}
                </Badge>
              </>
            ) : (
              <ClientPortalEmptyState
                icon={<Images className="w-8 h-8" />}
                heading="No media status yet."
                body="Upload media and Veroxa will show progress here."
                testId="empty-dashboard-media-status"
              />
            )}
          </CardContent>
        </Card>

        <Card
          className="bg-card border-border"
          data-testid="card-dashboard-request-status"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Requests
              needing response
            </CardTitle>
          </CardHeader>
          <CardContent>
            {openClientActions.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  {openClientActions[0].title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {openClientActions[0].clientVisibleNote}
                </p>
                <Link href={demoSafeClientHref ?? "/client/requests"}>
                  <Button size="sm" variant="outline">
                    Open Requests
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-3">
                <p className="text-sm font-medium">Nothing needed right now</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Veroxa will ask if a quick answer would help.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card
        className="bg-card border-primary/20"
        data-testid="card-dashboard-latest-update-report"
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Latest update/report
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-border bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Latest update
            </p>
            <p className="text-sm text-foreground mt-1">
              {weeklyUpdate.clientSafeSummary}
            </p>
          </div>
          <div className="rounded-md border border-border bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Latest report
            </p>
            <p className="text-sm text-foreground mt-1">
              Reports are organized into Weekly Reports and Monthly Reports.
            </p>
          </div>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ClipboardList,
  FileText,
  Images,
  Send,
  UploadCloud,
} from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { demoClientTeamWorkflow } from "@/data/workflows/clientTeamWorkflow";
import { getClientActionNeededItems } from "@/lib/workflows/workflowStatus";
import {
  getClientMediaStatus,
  getCurrentClientAccount,
} from "@/lib/operations";

export default function ClientDashboard() {
  const { loading, data, source, dataSourceMessage } = useClientPortalData();
  const portalDataMode = useRealPortalDataMode();
  const canUseFixtureData =
    portalDataMode.allowDemoFixtures || portalDataMode.isLiveDataConnected;

  const reviewAccount = getCurrentClientAccount();
  const reviewMedia = getClientMediaStatus(reviewAccount.id);

  // Public demo is a single self-contained preview: keep every link inside it.
  const demoSafeClientHref = portalDataMode.isPublicDemoRoute
    ? "/demo/client/dashboard"
    : null;
  const uploadHref = demoSafeClientHref ?? "/client/media";

  const businessName = canUseFixtureData
    ? loading
      ? "Restaurant Portal"
      : data.businessName
    : reviewAccount.businessName;

  // Honest media snapshot — derived only from existing fixture/review data.
  const mediaStats = canUseFixtureData
    ? [
        {
          label: "Uploaded Media",
          value: loading ? "—" : String(data.mediaAssetsCount),
          icon: Images,
        },
        {
          label: "Ready Media",
          value: loading ? "—" : String(data.scheduledPosts.length),
          icon: CheckCircle2,
        },
        {
          label: "Posted Media",
          value: loading ? "—" : String(data.monthlyReportPreview.postsPublished),
          icon: Send,
        },
      ]
    : [
        {
          label: "Uploaded Media",
          value: String(reviewMedia.usableMediaCount + reviewMedia.pendingReviewCount),
          icon: Images,
        },
        {
          label: "Ready Media",
          value: String(reviewMedia.usableMediaCount),
          icon: CheckCircle2,
        },
        { label: "Posted Media", value: "0", icon: Send },
      ];

  const openClientActions = canUseFixtureData
    ? getClientActionNeededItems(demoClientTeamWorkflow, "demo-a")
    : [];
  const reviewNeedsAttention = !canUseFixtureData && reviewMedia.needsMoreMedia;

  const quickLinks = [
    { label: "Media", href: demoSafeClientHref ?? "/client/media", icon: Images },
    { label: "Updates", href: demoSafeClientHref ?? "/client/updates", icon: Bell },
    { label: "Requests", href: demoSafeClientHref ?? "/client/requests", icon: ClipboardList },
    { label: "Reports", href: demoSafeClientHref ?? "/client/reports", icon: FileText },
  ];

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />

      {/* Welcome */}
      <div>
        <h2
          className="text-3xl font-bold tracking-tight text-foreground"
          data-testid="header-welcome"
        >
          {businessName}
        </h2>
        <p className="text-muted-foreground mt-1">
          Welcome back. Here is where your media stands today.
        </p>
        <DataSourceBadge source={source} message={dataSourceMessage} />
      </div>

      {/* Main action — Upload Media */}
      <Card
        className="bg-primary/5 border-primary/30"
        data-testid="card-upload-media"
      >
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-foreground">Add new media</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Send fresh photos or videos and Veroxa prepares them for posting.
            </p>
          </div>
          <Link href={uploadHref} className="flex-shrink-0">
            <Button
              size="lg"
              className="h-12 px-7 font-semibold shadow-[0_0_24px_rgba(99,102,241,0.3)] hover:shadow-[0_0_32px_rgba(99,102,241,0.5)] transition-shadow w-full sm:w-auto"
              data-testid="btn-upload-media"
            >
              <UploadCloud className="mr-2 h-5 w-5" />
              Upload Media
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Media status snapshot */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        data-testid="section-media-snapshot"
      >
        {mediaStats.map((stat) => (
          <Card
            key={stat.label}
            className="bg-card/50 border-border/50 shadow-sm"
            data-testid={`media-stat-${stat.label.split(" ")[0].toLowerCase()}`}
          >
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <stat.icon className="w-4 h-4 text-muted-foreground/40" />
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Needs attention — only when something actually needs the client */}
      {openClientActions.length > 0 && (
        <Card
          className="bg-amber-500/5 border-amber-500/30"
          data-testid="card-dashboard-action-needed"
        >
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground mb-1">
                Needs your attention ({openClientActions.length})
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

      {reviewNeedsAttention && (
        <Card
          className="bg-amber-500/5 border-amber-500/30"
          data-testid="card-dashboard-action-needed-review"
        >
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground mb-1">
                Needs your attention
              </p>
              <p className="text-xs text-muted-foreground">
                {reviewMedia.nextMediaRequest}
              </p>
            </div>
            <Link href={uploadHref}>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-500/40 hover:bg-amber-500/10 flex-shrink-0"
                data-testid="btn-dashboard-action-upload"
              >
                Upload Media
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div data-testid="section-quick-links">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Quick links
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.label} href={link.href}>
              <Card
                className="bg-card/50 border-border/50 hover:border-primary/40 hover:bg-card transition-colors cursor-pointer h-full"
                data-testid={`quick-link-${link.label.toLowerCase()}`}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <link.icon className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {link.label}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
}

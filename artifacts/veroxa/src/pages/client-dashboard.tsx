import {
  ArrowRight,
  Bell,
  ClipboardList,
  FileText,
  Images,
} from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { demoClientTeamWorkflow } from "@/data/workflows/clientTeamWorkflow";
import { getClientActionNeededItems } from "@/lib/workflows/workflowStatus";
import {
  getClientMediaStatus,
  getCurrentClientAccount,
} from "@/lib/operations";

const SHOWCASE_ID = "demo-a";

type MediaSnapshot = {
  uploaded: number | string;
  ready: number | string;
  posted: number | string;
};

function getDemoMediaSnapshot(): MediaSnapshot {
  const clientItems = demoClientTeamWorkflow.filter(
    (item) => item.clientId === SHOWCASE_ID,
  );
  return {
    uploaded: clientItems.filter((item) => item.type === "media").length,
    ready: clientItems.filter((item) =>
      ["media_accepted", "draft_ready", "team_review", "scheduled"].includes(
        item.stage,
      ),
    ).length,
    posted: clientItems.filter((item) => item.stage === "marked_complete")
      .length,
  };
}

export default function ClientDashboard() {
  const { loading, data } = useClientPortalData();
  const portalDataMode = useRealPortalDataMode();
  const canUseFixtureData =
    portalDataMode.allowDemoFixtures || portalDataMode.isLiveDataConnected;
  const reviewAccount = getCurrentClientAccount();
  const reviewMedia = getClientMediaStatus(reviewAccount.id);

  const businessName = canUseFixtureData
    ? loading
      ? "Restaurant Portal"
      : data.businessName
    : reviewAccount.businessName;

  const mediaSnapshot: MediaSnapshot = canUseFixtureData
    ? getDemoMediaSnapshot()
    : {
        uploaded: reviewMedia.pendingReviewCount,
        ready: reviewMedia.usableMediaCount,
        posted: "—",
      };

  const demoSafeClientHref = portalDataMode.isPublicDemoRoute
    ? "/demo/client/dashboard"
    : null;

  const openClientActions = canUseFixtureData
    ? getClientActionNeededItems(demoClientTeamWorkflow, SHOWCASE_ID)
    : [];
  const realMediaActionNeeded = !canUseFixtureData && reviewMedia.needsMoreMedia;
  const hasClientAttention = openClientActions.length > 0 || realMediaActionNeeded;
  const attentionMessage = realMediaActionNeeded
    ? "Veroxa needs a few clear photos or videos when you are ready."
    : openClientActions.length > 1
      ? `${openClientActions.length} items need your reply.`
      : "1 item needs your reply.";

  const quickLinks = [
    {
      label: "Media",
      href: demoSafeClientHref ?? "/client/media",
      icon: Images,
      description: "Upload and track media.",
    },
    {
      label: "Updates",
      href: demoSafeClientHref ?? "/client/updates",
      icon: Bell,
      description: "See recent progress.",
    },
    {
      label: "Requests",
      href: demoSafeClientHref ?? "/client/requests",
      icon: ClipboardList,
      description: "Send direction to Veroxa.",
    },
    {
      label: "Reports",
      href: demoSafeClientHref ?? "/client/reports",
      icon: FileText,
      description: "View weekly and monthly reports.",
    },
  ];

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      {/* Simple client dashboard — front desk only. Detailed work lives in Media, Updates, Requests, and Reports. */}
      <Card className="bg-card/60 border-border/50" data-testid="card-client-home-base">
        <CardContent className="p-6 md:p-7">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Client Dashboard
              </p>
              <h2
                className="text-3xl font-bold tracking-tight text-foreground"
                data-testid="header-welcome"
              >
                {businessName}
              </h2>
              <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                Veroxa is working on your online presence. Upload media when you
                have it, send direction when needed, and check updates or reports
                when you want a quick status.
              </p>
            </div>
            <Link href={demoSafeClientHref ?? "/client/media"}>
              <Button
                size="lg"
                className="w-full lg:w-auto font-semibold"
                data-testid="btn-dashboard-upload-media"
              >
                Upload Media <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3" data-testid="section-media-snapshot">
        {[
          ["Uploaded Media", mediaSnapshot.uploaded, "Received by Veroxa"],
          ["Ready Media", mediaSnapshot.ready, "Ready or being prepared"],
          ["Posted Media", mediaSnapshot.posted, "Live posts"],
        ].map(([label, value, helper]) => (
          <Card key={label} className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasClientAttention && (
        <Card
          className="bg-amber-500/5 border-amber-500/30"
          data-testid="card-dashboard-action-needed"
        >
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Needs your attention
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {attentionMessage}
              </p>
            </div>
            <Link href={demoSafeClientHref ?? "/client/requests"}>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-500/40 hover:bg-amber-500/10"
                data-testid="btn-dashboard-action-open-requests"
              >
                Open Requests <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="section-quick-links">
        {quickLinks.map((item) => (
          <Link key={item.label} href={item.href}>
            <Card className="h-full bg-card/40 border-border/50 hover:border-primary/40 hover:bg-card transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">
                    {item.label}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-1">
                    {item.description}
                  </span>
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PortalLayout>
  );
}

import {
  Bell,
  CheckCircle2,
  FileText,
  Images,
  MessageSquare,
  UploadCloud,
} from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { RealPortalReviewNotice } from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { useActiveClientPortalContext } from "@/lib/clientPortalContext";
import { clientTeamWorkRepository } from "@/lib/repositories";
import { normalizeClientMediaDisplayStatus } from "@/lib/clientMediaLifecycle";


function getCurrentPeriodLabel(): string {
  const now = new Date();
  return now.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export default function ClientDashboard() {
  const { loading, data } = useClientPortalData();
  const mode = useRealPortalDataMode();
  const { activeClientId } = useActiveClientPortalContext();
  const canUseFixtureData = Boolean(activeClientId) && (mode.allowDemoFixtures || mode.isLiveDataConnected);
  const mediaHref = mode.isPublicDemoRoute ? "/demo/client/dashboard" : "/client/media";

  const mediaItems = canUseFixtureData
    ? clientTeamWorkRepository
        .getClientVisibleSubmissions(activeClientId!)
        .filter((item) => item.submissionType === "media")
    : [];
  const actionItems = canUseFixtureData
    ? clientTeamWorkRepository.getClientActionRequiredItems(activeClientId!)
    : [];

  const mediaCounts = mediaItems.reduce(
    (counts, item) => {
      const status = normalizeClientMediaDisplayStatus(
        item.status === "blocked" ? "Needs better media" : item.status,
      );
      if (status === "Posted" || status === "Already used") counts.posted += 1;
      else if (status === "Ready" || status === "Scheduled") counts.ready += 1;
      else counts.uploaded += 1;
      return counts;
    },
    { uploaded: 0, ready: 0, posted: 0 },
  );

  const quickLinks = [
    { label: "Media", href: mediaHref, icon: Images },
    { label: "Updates", href: mode.isPublicDemoRoute ? "/demo/client/dashboard" : "/client/updates", icon: Bell },
    { label: "Requests", href: mode.isPublicDemoRoute ? "/demo/client/dashboard" : "/client/requests", icon: MessageSquare },
    { label: "Reports", href: mode.isPublicDemoRoute ? "/demo/client/dashboard" : "/client/reports", icon: FileText },
  ];

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />

      <section className="rounded-2xl border border-border bg-card/80 p-5 md:p-7 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/10 text-primary">
              {getCurrentPeriodLabel()}
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight" data-testid="header-welcome">
              {canUseFixtureData ? (loading ? "Restaurant Portal" : data.businessName) : "Your restaurant"}
            </h2>
            <p className="mt-2 text-sm md:text-base text-muted-foreground">
              A simple front desk for sending Veroxa media, checking status, replying when needed,
              and finding your reports.
            </p>
          </div>
          <Link href={mediaHref}>
            <Button size="lg" className="w-full md:w-auto" data-testid="btn-dashboard-upload-media">
              <UploadCloud className="mr-2 h-4 w-4" /> Upload Media
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3" data-testid="section-media-snapshot">
        <SnapshotCard label="Uploaded Media" value={mediaCounts.uploaded} />
        <SnapshotCard label="Ready Media" value={mediaCounts.ready} />
        <SnapshotCard label="Posted Media" value={mediaCounts.posted} />
      </section>

      {actionItems.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/10" data-testid="strip-dashboard-needs-attention">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
              <div>
                <p className="text-sm font-semibold text-foreground">Needs your input</p>
                <p className="text-sm text-muted-foreground">{actionItems[0].clientVisibleNote}</p>
              </div>
            </div>
            <Link href={mode.isPublicDemoRoute ? "/demo/client/dashboard" : "/client/requests"}>
              <Button size="sm" variant="outline">Open Requests</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {actionItems.length === 0 && (
        <Card className="border-emerald-500/20 bg-emerald-500/5" data-testid="strip-dashboard-all-clear">
          <CardContent className="flex items-start gap-3 p-4">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-foreground">Nothing needed right now</p>
              <p className="text-sm text-muted-foreground">Veroxa will ask here if a quick answer would help.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="section-dashboard-quick-links">
        {quickLinks.map((item) => (
          <Link key={item.label} href={item.href}>
            <Card className="h-full cursor-pointer border-border bg-card/60 transition-colors hover:border-primary/30 hover:bg-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg border border-border bg-muted/20 p-2 text-primary">
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold">{item.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </PortalLayout>
  );
}

function SnapshotCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="border-border bg-card/70" data-testid={`snapshot-${label.toLowerCase().replaceAll(" ", "-")}`}>
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

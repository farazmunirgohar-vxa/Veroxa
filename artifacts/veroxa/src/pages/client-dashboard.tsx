import {
  CalendarDays,
  CheckCircle2,
  FileText,
  ListChecks,
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
import { getClientPortalHref } from "@/lib/clientPortalRoutes";

function getCurrentPeriodLabel(): string {
  const now = new Date();
  return now.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export default function ClientDashboard() {
  const { loading, data } = useClientPortalData();
  const mode = useRealPortalDataMode();
  const { activeClientId } = useActiveClientPortalContext();
  const canUseFixtureData =
    Boolean(activeClientId) &&
    (mode.allowDemoFixtures || mode.isLiveDataConnected);
  const mediaHref = getClientPortalHref("media", mode.isPublicDemoRoute);
  const requestsHref = getClientPortalHref("requests", mode.isPublicDemoRoute);
  const updatesHref = getClientPortalHref("updates", mode.isPublicDemoRoute);
  const reportsHref = getClientPortalHref("reports", mode.isPublicDemoRoute);

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

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <RealPortalReviewNotice />

      <section className="rounded-2xl border border-border bg-card/80 p-5 md:p-7 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="mb-3 border-primary/30 bg-primary/10 text-primary"
            >
              {getCurrentPeriodLabel()}
            </Badge>
            <h2
              className="text-3xl font-bold tracking-tight"
              data-testid="header-welcome"
            >
              {canUseFixtureData
                ? loading
                  ? "Restaurant Portal"
                  : data.businessName
                : "Your restaurant"}
            </h2>
            <p className="mt-2 text-sm md:text-base text-muted-foreground">
              A simple front desk for sending Veroxa media, checking status,
              replying when needed, and finding your reports.
            </p>
          </div>
          <Link href={mediaHref}>
            <Button
              size="lg"
              className="w-full md:w-auto"
              data-testid="btn-dashboard-upload-media"
            >
              <UploadCloud className="mr-2 h-4 w-4" /> Upload Media
            </Button>
          </Link>
        </div>
      </section>

      <section
        className="grid gap-3 md:grid-cols-3"
        data-testid="section-media-snapshot"
      >
        <SnapshotCard
          label="Uploaded Media"
          value={mediaCounts.uploaded}
          helper="Sent for Veroxa review"
        />
        <SnapshotCard
          label="Ready Media"
          value={mediaCounts.ready}
          helper="Ready or scheduled"
        />
        <SnapshotCard
          label="Posted Media"
          value={mediaCounts.posted}
          helper="Used in Veroxa work"
        />
      </section>

      <section
        className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]"
        data-testid="section-dashboard-next-steps"
      >
        <Card className="border-border bg-card/80">
          <CardContent className="space-y-4 p-4 md:p-5">
            <div className="flex items-start gap-3">
              <ListChecks className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-base font-semibold text-foreground">
                  What to do next
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep Veroxa supplied with usable food, restaurant, and event
                  media. Raw phone photos and short videos are fine.
                </p>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <ActionStep
                title="Upload media"
                body="Send photos or videos when you have something new."
                href={mediaHref}
                cta="Upload media"
              />
              <ActionStep
                title={
                  actionItems.length > 0 ? "Needs your input" : "Send request"
                }
                body={
                  actionItems.length > 0
                    ? "A quick answer may help Veroxa keep work moving."
                    : "Share a preference, special, menu note, or timing request."
                }
                href={requestsHref}
                cta={actionItems.length > 0 ? "Open requests" : "Send request"}
              />
            </div>
            <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              Posting depends on usable client-provided media and stays at a
              maximum of 1 post per day. Reels/TikTok support depends on
              available video.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80">
          <CardContent className="space-y-3 p-4 md:p-5">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-base font-semibold text-foreground">
                  Updates and reports
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Weekly updates explain what Veroxa worked on and what is next.
                  Monthly reports summarize completed work when enough
                  trustworthy information is available.
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Link href={updatesHref}>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  data-testid="btn-dashboard-view-updates"
                >
                  View updates
                </Button>
              </Link>
              <Link href={reportsHref}>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  data-testid="btn-dashboard-view-reports"
                >
                  <FileText className="mr-2 h-4 w-4" /> View reports
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {actionItems.length > 0 && (
        <Card
          className="border-amber-500/30 bg-amber-500/10"
          data-testid="strip-dashboard-needs-attention"
        >
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Needs your input
                </p>
                <p className="text-sm text-muted-foreground">
                  {actionItems[0].clientVisibleNote}
                </p>
              </div>
            </div>
            <Link href={requestsHref}>
              <Button size="sm" variant="outline">
                Open Requests
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {actionItems.length === 0 && (
        <Card
          className="border-emerald-500/20 bg-emerald-500/5"
          data-testid="strip-dashboard-all-clear"
        >
          <CardContent className="flex items-start gap-3 p-4">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Nothing needed right now
              </p>
              <p className="text-sm text-muted-foreground">
                Veroxa will ask here if a quick answer would help.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card
        className="border-border bg-card/80"
        data-testid="section-onboarding-preview"
      >
        <CardContent className="space-y-4 p-4 md:p-5">
          <div>
            <p className="text-base font-semibold text-foreground">
              Upcoming onboarding checklist
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Before live service, Veroxa will confirm these business details
              with you. Business-truth items such as hours, menu, prices,
              offers, and claims need your confirmation before Veroxa uses them.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Restaurant name and cuisine type",
              "Best sellers and customer types",
              "Busy days and preferred posting times",
              "Menu link or menu photos",
              "Google, Instagram, Facebook, and TikTok links",
              "Media habits, offers, specials, and holiday content",
            ].map((item) => (
              <div
                key={item}
                className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-foreground/90"
              >
                {item}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

function ActionStep({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
      <Link href={href}>
        <Button
          size="sm"
          variant="outline"
          className="mt-3 w-full justify-start"
        >
          {cta}
        </Button>
      </Link>
    </div>
  );
}

function SnapshotCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <Card
      className="border-border bg-card/70"
      data-testid={`snapshot-${label.toLowerCase().replaceAll(" ", "-")}`}
    >
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

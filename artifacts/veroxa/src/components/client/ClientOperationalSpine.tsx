import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/common";
import type {
  ClientAccount,
  ClientMediaStatus,
  ClientRiskStatus,
  ContentWorkflowStatus,
  PremiumReadinessStatus,
  ReportWorkflowStatus,
} from "@/domain/operations";
import type { VeroxaPlan } from "@/data/pricing/veroxaPricing";

export function ClientOperationalStatusGrid({
  account,
  plan,
  media,
  content,
  report,
  risk,
  premium,
}: {
  account: ClientAccount;
  plan: VeroxaPlan;
  media: ClientMediaStatus;
  content: ContentWorkflowStatus;
  report: ReportWorkflowStatus;
  risk: ClientRiskStatus;
  premium: PremiumReadinessStatus;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="client-review-mode-operational-grid">
      <Card className="bg-card/60 border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Account status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p className="text-foreground font-semibold">{account.businessName}</p>
          <p>
            Current package: <span className="text-foreground">{plan.label} {plan.displayPrice}/mo</span>
          </p>
          <p>{plan.postingVolumeSummary}</p>
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
            Review mode · not live connected
          </Badge>
        </CardContent>
      </Card>

      <Card className="bg-card/60 border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Media readiness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{media.clientVisibleMessage}</p>
          <p>Usable media: <span className="text-foreground">{media.usableMediaCount}</span></p>
          <p>Waiting for review: <span className="text-foreground">{media.pendingReviewCount}</span></p>
          <StatusBadge tone={media.needsMoreMedia ? "warning" : "success"}>
            {media.needsMoreMedia ? "More content may be needed" : "Media ready for review"}
          </StatusBadge>
        </CardContent>
      </Card>

      <Card className="bg-card/60 border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Content workflow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{content.clientVisibleMessage}</p>
          <p>Drafts ready: <span className="text-foreground">{content.draftsReady}</span></p>
          <p>Queued items: <span className="text-foreground">{content.scheduledItems}</span></p>
          {content.blockedReason && <p>{content.blockedReason}</p>}
        </CardContent>
      </Card>

      <Card className="bg-card/60 border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{report.clientVisibleMessage}</p>
          <p>Weekly update: <span className="text-foreground">{report.weeklyUpdateStatus.replaceAll("_", " ")}</span></p>
          <p>Monthly report: <span className="text-foreground">{report.monthlyReportStatus.replaceAll("_", " ")}</span></p>
        </CardContent>
      </Card>

      <Card className="bg-card/60 border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Next helpful step</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{risk.clientVisibleMessage}</p>
          <p className="text-foreground">{media.needsMoreMedia ? media.nextMediaRequest : risk.nextHumanAction}</p>
        </CardContent>
      </Card>

      <Card className="bg-card/60 border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Premium readiness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{premium.reason}</p>
          <p>{premium.nextStep}</p>
          <p>Ad spend stays separate and requires approval before anything starts.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ClientOperationalCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="bg-card/60 border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2">{children}</CardContent>
    </Card>
  );
}

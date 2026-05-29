import { ArrowRight, ClipboardCheck, SearchCheck } from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, StatusBadge } from "@/components/common";
import type { StatusBadgeTone } from "@/components/common";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { getTeamVisibilityAuditSummaries } from "@/lib/visibilityAudit";
import type { VisibilityAuditSeverity } from "@/domain/visibilityAudit";

const severityTone: Record<VisibilityAuditSeverity, StatusBadgeTone> = {
  high: "warning",
  medium: "info",
  low: "neutral",
};

const severityLabel: Record<VisibilityAuditSeverity, string> = {
  high: "Ready for review",
  medium: "Suggested next step",
  low: "Watch",
};

export default function TeamVisibilityAudit() {
  const results = getTeamVisibilityAuditSummaries();
  const totalFindings = results.reduce((sum, result) => sum + result.findings.length, 0);
  const preparedActionCount = results.reduce(
    (sum, result) => sum + result.preparedActionCount,
    0,
  );

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <PageHeader
        title="Visibility Audit"
        description="A calm team review of visibility issues and prepared next steps."
        testId="header-team-visibility-audit"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Restaurants reviewed</p>
            <p className="text-2xl font-bold mt-1">{results.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Visibility issues</p>
            <p className="text-2xl font-bold mt-1">{totalFindings}</p>
          </CardContent>
        </Card>
        <Link href="/team/approval-queue">
          <Card className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-emerald-400">
                <ClipboardCheck className="w-5 h-5" />
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
              </div>
              <p className="text-2xl font-bold mt-1">{preparedActionCount}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Prepared actions</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="space-y-4" data-testid="visibility-audit-results">
        {results.map((result) => (
          <Card key={result.input.id} className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-start justify-between gap-2 flex-wrap">
                <span className="flex items-center gap-2">
                  <SearchCheck className="w-4 h-4 text-primary" />
                  {result.input.restaurantName}
                </span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  {result.input.city}, {result.input.state} · {result.input.observedAtLabel}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.findings.map((finding) => (
                <div
                  key={finding.id}
                  className="rounded-md border border-border bg-muted/20 p-3"
                  data-testid={`visibility-finding-${finding.id}`}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{finding.title}</p>
                    <StatusBadge tone={severityTone[finding.severity]}>
                      {severityLabel[finding.severity]}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-foreground/80 mt-1.5">{finding.issue}</p>
                  <p className="text-[12px] text-primary/85 mt-1.5">
                    <span className="text-muted-foreground">Suggested next step:</span>{" "}
                    {finding.suggestedNextStep}
                  </p>
                  {finding.needsClientConfirmation && (
                    <p className="text-[11px] text-amber-300/90 mt-1">
                      Needs confirmation before approval.
                    </p>
                  )}
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground/60 pt-1">
                Prepared actions still go through the Approval Queue before anything is sent or changed.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}

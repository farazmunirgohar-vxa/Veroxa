import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Handshake,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, StatusBadge } from "@/components/common";
import type { StatusBadgeTone } from "@/components/common";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import {
  firstClientBenchmarkScenarios,
  getBlockingChecks,
  getFirstClientLaunchGate,
  getFirstClientReadinessChecks,
  getReadinessAreaLabel,
  getReadinessStatusLabel,
  getReadinessSummary,
  getWarningChecks,
} from "@/domain/firstClientReadiness";
import type { ReadinessStatus } from "@/domain/firstClientReadiness";
import { VEROXA_PLANS } from "@/data/pricing/veroxaPricing";
import { evaluateVeroxaProfitValidation } from "@/domain/profitValidation";

import { TeamSaasStatePanel } from "@/components/team/TeamSaasStatePanel";
const statusTone: Record<ReadinessStatus, StatusBadgeTone> = {
  passing: "success",
  warning: "warning",
  failing: "danger",
  blocked: "danger",
  caution: "caution",
  ready_for_review: "info",
  ready: "success",
};

const intentionallyManual = [
  "Final review before any public/customer-visible action.",
  "Publishing to Google, Facebook, Instagram, TikTok, or website surfaces.",
  "Client confirmation for hours, menu, prices, offers, and sensitive claims.",
  "Ad readiness decisions, client approval, and any agreed ad budget.",
  "Report interpretation until verified account data is connected.",
] as const;

function CheckList({
  title,
  checks,
  emptyLabel,
}: {
  title: string;
  checks: ReturnType<typeof getFirstClientReadinessChecks>;
  emptyLabel: string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <CircleAlert className="w-4 h-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {checks.length > 0 ? (
          <div className="space-y-3">
            {checks.map((check) => (
              <div
                key={check.key}
                className="rounded-lg border border-border bg-muted/20 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{check.label}</p>
                  <StatusBadge
                    tone={
                      check.status === "passing"
                        ? "success"
                        : statusTone[check.status]
                    }
                  >
                    {getReadinessStatusLabel(check.status)}
                  </StatusBadge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {check.recommendedAction}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function TeamFirstClientReadiness() {
  const checks = getFirstClientReadinessChecks();
  const summary = getReadinessSummary(checks);
  const launchGate = getFirstClientLaunchGate(checks);
  const blockingChecks = getBlockingChecks(checks);
  const warningChecks = getWarningChecks(checks);
  const profitValidation = evaluateVeroxaProfitValidation({
    daysSinceStart: 60,
    monthlyFee: VEROXA_PLANS.starter.priceMonthly,
    trackingConfidence: "unknown",
  });

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <TeamSaasStatePanel compact={false} />
      <PageHeader
        title="First-client readiness"
        description="A benchmark review surface for the first 1–5 restaurant clients. It does not mean production auth, storage uploads, or live account data are fully connected."
        testId="header-first-client-readiness"
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] mb-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Readiness summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-3xl font-bold tabular-nums">
                  {summary.completionPercentage}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.passingChecks} of {summary.totalChecks} benchmark
                  checks OK
                </p>
              </div>
              <StatusBadge tone={statusTone[summary.overallStatus]}>
                {getReadinessStatusLabel(summary.overallStatus)}
              </StatusBadge>
            </div>
            <Progress value={summary.completionPercentage} className="h-2" />
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xl font-semibold tabular-nums">
                  {summary.blockingChecks}
                </p>
                <p className="text-[11px] text-muted-foreground">Blocking</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xl font-semibold tabular-nums">
                  {summary.warningChecks}
                </p>
                <p className="text-[11px] text-muted-foreground">Warnings</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xl font-semibold tabular-nums">
                  {summary.passingChecks}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Benchmark OK
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Recommended next action
              </p>
              <p className="mt-1 text-sm">{summary.recommendedNextAction}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-primary" />
              Launch gate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusBadge tone={launchGate.isReady ? "success" : "danger"}>
              {launchGate.isReady
                ? "Benchmark ready for Faraz review"
                : "Needs setup"}
            </StatusBadge>
            <p className="text-sm text-muted-foreground">
              {launchGate.message}
            </p>
            <div className="grid gap-2 text-xs text-muted-foreground">
              <p>
                Benchmark gate checks: {launchGate.requiredCheckKeys.length}.
                Current blockers: {launchGate.blockers.length}.
              </p>
              <p>
                Ready for demo walkthrough:{" "}
                {launchGate.readyForDemoWalkthrough ? "Yes" : "No"}
              </p>
              <p>
                Ready for unpaid feedback conversations:{" "}
                {launchGate.readyForFeedbackConversations ? "Yes" : "No"}
              </p>
              <p>
                Ready for first paid client later:{" "}
                {launchGate.readyForFirstPaidClient
                  ? "Yes"
                  : "No — future SaaS foundation required"}
              </p>
              <p>
                Blocked live integrations:{" "}
                {launchGate.blockedLiveIntegrations.join(" · ")}
              </p>
              <p className="text-primary/80">
                Next required build: {launchGate.nextRequiredBuild}
              </p>
            </div>
            <Link
              href="/team/dashboard"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Back to team dashboard <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card
        className="bg-card border-amber-500/30 mb-6"
        data-testid="card-first-client-profit-validation"
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-300" />
            Internal profit validation readiness
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            First-client readiness now includes the internal proof path: 2–3
            months for service delivery plus cost justification, 6–9 months for
            profit progress, and 12 months for online presence to become a
            meaningful order channel. This stays internal only.
          </p>
          <div className="grid gap-2 sm:grid-cols-3 text-xs">
            <div className="rounded-md border border-border bg-muted/20 p-3">
              <p className="text-muted-foreground">Phase</p>
              <p className="font-semibold capitalize">
                {profitValidation.phase.replaceAll("_", " ")}
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/20 p-3">
              <p className="text-muted-foreground">Break-even progress</p>
              <p className="font-semibold tabular-nums">
                {profitValidation.requiredOrdersPerDay}/day
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/20 p-3">
              <p className="text-muted-foreground">Starter proof standard</p>
              <p className="font-semibold tabular-nums">
                {profitValidation.starterMinimumTarget}/day
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {profitValidation.nextAction}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <CheckList
          title="Blocking checks"
          checks={blockingChecks}
          emptyLabel="No blocking checks are currently open."
        />
        <CheckList
          title="Warnings and review reminders"
          checks={warningChecks}
          emptyLabel="No warnings are currently open."
        />
      </div>

      <Card className="bg-card border-border mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Readiness areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {summary.areaSummaries.map((area) => (
              <div
                key={area.area}
                className="rounded-lg border border-border bg-muted/20 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {getReadinessAreaLabel(area.area)}
                  </p>
                  <StatusBadge tone={statusTone[area.status]}>
                    {getReadinessStatusLabel(area.status)}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {area.passingChecks}/{area.totalChecks} benchmark OK ·{" "}
                  {area.blockingChecks} blocking · {area.warningChecks} warning
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Handshake className="w-4 h-4 text-primary" />
            First 1–5 benchmark scenarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-2">
            {firstClientBenchmarkScenarios.map((scenario) => (
              <div
                key={scenario.key}
                className="rounded-lg border border-border bg-muted/20 p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{scenario.label}</p>
                  <StatusBadge tone="info">
                    {scenario.packageFit.replace("_", " ")}
                  </StatusBadge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Client needs
                    </p>
                    <ul className="mt-1 space-y-1 text-xs text-muted-foreground list-disc pl-4">
                      {scenario.expectedClientPortalNeeds.map((need) => (
                        <li key={need}>{need}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Team needs
                    </p>
                    <ul className="mt-1 space-y-1 text-xs text-muted-foreground list-disc pl-4">
                      {scenario.expectedTeamNeeds.map((need) => (
                        <li key={need}>{need}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {scenario.premiumReadinessNote}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Intentionally still manual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
            {intentionallyManual.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

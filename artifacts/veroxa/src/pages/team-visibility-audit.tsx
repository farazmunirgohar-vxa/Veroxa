import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ScanSearch,
  ArrowRight,
  ClipboardCheck,
  CheckCircle2,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import {
  RealPortalReviewNotice,
  SafePortalEmptyCard,
} from "@/components/RealPortalSafeStates";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { PageHeader, StatusBadge } from "@/components/common";
import type { StatusBadgeTone } from "@/components/common";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { TeamReviewModeRouteSummary } from "@/components/team/TeamOperationalSpine";
import { getAllVisibilityAudits } from "@/lib/visibilityAudit";
import {
  VISIBILITY_AUDIT_CATEGORY_LABELS,
  VISIBILITY_AUDIT_SEVERITY_LABELS,
  type VisibilityAuditSeverity,
} from "@/domain/visibilityAudit";
import {
  getClientConfirmationWorkflow,
  scoreCustomerOpportunity,
} from "@/domain/ruleBasedAutomation";

/**
 * /team/visibility-audit — Visibility Audit (team-only, login required).
 *
 * Shows what Veroxa found across each restaurant's Google profile, reviews,
 * website, local search, social, menu, and catering — and how many prepared
 * actions are waiting in the Approval Queue. Nothing changes publicly here; findings only turn into prepared actions for review. See
 * docs/VISIBILITY_AUDIT_ENGINE.md.
 */

const severityTone: Record<VisibilityAuditSeverity, StatusBadgeTone> = {
  urgent: "danger",
  high: "warning",
  medium: "caution",
  low: "neutral",
};

function scoreTone(score: number): StatusBadgeTone {
  if (score >= 80) return "success";
  if (score >= 60) return "caution";
  return "warning";
}

export default function TeamVisibilityAudit() {
  const portalDataMode = useRealPortalDataMode();
  const canUseFixtureData =
    portalDataMode.allowDemoFixtures || portalDataMode.isLiveDataConnected;

  const audits = useMemo(() => getAllVisibilityAudits(), []);
  const [selectedId, setSelectedId] = useState(audits[0]?.input.clientId ?? "");

  const selected =
    audits.find((a) => a.input.clientId === selectedId) ?? audits[0];
  const opportunityScore = selected
    ? scoreCustomerOpportunity({
        visibilityIssues: selected.result.findings.length,
        pendingApprovals: selected.result.preparedActionCount,
        bestSellerVisible: selected.result.findings.every(
          (finding) => finding.category !== "menu_visibility",
        ),
      })
    : null;

  if (!canUseFixtureData) {
    return (
      <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
        <RealPortalReviewNotice />
        <SafePortalEmptyCard
          title="Visibility Audit in review"
          body="Live Google Maps visibility audits are not connected yet. Findings will appear here after real account data is prepared."
          testId="empty-team-visibility-audit"
        />
        <TeamReviewModeRouteSummary title="Visibility audit review-mode summary" />
      </PortalLayout>
    );
  }

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <PageHeader
        title="Visibility Audit"
        description="Visibility issues found across each restaurant — and the prepared actions ready for review."
        testId="header-visibility-audit"
      />

      <DemoOnlyBanner
        message="This audit is rule-based and uses sample inputs. Nothing changes publicly — visibility issues become prepared actions for you to review in the Approval Queue."
        testId="banner-visibility-audit"
      />

      {/* Restaurant selector */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
        data-testid="audit-restaurant-selector"
      >
        {audits.map(({ input, result }) => {
          const isActive = input.clientId === selected?.input.clientId;
          return (
            <button
              key={input.clientId}
              type="button"
              onClick={() => setSelectedId(input.clientId)}
              data-testid={`audit-select-${input.clientId}`}
              className={`text-left rounded-md border p-3 transition-colors ${
                isActive
                  ? "border-primary/50 bg-primary/5"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <p className="text-sm font-semibold truncate">
                {result.restaurantName}
              </p>
              <div className="mt-1.5 flex items-center justify-between">
                <StatusBadge tone={scoreTone(result.overallScore)}>
                  {result.overallScore}/100
                </StatusBadge>
                <span className="text-[11px] text-muted-foreground">
                  {result.preparedActionCount} prepared
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <>
          {/* Selected audit summary */}
          <Card
            className="bg-card border-border mb-4"
            data-testid="audit-summary"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {selected.result.restaurantName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selected.result.headline}
                  </p>
                </div>
                <StatusBadge tone={scoreTone(selected.result.overallScore)}>
                  Visibility {selected.result.overallScore}/100
                </StatusBadge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{selected.result.findings.length} visibility issues</span>
                <span>·</span>
                <span>
                  {selected.result.preparedActionCount} prepared actions
                </span>
                <span>·</span>
                <span>As of {selected.result.generatedAtLabel}</span>
              </div>
            </CardContent>
          </Card>

          {opportunityScore && (
            <Card
              className="bg-card border-primary/20 mb-4"
              data-testid="visibility-customer-opportunity"
            >
              <CardContent className="p-4 text-xs text-muted-foreground">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-foreground/85">
                    Customer opportunity signal · {opportunityScore.status}
                  </p>
                  <StatusBadge tone={scoreTone(opportunityScore.score)}>
                    Internal {opportunityScore.score}/100
                  </StatusBadge>
                </div>
                <p className="mt-2">
                  Main opportunity: {opportunityScore.mainOpportunity}
                </p>
                <p>Main blocker: {opportunityScore.mainBlocker}</p>
                <p className="text-primary/80">
                  Suggested next step: {opportunityScore.suggestedNextAction}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Findings */}
          {selected.result.findings.length === 0 ? (
            <Card
              className="bg-card border-border"
              data-testid="audit-no-findings"
            >
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Visibility looks strong here — nothing needs attention right
                  now.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3" data-testid="audit-findings">
              {selected.result.findings.map((finding) => (
                <Card
                  key={finding.id}
                  className="bg-card border-border"
                  data-testid={`audit-finding-${finding.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm leading-snug">
                          {finding.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {VISIBILITY_AUDIT_CATEGORY_LABELS[finding.category]}
                        </p>
                      </div>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        <StatusBadge tone={severityTone[finding.severity]}>
                          {VISIBILITY_AUDIT_SEVERITY_LABELS[finding.severity]}
                        </StatusBadge>
                        {finding.actionable && (
                          <StatusBadge tone="info">Prepared</StatusBadge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 leading-snug">
                      {finding.detail}
                    </p>
                    <p className="text-[12px] text-primary/85 mt-2">
                      <span className="text-muted-foreground">
                        Suggested next step:
                      </span>{" "}
                      {finding.recommendation.label}
                    </p>
                    {getClientConfirmationWorkflow(
                      `${finding.title} ${finding.detail} ${finding.recommendation.preparedText ?? ""}`,
                    ).length > 0 && (
                      <p className="text-[11px] text-amber-300/90 mt-1">
                        Client confirmation workflow: confirmation needed before
                        public use; safe fallback is to hold or use general
                        visibility wording.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Link to the Approval Queue */}
          {selected.result.preparedActionCount > 0 && (
            <Card
              className="bg-card border-border mt-6"
              data-testid="audit-queue-link"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                    Prepared actions are ready for review
                  </span>
                  <Link href="/team/approval-queue">
                    <span className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer font-normal">
                      Open Approval Queue <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-muted-foreground">
                  {selected.result.preparedActionCount} action
                  {selected.result.preparedActionCount === 1 ? "" : "s"}{" "}
                  prepared for {selected.result.restaurantName}. Nothing changes
                  publicly unless it is reviewed and approved.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <p className="text-[11px] text-muted-foreground/70 mt-6 px-0.5 flex items-center gap-1.5">
        <ScanSearch className="w-3.5 h-3.5" />
        Audit results are rule-based on sample inputs. Full checks can be added
        later.
      </p>
    </PortalLayout>
  );
}

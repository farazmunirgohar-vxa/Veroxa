import { useState } from "react";
import { Brain, Users, ShieldAlert, Crown, Sparkles } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import {
  PageHeader, MetricTile, StatusBadge, SectionCard,
} from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { EvidenceRecommendationCard } from "@/components/evidence/EvidenceRecommendationCard";
import { EvidenceScoreCard } from "@/components/evidence/EvidenceScoreCard";
import { EvidenceMemoryTimeline } from "@/components/evidence/EvidenceMemoryTimeline";
import {
  getEvidenceProfile,
  recommendClientAction,
  recommendOperatorAction,
  getEvidenceTimeline,
  scoreMediaForNextPost,
  type EvidenceUrgency,
} from "@/lib/evidence/evidenceSelectionEngine";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEMO_CLIENTS = [
  { id: "demo-a", label: "Demo Grill House" },
  { id: "demo-b",    label: "Demo Taco Bar" },
  { id: "demo-c", label: "Demo Mediterranean Grill" },
  { id: "demo-d",   label: "Demo Cafe" },
] as const;

const URGENCY_TONE: Record<EvidenceUrgency, "danger" | "warning" | "info" | "success"> = {
  Critical: "danger",
  High:     "warning",
  Medium:   "info",
  Low:      "success",
};

const RISK_TONE: Record<string, "danger" | "warning" | "info" | "success"> = {
  Critical: "danger",
  High:     "warning",
  Medium:   "info",
  Low:      "success",
  None:     "success",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OperatorEvidenceEngine() {
  const [selectedClientId, setSelectedClientId] = useState<string>("demo-a");

  const profile       = getEvidenceProfile(selectedClientId);
  const timeline      = getEvidenceTimeline(selectedClientId);
  const mediaScores   = scoreMediaForNextPost(selectedClientId);
  const clientAction  = recommendClientAction(selectedClientId);
  const operatorAction = recommendOperatorAction(selectedClientId);

  const { context, bestMedia, topPosts, recommendation } = profile;
  const topEngagement = topPosts[0]?.engagementRate ?? 0;
  const mediaQuality  = bestMedia?.qualityScore ?? 0;

  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <PageHeader
        title="Evidence Engine"
        description="Simulated decision engine — recommendations are computed deterministically from demo fixture data. No real AI, no API, no database."
        testId="header-evidence-engine"
      />
      <DemoOnlyBanner
        message="Demo only — simulated rule engine. All recommendations are computed from fixture data only. No AI API connected. No real posting or scheduling."
        testId="banner-evidence-engine"
      />

      {/* Client selector */}
      <div className="flex flex-wrap gap-2 mb-5" data-testid="client-selector">
        {DEMO_CLIENTS.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedClientId(c.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium border transition-colors ${
              selectedClientId === c.id
                ? "bg-primary/15 border-primary/50 text-foreground"
                : "bg-muted/20 border-border text-muted-foreground hover:bg-muted/40"
            }`}
            data-testid={`client-tab-${c.id}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* KPI overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <MetricTile
          icon={Brain}
          label="Engine confidence"
          value={`${recommendation.confidenceScore}%`}
          accent={recommendation.confidenceScore >= 85 ? "text-emerald-300" : "text-amber-300"}
          testId="tile-evidence-confidence"
        />
        <MetricTile
          icon={Sparkles}
          label="Best media score"
          value={`${mediaQuality}/100`}
          accent="text-sky-300"
          hint={bestMedia ? bestMedia.mediaType : "No media"}
          testId="tile-evidence-media"
        />
        <MetricTile
          icon={ShieldAlert}
          label="Content runway"
          value={`${context.contentRunwayDays}d`}
          accent={context.contentRunwayDays <= 4 ? "text-rose-300" : context.contentRunwayDays <= 7 ? "text-amber-300" : "text-emerald-300"}
          hint={`${context.recentRisk} risk`}
          testId="tile-evidence-runway"
        />
        <MetricTile
          icon={Users}
          label="Client risk"
          value={context.recentRisk}
          accent={context.recentRisk === "Critical" ? "text-rose-300" : context.recentRisk === "High" ? "text-amber-300" : "text-emerald-300"}
          hint={`${context.scheduledPostsCount} posts scheduled`}
          testId="tile-evidence-risk"
        />
      </div>

      {/* Main recommendation + Score breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <EvidenceRecommendationCard
          recommendation={recommendation}
          variant="operator"
          testId="evidence-recommendation-main"
        />

        <SectionCard title="Score breakdown" icon={Brain} iconClass="text-violet-400">
          <EvidenceScoreCard
            score={recommendation.confidenceScore}
            runwayDays={context.contentRunwayDays}
            mediaQuality={mediaQuality}
            topEngagement={topEngagement}
            testId="evidence-score-breakdown"
          />
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium mb-2">
              Current goal
            </p>
            <p className="text-sm text-foreground font-medium">{context.currentGoal}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {context.platformStrengths.join(" · ")} · {context.unusedMediaCount} unused media items
            </p>
          </div>
        </SectionCard>
      </div>

      {/* Evidence timeline + Media scoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <SectionCard title="Evidence memory" icon={Sparkles} iconClass="text-amber-400">
          <p className="text-[11px] text-muted-foreground mb-3">
            Recent events that shaped this recommendation — posts, media uploads, and runway signals.
          </p>
          <EvidenceMemoryTimeline events={timeline} testId="evidence-timeline" />
        </SectionCard>

        <SectionCard title="Media scoring" icon={Sparkles} iconClass="text-sky-400">
          <p className="text-[11px] text-muted-foreground mb-3">
            All media ranked by composite quality score (base quality + freshness + lighting + clarity − risk penalty).
          </p>
          <ul className="space-y-2">
            {mediaScores.map(({ signal, score }, i) => (
              <li
                key={signal.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/20 px-3 py-2"
                data-testid={`media-score-row-${i}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{signal.mediaTitle}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {signal.mediaType} · {signal.lighting} lighting · {signal.foodClarity}
                  </p>
                  {signal.riskFlag && (
                    <p className="text-[11px] text-rose-400 mt-0.5">{signal.riskFlag}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {signal.uploadedToday && (
                    <Badge
                      variant="outline"
                      className="border-sky-500/40 bg-sky-500/10 text-sky-300 text-[10px]"
                    >
                      Today
                    </Badge>
                  )}
                  <span
                    className={`text-sm font-bold tabular-nums min-w-[2.5rem] text-right ${
                      score >= 80 ? "text-emerald-300" : score >= 60 ? "text-amber-300" : "text-rose-300"
                    }`}
                  >
                    {score}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {/* Top historical posts */}
      {topPosts.length > 0 && (
        <SectionCard title="Top historical posts" icon={Sparkles} iconClass="text-emerald-400">
          <p className="text-[11px] text-muted-foreground mb-3">
            Highest-performing content from this client — lessons these applied to the current recommendation.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topPosts.map((p) => (
              <div
                key={p.id}
                className="rounded-md border border-border bg-muted/20 p-3 space-y-1.5"
                data-testid={`top-post-${p.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-snug truncate">{p.postTitle}</p>
                  <Badge
                    variant="outline"
                    className={
                      p.resultLabel === "Top performer"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[10px] flex-shrink-0"
                        : p.resultLabel === "Above average"
                        ? "border-sky-500/40 bg-sky-500/10 text-sky-300 text-[10px] flex-shrink-0"
                        : "border-border text-muted-foreground text-[10px] flex-shrink-0"
                    }
                  >
                    {p.resultLabel}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {p.platform} · {p.postedAtLabel}
                </p>
                <p className="text-[11px] text-emerald-400 font-medium tabular-nums">
                  {p.engagementRate}% engagement · {p.reach.toLocaleString()} reach
                </p>
                <p className="text-[11px] text-muted-foreground/80 italic leading-snug">
                  {p.lessonLearned}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Role-based next actions */}
      <SectionCard title="Recommended actions by role" icon={Users} iconClass="text-violet-400">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Client action */}
          <div className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <p className="text-[11px] font-medium text-sky-400 uppercase tracking-wide">Client</p>
            </div>
            <p className="text-xs font-semibold leading-snug">{clientAction.action}</p>
            <p className="text-[11px] text-muted-foreground">{clientAction.reason}</p>
            <StatusBadge tone={URGENCY_TONE[clientAction.urgency]}>{clientAction.urgency}</StatusBadge>
          </div>

          {/* Team action */}
          <div className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <p className="text-[11px] font-medium text-emerald-400 uppercase tracking-wide">Team</p>
            </div>
            <p className="text-xs font-semibold leading-snug">
              Review &quot;{bestMedia?.mediaTitle ?? "best available media"}&quot; and send to caption draft queue.
            </p>
            <p className="text-[11px] text-muted-foreground">
              Quality score {mediaQuality}/100 — {(bestMedia?.lighting ?? "N/A").toLowerCase()} lighting, minimal editing risk.
            </p>
            <StatusBadge tone="info">Medium</StatusBadge>
          </div>

          {/* Operator action */}
          <div className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-[11px] font-medium text-amber-400 uppercase tracking-wide">Operator</p>
            </div>
            <p className="text-xs font-semibold leading-snug">{operatorAction.action}</p>
            <p className="text-[11px] text-muted-foreground">{operatorAction.reason}</p>
            <StatusBadge tone={URGENCY_TONE[operatorAction.urgency]}>{operatorAction.urgency}</StatusBadge>
          </div>

          {/* Owner insight */}
          <div className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-fuchsia-400" />
              <p className="text-[11px] font-medium text-fuchsia-400 uppercase tracking-wide">Owner</p>
            </div>
            <p className="text-xs font-semibold leading-snug">
              {context.recentRisk === "Critical" || context.recentRisk === "High"
                ? `${context.clientName} is an active revenue risk. Retention conversation recommended this week.`
                : `${context.clientName} account is on track. Evidence engine confidence at ${recommendation.confidenceScore}%.`}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {context.scheduledPostsCount} posts scheduled · {context.contentRunwayDays}d runway
            </p>
            <StatusBadge tone={RISK_TONE[context.recentRisk] ?? "info"}>
              {context.recentRisk === "None" ? "Healthy" : `${context.recentRisk} risk`}
            </StatusBadge>
          </div>
        </div>
      </SectionCard>

      <p className="text-[11px] text-muted-foreground text-center py-4" data-testid="evidence-engine-footer">
        Evidence-Based Selection Engine V1 · Demo-only rule engine · No AI API connected · No real posting or scheduling
      </p>
    </PortalLayout>
  );
}

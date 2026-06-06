/**
 * ClientExecutionReinforcement.tsx — calm, client-facing retention surfaces.
 *
 * SAFETY: client-facing ONLY. Surfaces nothing but the client-safe fields of the
 * execution profile (calm to-dos + respectful messages). NEVER shows retention
 * risk levels, scores, team-only notes, or blame. No guarantees, no auto-send.
 * Reads from the local rule-based engine; a human always decides anything
 * sensitive on the team side.
 */

import { useMemo } from "react";
import {
  Sparkles,
  Camera,
  MessageSquareHeart,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  analyzeExecutionIntelligence,
  executionInputFromClientId,
} from "@/lib/executionIntelligence/executionScoringEngine";
import type { ExecutionIntelligenceProfile } from "@/lib/executionIntelligence/executionIntelligenceTypes";

function useClientProfile(clientId: string): ExecutionIntelligenceProfile {
  return useMemo(
    () => analyzeExecutionIntelligence(executionInputFromClientId(clientId)),
    [clientId],
  );
}

/** Only the calm, client-safe to-dos (nothing risk-flavoured). */
function clientSafeTodos(profile: ExecutionIntelligenceProfile): string[] {
  const todos = profile.clientNeedsToProvide.filter(
    (t) => !t.startsWith("Nothing needed"),
  );
  return todos;
}

/**
 * "Keep Veroxa moving" — dashboard reinforcement. Frames any open inputs as a
 * short, friendly checklist; celebrates when nothing is needed.
 */
export function ClientKeepMovingCard({ clientId }: { clientId: string }) {
  const profile = useClientProfile(clientId);
  const todos = clientSafeTodos(profile);

  return (
    <Card
      className="bg-card border-primary/20"
      data-testid="client-keep-moving"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Keep Veroxa moving
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {todos.length === 0 ? (
          <p className="text-[13px] text-foreground/90">
            You're all set this week — Veroxa has everything it needs to keep
            your content moving. Thank you for staying in sync.
          </p>
        ) : (
          <>
            <p className="text-[12px] text-muted-foreground">
              A couple of quick things help Veroxa do its best work for you:
            </p>
            <ul className="space-y-1.5">
              {todos.map((t, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[13px] text-foreground/90 rounded-md border border-border bg-muted/10 p-2"
                >
                  <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-primary flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="text-[11px] text-muted-foreground">
          Veroxa prepares everything behind the scenes — your team reviews each
          step before anything goes live.
        </p>
      </CardContent>
    </Card>
  );
}

/** Media-page reinforcement — gentle nudge tied to supply, never pushy. */
export function ClientMediaReinforcement({ clientId }: { clientId: string }) {
  const profile = useClientProfile(clientId);
  const lowSupply = profile.mediaSupply.score < 50;

  return (
    <Card
      className="bg-card border-border"
      data-testid="client-media-reinforce"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" />
          Why your photos matter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-[13px] text-foreground/90">
          {lowSupply
            ? "Fresh photos and short videos this week keep your online presence active. Even a few quick shots from your phone make a real difference."
            : "Your media supply looks great. Keep sharing the occasional new photo and Veroxa will keep your presence fresh."}
        </p>
        <p className="text-[11px] text-muted-foreground">
          Upload whenever it's convenient. Posting depends on usable media, and
          may slow when usable photos or videos are unavailable.
        </p>
      </CardContent>
    </Card>
  );
}

/** Requests-page clarity — reassures the client their inputs are tracked. */
export function ClientRequestsClarity({ clientId }: { clientId: string }) {
  const profile = useClientProfile(clientId);
  const todos = clientSafeTodos(profile);

  return (
    <Card
      className="bg-card border-border"
      data-testid="client-requests-clarity"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <MessageSquareHeart className="w-4 h-4 text-primary" />
          What helps us help you
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-[13px] text-foreground/90">
          Anything you share here goes straight to your Veroxa team. Replies on
          open questions help us keep your work moving smoothly.
        </p>
        {todos.length > 0 && (
          <ul className="space-y-1.5">
            {todos.map((t, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[12px] text-foreground/90 rounded-md border border-border bg-muted/10 p-2"
              >
                <ClipboardCheck className="w-3.5 h-3.5 mt-0.5 text-primary flex-shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] text-muted-foreground">
          No rush — whenever you have a moment is perfectly fine. Restaurant
          handles customer replies such as comments, DMs, order questions,
          refunds, and service conversations.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Reports-page progress — completed / in progress / next, derived from real
 * work counts. No invented performance metrics, no guarantees.
 */
export function ClientReportsProgress({ clientId }: { clientId: string }) {
  const profile = useClientProfile(clientId);
  const dims = profile.dimensions;

  return (
    <Card
      className="bg-card border-border"
      data-testid="client-reports-progress"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-primary" />
          Your progress at a glance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-emerald-400 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Completed work
            </p>
            <p className="text-[12px] text-foreground/90 mt-1">
              {dims.workQueueCompletion >= 60
                ? "Most of this period's work is done."
                : "Work is underway and progressing."}
            </p>
          </div>
          <div className="rounded-md border border-sky-500/30 bg-sky-500/5 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-sky-400 inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> Coming next
            </p>
            <p className="text-[12px] text-foreground/90 mt-1">
              {profile.clientNeedsToProvide[0]}
            </p>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          This is a plain-language summary of activity — not a performance
          guarantee. Your full report is prepared by your Veroxa team. Additional service readiness can be reviewed after your foundation is stable.
        </p>
      </CardContent>
    </Card>
  );
}

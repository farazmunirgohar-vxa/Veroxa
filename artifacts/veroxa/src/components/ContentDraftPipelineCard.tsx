import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import type { ClientTeamSubmission } from "@/data/demo/demoClientTeamWork";
import { previewContentDraftForSubmission } from "@/lib/content/contentDraftPreviewEngine";
import { AI_AGENT_STATUS_LABELS, TEAM_AI_DISCLOSURE } from "@/lib/ai/aiAgentTypes";

/**
 * ContentDraftPipelineCard — team-facing view of the AI-assisted content
 * draft pipeline (media → angle → caption draft → team review).
 *
 * Deterministic / rule-based preview only. The "Generate caption draft"
 * action is UI-only: it reveals the locally-prepared draft captions. Nothing
 * is published, sent, or written.
 */
export function ContentDraftPipelineCard({
  submissions,
  title = "AI content draft pipeline",
}: {
  submissions: ClientTeamSubmission[];
  title?: string;
}) {
  if (submissions.length === 0) return null;
  return (
    <Card className="mt-3 bg-card border-primary/20" data-testid="card-content-draft-pipeline">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          {title} ({submissions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {submissions.map((s) => (
          <ContentDraftRow key={s.id} submission={s} />
        ))}
        <p className="text-[10px] text-muted-foreground italic pt-1">
          {TEAM_AI_DISCLOSURE} AI-assisted draft — team review required before use.
        </p>
      </CardContent>
    </Card>
  );
}

function ContentDraftRow({ submission }: { submission: ClientTeamSubmission }) {
  const [revealed, setRevealed] = useState(false);
  const preview = previewContentDraftForSubmission(submission);

  const stageTone =
    preview.status === "approved"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : preview.status === "blocked"
        ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
        : preview.status === "manual_review_needed"
          ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
          : "border-sky-500/40 bg-sky-500/10 text-sky-300";

  return (
    <div
      className="rounded-md border border-border/60 bg-muted/10 p-3 text-[12px]"
      data-testid={`content-draft-${submission.id}`}
    >
      <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
        <p className="font-semibold text-foreground">{submission.title}</p>
        <div className="flex gap-1.5 flex-wrap">
          <Badge variant="outline" className={`${stageTone} text-[10px]`}>
            {preview.stageLabel}
          </Badge>
          <Badge variant="outline" className="border-border bg-muted/30 text-[10px]">
            Caption: {preview.captionStatusLabel}
          </Badge>
          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300 text-[10px]">
            Team review required
          </Badge>
        </div>
      </div>
      <p className="text-muted-foreground">
        <span className="text-foreground font-medium">Suggested angle:</span>{" "}
        {preview.suggestedAngle}
      </p>
      <p className="text-muted-foreground mt-0.5">
        <span className="text-foreground font-medium">Recommended usage:</span>{" "}
        {preview.recommendedUsage}
      </p>
      {preview.needsClientContext ? (
        <p className="text-amber-300 mt-1">
          Needs client context: {preview.nextHumanAction}
        </p>
      ) : (
        <div className="mt-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px]"
            onClick={() => setRevealed((v) => !v)}
            data-testid={`btn-generate-caption-${submission.id}`}
          >
            {revealed ? "Hide caption draft" : "Generate caption draft"}
          </Button>
          {revealed && (
            <div className="mt-2 space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                AI-prepared caption drafts (review before use)
              </p>
              <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
                {preview.captionDrafts.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
              <p className="text-[10px] text-muted-foreground italic">
                Next: {preview.nextHumanAction}
              </p>
              <details className="text-[10px] text-muted-foreground">
                <summary className="cursor-pointer">Caption safety rules applied</summary>
                <ul className="list-disc pl-5 mt-1 space-y-0.5">
                  {preview.safetyNotes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </details>
            </div>
          )}
        </div>
      )}
      <p className="sr-only">{AI_AGENT_STATUS_LABELS[preview.status]}</p>
    </div>
  );
}

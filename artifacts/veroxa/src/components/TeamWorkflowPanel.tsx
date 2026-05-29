import { useEffect, useState } from "react";
import {
  CheckCircle2,
  HelpCircle,
  PenLine,
  CalendarClock,
  FileBarChart,
  Ban,
  ArrowRightCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getTeamWorkflowItems,
  markReadyForContentPrep,
  markContentDraftReady,
  markSchedulePrepReady,
  markCompletedForReport,
  markReportReady,
  markIncludedInReport,
  markBlocked,
  requestClientClarification,
  subscribeToWorkflow,
} from "@/lib/workflow/workflowRepository";
import type {
  WorkflowItem,
  WorkflowLifecycleStatus,
} from "@/lib/workflow/workflowTypes";

/**
 * useTeamWorkflowItems — live team-side view of the real workflow foundation.
 * Optionally filtered to a set of lifecycle statuses.
 */
export function useTeamWorkflowItems(
  lifecycles?: WorkflowLifecycleStatus[],
): WorkflowItem[] {
  const [items, setItems] = useState<WorkflowItem[]>(() =>
    getTeamWorkflowItems(),
  );
  useEffect(() => {
    const refresh = () => setItems(getTeamWorkflowItems());
    refresh();
    return subscribeToWorkflow(refresh);
  }, []);
  if (!lifecycles || lifecycles.length === 0) return items;
  return items.filter((i) => lifecycles.includes(i.lifecycleStatus));
}

const lifecycleTone: Record<WorkflowLifecycleStatus, string> = {
  submitted: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  team_reviewing: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  ai_prepared: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  needs_client_input: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  ready_for_content_prep: "border-primary/30 bg-primary/10 text-primary",
  content_draft_ready: "border-primary/30 bg-primary/10 text-primary",
  scheduling_prep_ready: "border-teal-500/30 bg-teal-500/10 text-teal-300",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  report_ready: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  included_in_report: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  blocked: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

/**
 * Actions available for an item, based on where it is in the lifecycle.
 * Every action is a human/team decision — nothing is auto-sent or published.
 */
function TeamItemActions({ item }: { item: WorkflowItem }) {
  const [question, setQuestion] = useState("");
  const id = item.workflowItemId;
  const ls = item.lifecycleStatus;

  const askClient = () => {
    const q = question.trim();
    if (!q) return;
    requestClientClarification(id, q);
    setQuestion("");
  };

  const canApprovePrep =
    ls === "submitted" || ls === "team_reviewing" || ls === "ai_prepared";

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {canApprovePrep && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => markReadyForContentPrep(id)}
            data-testid={`wf-approve-prep-${id}`}
          >
            <ArrowRightCircle className="w-3.5 h-3.5 mr-1" /> Approve for content prep
          </Button>
        )}
        {ls === "ready_for_content_prep" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => markContentDraftReady(id)}
            data-testid={`wf-draft-ready-${id}`}
          >
            <PenLine className="w-3.5 h-3.5 mr-1" /> Mark content draft ready
          </Button>
        )}
        {ls === "content_draft_ready" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => markSchedulePrepReady(id)}
            data-testid={`wf-schedule-ready-${id}`}
          >
            <CalendarClock className="w-3.5 h-3.5 mr-1" /> Mark scheduling prep ready
          </Button>
        )}
        {ls === "scheduling_prep_ready" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => markCompletedForReport(id)}
            data-testid={`wf-complete-${id}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark completed
          </Button>
        )}
        {ls === "completed" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => markReportReady(id)}
            data-testid={`wf-report-ready-${id}`}
          >
            <FileBarChart className="w-3.5 h-3.5 mr-1" /> Prepare report draft
          </Button>
        )}
        {ls === "report_ready" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => markIncludedInReport(id)}
            data-testid={`wf-include-report-${id}`}
          >
            <FileBarChart className="w-3.5 h-3.5 mr-1" /> Include in report
          </Button>
        )}
        {ls !== "blocked" && !item.lifecycleStatus.startsWith("included") && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs text-rose-300 hover:text-rose-200"
            onClick={() => markBlocked(id, "Blocked pending team follow-up.")}
            data-testid={`wf-block-${id}`}
          >
            <Ban className="w-3.5 h-3.5 mr-1" /> Block
          </Button>
        )}
      </div>
      {ls !== "needs_client_input" && (
        <div className="flex gap-2">
          <Input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") askClient();
            }}
            placeholder="Ask the client a clarifying question…"
            className="h-8 text-xs"
            data-testid={`wf-ask-input-${id}`}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs flex-shrink-0"
            onClick={askClient}
            disabled={!question.trim()}
            data-testid={`wf-ask-send-${id}`}
          >
            <HelpCircle className="w-3.5 h-3.5 mr-1" /> Ask
          </Button>
        </div>
      )}
    </div>
  );
}

export interface TeamWorkflowPanelProps {
  title: string;
  icon?: React.ReactNode;
  lifecycles?: WorkflowLifecycleStatus[];
  emptyText?: string;
  testId?: string;
  showActions?: boolean;
  limit?: number;
}

/**
 * TeamWorkflowPanel — repo-driven list of workflow items for the team portal.
 * Pure read + human-approval actions. No external sends, publishing, or
 * notifications happen here; status changes persist through the workflow
 * foundation (backend pending).
 */
export function TeamWorkflowPanel({
  title,
  icon,
  lifecycles,
  emptyText = "Nothing here right now.",
  testId,
  showActions = true,
  limit,
}: TeamWorkflowPanelProps) {
  const all = useTeamWorkflowItems(lifecycles);
  const items = typeof limit === "number" ? all.slice(0, limit) : all;

  return (
    <Card className="bg-card border-border" data-testid={testId}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {icon}
          {title} ({all.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">{emptyText}</p>
        ) : (
          items.map((item) => (
            <div
              key={item.workflowItemId}
              className="rounded-md border border-border bg-muted/20 px-3 py-2.5"
              data-testid={`wf-item-${item.workflowItemId}`}
            >
              <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {item.restaurantName}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[9px] flex-shrink-0 ${lifecycleTone[item.lifecycleStatus]}`}
                >
                  {item.internalTeamStatus}
                </Badge>
              </div>
              {item.nextTeamAction && (
                <p className="text-[11px] text-primary/85">
                  Next: {item.nextTeamAction}
                </p>
              )}
              {item.nextClientAction && (
                <p className="text-[11px] text-amber-300 mt-0.5">
                  Waiting on client: {item.nextClientAction}
                </p>
              )}
              {showActions && <TeamItemActions item={item} />}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

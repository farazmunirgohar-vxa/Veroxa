/**
 * WorkflowColumn — M009
 *
 * Renders a labelled column of WorkflowItem cards. Used by the team
 * work queue to render groups (Media Review, Draft Needed, etc.) and
 * by the client dashboard for the "What Veroxa is working on" strip.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkflowItem } from "@/data/workflows/clientTeamWorkflow";
import { WorkflowItemCard } from "./WorkflowItemCard";

export interface WorkflowColumnProps {
  title: string;
  description?: string;
  items: WorkflowItem[];
  mode: "client" | "team";
  emptyMessage?: string;
  testId?: string;
}

export function WorkflowColumn({
  title,
  description,
  items,
  mode,
  emptyMessage,
  testId,
}: WorkflowColumnProps) {
  return (
    <Card className="bg-card border-border" data-testid={testId}>
      <CardHeader className="pb-3">
        <div className="flex items-baseline justify-between gap-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </CardTitle>
          <span className="text-[11px] text-muted-foreground/70 tabular-nums">
            {items.length}
          </span>
        </div>
        {description && (
          <p className="text-[11px] text-muted-foreground/70 mt-1">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            {emptyMessage ?? "Nothing here right now."}
          </p>
        ) : (
          items.map((item) => (
            <WorkflowItemCard key={item.id} item={item} mode={mode} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

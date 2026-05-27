/**
 * WorkflowItemCard — M009
 *
 * Renders a single WorkflowItem for either the Client or Team portal.
 *
 *   mode="client"
 *     - friendly stage label
 *     - hides priority / due unless client action is needed
 *     - hides internal IDs, internal notes, raw stage names
 *
 *   mode="team"
 *     - operational stage label
 *     - shows priority + due label
 *     - shows truncated client + item id for orientation
 *     - may render optional `onAction` buttons (local/demo only)
 */

import { Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorkflowItem, WorkflowPriority } from "@/data/workflows/clientTeamWorkflow";
import { WorkflowStatusBadge } from "./WorkflowStatusBadge";
import { isClientActionNeeded } from "@/lib/workflows/workflowStatus";

const PRIORITY_CLASS: Record<WorkflowPriority, string> = {
  urgent: "border-rose-500/40 text-rose-300 bg-rose-500/10",
  high:   "border-amber-500/40 text-amber-300 bg-amber-500/10",
  normal: "border-border text-muted-foreground bg-muted/30",
  low:    "border-border text-muted-foreground/70 bg-muted/20",
};

export interface WorkflowItemCardAction {
  label: string;
  onClick: () => void;
  tone?: "primary" | "neutral" | "warn";
}

export interface WorkflowItemCardProps {
  item: WorkflowItem;
  mode: "client" | "team";
  actions?: WorkflowItemCardAction[];
  clientName?: string;
  className?: string;
}

export function WorkflowItemCard({
  item,
  mode,
  actions,
  clientName,
  className,
}: WorkflowItemCardProps) {
  const clientAction = isClientActionNeeded(item.stage);

  return (
    <Card
      className={`bg-card border-border ${className ?? ""}`}
      data-testid={`workflow-item-${mode}-${item.id}`}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug min-w-0 flex-1">{item.title}</p>
          <WorkflowStatusBadge stage={item.stage} mode={mode} />
        </div>

        {mode === "team" && (
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <Badge variant="outline" className={`text-[10px] ${PRIORITY_CLASS[item.priority]}`}>
              {item.priority} priority
            </Badge>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {item.dueLabel}
            </span>
            {clientName && (
              <span className="truncate">· {clientName}</span>
            )}
            <span className="text-[10px] text-muted-foreground/60 ml-auto">
              {item.type}
            </span>
          </div>
        )}

        {mode === "client" && clientAction && (
          <div className="flex items-start gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded px-2.5 py-1.5">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>Veroxa needs your input · {item.dueLabel}</span>
          </div>
        )}

        {actions && actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
            {actions.map((a, i) => {
              const tone = a.tone ?? "neutral";
              const cls =
                tone === "primary"
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                  : tone === "warn"
                    ? "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                    : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50";
              return (
                <button
                  key={`${a.label}-${i}`}
                  type="button"
                  onClick={a.onClick}
                  className={`rounded px-2.5 py-1 text-[11px] font-medium border transition-colors ${cls}`}
                  data-testid={`workflow-action-${item.id}-${i}`}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

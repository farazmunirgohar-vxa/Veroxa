/**
 * WorkflowStatusBadge — M009
 *
 * Small badge that renders the audience-appropriate label and tone
 * for a workflow stage. `mode="client"` uses friendly labels;
 * `mode="team"` uses operational labels.
 */

import { Badge } from "@/components/ui/badge";
import {
  getClientStatusLabel,
  getTeamStatusLabel,
  getWorkflowTone,
  type WorkflowTone,
} from "@/lib/workflows/workflowStatus";
import type { WorkflowStage } from "@/data/workflows/clientTeamWorkflow";

const TONE_CLASS: Record<WorkflowTone, string> = {
  info:    "border-sky-500/40 text-sky-300 bg-sky-500/10",
  success: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  warning: "border-amber-500/40 text-amber-300 bg-amber-500/10",
  danger:  "border-rose-500/40 text-rose-300 bg-rose-500/10",
  neutral: "border-border text-muted-foreground bg-muted/30",
};

export interface WorkflowStatusBadgeProps {
  stage: WorkflowStage;
  mode: "client" | "team";
  className?: string;
}

export function WorkflowStatusBadge({ stage, mode, className }: WorkflowStatusBadgeProps) {
  const label = mode === "client" ? getClientStatusLabel(stage) : getTeamStatusLabel(stage);
  const tone = getWorkflowTone(stage);
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-medium ${TONE_CLASS[tone]} ${className ?? ""}`}
      data-testid={`workflow-status-${mode}-${stage}`}
    >
      {label}
    </Badge>
  );
}

import type { ReactNode } from "react";
import {
  Check,
  Pencil,
  MessageCircle,
  SkipForward,
  Send,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common";
import type { StatusBadgeTone } from "@/components/common";
import {
  APPROVAL_REQUIREMENT_LABELS,
  APPROVAL_RISK_LABELS,
  EXECUTION_MODE_LABELS,
  PREPARED_ACTION_CHANNEL_LABELS,
  PREPARED_ACTION_STATUS_LABELS,
  PREPARED_ACTION_TYPE_LABELS,
  canExecuteWithoutApproval,
  requiresClientConfirmation,
  type ApprovalRiskLevel,
  type ApprovalRequirement,
  type PreparedAction,
  type PreparedActionId,
  type PreparedActionStatus,
} from "@/domain/preparedActions";

/**
 * PreparedActionCard — the Approval Queue review card.
 *
 * Mobile-friendly and calm: it shows what Veroxa prepared, why, and the exact
 * approval needed, then offers human review actions that wrap on small screens.
 * Uses plain wording only — no AI/model/connector/API/backend terms and no raw
 * IDs. See docs/APPROVAL_TO_EXECUTION_OS.md.
 */

const riskTone: Record<ApprovalRiskLevel, StatusBadgeTone> = {
  low: "neutral",
  medium: "caution",
  high: "warning",
  sensitive: "danger",
};

const approvalTone: Record<ApprovalRequirement, StatusBadgeTone> = {
  none_internal_only: "neutral",
  team_approval_required: "info",
  client_confirmation_required: "accent",
  never_automatic: "danger",
};

const statusTone: Record<PreparedActionStatus, StatusBadgeTone> = {
  prepared: "neutral",
  needs_review: "info",
  needs_client_confirmation: "accent",
  approved: "success",
  skipped: "neutral",
  edited: "info",
  queued_for_execution: "success",
  executed: "success",
  failed: "danger",
  archived: "neutral",
};

interface ActionButton {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost";
  testId?: string;
}

export interface PreparedActionCardProps {
  action: PreparedAction;
  onApprove: (id: PreparedActionId) => void;
  onEditLater: (id: PreparedActionId) => void;
  onAskClient: (id: PreparedActionId) => void;
  onSkip: (id: PreparedActionId) => void;
  onQueueForExecution: (id: PreparedActionId) => void;
  testId?: string;
}

export function PreparedActionCard({
  action,
  onApprove,
  onEditLater,
  onAskClient,
  onSkip,
  onQueueForExecution,
  testId,
}: PreparedActionCardProps) {
  const preview = action.payload.preparedText ?? action.payload.keywordAngle;
  const internalOnly = canExecuteWithoutApproval(action);
  const needsClient = requiresClientConfirmation(action);

  const isApproved = action.status === "approved";
  const isQueued = action.status === "queued_for_execution";
  const isTerminal =
    action.status === "skipped" ||
    action.status === "executed" ||
    action.status === "archived";
  // "Open" = still awaiting a decision. Terminal and queued cards are read-only.
  const isOpen = !isApproved && !isQueued && !isTerminal;

  // For client-confirmation items, approval is only valid once the client has
  // been asked (status = needs_client_confirmation). Until then the primary
  // path is "Ask Client", so we don't surface an Approve button that no-ops.
  const canApproveNow =
    isOpen && (!needsClient || action.status === "needs_client_confirmation");

  const dedupedActions: ActionButton[] = [];

  if (isApproved) {
    // Approved: the only forward action is to queue it for (future) execution.
    dedupedActions.push({
      label: "Queue for Later",
      icon: <Send className="w-3.5 h-3.5" />,
      variant: "secondary",
      onClick: () => onQueueForExecution(action.id),
      testId: `btn-queue-${action.id}`,
    });
  } else if (isOpen) {
    if (canApproveNow) {
      dedupedActions.push({
        label: needsClient ? "Confirm & Approve" : "Approve",
        icon: <Check className="w-3.5 h-3.5" />,
        variant: "default",
        onClick: () => onApprove(action.id),
        testId: `btn-approve-${action.id}`,
      });
    }

    // Ask Client for items that need the restaurant's confirmation and haven't
    // been asked yet.
    if (!internalOnly && needsClient && action.status !== "needs_client_confirmation") {
      dedupedActions.push({
        label: "Ask Client",
        icon: <MessageCircle className="w-3.5 h-3.5" />,
        variant: "default",
        onClick: () => onAskClient(action.id),
        testId: `btn-ask-client-${action.id}`,
      });
    }

    dedupedActions.push({
      label: "Edit Later",
      icon: <Pencil className="w-3.5 h-3.5" />,
      onClick: () => onEditLater(action.id),
      testId: `btn-edit-later-${action.id}`,
    });

    dedupedActions.push({
      label: "Skip",
      icon: <SkipForward className="w-3.5 h-3.5" />,
      onClick: () => onSkip(action.id),
      testId: `btn-skip-${action.id}`,
    });
  }
  // isQueued / isTerminal => no actions (read-only).

  return (
    <Card className="bg-card border-border" data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-snug">{action.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {action.restaurantName} · {PREPARED_ACTION_CHANNEL_LABELS[action.channel]}
            </p>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            <StatusBadge tone={riskTone[action.riskLevel]}>
              {APPROVAL_RISK_LABELS[action.riskLevel]}
            </StatusBadge>
            <StatusBadge tone={statusTone[action.status]}>
              {PREPARED_ACTION_STATUS_LABELS[action.status]}
            </StatusBadge>
          </div>
        </div>

        {preview && (
          <div className="mt-2.5 rounded-md border border-border/60 bg-muted/20 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1">
              Prepared action
            </p>
            <p className="text-[13px] text-foreground/90 leading-snug">{preview}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-2 leading-snug">
          <span className="text-foreground/70 font-medium">Why:</span> {action.reason}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <StatusBadge tone={approvalTone[action.approvalRequirement]}>
            {APPROVAL_REQUIREMENT_LABELS[action.approvalRequirement]}
          </StatusBadge>
          <StatusBadge tone="neutral">
            {PREPARED_ACTION_TYPE_LABELS[action.type]}
          </StatusBadge>
          <StatusBadge tone="neutral">
            {EXECUTION_MODE_LABELS[action.executionMode]}
          </StatusBadge>
        </div>

        <p className="text-[12px] text-primary/85 mt-2">
          <span className="text-muted-foreground">Suggested next:</span> {action.suggestedNext}
        </p>

        {dedupedActions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {dedupedActions.map((a) => (
              <Button
                key={a.label}
                size="sm"
                variant={a.variant ?? "outline"}
                onClick={a.onClick}
                data-testid={a.testId}
                className="h-9"
              >
                {a.icon}
                <span className="ml-1.5">{a.label}</span>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

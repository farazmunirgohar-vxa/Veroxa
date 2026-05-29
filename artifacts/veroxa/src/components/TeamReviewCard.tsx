import type { ReactNode } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common";
import type { StatusBadgeTone } from "@/components/common";

/**
 * TeamReviewCard — the shared review card for the Team portal.
 *
 * Built for the "review anywhere" model: it stacks cleanly on mobile and
 * expands on desktop, and the action buttons wrap instead of crowding. It
 * uses calm, human wording only — no backend, database, or AI-internal terms.
 *
 * See docs/MOBILE_TEAM_REVIEW_MODEL.md for the review model this supports.
 */

export interface TeamReviewAction {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  testId?: string;
  disabled?: boolean;
}

export interface TeamReviewCardProps {
  /** Restaurant / client name. */
  restaurantName: string;
  /** Task or item title. */
  title: string;
  /** Short, plain-language context line. */
  context?: string;
  /** Suggested next action, shown as a calm hint. */
  suggestedAction?: string;
  /** Optional leading media/category icon. */
  icon?: ReactNode;
  status?: { label: string; tone?: StatusBadgeTone };
  priority?: { label: string; tone?: StatusBadgeTone };
  /** Review actions. Buttons wrap on small screens. */
  actions?: TeamReviewAction[];
  /** Optional small detail shown subtly (e.g. submitted time). */
  meta?: string;
  testId?: string;
}

function ActionButton({ action }: { action: TeamReviewAction }) {
  const inner = (
    <Button
      size="sm"
      variant={action.variant ?? "outline"}
      onClick={action.onClick}
      disabled={action.disabled}
      data-testid={action.testId}
      className="h-9"
    >
      {action.icon}
      <span className={action.icon ? "ml-1.5" : ""}>{action.label}</span>
    </Button>
  );
  if (action.href) {
    return <Link href={action.href}>{inner}</Link>;
  }
  return inner;
}

export function TeamReviewCard({
  restaurantName,
  title,
  context,
  suggestedAction,
  icon,
  status,
  priority,
  actions,
  meta,
  testId,
}: TeamReviewCardProps) {
  return (
    <Card className="bg-card border-border" data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <p className="font-semibold text-sm leading-snug">{title}</p>
              <div className="flex gap-1.5 flex-wrap">
                {priority && <StatusBadge tone={priority.tone ?? "neutral"}>{priority.label}</StatusBadge>}
                {status && <StatusBadge tone={status.tone ?? "info"}>{status.label}</StatusBadge>}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{restaurantName}</p>
            {context && <p className="text-sm text-foreground/85 mt-1.5 leading-snug">{context}</p>}
            {suggestedAction && (
              <p className="text-[12px] text-primary/85 mt-1.5">
                <span className="text-muted-foreground">Suggested next:</span> {suggestedAction}
              </p>
            )}
            {meta && <p className="text-[11px] text-muted-foreground/70 mt-1.5">{meta}</p>}
          </div>
        </div>

        {actions && actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map((action) => (
              <ActionButton key={action.label} action={action} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

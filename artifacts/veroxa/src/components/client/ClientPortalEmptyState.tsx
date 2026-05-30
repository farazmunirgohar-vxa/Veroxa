import type { ReactNode } from "react";

interface ClientPortalEmptyStateProps {
  icon?: ReactNode;
  heading: string;
  body?: string;
  testId?: string;
  className?: string;
}

/**
 * Reusable client-safe empty state for any portal section that might have
 * no items yet. Calm, plain language — no blame, no invented content.
 */
export function ClientPortalEmptyState({
  icon,
  heading,
  body,
  testId,
  className = "",
}: ClientPortalEmptyStateProps) {
  return (
    <div
      className={`rounded-xl border border-border/40 bg-card/10 px-5 py-8 text-center ${className}`}
      data-testid={testId}
    >
      {icon && (
        <div className="flex justify-center mb-3 text-muted-foreground/30">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-foreground/60">{heading}</p>
      {body && (
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-xs mx-auto">
          {body}
        </p>
      )}
    </div>
  );
}

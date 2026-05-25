import type { ReactNode } from "react";

interface Props {
  title: string;
  badge?: ReactNode;
  description?: string;
  meta?: string;
  testId?: string;
}

/**
 * AlertRow — standard alert / queue item row.
 * Renders title + optional right-side badge, description, and meta line.
 * Used inside SectionCard (or any container with space-y-2).
 */
export function AlertRow({ title, badge, description, meta, testId }: Props) {
  return (
    <div
      className="rounded-md border border-border bg-muted/20 px-3 py-2"
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <p className="text-sm font-semibold leading-tight">{title}</p>
        {badge}
      </div>
      {description && (
        <p className="text-[11px] text-muted-foreground">{description}</p>
      )}
      {meta && (
        <p className="text-[10px] text-muted-foreground mt-1">{meta}</p>
      )}
    </div>
  );
}

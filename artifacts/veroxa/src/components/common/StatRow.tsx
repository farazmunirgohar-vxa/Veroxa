import type { ReactNode } from "react";

interface Props {
  primary: string;
  secondary?: string;
  badge?: ReactNode;
  testId?: string;
}

/**
 * StatRow — standard name + subtext + right-badge row.
 * Used for client lists, report queues, media inventory rows, etc.
 * Used inside SectionCard (or any container with space-y-2).
 */
export function StatRow({ primary, secondary, badge, testId }: Props) {
  return (
    <div
      className="rounded-md border border-border bg-muted/20 px-3 py-2 flex items-center justify-between"
      data-testid={testId}
    >
      <div>
        <p className="text-sm font-semibold">{primary}</p>
        {secondary && (
          <p className="text-[11px] text-muted-foreground">{secondary}</p>
        )}
      </div>
      {badge}
    </div>
  );
}

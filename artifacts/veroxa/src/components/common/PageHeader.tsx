import type { ReactNode } from "react";

interface Props {
  title:       string;
  description?: string;
  actions?:    ReactNode;
  testId?:     string;
}

export function PageHeader({ title, description, actions, testId }: Props) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3 flex-wrap">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid={testId}>
          {title}
        </h2>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm md:text-base">{description}</p>
        )}
      </div>
      {actions && <div className="flex gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

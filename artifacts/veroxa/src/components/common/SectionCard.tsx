import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  title: ReactNode;
  icon?: LucideIcon;
  iconClass?: string;
  children: ReactNode;
  contentClass?: string;
  className?: string;
  testId?: string;
}

/**
 * SectionCard — standard Card + CardHeader + CardTitle + CardContent wrapper.
 * Eliminates the repeated `<Card className="bg-card border-border">` boilerplate
 * across dashboard pages.
 *
 * contentClass defaults to "space-y-2". Pass "" or a custom value to override.
 */
export function SectionCard({
  title,
  icon: Icon,
  iconClass,
  children,
  contentClass,
  className,
  testId,
}: Props) {
  return (
    <Card className={cn("bg-card border-border", className)} data-testid={testId}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {Icon && <Icon className={cn("w-4 h-4", iconClass)} />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={contentClass ?? "space-y-2"}>
        {children}
      </CardContent>
    </Card>
  );
}

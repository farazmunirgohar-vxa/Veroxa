import { Badge } from "@/components/ui/badge";

type Tone = "success" | "info" | "warning" | "caution" | "danger" | "neutral" | "accent";

const toneClass: Record<Tone, string> = {
  success: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  info:    "border-sky-500/40 text-sky-300 bg-sky-500/10",
  warning: "border-amber-500/40 text-amber-300 bg-amber-500/10",
  caution: "border-yellow-500/40 text-yellow-300 bg-yellow-500/10",
  danger:  "border-rose-500/40 text-rose-300 bg-rose-500/10",
  neutral: "border-muted-foreground/40 text-muted-foreground bg-muted/30",
  accent:  "border-violet-500/40 text-violet-300 bg-violet-500/10",
};

export type { Tone as StatusBadgeTone };

export function StatusBadge({ tone = "neutral", children, testId }: { tone?: Tone; children: React.ReactNode; testId?: string }) {
  return (
    <Badge variant="outline" className={`text-[10px] ${toneClass[tone]}`} data-testid={testId}>
      {children}
    </Badge>
  );
}

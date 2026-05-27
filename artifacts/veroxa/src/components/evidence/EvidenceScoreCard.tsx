import { Clock, Image as ImageIcon, TrendingUp, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ScoreDimension {
  label: string;
  displayValue: string;
  progressValue: number;
  color: string;
  icon: LucideIcon;
}

interface Props {
  score: number;
  runwayDays: number;
  mediaQuality: number;
  topEngagement: number;
  testId?: string;
}

export function EvidenceScoreCard({
  score,
  runwayDays,
  mediaQuality,
  topEngagement,
  testId,
}: Props) {
  const runwayProgress = Math.min(100, Math.round((runwayDays / 14) * 100));
  const runwayColor =
    runwayDays <= 4 ? "text-rose-400" : runwayDays <= 7 ? "text-amber-400" : "text-emerald-400";

  const engagementProgress = Math.min(100, Math.round(topEngagement * 9));
  const confidenceColor =
    score >= 85 ? "text-emerald-400" : score >= 70 ? "text-amber-400" : "text-rose-400";

  const dimensions: ScoreDimension[] = [
    {
      label: "Best media quality",
      displayValue: `${mediaQuality}/100`,
      progressValue: mediaQuality,
      color: "text-sky-400",
      icon: ImageIcon,
    },
    {
      label: "Top post engagement",
      displayValue: `${topEngagement}%`,
      progressValue: engagementProgress,
      color: "text-emerald-400",
      icon: TrendingUp,
    },
    {
      label: "Content runway",
      displayValue: `${runwayDays} days`,
      progressValue: runwayProgress,
      color: runwayColor,
      icon: Clock,
    },
    {
      label: "Engine confidence",
      displayValue: `${score}%`,
      progressValue: score,
      color: confidenceColor,
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3" data-testid={testId}>
      {dimensions.map((d) => {
        const Icon = d.icon;
        return (
          <div
            key={d.label}
            className="rounded-md border border-border bg-muted/20 p-3"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Icon className={`w-3.5 h-3.5 ${d.color}`} />
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                {d.label}
              </span>
            </div>
            <Progress value={d.progressValue} className="h-1.5 mb-1.5" />
            <p className={`text-xs font-bold tabular-nums ${d.color}`}>{d.displayValue}</p>
          </div>
        );
      })}
    </div>
  );
}

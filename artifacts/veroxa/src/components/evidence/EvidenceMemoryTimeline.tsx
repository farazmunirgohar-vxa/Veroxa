import { TrendingUp, Image as ImageIcon, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { EvidenceTimelineEvent } from "@/lib/evidence/evidenceSelectionEngine";

interface TypeConfig {
  icon: LucideIcon;
  color: string;
  dot: string;
}

const TYPE_CONFIG: Record<EvidenceTimelineEvent["type"], TypeConfig> = {
  post:      { icon: TrendingUp,    color: "text-emerald-400", dot: "bg-emerald-400" },
  media:     { icon: ImageIcon,     color: "text-sky-400",     dot: "bg-sky-400"     },
  report:    { icon: FileText,      color: "text-violet-400",  dot: "bg-violet-400"  },
  risk:      { icon: AlertTriangle, color: "text-rose-400",    dot: "bg-rose-400"    },
  milestone: { icon: CheckCircle2,  color: "text-amber-400",   dot: "bg-amber-400"   },
};

interface Props {
  events: EvidenceTimelineEvent[];
  testId?: string;
}

export function EvidenceMemoryTimeline({ events, testId }: Props) {
  return (
    <ol
      className="relative border-l border-border/40 space-y-4 pl-5"
      data-testid={testId}
    >
      {events.map((e, i) => {
        const { icon: Icon, color, dot } = TYPE_CONFIG[e.type];
        return (
          <li key={i} className="relative">
            <span
              className={`absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full border-2 border-background ${dot}`}
            />
            <div className="flex items-start gap-2">
              <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${color}`} />
              <div className="min-w-0">
                <p className="text-xs font-medium leading-snug text-foreground">
                  {e.event}
                </p>
                {e.metric && (
                  <p className={`text-[11px] font-medium tabular-nums mt-0.5 ${color}`}>
                    {e.metric}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-0.5">{e.date}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

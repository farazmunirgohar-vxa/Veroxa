import { BarChart2, Clock, Image as ImageIcon, Heart, AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { EvidenceReason, EvidenceReasonType } from "@/lib/evidence/evidenceSelectionEngine";

const REASON_ICONS: Record<EvidenceReasonType, LucideIcon> = {
  performance: BarChart2,
  media:       ImageIcon,
  schedule:    Clock,
  health:      Heart,
  risk:        AlertTriangle,
};

const REASON_COLORS: Record<EvidenceReasonType, string> = {
  performance: "text-emerald-400",
  media:       "text-sky-400",
  schedule:    "text-violet-400",
  health:      "text-amber-400",
  risk:        "text-rose-400",
};

interface Props {
  reasons: EvidenceReason[];
  testId?: string;
}

export function EvidenceReasonStack({ reasons, testId }: Props) {
  return (
    <ul className="space-y-2" data-testid={testId}>
      {reasons.map((r, i) => {
        const Icon = REASON_ICONS[r.type];
        return (
          <li key={i} className="flex items-start gap-2.5">
            <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${REASON_COLORS[r.type]}`} />
            <span className="text-sm text-muted-foreground leading-snug">{r.text}</span>
          </li>
        );
      })}
    </ul>
  );
}

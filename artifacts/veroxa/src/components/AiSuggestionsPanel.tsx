import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  demoAiSuggestions,
  getRestaurantName,
  type DemoAiSuggestion,
} from "@/data/demoData";

interface AiSuggestionsPanelProps {
  clientId?: string;
  limit?: number;
  testId?: string;
}

const agentColor: Record<DemoAiSuggestion["agent"], string> = {
  "Media Review Agent":       "bg-sky-500/10 text-sky-300 border-sky-500/30",
  "Content Strategist Agent": "bg-violet-500/10 text-violet-300 border-violet-500/30",
  "Caption Agent":            "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  "Brand Voice Agent":        "bg-amber-500/10 text-amber-300 border-amber-500/30",
  "Scheduling Agent":         "bg-rose-500/10 text-rose-300 border-rose-500/30",
  "Reporting Agent":          "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
};

export function AiSuggestionsPanel({
  clientId,
  limit,
  testId = "panel-ai-suggestions",
}: AiSuggestionsPanelProps) {
  let items = clientId
    ? demoAiSuggestions.filter((s) => s.clientId === clientId)
    : demoAiSuggestions;
  if (limit) items = items.slice(0, limit);

  return (
    <Card className="bg-card border-border" data-testid={testId}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Suggestions
          </CardTitle>
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-300 bg-amber-500/10 text-[10px]"
          >
            Demo only
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Static sample output from the Veroxa agent stack. No live AI calls
          are made.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No suggestions for this client yet.
          </p>
        )}
        {items.map((s) => (
          <div
            key={s.id}
            className="rounded-md border border-border bg-muted/20 p-3"
            data-testid={`suggestion-${s.id}`}
          >
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded border ${agentColor[s.agent]}`}
              >
                {s.agent}
              </span>
              {!clientId && (
                <span className="text-[10px] text-muted-foreground">
                  · {getRestaurantName(s.clientId)}
                </span>
              )}
              <span className="ml-auto text-[10px] text-muted-foreground">
                Confidence {s.confidence}%
              </span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {s.suggestion}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

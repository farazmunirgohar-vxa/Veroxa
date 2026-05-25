import {
  Plug, Sparkles, Share2, Search, MessageSquare, BarChart3, HardDrive, CreditCard,
  Clock, type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { PageHeader, MetricTile, StatusBadge } from "@/components/common";
import { IntegrationService } from "@/domain/integrations/service";
import type { IntegrationCategory, IntegrationStatus } from "@/domain/integrations/types";

const categoryIcon: Record<IntegrationCategory, LucideIcon> = {
  AI: Sparkles, Social: Share2, Google: Search, Communication: MessageSquare,
  Analytics: BarChart3, Storage: HardDrive, Payments: CreditCard,
};

const statusTone: Record<IntegrationStatus, "success" | "info" | "warning" | "accent"> = {
  "Not Connected": "warning",
  "Planned":       "info",
  "Ready":         "success",
  "Future":        "accent",
};

export default function InternalIntegrations() {
  const counts = IntegrationService.countByStatus();
  const categories = IntegrationService.categories();

  return (
    <div className="min-h-screen bg-background text-foreground px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto">
      <PageHeader
        title="Integration Center"
        description="Future-ready map of every external system Veroxa will plug into. Demo registry today — connections wire up post-launch."
        testId="header-integrations"
      />
      <DemoOnlyBanner
        message="No integrations are connected. This page describes the destination state and how the system will route to each provider."
        testId="banner-integrations"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricTile icon={Plug} label="Not Connected" value={counts["Not Connected"]} testId="tile-not-connected" />
        <MetricTile icon={Plug} label="Planned"       value={counts["Planned"]}       testId="tile-planned"       accent="text-sky-300" />
        <MetricTile icon={Plug} label="Ready"         value={counts["Ready"]}         testId="tile-ready"         accent="text-emerald-300" />
        <MetricTile icon={Plug} label="Future"        value={counts["Future"]}        testId="tile-future"        accent="text-violet-300" />
      </div>

      <div className="space-y-4">
        {categories.map((cat) => {
          const Icon = categoryIcon[cat];
          const items = IntegrationService.byCategory(cat);
          return (
            <Card key={cat} className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  {cat}
                  <span className="text-[10px] text-muted-foreground ml-1">{items.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((i) => (
                  <div
                    key={i.id}
                    className="rounded-md border border-border bg-muted/20 p-3 flex flex-col gap-2"
                    data-testid={`integration-${i.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{i.name}</p>
                        <p className="text-[11px] text-muted-foreground">{i.description}</p>
                      </div>
                      <StatusBadge tone={statusTone[i.status]} testId={`status-${i.id}`}>{i.status}</StatusBadge>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Last sync: {i.lastSyncAt ?? "—"}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="h-7 px-2 text-[11px]"
                        data-testid={`configure-${i.id}`}
                      >
                        Configure later
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

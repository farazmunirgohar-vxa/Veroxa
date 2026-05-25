import {
  Building2,
  Clock,
  User,
  ArrowRight,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import {
  demoWorkQueue,
  getRestaurantName,
  type WorkQueueStatus,
} from "@/data/demoData";

const statusColor: Record<WorkQueueStatus, string> = {
  "Healthy":           "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  "Attention Needed":  "border-amber-500/40 text-amber-300 bg-amber-500/10",
  "Waiting On Client": "border-sky-500/40 text-sky-300 bg-sky-500/10",
  "Ready To Post":     "border-violet-500/40 text-violet-300 bg-violet-500/10",
  "Reporting Due":     "border-rose-500/40 text-rose-300 bg-rose-500/10",
};

const priorityColor: Record<string, string> = {
  High:   "border-rose-500/40 text-rose-300 bg-rose-500/10",
  Medium: "border-amber-500/40 text-amber-300 bg-amber-500/10",
  Low:    "border-muted-foreground/40 text-muted-foreground bg-muted/30",
};

export default function TeamWorkQueue() {
  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          data-testid="header-work-queue"
        >
          Client Work Queue
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Current status, next action, and assigned team member for every active
          client.
        </p>
      </div>

      <DemoOnlyBanner
        message="Demo only — queue items and statuses are sample data."
        testId="banner-work-queue"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {demoWorkQueue.map((item) => (
          <Card
            key={item.clientId}
            className="bg-card border-border"
            data-testid={`work-item-${item.clientId}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-md bg-primary/10 text-primary flex-shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base leading-snug">
                      {getRestaurantName(item.clientId)}
                    </CardTitle>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded border ${statusColor[item.status]}`}
                      >
                        {item.status}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${priorityColor[item.priority]}`}
                      >
                        {item.priority} priority
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-primary flex-shrink-0" />
                <p className="leading-relaxed">{item.nextAction}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {item.lastActivity}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> {item.assignedTo}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}

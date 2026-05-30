import {
  CheckCircle2,
  CircleDashed,
  AlertTriangle,
  Bot,
  User,
  Cog,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import {
  demoActivityEvents,
  getRestaurantName,
  type ActivityRole,
} from "@/data/demoData";

const roleIcon: Record<ActivityRole, typeof CheckCircle2> = {
  agent:    Bot,
  team:     User,
  client:   User,
  system:   Cog,
};

const roleColor: Record<ActivityRole, string> = {
  agent:    "text-primary bg-primary/10",
  team:     "text-emerald-400 bg-emerald-500/10",
  client:   "text-sky-400 bg-sky-500/10",
  system:   "text-muted-foreground bg-muted/30",
};

const statusIcon: Record<string, typeof CheckCircle2> = {
  completed:   CheckCircle2,
  in_progress: CircleDashed,
  warning:     AlertTriangle,
};

const statusColor: Record<string, string> = {
  completed:   "text-emerald-400",
  in_progress: "text-amber-400",
  warning:     "text-rose-400",
};

export default function TeamActivityFeed() {
  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          data-testid="header-activity-feed"
        >
          Activity Feed
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          A real-time record of all team, agent, and system activity across the
          portfolio.
        </p>
      </div>

      <DemoOnlyBanner
        message="Demo only — activity events are sample data showing the future live feed."
        testId="banner-activity-feed"
      />

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">
            Latest activity — {demoActivityEvents.length} events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border/60" />

            <div className="space-y-1">
              {demoActivityEvents.map((event, idx) => {
                const RoleIcon   = roleIcon[event.role];
                const StatusIcon = statusIcon[event.status];
                return (
                  <div
                    key={event.id}
                    className="relative pl-12 py-3"
                    data-testid={`activity-event-${event.id}`}
                  >
                    {/* Role avatar */}
                    <div
                      className={`absolute left-2 top-3 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${roleColor[event.role]}`}
                    >
                      <RoleIcon className="w-3.5 h-3.5" />
                    </div>

                    <div
                      className={`rounded-md border border-border bg-muted/20 p-3 ${
                        idx === 0 ? "border-primary/30 bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{event.eventType}</p>
                        <StatusIcon
                          className={`w-3.5 h-3.5 ${statusColor[event.status]}`}
                        />
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {event.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/85 leading-relaxed mb-1">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="capitalize">{event.role}</span>
                        <span>·</span>
                        <span>{getRestaurantName(event.clientId)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

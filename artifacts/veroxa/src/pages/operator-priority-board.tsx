import { Building2, ArrowRight, ShieldCheck, ShieldAlert, ShieldX, Shield } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import {
  demoClientPriorities,
  getRestaurantName,
  type ClientPriorityLevel,
  type ClientHealthStatus,
} from "@/data/demoData";

const priorityOrder: ClientPriorityLevel[] = ["Critical", "High", "Normal", "Low"];

const healthIcon: Record<ClientHealthStatus, typeof ShieldCheck> = {
  Excellent: ShieldCheck,
  Healthy:   Shield,
  Warning:   ShieldAlert,
  Critical:  ShieldX,
};

const healthColor: Record<ClientHealthStatus, string> = {
  Excellent: "text-emerald-400",
  Healthy:   "text-sky-400",
  Warning:   "text-amber-400",
  Critical:  "text-rose-400",
};

const priorityBorder: Record<ClientPriorityLevel, string> = {
  Critical: "border-l-rose-500",
  High:     "border-l-amber-500",
  Normal:   "border-l-sky-500",
  Low:      "border-l-border",
};

const priorityLabelColor: Record<ClientPriorityLevel, string> = {
  Critical: "border-rose-500/40 text-rose-300 bg-rose-500/10",
  High:     "border-amber-500/40 text-amber-300 bg-amber-500/10",
  Normal:   "border-sky-500/40 text-sky-300 bg-sky-500/10",
  Low:      "border-muted-foreground/40 text-muted-foreground bg-muted/30",
};

export default function OperatorPriorityBoard() {
  const grouped = priorityOrder
    .map((level) => ({
      level,
      clients: demoClientPriorities.filter((c) => c.priorityLevel === level),
    }))
    .filter((g) => g.clients.length > 0);

  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          data-testid="header-priority-board"
        >
          Client Priority Board
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          At-a-glance view of every client ranked by urgency — see who needs
          immediate attention.
        </p>
      </div>

      <DemoOnlyBanner
        message="Demo only — priority levels and health statuses are illustrative sample data."
        testId="banner-priority-board"
      />

      <div className="space-y-6">
        {grouped.map(({ level, clients }) => (
          <section key={level} data-testid={`priority-group-${level.toLowerCase()}`}>
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded border ${priorityLabelColor[level]}`}
              >
                {level}
              </span>
              <span className="text-xs text-muted-foreground">
                {clients.length} client{clients.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {clients.map((client) => {
                const HealthIcon = healthIcon[client.healthStatus];
                return (
                  <Card
                    key={client.clientId}
                    className={`bg-card border border-border border-l-4 ${priorityBorder[level]}`}
                    data-testid={`priority-card-${client.clientId}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <CardTitle className="text-sm font-semibold">
                            {getRestaurantName(client.clientId)}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <HealthIcon className={`w-4 h-4 ${healthColor[client.healthStatus]}`} />
                          <span className={`text-xs font-medium ${healthColor[client.healthStatus]}`}>
                            {client.healthStatus}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2.5">
                      {client.riskFactors.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {client.riskFactors.map((f) => (
                            <Badge
                              key={f}
                              variant="outline"
                              className="text-[10px] border-rose-500/30 text-rose-300 bg-rose-500/10"
                            >
                              {f}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="rounded-md border border-primary/20 bg-primary/5 px-2.5 py-2 flex items-start gap-1.5 text-xs">
                        <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-primary flex-shrink-0" />
                        <p>{client.nextAction}</p>
                      </div>

                      <p className="text-[10px] text-muted-foreground">
                        Last update: {client.lastUpdate}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </PortalLayout>
  );
}

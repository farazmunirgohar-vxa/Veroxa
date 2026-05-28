import { PortalLayout } from "@/components/PortalLayout";
import { ClientHealthCenter } from "@/components/ClientHealthCenter";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { healthRepository } from "@/lib/repositories";

export default function OperatorClientHealth() {
  const summary = healthRepository.getHealthSummary();
  const operatorActionClients = healthRepository.getClientsNeedingOperatorAction();

  const tiles: { label: string; value: number; testId: string; tone: string }[] = [
    { label: "Total clients",       value: summary.total,           testId: "och-tile-total",     tone: "text-foreground" },
    { label: "Healthy",             value: summary.healthy,         testId: "och-tile-healthy",   tone: "text-emerald-400" },
    { label: "Caution",             value: summary.caution,         testId: "och-tile-caution",   tone: "text-amber-400" },
    { label: "Urgent",              value: summary.urgent,          testId: "och-tile-urgent",    tone: "text-rose-400" },
    { label: "Operator actions",    value: summary.operatorActions, testId: "och-tile-operator",  tone: "text-foreground" },
    { label: "Owner escalations",   value: summary.ownerEscalations,testId: "och-tile-owner",     tone: "text-foreground" },
  ];

  return (
    <PortalLayout
      items={operatorPortalNavItems}
      portalName="Operator Portal"
    >
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2
            className="text-2xl md:text-3xl font-bold tracking-tight text-foreground"
            data-testid="header-client-health"
          >
            Client Health Center
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Per-client health view for operators — main issues, recommended
            actions, and assigned team.
          </p>
        </div>
        <Badge
          variant="outline"
          className="self-start border-border bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground"
          data-testid="badge-data-source-operator-health"
        >
          Source: Demo repository layer
        </Badge>
      </div>

      <DemoOnlyBanner
        message="Demo only — operational health signals are illustrative. No real monitoring is connected."
        testId="banner-operator-health"
      />

      <Card className="bg-card/50 border-border/50 mb-4" data-testid="operator-health-summary">
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4">
          {tiles.map((t) => (
            <div key={t.label} data-testid={t.testId}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.label}</p>
              <p className={`text-xl font-semibold tabular-nums ${t.tone}`}>{t.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {operatorActionClients.length > 0 && (
        <Card
          className="bg-amber-500/5 border-amber-500/30 mb-4"
          data-testid="operator-action-required-list"
        >
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-amber-300 font-semibold mb-2">
              Operator action required ({operatorActionClients.length})
            </p>
            <ul className="space-y-1">
              {operatorActionClients.map((c) => (
                <li
                  key={c.clientId}
                  className="text-xs text-foreground/90 flex items-baseline justify-between gap-3"
                  data-testid={`operator-action-row-${c.clientId}`}
                >
                  <span className="font-medium">{c.businessName}</span>
                  <span className="text-muted-foreground truncate">{c.riskReason}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <ClientHealthCenter viewerRole="operator" />
    </PortalLayout>
  );
}

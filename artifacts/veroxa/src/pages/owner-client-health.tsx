// TODO(client-health-drift): this page renders the portfolio health center via
//   <ClientHealthCenter />, which reads `demoClientHealth` directly with the
//   non-canonical vocabulary `healthy | attention | critical`. The canonical
//   source is `ClientHealthEngine.profiles()` + `portfolioSummary()` in
//   `src/domain/clientHealth/engine.ts`, which emits the canonical vocabulary
//   `Healthy | Caution | Urgent | Broken`. See
//   `docs/CLIENT_HEALTH_ENGINE_CONTRACT.md` §5.1 (Owner shell) and
//   `docs/CLIENT_HEALTH_SURFACE_MAP.md` §2 for the full audit. No fix in this
//   pass — documentation only.
import { PortalLayout } from "@/components/PortalLayout";
import { ClientHealthCenter } from "@/components/ClientHealthCenter";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  clientRepository,
  healthRepository,
  reportRepository,
} from "@/lib/repositories";

export default function OwnerClientHealth() {
  const lifecycle = clientRepository.getClientLifecycleSummary();
  const health = healthRepository.getHealthSummary();
  const reporting = reportRepository.getOwnerReportingSummary();
  const escalations = healthRepository.getOwnerEscalationClients();

  const portfolioTiles = [
    { label: "Clients",          value: lifecycle.total,           testId: "och-portfolio-total" },
    { label: "Active",           value: lifecycle.active,          testId: "och-portfolio-active" },
    { label: "Onboarding",       value: lifecycle.onboarding,      testId: "och-portfolio-onboarding" },
    { label: "At risk",          value: lifecycle.atRisk,          testId: "och-portfolio-at-risk" },
    { label: "Owner escalations",value: health.ownerEscalations,   testId: "och-portfolio-escalations" },
    { label: "Reports awaiting", value: reporting.weeklyAwaitingOperator + reporting.monthlyNeedingApproval, testId: "och-portfolio-reports-awaiting" },
  ];

  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2
            className="text-2xl md:text-3xl font-bold tracking-tight text-foreground"
            data-testid="header-client-health"
          >
            Client Health Center
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Portfolio-wide view of which restaurants are healthy, need attention,
            or are at risk.
          </p>
        </div>
        <Badge
          variant="outline"
          className="self-start border-border bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground"
          data-testid="badge-data-source-owner-health"
        >
          Source: Demo repository layer
        </Badge>
      </div>

      <DemoOnlyBanner
        message="Demo only — health scores, signals, and recommended actions are illustrative. No real scoring logic, monitoring, or backend is connected."
        testId="banner-owner-health"
      />

      <Card className="bg-card/50 border-border/50 mb-4" data-testid="owner-portfolio-summary">
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4">
          {portfolioTiles.map((t) => (
            <div key={t.label} data-testid={t.testId}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.label}</p>
              <p className="text-xl font-semibold tabular-nums text-foreground">{t.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {escalations.length > 0 && (
        <Card
          className="bg-rose-500/5 border-rose-500/30 mb-4"
          data-testid="owner-escalation-list"
        >
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-rose-300 font-semibold mb-2">
              Owner escalation required ({escalations.length})
            </p>
            <ul className="space-y-1">
              {escalations.map((c) => (
                <li
                  key={c.clientId}
                  className="text-xs text-foreground/90 flex items-baseline justify-between gap-3"
                  data-testid={`owner-escalation-row-${c.clientId}`}
                >
                  <span className="font-medium">{c.businessName}</span>
                  <span className="text-muted-foreground truncate">{c.riskReason}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <ClientHealthCenter viewerRole="owner" />
    </PortalLayout>
  );
}

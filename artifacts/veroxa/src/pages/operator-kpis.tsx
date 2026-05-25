import { PortalLayout } from "@/components/PortalLayout";
import { KpiDashboardView } from "@/components/KpiDashboardView";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function OperatorKpis() {
  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground" data-testid="header-kpis">
          KPI Dashboard
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Operational metrics for the operator — task throughput, review queue, content readiness.
        </p>
      </div>
      <DemoOnlyBanner
        message="Demo only — operational values are illustrative."
        testId="banner-operator-kpis"
      />
      <KpiDashboardView viewerRole="operator" />
    </PortalLayout>
  );
}

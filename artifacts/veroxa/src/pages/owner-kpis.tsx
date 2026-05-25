import { PortalLayout } from "@/components/PortalLayout";
import { KpiDashboardView } from "@/components/KpiDashboardView";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function OwnerKpis() {
  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground" data-testid="header-kpis">
          KPI Dashboard
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          High-level performance metrics across the agency portfolio.
        </p>
      </div>
      <DemoOnlyBanner
        message="Demo only — KPI values are illustrative. No live analytics, billing processor, or database is connected."
        testId="banner-owner-kpis"
      />
      <KpiDashboardView viewerRole="owner" />
    </PortalLayout>
  );
}

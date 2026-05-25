import { PortalLayout } from "@/components/PortalLayout";
import { ClientHealthCenter } from "@/components/ClientHealthCenter";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function OperatorClientHealth() {
  return (
    <PortalLayout
      items={operatorPortalNavItems}
      portalName="Operator Portal"
    >
      <div className="mb-6">
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

      <DemoOnlyBanner
        message="Demo only — operational health signals are illustrative. No real monitoring is connected."
        testId="banner-operator-health"
      />

      <ClientHealthCenter viewerRole="operator" />
    </PortalLayout>
  );
}

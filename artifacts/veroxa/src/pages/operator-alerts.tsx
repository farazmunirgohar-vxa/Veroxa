import { PortalLayout } from "@/components/PortalLayout";
import { NotificationCenter } from "@/components/NotificationCenter";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function OperatorAlerts() {
  return (
    <PortalLayout
      items={operatorPortalNavItems}
      portalName="Operator Portal"
    >
      <div className="mb-6">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight text-foreground"
          data-testid="header-alerts"
        >
          Notification Center
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Operational alerts that the operator should notice quickly.
        </p>
      </div>

      <DemoOnlyBanner
        message="Demo only — notifications are illustrative. No real notification system, paging, or escalation is connected."
        testId="banner-operator-alerts"
      />

      <NotificationCenter viewerRole="operator" />
    </PortalLayout>
  );
}

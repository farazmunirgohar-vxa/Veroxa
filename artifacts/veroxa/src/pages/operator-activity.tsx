import { PortalLayout } from "@/components/PortalLayout";
import { ActivityTimelineView } from "@/components/ActivityTimelineView";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function OperatorActivity() {
  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground" data-testid="header-activity">
          Activity Timeline
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Operational history of what Veroxa is doing for each client.
        </p>
      </div>
      <DemoOnlyBanner
        message="Demo only — timeline events are illustrative."
        testId="banner-operator-activity"
      />
      <ActivityTimelineView viewerRole="operator" />
    </PortalLayout>
  );
}

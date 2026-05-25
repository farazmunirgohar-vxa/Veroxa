import { PortalLayout } from "@/components/PortalLayout";
import { ActivityTimelineView } from "@/components/ActivityTimelineView";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function OwnerActivity() {
  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground" data-testid="header-activity">
          Activity Timeline
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Chronological operational history across the client portfolio.
        </p>
      </div>
      <DemoOnlyBanner
        message="Demo only — timeline events are illustrative. No real tracking, logging, or backend is connected."
        testId="banner-owner-activity"
      />
      <ActivityTimelineView viewerRole="owner" />
    </PortalLayout>
  );
}

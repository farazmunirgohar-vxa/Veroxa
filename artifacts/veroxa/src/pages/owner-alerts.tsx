import { PortalLayout } from "@/components/PortalLayout";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function OwnerAlerts() {
  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-6">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight text-foreground"
          data-testid="header-owner-alerts"
        >
          Notification Center
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Business-level alerts and operational signals across the client
          portfolio.
        </p>
      </div>

      <DemoOnlyBanner
        message="Demo only — notifications are illustrative. No real notification system, email, SMS, push, or automation is connected."
        testId="banner-owner-alerts"
      />

      <NotificationCenter viewerRole="owner" />
    </PortalLayout>
  );
}

import { PortalLayout } from "@/components/PortalLayout";
import { MediaInventoryView } from "@/components/MediaInventoryView";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function OperatorMediaInventory() {
  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground" data-testid="header-media-inventory">
          Media Inventory
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Track restaurant content supply, statuses, and which clients are running low.
        </p>
      </div>
      <DemoOnlyBanner
        message="Demo only — no file uploads, storage, or AI image analysis is connected."
        testId="banner-operator-media-inventory"
      />
      <MediaInventoryView viewerRole="operator" />
    </PortalLayout>
  );
}

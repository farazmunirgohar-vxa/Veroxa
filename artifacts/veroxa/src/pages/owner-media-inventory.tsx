import { PortalLayout } from "@/components/PortalLayout";
import { MediaInventoryView } from "@/components/MediaInventoryView";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function OwnerMediaInventory() {
  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground" data-testid="header-media-inventory">
          Media Inventory
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Portfolio-wide view of restaurant content supply, statuses, and campaigns.
        </p>
      </div>
      <DemoOnlyBanner
        message="Demo only — media items are illustrative. No file uploads, storage, AI image analysis, or backend is connected."
        testId="banner-owner-media-inventory"
      />
      <MediaInventoryView viewerRole="owner" />
    </PortalLayout>
  );
}

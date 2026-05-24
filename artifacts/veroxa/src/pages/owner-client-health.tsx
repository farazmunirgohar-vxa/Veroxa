import { PortalLayout } from "@/components/PortalLayout";
import { Progress } from "@/components/ui/progress";
import { clientHealthBands } from "@/lib/demo-data";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function OwnerClientHealth() {
  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-client-health">Client Health</h2>
        <p className="text-muted-foreground mt-1">Distribution of your portfolio across health score bands.</p>
      </div>

      <DemoOnlyBanner message="Static demo — Green / Yellow / Red bands and client examples are illustrative only. No real portfolio analytics are connected." testId="banner-owner-health" />

      <div className="space-y-3">
        {clientHealthBands.map((band, i) => (
          <div key={i} className="flex items-center gap-4" data-testid={`health-band-${i}`}>
            <span className="text-sm text-muted-foreground w-44 flex-shrink-0">{band.band}</span>
            <Progress value={band.pct} className="h-2 flex-1" />
            <span className="text-sm font-semibold w-20 text-right">{band.count} clients</span>
          </div>
        ))}
      </div>
    </PortalLayout>
  );
}

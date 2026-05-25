import { PortalLayout } from "@/components/PortalLayout";
import { WeeklyReportView } from "@/components/WeeklyReportView";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function OwnerWeeklyReports() {
  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground" data-testid="header-weekly-reports">
          Weekly Reports
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Weekly client update preview across the portfolio.
        </p>
      </div>
      <DemoOnlyBanner
        message="Demo only — read-only preview. No real reporting automation, analytics, or backend is connected."
        testId="banner-owner-weekly-reports"
      />
      <WeeklyReportView viewerRole="owner" />
    </PortalLayout>
  );
}

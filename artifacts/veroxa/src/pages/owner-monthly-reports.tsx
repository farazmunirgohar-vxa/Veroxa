import { PortalLayout } from "@/components/PortalLayout";
import { MonthlyReportView } from "@/components/MonthlyReportView";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function OwnerMonthlyReports() {
  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground" data-testid="header-monthly-reports">
          Monthly Executive Reports
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Monthly growth, trends, and strategic notes across the portfolio.
        </p>
      </div>
      <DemoOnlyBanner
        message="Demo only — read-only. No real analytics, exports, or backend is connected."
        testId="banner-owner-monthly-reports"
      />
      <MonthlyReportView viewerRole="owner" />
    </PortalLayout>
  );
}

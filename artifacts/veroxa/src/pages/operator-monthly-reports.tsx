import { PortalLayout } from "@/components/PortalLayout";
import { MonthlyReportView } from "@/components/MonthlyReportView";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function OperatorMonthlyReports() {
  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground" data-testid="header-monthly-reports">
          Monthly Reports
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Monthly executive summaries for operator review.
        </p>
      </div>
      <DemoOnlyBanner
        message="Demo only — read-only. No real analytics or backend is connected."
        testId="banner-operator-monthly-reports"
      />
      <MonthlyReportView viewerRole="operator" />
    </PortalLayout>
  );
}

import { PortalLayout } from "@/components/PortalLayout";
import { WeeklyReportView } from "@/components/WeeklyReportView";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function OperatorWeeklyReports() {
  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground" data-testid="header-weekly-reports">
          Weekly Reports
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Weekly client update preview — review drafts before they go out.
        </p>
      </div>
      <DemoOnlyBanner
        message="Demo only — read-only preview. No real reporting automation is connected."
        testId="banner-operator-weekly-reports"
      />
      <WeeklyReportView viewerRole="operator" />
    </PortalLayout>
  );
}

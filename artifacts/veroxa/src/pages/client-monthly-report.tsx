import { PortalLayout } from "@/components/PortalLayout";
import { MonthlyReportView } from "@/components/MonthlyReportView";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function ClientMonthlyReport() {
  const { source, dataSourceMessage } = useClientPortalData();
  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground" data-testid="header-client-monthly-report">
          Monthly Report
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          A preview of your monthly executive summary.
        </p>
        <DataSourceBadge source={source} message={dataSourceMessage} />
      </div>
      <DemoOnlyBanner
        message="Demo only — read-only preview. No real analytics or exports."
        testId="banner-client-monthly-report"
      />
      <MonthlyReportView viewerRole="client" clientId="demo-a" />
    </PortalLayout>
  );
}

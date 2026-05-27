import { PortalLayout } from "@/components/PortalLayout";
import { WeeklyReportView } from "@/components/WeeklyReportView";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function ClientWeeklyReport() {
  const { source, dataSourceMessage } = useClientPortalData();
  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground" data-testid="header-client-weekly-report">
          Weekly Report
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          A preview of what your weekly Veroxa update will look like.
        </p>
        <DataSourceBadge source={source} message={dataSourceMessage} />
      </div>
      <DemoOnlyBanner
        message="Demo only — read-only preview. No real analytics or automation is connected."
        testId="banner-client-weekly-report"
      />
      <WeeklyReportView viewerRole="client" clientId="demo-a" />
    </PortalLayout>
  );
}

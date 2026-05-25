import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { reportApprovals } from "@/lib/demo-data";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function OperatorReportApprovals() {
  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-report-approvals">Report Approvals</h2>
        <p className="text-muted-foreground mt-1">Monthly client reports awaiting your sign-off before sending.</p>
      </div>

      <DemoOnlyBanner message="Demo only — no approval actions are wired. Report statuses illustrate the future approval flow only." testId="banner-operator-approvals" />

      <div className="grid sm:grid-cols-2 gap-3">
        {reportApprovals.map((report, i) => (
          <Card key={i} className="bg-card border-border" data-testid={`report-approval-${i}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{report.client}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{report.period} · {report.preparedBy}</p>
                </div>
                <Badge variant="outline" className={cn("border-none",
                  report.status === "Ready" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                )}>
                  {report.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}

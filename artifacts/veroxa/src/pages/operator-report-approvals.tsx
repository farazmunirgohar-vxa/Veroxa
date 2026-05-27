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
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{report.client}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{report.period} · {report.preparedBy}</p>
                </div>
                <Badge variant="outline" className={cn("border-none flex-shrink-0",
                  report.status === "Ready" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                )}>
                  {report.status}
                </Badge>
              </div>

              {/* Summary preview */}
              <div className="rounded-md border border-border/50 bg-muted/20 p-2.5 text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between"><span>Posts published</span><span className="text-foreground font-medium">{8 + i * 3}</span></div>
                <div className="flex justify-between"><span>Estimated reach</span><span className="text-foreground font-medium">{(38000 + i * 4200).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Consistency</span><span className="text-foreground font-medium">{90 + i}%</span></div>
              </div>

              {/* Internal note */}
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="border-violet-500/30 bg-violet-500/10 text-violet-300 text-[10px] flex-shrink-0">
                  Internal
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {i % 2 === 0 ? "All posts met quality bar. Schedule was consistent." : "One post rescheduled due to late media delivery."}
                </p>
              </div>

              {/* Demo approve button */}
              <div className="border-t border-border/50 pt-2 flex gap-2">
                <button
                  className="rounded px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                  onClick={() => {}}
                >
                  Approve — Demo
                </button>
                <button
                  className="rounded px-3 py-1.5 text-xs font-medium bg-muted/30 text-muted-foreground border border-border hover:bg-muted/50 transition-colors"
                  onClick={() => {}}
                >
                  Request revision
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/70">Demo only — no approval is saved</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}

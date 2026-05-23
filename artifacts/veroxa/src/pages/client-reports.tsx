import { ChevronRight } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";

export default function ClientReports() {
  const { data } = useClientPortalData();
  const report = data.monthlyReportPreview;

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <h2 className="text-3xl font-bold tracking-tight">Monthly Report</h2>
      <p className="text-muted-foreground -mt-6">Your most recent monthly performance report.</p>

      <div className="max-w-md">
        <Card className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer" data-testid="monthly-report-preview">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">{report.title}</span>
              <Badge variant="outline" className={`border-none ${
                report.status === "In Review"
                  ? "bg-amber-500/10 text-amber-500"
                  : report.status === "Drafting"
                  ? "bg-muted text-muted-foreground"
                  : "bg-emerald-500/10 text-emerald-500"
              }`}>
                {report.status}
              </Badge>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between"><span>Posts published</span><span className="text-foreground font-medium">{report.postsPublished}</span></div>
              <div className="flex justify-between"><span>Total reach</span><span className="text-foreground font-medium">41,200</span></div>
              <div className="flex justify-between"><span>Google impressions</span><span className="text-foreground font-medium">12,580</span></div>
              <div className="flex justify-between"><span>New reviews</span><span className="text-foreground font-medium">6</span></div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-primary">
              View full report <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}

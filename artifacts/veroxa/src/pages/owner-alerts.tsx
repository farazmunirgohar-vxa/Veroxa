import { AlertTriangle } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { ownerCriticalAlerts as criticalAlerts } from "@/lib/demo-data";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";

export default function OwnerAlerts() {
  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-owner-alerts">Critical Alerts</h2>
        <p className="text-muted-foreground mt-1">High-priority business-level risk items requiring attention.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {criticalAlerts.map((alert, i) => (
          <Card key={i} className={`border ${alert.severity === "Critical" ? "border-red-500/30 bg-red-500/5" : "border-amber-500/30 bg-amber-500/5"}`} data-testid={`critical-alert-${i}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${alert.severity === "Critical" ? "text-red-500" : "text-amber-500"}`} />
                <div>
                  <p className="text-sm font-semibold">{alert.client}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.issue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}

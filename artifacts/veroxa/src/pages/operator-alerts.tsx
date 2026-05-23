import { AlertTriangle } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Badge } from "@/components/ui/badge";
import { operatorAlerts as alerts } from "@/lib/demo-data";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function OperatorAlerts() {
  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-alerts">Active Alerts</h2>
        <p className="text-muted-foreground mt-1">Critical and warning-level issues across your client portfolio.</p>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <div key={i} className={cn(
            "flex items-start gap-4 p-4 rounded-xl border",
            alert.severity === "Critical" ? "border-red-500/30 bg-red-500/5" :
            alert.severity === "Warning"  ? "border-amber-500/30 bg-amber-500/5" :
            "border-border bg-card/50"
          )} data-testid={`alert-row-${i}`}>
            <AlertTriangle className={cn("w-4 h-4 mt-0.5 flex-shrink-0",
              alert.severity === "Critical" ? "text-red-500" :
              alert.severity === "Warning"  ? "text-amber-500" :
              "text-muted-foreground"
            )} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground">{alert.client}</span>
                <span className="text-xs text-muted-foreground">{alert.time}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{alert.message}</p>
            </div>
            <Badge variant="outline" className={cn("border-none flex-shrink-0",
              alert.severity === "Critical" ? "bg-red-500/10 text-red-500" :
              alert.severity === "Warning"  ? "bg-amber-500/10 text-amber-500" :
              "bg-blue-500/10 text-blue-500"
            )}>
              {alert.severity}
            </Badge>
          </div>
        ))}
      </div>
    </PortalLayout>
  );
}

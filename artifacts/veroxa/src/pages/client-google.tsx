import { TrendingUp } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";

export default function ClientGoogle() {
  const { data } = useClientPortalData();

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <h2 className="text-3xl font-bold tracking-tight">Google Visibility</h2>
      <p className="text-muted-foreground -mt-6">Your Google Business Profile performance this month.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {data.googleMetrics.map((metric, i) => (
          <Card key={i} className="bg-card/50 border-border/50 shadow-sm" data-testid={`google-metric-${i}`}>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground mb-2">{metric.label}</p>
              <p className="text-2xl font-bold">{metric.value}</p>
              <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${metric.positive ? "text-emerald-500" : "text-red-500"}`}>
                <TrendingUp className="w-3 h-3" /> {metric.change} this month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}

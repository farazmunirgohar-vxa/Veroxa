import { CheckCircle2 } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";

export default function ClientUpdates() {
  const { data } = useClientPortalData();

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <h2 className="text-3xl font-bold tracking-tight">Updates</h2>
      <p className="text-muted-foreground -mt-6">Your latest weekly update from the Veroxa team.</p>

      <div className="max-w-2xl">
        <Card className="bg-card border-border" data-testid="weekly-update">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{data.weeklyUpdate.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {data.weeklyUpdate.summaryItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}

import { Network, ArrowDown } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoSystemMap } from "@/data/demoData";

export default function OwnerSystemMap() {
  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-system-map">
          Veroxa System Map
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          The master architecture — every layer of the Veroxa OS and how they connect.
        </p>
      </div>

      <DemoOnlyBanner message="Demo only — system map is conceptual documentation." testId="banner-system-map" />

      <div className="flex flex-col items-center gap-0">
        {demoSystemMap.map((layer, i) => {
          const isLast = i === demoSystemMap.length - 1;
          return (
            <div key={layer.id} className="w-full max-w-3xl flex flex-col items-center">
              <Card className={`w-full bg-card border-2 ${layer.color}`} data-testid={`system-layer-${layer.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${layer.color}`}>
                      <Network className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{layer.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{layer.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5 pl-12">
                    {layer.modules.map((m) => (
                      <Badge key={m} variant="outline" className="text-[10px] border-border text-foreground/80">{m}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
              {!isLast && (
                <div className="py-1.5 text-muted-foreground/60">
                  <ArrowDown className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PortalLayout>
  );
}

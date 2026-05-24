import { Image as ImageIcon, CheckCircle2, AlertTriangle } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

const mediaItems = [
  { id: 1, title: "Lamb shoulder closeup",   client: "Mamadali Kebab House", quality: "Approved",    note: "Sharp focus, strong lighting"        },
  { id: 2, title: "Mixed grill platter",     client: "Mamadali Kebab House", quality: "Approved",    note: "Good plating, on-brand"              },
  { id: 3, title: "Storefront wide shot",    client: "Mamadali Kebab House", quality: "Needs Reshoot", note: "Underexposed — reshoot at golden hour" },
  { id: 4, title: "Behind-the-scenes prep",  client: "Mamadali Kebab House", quality: "Approved",    note: "Authentic, hands-on feel"            },
  { id: 5, title: "Dessert tray detail",     client: "Mamadali Kebab House", quality: "Needs Crop",  note: "Crop to 4:5 for Instagram"           },
];

export default function TeamMediaReview() {
  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-media-review">Media Review</h2>
        <p className="text-muted-foreground mt-1">Review and approve media assets from this week's shoot.</p>
      </div>

      <DemoOnlyBanner message="No real uploaded media is being reviewed yet. Tags, status badges, and queue states below are static and illustrate the future review workflow only." testId="banner-team-media" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaItems.map((item) => {
          const approved = item.quality === "Approved";
          return (
            <Card key={item.id} className="bg-card border-border" data-testid={`media-item-${item.id}`}>
              <CardContent className="p-5">
                <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/10 via-card to-muted/40 border border-border/40 flex items-center justify-center mb-4">
                  <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-semibold leading-snug">{item.title}</h4>
                  <Badge variant="outline" className={`border-none flex-shrink-0 ${
                    approved ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                  }`}>
                    {item.quality}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{item.client}</p>
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  {approved
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  }
                  <span>{item.note}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PortalLayout>
  );
}

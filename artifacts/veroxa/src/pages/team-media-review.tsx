import { Image as ImageIcon, CheckCircle2, AlertTriangle, Sparkles, Flame, Users as UsersIcon, MapPin, Camera } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

const guidanceMatches: Array<{
  icon: typeof Flame;
  title: string;
  match: string;
  tone: "good" | "promo" | "google" | "warn";
}> = [
  { icon: Flame,    title: "Grill flame shot",         match: "Matches halal grill guidance",   tone: "good"   },
  { icon: UsersIcon, title: "Family platter",          match: "Good for weekend promo",         tone: "promo"  },
  { icon: MapPin,   title: "Storefront photo",         match: "Useful for Google visibility",   tone: "google" },
  { icon: Camera,   title: "Dark / blurry prep photo", match: "Needs better lighting",          tone: "warn"   },
];

const matchToneStyles: Record<string, string> = {
  good: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  promo: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30",
  google: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  warn: "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

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

      {/* Guidance Match — static preview of how Veroxa will compare uploads to the capture plan */}
      <Card className="bg-card border-primary/30 mb-6" data-testid="card-guidance-match">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-base font-semibold">Guidance Match</CardTitle>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px] font-semibold tracking-wide" data-testid="badge-guidance-match-demo">
                  Static demo — no AI / media analysis connected
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Static demo showing how Veroxa will compare uploaded media against the recommended capture plan.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {guidanceMatches.map((m, i) => {
              const Icon = m.icon;
              return (
                <li
                  key={m.title}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-md border border-border bg-muted/20"
                  data-testid={`guidance-match-${i}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium truncate">{m.title}</span>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${matchToneStyles[m.tone]}`}>
                    {m.match}
                  </span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

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

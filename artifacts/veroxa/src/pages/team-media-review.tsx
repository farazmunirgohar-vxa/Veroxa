import { CheckCircle2, AlertTriangle, Sparkles, Flame, Users as UsersIcon, MapPin, Camera } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { getDemoImagesByCategory } from "@/data/demo/demoImages";
import { EvidenceRecommendationCard } from "@/components/evidence/EvidenceRecommendationCard";
import { recommendNextPost } from "@/lib/evidence/evidenceSelectionEngine";

const FOOD_IMGS = getDemoImagesByCategory("food");

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
  { id: 1, title: "Lamb shoulder closeup",   client: "Demo Grill House", quality: "Approved",      note: "Sharp focus, strong lighting"          },
  { id: 2, title: "Mixed grill platter",     client: "Demo Grill House", quality: "Approved",      note: "Good plating, on-brand"                },
  { id: 3, title: "Storefront wide shot",    client: "Demo Grill House", quality: "Needs Reshoot", note: "Underexposed — reshoot at golden hour" },
  { id: 4, title: "Behind-the-scenes prep",  client: "Demo Grill House", quality: "Approved",      note: "Authentic, hands-on feel"              },
  { id: 5, title: "Dessert tray detail",     client: "Demo Grill House", quality: "Needs Crop",    note: "Crop to 4:5 for Instagram"             },
];

const teamEvidenceRec = recommendNextPost("demo-a");

export default function TeamMediaReview() {
  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground" data-testid="header-media-review">Media Review</h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">Review and approve media assets from this week's shoot.</p>
      </div>

      <DemoOnlyBanner message="No real uploaded media is being reviewed yet. Tags, status badges, and queue states below are static and illustrate the future review workflow only." testId="banner-team-media" />

      {/* Guidance Match — static preview of how Veroxa will compare uploads to the capture plan */}
      <Card className="bg-card border-primary/30 mb-6" data-testid="card-guidance-match">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-base font-semibold">Content Review Guidance</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                How each uploaded asset maps to the recommended capture plan for this client.
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

      {/* Evidence-Based Pick — evidence engine */}
      <div className="mb-6" data-testid="section-evidence-pick">
        <EvidenceRecommendationCard
          recommendation={teamEvidenceRec}
          variant="team"
          testId="team-evidence-recommendation"
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaItems.map((item, idx) => {
          const approved = item.quality === "Approved";
          const img = FOOD_IMGS[idx % FOOD_IMGS.length];
          return (
            <Card key={item.id} className="bg-card border-border overflow-hidden" data-testid={`media-item-${item.id}`}>
              <div className="aspect-video w-full overflow-hidden bg-muted/30">
                <img
                  src={img.url}
                  alt={img.alt}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <CardContent className="p-5 pt-4">
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
                {/* Demo-only action row */}
                <div className="mt-3 flex flex-wrap gap-2 border-t border-border/50 pt-3">
                  <button
                    className="rounded px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                    onClick={() => {}}
                  >
                    Accept
                  </button>
                  <button
                    className="rounded px-3 py-1 text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
                    onClick={() => {}}
                  >
                    Needs Better Photo
                  </button>
                  <button
                    className="rounded px-3 py-1 text-xs font-medium bg-muted/30 text-muted-foreground border border-border hover:bg-muted/50 transition-colors"
                    onClick={() => {}}
                  >
                    Use Later
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground/70">Demo only — no action is saved</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PortalLayout>
  );
}

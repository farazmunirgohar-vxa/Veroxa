import { useState } from "react";
import {
  Building2,
  UtensilsCrossed,
  Palette,
  Camera,
  StickyNote,
  Mail,
  Phone,
  Globe,
  MapPin,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import {
  getRestaurantProfile,
  getMenuItemsForClient,
  getBrandGuidelines,
  getMediaRequirements,
  getClientNotes,
  getRestaurantName,
  type MenuItemGroup,
  type MenuItemStatus,
} from "@/data/demoData";

const DEMO_CLIENT_ID = "mamadali";

const menuGroupLabel: Record<MenuItemGroup, string> = {
  featured: "Featured items",
  popular:  "Popular items",
  seasonal: "Seasonal items",
};

const menuStatusColor: Record<MenuItemStatus, string> = {
  "Available":    "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  "Limited":      "bg-amber-500/10 text-amber-300 border-amber-500/30",
  "Out of stock": "bg-rose-500/10 text-rose-300 border-rose-500/30",
  "Coming soon":  "bg-sky-500/10 text-sky-300 border-sky-500/30",
};

function progressRow(label: string, current: number, target: number) {
  const pct = target === 0 ? 0 : Math.min(100, Math.round((current / target) * 100));
  return (
    <div key={label}>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-foreground/90">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {current} / {target}
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}

export default function ClientWorkspace() {
  const [tab, setTab] = useState<"profile" | "menu" | "brand" | "media" | "preferences">(
    "profile",
  );

  const profile  = getRestaurantProfile(DEMO_CLIENT_ID);
  const menu     = getMenuItemsForClient(DEMO_CLIENT_ID);
  const brand    = getBrandGuidelines(DEMO_CLIENT_ID);
  const mediaReq = getMediaRequirements(DEMO_CLIENT_ID);
  const notes    = getClientNotes(DEMO_CLIENT_ID);

  const groupedMenu: Record<MenuItemGroup, typeof menu> = {
    featured: menu.filter((m) => m.group === "featured"),
    popular:  menu.filter((m) => m.group === "popular"),
    seasonal: menu.filter((m) => m.group === "seasonal"),
  };

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          data-testid="header-client-workspace"
        >
          Client Workspace
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Your restaurant profile, menu details, brand preferences, and media
          guidance in one place.
        </p>
      </div>

      <DemoOnlyBanner
        message="Demo only — this workspace shows sample data. No edits are saved."
        testId="banner-client-workspace"
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full mb-4">
          <TabsTrigger value="profile" data-testid="tab-profile">
            <Building2 className="w-4 h-4 mr-2" />Profile
          </TabsTrigger>
          <TabsTrigger value="menu" data-testid="tab-menu">
            <UtensilsCrossed className="w-4 h-4 mr-2" />Menu
          </TabsTrigger>
          <TabsTrigger value="brand" data-testid="tab-brand">
            <Palette className="w-4 h-4 mr-2" />Brand
          </TabsTrigger>
          <TabsTrigger value="media" data-testid="tab-media">
            <Camera className="w-4 h-4 mr-2" />Media
          </TabsTrigger>
          <TabsTrigger value="preferences" data-testid="tab-preferences">
            <StickyNote className="w-4 h-4 mr-2" />Preferences
          </TabsTrigger>
        </TabsList>

        {/* PROFILE */}
        <TabsContent value="profile" className="mt-0">
          {profile && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="bg-card border-border lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Restaurant profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <ProfileRow icon={Building2} label="Name"        value={getRestaurantName(DEMO_CLIENT_ID)} />
                  <ProfileRow icon={UtensilsCrossed} label="Cuisine" value={profile.cuisineType} />
                  <ProfileRow icon={MapPin}   label="Address"     value={profile.address} />
                  <ProfileRow icon={Phone}    label="Phone"       value={profile.phone} />
                  <ProfileRow icon={Globe}    label="Website"     value={profile.website} />
                  <ProfileRow icon={Clock}    label="Hours"       value={profile.hours} />
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10">
                      {profile.servicePlan}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      variant="outline"
                      className={
                        profile.accountStatus === "Active"
                          ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                          : profile.accountStatus === "At Risk"
                            ? "border-rose-500/40 text-rose-300 bg-rose-500/10"
                            : "border-amber-500/40 text-amber-300 bg-amber-500/10"
                      }
                    >
                      {profile.accountStatus}
                    </Badge>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Primary contact
                    </p>
                    <ContactBlock contact={profile.primaryContact} />
                  </div>
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Secondary contact
                    </p>
                    <ContactBlock contact={profile.secondaryContact} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* MENU */}
        <TabsContent value="menu" className="mt-0 space-y-4">
          {(Object.keys(groupedMenu) as MenuItemGroup[]).map((group) => (
            <Card key={group} className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {menuGroupLabel[group]}
                  <Badge variant="outline" className="text-[10px] ml-1">
                    {groupedMenu[group].length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groupedMenu[group].map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-border bg-muted/20 p-3"
                    data-testid={`menu-item-${item.id}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.category}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded border whitespace-nowrap ${menuStatusColor[item.status]}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 mb-2 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="text-[11px] text-muted-foreground border-t border-border pt-2">
                      <span className="text-primary">Suggested angle:</span>{" "}
                      {item.promotionAngle}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* BRAND */}
        <TabsContent value="brand" className="mt-0">
          {brand && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Voice & style</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Field label="Brand voice">{brand.brandVoice}</Field>
                  <Field label="Content style">{brand.contentStyle}</Field>
                  <Field label="Caption style">{brand.captionStyleNotes}</Field>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Visual identity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Primary colors
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {brand.primaryColors.map((c) => (
                        <div
                          key={c.hex}
                          className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-2 py-1.5"
                        >
                          <span
                            className="w-5 h-5 rounded-sm border border-border"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="text-xs">
                            {c.name}
                            <span className="text-muted-foreground ml-1.5">
                              {c.hex}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-muted-foreground">Logo</span>
                    <Badge
                      variant="outline"
                      className={
                        brand.logoStatus === "Provided"
                          ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                          : "border-amber-500/40 text-amber-300 bg-amber-500/10"
                      }
                    >
                      {brand.logoStatus}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Tone examples</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {brand.toneExamples.map((t, i) => (
                    <p
                      key={i}
                      className="rounded-md border border-border bg-muted/20 px-3 py-2 italic text-foreground/80"
                    >
                      “{t}”
                    </p>
                  ))}
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Things to avoid</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {brand.thingsToAvoid.map((t, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 text-rose-400 flex-shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* MEDIA */}
        <TabsContent value="media" className="mt-0">
          {mediaReq && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="bg-card border-border lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Weekly media targets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {progressRow("Photos",            mediaReq.photos.current,           mediaReq.photos.target)}
                  {progressRow("Videos",            mediaReq.videos.current,           mediaReq.videos.target)}
                  {progressRow("Product shots",     mediaReq.productShots.current,     mediaReq.productShots.target)}
                  {progressRow("BTS clips",         mediaReq.btsClips.current,         mediaReq.btsClips.target)}
                  {progressRow("Team / owner",      mediaReq.teamOwnerContent.current, mediaReq.teamOwnerContent.target)}
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">This week's guidance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/85 leading-relaxed">
                    {mediaReq.weeklyGuidance}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* PREFERENCES */}
        <TabsContent value="preferences" className="mt-0">
          {notes && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NotesCard title="Items to promote"      items={notes.bestSellers} />
              <NotesCard title="Content preferences"   items={notes.preferences} />
              <NotesCard title="Content restrictions"  items={notes.restrictions} />
              <NotesCard title="Seasonal priorities"   items={notes.seasonalPriorities} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PortalLayout>
  );
}

function ProfileRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-foreground/90 break-words">{value}</p>
      </div>
    </div>
  );
}

function ContactBlock({
  contact,
}: {
  contact: { name: string; role: string; email: string };
}) {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex items-center gap-2">
        <User className="w-3.5 h-3.5 text-muted-foreground" />
        <span>{contact.name}</span>
        <span className="text-muted-foreground text-xs">· {contact.role}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Mail className="w-3.5 h-3.5" />
        <span className="break-all">{contact.email}</span>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-foreground/90 leading-relaxed">{children}</p>
    </div>
  );
}

function NotesCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <span>{it}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

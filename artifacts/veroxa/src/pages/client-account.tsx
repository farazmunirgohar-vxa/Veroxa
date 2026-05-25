import { Building2, CheckCircle2, Camera, CalendarDays, FileText, Bell, ArrowRight } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import {
  demoRestaurants, demoMediaRunway, demoCalendarSlots, demoReportingOps,
  demoClientRequests, demoRoleNotifications, getRestaurantName,
} from "@/data/demoData";

const SHOWCASE_ID = "mamadali";

export default function ClientAccount() {
  const client    = demoRestaurants.find((r) => r.id === SHOWCASE_ID)!;
  const runway    = demoMediaRunway.find((m) => m.clientId === SHOWCASE_ID);
  const upcoming  = demoCalendarSlots
    .filter((s) => s.clientId === SHOWCASE_ID && (s.kind === "scheduled" || s.kind === "planned"))
    .slice(0, 4);
  const reports   = demoReportingOps.filter((r) => r.clientId === SHOWCASE_ID && r.status === "Published");
  const requests  = demoClientRequests.filter((r) => r.clientId === SHOWCASE_ID && r.status !== "Completed");
  const updates   = demoRoleNotifications.client.filter((n) => !n.clientId || n.clientId === SHOWCASE_ID).slice(0, 3);

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-client-account">
          Your account
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Your restaurant profile, what's scheduled, and what we need from you next.
        </p>
      </div>

      <DemoOnlyBanner message="Demo only — sample client view for showcase." testId="banner-client-account" />

      {/* Profile + status */}
      <Card className="bg-card border-primary/30 mb-4">
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> {client.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{client.cuisine}</p>
            </div>
            <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-300 bg-emerald-500/10">
              Account in good standing
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <Stat label="Onboarding"   value="100% complete" />
            <Stat label="Reports"      value={`${reports.length} published`} />
            <Stat label="Upcoming"     value={`${upcoming.length} posts`} />
            <Stat label="To-dos"       value={`${requests.length} open`} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Onboarding progress */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Onboarding progress</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span>Setup complete</span><span className="font-semibold text-emerald-400">100%</span>
              </div>
              <Progress value={100} className="h-1.5" />
            </div>
            <ul className="space-y-1.5 text-xs text-foreground/85">
              {[
                "Restaurant profile",
                "Brand preferences",
                "Menu information",
                "Posting cadence",
                "Initial media library",
              ].map((step) => (
                <li key={step} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />{step}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Media guidance (client-safe runway) */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Camera className="w-4 h-4 text-sky-400" /> Media guidance</CardTitle></CardHeader>
          <CardContent>
            {runway ? (
              <>
                <Badge variant="outline" className={`text-[10px] mb-2 ${
                  runway.health === "Healthy" ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                  : runway.health === "Low"   ? "border-amber-500/40 text-amber-300 bg-amber-500/10"
                  : "border-rose-500/40 text-rose-300 bg-rose-500/10"
                }`}>
                  {runway.health === "Healthy" ? "Looking great" : runway.health === "Low" ? "Action needed soon" : "Please upload now"}
                </Badge>
                <p className="text-sm text-foreground/90 leading-relaxed">{runway.clientFacing}</p>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Tip: 6–8 fresh photos per week keeps your content varied and on-brand.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No media guidance right now.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Content calendar preview */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" /> Upcoming content</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No upcoming posts.</p>
            ) : upcoming.map((s, i) => (
              <div key={i} className="rounded-md border border-border bg-muted/20 px-3 py-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{s.title ?? "Scheduled post"}</p>
                  <p className="text-[11px] text-muted-foreground">{s.date} · {s.time}</p>
                </div>
                <Badge variant="outline" className="text-[9px] border-border">{s.kind}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Published reports */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-violet-400" /> Published reports</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {reports.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No reports yet.</p>
            ) : reports.map((r) => (
              <div key={r.id} className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <p className="text-sm font-medium">{r.type} · {r.period}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Published {r.publishedDate}</p>
                <p className="text-xs text-foreground/85 mt-1">{r.clientFacingSummary}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* What we need next */}
        <Card className="bg-card border-primary/30">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><ArrowRight className="w-4 h-4 text-primary" /> What we need from you next</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {requests.length === 0 ? (
              <p className="text-xs text-emerald-400">You're all caught up. Thank you!</p>
            ) : requests.map((r) => (
              <div key={r.id} className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
                <p className="text-sm font-medium leading-snug">{r.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Due {r.dueDate}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {updates.map((n) => (
              <div key={n.id} className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{n.timestamp}</p>
                <p className="text-xs text-foreground/80 mt-1">{n.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <p className="text-[10px] text-muted-foreground mt-6 text-center">
        Sample account view for {getRestaurantName(SHOWCASE_ID)} — demo only.
      </p>
    </PortalLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

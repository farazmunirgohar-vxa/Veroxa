import { CalendarDays, CheckCircle2, FileText, Sparkles, Clock, Loader2, ArrowRight } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { getDemoImagesByCategory } from "@/data/demo/demoImages";
import { clientTeamWorkRepository } from "@/lib/repositories";

const SHOWCASE_ID = "demo-a";

const FOOD_IMGS = getDemoImagesByCategory("food");

const PAST_UPDATES = [
  {
    week: "Week 2 — May 12–18",
    summary: "3 posts published across Instagram and Facebook. Google profile updated with 4 new photos. Monthly report prepared for review.",
    posts: 3,
    reach: "11,400",
    status: "Published",
  },
  {
    week: "Week 1 — May 5–11",
    summary: "2 posts scheduled and published. Instagram engagement up. Capture plan sent for upcoming weekend specials.",
    posts: 2,
    reach: "8,900",
    status: "Published",
  },
];

export default function ClientUpdates() {
  const { data, source, dataSourceMessage } = useClientPortalData();

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-updates">
          Weekly Updates
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          What your Veroxa team has been working on — published posts, Google activity, and what's coming next.
        </p>
        <DataSourceBadge source={source} message={dataSourceMessage} />
      </div>

      {/* Current week update */}
      <Card
        className="bg-card border-primary/30 mb-5"
        data-testid="weekly-update"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base font-semibold">
              {data.weeklyUpdate.title}
            </CardTitle>
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px]"
            >
              Current week
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {data.weeklyUpdate.summaryItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-foreground/85">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Mini media strip — current week sample posts */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
            {[0, 1, 2].map((i) => {
              const img = FOOD_IMGS[i % FOOD_IMGS.length];
              return (
                <div
                  key={i}
                  className="aspect-square overflow-hidden rounded-md bg-muted/30"
                  data-testid={`update-photo-${i}`}
                >
                  <img
                    src={img.url}
                    alt={img.alt}
                    loading="lazy"
                    className="h-full w-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                  />
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Demo only — photos above are illustrative sample images, not your actual posts.
          </p>
        </CardContent>
      </Card>

      {/* Actions needed from you — derived from the submission pipeline so
          this section agrees with the client dashboard and /requests page. */}
      {(() => {
        const actions = clientTeamWorkRepository.getClientActionRequiredItems(SHOWCASE_ID);
        if (actions.length === 0) return null;
        return (
          <div className="mb-5" data-testid="section-upcoming-actions">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              What we need from you this week
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {actions.map((item) => (
                <Card
                  key={item.id}
                  className="bg-card/60 border-border"
                  data-testid={`action-item-${item.submissionId}`}
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="p-2 rounded-md bg-amber-500/10 flex-shrink-0">
                      <ArrowRight className="w-4 h-4 text-amber-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <Badge
                          variant="outline"
                          className="flex-shrink-0 text-[10px] border bg-amber-500/10 text-amber-300 border-amber-500/30"
                        >
                          {item.clientStatusLabel}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.clientVisibleNote}
                      </p>
                      {item.nextClientAction && (
                        <p className="text-[11px] text-amber-300 mt-1.5">
                          What to send: {item.nextClientAction}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })()}

      {/* What Veroxa is working on for you — derived from in-progress work items. */}
      {(() => {
        const inProgress = clientTeamWorkRepository.getClientInProgressItems(SHOWCASE_ID);
        if (inProgress.length === 0) return null;
        return (
          <div className="mb-5" data-testid="section-veroxa-working-on">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              What Veroxa is working on for you
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {inProgress.slice(0, 4).map((item) => (
                <Card
                  key={item.id}
                  className="bg-card/60 border-border"
                  data-testid={`working-on-${item.submissionId}`}
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="p-2 rounded-md bg-primary/10 flex-shrink-0">
                      <Loader2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground mb-1">{item.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.clientVisibleNote}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Past updates */}
      <div data-testid="section-past-updates">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Previous weeks
        </h3>
        <div className="space-y-3">
          {PAST_UPDATES.map((u, i) => (
            <Card key={i} className="bg-card/40 border-border" data-testid={`past-update-${i}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm font-semibold text-foreground">{u.week}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-muted-foreground/30 text-muted-foreground text-[10px]"
                  >
                    {u.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{u.summary}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" /> {u.posts} posts
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> ~{u.reach} est. reach
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400/80">
                    <Clock className="w-3 h-3" /> On schedule
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Demo only — all update items and metrics are illustrative sample data.
      </p>
    </PortalLayout>
  );
}

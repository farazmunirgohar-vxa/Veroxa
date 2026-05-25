import { Send } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { postReadyQueue, publishedThisWeek } from "@/lib/demo-data";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function TeamScheduling() {
  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground" data-testid="header-scheduling">Scheduling</h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">Posts approved and queued for publishing, plus what went out this week.</p>
      </div>

      <DemoOnlyBanner message="Static demo — no real publishing is connected. Slots, recommended times, and published-this-week cards illustrate the future Scheduling workflow only." testId="banner-team-scheduling" />

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4">Post-Ready Queue</h3>
          <div className="space-y-3">
            {postReadyQueue.map((post, i) => (
              <Card key={i} className="bg-card border-border" data-testid={`queue-item-${i}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded text-emerald-500 flex-shrink-0">
                      <Send className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-snug">{post.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{post.platform} · {post.date}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">Published This Week</h3>
          <div className="space-y-3">
            {publishedThisWeek.map((post, i) => (
              <Card key={i} className="bg-card/50 border-border/50" data-testid={`published-item-${i}`}>
                <CardContent className="p-4">
                  <p className="text-sm font-medium leading-snug text-foreground">{post.title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{post.platform}</span>
                    <span className="text-xs font-medium text-emerald-500">{post.reach} reach</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

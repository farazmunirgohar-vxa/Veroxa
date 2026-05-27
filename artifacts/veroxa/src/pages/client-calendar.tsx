import { Clock } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { pickImageForCaption } from "@/data/demo/demoContentMatching";

// Calendar entries in DEMO_DATA are for Demo Grill House (demo-a).
const CALENDAR_CLIENT_ID = "demo-a";

const STATUS_STYLE: Record<string, string> = {
  Scheduled:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  "In Review": "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Posted:      "bg-sky-500/10 text-sky-400 border-sky-500/30",
};

export default function ClientCalendar() {
  const { data } = useClientPortalData();

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-calendar">
          Content Calendar
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Your upcoming posts — scheduled, in review, and waiting on content.
        </p>
      </div>

      {/* Approval gate note */}
      <div
        className="flex items-start gap-2.5 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 mb-5"
        data-testid="calendar-approval-note"
      >
        <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
        <p className="text-sm text-amber-200/80">
          Nothing posts until the Veroxa team approves it in the live system.
          All posts below are pending team review before going live.
        </p>
      </div>

      <div className="space-y-3">
        {data.scheduledPosts.map((post, i) => {
          const img = pickImageForCaption(post.caption, CALENDAR_CLIENT_ID);
          return (
            <Card
              key={i}
              className="bg-card border-border hover:border-primary/30 transition-colors"
              data-testid={`post-card-${i}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted/30">
                    <img
                      src={img.url}
                      alt={img.alt}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Caption + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                      {post.caption}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {post.date}
                      </span>
                      <span className="text-xs text-muted-foreground">{post.platform}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <Badge
                    variant="outline"
                    className={`flex-shrink-0 border ${STATUS_STYLE[post.status] ?? "bg-muted/30 text-muted-foreground border-border"}`}
                  >
                    {post.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Demo only — schedule represents a simulated content plan. No real posts are queued.
      </p>
    </PortalLayout>
  );
}

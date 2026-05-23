import { Clock, ImageIcon } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { useClientPortalData } from "@/hooks/useClientPortalData";

export default function ClientCalendar() {
  const { data } = useClientPortalData();

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <h2 className="text-3xl font-bold tracking-tight">Content Calendar</h2>
      <p className="text-muted-foreground -mt-6">Upcoming scheduled and in-review posts.</p>

      <div className="space-y-3">
        {data.scheduledPosts.map((post, i) => (
          <Card key={i} className="bg-card border-border hover:border-primary/30 transition-colors" data-testid={`post-card-${i}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5 flex-shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug">{post.caption}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {post.date}
                      </span>
                      <span className="text-xs text-muted-foreground">{post.platform}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className={`border-none flex-shrink-0 ${
                  post.status === "Scheduled" ? "bg-emerald-500/10 text-emerald-500" :
                  post.status === "In Review"  ? "bg-amber-500/10 text-amber-500" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {post.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}

import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { failedPosts } from "@/lib/demo-data";
import { operatorPortalNavItems } from "@/lib/operatorPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";

export default function OperatorFailedPosts() {
  return (
    <PortalLayout items={operatorPortalNavItems} portalName="Operator Portal">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-failed-posts">Failed Posts</h2>
        <p className="text-muted-foreground mt-1">Posts that did not publish successfully and need follow-up.</p>
      </div>

      <DemoOnlyBanner message="Static demo — no real publishing pipeline is connected. Failure reasons (asset missing, caption not approved, platform disconnected, scheduled time passed) illustrate the future failed-post triage flow." testId="banner-operator-failed" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {failedPosts.map((post, i) => (
          <Card key={i} className="bg-card border-red-500/20" data-testid={`failed-post-${i}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{post.client}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{post.platform} · {post.date}</p>
                  <p className="text-xs text-red-400 mt-1">{post.reason}</p>
                </div>
                <Avatar className="w-7 h-7 flex-shrink-0">
                  <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground">{post.assignee}</AvatarFallback>
                </Avatar>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}

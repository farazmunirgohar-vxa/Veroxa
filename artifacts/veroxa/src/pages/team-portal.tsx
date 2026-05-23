import { CheckSquare, Image, Cpu, Layers, CalendarDays, CheckCircle2, Circle, Clock, Send, Star, ChevronRight } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const sidebarItems = [
  { label: "My Tasks", icon: CheckSquare },
  { label: "Media Review", icon: Image },
  { label: "AI Review", icon: Cpu },
  { label: "Drafts", icon: Layers },
  { label: "Scheduling", icon: CalendarDays },
];

const tasks = [
  { id: 1, title: "Review raw media batch — Mamadali Kebab House (May shoot)", client: "Mamadali Kebab House", priority: "High", done: true },
  { id: 2, title: "AI quality check passed — approve 3 hero shots for drafts", client: "Mamadali Kebab House", priority: "High", done: true },
  { id: 3, title: "Generate 3 caption variants for lamb shoulder post", client: "Mamadali Kebab House", priority: "High", done: false },
  { id: 4, title: "Send draft variants to team lead for approval", client: "Mamadali Kebab House", priority: "Medium", done: false },
  { id: 5, title: "Schedule approved posts for week of 26 May", client: "Mamadali Kebab House", priority: "Medium", done: false },
  { id: 6, title: "Compile reporting feed for May wrap summary", client: "Internal", priority: "Low", done: false },
];

const draftVariants = [
  { id: "A", caption: "24 hours marinated. Cooked low and slow. Worth the wait. Reserve your table tonight.", score: 92, status: "Approved" },
  { id: "B", caption: "The lamb shoulder that keeps regulars coming back. On the menu this week only.", score: 88, status: "Pending" },
  { id: "C", caption: "Slow food, fast service. Our lamb shoulder — available Tue–Sun from 5pm.", score: 81, status: "Pending" },
];

const postReadyQueue = [
  { title: "Lamb shoulder hero shot", client: "Mamadali Kebab House", platform: "Instagram", date: "Mon 26 May" },
  { title: "Family feast promo graphic", client: "Mamadali Kebab House", platform: "Facebook", date: "Wed 28 May" },
  { title: "Kitchen BTS reel", client: "Mamadali Kebab House", platform: "Instagram", date: "Fri 30 May" },
];

const publishedThisWeek = [
  { title: "Weekend special: mixed grill platter for 2", platform: "Instagram", reach: "4,820", client: "Mamadali Kebab House" },
  { title: "Google review highlight — 5 stars from Ahmed K.", platform: "Facebook", reach: "2,140", client: "Mamadali Kebab House" },
  { title: "New opening hours for Ramadan season", platform: "Instagram", reach: "6,300", client: "Mamadali Kebab House" },
  { title: "Behind the scenes: prep day with the team", platform: "Instagram", reach: "3,910", client: "Mamadali Kebab House" },
];

export default function TeamPortal() {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <PortalLayout items={sidebarItems} portalName="Team Portal">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-welcome">Good morning, Jordan</h2>
          <p className="text-muted-foreground mt-1">{today} — 4 tasks pending on Mamadali Kebab House.</p>
        </div>
        <Card className="bg-card/50 border-border/50 py-2 px-5" data-testid="stat-time-logged">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded text-primary">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Logged Today</p>
              <p className="text-xl font-bold">3h 15m</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Workflow Stage Pipeline */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Content Pipeline</h3>
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {[
            "Media Intake",
            "AI Quality Review",
            "Team Media Review",
            "Concept Generation",
            "3 Draft Variants",
            "Team Approval",
            "Post Ready Queue",
            "Scheduling",
            "Published This Week",
            "Reporting Feed",
          ].map((stage, i) => {
            const done = i < 4;
            const active = i === 4;
            return (
              <div key={stage} className="flex items-center flex-shrink-0">
                <div
                  className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg border text-center transition-colors ${
                    active
                      ? "bg-primary/15 border-primary/50 text-primary"
                      : done
                      ? "bg-emerald-500/8 border-emerald-500/25 text-emerald-500"
                      : "bg-card/40 border-border/40 text-muted-foreground"
                  }`}
                  data-testid={`pipeline-stage-${i}`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    active ? "bg-primary/30" : done ? "bg-emerald-500/20" : "bg-muted/50"
                  }`}>
                    {done
                      ? <CheckCircle2 className="w-3 h-3" />
                      : <span className="text-[9px] font-bold">{i + 1}</span>
                    }
                  </div>
                  <span className="text-[11px] font-semibold leading-tight whitespace-nowrap">{stage}</span>
                </div>
                {i < 9 && (
                  <ChevronRight className="w-3.5 h-3.5 text-border flex-shrink-0 mx-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Task List */}
          <div>
            <h3 className="text-xl font-bold mb-4">My Tasks</h3>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    task.done
                      ? "bg-card/30 border-border/30 opacity-60"
                      : "bg-card border-border hover:border-primary/40 shadow-sm"
                  }`}
                  data-testid={`task-row-${task.id}`}
                >
                  <button className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors">
                    {task.done ? <CheckCircle2 className="w-6 h-6 text-primary" /> : <Circle className="w-6 h-6" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-semibold ${task.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {task.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.client}</p>
                  </div>
                  <Badge variant="outline" className={`border-none flex-shrink-0 ${
                    task.priority === 'High' ? 'bg-red-500/10 text-red-500' :
                    task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* 3 Draft Variants */}
          <div>
            <h3 className="text-xl font-bold mb-4">Caption Draft Variants — Lamb Shoulder Post</h3>
            <div className="space-y-3">
              {draftVariants.map((variant) => (
                <Card key={variant.id} className={`bg-card border-border ${variant.status === 'Approved' ? 'border-emerald-500/40' : ''}`} data-testid={`draft-variant-${variant.id}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {variant.id}
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{variant.caption}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Badge variant="outline" className={`border-none ${
                          variant.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
                        }`}>
                          {variant.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {variant.score} / 100
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Post-Ready Queue */}
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

          {/* Published This Week */}
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
      </div>
    </PortalLayout>
  );
}

import { CheckSquare, Image, Cpu, Layers, CalendarDays, CheckCircle2, Circle, Clock, Send, Star, ChevronRight, ScanEye, Lightbulb, PenLine, ShieldCheck, CalendarClock, BarChart3, AlertOctagon } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { tasks, draftVariants, postReadyQueue, publishedThisWeek } from "@/lib/demo-data";

const sidebarItems = [
  { label: "My Tasks", icon: CheckSquare },
  { label: "Media Review", icon: Image },
  { label: "AI Review", icon: Cpu },
  { label: "Drafts", icon: Layers },
  { label: "Scheduling", icon: CalendarDays },
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

      {/* AI Agent Preview */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-xl font-bold">AI Agent Preview</h3>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px] font-semibold tracking-wide px-2 py-0.5">
            Demo Logic Only
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          A preview of how Veroxa's AI agents will assist each stage of the content workflow. All outputs below are simulated.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {([
            {
              icon: ScanEye,
              name: "Media Review Agent",
              status: "Reviewed 12 uploads",
              purpose: "Scores uploaded media for lighting, blur, food visibility, and duplicate risk.",
              statusColor: "emerald",
            },
            {
              icon: Lightbulb,
              name: "Content Strategist Agent",
              status: "4 concepts prepared",
              purpose: "Suggests content angles — product spotlight, family meal, behind-the-scenes, review highlight, or promotion.",
              statusColor: "blue",
            },
            {
              icon: PenLine,
              name: "Caption Agent",
              status: "3 draft variants generated",
              purpose: "Creates Safe, Engagement, and Sales caption options for the selected concept.",
              statusColor: "violet",
            },
            {
              icon: ShieldCheck,
              name: "Brand Voice Agent",
              status: "Tone check passed",
              purpose: "Checks captions sound premium, clear, restaurant-focused, and not too generic.",
              statusColor: "emerald",
            },
            {
              icon: CalendarClock,
              name: "Scheduling Agent",
              status: "3 posts ready for timing",
              purpose: "Suggests posting slots based on the client's preferred windows and content balance.",
              statusColor: "blue",
            },
            {
              icon: BarChart3,
              name: "Reporting Agent",
              status: "Weekly summary updated",
              purpose: "Pulls demo performance signals into weekly update cards for client review.",
              statusColor: "violet",
            },
            {
              icon: AlertOctagon,
              name: "Alert Agent",
              status: "1 content warning active",
              purpose: "Flags low content supply, failed posts, or client health risks before they escalate.",
              statusColor: "amber",
            },
          ] as const).map((agent) => {
            const colorMap = {
              emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-500" },
              blue:    { bg: "bg-blue-500/10",    text: "text-blue-500",    dot: "bg-blue-500",    badge: "bg-blue-500/10 text-blue-500"    },
              violet:  { bg: "bg-primary/10",     text: "text-primary",     dot: "bg-primary",     badge: "bg-primary/10 text-primary"      },
              amber:   { bg: "bg-amber-500/10",   text: "text-amber-500",   dot: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-500"  },
            } as const;
            const c = colorMap[agent.statusColor];
            return (
              <Card
                key={agent.name}
                className="bg-card border-border relative overflow-hidden"
                data-testid={`agent-card-${agent.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`p-2 rounded-lg ${c.bg} ${c.text}`}>
                      <agent.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest leading-tight text-right">
                      Simulated
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-1 leading-snug">{agent.name}</h4>
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.badge} mb-2`}>
                    <span className={`w-1 h-1 rounded-full ${c.dot}`} />
                    {agent.status}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{agent.purpose}</p>
                </CardContent>
              </Card>
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

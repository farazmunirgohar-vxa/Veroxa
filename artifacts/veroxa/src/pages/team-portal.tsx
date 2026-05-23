import { CheckSquare, Folder, Clock, Users, CalendarDays, CheckCircle2, Circle } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const sidebarItems = [
  { label: "My Tasks", icon: CheckSquare },
  { label: "Projects", icon: Folder },
  { label: "Time Tracker", icon: Clock },
  { label: "Team", icon: Users },
  { label: "Calendar", icon: CalendarDays },
];

const tasks = [
  { id: 1, title: "Review brand assets from design team", project: "Brand Refresh 2025", priority: "High", done: true },
  { id: 2, title: "Draft Q4 campaign copy", project: "Q4 Marketing Campaign", priority: "High", done: true },
  { id: 3, title: "Prepare weekly status report", project: "Internal", priority: "Medium", done: false },
  { id: 4, title: "Review website wireframes", project: "Website Redesign", priority: "Medium", done: false },
  { id: 5, title: "Update client documentation", project: "Internal", priority: "Low", done: false },
];

const activeProjects = [
  { name: "Brand Refresh 2025", progress: 75, due: "Oct 12", members: ["JD", "SM", "AK"] },
  { name: "Q4 Marketing Campaign", progress: 90, due: "Oct 05", members: ["JD", "RL"] },
  { name: "Website Redesign", progress: 15, due: "Nov 30", members: ["JD", "SM", "RL", "AK"] },
];

export default function TeamPortal() {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <PortalLayout items={sidebarItems} portalName="Team Portal">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-welcome">Good morning, Jordan</h2>
          <p className="text-muted-foreground mt-1">{today} — You have 3 tasks remaining today.</p>
        </div>
        <Card className="bg-card/50 border-border/50 py-2 px-5" data-testid="stat-time-logged">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded text-primary">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Logged Today</p>
              <p className="text-xl font-bold">4h 30m</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold">My Tasks</h3>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  task.done 
                    ? "bg-card/30 border-border/30 opacity-70" 
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
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.project}</p>
                </div>
                <Badge variant="outline" className={`border-none ${
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

        <div className="space-y-6">
          <h3 className="text-xl font-bold">Active Projects</h3>
          <div className="space-y-4">
            {activeProjects.map((project, i) => (
              <Card key={i} className="bg-card border-border" data-testid={`active-project-${i}`}>
                <CardContent className="p-5">
                  <h4 className="font-semibold mb-4">{project.name}</h4>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-1.5" />
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex -space-x-2">
                      {project.members.map((initials, idx) => (
                        <Avatar key={idx} className="w-7 h-7 border-2 border-card">
                          <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground">{initials}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {project.due}
                    </span>
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

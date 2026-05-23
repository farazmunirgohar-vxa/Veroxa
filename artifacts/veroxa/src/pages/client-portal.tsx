import { LayoutDashboard, Folder, Receipt, FileText, MessageSquare, Clock } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Projects", icon: Folder },
  { label: "Invoices", icon: Receipt },
  { label: "Files", icon: FileText },
  { label: "Messages", icon: MessageSquare },
];

const projects = [
  { name: "Brand Refresh 2025", status: "Active", progress: 75, due: "Oct 12" },
  { name: "Q4 Marketing Campaign", status: "Review", progress: 90, due: "Oct 05" },
  { name: "Website Redesign", status: "Planning", progress: 15, due: "Nov 30" },
];

const invoices = [
  { id: "INV-2024-089", amount: "$12,500.00", status: "Paid", date: "Sep 01, 2024" },
  { id: "INV-2024-094", amount: "$8,200.00", status: "Paid", date: "Sep 15, 2024" },
  { id: "INV-2024-102", amount: "$12,500.00", status: "Due", date: "Oct 01, 2024" },
];

export default function ClientPortal() {
  return (
    <PortalLayout items={sidebarItems} portalName="Client Portal">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="header-welcome">Welcome back, Acme Corp</h2>
          <p className="text-muted-foreground mt-1">Here is the latest on your projects and billing.</p>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="px-3 py-1 bg-card text-card-foreground border-border font-medium">
            Account ID: ACM-902
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-card/50 border-border/50 shadow-sm" data-testid="stat-active-projects">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-3xl font-bold">3</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <Folder className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-border/50 shadow-sm" data-testid="stat-pending-invoices">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Pending Invoices</p>
                <p className="text-3xl font-bold">$12,500</p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50 shadow-sm" data-testid="stat-next-milestone">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Next Milestone</p>
                <p className="text-2xl font-bold tracking-tight">Oct 05</p>
                <p className="text-xs text-muted-foreground">Q4 Campaign Review</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Active Projects</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {projects.map((project, i) => (
              <Card key={i} className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer" data-testid={`project-card-${i}`}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-lg">{project.name}</h4>
                    <Badge variant={project.status === 'Active' ? 'default' : 'secondary'} className={project.status === 'Active' ? 'bg-primary/20 text-primary hover:bg-primary/30 border-none' : ''}>
                      {project.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Due {project.due}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Recent Invoices</h3>
          </div>
          <Card className="bg-card border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead>Invoice</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv, i) => (
                  <TableRow key={i} className="border-border/50 hover:bg-accent/20 cursor-pointer" data-testid={`invoice-row-${i}`}>
                    <TableCell className="font-medium py-4">
                      {inv.id}
                      <div className="text-xs text-muted-foreground font-normal mt-0.5">{inv.date}</div>
                    </TableCell>
                    <TableCell>{inv.amount}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={cn(
                        "border-none",
                        inv.status === 'Paid' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                      )}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}

// Quick helper
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

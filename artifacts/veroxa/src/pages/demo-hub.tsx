import { Link } from "wouter";
import { ArrowLeft, BarChart2, Settings2, Utensils, Users } from "lucide-react";

export default function DemoHub() {
  const portals = [
    {
      href: "/demo/client",
      icon: Utensils,
      label: "Client Portal",
      description: "What a restaurant owner sees — content calendar, Google visibility, weekly updates, and monthly report previews.",
      color: "from-blue-500/20 to-transparent",
      iconColor: "text-blue-500"
    },
    {
      href: "/demo/team",
      icon: Users,
      label: "Team Portal",
      description: "Where the content team works — media review, AI quality checks, draft variants, approvals, and scheduling.",
      color: "from-emerald-500/20 to-transparent",
      iconColor: "text-emerald-500"
    },
    {
      href: "/demo/operator",
      icon: Settings2,
      label: "Operator Portal",
      description: "Agency operations — client health alerts, low content warnings, failed post logs, and report approvals.",
      color: "from-amber-500/20 to-transparent",
      iconColor: "text-amber-500"
    },
    {
      href: "/demo/owner",
      icon: BarChart2,
      label: "Owner Portal",
      description: "Agency owner view — MRR, active clients, health trends, critical alerts, and growth summary.",
      color: "from-primary/20 to-transparent",
      iconColor: "text-primary"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-12 transition-colors group"
          data-testid="link-back-home"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Veroxa.com
        </Link>

        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground" data-testid="demo-heading">
            Veroxa Growth OS <span className="text-muted-foreground">— Live Demo</span>
          </h1>
          <p className="text-lg text-muted-foreground">Explore each role's experience within the restaurant growth operating system.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {portals.map((portal) => (
            <Link key={portal.label} href={portal.href} className="block group" data-testid={`portal-card-${portal.label.split(' ')[0].toLowerCase()}`}>
              <div className="h-full p-8 rounded-2xl border border-border bg-card hover:bg-accent/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${portal.color} blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <portal.icon className={`w-7 h-7 ${portal.iconColor}`} />
                  </div>
                  <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-background opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{portal.label}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {portal.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

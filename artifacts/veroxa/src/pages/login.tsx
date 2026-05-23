import { Link } from "wouter";
import { ArrowLeft, ArrowRight, BarChart2, Hexagon, Settings2, ShieldAlert, Users, Utensils } from "lucide-react";

const roles = [
  {
    href: "/demo/client/dashboard",
    icon: Utensils,
    label: "Client Portal",
    description: "Restaurant owner view — content calendar, Google visibility, weekly updates, and monthly reports.",
    iconClass: "bg-blue-500/10 text-blue-500",
    glow: "from-blue-500/15 to-transparent",
    testid: "role-card-client",
  },
  {
    href: "/demo/team/tasks",
    icon: Users,
    label: "Team Portal",
    description: "Content team workspace — media review, AI quality checks, draft variants, approvals, scheduling.",
    iconClass: "bg-emerald-500/10 text-emerald-500",
    glow: "from-emerald-500/15 to-transparent",
    testid: "role-card-team",
  },
  {
    href: "/demo/operator/overview",
    icon: Settings2,
    label: "Operator Portal",
    description: "Agency operations — client health, active alerts, failed posts, and report approvals.",
    iconClass: "bg-amber-500/10 text-amber-500",
    glow: "from-amber-500/15 to-transparent",
    testid: "role-card-operator",
  },
  {
    href: "/demo/owner/dashboard",
    icon: BarChart2,
    label: "Owner Portal",
    description: "Agency owner view — MRR, active clients, health trends, and critical alerts.",
    iconClass: "bg-primary/10 text-primary",
    glow: "from-primary/20 to-transparent",
    testid: "role-card-owner",
  },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/5 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-5xl">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
            data-testid="link-back-home"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Veroxa.com
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Hexagon className="w-4 h-4 fill-primary/20" />
            </div>
            <span className="font-bold tracking-tight">Veroxa</span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-[11px] font-semibold tracking-wide mb-6">
            <ShieldAlert className="w-3 h-3" />
            Development Preview — demo role routing only, not real authentication
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4" data-testid="login-heading">
            Access Veroxa
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Role-based portal access for restaurants and Veroxa teams.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid sm:grid-cols-2 gap-5 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {roles.map((role) => (
            <Link
              key={role.label}
              href={role.href}
              className="block group"
              data-testid={role.testid}
            >
              <div className="h-full p-7 rounded-2xl border border-border bg-card hover:bg-accent/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${role.glow} blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-xl ${role.iconClass} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    <role.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mt-2">
                    Demo
                  </span>
                </div>

                <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {role.label}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {role.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-border/40">
                  <code className="text-[11px] text-muted-foreground font-mono truncate">{role.href}</code>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                    Preview Portal
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground/70 mt-12 max-w-md mx-auto leading-relaxed">
          No accounts, passwords, or sessions are used on this page. Selecting a role
          routes you to the corresponding demo portal under <code className="text-foreground/80">/demo/*</code>.
          Real authenticated routes under <code className="text-foreground/80">/client</code>,{" "}
          <code className="text-foreground/80">/team</code>, <code className="text-foreground/80">/operator</code>,
          and <code className="text-foreground/80">/owner</code> will be added in a future phase.
        </p>
      </div>
    </div>
  );
}

import { Link } from "wouter";
import { ArrowRight, BarChart2, Camera, Globe, Hexagon, LayoutDashboard, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 flex flex-col">
      {/* Navigation */}
      <nav className="h-20 border-b border-border/40 flex items-center px-6 lg:px-12 justify-between backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80" data-testid="link-home">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Hexagon className="w-5 h-5 fill-primary/20" />
          </div>
          <span className="font-bold tracking-tight text-xl">Veroxa</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <span className="hover:text-foreground cursor-pointer transition-colors">Features</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">Portals</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">Pricing</span>
        </div>

        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="hidden sm:inline text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-nav-login"
          >
            Login
          </Link>
          <Link href="/demo" data-testid="btn-nav-demo">
            <Button variant="default" className="font-semibold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-shadow">
              Request Demo
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 lg:px-12 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Veroxa OS 2.0 — Now serving restaurants
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          The Operating System for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Restaurant Growth</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-150">
          Content production, Google visibility, social scheduling, and client reporting — unified in one premium platform built specifically for restaurants that want to grow.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
          <Link href="/demo" data-testid="btn-hero-demo">
            <Button size="lg" className="h-14 px-8 text-base font-semibold shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all">
              See the Demo <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="h-14 px-8 text-base border-border/50 hover:bg-accent/50 transition-colors" data-testid="btn-learn-more">
            Learn More
          </Button>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-border/40 bg-card/30 backdrop-blur-sm py-10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border/30">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground mb-1" data-testid="stat-restaurants">340+</div>
            <div className="text-sm font-medium text-muted-foreground">Restaurants Growing</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground mb-1" data-testid="stat-posts">18,000+</div>
            <div className="text-sm font-medium text-muted-foreground">Posts Published</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground mb-1" data-testid="stat-retention">96%</div>
            <div className="text-sm font-medium text-muted-foreground">Client Retention</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground mb-1" data-testid="stat-visibility">+41%</div>
            <div className="text-sm font-medium text-muted-foreground">Avg. Google Visibility Lift</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Four Portals. One Platform.</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Purpose-built environments for every stakeholder in the restaurant growth ecosystem.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            { title: "Client Portal", desc: "Give restaurant owners a clean window into their content calendar, Google performance, weekly updates, and monthly reports.", icon: LayoutDashboard },
            { title: "Team Portal", desc: "Equip your content team with a structured review pipeline — from raw media upload through AI quality check, draft variants, approval, and scheduling.", icon: Camera },
            { title: "Operator Dashboard", desc: "Catch problems before they become crises. Monitor client health scores, flag low content pipelines, review failed posts, and approve monthly reports.", icon: Users },
            { title: "Owner Analytics", desc: "High-level MRR, active client counts, health trends, and critical alerts — everything the operator needs to make fast decisions.", icon: BarChart2 }
          ].map((feature, i) => (
            <div key={i} className="group p-8 rounded-2xl border border-border bg-card/40 hover:bg-card/80 transition-colors relative overflow-hidden" data-testid={`feature-card-${i}`}>
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 group-hover:-translate-y-2 duration-500">
                <feature.icon className="w-32 h-32" />
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6 border border-primary/20">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
              <div className="mt-6 flex items-center text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-2 group-hover:translate-x-0 duration-300">
                Explore feature <ArrowRight className="ml-1 w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-border/40 bg-card/20 px-6 lg:px-12 text-center">
        <div className="flex items-center justify-center gap-2 opacity-50 mb-4">
          <Hexagon className="w-5 h-5 fill-current" />
          <span className="font-bold tracking-tight">Veroxa</span>
        </div>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Veroxa Growth OS. Demo Shell.</p>
      </footer>
    </div>
  );
}

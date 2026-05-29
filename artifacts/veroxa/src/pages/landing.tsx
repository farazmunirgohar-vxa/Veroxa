import { Link } from "wouter";
import { ArrowRight, BarChart2, Calendar, Globe, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 flex flex-col">
      <PublicNav />

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 lg:px-12 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Restaurant Growth System
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          Bring More Customers to{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
            Your Restaurant
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-4 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-150">
          Veroxa helps restaurants improve consistency, content quality, Google visibility, and
          online trust through a structured online presence system.
        </p>

        <p className="text-base text-muted-foreground/70 max-w-xl mb-10 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
          Most restaurants do not need random posts. They need a system that keeps them visible,
          trustworthy, and consistent where customers are already looking.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
          <Link href="/free-audit" data-testid="btn-hero-audit">
            <Button size="lg" className="h-14 px-8 text-base font-semibold shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all">
              Get Free Restaurant Audit <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/demo/client/dashboard" data-testid="btn-hero-demo">
            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-border/50 hover:bg-accent/50 transition-colors">
              Experience the Demo
            </Button>
          </Link>
          <Link href="/services" data-testid="btn-hero-services">
            <Button size="lg" variant="ghost" className="h-14 px-8 text-base text-muted-foreground hover:text-foreground">
              View Services
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature highlights strip */}
      <section className="pb-12 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Upload media",     sub: "Phone photos welcome" },
            { label: "Captions prepared", sub: "Multiple options ready" },
            { label: "Team reviews",     sub: "Before anything posts" },
            { label: "Auto-scheduled",   sub: "Right time, right platform" },
            { label: "Google optimised", sub: "Profile + local SEO" },
            { label: "Monthly reports",  sub: "In your portal" },
          ].map((f) => (
            <div key={f.label} className="rounded-xl border border-border/40 bg-card/30 p-3 text-center">
              <p className="text-xs font-semibold text-foreground">{f.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{f.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* System Trust Signals */}
      <section className="border-y border-border/40 bg-card/30 backdrop-blur-sm py-10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border/30">
          <div className="text-center px-4">
            <div className="text-sm font-bold text-foreground mb-1" data-testid="signal-restaurant-focused">Restaurant-Focused System</div>
            <div className="text-xs text-muted-foreground leading-snug">Built specifically around restaurant visibility, content, Google presence, and consistency.</div>
          </div>
          <div className="text-center px-4">
            <div className="text-sm font-bold text-foreground mb-1" data-testid="signal-role-based">Client + Team Access</div>
            <div className="text-xs text-muted-foreground leading-snug">Separate client and team access keep responsibilities clear.</div>
          </div>
          <div className="text-center px-4">
            <div className="text-sm font-bold text-foreground mb-1" data-testid="signal-google-social">Google + Social Focus</div>
            <div className="text-xs text-muted-foreground leading-snug">Online presence support across Google Business Profile, Instagram, Facebook, and TikTok.</div>
          </div>
          <div className="text-center px-4">
            <div className="text-sm font-bold text-foreground mb-1" data-testid="signal-reporting">Reporting Built In</div>
            <div className="text-xs text-muted-foreground leading-snug">Weekly updates and monthly reporting are part of the operating system.</div>
          </div>
        </div>
      </section>

      {/* What Veroxa Is */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">What Veroxa Is</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">
            Veroxa is a restaurant customer-growth system. It combines online presence, content
            consistency, Google visibility, media guidance, reporting, and role-based execution
            into one operating system.
          </p>
          <p className="text-sm text-muted-foreground/70 leading-relaxed">
            Veroxa is built as a structured growth system for restaurants — designed to replace
            random posting with consistent execution, visibility, and reporting.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 lg:px-12 bg-card/20 border-y border-border/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: Monitor,
                title: "Share media and details",
                desc: "Restaurant shares photos, videos, and business information with the Veroxa team.",
              },
              {
                step: "02",
                icon: Globe,
                title: "Veroxa organizes visibility",
                desc: "Content and Google/social presence are organized into a structured system.",
              },
              {
                step: "03",
                icon: Calendar,
                title: "Team executes and reports",
                desc: "The Veroxa team handles content, scheduling, and monthly reporting.",
              },
              {
                step: "04",
                icon: BarChart2,
                title: "Restaurant sees progress",
                desc: "The restaurant owner views updates, reports, and calendar through the client portal.",
              },
            ].map((item) => (
              <div key={item.step} className="p-7 rounded-2xl border border-border bg-card/40">
                <div className="text-xs font-bold text-primary/60 mb-4">{item.step}</div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 border border-primary/20">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo CTA */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Experience the Client Portal</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            The demo shows what a restaurant owner would see inside Veroxa — dashboard, calendar,
            Google visibility summary, weekly updates, and monthly reports.
          </p>
          <Link href="/demo/client/dashboard" data-testid="btn-experience-demo">
            <Button size="lg" className="h-12 px-8 font-semibold shadow-[0_0_20px_rgba(99,102,241,0.25)]">
              Experience Demo <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 lg:px-12 bg-card/20 border-t border-border/40">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-10">
            Request a free restaurant audit, explore the services, or view pricing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/free-audit" data-testid="btn-cta-audit">
              <Button size="lg" className="h-12 px-7 font-semibold shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                Get Free Restaurant Audit <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/services" data-testid="btn-cta-services">
              <Button size="lg" variant="outline" className="h-12 px-7 border-border/60 hover:bg-accent/50">
                View Services
              </Button>
            </Link>
            <Link href="/pricing" data-testid="btn-cta-pricing">
              <Button size="lg" variant="ghost" className="h-12 px-7 text-muted-foreground hover:text-foreground">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

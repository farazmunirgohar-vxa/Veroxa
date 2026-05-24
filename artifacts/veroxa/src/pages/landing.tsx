import { Link } from "wouter";
import {
  ArrowRight,
  BarChart2,
  Calendar,
  CheckCircle2,
  Globe,
  Hexagon,
  Megaphone,
  Monitor,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const PRICING = {
  presence: [
    { label: "12-month plan", price: "$997", highlight: "Best long-term value", tier: "best" },
    { label: "7-month plan",  price: "$1,097", highlight: "Growth system",         tier: "good" },
    { label: "3-month plan",  price: "$1,197", highlight: "Foundation",            tier: "neutral" },
    { label: "No-contract",   price: "$1,497", highlight: "Flexible",              tier: "neutral" },
  ],
  bundle: [
    { label: "12-month bundle", price: "$1,797", highlight: "Best long-term value" },
    { label: "7-month bundle",  price: "$2,097", highlight: "Growth system" },
    { label: "3-month bundle",  price: "$2,297", highlight: "Foundation" },
    { label: "No-contract",     price: "$2,697", highlight: "Flexible" },
  ],
};

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
          <a href="#services" className="hover:text-foreground cursor-pointer transition-colors">Services</a>
          <a href="#pricing" className="hover:text-foreground cursor-pointer transition-colors">Pricing</a>
          <a href="#portal-preview" className="hover:text-foreground cursor-pointer transition-colors">Preview</a>
        </div>

        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="hidden sm:inline text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-nav-login"
          >
            Login
          </Link>
          <a href="#audit" data-testid="btn-nav-demo">
            <Button variant="default" className="font-semibold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-shadow">
              Request Audit
            </Button>
          </a>
        </div>
      </nav>

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
          Veroxa helps restaurants bring more customers by improving consistency, content quality,
          Google visibility, and online trust.
        </p>

        <p className="text-base text-muted-foreground/80 max-w-xl mb-10 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
          Most restaurants do not need random posts. They need a system that keeps them visible,
          trustworthy, and consistent where customers are already looking.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
          <a href="#audit" data-testid="btn-hero-audit">
            <Button size="lg" className="h-14 px-8 text-base font-semibold shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all">
              Request Restaurant Audit <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </a>
          <Link href="/demo/client/dashboard" data-testid="btn-hero-demo">
            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-border/50 hover:bg-accent/50 transition-colors">
              View Client Portal Preview
            </Button>
          </Link>
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

      {/* What Veroxa Does */}
      <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">What Veroxa Does</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Restaurant owners stay focused on food and service. Veroxa handles the online presence system.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Calendar,
              title: "Content Consistency",
              desc: "Regular, on-brand content published across Instagram, Facebook, and TikTok. No gaps. No guessing.",
            },
            {
              icon: Globe,
              title: "Google Visibility",
              desc: "Google Business Profile optimization and local SEO support to help customers find you when they search nearby.",
            },
            {
              icon: Monitor,
              title: "Restaurant Media Guidance",
              desc: "Direction and support for photo and video content that shows the real experience inside your restaurant.",
            },
            {
              icon: BarChart2,
              title: "Reporting & Trust",
              desc: "Weekly updates, monthly reports, and a content calendar give you visibility into everything being done on your behalf.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="p-7 rounded-2xl border border-border bg-card/40 hover:bg-card/80 transition-colors"
              data-testid={`what-card-${i}`}
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 border border-primary/20">
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services Included */}
      <section id="services" className="py-24 px-6 lg:px-12 bg-card/20 border-y border-border/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Complete Online Presence</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything included in the Veroxa Complete Online Presence plan.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-x-16 gap-y-3">
            {[
              "Social media content system",
              "Instagram / Facebook / TikTok posting support",
              "Google Business Profile optimization",
              "Local SEO visibility support",
              "Restaurant media guidance",
              "Weekly client updates",
              "Monthly performance reports",
              "Content calendar",
              "Caption and draft creation",
              "Team-managed execution",
              "Online trust and consistency system",
            ].map((service) => (
              <div key={service} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-b-0">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-24 px-6 lg:px-12 max-w-6xl mx-auto w-full">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-4">Complete Online Presence — Pricing</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Per month. Cancel or change plan at the end of your term.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {PRICING.presence.map((plan) => (
            <div
              key={plan.label}
              className={`p-7 rounded-2xl border flex flex-col gap-3 relative overflow-hidden ${
                plan.tier === "best"
                  ? "border-primary/50 bg-primary/5"
                  : "border-border bg-card/40"
              }`}
              data-testid={`pricing-card-${plan.label.replace(/\s+/g, "-").toLowerCase()}`}
            >
              {plan.tier === "best" && (
                <div className="absolute top-3 right-3">
                  <Star className="w-4 h-4 text-primary fill-primary/40" />
                </div>
              )}
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {plan.highlight}
              </span>
              <div>
                <span className="text-3xl font-extrabold">{plan.price}</span>
                <span className="text-sm text-muted-foreground ml-1">/mo</span>
              </div>
              <span className="text-sm text-muted-foreground">{plan.label}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/70 text-center max-w-md mx-auto leading-relaxed">
          Results depend on restaurant quality, offer, consistency, location, and market demand.
          Veroxa does not guarantee specific revenue results.
        </p>
      </section>

      {/* Ads Management */}
      <section className="py-20 px-6 lg:px-12 bg-card/20 border-y border-border/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 text-xs font-semibold mb-5">
              <Megaphone className="w-3.5 h-3.5" />
              Optional Add-on
            </div>
            <h2 className="text-3xl font-bold mb-4">Ads Management</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Add paid advertising management to your Complete Online Presence plan, or start with ads only.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-10">
            {/* Services */}
            <div>
              <h3 className="text-base font-bold mb-4 text-foreground">Ads Management includes:</h3>
              <div className="space-y-2.5">
                {[
                  "Campaign setup support",
                  "Audience and offer strategy",
                  "Creative testing direction",
                  "Ad performance monitoring",
                  "Monthly ad summary",
                  "Optimization recommendations",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prices */}
            <div className="space-y-4">
              <div className="p-6 rounded-2xl border border-border bg-card/40">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Add-on to Complete Online Presence</div>
                <div className="text-3xl font-extrabold">+$1,497<span className="text-base font-normal text-muted-foreground ml-1">/mo</span></div>
              </div>
              <div className="p-6 rounded-2xl border border-border bg-card/40">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Ads only (no content plan)</div>
                <div className="text-3xl font-extrabold">$1,997<span className="text-base font-normal text-muted-foreground ml-1">/mo</span></div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-sm text-amber-400/90 leading-relaxed max-w-2xl mx-auto text-center">
            Advertising budget is separate and paid by the restaurant directly to the ad platform.
          </div>
        </div>
      </section>

      {/* Bundle Pricing */}
      <section className="py-24 px-6 lg:px-12 max-w-6xl mx-auto w-full">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Best Value
          </div>
          <h2 className="text-3xl font-bold mb-4">Complete Online Presence + Ads Management Bundle</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Both plans together at a bundled rate. Ad spend is still separate and paid directly by the restaurant.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PRICING.bundle.map((plan, i) => (
            <div
              key={plan.label}
              className={`p-7 rounded-2xl border flex flex-col gap-3 relative overflow-hidden ${
                i === 0 ? "border-primary/50 bg-primary/5" : "border-border bg-card/40"
              }`}
            >
              {i === 0 && (
                <div className="absolute top-3 right-3">
                  <Star className="w-4 h-4 text-primary fill-primary/40" />
                </div>
              )}
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {plan.highlight}
              </span>
              <div>
                <span className="text-3xl font-extrabold">{plan.price}</span>
                <span className="text-sm text-muted-foreground ml-1">/mo</span>
              </div>
              <span className="text-sm text-muted-foreground">{plan.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Client Portal Preview */}
      <section id="portal-preview" className="py-20 px-6 lg:px-12 bg-card/20 border-y border-border/40">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-semibold mb-6">
            <Monitor className="w-3.5 h-3.5" />
            Interactive Preview
          </div>
          <h2 className="text-3xl font-bold mb-4">See What Restaurant Owners See</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Explore the Client Portal — the dashboard, content calendar, Google visibility summary,
            weekly updates, and monthly reports your restaurant would receive.
          </p>
          <Link href="/demo/client/dashboard" data-testid="btn-portal-preview">
            <Button size="lg" variant="outline" className="h-12 px-8 font-semibold border-border/60 hover:bg-accent/50">
              View Client Portal Preview <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground/60 mt-4">No login required for the Client Portal preview.</p>
        </div>
      </section>

      {/* CTA */}
      <section id="audit" className="py-28 px-6 lg:px-12 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/10 blur-[100px] rounded-full pointer-events-none -z-10" />
        <TrendingUp className="w-10 h-10 text-primary mb-6 opacity-80" />
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 max-w-2xl">
          Ready to grow your restaurant?
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mb-10">
          Request a free restaurant audit. We'll review your current online presence and show you exactly where Veroxa can help.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="mailto:hello@veroxa.com?subject=Restaurant Audit Request" data-testid="btn-cta-audit">
            <Button size="lg" className="h-14 px-8 text-base font-semibold shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all">
              Request Restaurant Audit <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </a>
          <Link href="/demo/client/dashboard" data-testid="btn-cta-portal">
            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-border/50 hover:bg-accent/50">
              Preview Client Portal
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-border/40 bg-card/20 px-6 lg:px-12 text-center">
        <div className="flex items-center justify-center gap-2 opacity-50 mb-4">
          <Hexagon className="w-5 h-5 fill-current" />
          <span className="font-bold tracking-tight">Veroxa</span>
        </div>
        <p className="text-sm text-muted-foreground mb-2">© {new Date().getFullYear()} Veroxa Growth OS.</p>
        <p className="text-xs text-muted-foreground/60 max-w-lg mx-auto leading-relaxed">
          Results depend on restaurant quality, offer, consistency, location, and market demand.
          Veroxa does not guarantee specific revenue results, first-page rankings, viral posts, or a
          specific number of customers.
        </p>
      </footer>
    </div>
  );
}

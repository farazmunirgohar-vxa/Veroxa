import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Megaphone, Sparkles, Star, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";

const PRESENCE_PLANS = [
  { label: "12-month plan", price: "$997",   highlight: "Best long-term value", best: true },
  { label: "6-month plan",  price: "$1,097", highlight: "Growth system",        best: false },
  { label: "3-month plan",  price: "$1,197", highlight: "Foundation",           best: false },
  { label: "No-contract",   price: "$1,497", highlight: "Flexible",             best: false },
];

const BUNDLE_PLANS = [
  { label: "12-month bundle", price: "$1,797", highlight: "Best long-term value", best: true },
  { label: "6-month bundle",  price: "$2,097", highlight: "Growth system",        best: false },
  { label: "3-month bundle",  price: "$2,297", highlight: "Foundation",           best: false },
  { label: "No-contract",     price: "$2,697", highlight: "Flexible",             best: false },
];

const STARTER_INCLUDES = [
  "Google Business Profile updates",
  "2 social posts per week",
  "Monthly performance snapshot",
  "From photos you send — no shoot, no concept work",
];

const PRESENCE_SERVICES = [
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
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav />

      {/* Hero */}
      <section className="pt-24 pb-16 px-6 lg:px-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-primary/15 blur-[100px] rounded-full pointer-events-none -z-10" />
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            Simple pricing for a serious{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              restaurant growth system
            </span>
          </h1>
          <p className="text-muted-foreground animate-in fade-in slide-in-from-bottom-5 duration-700">
            Straightforward monthly pricing. No hidden fees. Ad spend is always separate.
          </p>
        </div>
      </section>

      {/* Complete Online Presence Pricing */}
      <section className="py-16 px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-2">Complete Online Presence</h2>
        <p className="text-muted-foreground mb-8 text-sm">Per month. Plan commitment billed monthly.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-4">
          {PRESENCE_PLANS.map((plan) => (
            <div
              key={plan.label}
              className={`p-7 rounded-2xl border flex flex-col gap-3 relative overflow-hidden ${
                plan.best ? "border-primary/50 bg-primary/5" : "border-border bg-card/40"
              }`}
              data-testid={`pricing-presence-${plan.label.replace(/\s+/g, "-").toLowerCase()}`}
            >
              {plan.best && (
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

        <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-lg mb-10">
          Results depend on restaurant quality, offer, consistency, location, and market demand.
          Veroxa does not guarantee specific revenue results.
        </p>

        {/* Starter / on-ramp tier */}
        <div
          className="border border-border/60 rounded-2xl bg-card/30 p-7 max-w-3xl mb-10 flex flex-col md:flex-row md:items-center gap-6"
          data-testid="pricing-starter"
        >
          <div className="md:w-1/3">
            <div className="flex items-center gap-2 mb-2">
              <Sprout className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400">
                On-ramp
              </span>
            </div>
            <h3 className="text-lg font-bold mb-1">Starter — Google Presence</h3>
            <div className="mb-2">
              <span className="text-3xl font-extrabold">$497</span>
              <span className="text-sm text-muted-foreground ml-1">/mo</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A simpler entry point. Designed for owners who want to start with consistent
              Google updates and regular posting before stepping up to the full system.
            </p>
          </div>
          <div className="md:flex-1 md:border-l md:border-border/40 md:pl-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              What's included
            </p>
            <ul className="space-y-2">
              {STARTER_INCLUDES.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-muted-foreground/70 mt-3 italic">
              Most restaurants graduate to Complete Online Presence within 60–90 days for full
              content production, captures, and reporting depth.
            </p>
          </div>
        </div>

        {/* Which plan fits? */}
        <div className="border border-border/60 rounded-2xl bg-card/30 p-7 max-w-xl">
          <h3 className="text-sm font-bold mb-4 text-foreground">Which plan fits?</h3>
          <div className="space-y-3">
            {[
              { plan: "3-month",    label: "Foundation",          desc: "Get the system running and see early results." },
              { plan: "6-month",    label: "Growth system",       desc: "Build consistency and visibility over a real growth period." },
              { plan: "12-month",   label: "Best long-term value", desc: "Lowest monthly rate. Designed for serious long-term growth." },
              { plan: "No-contract",label: "Flexible",            desc: "No commitment. Start or stop on your own terms." },
            ].map((row) => (
              <div key={row.plan} className="flex items-start gap-3">
                <span className="text-xs font-mono text-primary/70 w-20 flex-shrink-0 pt-0.5">{row.plan}</span>
                <div>
                  <span className="text-xs font-semibold text-foreground">{row.label} — </span>
                  <span className="text-xs text-muted-foreground">{row.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ads Management Pricing */}
      <section className="py-16 px-6 lg:px-12 bg-card/20 border-y border-border/40">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Megaphone className="w-5 h-5 text-amber-500" />
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Optional Add-on</div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Ads Management</h2>
          <p className="text-muted-foreground mb-8 text-sm">
            Add paid advertising management to your Complete Online Presence plan, or start with ads only.
          </p>

          <div className="grid sm:grid-cols-2 gap-5 max-w-xl mb-6">
            <div className="p-7 rounded-2xl border border-border bg-card/40 flex flex-col gap-2" data-testid="pricing-ads-addon">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Add-on to Complete Presence
              </span>
              <div>
                <span className="text-3xl font-extrabold">+$1,497</span>
                <span className="text-sm text-muted-foreground ml-1">/mo</span>
              </div>
            </div>
            <div className="p-7 rounded-2xl border border-border bg-card/40 flex flex-col gap-2" data-testid="pricing-ads-only">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Ads only (no content plan)
              </span>
              <div>
                <span className="text-3xl font-extrabold">$1,997</span>
                <span className="text-sm text-muted-foreground ml-1">/mo</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-sm text-amber-400/90 leading-relaxed max-w-xl">
            Advertising budget is separate and paid by the restaurant directly to the ad platform.
          </div>
        </div>
      </section>

      {/* Bundle Pricing */}
      <section className="py-16 px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">Best Value</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Complete Online Presence + Ads Management Bundle</h2>
        <p className="text-muted-foreground mb-8 text-sm">
          Both plans together at a bundled rate. Ad spend is still separate and paid directly by the restaurant.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {BUNDLE_PLANS.map((plan) => (
            <div
              key={plan.label}
              className={`p-7 rounded-2xl border flex flex-col gap-3 relative overflow-hidden ${
                plan.best ? "border-primary/50 bg-primary/5" : "border-border bg-card/40"
              }`}
              data-testid={`pricing-bundle-${plan.label.replace(/\s+/g, "-").toLowerCase()}`}
            >
              {plan.best && (
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

      {/* What's Included */}
      <section className="py-16 px-6 lg:px-12 bg-card/20 border-y border-border/40">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">What's included in Complete Online Presence</h2>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-3">
            {PRESENCE_SERVICES.map((item) => (
              <div key={item} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-b-0">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 lg:px-12">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to move forward?</h2>
          <p className="text-muted-foreground mb-8">
            Request a free restaurant audit to discuss which plan fits your goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:hello@veroxa.com?subject=Restaurant Audit Request" data-testid="btn-pricing-cta-audit">
              <Button size="lg" className="h-12 px-7 font-semibold shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                Request Restaurant Audit <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </a>
            <Link href="/services" data-testid="btn-pricing-cta-services">
              <Button size="lg" variant="outline" className="h-12 px-7 border-border/60 hover:bg-accent/50">
                View Services
              </Button>
            </Link>
            <Link href="/demo" data-testid="btn-pricing-cta-demo">
              <Button size="lg" variant="ghost" className="h-12 px-7 text-muted-foreground hover:text-foreground">
                Experience Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

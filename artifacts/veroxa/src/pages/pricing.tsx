import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Megaphone, Sparkles, MapPin, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import {
  VEROXA_PLANS,
  BUNDLE_SAVINGS_MONTHLY,
  AD_SPEND_DISCLAIMER,
} from "@/data/pricing/veroxaPricing";

const STARTER = VEROXA_PLANS.google_presence_starter;
const COP     = VEROXA_PLANS.complete_online_presence;
const ADS     = VEROXA_PLANS.ads_management;
const BUNDLE  = VEROXA_PLANS.bundle;

const STARTER_INCLUDES = [
  "Google Business Profile cleanup",
  "Business category and service optimization",
  "Menu / link / profile accuracy review",
  "Photo and visual guidance",
  "Review request guidance",
  "Basic local visibility improvements",
  "Monthly Google visibility snapshot",
];

const STARTER_EXCLUDES = [
  "Instagram, Facebook, or TikTok posting",
  "Full content calendar",
  "AI content workflow",
  "Team content production",
  "Full Veroxa portal operations",
  "Ads management",
  "Full monthly strategy report",
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

const ADS_INCLUDES = [
  "Google and Meta ad campaign setup",
  "Audience and offer targeting",
  "Creative direction for ad-specific assets",
  "Campaign monitoring and optimization",
  "Monthly ad performance reporting",
];

const FAQ_ITEMS = [
  {
    q: "Is ad spend included in any plan?",
    a: "No. Ad spend is always separate and paid by the restaurant directly to the ad platform (Google, Meta). Veroxa only manages the campaigns.",
  },
  {
    q: "Can I start with Starter and upgrade later?",
    a: "Yes. Most restaurants move from Google Presence Starter into Complete Online Presence within 60–90 days once their Google presence is stable.",
  },
  {
    q: "Do you have long-term contracts?",
    a: "No term-tier pricing. All plans are billed monthly at the flat rate shown.",
  },
  {
    q: "What does the Bundle save me?",
    a: `Buying Complete Online Presence ($977) and Ads Management ($977) separately is $1,954/mo. The Bundle is $1,497/mo — a saving of $${BUNDLE_SAVINGS_MONTHLY}/mo.`,
  },
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
            Flat monthly pricing.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              No term tiers. Ad spend separate.
            </span>
          </h1>
          <p className="text-muted-foreground animate-in fade-in slide-in-from-bottom-5 duration-700">
            Start with Google-only local visibility, the full growth system, ads management,
            or the bundle. Same price every month.
          </p>
        </div>
      </section>

      {/* ── SECTION 1: Google Presence Starter ─────────────────── */}
      <section className="py-16 px-6 lg:px-12 bg-emerald-950/20 border-y border-emerald-800/20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              Google-Only Entry Offer
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-1">{STARTER.label}</h2>
          <p className="text-muted-foreground mb-8 text-sm max-w-xl">
            For restaurants that need their Google presence cleaned up before moving into the full
            Veroxa growth system. Google-only local visibility foundation — not full content management.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
            <div
              className="p-7 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col gap-4"
              data-testid="pricing-starter"
            >
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400">
                  Starter path · upgrade-ready
                </span>
                <div className="mt-2">
                  <span className="text-4xl font-extrabold">{STARTER.displayPrice}</span>
                  <span className="text-sm text-muted-foreground ml-1">/mo</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Google-only. Not the full Veroxa OS. Designed as a local visibility foundation
                  before stepping into the complete growth system.
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
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
              </div>

              <a
                href="mailto:hello@veroxa.com?subject=Google Presence Starter Inquiry"
                data-testid="btn-starter-cta"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-500/60"
                >
                  Ask about Starter <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </a>
            </div>

            <div className="p-7 rounded-2xl border border-border/50 bg-card/20 flex flex-col gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                  Not included in Starter
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  These are part of Complete Online Presence — the full Veroxa growth system.
                </p>
              </div>
              <ul className="space-y-2">
                {STARTER_EXCLUDES.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <XCircle className="w-4 h-4 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-4 border-t border-border/30">
                <p className="text-xs text-muted-foreground/70 leading-relaxed italic">
                  Most restaurants move into Complete Online Presence within 60–90 days once their
                  Google presence is stable and they're ready for full content production.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: Complete Online Presence ────────────────── */}
      <section className="py-16 px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-1">{COP.label}</h2>
        <p className="text-muted-foreground mb-2 text-sm">
          The full Veroxa growth system — content, Google, local SEO, media guidance, reporting.
        </p>
        <p className="text-muted-foreground mb-8 text-xs">Flat monthly rate. Billed monthly.</p>

        <div className="grid md:grid-cols-3 gap-5 mb-4">
          <div
            className="p-7 rounded-2xl border border-primary/50 bg-primary/5 flex flex-col gap-3 md:col-span-1"
            data-testid="pricing-cop"
          >
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Flat monthly rate
            </span>
            <div>
              <span className="text-4xl font-extrabold">{COP.displayPrice}</span>
              <span className="text-sm text-muted-foreground ml-1">/mo</span>
            </div>
            <span className="text-sm text-muted-foreground">{COP.tagline}</span>
            <a href="mailto:hello@veroxa.com?subject=Complete Online Presence Inquiry" data-testid="btn-cop-cta">
              <Button size="lg" className="w-full mt-2">
                Start with COP <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </a>
          </div>

          <div className="border border-border/50 rounded-2xl bg-card/20 p-7 md:col-span-2">
            <h3 className="text-sm font-bold mb-5 text-foreground">What's included</h3>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
              {PRESENCE_SERVICES.map((item) => (
                <div key={item} className="flex items-center gap-3 py-1.5 border-b border-border/20 last:border-b-0">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-lg">
          Results depend on restaurant quality, offer, consistency, location, and market demand.
          Veroxa does not guarantee specific revenue results.
        </p>
      </section>

      {/* ── SECTION 3: Ads Management ───────────────────────────── */}
      <section className="py-16 px-6 lg:px-12 bg-card/20 border-y border-border/40">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Megaphone className="w-5 h-5 text-amber-500" />
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Standalone Plan</div>
          </div>
          <h2 className="text-2xl font-bold mb-2">{ADS.label}</h2>
          <p className="text-muted-foreground mb-8 text-sm">
            Paid advertising management at a flat monthly rate. Pair with Complete Online Presence
            via the Bundle, or run on its own.
          </p>

          <div className="grid md:grid-cols-3 gap-5 mb-6">
            <div
              className="p-7 rounded-2xl border border-amber-500/40 bg-amber-500/5 flex flex-col gap-3"
              data-testid="pricing-ads"
            >
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Flat monthly rate
              </span>
              <div>
                <span className="text-4xl font-extrabold">{ADS.displayPrice}</span>
                <span className="text-sm text-muted-foreground ml-1">/mo</span>
              </div>
              <span className="text-sm text-muted-foreground">{ADS.tagline}</span>
            </div>

            <div className="border border-border/50 rounded-2xl bg-card/20 p-7 md:col-span-2">
              <h3 className="text-sm font-bold mb-5 text-foreground">What's included</h3>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
                {ADS_INCLUDES.map((item) => (
                  <div key={item} className="flex items-center gap-3 py-1.5 border-b border-border/20 last:border-b-0">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-sm text-amber-400/90 leading-relaxed"
            data-testid="banner-ad-spend-separate"
          >
            <strong>Ad spend is separate.</strong> {AD_SPEND_DISCLAIMER}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: Bundle ───────────────────────────────────── */}
      <section className="py-16 px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">Best Value</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">{BUNDLE.label} — Complete Online Presence + Ads Management</h2>
        <p className="text-muted-foreground mb-8 text-sm">
          Both plans together at a bundled flat rate. Ad spend is still separate.
        </p>

        <div className="grid md:grid-cols-2 gap-5">
          <div
            className="p-7 rounded-2xl border border-primary/50 bg-primary/5 flex flex-col gap-3"
            data-testid="pricing-bundle"
          >
            <span className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              Bundle · best value
            </span>
            <div>
              <span className="text-4xl font-extrabold">{BUNDLE.displayPrice}</span>
              <span className="text-sm text-muted-foreground ml-1">/mo</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Complete Online Presence + Ads Management together.
            </span>
            <a href="mailto:hello@veroxa.com?subject=Bundle Inquiry" data-testid="btn-bundle-cta">
              <Button size="lg" className="w-full mt-2">
                Start with the Bundle <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </a>
          </div>

          <div className="p-7 rounded-2xl border border-border/60 bg-card/30 flex flex-col gap-3" data-testid="bundle-savings">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Your saving
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Complete Online Presence ({COP.displayPrice}) + Ads Management ({ADS.displayPrice}) bought
              separately = <span className="text-foreground font-semibold">$1,954/mo</span>.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bundle price = <span className="text-foreground font-semibold">{BUNDLE.displayPrice}/mo</span>.
            </p>
            <div className="mt-2 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
              <p className="text-sm text-emerald-300 font-semibold">
                Save ${BUNDLE_SAVINGS_MONTHLY}/mo with the Bundle.
              </p>
            </div>
            <p className="text-xs text-muted-foreground/70 italic mt-1">
              Ad spend still paid directly by the restaurant to the ad platform.
            </p>
          </div>
        </div>
      </section>

      {/* Which option fits */}
      <section className="py-16 px-6 lg:px-12 bg-card/10 border-t border-border/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Which option fits?</h2>
          <div className="space-y-3">
            {[
              { plan: "Starter",  label: STARTER.displayPrice + "/mo", desc: "You need your Google presence cleaned up first. Not the full system." },
              { plan: "COP",      label: COP.displayPrice + "/mo",     desc: "You want the full Veroxa growth system, organic only — no paid ads." },
              { plan: "Ads",      label: ADS.displayPrice + "/mo",     desc: "You only want paid advertising managed. You handle organic yourself." },
              { plan: "Bundle",   label: BUNDLE.displayPrice + "/mo",  desc: "You want everything: organic content system + paid ads management." },
            ].map((row) => (
              <div key={row.plan} className="flex items-start gap-4 p-4 rounded-lg border border-border/40 bg-card/20">
                <span className="text-sm font-bold text-primary w-20 flex-shrink-0">{row.plan}</span>
                <div>
                  <span className="text-sm font-semibold text-foreground">{row.label}</span>
                  <p className="text-sm text-muted-foreground mt-1">{row.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 lg:px-12 max-w-3xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-6">Pricing FAQ</h2>
        <div className="space-y-4">
          {FAQ_ITEMS.map((f) => (
            <div key={f.q} className="p-5 rounded-xl border border-border/40 bg-card/20">
              <p className="text-sm font-semibold text-foreground mb-2">{f.q}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 lg:px-12 bg-card/10 border-t border-border/30">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Not sure where to start?</h2>
          <p className="text-muted-foreground mb-8">
            Request a free restaurant audit. We'll tell you whether the Starter path or Complete
            Online Presence is the right fit for where your business is right now.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:hello@veroxa.com?subject=Restaurant Audit Request" data-testid="btn-pricing-cta-audit">
              <Button size="lg" className="h-12 px-7 font-semibold shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                Request Free Audit <ArrowRight className="ml-2 w-4 h-4" />
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

import { Link } from "wouter";
import {
  ArrowRight,
  CheckCircle2,
  Megaphone,
  Sparkles,
  MapPin,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import {
  VEROXA_PLANS,
  COMPLETE_PLUS_ADS_TOTAL_DISPLAY,
  COMPLETE_PLUS_ADS_FOUNDING_TOTAL_DISPLAY,
  AD_SPEND_DISCLAIMER,
  FOUNDING_CLIENT_OFFER_DISCLAIMER,
  COMPLETE_PRESENCE_SETUP_DISCLAIMER,
} from "@/data/pricing/veroxaPricing";

const GOOGLE = VEROXA_PLANS.google_optimization;
const COP = VEROXA_PLANS.complete_online_presence;
const ADS_ADDON = VEROXA_PLANS.ads_addon;
const ADS_ONLY = VEROXA_PLANS.ads_standalone;

const GOOGLE_INCLUDES = [
  "Google Search Engine SEO",
  "Google Maps SEO",
  "Google Business Profile optimization",
  "Google reviews support",
];

const GOOGLE_EXCLUDES = [
  "Social media content (Facebook, Instagram, TikTok)",
  "Social posting",
  "Ads management",
  "Full Veroxa content workflow",
];

const COP_INCLUDES = [
  "Facebook management",
  "Instagram management",
  "TikTok management",
  "Google Optimization",
  "Content planning",
  "Caption / draft creation",
  "Posting support",
  "Restaurant media guidance",
  "Weekly updates",
  "Monthly reports",
  "Team-managed execution",
  "Veroxa Client Portal access",
];

const ADS_INCLUDES = [
  "Ad campaign setup",
  "Audience and offer targeting",
  "Creative direction for ad-specific assets",
  "Campaign monitoring and optimization",
  "Monthly ad performance reporting",
];

const FAQ_ITEMS = [
  {
    q: "Is ad spend included?",
    a: "No. Ad spend is separate and paid directly by the restaurant to the ad platform.",
  },
  {
    q: "What is Google Optimization?",
    a: "Google Optimization includes Google Search Engine SEO, Google Maps SEO, Google Business Profile optimization, and Google reviews support.",
  },
  {
    q: "Which social media platforms are included in Complete Online Presence?",
    a: "Facebook, Instagram, and TikTok.",
  },
  {
    q: "What if I do not have a website or social media accounts?",
    a: "If you purchase Complete Online Presence, Veroxa will help create/setup the required basic website/presence or account/page needed to operate the service. This is not a custom website development package.",
  },
  {
    q: "Can I add ads to Complete Online Presence?",
    a: `Yes. Ads Management can be added for ${ADS_ADDON.displayPrice}/mo. Founding clients receive the first-year offer of ${ADS_ADDON.displayPriceFounding}/mo.`,
  },
  {
    q: "What if I only want ads management?",
    a: `Ads Management by itself is ${ADS_ONLY.displayPrice}/mo. Founding clients receive the first-year offer of ${ADS_ONLY.displayPriceFounding}/mo.`,
  },
  {
    q: "Does Veroxa still offer a separate bundle plan?",
    a: `No. Current pricing is simpler: Complete Online Presence is ${COP.displayPrice}/mo, and Ads Management can be added for ${ADS_ADDON.displayPrice}/mo.`,
  },
  {
    q: "Does Veroxa guarantee more customers?",
    a: "No. Veroxa builds and operates the online presence system. Results depend on restaurant quality, market, offer, location, consistency, and media supply.",
  },
];

function FoundingBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5">
      <Sparkles className="w-3 h-3" />
      Founding client · first year
    </span>
  );
}

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
              Founding clients save 50%.
            </span>
          </h1>
          <p className="text-muted-foreground animate-in fade-in slide-in-from-bottom-5 duration-700">
            Start with Google Optimization, the Complete Online Presence
            system, or add Ads Management. Ad spend is always separate.
          </p>
        </div>
      </section>

      {/* ── SECTION 1: Google Optimization ────────────────────────── */}
      <section className="py-16 px-6 lg:px-12 bg-emerald-950/20 border-y border-emerald-800/20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              Google-Focused Visibility
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-1">{GOOGLE.label}</h2>
          <p className="text-muted-foreground mb-8 text-sm max-w-xl">
            For restaurants that need to be found better on Google before
            committing to full content production.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
            <div
              className="p-7 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col gap-4"
              data-testid="pricing-google-optimization"
            >
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400">
                  Standard price
                </span>
                <div className="mt-2">
                  <span className="text-4xl font-extrabold">
                    {GOOGLE.displayPrice}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">
                    /mo
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <FoundingBadge />
                  <span className="text-sm text-amber-200/90">
                    {GOOGLE.displayPriceFounding}/mo for the first year
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  What's included
                </p>
                <ul className="space-y-2">
                  {GOOGLE_INCLUDES.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href="mailto:hello@veroxa.com?subject=Google Optimization Inquiry"
                data-testid="btn-google-cta"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-500/60"
                >
                  Ask about Google Optimization{" "}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </a>
            </div>

            <div className="p-7 rounded-2xl border border-border/50 bg-card/20 flex flex-col gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                  Not included
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  These are part of Complete Online Presence.
                </p>
              </div>
              <ul className="space-y-2">
                {GOOGLE_EXCLUDES.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <XCircle className="w-4 h-4 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: Complete Online Presence ──────────────────── */}
      <section className="py-16 px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-1">{COP.label}</h2>
        <p className="text-muted-foreground mb-2 text-sm max-w-2xl">
          The core Veroxa system for restaurants that want Facebook,
          Instagram, TikTok, Google Optimization, content planning, posting
          support, media guidance, weekly updates, monthly reports, and
          team-managed execution.
        </p>
        <p className="text-muted-foreground mb-8 text-xs">
          Flat monthly rate. Billed monthly.
        </p>

        <div className="grid md:grid-cols-3 gap-5 mb-4">
          <div
            className="p-7 rounded-2xl border border-primary/50 bg-primary/5 flex flex-col gap-3 md:col-span-1"
            data-testid="pricing-cop"
          >
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Standard price
            </span>
            <div>
              <span className="text-4xl font-extrabold">
                {COP.displayPrice}
              </span>
              <span className="text-sm text-muted-foreground ml-1">/mo</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FoundingBadge />
              <span className="text-sm text-amber-200/90">
                {COP.displayPriceFounding}/mo for the first year
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              Includes Facebook, Instagram, and TikTok.
            </span>
            <a
              href="mailto:hello@veroxa.com?subject=Complete Online Presence Inquiry"
              data-testid="btn-cop-cta"
            >
              <Button size="lg" className="w-full mt-2">
                Start with Complete <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </a>
          </div>

          <div className="border border-border/50 rounded-2xl bg-card/20 p-7 md:col-span-2">
            <h3 className="text-sm font-bold mb-5 text-foreground">
              What's included
            </h3>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
              {COP_INCLUDES.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 py-1.5 border-b border-border/20 last:border-b-0"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="mt-4 p-4 rounded-xl border border-primary/30 bg-primary/5 text-sm text-foreground/90 leading-relaxed max-w-3xl"
          data-testid="cop-setup-note"
        >
          <strong>Setup support:</strong> {COMPLETE_PRESENCE_SETUP_DISCLAIMER}
        </div>

        <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-lg mt-6">
          Results depend on restaurant quality, offer, consistency, location,
          and market demand. Veroxa does not guarantee specific revenue
          results.
        </p>
      </section>

      {/* ── SECTION 3: Ads Management ────────────────────────────── */}
      <section className="py-16 px-6 lg:px-12 bg-card/20 border-y border-border/40">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Megaphone className="w-5 h-5 text-amber-500" />
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
              Ads Management
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">
            Add ads to Complete Online Presence, or run ads only.
          </h2>
          <p className="text-muted-foreground mb-8 text-sm max-w-xl">
            Veroxa manages the advertising system. The restaurant controls
            and pays the actual ad budget.
          </p>

          <div className="grid md:grid-cols-2 gap-5 mb-6">
            <div
              className="p-7 rounded-2xl border border-amber-500/40 bg-amber-500/5 flex flex-col gap-3"
              data-testid="pricing-ads-addon"
            >
              <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-300">
                Add-on · paired with Complete Online Presence
              </span>
              <div>
                <span className="text-4xl font-extrabold">
                  {ADS_ADDON.displayPrice}
                </span>
                <span className="text-sm text-muted-foreground ml-1">/mo</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FoundingBadge />
                <span className="text-sm text-amber-200/90">
                  {ADS_ADDON.displayPriceFounding}/mo for the first year
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {ADS_ADDON.tagline}
              </span>
            </div>

            <div
              className="p-7 rounded-2xl border border-amber-500/40 bg-amber-500/5 flex flex-col gap-3"
              data-testid="pricing-ads-standalone"
            >
              <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-300">
                Standalone · without Complete Online Presence
              </span>
              <div>
                <span className="text-4xl font-extrabold">
                  {ADS_ONLY.displayPrice}
                </span>
                <span className="text-sm text-muted-foreground ml-1">/mo</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FoundingBadge />
                <span className="text-sm text-amber-200/90">
                  {ADS_ONLY.displayPriceFounding}/mo for the first year
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {ADS_ONLY.tagline}
              </span>
            </div>
          </div>

          <div className="border border-border/50 rounded-2xl bg-card/20 p-7 mb-6">
            <h3 className="text-sm font-bold mb-5 text-foreground">
              What's included in either option
            </h3>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
              {ADS_INCLUDES.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 py-1.5 border-b border-border/20 last:border-b-0"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
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

      {/* ── SECTION 4: Most common path ───────────────────────────── */}
      <section className="py-16 px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">
            Most common path
          </span>
        </div>
        <h2 className="text-2xl font-bold mb-3">
          Complete Online Presence + Ads Add-on
        </h2>
        <p className="text-muted-foreground mb-8 text-sm max-w-2xl">
          Most restaurants should start with Complete Online Presence. If
          they want ads managed too, they add Ads Management for{" "}
          {ADS_ADDON.displayPrice}/mo.
        </p>

        <div
          className="grid md:grid-cols-2 gap-5"
          data-testid="cop-plus-ads-summary"
        >
          <div className="p-7 rounded-2xl border border-primary/40 bg-primary/5 flex flex-col gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Standard combined service total
            </span>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Complete Online Presence
                </span>
                <span className="text-foreground">{COP.displayPrice}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ads Add-on</span>
                <span className="text-foreground">
                  {ADS_ADDON.displayPrice}/mo
                </span>
              </div>
              <div className="border-t border-border/40 mt-2 pt-2 flex justify-between text-base font-bold">
                <span>Combined total</span>
                <span>{COMPLETE_PLUS_ADS_TOTAL_DISPLAY}/mo</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/70 italic mt-2">
              Before ad spend. Ad spend is paid directly by the restaurant to
              the ad platform.
            </p>
          </div>

          <div className="p-7 rounded-2xl border border-amber-500/40 bg-amber-500/5 flex flex-col gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-300">
              Founding client · first-year total
            </span>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Complete Online Presence
                </span>
                <span className="text-foreground">
                  {COP.displayPriceFounding}/mo
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ads Add-on</span>
                <span className="text-foreground">
                  {ADS_ADDON.displayPriceFounding}/mo
                </span>
              </div>
              <div className="border-t border-border/40 mt-2 pt-2 flex justify-between text-base font-bold">
                <span>Combined first-year total</span>
                <span>{COMPLETE_PLUS_ADS_FOUNDING_TOTAL_DISPLAY}/mo</span>
              </div>
            </div>
            <p className="text-xs text-amber-200/70 italic mt-2">
              50% off for the first year. After the first year, standard
              pricing applies. Ad spend always separate.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: Founding Client Offer ──────────────────────── */}
      <section className="py-16 px-6 lg:px-12 bg-amber-950/10 border-y border-amber-800/20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-widest">
              Founding Client Offer
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-4">
            50% off for the first year.
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {FOUNDING_CLIENT_OFFER_DISCLAIMER}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 lg:px-12 max-w-3xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-6">Pricing FAQ</h2>
        <div className="space-y-4">
          {FAQ_ITEMS.map((f) => (
            <div
              key={f.q}
              className="p-5 rounded-xl border border-border/40 bg-card/20"
            >
              <p className="text-sm font-semibold text-foreground mb-2">
                {f.q}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 lg:px-12 bg-card/10 border-t border-border/30">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Not sure where to start?</h2>
          <p className="text-muted-foreground mb-8">
            Request a free restaurant audit. We'll tell you whether Google
            Optimization or Complete Online Presence is the right fit for
            where your business is right now.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:hello@veroxa.com?subject=Restaurant Audit Request"
              data-testid="btn-pricing-cta-audit"
            >
              <Button
                size="lg"
                className="h-12 px-7 font-semibold shadow-[0_0_20px_rgba(99,102,241,0.25)]"
              >
                Request Free Audit <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </a>
            <Link href="/services" data-testid="btn-pricing-cta-services">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-7 border-border/60 hover:bg-accent/50"
              >
                View Services
              </Button>
            </Link>
            <Link href="/demo" data-testid="btn-pricing-cta-demo">
              <Button
                size="lg"
                variant="ghost"
                className="h-12 px-7 text-muted-foreground hover:text-foreground"
              >
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

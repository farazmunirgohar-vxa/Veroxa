import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Globe, LayoutDashboard, Megaphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav />

      {/* Hero */}
      <section className="pt-24 pb-16 px-6 lg:px-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-primary/15 blur-[100px] rounded-full pointer-events-none -z-10" />
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            Online Presence{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              for Restaurants
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700">
            Veroxa handles the online presence system restaurants need to stay visible, consistent,
            and trustworthy.
          </p>
        </div>
      </section>

      {/* What Veroxa helps with */}
      <section className="py-20 px-6 lg:px-12 bg-card/20 border-y border-border/40">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold">What Veroxa helps with</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-3">
            {[
              "Google visibility",
              "Facebook + Instagram consistency",
              "Picture posting",
              "Reels and TikTok available in Growth",
              "Ads management available in Premium",
              "Weekly updates and monthly reporting",
              "Client portal access",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-b-0">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-xl border border-primary/30 bg-primary/5 text-sm text-foreground/90 leading-relaxed max-w-3xl">
            <strong>Setup support:</strong> If the restaurant does not already
            have a needed website, Facebook page, Instagram account, TikTok
            account, or Google Business Profile, Veroxa will help create/setup
            the required basic account/page/presence during onboarding. This is
            not a custom website development package.
          </div>
        </div>
      </section>

      {/* Google Optimization */}
      <section className="py-20 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 mb-5">
              <Globe className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Google Optimization</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Google Optimization covers Google Search Engine SEO, Google Maps
              SEO, Google Business Profile, and Google reviews — so customers
              searching for nearby food can actually find the restaurant.
            </p>
            <p className="text-sm text-muted-foreground/70 leading-relaxed">
              Veroxa does not guarantee first-page Google rankings. Local search results depend on
              many factors outside any agency's control.
            </p>
          </div>
          <div className="space-y-4">
            {[
              "Google Search Engine SEO",
              "Google Maps SEO",
              "Google Business Profile optimization",
              "Google reviews support",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card/40">
                <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Content */}
      <section className="py-20 px-6 lg:px-12 bg-card/20 border-y border-border/40">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 space-y-4">
            {[
              "Essential focuses on social media picture posting",
              "Growth adds Reels and TikTok",
              "Caption writing and draft creation",
              "Posting depends on usable media from the restaurant",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
          <div className="order-1 md:order-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 mb-5">
              <Monitor className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Social Content System</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Essential focuses on social media picture posting to keep the
              restaurant active and consistent. Growth adds Reels and TikTok for
              stronger reach. Veroxa handles content structure, caption creation,
              and posting so the owner does not manage it day-to-day.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Posting depends on usable media from the restaurant. Veroxa may post
              up to once per day when enough usable content is available.
            </p>
            <p className="text-sm text-muted-foreground/70 leading-relaxed">
              Veroxa does not guarantee viral posts or a specific follower count.
            </p>
          </div>
        </div>
      </section>

      {/* Reporting */}
      <section className="py-20 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 mb-5">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Reporting and Accountability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Restaurant owners receive weekly updates and monthly performance reports through the
              client portal. The reporting system creates visibility into what is being done,
              builds trust, and makes it easy to see progress without chasing the team for updates.
            </p>
          </div>
          <div className="space-y-4">
            {[
              "Weekly client update feed",
              "Monthly performance reports",
              "Content calendar visibility",
              "Clear record of work done",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card/40">
                <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ads Management */}
      <section className="py-20 px-6 lg:px-12 bg-card/20 border-y border-border/40">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-0.5">Included in Premium</div>
              <h2 className="text-2xl font-bold">Ads Management</h2>
            </div>
          </div>
          <p className="text-muted-foreground mb-8 max-w-xl">
            Ads management is included in the Premium plan. Veroxa handles
            campaign setup, targeting, creative direction, monitoring, and
            reporting. Ad spend is always separate and paid by the restaurant
            directly to the ad platform.
          </p>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-3 mb-8">
            {[
              "Campaign setup support",
              "Audience and offer strategy",
              "Creative testing direction",
              "Ad performance monitoring",
              "Monthly ad summary",
              "Optimization recommendations",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-b-0">
                <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-sm text-amber-400/90 leading-relaxed max-w-xl">
            Advertising budget is separate and paid by the restaurant directly to the ad platform.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 lg:px-12">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6">See pricing or experience the demo</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing" data-testid="btn-services-cta-pricing">
              <Button size="lg" className="h-12 px-7 font-semibold shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                View Pricing <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/demo/client/dashboard" data-testid="btn-services-cta-demo">
              <Button size="lg" variant="outline" className="h-12 px-7 border-border/60 hover:bg-accent/50">
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

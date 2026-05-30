import { Link } from "wouter";
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

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-150">
          Veroxa helps restaurants improve consistency, content quality, Google visibility, and
          online trust through a structured online presence system.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
          <Link href="/free-audit" data-testid="btn-hero-audit">
            <Button size="lg" className="h-14 px-8 text-base font-semibold shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all">
              Request Free Audit
            </Button>
          </Link>
          <Link href="/services" data-testid="btn-hero-services">
            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-border/50 hover:bg-accent/50 transition-colors">
              View Services
            </Button>
          </Link>
        </div>
      </section>

      {/* What Veroxa Does */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">What Veroxa Does</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Veroxa helps restaurants manage their online presence, improve local visibility, stay
            consistent across Google and social media, and receive simple progress updates.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 lg:px-12 bg-card/20 border-t border-border/40">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Request a Free Restaurant Audit</h2>
          <p className="text-muted-foreground mb-10 leading-relaxed">
            See where your restaurant&apos;s Google visibility, reviews, website, and online
            presence can improve.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/free-audit" data-testid="btn-cta-audit">
              <Button size="lg" className="h-12 px-7 font-semibold shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                Request Free Audit
              </Button>
            </Link>
            <Link href="/services" data-testid="btn-cta-services">
              <Button size="lg" variant="outline" className="h-12 px-7 border-border/60 hover:bg-accent/50">
                View Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

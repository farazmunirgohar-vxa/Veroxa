import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { COMPLETE_ONLINE_PRESENCE_PLAN, GLOBAL_PRICING_RULES, MEDIA_DEPENDENCY_DISCLAIMER, SERVICE_BOUNDARY_DISCLAIMER, WEBSITE_SCOPE_DISCLAIMER } from "@/data/pricing/veroxaPricing";

export default function PricingPage() {
  useDocumentMeta({ title: "Veroxa Launch Offer", description: "Complete Online Presence is Veroxa's one public launch offer." });
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav />
      <main className="pt-28 pb-20 px-6 lg:px-12 flex-1">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">Compatibility page</p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">One public launch offer</h1>
          <p className="text-3xl font-bold text-primary mb-4">{COMPLETE_ONLINE_PRESENCE_PLAN.label} — {COMPLETE_ONLINE_PRESENCE_PLAN.displayPrice}/month</p>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">Veroxa no longer uses a public multi-package pricing funnel. The active public flow is Home, the restaurant online presence audit, and portal login.</p>
          <div className="rounded-2xl border border-border/40 bg-card/20 p-6 text-left mb-8">
            <h2 className="font-bold mb-3">Included</h2>
            <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
              {COMPLETE_ONLINE_PRESENCE_PLAN.includes.map((item) => <p key={item}>• {item}</p>)}
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-left mb-8">
            <div className="rounded-2xl border border-border/40 bg-card/20 p-5"><h2 className="font-bold mb-2">Coming soon / not included</h2>{COMPLETE_ONLINE_PRESENCE_PLAN.comingSoon.map((item) => <p className="text-sm text-muted-foreground" key={item}>• {item}</p>)}</div>
            <div className="rounded-2xl border border-border/40 bg-card/20 p-5"><h2 className="font-bold mb-2">Add-ons</h2>{COMPLETE_ONLINE_PRESENCE_PLAN.addons.map((addon) => <p className="text-sm text-muted-foreground" key={addon.id}>• {addon.label} — {addon.displayPrice}</p>)}</div>
            <div className="rounded-2xl border border-border/40 bg-card/20 p-5"><h2 className="font-bold mb-2">Boundaries</h2><p className="text-sm text-muted-foreground">{MEDIA_DEPENDENCY_DISCLAIMER}</p><p className="text-sm text-muted-foreground mt-2">{SERVICE_BOUNDARY_DISCLAIMER}</p><p className="text-sm text-muted-foreground mt-2">{WEBSITE_SCOPE_DISCLAIMER}</p></div>
          </div>
          <div className="rounded-2xl border border-border/40 bg-muted/10 p-5 text-left mb-8">
            <h2 className="font-bold mb-2">Launch rules</h2>
            {GLOBAL_PRICING_RULES.map((rule) => <p className="text-sm text-muted-foreground" key={rule}>• {rule}</p>)}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/"><Button variant="outline">Back to Home</Button></Link>
            <Link href="/free-audit"><Button>Request Audit</Button></Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

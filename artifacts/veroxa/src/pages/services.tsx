import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

const serviceScope = [
  "Google Business Profile and Google Maps/local visibility basics",
  "Basic website alignment/refinement when access is provided",
  "Facebook and Instagram picture-based content support",
  "Media guidance, weekly updates, and monthly online presence reporting",
  "Portal requests with response/review/answer within 24 hours",
];

export default function ServicesPage() {
  useDocumentMeta({ title: "Veroxa Services", description: "Compatibility page for Veroxa's one launch offer." });
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav />
      <main className="pt-28 pb-20 px-6 lg:px-12 flex-1">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">Compatibility page</p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Services are now bundled into one launch offer.</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">The main public flow is Home → Audit → Login. This hidden compatibility page keeps old links safe without reviving a separate Services/Pricing funnel.</p>
          <div className="grid sm:grid-cols-2 gap-3 text-left mb-8">
            {serviceScope.map((item) => <div className="rounded-xl border border-border/40 bg-card/20 p-4 text-sm text-muted-foreground" key={item}>{item}</div>)}
          </div>
          <div className="rounded-2xl border border-border/40 bg-card/20 p-5 text-sm text-muted-foreground mb-8">
            Website alignment/refinement is included when access is provided. New basic website is available as a +$95 add-on. Missing social profile creation is available as a +$45/profile add-on for Facebook or Instagram. Yelp, TikTok, Reels/video support, ads management, daily posting, paid ad spend, and guaranteed results are not included at launch.
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/"><Button variant="outline">Back to Home</Button></Link>
            <Link href="/free-audit"><Button>Start Audit</Button></Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

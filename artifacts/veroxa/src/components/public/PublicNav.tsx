import { Link } from "wouter";
import { Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicNav() {
  return (
    <nav className="h-20 border-b border-border/40 flex items-center px-6 lg:px-12 justify-between backdrop-blur-md sticky top-0 z-50 bg-background/80">
      <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80" data-testid="nav-link-home">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Hexagon className="w-5 h-5 fill-primary/20" />
        </div>
        <span className="font-bold tracking-tight text-xl">Veroxa</span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
        <Link href="/services" className="hover:text-foreground transition-colors" data-testid="nav-link-services">
          Services
        </Link>
        <Link href="/pricing" className="hover:text-foreground transition-colors" data-testid="nav-link-pricing">
          Pricing
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/demo/client/dashboard"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2"
          data-testid="nav-link-demo"
        >
          Demo
        </Link>
        <Link href="/login" data-testid="nav-link-login">
          <Button variant="default" className="font-semibold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-shadow">
            Login
          </Button>
        </Link>
      </div>
    </nav>
  );
}

import { Link } from "wouter";

export default function PublicNav() {
  return (
    <nav className="h-20 border-b border-border/40 flex items-center justify-center px-6 lg:px-12 backdrop-blur-md sticky top-0 z-50 bg-background/80">
      <div className="flex items-center gap-8 text-sm font-medium text-muted-foreground">
        <Link href="/services" className="hover:text-foreground transition-colors" data-testid="nav-link-services">
          Services
        </Link>
        <Link href="/pricing" className="hover:text-foreground transition-colors" data-testid="nav-link-pricing">
          Pricing
        </Link>
        <Link href="/login" className="hover:text-foreground transition-colors" data-testid="nav-link-login">
          Login
        </Link>
      </div>
    </nav>
  );
}

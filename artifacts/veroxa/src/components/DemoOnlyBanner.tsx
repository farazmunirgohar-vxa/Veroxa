import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DemoOnlyBannerProps {
  message: string;
  testId?: string;
}

/**
 * DemoOnlyBanner — visual-only banner stating a page is static demo.
 * No real action, no Supabase call, no upload, no AI is wired behind any
 * page that renders this banner.
 */
export function DemoOnlyBanner({ message, testId = "banner-demo-only" }: DemoOnlyBannerProps) {
  return (
    <Card className="bg-amber-500/5 border-amber-500/30 mb-6" data-testid={testId}>
      <CardContent className="p-4 flex items-start gap-3">
        <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500 flex-shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <p className="text-xs text-amber-200/90 leading-relaxed">{message}</p>
      </CardContent>
    </Card>
  );
}

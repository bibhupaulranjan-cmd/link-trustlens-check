import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { user, ready } = useSessionUser();
  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-3 text-lg font-bold text-foreground">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          <span className="font-display">TrustLens</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-medium">
          {ready && user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/history">My scans</Link>
              </Button>
              <Button onClick={() => supabase.auth.signOut()} variant="outline" size="sm" className="hidden sm:inline-flex">
                Sign out <ArrowUpRight aria-hidden />
              </Button>
            </>
          ) : ready ? (
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

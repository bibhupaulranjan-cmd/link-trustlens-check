import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/hooks/use-session";

export function SiteHeader() {
  const { user, ready } = useSessionUser();
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <ShieldCheck className="h-6 w-6 text-primary" aria-hidden />
          TrustLens
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          {ready && user ? (
            <>
              <Link to="/history" className="hover:text-primary">My scans</Link>
              <button onClick={() => supabase.auth.signOut()} className="text-muted-foreground hover:text-foreground">
                Sign out
              </button>
            </>
          ) : ready ? (
            <Link to="/auth" className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground">Sign in</Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { lovable } from "@/integrations/lovable";
import { SiteHeader } from "@/components/site-header";
import { useSessionUser } from "@/hooks/use-session";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TrustLens" },
      { name: "description", content: "Sign in to TrustLens to save your link checks." },
      { property: "og:title", content: "Sign in — TrustLens" },
      { property: "og:description", content: "Save and revisit your link safety checks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useSessionUser();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (user) navigate({ to: "/history" });
  }, [user, navigate]);

  async function google() {
    setError(null);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) setError("Google sign-in didn't complete. Please try again.");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto grid max-w-5xl gap-10 px-5 py-12 sm:px-8 sm:py-20 lg:grid-cols-[1fr_380px] lg:items-center">
        <section className="max-w-xl">
          <div className="mb-7 grid size-12 place-items-center rounded-xl bg-secondary text-accent"><ShieldCheck className="size-6" aria-hidden /></div>
          <p className="font-mono text-[11px] uppercase text-primary">Your link-check history</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">Pick up where you left off.</h1>
          <p className="mt-5 max-w-lg leading-7 text-muted-foreground">Sign in to keep your checks together and revisit the warning signs you’ve already reviewed.</p>
          <div className="mt-8 flex items-center gap-3 border-t border-border pt-5 text-sm text-muted-foreground"><LockKeyhole className="size-4 shrink-0 text-primary" aria-hidden /> Your saved scans are private to your account.</div>
        </section>
        <section className="border-t border-border pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <p className="text-sm font-semibold">Welcome to TrustLens</p>
          <p className="mt-1 text-sm text-muted-foreground">Continue securely with your Google account.</p>
          <Button
            onClick={google}
            variant="outline"
            className="mt-7 h-12 w-full justify-between bg-card px-4 text-sm font-semibold"
          >
            <span className="flex items-center gap-3">
              <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
              Continue with Google
            </span>
            <ArrowRight aria-hidden />
          </Button>
          {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
        </section>
      </main>
    </div>
  );
}

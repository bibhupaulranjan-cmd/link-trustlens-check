import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Activity, ArrowUpRight, Check, Link2, Loader2, Search, ShieldCheck, Waypoints } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ScanReportView } from "@/components/scan-report";
import { scanUrl } from "@/lib/scan/scan.functions";
import type { ScanReport } from "@/lib/scan/analyze";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/hooks/use-session";
import type { Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TrustLens — Check a link before you click" },
      { name: "description", content: "Paste any link and get an instant, explainable risk score for phishing and scam warning signs." },
      { property: "og:title", content: "TrustLens — Check a link before you click" },
      { property: "og:description", content: "Instant, explainable risk scores for suspicious links." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

const EXAMPLES = ["wikipedia.org", "http://paypal-secure-login.xyz/verify", "bit.ly/3abcd"];

function Home() {
  const scan = useServerFn(scanUrl);
  const { user } = useSessionUser();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ScanReport | null>(null);

  async function run(value: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await scan({ data: { url: value } });
      setReport(res.report);
      setError(res.error);
      if (res.report && user) {
        await supabase.from("scans").insert({
          user_id: user.id,
          url: res.report.normalized,
          host: res.report.host,
          score: res.report.score,
          verdict: res.report.verdict,
          report: res.report as unknown as Json,
        });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-12 lg:py-12">
        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <div className="border-b border-border pb-6">
            <p className="font-mono text-[11px] uppercase text-muted-foreground">Link intelligence</p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight">A clearer view of every link.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Check the address for common scam patterns before you decide to open it.
            </p>
          </div>
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-accent"><Link2 className="size-4" aria-hidden /></span>
              <div><p className="text-sm font-semibold">Address details</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Review the link’s structure and domain.</p></div>
            </div>
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-accent"><Waypoints className="size-4" aria-hidden /></span>
              <div><p className="text-sm font-semibold">Warning signs</p><p className="mt-1 text-xs leading-5 text-muted-foreground">See which patterns affected the result.</p></div>
            </div>
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-accent"><Activity className="size-4" aria-hidden /></span>
              <div><p className="text-sm font-semibold">Risk estimate</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Understand the score and its limits.</p></div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-secondary/60 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-primary" aria-hidden /> Privacy-minded check</div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">The submitted website is not opened. Results use the link address only.</p>
          </div>
        </aside>

        <section className="min-w-0 border-t border-border pt-7 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase text-primary">Link safety check</p>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-safe" /> Ready to check</span>
          </div>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">Look closer before you click.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Paste a link from a message or email. TrustLens reads the address for common scam patterns and explains what it finds.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(url);
            }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="url" className="sr-only">Link to check</label>
            <div className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-md border border-input bg-card px-4 shadow-sm focus-within:ring-2 focus-within:ring-ring">
              <Link2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/login"
                autoComplete="off"
                spellCheck={false}
                className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </div>
            <Button type="submit" disabled={loading || !url.trim()} className="h-12 px-6 font-semibold">
              {loading ? <Loader2 className="animate-spin" aria-hidden /> : <Search aria-hidden />}
              Check link
            </Button>
          </form>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="mr-1">Try an example</span>
            {EXAMPLES.map((ex) => (
              <Button key={ex} type="button" variant="outline" size="sm" onClick={() => { setUrl(ex); run(ex); }} className="h-8 max-w-full px-2.5 font-mono text-[11px]">
                <span className="truncate">{ex}</span><ArrowUpRight aria-hidden />
              </Button>
            ))}
          </div>

          {error && <p role="alert" className="mt-6 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
          {report && <div className="mt-8"><ScanReportView report={report} /></div>}

          {!user && report && (
            <p className="mt-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              <Link to="/auth" className="font-semibold text-primary underline underline-offset-4">Sign in</Link> to keep a history of your checks.
            </p>
          )}

          <p className="mt-12 flex items-start gap-2 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-safe" aria-hidden />
            Results are an estimate based on the address alone and can be wrong. When in doubt, don't enter passwords or payment details.
          </p>
        </section>
      </main>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ScanReportView } from "@/components/scan-report";
import { scanUrl } from "@/lib/scan/scan.functions";
import type { ScanReport } from "@/lib/scan/analyze";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/hooks/use-session";
import type { Json } from "@/integrations/supabase/types";

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
      <main className="mx-auto max-w-3xl px-5 py-12 sm:py-20">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Link safety check</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Look closer before you click.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
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
          <input
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/login"
            autoComplete="off"
            spellCheck={false}
            className="h-12 flex-1 rounded-md border border-input bg-card px-4 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
            Check link
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          Try:
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => { setUrl(ex); run(ex); }} className="font-mono underline-offset-2 hover:underline">
              {ex}
            </button>
          ))}
        </div>

        {error && <p role="alert" className="mt-6 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
        {report && <div className="mt-8"><ScanReportView report={report} /></div>}

        {!user && report && (
          <p className="mt-4 text-sm text-muted-foreground">
            <Link to="/auth" className="font-medium text-primary underline">Sign in</Link> to keep a history of your checks.
          </p>
        )}

        <p className="mt-16 border-t border-border pt-6 text-xs text-muted-foreground">
          TrustLens never opens the website you submit. Results are an estimate based on the address alone and can be wrong — when in doubt, don't enter passwords or payment details.
        </p>
      </main>
    </div>
  );
}

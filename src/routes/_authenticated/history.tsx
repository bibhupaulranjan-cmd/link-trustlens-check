import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowUpRight, Clock3, ShieldCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { ScanReportView } from "@/components/scan-report";
import type { ScanReport } from "@/lib/scan/analyze";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "My scans — TrustLens" },
      { name: "description", content: "Your private history of TrustLens link checks." },
      { property: "og:title", content: "My scans — TrustLens" },
      { property: "og:description", content: "Your private history of link checks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: History,
});

const TONE: Record<string, string> = { likely_safe: "text-safe", suspicious: "text-caution", high_risk: "text-danger" };

function History() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["scans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("scans").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  async function remove(id: string) {
    await supabase.from("scans").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["scans"] });
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-12 lg:py-12">
        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <div className="border-b border-border pb-6">
            <p className="font-mono text-[11px] uppercase text-muted-foreground">Your account</p>
            <h2 className="mt-3 text-2xl font-semibold">A record of your checks.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Review scan results and revisit the details whenever you need them.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-accent"><Clock3 className="size-4" aria-hidden /></span>
            <div><p className="text-sm font-semibold">Recent scans</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Your latest link checks appear first.</p></div>
          </div>
          <div className="rounded-lg border border-border bg-secondary/60 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-primary" aria-hidden /> Private history</div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Only you can see the scans saved to your account.</p>
          </div>
        </aside>
        <section className="min-w-0 border-t border-border pt-7 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
            <div><p className="font-mono text-[11px] uppercase text-primary">History</p><h1 className="mt-2 text-3xl font-semibold">My scans</h1></div>
            <Button asChild variant="outline" size="sm"><Link to="/">Check a link <ArrowUpRight aria-hidden /></Link></Button>
          </div>
          {isLoading && <p className="mt-6 text-muted-foreground">Loading…</p>}
          {data && data.length === 0 && <p className="mt-6 text-muted-foreground">No scans yet. Check a link from the home page.</p>}
          <ul className="mt-5 divide-y divide-border">
          {data?.map((s) => (
            <li key={s.id} className="py-3">
              <div className="flex items-center gap-3 rounded-md px-3 py-3 transition-colors hover:bg-muted/60">
                <Button onClick={() => setOpen(open === s.id ? null : s.id)} variant="ghost" className="h-auto min-w-0 flex-1 justify-start whitespace-normal px-0 py-1 text-left">
                  <span className="flex min-w-0 flex-col items-start">
                    <span className="max-w-full truncate font-mono text-sm">{s.host}</span>
                    <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</span>
                  </span>
                </Button>
                <span className={`font-semibold ${TONE[s.verdict] ?? ""}`}>{s.score}</span>
                <Button onClick={() => remove(s.id)} variant="ghost" size="icon" aria-label="Delete scan" className="text-muted-foreground hover:text-danger">
                  <Trash2 aria-hidden />
                </Button>
              </div>
              {open === s.id && <div className="mt-2"><ScanReportView report={s.report as unknown as ScanReport} /></div>}
            </li>
          ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

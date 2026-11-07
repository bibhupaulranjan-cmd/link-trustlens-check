import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { ScanReportView } from "@/components/scan-report";
import type { ScanReport } from "@/lib/scan/analyze";

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
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-bold">My scans</h1>
        {isLoading && <p className="mt-6 text-muted-foreground">Loading…</p>}
        {data && data.length === 0 && <p className="mt-6 text-muted-foreground">No scans yet. Check a link from the home page.</p>}
        <ul className="mt-6 space-y-3">
          {data?.map((s) => (
            <li key={s.id} className="rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3 p-4">
                <button onClick={() => setOpen(open === s.id ? null : s.id)} className="min-w-0 flex-1 text-left">
                  <p className="truncate font-mono text-sm">{s.host}</p>
                  <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</p>
                </button>
                <span className={`font-semibold ${TONE[s.verdict] ?? ""}`}>{s.score}</span>
                <button onClick={() => remove(s.id)} aria-label="Delete scan" className="text-muted-foreground hover:text-danger">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {open === s.id && <div className="p-2 pt-0"><ScanReportView report={s.report as unknown as ScanReport} /></div>}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

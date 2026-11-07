import { Download } from "lucide-react";
import type { ScanReport, Severity, Verdict } from "@/lib/scan/analyze";

const VERDICT: Record<Verdict, { label: string; cls: string; ring: string }> = {
  likely_safe: { label: "Likely safe", cls: "text-safe", ring: "border-safe" },
  suspicious: { label: "Suspicious", cls: "text-caution", ring: "border-caution" },
  high_risk: { label: "High risk", cls: "text-danger", ring: "border-danger" },
};
const SEV: Record<Severity, string> = {
  info: "bg-muted text-muted-foreground",
  low: "bg-secondary text-secondary-foreground",
  medium: "bg-caution/20 text-foreground",
  high: "bg-danger/15 text-danger",
};

export function ScanReportView({ report }: { report: ScanReport }) {
  const v = VERDICT[report.verdict];
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `trustlens-${report.host}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm" aria-live="polite">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className={`flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full border-8 ${v.ring}`}>
          <span className="text-3xl font-bold">{report.score}</span>
          <span className="text-xs text-muted-foreground">risk / 100</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-2xl font-bold ${v.cls}`}>{v.label}</p>
          <p className="mt-1 break-all font-mono text-sm text-muted-foreground">{report.defanged}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Confidence: {report.confidence} · based on the link text only
          </p>
        </div>
        <button onClick={exportJson} className="inline-flex items-center gap-2 self-start rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
          <Download className="h-4 w-4" aria-hidden /> JSON
        </button>
      </div>

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Why</h3>
      <ul className="mt-2 space-y-2">
        {report.findings.map((f) => (
          <li key={f.id} className="flex gap-3 rounded-md border border-border p-3">
            <span className={`h-fit rounded px-2 py-0.5 font-mono text-xs ${SEV[f.severity]}`}>{f.severity}</span>
            <div>
              <p className="font-medium">{f.title}</p>
              <p className="text-sm text-muted-foreground">{f.detail}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-xs text-muted-foreground">
        Not yet checked: {report.notRun.join(", ")}. This is a probabilistic estimate, not a guarantee.
      </p>
    </section>
  );
}

// Pure, URL-string-only risk analysis. Never fetches the target.

export type Severity = "info" | "low" | "medium" | "high";
export type Verdict = "likely_safe" | "suspicious" | "high_risk";

export interface Finding {
  id: string;
  title: string;
  detail: string;
  severity: Severity;
  points: number;
}

export interface ScanReport {
  input: string;
  normalized: string;
  defanged: string;
  host: string;
  score: number; // 0 = safe, 100 = very risky
  verdict: Verdict;
  confidence: "low" | "medium";
  findings: Finding[];
  notRun: string[];
  analyzedAt: string;
}

export class UrlValidationError extends Error {}

const SUSPICIOUS_TLDS = new Set([
  "zip", "mov", "xyz", "top", "click", "country", "gq", "tk", "ml", "cf", "ga", "work", "rest", "cam", "loan", "kim",
]);
const SHORTENERS = new Set(["bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "ow.ly", "cutt.ly", "rb.gy", "buff.ly"]);
const BRANDS = ["paypal", "apple", "microsoft", "amazon", "google", "netflix", "facebook", "instagram", "whatsapp", "bank", "chase", "wellsfargo", "sbi", "hdfc", "icici"];
const LURE_WORDS = ["login", "signin", "verify", "account", "update", "secure", "wallet", "password", "confirm", "suspend", "unlock", "bonus", "free", "gift"];

export function normalizeUrl(raw: string): URL {
  const input = raw.trim();
  if (!input) throw new UrlValidationError("Enter a link to check.");
  if (input.length > 2048) throw new UrlValidationError("That link is too long (max 2048 characters).");
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(input) ? input : `https://${input}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new UrlValidationError("That doesn't look like a valid web address.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UrlValidationError("Only http and https links can be checked.");
  }
  if (!url.hostname || !url.hostname.includes(".") && !isIp(url.hostname)) {
    throw new UrlValidationError("The link needs a full domain name, like example.com.");
  }
  if (isPrivateHost(url.hostname)) {
    throw new UrlValidationError("Private, local or internal addresses can't be checked.");
  }
  return url;
}

function isIp(host: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[");
}

export function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (h === "::1" || h === "::" || h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

export function defang(url: string) {
  return url.replace(/^http/i, "hxxp").replace(/\./g, "[.]");
}

export function verdictFor(score: number): Verdict {
  if (score >= 60) return "high_risk";
  if (score >= 25) return "suspicious";
  return "likely_safe";
}

export function analyzeUrl(raw: string, now = new Date()): ScanReport {
  const url = normalizeUrl(raw);
  const host = url.hostname.toLowerCase();
  const labels = host.split(".");
  const tld = labels[labels.length - 1];
  const registrable = labels.slice(-2).join(".");
  const findings: Finding[] = [];
  const add = (f: Finding) => findings.push(f);

  if (url.protocol === "http:") add({ id: "no-https", title: "Not encrypted", detail: "The link uses http, so anything you type could be read in transit.", severity: "medium", points: 15 });
  if (isIp(host)) add({ id: "ip-host", title: "Raw IP address", detail: "Legitimate sites rarely send you to a bare number address.", severity: "high", points: 30 });
  if (host.startsWith("xn--") || host.includes(".xn--")) add({ id: "punycode", title: "Look-alike characters", detail: "The domain uses encoded international characters that can imitate a real brand.", severity: "high", points: 30 });
  if (url.username || url.password || raw.includes("@") && raw.indexOf("@") < raw.indexOf(host) + host.length) {
    if (url.username || url.password) add({ id: "userinfo", title: "Hidden destination trick", detail: "Text before an @ sign can disguise where the link really goes.", severity: "high", points: 30 });
  }
  if (SUSPICIOUS_TLDS.has(tld)) add({ id: "tld", title: `Frequently abused ending (.${tld})`, detail: "This domain ending is common in scam campaigns. Not proof, but be careful.", severity: "medium", points: 15 });
  if (SHORTENERS.has(host)) add({ id: "shortener", title: "Link shortener", detail: "The real destination is hidden. We don't follow it in this version.", severity: "low", points: 10 });
  if (labels.length > 4) add({ id: "subdomains", title: "Many subdomains", detail: `${labels.length - 2} subdomain levels can be used to bury a fake brand name.`, severity: "medium", points: 10 });
  if (host.length > 40) add({ id: "long-host", title: "Very long domain", detail: "Unusually long domains are a common phishing pattern.", severity: "low", points: 8 });
  const hyphens = (registrable.match(/-/g) || []).length;
  if (hyphens >= 2) add({ id: "hyphens", title: "Hyphen-heavy domain", detail: "Domains like secure-login-bank are often imitations.", severity: "low", points: 8 });

  const brand = BRANDS.find((b) => host.includes(b) && !registrable.startsWith(b + "."));
  if (brand) add({ id: "brand", title: `Mentions “${brand}” outside its own domain`, detail: `The real site is controlled by “${registrable}”, not ${brand}.`, severity: "high", points: 25 });

  const pathLower = (url.pathname + url.search).toLowerCase();
  const lures = LURE_WORDS.filter((w) => host.includes(w) || pathLower.includes(w));
  if (lures.length) add({ id: "lures", title: "Pressure or login words", detail: `Contains: ${lures.slice(0, 4).join(", ")}.`, severity: lures.length > 1 ? "medium" : "low", points: Math.min(lures.length * 5, 15) });
  if (url.href.length > 200) add({ id: "long-url", title: "Very long link", detail: "Long links can hide tracking or the real destination.", severity: "low", points: 5 });
  if (url.port && url.port !== "80" && url.port !== "443") add({ id: "port", title: "Unusual port", detail: `Uses port ${url.port}, which normal websites rarely do.`, severity: "medium", points: 12 });

  const score = Math.min(100, findings.reduce((s, f) => s + f.points, 0));
  if (!findings.length) add({ id: "clean", title: "No warning signs in the link", detail: "The address itself looks ordinary. That doesn't guarantee the site is safe.", severity: "info", points: 0 });

  return {
    input: raw.trim(),
    normalized: url.href,
    defanged: defang(url.href),
    host,
    score,
    verdict: verdictFor(score),
    confidence: findings.length >= 3 ? "medium" : "low",
    findings: findings.sort((a, b) => b.points - a.points),
    notRun: ["Page content inspection", "Certificate history", "Threat-intelligence feeds", "Domain age lookup"],
    analyzedAt: now.toISOString(),
  };
}

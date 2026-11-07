import { describe, expect, it } from "vitest";
import { analyzeUrl, normalizeUrl, verdictFor } from "./analyze";

describe("URL validation", () => {
  it("rejects non-http schemes", () => expect(() => normalizeUrl("javascript:alert(1)")).toThrow());
  it("rejects private addresses", () => {
    expect(() => normalizeUrl("http://192.168.1.1")).toThrow();
    expect(() => normalizeUrl("http://localhost:3000")).toThrow();
  });
  it("adds https when missing", () => expect(normalizeUrl("example.com").protocol).toBe("https:"));
});

describe("scoring", () => {
  it("verdict thresholds", () => {
    expect(verdictFor(24)).toBe("likely_safe");
    expect(verdictFor(25)).toBe("suspicious");
    expect(verdictFor(60)).toBe("high_risk");
  });
  it("plain domain is likely safe", () => expect(analyzeUrl("https://wikipedia.org").verdict).toBe("likely_safe"));
  it("brand impersonation on abused TLD is high risk", () => {
    const r = analyzeUrl("http://paypal-secure-login.xyz/verify");
    expect(r.verdict).toBe("high_risk");
  });
});

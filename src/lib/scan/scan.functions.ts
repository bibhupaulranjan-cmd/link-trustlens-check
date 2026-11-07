import { createServerFn } from "@tanstack/react-start";
import { analyzeUrl, UrlValidationError, type ScanReport } from "./analyze";

export const scanUrl = createServerFn({ method: "POST" })
  .inputValidator((input: { url: string }) => {
    if (typeof input?.url !== "string") throw new Error("Invalid input");
    return { url: input.url.slice(0, 2100) };
  })
  .handler(async ({ data }): Promise<{ report: ScanReport | null; error: string | null }> => {
    try {
      return { report: analyzeUrl(data.url), error: null };
    } catch (e) {
      if (e instanceof UrlValidationError) return { report: null, error: e.message };
      console.error(e);
      return { report: null, error: "We couldn't check that link. Please try again." };
    }
  });

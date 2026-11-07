# TrustLens — first release

## Build
- Replace the template home page with TrustLens: a clear URL-scanning workspace with an accessible paste-and-scan flow, reassuring risk colors, and a concise safety disclaimer.
- Add a server-side, URL-only assessment and a readable report with an explainable score, leading reasons, confidence, safe defanged URL display, shareable report access, and JSON export. Clearly mark engines that are not yet implemented instead of implying they ran.
- Persist scans and user profiles through Lovable Cloud with explicit grants and row-level access rules. Add the requested email and Google account paths, profile setup, and scan history without exposing private account data.
- Make error, loading, and mobile layouts usable; add focused tests for URL validation and scoring rules.

## Safety boundaries
- Analyze only the URL string in this release. Do not fetch the submitted site, follow redirects, render its HTML, or run active checks; this avoids turning the scanner into a server-side request proxy.
- State plainly that results are probabilistic and not a guarantee. Keep deeper page inspection, certificate intelligence, community moderation, and public API access out of this first release until their safety and access controls are implemented.

## Technical details
- Use TanStack Start server functions for internal scanning; no Supabase Edge Functions. Validate and normalize HTTP(S) URLs on the server, block private/loopback/link-local destinations even though this release performs no target fetch, and use bounded input and request handling.
- Add Cloud schema through the migration tool only. Create a private `profiles` table and user-owned scan records with grants, RLS, and an auth signup profile trigger; use a separate `user_roles` table only when moderation/admin features are introduced.
- Keep theme colors and typography in the global semantic design tokens; give the home and report their own route metadata.
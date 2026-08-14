# Security baseline

## Headers (HTML)
Every HTML response from the router shell path includes:
- `Content-Security-Policy` with a **per-request script nonce** (`script-src 'nonce-…'`)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` / `frame-ancestors 'none'`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy` (camera/mic/geo/payment disabled)

Inline scripts are stamped with the same nonce in `decorateHtmlWithShell`.

## Headers (API)
JSON helpers use `apiSecurityHeaders` (`no-store`, `nosniff`, `no-referrer`, `X-Frame-Options`).

## Auth
- Bearer tokens validated via Supabase `/auth/v1/user`.
- `BETA_AUTH_BYPASS=1` is **only** valid when `ENVIRONMENT` is `jfl` or `dru`. Other environments throw at request time.
- Data plane uses the **service role** key in the Worker — authorization must be enforced in commands (see authorization checklist).

## Tokens in the browser
Access tokens live in `sessionStorage`. CSP is the primary XSS mitigation; treat any XSS as session-compromising.

## Cloudflare rate limits (operator)
Configure in Cloudflare dashboard (or Terraform later):

| Rule target | Suggestion |
|-------------|------------|
| `/api/admin/*` | Tight per-IP (e.g. 30 req/min) |
| `/api/me/contact*` | Tight (reveal/save) |
| `/api/*` | Moderate baseline |
| `/health*` | Allow probes; still no secrets |

## Authorization checklist
See `docs/security-authorization-checklist.md`.

# Production apex DNS guard

After the 2026-08-16 incident (Workers custom domain binding for `fremontderby.com` missing → no public A/AAAA → `ERR_NAME_NOT_RESOLVED`), these checks are mandatory:

| Check | Where |
|-------|--------|
| `node scripts/assert-production-dns.mjs` | Hourly live probe, lane health monitor (15m), restore domains, production deploy |
| `node scripts/diagnose-worker-domains.mjs` | Lane health monitor, restore domains, production deploy |

**Break-glass:** Actions → **Restore lane custom domains** → run on `self-hosted` (uses `CLOUDFLARE_*` secrets).

**Client aftercare:** SOA negative cache can be ~30 minutes (`MINIMUM` 1800). Flush DNS / try 1.1.1.1 if browsers still show `ERR_NAME_NOT_RESOLVED` after guards are green.

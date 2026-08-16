# Change safety net (UI + infra)

As routes, shells, and lane deploys move, these automated guards exist so humans are not the first detector.

## What tends to break

| Change | Failure mode | Guard |
|--------|--------------|--------|
| Cloudflare domain / deploy | Apex DNS empty, `ERR_NAME_NOT_RESOLVED` | `assert-production-dns.mjs`, restore workflow, 15m monitor |
| Lane deploy with wrong env | Host serves `production` identity | `assert-lane-health.mjs` |
| UI route rename/remove | 404 / empty shell on bookmarks | `public-surface-contract` + `assert-public-surface.mjs` |
| HTML shell regression | Status 200 but blank/broken document | HTML markers in canary |
| Prod deploy without domain bind | DNS lag or missing binding | diagnose on production deploy |
| Client DNS after fix | Stale NXDOMAIN ~30m | docs/apex-dns-incident-guard.md |

## Workflows

| Workflow | When | What |
|----------|------|------|
| **Public surface canary** | Every :10 and :40, push to `main`, manual | DNS + HTML/JSON canary |
| **Lane health monitor** | Every 15m, manual | DNS + lane env + CF bindings + full surface |
| **Hourly live probe** | Hourly | Broader path list on prod + lanes |
| **Restore lane custom domains** | Manual break-glass | Re-attach apex/www/lanes |
| **Deploy release lanes** | Manual | Production lane runs DNS + diagnose after deploy |

## Local / agent commands

```bash
node scripts/assert-production-dns.mjs
node scripts/assert-lane-health.mjs
node scripts/assert-public-surface.mjs
CANARY_ONLY=production,www node scripts/assert-public-surface.mjs
node scripts/diagnose-worker-domains.mjs   # needs CLOUDFLARE_* 
```

## When you move UI

1. Update `scripts/public-surface-contract.mjs` if you **intentionally** add/remove a public path.
2. Keep string path references in `src/index.js` / `src/routerEntry.js` so contract tests stay green.
3. After deploy, run public surface canary (or wait for schedule).
4. Do not close a “UI ship” until production canary is green (DNS + shells).

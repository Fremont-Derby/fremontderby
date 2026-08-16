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

## Do work!

Human/agent cue **Do work!** means follow [do-work-protocol.md](./do-work-protocol.md): safety net first, then the next verified increment.

## Concrete example (production + www)

Run from the repo root after `npm` deps are available (scripts are plain Node, no build required):

```bash
# 1) DNS must resolve and /health must be ok
node scripts/assert-production-dns.mjs

# 2) Public HTML/JSON canary (subset of hosts)
CANARY_ONLY=production,www node scripts/assert-public-surface.mjs

# Or the full pack used under "Do work!"
npm run canary
```

### Example success transcript

DNS guard (abridged):

```text
Production DNS + /health OK for fremontderby.com, www.fremontderby.com
```

Surface canary (abridged — each line is one check):

```text
OK production json 200 https://fremontderby.com/health
OK production json 200 https://fremontderby.com/health/environment
OK production html 200 https://fremontderby.com/
OK production html 200 https://fremontderby.com/standings
OK production html 200 https://fremontderby.com/schedule
OK production html 200 https://fremontderby.com/teams
… (prizes, lineup, profile, availability, trades, admin, season-setup, playoffs, demo)
OK www json 200 https://www.fremontderby.com/health
OK www html 200 https://www.fremontderby.com/
…
Public surface canary passed { hosts: [ 'production', 'www' ], checks: 32 }
```

Exit code **0** means green.

### Example failure shapes

| Log pattern | Meaning | First action |
|-------------|---------|--------------|
| `fremontderby.com: no A/AAAA via DoH` | Apex DNS hole (custom domain binding) | Actions → **Restore lane custom domains** |
| `FAIL production html 404 https://fremontderby.com/standings` | Route missing after UI move | Restore path or update `public-surface-contract.mjs` if intentional |
| `html shell markers missing` | 200 body without real document shell | Fix template/doctype/viewport/brand markup |
| `env="production" expected="dru"` | Lane host serving wrong Worker env | Redeploy/bind that lane; do not “fix” in CSS |

### GitHub Actions equivalent

**Actions → Public surface canary → Run workflow**  
- `runner_target`: `self-hosted`  
- `canary_only`: `production,www` (or leave empty for all lanes)

Same scripts run in CI; scheduled runs also open/update a **canary** issue when red.

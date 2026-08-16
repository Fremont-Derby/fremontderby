# “Do work!” protocol (current meaning)

When a collaborator says **Do work!** (or the hourly Grok loop runs), that is **not** permission to thrash the repo. It means: run the **change safety net**, fix what is red, then ship the highest-value **verified** increment.

## Priority order (always)

1. **Production name & DNS** — `npm run canary:dns`  
   If red: **Restore lane custom domains** first. Do not “fix” DNS with app code.
2. **Lane identity** — `npm run canary:lanes`  
   Wrong `environment` on a host is a deploy/bind problem, not a UI tweak.
3. **Public surface** — `npm run canary:surface`  
   Broken shells/routes after UI moves fail here; update `public-surface-contract.mjs` only when the product intentionally changes paths.
4. **CI / tests** — `npm test` for the slice you touched; do not delete tests to go green.
5. **Small ship** — focused PR, production/lane canary green, comment on blockers instead of silent half-fixes.

## In scope for Do work!

- Canary failures, domain diagnose/restore dispatch, flake fixes
- UI/route regressions called out by contract or surface canary
- Closing validated issues with proof (commands + URLs)
- Docs that keep agents from repeating the apex-DNS class of outage
- Low-risk product polish that keeps canaries green

## Out of scope unless explicitly requested

- Payment / billing / paid GitHub product changes
- Pasting or rotating secrets in chat
- Broad refactors with no canary story
- “Go ham” volume of drive-by PRs that skip verification
- Infra mutation outside documented workflows (prefer `workflow_dispatch` scripts that already use Actions secrets)

## Definition of done for a Do work! session

- [ ] `npm run canary` green (or failures filed with exact command output)
- [ ] Any merged change has a revert story and does not leave apex/www unbound
- [ ] Issue/PR notes are professional (cheeky only when the human used “Do work!” as the cue)
- [ ] No claim of “fixed” without a probe (DNS, `/health`, or surface canary)

## Automation map

| Layer | Role under Do work! |
|-------|---------------------|
| Grok hourly loop | Judgment: pick next item from this protocol |
| CF cron + hourly Actions probe | Deterministic public path probes |
| Lane health monitor (15m) | DNS + env + CF bindings + surface |
| Public surface canary | Route/shell regression after UI/deploy |
| Restore / diagnose workflows | Break-glass for domain binding |

See also: `docs/change-safety-net.md`, `docs/apex-dns-incident-guard.md`, `docs/hybrid-hourly-automation.md`.

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

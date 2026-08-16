# Beta / open-auth lanes (JFL & DRU)

Canonical detail lives in **`docs/ENVIRONMENTS.md`**. This page is a short pointer so links do not go stale.

## What “beta” means here

| Lane | Host | Auth intent | Data |
|------|------|-------------|------|
| JFL | `https://jfl.fremontderby.com` | Open-auth / test actor (`BETA_AUTH_BYPASS=1`) when the Worker env is really `jfl` | Schema `jfl` on shared staging Supabase |
| DRU | `https://dru.fremontderby.com` | Same pattern for `dru` | Schema `dru` on shared staging |
| Gamma | `https://gamma.fremontderby.com` | **No** open-auth | Schema `gamma` on shared staging |
| Production | `https://fremontderby.com` | Google auth required | Production project |

## Source of truth

- Worker vars/routes: `wrangler.jsonc`
- Domain attach helper: `scripts/restore-lane-custom-domains.mjs`
- Identity probe: `scripts/assert-lane-health.mjs` / `GET /health/environment`
- Schema partition SQL: see migrations referenced in `docs/ENVIRONMENTS.md`
- Human DNS/deploy runbook when live identity drifts: issue trackers labeled `[HUMAN][CLOUDFLARE]` (e.g. stabilize dru/jfl)

## Do not

- Point beta hostnames at the production Worker script
- Enable `BETA_AUTH_BYPASS` on gamma or production
- Treat Actions green/red as lane health without checking `/health/environment`

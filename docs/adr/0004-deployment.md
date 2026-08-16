# ADR 0004 — Deployment

## Status
Accepted (amended for shared-staging lanes)

## Context
Fremont Derby deploys Cloudflare Workers with explicit environments. Non-production lanes need isolation without requiring three paid Supabase projects.

## Decision
- **Production** deploys from `main` to the production Worker and `fremontderby.com`.
- **JFL / DRU / gamma** use dedicated Workers and hostnames declared in `wrangler.jsonc`.
- **Data isolation** for those lanes is **Postgres schema partitioning** on the shared staging Supabase project, selected via PostgREST `Accept-Profile` / `Content-Profile`.
- Preferred git branches remain `fremontderby-{jfl,dru,gamma}`; deploy from `main` is allowed only with an explicit allow-flag for automation.
- GitHub Actions may deploy when hosted runners allocate and `CLOUDFLARE_*` Actions secrets are present; otherwise operators use local Wrangler or Workers Builds.
- Shared infrastructure mutations (DNS, secrets, schema exposure) stay on dedicated cards (#680 practice).

## Consequences
- `/health/environment` must report the lane name (`dru` / `jfl` / `gamma` / `production`), not only “the site loads.”
- Schema migrations must be **applied** on staging to match code on `main`.
- Empty-runner CI failures are infrastructure, not proof of product test failure.

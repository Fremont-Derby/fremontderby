# Season 1 test contract

Purpose: keep **high confidence** for mid-season pushes to production. Green CI is necessary; it is not a substitute for live lane identity or applied migrations.

## Before merging to `main`

Run locally or rely on CI:

```bash
npm run lint
npm run check
npm test
npm run test:season1
npm run test:floor
npm run labels:check
npm run build
```

`npm run test:season1` is a faster critical subset for hotfixes (still run full `npm test` before production merges).

Critical automated areas already covered under `test/`:

| Area | Examples |
|------|----------|
| Season lifecycle | `season1-complete-e2e`, `regular-season-e2e`, `season-publish-readiness` |
| Scoring / scorecard | `rack-ledger-scorecard`, `two-device-scorecard-flow`, dual-score tests |
| Auth boundaries | `beta-auth-bypass`, `auth-status-contract`, `environment-readiness` |
| Admin directories | player/season/team assignment + UX tests |
| Deploy guards | `deploy-lane`, `assert-lane-health`, `release-smoke`, `production-smoke-incident` |

## Live gates (not unit-testable alone)

1. **Lane identity:** `node scripts/assert-lane-health.mjs`
   - `dru` / `jfl` / `gamma` / production hosts must report the matching `environment` value.
   - DNS alone is insufficient if a lane host reports `production`.
2. **Open-auth only on test lanes:** admin APIs without bearer must stay **401** on production and gamma.
3. **Migrations applied on the target DB** after merge — merged SQL on `main` does not close data cards until live probes pass.
4. **Production smoke** after deploy: exact `versionTag` SHA + `/health/environment` production readiness.

## Rule for first-season hotfixes

- Prefer smallest PR + existing regression tests over broad refactors.
- If touching auth, env, Worker bindings, or scoring: add or extend a unit/contract test in the same PR.
- Do not merge with failing `npm test`.
- Do not treat Workers domain attach as proof of correct `ENVIRONMENT`.


## CI

Pull requests and pushes run a dedicated `test-season1` job (`npm run test:season1` + `npm run test:floor`) in addition to the full `npm test` job.

## Known regression locks added mid-build

- Membership `list_joinable_team_registration` must keep **full arrays** (not first-row unwrap).
- Season close HTTP status mapping is unit-tested for auth/404/409 paths.

## Live ops checklist (QA lanes)

Goal of DRU/JFL: **signed-out normal-path QA** (create/find flows with ordinary names — not fuzzing).

Before treating a lane as open-auth ready:

1. DNS resolves for `dru.fremontderby.com` / `jfl.fremontderby.com`
2. `/health/environment` returns matching `environment` (`dru`|`jfl`) and `ok: true`
3. Admin/API without bearer works only on those lanes; production/gamma still 401
4. Worker secrets from `wrangler.jsonc` `secrets.required` are provisioned (`BETA_ACTOR_USER_ID` included)
5. Prefer `wrangler deploy --env <lane>` (or branch deploy) so custom domains + vars ship together — ad-hoc domain attach alone is not durable

If domain restore Actions fail, check `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` repository secrets and Cloudflare Workers Builds for `fremontderby-dru` / `fremontderby-jfl`.


## Wrangler-owned lane domains (#639)

- Lane hostnames (`dru` / `jfl` / `gamma`) must come from `wrangler deploy --env <lane>` with `custom_domain: true` routes.
- Do not treat ad-hoc `/workers/domains` attach or restore scripts as the durable source of truth.
- After deploy, confirm `/health/environment` reports the matching lane `environment` value (not `production` on a lane host).

## Ops recovery baseline

Backups, audit, health probes, and recovery runbooks: [ops-backup-audit-recovery.md](./ops-backup-audit-recovery.md) (#30).

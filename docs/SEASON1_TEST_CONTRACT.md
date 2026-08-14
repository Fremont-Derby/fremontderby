# Season 1 test contract

Purpose: keep **high confidence** for mid-season pushes to production. Green CI is necessary; it is not a substitute for live lane identity or applied migrations.

## Before merging to `main`

Run locally or rely on CI:

```bash
npm run lint
npm run check
npm test
npm run test:season1
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

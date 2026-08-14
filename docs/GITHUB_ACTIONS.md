# GitHub Actions inventory (Fremont Derby)

## Current constraint

GitHub-hosted runners often fail to allocate for this repository (`runner_id: 0`, zero steps, job concludes `failure` in seconds). That is an **account/billing runner** problem, not a proof that application tests failed.

Until runners allocate:

- Prefer **local** `npm test` / `npm run test:season1` / `npm run a11y` as the test source of truth.
- Prefer **Cloudflare Workers Builds** (or laptop `npm run deploy` / `deploy:dru` / `deploy:jfl`) as the publish path when Actions deploy cannot start.
- Do **not** delete tests to silence red X marks from empty runners.

Related: #679 (POC pause), #692 (TEMP deploy without test gate), #701 (restore automatic gates).

## Workflows on `main`

| Workflow file | Name | Trigger (main) | Purpose |
|---------------|------|----------------|---------|
| `ci.yml` | CI | `workflow_dispatch` only | lint, check, labels, full tests, a11y, season1, build, test floor; optional deploy/smoke jobs when re-enabled historically |
| `deploy-release-lanes.yml` | Deploy release lanes | `workflow_dispatch` (`lane`: gamma/jfl/dru/production/all-lanes) | Deploy one lane; **TEMP** no test gate (#692); probe is `continue-on-error` |
| `diagnose-worker-domains.yml` | Diagnose worker domains | `workflow_dispatch` | Cloudflare domain diagnostics |
| `lane-health-monitor.yml` | Lane health monitor | `workflow_dispatch` | Probe `/health/environment` identity per host |
| `pr-card-contract.yml` | PR card contract | historically PR-triggered; verify file on main | Enforce implementation-card shape on PRs |
| `staging-readiness.yml` | Staging readiness | `workflow_dispatch` | Hosted staging smoke + comment |
| `sync-collaboration-labels.yml` | Sync collaboration labels | `workflow_dispatch` | Create/update collaboration labels |
| `enforce-workers-dev-disabled.yml` | Enforce workers.dev disabled | `workflow_dispatch` | Disable workers.dev / preview URLs |

All of the above use `runs-on: ubuntu-latest` and therefore **need healthy hosted runners**.

## Branch lag warning

Long-lived agent branches (for example `fremontderby-jfl`) may still contain an **older `ci.yml`** with `push` / `pull_request` triggers and jobs such as `deploy-nonproduction` / `production-smoke`. Those runs can still appear in the Actions tab and fail on empty runners even though **`main` is dispatch-only**. Rebase or delete stale branches to stop the noise.

## Reactivation checklist (after runners work)

1. Confirm a manual `workflow_dispatch` of **CI** completes real steps (checkout visible in logs).
2. Restore `on: push` / `pull_request` on `ci.yml` only if required checks and minutes budget are intentional (#701).
3. Restore a **test job gate** before production deploy in `deploy-release-lanes.yml` (remove TEMP #692 policy).
4. Set deploy probe `continue-on-error: false` once #713 lane DNS/env is green.
5. Re-enable any scheduled lane-health monitors only with fail-closed behavior and **no** automatic shared DNS mutation (#680).
6. Confirm branch protection required checks match workflow job names on `main`.

## Secrets expected by deploy/diagnose

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Lane deploys may still need Wrangler secrets on the Worker (Supabase, `BETA_ACTOR_USER_ID`); Actions cannot invent those.

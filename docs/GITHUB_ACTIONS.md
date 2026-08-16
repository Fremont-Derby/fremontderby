# GitHub Actions and publish sources of truth

## Production publish source of truth (#727)

| Path | What it does | When it is authoritative |
|------|----------------|---------------------------|
| **Cloudflare Workers Builds** (`fremontderby-prod`) | Builds and deploys the production Worker from Git | **Default production publisher** when the project is connected and green |
| **GitHub Actions** `deploy-release-lanes.yml` | Manual `workflow_dispatch` deploy via Wrangler | Operator-driven lane or production deploy when Actions runners are healthy |
| **Local / agent Wrangler** | `npm run deploy` / `deploy:*` | Emergency or laptop only; same guards apply |

**How to read a red Actions deploy**

1. Check live identity: `https://fremontderby.com/health/environment` (and lane hosts).
2. If `/health` shows a new SHA or expected `ENVIRONMENT`, production may already have shipped via **Workers Builds** even when Actions could not start runners.
3. Do **not** treat “Actions job never started” as proof that production is unchanged.

**Conflict rule**

- Prefer **one** automatic production publisher: Workers Builds on `main` for `fremontderby-prod`.
- Actions production deploy remains **manual** (`workflow_dispatch`) for controlled republish.
- Repository guards refuse production Workers Builds from non-`main` branches (`scripts/guard-cloudflare-build.mjs`, `scripts/deploy-production.mjs`).

## Workers Builds branch containment (#727 / #732)

Evidence from JFL-only work showed **one PR commit starting builds on prod + jfl + dru**. Dashboard branch filters are required; repo guards are the backstop.

| CF Workers Builds project | Required `FREMONT_BUILD_LANE` | Branch allowlist (code + CF filter) |
|---------------------------|-------------------------------|-------------------------------------|
| `fremontderby-prod` | `production` | `main` only |
| `fremontderby-jfl` | `jfl` | `fremontderby-jfl`, `jfl/**` |
| `fremontderby-dru` | `dru` | `fremontderby-dru`, `dru/**` |
| `fremontderby-gamma` | `gamma` | `fremontderby-gamma`, `gamma/**` |

**Operator setup (Cloudflare dashboard, per project)**

1. Open Workers Builds → project → Settings → Build.
2. Set env var `FREMONT_BUILD_LANE` to the lane in the table.
3. Restrict **Branch control** / production branch so only the allowlisted refs start a build (fail-closed: no “all branches”).
4. Build command must run `npm run prebuild` (calls the guard) before deploy.
5. Proof: open a no-op PR on `jfl/issue-…` and confirm **only** the JFL project builds; zero prod/DRU/gamma starts.
6. Guard also refuses `pull/N/head` style refs and `WORKERS_CI_EVENT=pull_request` when set (#873).

## Workflow inventory (`main`)

| File | Name | Trigger | Notes |
|------|------|---------|-------|
| `ci.yml` | CI | `workflow_dispatch` + `pull_request`/`push` on integration branches | Lint/check/tests only — no CF secrets, no deploy (#872) |
| `deploy-release-lanes.yml` | Deploy release lanes | `workflow_dispatch` | **`needs: test` gate restored** (#725); probe still `continue-on-error` until #713 |
| `diagnose-worker-domains.yml` | Diagnose worker domains | `workflow_dispatch` | Cloudflare domain diagnostics |
| `lane-health-monitor.yml` | Lane health monitor | `workflow_dispatch` | Probe `/health/environment` |
| `release-source-policy.yml` | Release source policy | `pull_request` to main/gamma | Fail-closed source branch topology (#889) |
| `pr-card-contract.yml` | PR card contract | verify on branch | Implementation-card shape |
| `staging-readiness.yml` | Staging readiness | `workflow_dispatch` | Hosted staging smoke |
| `sync-collaboration-labels.yml` | Sync collaboration labels | `workflow_dispatch` | Labels |
| `enforce-workers-dev-disabled.yml` | Enforce workers.dev disabled | `workflow_dispatch` | Preview URL policy |

All use `runs-on: ubuntu-latest` and need healthy hosted runners (#723).

## Branch lag warning

Long-lived agent branches may still carry an older `ci.yml` with `push` / `pull_request` triggers. Rebase or delete stale branches so the Actions tab is not filled with empty-runner noise.

## Reactivation checklist (after #723)

1. Manual `workflow_dispatch` of **CI** completes real steps.
2. Restore `on: push` / `pull_request` on `ci.yml` only with intentional required checks (#724 / #701).
3. Deploy probe `continue-on-error: false` once #713 DNS/env is green.
4. Branch protection required checks match job names on `main`.

## Secrets

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Lane Workers still need Wrangler secrets (`SUPABASE_*`, `BETA_ACTOR_USER_ID`); Actions cannot invent them (#651).


## Concurrency

Workflows use `concurrency` groups with `cancel-in-progress: true` so repeated pushes/dispatches do not stack on slow hosted runners (#723). Deploy lanes group by lane input; CI/CodeQL group by PR number or ref.

# GitHub Actions and publish sources of truth

## Production publish source of truth (#727)

| Path | What it does | When it is authoritative |
|------|----------------|---------------------------|
| **Cloudflare Workers Builds** (`fremontderby-prod`) | Builds and deploys the production Worker from Git | **Default production publisher** when the project is connected and green |
| **GitHub Actions** `deploy-release-lanes.yml` | Manual `workflow_dispatch` deploy via Wrangler | Operator-driven lane or production deploy when Actions runners are healthy |
| **Local / agent Wrangler** | `npm run deploy:*` | Emergency or laptop only; same guards apply |

**How to read a red Actions deploy**

1. Check live identity: `https://fremontderby.com/health/environment` (and lane hosts).
2. If `/health` shows a new SHA or expected `ENVIRONMENT`, production may already have shipped via **Workers Builds** even when Actions could not start runners.
3. Do **not** treat “Actions job never started” as proof that production is unchanged.

**Conflict rule**

- Prefer **one** automatic production publisher: Workers Builds on `main` for `fremontderby-prod`.
- Actions production deploy remains **manual** (`workflow_dispatch`) for controlled republish.
- Repository guards refuse production Workers Builds from non-`main` branches (`scripts/guard-cloudflare-build.mjs`, `scripts/deploy-production.mjs`).

## Workers Builds branch containment (#727 / #732 / #873 / #1192)

Operator point-and-click steps: **`docs/cloudflare-builds-isolation.md`**.

Evidence from JFL-only work showed **one PR commit starting builds on prod + jfl + dru**. Dashboard branch filters are required; repo guards are the backstop.

| CF Workers Builds project | Required `FREMONT_BUILD_LANE` | Branch allowlist (code + CF filter) | Required build command |
|---------------------------|-------------------------------|-------------------------------------|------------------------|
| `fremontderby-prod` | `production` | `main` only | `npm ci && npm run prebuild && npm run deploy:production` |
| `fremontderby-jfl` | `jfl` | `fremontderby-jfl`, `jfl/**` | `npm ci && npm run prebuild && npm run deploy:jfl` |
| `fremontderby-dru` | `dru` | `fremontderby-dru`, `dru/**` | `npm ci && npm run prebuild && npm run deploy:dru` |
| `fremontderby-gamma` | `gamma` | `fremontderby-gamma`, `gamma/**` | `npm ci && npm run prebuild && npm run deploy:gamma` |

**Operator setup (Cloudflare dashboard, per project)**

1. Open Workers Builds → project → Settings → Build.
2. Set env var `FREMONT_BUILD_LANE` to the lane in the table.
3. Restrict **Branch control** / production branch so only the allowlisted refs start a build (fail-closed: no “all branches”).
4. Set the **build command** exactly as in the table above (lane-specific `deploy:*` so `deploy-lane.mjs` stamps `versionTag`; never plain `npx wrangler deploy`).
5. Proof: open a no-op PR on `jfl/issue-…` and confirm **only** the JFL project builds; zero prod/DRU/gamma starts.
6. Guard also refuses `pull/N/head` style refs and `WORKERS_CI_EVENT=pull_request` when set (#873).
7. After a permanent-branch publish, `/health/environment` on that lane should show a non-null `versionTag` matching the published SHA (#1222).

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

All use `runs-on: ubuntu-latest` (GitHub-hosted `runner_id: 0`) and need healthy hosted runners (#723).

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

## Public PR safety (#872 / #873)

- **CI** and **PR card contract** run on `pull_request` with `contents: read` (and issues/PR read for card contract only).
- Neither workflow mounts Cloudflare, Supabase, or deploy secrets on PR jobs.
- **Deploy release lanes** is `workflow_dispatch` only and refuses refs other than `main` / `fremontderby-{jfl,dru,gamma}`.
- No workflow uses `untrusted-base-ref PR event`.
- Required check names for branch protection: `test`, `accessibility`, `pr-card-contract`, `validate` (release-source-policy).

## Org + lane identities (#1173)

See **`docs/github-org-lane-identities.md`** for the GitHub Organization transfer and separate JFL/DRU actor checklist.

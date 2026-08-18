# Cloudflare Workers Builds isolation (#873 / #1192)

Repo guards (`npm run prebuild` → `scripts/guard-cloudflare-build.mjs`) fail closed when the wrong branch hits a lane. **Dashboard branch filters** are still required so Cloudflare does not start builds for every PR.

## Operator checklist (one project at a time)

Do this for **each** Workers Builds project: production, JFL, DRU, Gamma.

1. Cloudflare Dashboard → **Workers & Pages** → open the project (e.g. `fremontderby` / lane Worker).
2. Open **Settings** → **Build** (Workers Builds).
3. **Branch control**
   - Production project: only **`main`**.
   - JFL project: only **`fremontderby-jfl`** and **`jfl/*`** (or equivalent filter).
   - DRU project: only **`fremontderby-dru`** and **`dru/*`**.
   - Gamma project: only **`fremontderby-gamma`** and **`gamma/*`**.
4. Set environment variable **`FREMONT_BUILD_LANE`** to `production` | `jfl` | `dru` | `gamma` to match the project.
5. **Build command** (required for tagging + lane routing):

   | Project | Required build command |
   |---------|------------------------|
   | Production | `npm ci && npm run prebuild && npm run deploy:production` |
   | JFL | `npm ci && npm run prebuild && npm run deploy:jfl` |
   | DRU | `npm ci && npm run prebuild && npm run deploy:dru` |
   | Gamma | `npm ci && npm run prebuild && npm run deploy:gamma` |

   - These entrypoints go through `scripts/deploy-lane.mjs` (or production deploy) so `versionTag` can be stamped from `GITHUB_SHA` / `WORKERS_CI_COMMIT_SHA`.
   - Do **not** use plain `npx wrangler deploy`. That path skips tagging (#1222) and can ignore lane-safe root profiles.
   - Do **not** use generic `npm run deploy` on lane projects: on `main` that script is production-only.
6. Save.
7. **Proof**
   - Open a no-op PR from a `jfl/…` branch.
   - Confirm **only** the JFL project starts a build (if any).
   - Confirm production / DRU / Gamma projects show **no** new build for that PR.
8. Optional: confirm a deliberate `main` push still builds **production** only.
9. After a permanent-branch publish, `https://<lane>.fremontderby.com/health/environment` should show a non-null `versionTag` equal to the published commit SHA.

## What the repo already enforces

| Control | Where |
|---------|--------|
| Production allowlist = `main` only | `scripts/guard-cloudflare-build.mjs` |
| Lane namespaces `jfl/*`, `dru/*`, `gamma/*` | same |
| Refuse `pull/N/head` and PR events | same |
| Deploy Actions = `workflow_dispatch` only | `.github/workflows/deploy-release-lanes.yml` |
| SHA tagging from `GITHUB_SHA` or `WORKERS_CI_COMMIT_SHA` | `scripts/deploy-lane.mjs` (after #1227) |
| Tests for the above | `test/cloudflare-build-guard.test.js`, `test/deploy-lane.test.js` |

## Shared-infra note

Changing dashboard filters / build commands for all four projects is multi-lane. Prefer one operator pass with JFL/DRU awareness per #873 / #1192 rather than ad-hoc clicks mid-incident. Live `versionTag` evidence belongs on #1222 / #1190.

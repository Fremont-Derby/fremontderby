# Cloudflare Workers Builds isolation (#873)

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
5. **Build command** must run the guard before publish, for example:
   - `npm ci && npm run prebuild && npx wrangler deploy`
6. Save.
7. **Proof**
   - Open a no-op PR from a `jfl/…` branch.
   - Confirm **only** the JFL project starts a build (if any).
   - Confirm production / DRU / Gamma projects show **no** new build for that PR.
8. Optional: confirm a deliberate `main` push still builds **production** only.

## What the repo already enforces

| Control | Where |
|---------|--------|
| Production allowlist = `main` only | `scripts/guard-cloudflare-build.mjs` |
| Lane namespaces `jfl/*`, `dru/*`, `gamma/*` | same |
| Refuse `pull/N/head` and PR events | same |
| Deploy Actions = `workflow_dispatch` only | `.github/workflows/deploy-release-lanes.yml` |
| Tests for the above | `test/cloudflare-build-guard.test.js`, `test/deploy-workflows-ci-only.test.js` |

## Shared-infra note

Changing dashboard filters for all four projects is multi-lane. Prefer one operator pass with JFL/DRU awareness per #873 / #680 rather than ad-hoc clicks mid-incident.

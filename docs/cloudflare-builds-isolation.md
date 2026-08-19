# Cloudflare Workers Builds isolation (#873 / #1192)

Repo guards (`npm run prebuild` → `scripts/guard-cloudflare-build.mjs`) fail closed when the wrong branch hits a lane. **Dashboard branch filters** are still required so Cloudflare does not start builds for every PR.

**Deploy commands must be lane-specific** (`scripts/workers-builds-commands.mjs`). Do **not** use bare `npx wrangler deploy` on lane projects — that targets the production Worker name.

## Required build commands (source of truth)

| CF project (hint) | `FREMONT_BUILD_LANE` | Branch allowlist | Build command |
|-------------------|----------------------|------------------|---------------|
| `fremontderby-prod` | `production` | `main` only | `npm ci && npm run prebuild && npm run deploy:production` |
| `fremontderby-jfl` | `jfl` | `fremontderby-jfl`, `jfl/*` | `npm ci && npm run prebuild && npm run deploy:jfl` |
| `fremontderby-dru` | `dru` | `fremontderby-dru`, `dru/*` | `npm ci && npm run prebuild && npm run deploy:dru` |
| `fremontderby-gamma` | `gamma` | `fremontderby-gamma`, `gamma/*` | `npm ci && npm run prebuild && npm run deploy:gamma` |

## Operator checklist (one project at a time)

Do this for **each** Workers Builds project: production, JFL, DRU, Gamma.

1. Cloudflare Dashboard → **Workers & Pages** → open the project (e.g. `fremontderby` / lane Worker).
2. Open **Settings** → **Build** (Workers Builds).
3. **Branch control** — match the table above (fail-closed: no “all branches”).
4. Set environment variable **`FREMONT_BUILD_LANE`** to the lane in the table.
5. **Build command** — paste the matching command from the table (must include `prebuild` + `deploy:<lane>`).
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
| Explicit per-lane deploy commands | `scripts/workers-builds-commands.mjs` |
| Deploy Actions = `workflow_dispatch` only | `.github/workflows/deploy-release-lanes.yml` |
| Tests for the above | `test/cloudflare-build-guard.test.js`, `test/workers-builds-commands.lockstep.test.js` |

## Shared-infra note

Changing dashboard filters for all four projects is multi-lane. Prefer one operator pass with JFL/DRU awareness per #873 / #680 rather than ad-hoc clicks mid-incident.

Human required after merge: apply the table’s branch filters + build commands in the Cloudflare dashboard for each project.

# Platform capabilities (agents vs humans)

Source of truth for **what automation can do** versus **what requires a human dashboard**. Keep this aligned with GitHub Actions secrets and Cloudflare/Supabase reality. Do not invent capabilities.

## GitHub Actions secrets (available to workflows)

| Secret | Used for |
|--------|----------|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare API account scope |
| `CLOUDFLARE_API_TOKEN` | Workers domain attach, workers.dev disable, `wrangler deploy` when token allows |
| `RELEASE_SMOKE_BYPASS_TOKEN` | Optional release smoke bypass (if configured) |

Secret **values** are never readable via the GitHub API. Agents may only exercise them through workflows.

## Cloudflare (automatable today)

| Action | Mechanism | Notes |
|--------|-----------|--------|
| Attach custom domains to lane Workers | `scripts/restore-lane-custom-domains.mjs` + workflow | `workflow_dispatch` only while hosted runners are constrained (see `docs/GITHUB_ACTIONS.md`) |
| Disable `*.workers.dev` | `scripts/disable-workers-dev.mjs` | Does **not** manage custom domains |
| Deploy lane from matching branch | CI `deploy-nonproduction` on `fremontderby-{jfl,dru,gamma}` | Requires Worker secrets already provisioned |
| Deploy lane from main (controlled) | Workflow **Deploy release lanes** (`workflow_dispatch`) | Requires Worker secrets already provisioned |
| Lane identity monitor | Workflow **Lane health monitor** (hourly) | Fails if public host `environment` mismatches |

## Cloudflare / data (human or provisioned secrets required)

| Action | Why human / blocked |
|--------|---------------------|
| Set `ENVIRONMENT=dru\|jfl` and open-auth vars on the **correct** Worker | Must match live `/health/environment`; wrong env looks like DNS “works” but lane is production |
| Provision isolated Supabase projects + `BETA_ACTOR_USER_ID` | Values not in git |
| Apply SQL migrations to **DRU/JFL/gamma** databases | No Supabase management token in Actions today |
| Grant `dru_private` (or lane schemas) to `service_role` | SQL on target project |

## Live verification (always)

DNS resolution is **not** lane success.

```bash
curl -sS "https://dru.fremontderby.com/health/environment"
# require: "environment":"dru" and "ok":true

curl -sS "https://dru.fremontderby.com/api/admin/seasons"
# require: HTTP 200 without Authorization when open-auth is intended

curl -sS "https://fremontderby.com/api/admin/seasons"
# require: HTTP 401 without Authorization (production must stay gated)
```

Same pattern for `jfl` / `gamma` (gamma must **not** open-auth).

## Durable domain ownership

`wrangler.jsonc` routes (`custom_domain: true`) published by **`wrangler deploy --env <lane>`** are the durable source of truth. Ad-hoc `/workers/domains` attach is break-glass only (see issue trackers for DNS flapping).

## Related cards

Human DRU finish: search issues for `[HUMAN]` DRU open-auth. DNS durability: platform cards on wrangler-owned domains. Migration apply: DRU data cards referencing migrations `20260814031843_shared_staging_lane_schemas.sql` and `20260814093000_expose_lane_private_postgrest_schemas.sql`.

## Product surfaces added 2026-08-14

- `/players` — public player directory (standings-backed).
- Live-refresh `fdStableList` helper on high-traffic list pages.
- Captain/admin opening-night depth readiness copy.
- `/messages?player=` deep-link contract for direct messages.

## Live refresh contract (browser)

`window.fdLiveRefresh.register((opts) => reload(opts), { intervalMs })` passes:

- `opts.quiet` / `opts.isBackground` — true for interval, focus, visibility, online, register
- `opts.reason` — event name

Page loaders **must** skip Loading flashes and destructive empties when `quiet` is true. Prefer `window.fdStableList` for list DOM and `window.fdSetStatus(el, msg, tone, { quiet })` for status text.

Error strings for users go through `friendlyErrorMessage` (offline, 503, rate limit, pending migration, auth expiry).

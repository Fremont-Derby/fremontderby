# JFL / DRU no-auth team testing

## Goal

Automated and browser testing on `dru.fremontderby.com` / `jfl.fremontderby.com` without Google login, including **create/apply for teams**.

## Current status (2026-08-15)

| Check | Result |
|-------|--------|
| DNS `dru` / `jfl` / `gamma` | Resolves, Worker responds |
| `/health/environment` host match | `dru`→dru, `jfl`→jfl, `gamma`→gamma |
| Staging Supabase schemas | `dru`, `jfl`, `gamma` (+ `*_private`) present |
| DRU season | `Season 1` purpose=league, registration |
| DRU test actor player | `dru-actor@fremontderby.com` has `dru.players` row + captain membership |
| Unauthenticated `/api/me/teams` on DRU | **401 Missing bearer token** → bypass not active on edge |

## Cloudflare Worker secrets (required)

From dashboard or `wrangler secret put` for **`fremontderby-dru`** and **`fremontderby-jfl`**:

| Secret / var | DRU value | JFL value |
|--------------|-----------|-----------|
| `ENVIRONMENT` | `dru` (vars in wrangler.jsonc) | `jfl` |
| `BETA_AUTH_BYPASS` | `1` | `1` |
| `BETA_ACTOR_EMAIL` | `dru-actor@fremontderby.com` | `jfl-actor@fremontderby.com` |
| `BETA_ACTOR_USER_ID` | `05d025ff-1c97-4070-a691-46a896fb9b83` | `b22805b6-92ba-44bd-a92e-0c82f0be6613` |
| `SUPABASE_URL` | staging project `https://oqkkvqkerusepyokzbmt.supabase.co` | same |
| `SUPABASE_SCHEMA` | `dru` | `jfl` |
| `SUPABASE_SERVICE_ROLE_KEY` | staging service role | same |
| `SUPABASE_PUBLISHABLE_KEY` | staging publishable | same |

`BETA_ACTOR_USER_ID` is a **required secret** (not a plain var). If it is missing, bypass is disabled or fails closed.

Gamma must keep `BETA_AUTH_BYPASS=0` (real auth).

## Smoke after secrets + deploy

```bash
# Must be 200 with ok:true and failedChecks:[]
curl -sS https://dru.fremontderby.com/health/environment | jq .

# No Authorization header — should NOT return Missing bearer token
curl -sS https://dru.fremontderby.com/api/me/teams | jq .
curl -sS https://dru.fremontderby.com/api/seasons | jq .
```

Team apply (shape depends on current Worker routes; typically season-scoped application POST with JSON team name). Once `/api/me/teams` returns 200 without a bearer token, browser and agents can exercise the Teams UI with no Google login.

## Deploy note

GitHub Actions **Deploy release lanes** is currently blocked by **billing/spending limit**. Until that is fixed, provision secrets in the Cloudflare dashboard on the existing DRU/JFL Workers and retrigger the Workers build that is connected to those scripts.

## DB proof (already done)

`dru.create_team_with_captain` / `submit_team_application` enforce season rules correctly. The DRU test actor already captains a team in Season 1; further applications correctly return "You already captain a team in this season".

# Environments

Fremont Derby uses explicit release lanes so independent testing can happen without weakening production safety.

## Target release topology

| Lane | Git branch | Public host | Data | Purpose |
|---|---|---|---|---|
| Local | feature/local | local only | local/test only | development |
| JFL | `fremontderby-jfl` | `https://jfl.fremontderby.com` | shared staging Supabase project, isolated `jfl` schema | independent JFL testing |
| DRU | `fremontderby-dru` | `https://dru.fremontderby.com` | shared staging Supabase project, isolated `dru` schema | independent DRU testing |
| Gamma | `fremontderby-gamma` | `https://gamma.fremontderby.com` | shared staging Supabase project, isolated `gamma` schema | integrated release-candidate testing |
| Production | `main` | `https://fremontderby.com` | production Supabase project | live league |

The normal promotion path is:

`feature work -> JFL or DRU -> gamma -> main -> production`

The existing `staging` environment may remain during migration, but gamma becomes the canonical integrated pre-production lane once the new topology is proven.

## Configuration ownership

`wrangler.jsonc` is the source of truth for Worker names, public custom domains, `workers.dev` exposure, environment identity, and committed non-secret variables. Do not maintain competing copies of those settings in Cloudflare click-ops.

Secret **names** are also declared in `wrangler.jsonc` through `secrets.required`. Secret **values** remain outside Git in Cloudflare's secret store (or local `.dev.vars`/`.env` files). A deployment must fail rather than publish a lane whose declared required secrets have not been provisioned.

JFL, DRU, and gamma share the non-production Supabase project `${stagingRef}` to stay within the free plan. They are partitioned into independent `jfl`, `dru`, and `gamma` schemas. Every Worker REST/RPC request carries the matching PostgREST profile, and readiness fails closed on a project or schema mismatch.

## Local
- Runs with `wrangler dev`.
- Uses local/test data only.
- Never contains production service-role credentials.

## JFL
- Git branch: `fremontderby-jfl`.
- Cloudflare Worker environment: `jfl` (`fremontderby-jfl`).
- Public hostname: `https://jfl.fremontderby.com`.
- Preferred deploy branch: `fremontderby-jfl`. From `main`, `npm run deploy:jfl` is allowed only when `FREMONT_ALLOW_LANE_DEPLOY_FROM_MAIN=1` (Actions deploy workflow sets this). CI on `main` is currently `workflow_dispatch`-only while hosted runners are constrained; local/`wrangler` deploy remains valid.
- Uses the shared staging project with its own schema and sandbox data.
- May support test actors/auth bypass only when explicitly hard-gated to this environment.
- Can be seeded/reset without affecting DRU, gamma, staging, or production.

## DRU
- Git branch: `fremontderby-dru`.
- Cloudflare Worker environment: `dru` (`fremontderby-dru`).
- Public hostname: `https://dru.fremontderby.com`.
- Preferred deploy branch: `fremontderby-dru`. Same main-lane exception and runner notes as JFL.
- Uses the shared staging project with its own schema and sandbox data.
- May support test actors/auth bypass only when explicitly hard-gated to this environment.
- Can be seeded/reset without affecting JFL, gamma, staging, or production.

## Gamma
- Git branch: `fremontderby-gamma`.
- Cloudflare Worker environment: `gamma` (`fremontderby-gamma`).
- Public hostname: `https://gamma.fremontderby.com`.
- Preferred deploy branch: `fremontderby-gamma`. Same main-lane exception and runner notes as JFL.
- Uses the shared staging project with the isolated `gamma` schema.
- Gamma is the integration/release-candidate environment; auth and runtime behavior should be production-like.
- Auth bypass is forbidden in gamma.
- Gamma never points directly at the production database and never receives production service-role/write credentials.

### Production data refresh into gamma
Gamma may receive a production-data copy only through the repository workflow **Gamma prod refresh** (`gamma-prod-refresh.yml`): daily schedule + `workflow_dispatch`. Both entry points share `scripts/gamma-prod-refresh.mjs` (fail-closed preflight). Deploys and branch pushes never trigger refresh.


The refresh direction is strictly one-way:

`production read/export -> controlled snapshot -> gamma restore/import`

Rules:
- The running gamma Worker has only gamma credentials.
- Production extraction credentials are available only to the controlled refresh job and are never injected into the gamma Worker.
- The refresh job must refuse any target that resolves to the production project.
- After refresh, normal gamma testing may create/update/delete records only in the gamma copy.
- There is no gamma-to-production data synchronization path.
- The refresh records timestamp/source schema or migration identity so testers know how fresh the copy is.
- Sensitive/non-testable data should be scrubbed or replaced according to the repository's privacy policy before general tester access.

## Production
- Existing GitHub-linked Cloudflare Worker.
- Public hostname: `https://fremontderby.com`.
- Supabase project ref: `cpiucsxlkicmlbvdvhww`.
- Supabase URL: `https://cpiucsxlkicmlbvdvhww.supabase.co`.
- Production is deployed from protected `main` only.
- Production credentials are never copied into JFL/DRU/gamma runtime environments.

## Required variables

| Variable | Browser safe? | Purpose |
|---|---:|---|
| `ENVIRONMENT` | yes | `local`, `jfl`, `dru`, `gamma`, `staging`, or `production` |
| `SUPABASE_URL` | yes | environment-specific Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | yes | client-safe Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | **no** | trusted Worker operations for that environment only |
| `EXPECTED_SUPABASE_PROJECT_REF` | yes | fail-closed environment/project identity check |
| `SUPABASE_SCHEMA` | yes | exact PostgREST profile (`jfl`, `dru`, or `gamma`) for shared-staging isolation |
| `BETA_AUTH_BYPASS` | yes | legacy-named switch for JFL/DRU test auth only; forbidden in gamma/production |
| `BETA_ACTOR_USER_ID` | **no** | isolated JFL/DRU test actor identity |
| `BETA_ACTOR_EMAIL` | yes | isolated JFL/DRU test actor display email |

Real credentials are configured outside Git. `SUPABASE_SERVICE_ROLE_KEY` and `BETA_ACTOR_USER_ID` must never be exposed to browser code.

## Promotion and branch rules

### JFL and DRU
- `fremontderby-jfl` and `fremontderby-dru` are peers, not parent/child branches.
- Work can be tested independently in either lane.
- Each deployment requires repository CI to pass.
- A JFL failure does not block DRU, and vice versa.

### Gamma
- Changes promoted from either test lane merge into `fremontderby-gamma` through PRs.
- Gamma receives the integrated code from both lanes and runs smoke/E2E checks against gamma-only data.
- Gamma is the only ordinary source branch for production release PRs.

### Production / `main`
`main` is protected. Normal releases require:
- pull request;
- required CI/status checks;
- successful gamma smoke/release-candidate proof;
- source-branch policy proving the ordinary release came from `fremontderby-gamma`;
- resolved required review conversations;
- no direct pushes;
- no force pushes;
- no branch deletion.

Emergency bypass, if GitHub account capabilities require one to exist, must be explicit, exceptional, auditable, and immediately reconciled back through the normal branch chain.

## Safety invariants
- Production uses its dedicated Supabase project. JFL, DRU, and gamma use distinct schemas in the shared staging project.
- A JFL/DRU/gamma Worker must fail closed if configured with the production project ref or the wrong staging schema.
- A JFL/DRU/gamma Worker must never contain production service-role/write credentials.
- Test-auth bypass is permitted only in explicitly isolated JFL/DRU lanes and must fail closed in gamma/production.
- Gamma refresh can read/export production through a dedicated operator workflow but the gamma runtime cannot write to production.
- Tooling that sees an unexpected duplicate protected-environment project ref must stop rather than deploy.

## Readiness checks
`GET /health/environment` returns non-secret readiness diagnostics for each Worker environment. It should include:
- Worker `ENVIRONMENT`;
- expected Supabase project ref;
- configured Supabase URL/derived project ref;
- booleans for publishable/service-role key presence;
- pass/fail checks for environment/project matching and key separation.
- `versionTag` / deployed git SHA when the publish path stamped identity (#1222).

The endpoint must not return credential values. It should return HTTP 200 only when all readiness checks pass and HTTP 503 otherwise.

## Implementation/cutover plan
1. Add Wrangler environments and repository-owned custom domains for JFL, DRU, and gamma while preserving current production behavior.
2. Provision isolated `jfl`, `dru`, and `gamma` schemas in the shared staging project; apply current migrations to each schema.
3. Provision the secret values declared by `wrangler.jsonc` for all three non-production lanes; do not duplicate code-owned routes/domains/vars in dashboard click-ops.
4. Use branch-triggered deploy workflows and environment identity guards.
5. Add deterministic schema-scoped seed/reset for JFL and DRU sandboxes.
6. Add manual production-to-gamma refresh with fail-closed target validation and privacy handling.
7. Add gamma smoke/E2E promotion gates.
8. Configure GitHub branch/ruleset protection for `fremontderby-gamma` and `main`.
9. Prove JFL/DRU isolation, gamma refresh safety, gamma-to-main promotion, exact deployed SHA, and production smoke.
10. Retire/reclassify the old `staging` and generic `beta` paths only after the replacement lanes are proven.

## Related work
- #29 — canonical environment/CI/CD infrastructure story.
- #245 — green pre-merge validation and traceable production releases.
- #35 — hosted Supabase/environment isolation proof.
- #545 and #572 — historical single-beta approach, superseded by this topology.


## PostgREST Accept-Profile / Content-Profile

Lane Workers isolate data on the **shared staging** Supabase project by schema, not by separate projects.

| Worker `ENVIRONMENT` | Public profile headers | Private profile headers |
|----------------------|------------------------|-------------------------|
| `production` / `staging` | `public` | `private` |
| `jfl` | `jfl` | `jfl_private` |
| `dru` | `dru` | `dru_private` |
| `gamma` | `gamma` | `gamma_private` |

`src/supabaseSchema.js` wraps repository `fetch` so every `/rest/v1/*` call sets **both**:

- `Accept-Profile`
- `Content-Profile`

Callers that need privileged tables pass `accept-profile: private`; the wrapper rewrites that to the lane private profile. Foreign lane profiles are forced back to this Worker’s schema (fail-closed isolation).

PostgREST must list these schemas in `pgrst.db_schemas` (see migrations `20260814031843_*` and `20260814093000_*`) and reload config/schema after apply.

## GitHub Actions secrets (names only)

The repository is expected to hold these **Actions** secret *names* for deploy/diagnose workflows (values are never in git):

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Worker-level secrets (`SUPABASE_*`, `BETA_ACTOR_USER_ID`, …) are provisioned on each Cloudflare Worker / `wrangler secret`, not as a substitute for the Actions Cloudflare pair.

Hosted runners must allocate (`runner_id` non-zero) for workflows to use those secrets. See `docs/GITHUB_ACTIONS.md`.

## Host vs Worker identity

`GET /health/environment` includes:

- `environment` — Worker `ENVIRONMENT`
- `host` — request hostname
- `expectedHostEnvironment` — map for known public hosts (`dru.fremontderby.com` → `dru`, etc.)
- `hostMatchesEnvironment` — `false` when a known lane/apex host is served by the wrong Worker

A 200 with `"environment":"production"` on `dru.fremontderby.com` is a **failed** lane identity: DNS may resolve, but `wrangler deploy --env dru` (and secrets) still need to attach the lane Worker.

## Publish paths (summary)

See **`docs/GITHUB_ACTIONS.md`** and **`docs/cloudflare-builds-isolation.md`** for:

- production source-of-truth (Workers Builds vs Actions);
- **lane-specific** Workers Builds build commands (`deploy:production` / `deploy:jfl` / `deploy:dru` / `deploy:gamma`);
- branch allowlists and Cloudflare dashboard containment (#727 / #732 / #1192);
- `versionTag` stamping via `deploy-lane.mjs` + `WORKERS_CI_COMMIT_SHA` (#1222).

Do not use plain `npx wrangler deploy` or generic `npm run deploy` on lane Workers Builds projects.

## Lane tip lockstep

`dru`, `jfl`, and `gamma` must run the **same Worker tip** (same `versionTag` / git SHA). Only these differ by design:

- `ENVIRONMENT` / host name
- `SUPABASE_SCHEMA` (`dru` | `jfl` | `gamma`) and matching `*_private` schema
- `BETA_ACTOR_EMAIL` (open-auth actor identity)

Deploy with `lane=all-lanes` (workflow default) so tips stay unified. Single-lane deploys are for emergency hotfixes only; follow with the other two as soon as possible.

## Backups, audit, and recovery

See [ops-backup-audit-recovery.md](./ops-backup-audit-recovery.md) for Season 1 backup/PITR expectations, audit surfaces, health probes, and recovery runbooks (#30).

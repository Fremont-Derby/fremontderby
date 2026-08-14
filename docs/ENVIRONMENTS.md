# Environments

Fremont Derby uses explicit release lanes so independent testing can happen without weakening production safety.

## Target release topology

| Lane | Git branch | Public host | Data | Purpose |
|---|---|---|---|---|
| Local | feature/local | local only | local/test only | development |
| JFL | `fremontderby-jfl` | `https://jfl.fremontderby.com` | isolated JFL sandbox Supabase project | independent JFL testing |
| DRU | `fremontderby-dru` | `https://dru.fremontderby.com` | isolated DRU sandbox Supabase project | independent DRU testing |
| Gamma | `fremontderby-gamma` | `https://gamma.fremontderby.com` | isolated gamma Supabase project | integrated release-candidate testing |
| Production | `main` | `https://fremontderby.com` | production Supabase project | live league |

The normal promotion path is:

`feature work -> JFL or DRU -> gamma -> main -> production`

The existing `staging` environment may remain during migration, but gamma becomes the canonical integrated pre-production lane once the new topology is proven.

## Configuration ownership

`wrangler.jsonc` is the source of truth for Worker names, public custom domains, `workers.dev` exposure, environment identity, and committed non-secret variables. Do not maintain competing copies of those settings in Cloudflare click-ops.

Secret **names** are also declared in `wrangler.jsonc` through `secrets.required`. Secret **values** remain outside Git in Cloudflare's secret store (or local `.dev.vars`/`.env` files). A deployment must fail rather than publish a lane whose declared required secrets have not been provisioned.

The three non-production Supabase projects are provisioned separately. Until their project refs and credentials exist, the JFL/DRU/gamma Workers are intentionally not deployable; do not substitute production or legacy staging credentials to make a deploy pass.

## Local
- Runs with `wrangler dev`.
- Uses local/test data only.
- Never contains production service-role credentials.

## JFL
- Git branch: `fremontderby-jfl`.
- Cloudflare Worker environment: `jfl` (`fremontderby-jfl`).
- Public hostname: `https://jfl.fremontderby.com`.
- Deploys only from `fremontderby-jfl` after CI.
- Uses its own Supabase project and sandbox data.
- May support test actors/auth bypass only when explicitly hard-gated to this environment.
- Can be seeded/reset without affecting DRU, gamma, staging, or production.

## DRU
- Git branch: `fremontderby-dru`.
- Cloudflare Worker environment: `dru` (`fremontderby-dru`).
- Public hostname: `https://dru.fremontderby.com`.
- Deploys only from `fremontderby-dru` after CI.
- Uses its own Supabase project and sandbox data.
- May support test actors/auth bypass only when explicitly hard-gated to this environment.
- Can be seeded/reset without affecting JFL, gamma, staging, or production.

## Gamma
- Git branch: `fremontderby-gamma`.
- Cloudflare Worker environment: `gamma` (`fremontderby-gamma`).
- Public hostname: `https://gamma.fremontderby.com`.
- Deploys only from `fremontderby-gamma` after CI.
- Uses its own Supabase project.
- Gamma is the integration/release-candidate environment; auth and runtime behavior should be production-like.
- Auth bypass is forbidden in gamma.
- Gamma never points directly at the production database and never receives production service-role/write credentials.

### Production data refresh into gamma
Gamma may receive a production-data copy only through an explicit manual refresh workflow.

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
- JFL, DRU, gamma, and production must use distinct Supabase projects.
- A JFL/DRU/gamma Worker must fail closed if configured with the production project ref.
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

The endpoint must not return credential values. It should return HTTP 200 only when all readiness checks pass and HTTP 503 otherwise.

## Implementation/cutover plan
1. Add Wrangler environments and repository-owned custom domains for JFL, DRU, and gamma while preserving current production behavior.
2. Provision isolated Supabase projects for JFL, DRU, and gamma; apply current migrations.
3. Provision the secret values declared by `wrangler.jsonc` for all three non-production lanes; do not duplicate code-owned routes/domains/vars in dashboard click-ops.
4. Use branch-triggered deploy workflows and environment identity guards.
5. Add deterministic seed/reset for JFL and DRU sandboxes.
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

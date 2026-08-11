# Fremont Derby

Fremont Derby is seasonal in-house pool league software running as a Cloudflare Worker with Supabase for auth and persistence.

Production: https://fremontderby.com

> **Agents: start here.** This repository changes quickly and several agents may be working in parallel. Before coding, reconcile the latest `main`, open PRs, current issue state, and the relevant hosted Supabase environment. Do not assume an old issue comment, README status note, or hosted schema is still current.

## 5-minute agent quick start

1. Read the issue you were assigned and its parent/related issues.
2. Check open PRs for overlapping work before creating a branch.
3. For launch-critical work, read **#20** first. It is the Season 1 end-to-end release gate.
4. Identify the layer you actually need to change; avoid broad refactors.
5. Add or update the smallest regression test that proves the behavior.
6. Run the same validation as CI:

```bash
npm run lint
npm run check
npm test
npm run build
```

7. If the change touches Supabase, keep the repository migration and hosted schema in sync. Never leave an untracked production-only database fix.
8. Open a narrow PR that explains the user-visible behavior, safety boundary, and proof performed.

CI uses **Node 22** and runs lint, syntax checks, the full Node test suite, and a Wrangler dry-run build.

## Product invariants that should not be casually changed

These are high-risk rules because multiple features depend on them. If a task appears to conflict with one of them, stop and reconcile the issue/rules/tests before changing code.

- Season 1 is an **8-team, 7-round single round robin**.
- A regular-season team matchup generates **three individual player matches**.
- Captains submit an ordered **three-player blind lineup**. The first valid submission is sealed; opponent names/order are not revealed until both teams commit.
- A player can belong to more than one team. For a matchup involving two of their teams, the player must choose which team they represent, and the same player cannot occupy both sides or multiple slots in that team matchup.
- Regular-season team matchups must resolve to a **win/loss, never a draw**.
- Scoring is **team-owned**. An authenticated member may operate their own team's rack history, never the opponent team's history.
- Finalization requires the two team-owned rack histories to reconcile and both teams to confirm.
- Score entry uses the signed-in Google/Supabase session. Normal players should never paste access tokens, service keys, match UUIDs, team UUIDs, or season UUIDs into the UI.
- Postseason may require a deciding anchor match after a tied team result; anchors must be declared before the relevant postseason scoring begins. Treat **#20** and current postseason tests as the release contract.

If business rules change, update the rule-facing UI, tests, database constraints/functions, and release-gate acceptance criteria together.

## Architecture map

The code intentionally uses small modules rather than a framework.

| Area | Location | Responsibility |
| --- | --- | --- |
| Worker routing | `src/router.js` | Top-level page/API routing and shell decoration |
| Legacy/core HTTP handlers | `src/index.js` | Request parsing, auth, command/repository wiring, error mapping |
| Page renderers | `src/*Page.js` | Server-rendered HTML and browser interaction |
| HTTP endpoint modules | `src/*Http.js` | Focused API routes for newer feature slices |
| Commands | `src/*Commands.js` | Business workflow, validation, authorization orchestration |
| Repositories | `src/*Repository.js` | Supabase RPC/REST persistence boundary |
| Pure domain logic | `domain/*.js` | Schedule, match/race, season, playoff logic without HTTP/database concerns |
| Database source of truth | `supabase/migrations/*.sql` | Tables, constraints, RPC functions, triggers, RLS, grants |
| Tests | `test/*.test.js` | Node `node:test` regression and integration-contract coverage |
| Cloudflare config | `wrangler.jsonc` | Worker name and non-secret environment bindings |
| CI | `.github/workflows/ci.yml` | Required validation on PRs and `main` |

A typical request path is:

`page/browser -> HTTP handler -> command -> repository -> Supabase RPC/table`

Keep domain rules in commands/domain/database constraints rather than trusting browser-only validation.

## Supabase and environment boundaries

There are separate hosted projects and they must remain isolated:

| Environment | Supabase project | Cloudflare binding |
| --- | --- | --- |
| Production | `cpiucsxlkicmlbvdvhww` | default `wrangler.jsonc` vars |
| Staging | `oqkkvqkerusepyokzbmt` | `wrangler --env staging` vars |

Useful non-secret readiness endpoint:

```text
/health/environment
```

Important rules for platform agents:

- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are browser-safe/public bindings.
- `SUPABASE_SERVICE_ROLE_KEY` is **server-side secret material**. It belongs in Cloudflare Secrets, never in `wrangler.jsonc`, source code, logs, issue comments, browser JavaScript, or chat transcripts.
- Do not point production at staging or staging at production even temporarily.
- Before applying database work, compare the repository migration history with the target project's applied migrations.
- Prefer a new forward migration. Do not rewrite a migration that may already have been applied.
- After schema/RLS work, inspect Supabase security advisors and verify RLS remains enabled on application tables.
- If an emergency hosted-database hotfix is unavoidable, immediately create the matching repository migration and prove the two environments converge.

### Recent PostgreSQL footgun

Several production defects came from PL/pgSQL functions that return a column with the same name used in an unqualified `ON CONFLICT (...)` target. PostgreSQL can report the reference as ambiguous. When a named unique constraint already exists, prefer an explicit conflict target such as:

```sql
ON CONFLICT ON CONSTRAINT some_named_unique_constraint
```

Add a regression test whenever fixing this class of defect.

## Authentication and authorization

User authentication is Google -> Supabase Auth -> bearer access token. The browser session should provide the token automatically.

Server-side authorization still matters even when the UI hides an action:

- verify the authenticated actor in the Worker;
- enforce team/captain/admin ownership in commands and/or database functions;
- preserve RLS as a second boundary;
- never use the service-role key to make a client authorization problem disappear.

A successful Google login alone is not proof that authorization is correct. Test forbidden cross-team and unauthenticated paths too.

## High-value test path

For a launch-focused change, prefer proving a real slice of this path instead of adding isolated UI machinery:

`sign in -> season/team -> availability -> blind lineup -> 3 generated player matches -> score picker -> 8/9 rack scoring -> reconcile -> dual confirm -> finalize -> team standings -> individual standings`

The complete Season 1 contract, including schedule, multi-team membership, trades/free agents, seven rounds, postseason, champion, and purse consistency, is tracked in **#20**.

## Main user surfaces

- `/` — league introduction
- `/rules` — public rules
- `/profile` — Google sign-in and player profile
- `/teams` — team creation, requests/invitations, roster management
- `/availability` — roster/free-agent availability
- `/lineup` — captain lineup workflow
- `/scorecard` — eligible match picker
- `/scorecard/live` — live rack scoring
- `/standings` — team / individual standings toggle
- `/season-setup` — league-director setup and publishing
- `/trades` — player trade workflow
- `/prizes` — purse and payout state
- `/health` — Worker version metadata
- `/health/environment` — non-secret environment diagnostics
- `/demo`, `/sandbox/*` — disposable War Games/demo surfaces; do not treat them as production-contract proof

Other features may exist in the router. Inspect `src/router.js` before adding a new route so you do not create a duplicate surface.

## Contribution workflow for parallel agents

### Before editing

- Fetch latest `main`.
- Inspect open PRs and recent merged PRs touching your area.
- Read the current issue and parent release/story issue.
- Search for an existing command/repository/page before creating another abstraction.
- If database-related, inspect both the migration file and the live target environment.

### While editing

- Keep the PR narrowly scoped to one defect/story.
- Preserve existing API contracts unless the issue explicitly changes them.
- Add regression coverage for the failure mode, not only the happy path.
- Keep technical identifiers internal; user-facing flows should use names, dates, rounds, teams, and matchups.
- Error messages should be visible/actionable, while secrets and raw privileged values must never be shown.

### Before merge

Run:

```bash
npm run lint
npm run check
npm test
npm run build
```

Then confirm:

- no overlapping PR landed while you were working;
- database migration state is understood;
- auth/RLS boundaries are unchanged or explicitly tested;
- no staging credentials leaked into production config;
- no service-role secret appears in the diff;
- the issue acceptance criteria are actually satisfied.

Do not merge failing CI. Do not close parent/release issues just because one child slice is green.

## Guidance by agent/platform

**GitHub/Codex/Copilot agents** — work from issues and current `main`; prefer small PRs with tests. Do not duplicate an open implementation PR.

**Supabase agents** — treat `supabase/migrations/` as the database source of truth. Compare applied migrations first, preserve RLS, and report advisor findings. Do not invent production-only DDL.

**Cloudflare agents** — focus on Worker bindings, secrets, routes, logs, and deployments. `SUPABASE_SERVICE_ROLE_KEY` must be a secret binding. Do not move server secrets into public vars to make a deployment pass.

**Independent QA/release agents** — reconcile code, CI, issues, migrations, hosted schema, RLS/advisors, and environment bindings before declaring a release path green. Prefer contained regression fixes; hand broad implementation back to the build lane.

## Development commands

```bash
# syntax/static validation
npm run lint
npm run check

# full Node test suite
npm test

# Cloudflare Worker dry-run build (same as CI)
npm run build

# local Worker
npm run dev

# production deploy — only when deployment is explicitly intended
npm run deploy
```

The Cloudflare Worker connected to this repository must be named **`fremontderby`** to match `wrangler.jsonc`.

## Definition of done

A change is not done because the code compiles or the happy path renders. For the affected behavior, aim to leave:

- source code and database migrations aligned;
- regression coverage in `test/`;
- full CI green;
- authorization/RLS behavior preserved;
- staging/production boundaries understood;
- the relevant GitHub issue updated or closed only when its acceptance criteria are actually met.

When in doubt, make the smallest change that proves one end-to-end user behavior and leaves the next agent a clear, current source of truth.

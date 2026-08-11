# Fremont Derby

Fremont Derby is seasonal in-house pool league software running as a Cloudflare Worker with Supabase for auth and persistence.

Production: https://fremontderby.com

## Agents: bootstrap from the repository

This repository is designed so a new development session can start with little or no prior chat context.

**Before coding, read [`AGENTS.md`](AGENTS.md).** It is the durable autonomous-development operating contract: how to reconcile current state, self-prioritize work, maintain the backlog, test/merge safely, and improve the instruction system over time.

Then read the **current GitHub issue and its linked context**. Issues, PRs, code, tests, migrations, CI, and relevant live platform state carry the specific and current details. Do not treat this README as a fixed priority queue.

For scheduled ChatGPT tasks or other low-context external sessions, use the intentionally small bootstrap in [`docs/agent-bootstrap.md`](docs/agent-bootstrap.md). The external task should point back into the repository rather than copying the whole roadmap or architecture into its prompt.

GitHub-native agents also receive a thin pointer through [`.github/copilot-instructions.md`](.github/copilot-instructions.md), so all agent types converge on the same contract.

### Instruction ownership

- `AGENTS.md` — durable autonomous operating behavior.
- `README.md` — stable product/architecture/environment orientation.
- `docs/agent-bootstrap.md` — minimal external-session bootstrap.
- GitHub issues/milestones/PRs — current priorities, requirements, blockers, and acceptance criteria.
- Code/tests/migrations/live state — what actually exists.

Agents should improve these instruction files when they discover a **durable** lesson that will make future sessions safer or more effective. Temporary blockers and current priorities belong in issues, not in the bootstrap prompt.

## Fast contributor start

1. Read `AGENTS.md`.
2. Reconcile latest `main`, open/recent PRs, current issues/milestones, and CI.
3. Read the issue you intend to work and check for overlapping implementation.
4. Inspect the relevant code/tests and hosted platform state only as needed.
5. Make the smallest coherent change that produces meaningful user or operational value.
6. Run the repository's current validation before merge.

Current CI uses Node 22 and runs:

```bash
npm run lint
npm run check
npm test
npm run build
```

## Product invariants that should not be casually changed

These rules have broad dependencies. If a task appears to conflict with one of them, reconcile the current issue, rules, tests, and product-owner decision before changing behavior.

- The league uses an **8-team, 7-round single round robin** season model.
- A regular-season team matchup generates **three individual player matches**.
- Captains submit an ordered **three-player blind lineup**; normal submission is sealed and opposing names/order remain hidden until both teams commit.
- A player may belong to more than one team. When both of their teams meet, their matchup representation must be explicit and the same player cannot occupy both sides or duplicate slots in the same team matchup.
- Regular-season team matchups resolve to **win/loss, never a draw**.
- Scoring is **team-owned**: authenticated team members operate only their own team's score history.
- Finalization requires the two team-owned rack histories to reconcile and both teams to confirm.
- Normal user flows use the signed-in Google/Supabase session. Users should not paste access tokens, service keys, or internal UUIDs into ordinary UI.
- Postseason rules and qualification may differ from regular season; current issues/tests are the source of truth for active postseason work.

When a business rule changes, update the rule-facing UI, tests, database constraints/functions, and affected issue acceptance criteria together.

## Architecture map

The code intentionally uses small modules rather than a framework.

| Area | Location | Responsibility |
| --- | --- | --- |
| Worker routing | `src/router.js` | Top-level page/API routing and shell decoration |
| Core HTTP handlers | `src/index.js` | Request parsing, auth, command/repository wiring, error mapping |
| Page renderers | `src/*Page.js` | Server-rendered HTML and browser interaction |
| HTTP endpoint modules | `src/*Http.js` | Focused API routes for newer feature slices |
| Commands | `src/*Commands.js` | Business workflow, validation, authorization orchestration |
| Repositories | `src/*Repository.js` | Supabase RPC/REST persistence boundary |
| Pure domain logic | `domain/*.js` | Schedule, match/race, season, playoff logic without HTTP/database concerns |
| Database source of truth | `supabase/migrations/*.sql` | Tables, constraints, RPC functions, triggers, RLS, grants |
| Tests | `test/*.test.js` | Node `node:test` regression and integration-contract coverage |
| Cloudflare config | `wrangler.jsonc` | Worker name and non-secret environment bindings |
| CI | `.github/workflows/ci.yml` | Required validation on PRs and `main` |

Typical request flow:

```text
page/browser -> HTTP handler -> command -> repository -> Supabase RPC/table
```

Keep authorization and data-integrity rules in server/database layers rather than trusting browser-only validation.

## Supabase and environment boundaries

Production and staging are separate projects and must remain isolated:

| Environment | Supabase project | Cloudflare binding |
| --- | --- | --- |
| Production | `cpiucsxlkicmlbvdvhww` | default `wrangler.jsonc` vars |
| Staging | `oqkkvqkerusepyokzbmt` | `wrangler --env staging` vars |

Useful non-secret readiness endpoint:

```text
/health/environment
```

Important boundaries:

- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are public/browser-safe bindings.
- `SUPABASE_SERVICE_ROLE_KEY` is **server-side secret material**. Keep it in Cloudflare Secrets; never commit, log, expose, or place it in browser JavaScript.
- Never point production at staging or staging at production as a shortcut.
- Treat `supabase/migrations/` as the durable database source of truth and prefer forward migrations.
- Compare repository migration history with the target hosted project before database work.
- Preserve RLS, grants, authorization boundaries, and security-advisor hygiene.
- If an emergency hosted hotfix is required, create the matching repository migration immediately and prove convergence.

### PostgreSQL conflict-target footgun

PL/pgSQL functions can become ambiguous when a returned/parameter column name is also used unqualified in `ON CONFLICT (...)`. When a named unique constraint already exists, prefer an explicit target such as:

```sql
ON CONFLICT ON CONSTRAINT some_named_unique_constraint
```

Add regression coverage when fixing this class of defect.

## Authentication and authorization

Authentication is Google -> Supabase Auth -> bearer session. Browser pages should use the authenticated session automatically.

Server-side authorization must still enforce actor/team/captain/admin boundaries, with RLS as an additional boundary. A successful login is not proof that cross-team or privileged actions are safe.

## High-value end-to-end shape

A useful core workflow to keep healthy is:

```text
sign in -> profile -> season/team -> availability -> blind lineup
-> generated player matches -> score picker -> 8/9 rack scoring
-> reconcile -> dual confirm -> finalize -> team standings -> individual standings
```

The platform should continue beyond any one season or release. Current GitHub issues and milestones determine which gaps matter most now; `AGENTS.md` defines how an autonomous agent should choose among them.

## Main user surfaces

- `/` — league introduction
- `/rules` — public rules
- `/profile` — Google sign-in and player profile
- `/teams` — team creation, requests/invitations, roster management
- `/availability` — roster/free-agent availability
- `/lineup` — captain lineup workflow
- `/scorecard` — eligible match picker
- `/scorecard/live` — live rack scoring
- `/standings` — team / individual standings
- `/season-setup` — league-director season setup and publishing
- `/trades` — player trade workflow
- `/prizes` — purse and payout state
- `/health` — Worker version metadata
- `/health/environment` — non-secret environment diagnostics
- `/demo`, `/sandbox/*` — disposable War Games/demo surfaces; useful for testing, not authoritative production proof

Inspect `src/router.js` before adding a route so a second surface is not created for behavior that already exists.

## Development commands

```bash
# lint/static conventions
npm run lint

# syntax validation
npm run check

# full Node test suite
npm test

# Cloudflare Worker dry-run build (same shape as CI)
npm run build

# local Worker
npm run dev

# production deploy — only when deployment is explicitly intended
npm run deploy
```

The Cloudflare Worker connected to this repository must be named **`fremontderby`** to match `wrangler.jsonc`.

## Definition of done

For affected behavior, aim to leave:

- source, migrations, and hosted state understood/aligned where relevant;
- regression coverage;
- required CI green;
- authorization/RLS boundaries preserved;
- staging/production isolation intact;
- issue/parent state reconciled accurately;
- durable discoveries captured so the next low-context agent can continue from the repository alone.

See `AGENTS.md` for the full continuous development and backlog-maintenance contract.

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
- `docs/product-surface-catalog.md` — canonical index connecting audiences, documented user stories, functions, and page ownership.
- `docs/page-api-user-story-audit.md` — comprehensive page-by-page audit reference connecting current/planned stories to UI/API ownership and product-owner audit flags.
- `.github/agents/*.agent.md` — specialist operating profiles, including the Product Librarian / Information Architecture lane.
- `docs/agent-bootstrap.md` — minimal external-session bootstrap.
- GitHub issues/milestones/PRs — current priorities, user stories, requirements, blockers, and acceptance criteria.
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

## Product library and information-architecture invariants

Fremont Derby treats user stories, page ownership, and navigation as maintained product infrastructure rather than incidental UI details.

The **Product Librarian / Information Architecture** agent at [`.github/agents/product-librarian.agent.md`](.github/agents/product-librarian.agent.md) continuously reconciles this structure. The durable catalog lives at [`docs/product-surface-catalog.md`](docs/product-surface-catalog.md), with the deeper page/API/story audit at [`docs/page-api-user-story-audit.md`](docs/page-api-user-story-audit.md).

For normal user-facing product work:

- every meaningful user requirement should be documented as a GitHub user story, preferably in `As a <audience>, I can <capability>, so that <outcome>` form;
- every user-facing function must have one canonical page/surface home;
- every page must have one distinct primary purpose for each audience/group it serves;
- secondary functions should directly support that primary purpose rather than turning a page into a grab bag;
- duplicate pages/functions should be consolidated or explicitly documented as intentional;
- backend/API capability with no appropriate authorized UI surface is incomplete product work;
- normal pages and primary functions should be discoverable by the authorized audience within **two deliberate navigation actions** from shared/group navigation;
- technical URLs, UUID/token entry, browser history, and undocumented deep links do not count as discoverability;
- diagnostic/health, disposable demo/sandbox, moderation-only review, and destructive-confirmation substeps may be explicit documented exceptions;
- discoverability never overrides authentication or authorization boundaries.

When a route, page, navigation element, role, or user-facing function changes, reconcile the affected story/page mapping and create or update issues for orphaned functions, overloaded pages, duplicate surfaces, dead ends, stale documentation, or two-click reachability violations.

### Approved product-shape transitions still being implemented

Current runtime can temporarily lag approved product ownership while focused cleanup stories land. Treat these issues as the durable direction rather than extending the legacy surface:

- **#370 Schedule + availability** — PR #376 shipped the canonical personal date-keyed Available / Unsure / Unavailable check-in directly on `/schedule`, including teamless/free-agent players. PR #389 moved captain lineup/substitute discovery to that same date-keyed source. Remaining work is final real-phone proof and eventual standalone `/availability` retirement after parity/recovery proof.
- **#371 Score + Play Tonight** — PRs #422/#424 shipped the human-readable current-date-default **date → team → matchup → revealed race** selector stack directly on `/scorecard`, using only server-authorized scorable rows. PR #431 lets a captain-selected unrevealed matchup continue through **Prepare lineup** into canonical `/lineup`, while dated availability, substitute discovery, blind-three validation/lock/reveal, and scoring authorization remain owned by their existing surfaces. `/scorecard/live` remains focused live scoring. Remaining work is actual-play-date semantics when scheduled date is insufficient and final phone/browser validation.
- **#366 Admin gateway** — `/admin` is the role-aware administration/help gateway. Admin is discoverable from shared desktop navigation and the mobile menu. `/admin/seasons` now owns fast lookup of existing seasons only; lifecycle/configuration remains `/season-setup`, season-team preparation remains `/admin/season-teams`, and results remain `/standings`. Admin Teams/#372, Admin Support/#361, broader League Management consolidation, and final Profile-fallback retirement remain open.
- **#337 Close season** — PR #412 ships an explicit audited **Close season** action on `/season-setup` after competitive completion while preserving league history. PRs #417/#419 completed the canonical Close and Publish readiness checklists on the same lifecycle surface. Cancel/Archive/safe-delete remain distinct lifecycle actions under #414. Do not create a second season-lifecycle page.
- **#342 prepared-team administration** — PRs #398/#404/#405 complete prepared-team creation, optional captain assignment, and the explicit Add players continuation on `/admin/season-teams`. Season-preparation work stays here; planned Admin Teams/#372 remains the distinct one-team operational/exception surface.
- **#406 team-slot governance** — team entry uses four plain-language states: **Forming, Qualified, Accepted, Waitlisted**. PR #411 enforces initial qualification for new/current-season teams as an assigned captain plus at least 3 active rostered players before they can take a slot. Returning reservation/release is #408, persistent waitlist ordering/promotion is #409, participant-facing state plus 4-player opening-night depth is #410. PR #451/#448 makes an unavailable Reserve/Add reason visible in context without changing slot rules.
- **#341 prepared-player self-claim** — PR #391 shipped `Claim existing player` on `/profile` for a signed-in user without an owned player identity. Only unclaimed zero-competitive-rack identities are eligible; Profile owns self-claim while `/admin/players` owns creation of the prepared Unclaimed identity. Exact deployed-Worker real-account/phone proof remains open on #341.
- **#335 private captain contact** — PR #401 establishes Profile as the self-service home for a player's private league contact phone. PR #404 adds contact-aware captain assignment and season-activation enforcement. Remaining work is an obvious recovery path for an existing captain missing contact plus authorized full-number display only in canonical Admin detail; broad lists stay readiness-only.
- **#362 Trades retirement** — PR #447 removed `/trades` and ordinary formal-trade HTTP entry points from the supported runtime. Roster change uses applications, membership requests, invitations, captain roster management, and admin exceptions; historical private trade/audit records remain intact for history.
- **#18 Prize ownership split** — `/prizes` is the public/read-only purse and payout view; privileged prize configuration belongs in Admin → League Management.
- **#365 Fargo profile identity** — players may enter their own Fargo identifier on Profile; official Fargo rating and robustness are displayed from sourced observations when available. Player-supplied IDs remain distinguishable from verified Fargo identity.
- **#361 Admin Support** — player questions/operational reports go to the shared admin group through Messages and remain distinct from moderation reports.
- **#387 Test Drive component parity** — complete after PRs #386/#444/#446. Test Drive / War Games is a QA harness around production components, not a parallel demo implementation: scoring and captain lineup share the production components/controllers, while the durable workflow inventory classifies remaining formation/availability/churn actions as clearly fictional orientation or sandbox-only support rather than production mutation proof.
- **#382 site-wide visual/accessibility system** — the approved product language is warm/light page content with white/light surfaces and deep Fremont-green actions; the dark felt/wood treatment is reserved for shared navigation identity. Shared architecture and page-source convergence have landed across the public, player, captain, admin, recovery, Standings, Rules, and Test Drive surfaces. #382 remains open for representative phone/desktop browser verification, `/scorecard/live` mock-up fidelity, and any concrete defects found during that final visual QA.

Do not create parallel pages to implement these transitions. Follow the canonical ownership in the linked stories and `docs/product-surface-catalog.md`.

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
| Product surface catalog | `docs/product-surface-catalog.md` | Audience/story/function/page ownership and discoverability index |
| Page/API/story audit | `docs/page-api-user-story-audit.md` | Product-owner audit of page stories, current/planned APIs, and IA flags |
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

PR #380 / #378 makes the Fremont Derby access/refresh session survive ordinary browser closes and restarts by restoring and mirroring only the browser-safe session tokens through durable browser storage. The short-lived access-token refresh model remains intact; explicit sign-out clears persistent session data, and revoked/invalid underlying refresh sessions remain invalid. This is a usability/persistence layer only: it does **not** replace or weaken server-side authorization, RLS, OAuth scope, or service-role boundaries.

Server-side authorization must still enforce actor/team/captain/admin boundaries, with RLS as an additional boundary. A successful login is not proof that cross-team or privileged actions are safe.

## High-value end-to-end shape

A useful current core workflow to keep healthy is:

```text
sign in -> profile / claim prepared identity if applicable -> current-season registration/payment -> team
-> schedule + dated availability -> blind lineup -> Score -> generated player match
-> live 8/9 rack scoring -> reconcile -> dual confirm -> finalize
-> team standings -> individual standings
```

#370/#371 intentionally converge separate Availability and Play Tonight concepts into Schedule and Score. Schedule owns personal dated check-in after PR #376 and captain lineup/sub discovery now consumes the same dated source after PR #389. Score owns the shipped date/team/matchup/revealed-race selection stack after PRs #422/#424 and, after PR #431, can route an unrevealed captain matchup directly into canonical lineup preparation without duplicating availability, substitute, blind-lineup, or scoring authorization logic. Remaining #371 work is actual-play-date semantics and final phone validation. Do not introduce parallel replacement pages while `/availability` retirement and Score consolidation remain open.

The platform should continue beyond any one season or release. Current GitHub issues and milestones determine which gaps matter most now; `AGENTS.md` defines how an autonomous agent should choose among them.

## Main user surfaces

- `/` — concise cash-league introduction and primary Join / sign in action; PR #379/#377 shipped the current above-the-fold shape, while #252 still owns deeper current-season practical details
- `/rules` — authoritative public rules; PR #441/#436 completed the postseason-rule copy reconciliation and the current source is converged on the shared visual system; remaining visual proof belongs to parent #382
- `/profile` — Google sign-in, player identity/profile, own current-season registration/payment status, prepared-player self-claim, and private self-service league contact phone. PR #401/#335 adds the private phone foundation; PR #404 enforces contact readiness when captaincy/team activation requires it. PR #391/#341 ships `Claim existing player`, PR #385/#343 adds Join this season plus Registered / Payment due / Paid / Waived state, Fargo self-service #365 belongs here, and PR #380/#378 keeps the login across normal browser restarts while the underlying Supabase refresh session remains valid
- `/teams` — canonical public/player/captain team directory and team-management surface. Team creation, requests/invitations, roster management, and recruiting belong here. #131 is open because current signed-out runtime still needs to restore the safe public directory promised by the story. Participant-facing Forming / Qualified / Accepted / Waitlisted status and four-player opening-night depth belong here under #410 rather than on a second registration page
- `/schedule` — league dates, matchup context, and canonical personal dated Available / Unsure / Unavailable check-in after PR #376/#370; captain lineup/sub discovery consumes the same dated source after PR #389
- `/availability` — **transitional duplicate availability surface** pending final #370 parity/recovery proof and retirement
- `/lineup` — authoritative captain blind-lineup workflow. PR #431 lets Score hand an unrevealed selected captain matchup here through **Prepare lineup**; dated availability, available-sub discovery, three-slot ordering, validation, lock/reveal, and persistence remain owned here. Production and Captain War Games consume the same shared blind-lineup component/controller; source-theme convergence is complete and final browser proof remains under #382
- `/scorecard` — canonical flexible league-night hub. PRs #422/#424 ship local-Today default plus human-readable date, scoring-team, team-matchup, and revealed-race selectors from the existing authorized scorable-match read model; PR #431 adds captain matchup contexts before reveal and a direct Prepare lineup continuation into `/lineup`. Remaining #371 work is actual-play-date semantics and final phone/browser validation
- `/scorecard/live` — live team-owned rack-ledger scoring; PR #386 shares this exact production scorer/controller with Player War Games through separate production/sandbox adapters; two-human phone proof remains #326/#219
- `/messages` — league, team, direct, and planned admin-support communication; matchup-specific chat is deprecated under #78
- `/messages/moderation` — moderator/admin message-report review; separate from Admin Support
- `/standings` — canonical team / individual standings and historical result selection; source-theme convergence is complete and final browser proof remains under #382
- `/admin` — shipped partial role-aware Admin gateway. Shared navigation is defined canonically in `src/appShell.js`; remaining destination/ownership work is #366/#372/#361
- `/admin/seasons` — league-admin directory for finding existing seasons by human-readable name/status and continuing to the correct canonical surface. It owns lookup only; configuration/lifecycle stays `/season-setup`, team entry stays `/admin/season-teams`, and public results stay `/standings`
- `/season-setup` — league-director selected-season lifecycle management under Admin → League Management, including explicit audited **Close season** after PR #412/#337 and authoritative Publish/Close readiness checklists after PRs #417/#419/#338. Distinct Cancel/Archive/safe-delete actions stay #414
- `/admin/season-teams` — canonical league-admin season-team preparation surface. PRs #398/#404/#405 cover prepared-team creation, optional captain assignment, and Add players continuation. PR #411 adds Forming / Qualified / Accepted / Waitlisted admin state and qualification enforcement. PR #451/#448 makes the authoritative reason for an unavailable Reserve/Add action visible in-context. Returning deadline/release is #408 and durable waitlist ordering/promotion is #409
- `/admin/operations` — league-admin readiness, exception triage, action queue, and operational health; #410 will add accepted-team four-player opening-night depth/readiness summary
- `/admin/players` — league-admin player search, role management, competition eligibility, roster exceptions, and admin creation of unclaimed players (#340/PR #368); `/admin/season-teams` deep-links here for Add players. Self-claim and own phone editing belong on Profile, not here
- `/prizes` — public purse/payout state; privileged configuration is moving to Admin → League Management under #18
- `/health` — Worker version metadata
- `/health/environment` — non-secret environment diagnostics
- `/demo` — public **Test Drive the App** using fictional, non-authoritative data; production-component parity and the complete workflow inventory are reconciled under #387/PR #446; source-theme convergence is complete and final browser proof remains under #382
- `/sandbox/captain` — fictional captain practice child flow; its lineup drill uses the exact production blind-lineup component/controller with a fictional adapter, while formation/availability/churn remain clearly labeled sandbox orientation
- `/sandbox/player` — fictional scoring/reconciliation child flow using the same rack-ledger component/controller as `/scorecard/live`, with isolated fictional state

Formal `/trades` product/runtime ownership is retired after PR #447; ordinary users should receive 404 rather than discovering a legacy page or formal-trade API. Historical private trade/audit records remain data history, not a user-facing surface.

Admin is directly available from shared desktop navigation and the mobile menu; the constrained five-item quick dock remains **Teams | Schedule | Score | Messages | Profile**. `src/appShell.js` is the canonical navigation source. `/admin/seasons` is reached through **Admin → Seasons**, satisfying the <=2 deliberate navigation-action rule for authorized admins. Profile admin links remain a temporary fallback until Admin Teams, Admin Support, and the remaining League Management ownership are complete enough to remove them without a reachability regression.

The shared visual contract is centralized: normal application content is warm/light, while dark felt/wood is reserved for the shared navigation shell. The page-level source convergence tracked by #427/#428/#429/#434/#435/#437 has landed; parent #382 remains the durable owner for representative phone/desktop browser sign-off and `/scorecard/live` mock-up fidelity.

Inspect `src/router.js`, `src/routerEntry.js`, `docs/product-surface-catalog.md`, and `docs/page-api-user-story-audit.md` before adding a route so a second surface is not created for behavior that already exists and the new function receives a documented canonical home.

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
- user-facing changes mapped to a documented story and canonical page/function home;
- navigation/discoverability gaps captured when the affected function is not reachable as intended;
- issue/parent state reconciled accurately;
- durable discoveries captured so the next low-context agent can continue from the repository alone.

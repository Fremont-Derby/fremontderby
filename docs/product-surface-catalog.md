# Fremont Derby Product Surface Catalog

This document is the canonical index connecting **audiences -> user stories -> functions -> pages/routes**. GitHub issues remain the durable source for individual story requirements and acceptance criteria; this catalog makes the overall product shape inspectable.

The Product Librarian / Information Architecture agent owns continuous reconciliation of this file. See `.github/agents/product-librarian.agent.md`.

Issue #238 owns the exhaustive function-by-function and story-by-story inventory. This document is updated incrementally as routes and product responsibilities change; it must describe current reality rather than an aspirational sitemap.

## Information-architecture invariants

1. Every meaningful user-facing requirement is documented as a user story in GitHub.
2. Every user-facing function has one canonical page/surface home.
3. Every page has one distinct primary purpose for each audience/group it serves.
4. Secondary functions belong on a page only when they directly support its primary purpose.
5. Duplicate pages/functions are consolidated or explicitly documented as intentional.
6. Backend/API capability with no authorized user-facing surface is incomplete product work.
7. Normal pages and primary functions are discoverable within two deliberate navigation actions for the authorized audience.
8. Technical URLs, UUID/token entry, browser history, or undocumented deep links do not count as discoverability.
9. Diagnostic, disposable demo/sandbox, moderation-only, and destructive-confirmation substeps may be documented exceptions.

## Audience groups

Use the smallest clear audience definition that matches actual authorization and product behavior:

- **Public visitor** — can understand the league, rules, public schedule/teams/standings/prizes, and how to join.
- **Player** — signed-in participant managing identity, team participation, availability, communication, and scoring actions allowed to their team.
- **Captain** — player with team-management, lineup, roster, availability/substitute, and captain decision responsibilities.
- **League admin / director** — trusted operator for season setup, publishing, exceptions, corrections, payouts, moderation administration, and league health.
- **Moderator** — trusted reviewer for message reports/moderation where separated from broader admin authority.
- **Tester / sandbox user** — public or signed-in user learning and validating fictional, non-authoritative workflows through Try a League Night and its sandbox drills.
- **Internal/diagnostic** — health and environment proof; not part of normal product navigation.

If a new role appears in code or product decisions, add it here and reconcile every affected story/page.

## User-story record standard

Every meaningful user story should exist in a GitHub issue or explicit issue checklist and be indexed here during catalog review.

Preferred form:

> As a **<audience>**, I can **<capability>**, so that **<outcome>**.

| Field | Required meaning |
| --- | --- |
| Audience | Who is allowed/expected to use it |
| Story / outcome | What the user needs to accomplish and why |
| Capability | The concrete product function |
| Canonical page | One page/route that owns the function |
| State | Complete, partial, missing, obsolete, intentionally excluded |
| Discoverability | Where the authorized user finds it |
| Story issue | GitHub issue carrying requirements/acceptance criteria |
| Proof / notes | Tests, PRs, exceptions, duplicate/orphan findings |

A story is not considered fully complete merely because backend code exists. It must have an appropriate page home, be discoverable, and match its documented acceptance criteria.

## Current top-level page registry

| Route / surface | Audience/group | Distinct primary purpose | Current ownership / status |
| --- | --- | --- | --- |
| `/` | Public visitor | Understand Fremont Derby and find the next appropriate league action | Public introduction; practical registration/current-season completeness remains under #252 |
| `/rules` | Public visitor / player | Read the authoritative user-facing league rules | Canonical rules surface |
| `/profile` | Player | Sign in and manage the player's own identity/profile state | Canonical player identity/auth surface. PR #297 added role-aware admin-tool discovery here; narrow-phone Teams/Seasons history still horizontally scrolls and is tracked by #299 |
| `/teams` | Player / captain | Find, join, create, and manage teams and roster relationships | Canonical team/roster home. Phone-width management tables stay inside the viewport after PR #290; #131 is complete |
| `/schedule` | Public visitor / player / captain | See the current/upcoming league night, round, matchup, date/table context, and enter the appropriate next workflow | Canonical current-night/schedule home; #133 |
| `/availability` | Player / captain | Declare and review league-night availability | Canonical availability surface; mobile control cleanup shipped in PR #274; substitute-discovery improvements remain under #138 |
| `/lineup` | Captain | Build and submit the team's lineup for a matchup | Canonical captain lineup surface; mobile sticky summary shipped in PR #271 |
| `/scorecard` | Player | Find an eligible generated match to score | Canonical score-selection surface; actionable signed-out/no-match/error recovery shipped in PR #277 |
| `/scorecard/live` | Player | Operate the active team-owned rack scoring flow | Canonical live scoring surface; reduced navigation shell is intentional during scoring |
| `/messages` | Player / captain | Coordinate league/team/matchup/direct communication without phone-number sharing | Canonical communication surface; recovery states shipped in PR #285 / #281 |
| `/standings` | Public visitor / player | View team and individual competitive standings | Canonical standings surface; phone-native cards shipped in PR #272; season selection/history tracked by #180 |
| `/trades` | Player / captain / admin exception | Manage player trade proposals, responses, and approvals | Canonical trade workflow |
| `/prizes` | Public visitor / admin | View purse/payout state; administer prize configuration where authorized | Shared public/admin surface; role/function separation still requires audit under #238 |
| `/season-setup` | League admin / director | Configure and publish a season | Canonical season-configuration/publishing surface |
| `/admin/operations` | League admin / director | See league readiness, exceptions, prioritized actions, and operational health | Canonical admin operations/triage surface. First slice shipped in PR #292; accessibility refinement in #293; current-round availability in #294; role-aware discovery through Profile shipped in PR #297. Functional story #169 remains open for remaining metrics/status rules |
| `/messages/moderation` | Moderator / league admin | Review and resolve reported messages | Canonical moderation surface; intentionally role-restricted. General operations should not accumulate here |
| `/demo` | Public visitor / tester | Guided **Try a League Night** test drive using fictional, non-authoritative data | Canonical public product-demo entry. Guided experience shipped under #249/#263; shared navigation still labels it `Demo`, and contextual feedback remains under #113/#172 |
| `/sandbox/captain` | Tester / sandbox user | Practice fictional team formation, roster viability/churn, availability, and lineup submission | Canonical captain practice drill; #263 |
| `/sandbox/player` | Tester / sandbox user | Practice fictional team-owned scoring, mismatch/reconciliation, confirmation, and finalization | Canonical player scoring practice drill; #113 |
| `/health`, `/health/environment` | Internal/diagnostic | Verify Worker/environment readiness without exposing secrets | Explicit normal-navigation exception |

## Reconciled story/function mappings

This table is intentionally incremental. #238 expands it until all meaningful stories and controls are represented.

| Audience | User outcome / capability | Canonical page | State | Story / proof | Discoverability notes |
| --- | --- | --- | --- | --- | --- |
| Public visitor / player / captain | Find tonight's round and matchup context quickly | `/schedule` | Complete initial slice | #133 | Desktop primary navigation exposes Schedule; mobile dock exposes Tonight |
| Player | Sign in, manage identity, review memberships/seasons, and discover role-specific admin tools when authorized | `/profile` | Implemented core profile; narrow-phone history layout partial | #8, #81, #239, #299, PR #297 | Profile is a direct shared-navigation destination. Authorized admins see Operations/Season setup/Moderation after the existing admin authorization probe; ordinary users do not. Profile history mobile reflow remains #299 |
| Player / captain | Find/create/join/manage team relationships | `/teams` | Implemented | #131, #181, #182, PR #290 | Teams is the canonical roster/membership home; league-night shortcuts are secondary links only |
| Player / captain | Mark league-night availability | `/availability` | Implemented; mobile control polished | #13, #138, PR #274 | Teams is one shared-navigation action and Mark availability is the second |
| Captain | Submit a blind ordered three-player lineup | `/lineup` | Implemented; mobile state visibility polished | #13, #139, #156, PR #271 | Teams is one shared-navigation action and Build lineup is the second |
| Player | Pick an eligible generated match without technical IDs/tokens | `/scorecard` | Implemented; recovery states improved | #141, #250, PR #277 | Score is a direct shared-navigation destination; recovery points to Profile, Schedule, Teams, or Retry |
| Player / team member | Enter, reconcile, confirm, and finalize rack scoring | `/scorecard/live` | Implemented core flow | #14, #73, #229 | Reduced shell is an intentional task-focus exception; clear return path required |
| Public visitor / player | Switch quickly between team and individual standings | `/standings` | Implemented current view; history still open | #16, #17, #180, PR #272 | Desktop nav is direct; mobile menu remains <=2 actions |
| Player / captain | Coordinate without sharing phone numbers | `/messages` | Implemented including recovery states | #76, #250, #281, PR #285 | Messages is a direct shared-navigation destination; non-happy paths have explicit recovery |
| League admin / director | Configure and publish the season | `/season-setup` | Implemented core setup | #12 | Canonical configuration/publishing page; authorized admins can discover it from Profile in <=2 actions after PR #297 |
| League admin / director | See current readiness and operational exceptions without querying Supabase | `/admin/operations` | Partial but shipped; discoverable | #168, #169, #239, PRs #292-#294, #297 | **Reachability resolved:** Profile is a direct shared-navigation destination and its role-aware admin panel exposes Operations as the second action only after the existing admin endpoint authorizes the session. #239 stays open for deterministic role-aware graph coverage across the rest of the product |
| Moderator / league admin | Resolve reported chat messages | `/messages/moderation` | Implemented | #80, #239, PR #297 | Moderator-only exception remains documented; league admins can also discover Moderation from the role-aware Profile admin panel |
| Public visitor / tester | Understand the league by completing a safe guided test drive | `/demo` | Partial: guided flow shipped; shared nav label + feedback remain open | #249, PR #265 | Entry is discoverable, but shared navigation still says `Demo`; contextual feedback remains in #113/#172 |
| Tester / captain | Practice team formation and lineup work without touching production | `/sandbox/captain` | Implemented | #263, PR #264 | One action from `/demo`; explicit fictional/non-authoritative exception |
| Tester / player | Practice dual scoring without touching production | `/sandbox/player` | Implemented core drill | #113 | One action from `/demo`; explicit fictional/non-authoritative exception |

## Current librarian findings

### 2026-08-11 review cycles

- Schedule/current-night ownership is `/schedule`; Teams remains the canonical roster/membership home.
- `/admin/operations` is the canonical league-admin readiness/exception-triage page. PR #292 shipped the protected first slice, PR #293 improved alert accessibility, and PR #294 added current-round availability aggregates.
- **Admin discoverability is now resolved:** PR #297 added a hidden-by-default role-aware League admin panel on `/profile`. Profile is already in shared navigation, so an authorized admin can reach Operations, Season setup, or Moderation in the second deliberate action; ordinary players do not see the panel. #239 remains open for broader deterministic role-aware navigation-graph enforcement rather than this previously known violation.
- **New cataloged mobile gap:** `/profile` still applies `overflow-x:auto` plus `table { min-width: 620px; }` under 820px for Teams/Seasons history. #299 now owns the contained responsive reflow; no duplicate profile surface should be created.
- `/demo` is the canonical **Try a League Night** product demo, but shared navigation still labels it `Demo`. #249 already owns the stale label; contextual feedback remains #113/#172.
- PRs #271, #272, #274, #277, #285, #290, and #297 improved existing canonical surfaces without adding duplicate routes.
- No new route/story card was needed for release/security-only PR #296 because it changes authorization defense-in-depth rather than product-surface ownership.
- #238 remains incomplete until every current renderer/control is mapped; #239 remains incomplete until the navigation graph/regression check is deterministic and role-aware.

## Known catalog work

- #237 — establish the Product Librarian continuous information-architecture loop. Completed by PR #242.
- #238 — exhaustive user-story/page/function inventory and catalog maintenance.
- #239 — build/enforce the <=2-click role-aware navigation/reachability audit. The known hidden admin-operations violation was resolved by PR #297; broader graph/regression coverage remains.
- #240 — recurring Product Librarian review cadence. Completed; subsequent cycles leave evidence in #238/#239 and this catalog.
- #249 — Try a League Night is largely shipped; shared navigation naming and contextual feedback remain before closure.
- #250 — route-state cleanup remains open; Score and Messages recovery slices are complete.
- #169 — `/admin/operations` is shipped and role-aware discoverability is complete; remaining metric/status criteria stay open.
- #299 — reflow Profile team/season history on narrow phones without horizontal scrolling.

## Librarian update checklist

When a PR or issue changes routes, navigation, page controls, roles, or user-visible behavior:

- [ ] Is there a documented user story for the changed capability?
- [ ] Is the audience/group explicit?
- [ ] Does the capability have exactly one canonical page home?
- [ ] Does the page still have one clear primary purpose for that group?
- [ ] Is the capability discoverable to the authorized user in <=2 navigation actions?
- [ ] Did the change create a duplicate page/function, dead end, stale route, or hidden capability?
- [ ] Does this catalog need an update?
- [ ] Does the README need a stable product-surface update?
- [ ] Are unresolved gaps represented by GitHub issues?
- [ ] Are completed/stale issues reconciled after the change?

The catalog should describe current product reality, not become an aspirational wishlist. Missing capabilities belong in linked issues with clear state.

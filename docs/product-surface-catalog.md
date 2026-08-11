# Fremont Derby Product Surface Catalog

This document is the canonical index connecting **audiences -> user stories -> functions -> pages/routes**. GitHub issues remain the durable source for individual story requirements and acceptance criteria; this catalog makes the overall product shape inspectable.

The Product Librarian / Information Architecture agent owns continuous reconciliation of this file. See `.github/agents/product-librarian.agent.md`.

Issue #238 owns the first exhaustive function-by-function and story-by-story inventory. This document is updated incrementally as routes and product responsibilities change; it must describe current reality rather than an aspirational sitemap.

## Information-architecture invariants

1. Every meaningful user-facing requirement is documented as a user story in GitHub.
2. Every user-facing function has one canonical page/surface home.
3. Every page has one distinct primary purpose for each audience/group it serves.
4. Secondary functions belong on a page only when they directly support its primary purpose.
5. Duplicate pages/functions are consolidated or explicitly documented as intentional.
6. Backend/API capability with no authorized user-facing surface is an incomplete product story.
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

Record enough context to answer:

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
| `/profile` | Player | Sign in and manage the player's own identity/profile state | Canonical player identity/auth surface |
| `/teams` | Player / captain | Find, join, create, and manage teams and roster relationships | Canonical team/roster home. It may show contextual league-night shortcuts, but Schedule/Availability/Lineup/Score remain separate canonical functions |
| `/schedule` | Public visitor / player / captain | See the current/upcoming league night, round, matchup, date/table context, and enter the appropriate next workflow | Canonical current-night/schedule home; added by #133 |
| `/availability` | Player / captain | Declare and review league-night availability | Canonical availability surface; mobile segmented-control cleanup shipped in #273/PR #274; captain substitute-discovery improvements remain under #138 |
| `/lineup` | Captain | Build and submit the team's lineup for a matchup | Canonical captain lineup surface; mobile sticky lineup summary shipped in #262/PR #271 |
| `/scorecard` | Player | Find an eligible generated match to score | Canonical score-selection surface; actionable signed-out/no-match/error recovery shipped in PR #277 under #250 |
| `/scorecard/live` | Player | Operate the active team-owned rack scoring flow | Canonical live scoring surface; reduced navigation shell is intentional during scoring |
| `/messages` | Player / captain | Coordinate league/team/matchup/direct communication without phone-number sharing | Canonical communication surface. Core messaging exists, but signed-out/loading/empty/expired-session/failure recovery remains partial under #281 / parent #250 |
| `/standings` | Public visitor / player | View team and individual competitive standings | Canonical standings surface; phone-native cards shipped in PR #272; season selection/history tracked by #180 |
| `/trades` | Player / captain / admin exception | Manage player trade proposals, responses, and approvals | Canonical trade workflow |
| `/prizes` | Public visitor / admin | View purse/payout state; administer prize configuration where authorized | Shared public/admin surface; role/function separation still requires audit under #238 |
| `/season-setup` | League admin / director | Configure and publish a season | Canonical season-configuration/publishing surface |
| `/messages/moderation` | Moderator / league admin | Review and resolve reported messages | Canonical moderation surface; intentionally role-restricted |
| `/demo` | Public visitor / tester | Guided **Try a League Night** test drive: form a fictional team/lineup, practice scoring, and inspect a completed season | Canonical public product-demo entry; #249/#263 delivered the guided experience. Shared navigation still labels it `Demo`, and contextual feedback remains unresolved under #113/#172, so #249 remains open |
| `/sandbox/captain` | Tester / sandbox user | Practice fictional team formation, request approval/rejection, roster viability/churn, availability, and lineup submission | Canonical captain practice drill; #263 |
| `/sandbox/player` | Tester / sandbox user | Practice fictional team-owned scoring, mismatch/reconciliation, confirmation, and finalization | Canonical player scoring practice drill; #113 |
| `/health`, `/health/environment` | Internal/diagnostic | Verify Worker/environment readiness without exposing secrets | Explicit normal-navigation exception |

### Planned / in-flight surfaces

Do not catalog a proposed route as shipped until it reaches `main`.

| Proposed route | Intended audience | Intended canonical purpose | Current state |
| --- | --- | --- | --- |
| `/admin/operations` | League admin / director | League readiness, exception triage, action queue, and operational health | Story #169 remains open. Previous draft PR #179 is stale relative to current `main`; any renewed implementation must provide a role-aware Admin entry within <=2 navigation actions rather than hiding Operations behind Messages -> Moderation |

## Reconciled story/function mappings

This table is intentionally incremental. #238 expands it until all meaningful stories and controls are represented.

| Audience | User outcome / capability | Canonical page | State | Story / proof | Discoverability notes |
| --- | --- | --- | --- | --- | --- |
| Public visitor / player / captain | Find tonight's round and matchup context quickly | `/schedule` | Complete initial slice | #133 | Desktop primary navigation exposes Schedule; mobile dock exposes Tonight |
| Player / captain | Find/create/join/manage team relationships | `/teams` | Partial / actively evolving | #131, #181, #182 | Teams is the canonical roster/membership home; league-night shortcuts are secondary links only |
| Player / captain | Mark league-night availability | `/availability` | Implemented; mobile control polished | #13, #138, #273 / PR #274 | From shared navigation, Teams is one action and Mark availability is the second; the canonical function remains `/availability` |
| Captain | Submit a blind ordered three-player lineup | `/lineup` | Implemented; mobile state visibility polished | #13, #139, #156, #262 / PR #271 | From shared navigation, Teams is one action and Build lineup is the second; human-readable matchup selection remains canonical here |
| Player | Pick an eligible generated match without technical IDs/tokens | `/scorecard` | Implemented; empty/recovery states improved | #141, #250 / PR #277 | Score is a direct shared-navigation destination. Signed-out state links to Profile and Schedule; no-ready-match state links to Schedule and Teams; failures expose retry/Profile recovery instead of a dead end |
| Player / team member | Enter, reconcile, confirm, and finalize rack scoring | `/scorecard/live` | Implemented core flow | #14, #73, #229 | Reduced shell is an intentional task-focus exception; clear return path required |
| Public visitor / player | Switch quickly between team and individual standings | `/standings` | Implemented current view; mobile cards shipped; history still open | #16, #17, #81, #180 / PR #272 | Canonical standings page; desktop nav is direct and mobile menu remains <=2 actions |
| Player / captain | Coordinate without sharing phone numbers | `/messages` | Core function implemented; non-happy-path task states incomplete | #76, #250, #281 | Messages is a direct shared-navigation destination, so route reachability is healthy. #281 owns loading, signed-out, expired-session, no-thread/no-candidate, and API-failure recovery so the page does not become a task dead end after arrival |
| League admin / director | Configure and publish the season | `/season-setup` | Implemented core setup | #12 | Admin-only canonical configuration page; operational triage should not accumulate here |
| Public visitor / tester | Understand the league by completing a safe guided test drive without sign-in | `/demo` | Partial: guided flow shipped; shared nav label + feedback remain open | #249, PR #265 | Desktop/mobile-menu entry remains within <=2 actions, but it still says `Demo`; contextual feedback stays in #113/#172 rather than a duplicate issue |
| Tester / captain | Practice forming/changing a team and submitting a lineup without touching production | `/sandbox/captain` | Implemented | #263, PR #264 | One action from `/demo`; explicit fictional/non-authoritative exception |
| Tester / player | Practice dual scoring without touching production | `/sandbox/player` | Implemented core drill | #113 | One action from `/demo`; explicit fictional/non-authoritative exception |
| League admin / director | See what needs attention across the running league | `/admin/operations` | Missing / planned | #168, #169 | Must become canonical admin home and satisfy <=2-click admin discoverability before story is considered complete |

## Current librarian findings

### 2026-08-11 review cycles

- Schedule/current-night ownership was reconciled to `/schedule`; Teams remains the canonical roster/membership home.
- #169 remains the canonical admin Operations story. The old draft PR #179 is no longer open and is stale relative to current `main`; a future implementation still needs an obvious role-aware Admin entry so Operations is not buried behind Messages -> Moderation.
- PRs #264 and #265 changed `/demo` from an internal-looking fixture into the public **Try a League Night** tour and made `/sandbox/captain` a distinct team-formation/roster-churn drill. The catalog maps those as separate canonical functions instead of grouping all sandbox behavior together.
- Shared navigation still labels `/demo` as `Demo`. #249 records this precisely and remains open; contextual test-drive feedback is also explicitly linked to the existing #113/#172 lane rather than duplicated.
- PRs #271, #272, and #274 improved mobile Lineup, Standings, and Availability respectively without creating new routes or changing canonical ownership. Their normal discovery remains within the two-action rule: Standings is directly available from shared navigation; Availability and Lineup are exposed from the Teams league-night hub after entering Teams from shared navigation.
- PR #277 improved `/scorecard` signed-out, no-ready-match, expired-session, and load-failure states without changing route ownership. The Score destination is still one action from shared navigation, while recovery paths now point directly to Profile, Schedule, Teams, or Retry instead of leaving a dead end. This is partial proof toward #250 and strengthens #239 reachability evidence.
- PR #282 codified durable UI state/recovery guidance but did not change product route ownership. Its concrete Messages gap is already captured by #281 under #250, so no duplicate issue was created.
- `/messages` remains one action from shared navigation, but arrival is not sufficient task reachability when signed-out, empty, expired-session, or failure states do not expose a useful next action. #281 is now indexed as the canonical recovery-state story for this page.
- No new route/story card is needed for those mobile/empty-state improvements because existing stories (#81, #250, page-specific issues, and scoring/messaging stories) already document the user outcomes.
- No new route or story issue was needed for release-only PRs because they change release proof/safety rather than user-facing product ownership.
- #238 remains incomplete until every current renderer/control is mapped; #239 remains incomplete until the navigation graph/regression check is deterministic and role-aware.

## Known catalog work

- #237 — establish the Product Librarian continuous information-architecture loop. Completed by PR #242.
- #238 — perform the first exhaustive user-story/page/function inventory and populate this catalog.
- #239 — build/enforce the <=2-click navigation/reachability audit.
- #240 — recurring Product Librarian review cadence. Completed; subsequent cycles continue to leave evidence in #238/#239 and this catalog.
- #249 — guided Try a League Night presentation is largely shipped; shared navigation naming and contextual feedback remain before closure.
- #250 — route-state cleanup remains open; `/scorecard` signed-out/empty/error recovery is complete via PR #277, while `/messages` recovery is now explicitly owned by #281 and the other listed major routes still require reconciliation.
- #281 — make Messages loading, signed-out, empty, expired-session, no-candidate, and failure states task-oriented without changing messaging authorization or persistence.

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

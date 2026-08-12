# Fremont Derby Product Surface Catalog

This document is the canonical index connecting **audiences -> user stories -> functions -> pages/routes**. GitHub issues remain the durable source for detailed requirements and acceptance criteria; this catalog records current product ownership and discoverability.

The Product Librarian / Information Architecture agent owns continuous reconciliation of this file. See `.github/agents/product-librarian.agent.md`.

Issue #238 owns the exhaustive control-by-control inventory. The deeper audit reference is `docs/page-api-user-story-audit.md`. This catalog describes current product reality, not an aspirational sitemap.

## Information-architecture invariants

1. Every meaningful user-facing requirement is documented in GitHub.
2. Every user-facing function has one canonical page/surface home.
3. Every page has one distinct primary purpose for each audience/group it serves.
4. Secondary functions directly support that primary purpose rather than turning the page into a grab bag.
5. Duplicate pages/functions are consolidated or explicitly documented as intentional.
6. Backend/API capability with no authorized user-facing surface is incomplete product work.
7. Normal pages and primary functions are discoverable within two deliberate navigation actions for the authorized audience.
8. Technical URLs, UUID/token entry, browser history, or undocumented deep links do not count as discoverability.
9. Diagnostic, disposable demo/sandbox, moderation-only, and destructive-confirmation substeps may be explicit exceptions.

## Audience groups

- **Public visitor** — understands the league, rules, schedule, teams, standings, prizes, and how to join.
- **Player** — manages identity, participation, availability, communication, standings, and allowed scoring work.
- **Captain** — manages roster relationships, availability/substitutes, lineups, and captain decisions.
- **League admin / director** — configures seasons, resolves exceptions, reviews operational health, and administers league-only functions.
- **Moderator** — reviews reported messages where that responsibility is separated from broader admin work.
- **Tester / sandbox user** — learns and validates fictional, non-authoritative workflows through **Test Drive the App** and its practice drills.
- **Internal / diagnostic** — health and environment proof; outside normal product navigation.

## Current top-level page registry

| Route / surface | Audience/group | Distinct primary purpose | Current ownership / status |
| --- | --- | --- | --- |
| `/` | Public visitor | Understand Fremont Derby and choose the next appropriate league action | Canonical introduction; current-season practical details remain under #252 |
| `/rules` | Public visitor / player | Read authoritative user-facing league rules | Canonical rules surface |
| `/profile` | Player; authorized admin discovery | Sign in and manage identity, memberships, season history, and role-specific tool discovery | Canonical identity/profile surface. Authorized admin grouping links directly to Players, Operations, Season Setup, Season teams, and Moderation |
| `/teams` | Player / captain | Find, join, create, manage, and recruit around teams and roster relationships | Canonical normal team/roster surface. #330 owns sortable/filterable player recruiting/substitute discovery; do not duplicate it in `/admin/players` |
| `/schedule` | Public visitor / player / captain | See the current/upcoming league night and enter the appropriate next workflow | Canonical schedule/current-night surface; #133. Flexible scheduling remains #74 |
| `/availability` | Player / captain | Declare and review dated league-night availability/check-in | Canonical availability surface. Recovery shipped in #318; #138 owns calendar-date Available/Unavailable/Unsure semantics and substitute discovery |
| `/lineup` | Captain | Build and commit the team's lineup for a matchup | Canonical captain lineup surface; blind ordering #139 and human-readable workflow #156 are shipped |
| `/scorecard` | Player / team scorer | Find an eligible generated match to score | Canonical score-selection surface; #141 |
| `/scorecard/live` | Player / team scorer | Operate active team-owned rack-ledger scoring | Canonical live-scoring surface. PRs #331/#333/#334/#355/#357 establish opening discipline, aligned rack ledger, surgical correction, collision safety, and direct pending-rack recovery. #326 owns remaining War Games/two-human proof |
| `/messages` | Player / captain | Coordinate league/team/matchup/direct communication without sharing contact details | Canonical communication surface; #76-#80 |
| `/standings` | Public visitor / player | View team and individual standings and season results | Canonical standings surface. Historical season selection remains #180 |
| `/trades` | Player / captain / admin exception | Manage player trade proposals, responses, and approvals | Canonical trade workflow; privileged-exception overlap with `/admin/players` remains an audit question |
| `/prizes` | Public visitor / admin | View purse/payout state; administer prize configuration where authorized | Shared public/admin surface; role/function separation remains an overload candidate under #238 |
| `/season-setup` | League admin / director | Configure, publish, and manage the selected season lifecycle | Canonical season-configuration/publishing surface. Team assignment is a linked child workflow on `/admin/season-teams` |
| `/admin/season-teams` | League admin / director | Populate the selected season from eligible Returning / New / In season teams | Canonical season-team assignment surface; shipped in PR #345 / #336. Direct authorized Profile link keeps it within the <=2-action rule |
| `/admin/operations` | League admin / director | See readiness, exceptions, prioritized actions, and operational health | Canonical admin operations/triage surface; #169 remains open for remaining signals |
| `/admin/players` | League admin / director | Find a player and manage privileged player-level league administration | Canonical player-administration surface. Role, competition eligibility, and exact roster exceptions shipped; #316 retains human validation |
| `/messages/moderation` | Moderator / league admin | Review and resolve reported messages | Canonical moderation surface; intentionally role-restricted |
| `/demo` | Public visitor / tester | **Test Drive the App** using fictional, non-authoritative data | Canonical public test-drive entry; canonical navigation/page identity is **Test Drive the App**. Contextual feedback remains #113/#172 |
| `/sandbox/captain` | Tester / sandbox user | Practice fictional team formation, roster churn, availability, and lineup work | Canonical captain practice drill; #263 |
| `/sandbox/player` | Tester / sandbox user | Practice fictional team-owned scoring, mismatch/reconciliation, confirmation, and finalization | Canonical player scoring drill; #326 owns convergence with the final live rack-ledger interaction model |
| `/health`, `/health/environment` | Internal / diagnostic | Verify Worker/environment readiness without exposing secrets | Explicit normal-navigation exception |

## Reconciled story/function mappings

| Audience | User outcome / capability | Canonical page | State | Story / proof | Discoverability notes |
| --- | --- | --- | --- | --- | --- |
| Public visitor / player / captain | Find tonight's round and matchup context | `/schedule` | Implemented | #133 | Direct desktop navigation; Tonight is in mobile dock |
| Player | Sign in, manage own profile/history, and discover role-specific tools | `/profile` | Implemented core | #8, #250 | Profile is direct shared navigation; role-specific admin grouping is hidden from normal players |
| Player / captain | Find/create/join/manage team relationships and recruit | `/teams` | Implemented core; recruiting expansion open | #131, #181, #182, #330 | Teams is the normal roster/recruiting home; #330 adds sortable/filterable player/team/free-agent/date availability discovery |
| Player / captain | Mark availability/check in for a calendar date | `/availability` | Existing round-based implementation; dated model open | #13, #138 | Teams -> Availability is <=2 actions. `Unsure` must be the default; current round-keyed API needs feature/data reconciliation |
| Captain | Find roster players/substitutes for a date and commit a lineup | `/lineup` with discovery support from `/teams` and `/availability` | Partial | #10, #13, #138, #330 | Discovery surfaces may filter/deep-link; final eligibility and lineup commitment stay authoritative here |
| Player / scorer | Pick an eligible match | `/scorecard` | Implemented | #141 | Score is a direct shared-nav destination |
| Player / team scorer | Choose discipline, compare rack submissions, edit own-team racks, reconcile, confirm, and finalize | `/scorecard/live` | Implementation substantially complete; final human/War Games QA open | #14, #73, #321-#326, #344; PRs #331/#333/#334/#355/#356/#357 | Reduced shell is intentional. Same-team collaborative writes are collision-safe; final physical/War Games proof stays #326 |
| Public visitor / player | View current standings | `/standings` | Implemented current season; history open | #16, #17, #180 | Desktop direct; mobile menu <=2 actions |
| Player / captain | Coordinate without sharing personal contact details | `/messages` | Implemented core | #76-#80 | Direct shared-nav destination |
| League admin / director | Configure/publish the selected season | `/season-setup` | Implemented core | #12 | Profile -> Season setup is <=2 actions |
| League admin / director | Add eligible existing/new/returning teams to the selected season | `/admin/season-teams` | Implemented first slice | #336, PR #345 | Profile -> Season teams is <=2 actions; Season Setup also provides contextual Manage season teams link |
| League admin / director | See readiness/operational exceptions | `/admin/operations` | Partial but shipped | #168, #169 | Profile -> Operations <=2 actions; execution deep-links to owning workflows |
| League admin / director | Find players and make privileged player-level changes | `/admin/players` | Implemented current slices; human validation remains | #316, PRs #320/#327/#329 | Profile -> Players <=2 actions; normal recruiting remains `/teams`/#330 |
| Moderator / league admin | Resolve reported messages | `/messages/moderation` | Implemented | #80 | Authorized discovery through Profile; role restriction remains intentional |
| Public visitor / tester | Learn product through safe fictional data | `/demo` | Core test drive implemented; feedback remains | #113, #249 | Shared navigation and page identity use **Test Drive the App** |
| Tester / captain | Practice team formation and lineup work | `/sandbox/captain` | Implemented | #263 | One action from `/demo`; explicit fictional exception |
| Tester / player | Practice dual scoring | `/sandbox/player` | Implemented core; final rack-ledger parity proof open | #113, #326 | One action from `/demo`; competitive data remains isolated |

## Canonical API/page ownership highlights

The complete endpoint inventory lives in `docs/page-api-user-story-audit.md`. Important boundaries for IA reviews:

- `/api/me/profile` -> `/profile`.
- Team applications, membership requests, invitations, free-agent participation, and normal roster relationships -> `/teams`.
- Availability APIs currently use `roundId`, but #138 requires the product model to become calendar-date based -> `/availability` with `/lineup` as consumer.
- Team lineup read/commit -> `/lineup`.
- `GET /api/me/scorable-matches` -> `/scorecard`.
- `score-comparison`, `score-racks`, `score-racks/undo`, `score-confirm`, `finalize-reconciled` -> `/scorecard/live`; older single-score API routes are compatibility/retirement audit candidates rather than a second live UI.
- Chat/thread/report APIs -> `/messages`; report-resolution APIs -> `/messages/moderation`.
- Season setup/registration configuration/publishing -> `/season-setup`.
- `team-candidates` + `teams/:teamId/add` -> `/admin/season-teams`.
- Operational overview -> `/admin/operations`.
- Admin player list/role/eligibility/roster exceptions -> `/admin/players`; normal recruiting must not use this API/surface.

## Current librarian findings

### 2026-08-11 / 2026-08-12 UTC reconciliation

- **Comprehensive audit is now durable:** PR #358 added `docs/page-api-user-story-audit.md`, organized page -> audience -> user stories -> current/planned APIs -> IA flags. It is the product-owner audit companion to this canonical ownership index.
- **Season-team assignment is now reconciled:** PR #345 shipped `/admin/season-teams` and its two admin APIs. The temporary `docs/product-surface-catalog-season-teams.md` delta has been folded into this canonical catalog and should not remain as a second catalog.
- **A real <=2-action violation was found and fixed:** the only ordinary route to season-team assignment was Profile -> Season Setup -> Manage season teams (three actions). Authorized Profile tools now expose a direct **Season teams** link while Season Setup retains the contextual child-workflow link.
- **Test-drive identity is canonical:** `/demo` is **Test Drive the App** in shared navigation and as the page identity. “Try a League Night” may be supporting copy but is not a competing route name. #249 continues to own contextual feedback closure work.
- **Rack-ledger implementation issues are reconciled:** #323 is closed as shipped; #344 is already closed after PR #355. PR #356 adds deterministic multi-device scoring proof and PR #357 fixes direct pending-rack recovery/current next-rack behavior. #326 remains the correct owner for physical two-human phone and War Games parity proof.
- **Normal recruiting and privileged player administration remain separate:** `/teams`/#330 owns sortable player/team/free-agent/date discovery; `/admin/players`/#316 owns roles, competition eligibility, and admin roster exceptions.
- **Availability remains the most important product/API semantic mismatch:** current endpoints are round-keyed, while #138 requires a calendar-date Available/Unavailable/Unsure model with Unsure by default. This is not a librarian-safe runtime change; the feature/data lane must reconcile the existing model rather than layering a second source of truth.
- **Page overload/ownership questions remain documented rather than silently resolved:** `/prizes` mixes public purse transparency with admin configuration; #343 leaves Profile-vs-Teams registration/payment mutation ownership ambiguous; admin trade exceptions overlap general admin roster exceptions; #74 still needs a canonical scheduling-mutation surface.
- **API naming debt is visible:** `/api/admin/players/:id/admin-role` now multiplexes role, competition eligibility, and roster-membership mutations. This is a maintainability/API-clarity issue, not a reason to create another player page.
- **No current route is orphaned after this pass.** Diagnostic routes remain intentional exceptions; sandbox drill routes remain children of `/demo`; `/scorecard/live` remains the intentional reduced-shell task-focus exception.

## Known catalog work

- #237 — Product Librarian contract. Completed by PR #242.
- #238 — exhaustive user-story/page/function/control inventory and ongoing catalog maintenance. PR #358 materially advances the audit but renderer/control exhaustiveness remains the closure criterion.
- #239 — deterministic <=2-action role-aware navigation/reachability audit and regression coverage. Season-team reachability and Test Drive naming now have focused regression proof; broader route matrix remains open.
- #240 — recurring Product Librarian cadence. Completed; subsequent cycles leave evidence in #238/#239 and this catalog.
- #249 — Test Drive the App contextual feedback closure work; canonical naming is now reconciled.
- #169 — remaining `/admin/operations` signals.
- #316 — `/admin/players` human/mobile validation story; implementation slices are shipped.
- #321/#326 — rack-ledger parent/final QA. #323/#324/#325/#344 implementation work is reconciled; #326 owns remaining War Games and physical phone proof.
- #330 — normal player/captain sortable player directory for recruiting and dated substitute discovery under `/teams`.
- #138 — dated availability/check-in and fast captain substitute discovery; existing round-level persistence/API assumptions must be reconciled by the owning feature/data lane.
- #341/#343/#340/#342/#335 — preseason identity, registration/payment visibility, manual player/team creation, and captain contact stories with canonical page placement documented in the page/API audit.

## Librarian update checklist

When a PR or issue changes routes, navigation, page controls, roles, or user-visible behavior:

- [ ] Is there a documented user story for the changed capability?
- [ ] Is the audience/group explicit?
- [ ] Does the capability have exactly one canonical page home?
- [ ] Does the page still have one clear primary purpose for that group?
- [ ] Is the capability discoverable to the authorized user in <=2 navigation actions?
- [ ] Did the change create a duplicate page/function, dead end, stale route, or hidden capability?
- [ ] Does this catalog need an update?
- [ ] Does `docs/page-api-user-story-audit.md` need an API/story update?
- [ ] Does the README need a stable product-surface update?
- [ ] Are unresolved gaps represented by GitHub issues?
- [ ] Are completed/stale issues reconciled after the change?

The catalog should describe current product reality. Missing capabilities belong in linked issues with clear state.

# Fremont Derby Product Surface Catalog

This document is the canonical index connecting **audiences -> user stories -> functions -> pages/routes**. GitHub issues remain the durable source for detailed requirements and acceptance criteria; this catalog records current product ownership and discoverability.

The Product Librarian / Information Architecture agent owns continuous reconciliation of this file. See `.github/agents/product-librarian.agent.md`.

Issue #238 owns the exhaustive control-by-control inventory. The deeper audit reference is `docs/page-api-user-story-audit.md`. This catalog describes current product reality while explicitly marking approved transitions that have not yet removed legacy runtime surfaces.

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

## Approved ownership transitions

These product decisions are canonical even when current runtime still exposes the legacy surface while a focused cleanup issue is open:

- **#366 Admin gateway** — Admin becomes a first-class top-level gateway. Operations, Admin Support, and Moderation remain separate. League Management groups season, season-team, registration/payment configuration, prize configuration, and lifecycle work. Profile returns to its `me / identity` purpose after the new gateway preserves authorized <=2-action reachability.
- **#362 Trades retirement** — formal trades are no longer a supported product workflow. Applications, invitations, captain roster management, and admin roster exceptions replace them; historical trade/audit records may remain.
- **#18 Prize split** — `/prizes` is public/read-only transparency; privileged payout configuration belongs in Admin -> League Management.
- **#365 Fargo profile identity** — `/profile` owns player-entered Fargo ID and display of sourced official Fargo rating + robustness. Player-entered identity remains distinguishable from verified Fargo identity.
- **#361 Admin Support** — player questions/operational reports are shared admin-group conversations using Messages and are distinct from `/messages/moderation`.
- **#182 Captain lifecycle** — teams self-manage the current captain; if self-service cannot be completed, an admin performs the same captain swap as an exception. The new captain receives the full captain role; there is no reduced one-night captain role.
- **#77 Contextual messaging** — `Message player` and `Message captain` are links into the canonical direct-message experience, not new chat types.

## Current top-level page registry

| Route / surface | Audience/group | Distinct primary purpose | Current ownership / status |
| --- | --- | --- | --- |
| `/` | Public visitor | Understand Fremont Derby and choose the next appropriate league action | Canonical introduction; current-season practical details remain under #252 |
| `/rules` | Public visitor / player | Read authoritative user-facing league rules | Canonical rules surface |
| `/profile` | Player | Sign in and manage own identity, memberships, season history, and personal status | Canonical identity/profile surface. Current admin links are a temporary reachability bridge; #366 moves admin discovery to a top-level Admin gateway. #365 owns Fargo ID/rating/robustness self-service |
| `/teams` | Player / captain | Find, join, create, manage, and recruit around teams and roster relationships | Canonical normal team/roster surface. #330 owns sortable/filterable player recruiting/substitute discovery; contextual messaging deep-links to `/messages` rather than duplicating chat |
| `/schedule` | Public visitor / player / captain | See the current/upcoming league night and enter the appropriate next workflow | Canonical schedule/current-night surface; #133. Flexible scheduling remains #74 |
| `/availability` | Player / captain | Declare and review dated league-night availability/check-in | Canonical availability surface. Recovery shipped in #318; #138 owns calendar-date Available/Unavailable/Unsure semantics and substitute discovery |
| `/lineup` | Captain | Build and commit the team's lineup for a matchup | Canonical captain lineup surface; blind ordering #139 and human-readable workflow #156 are shipped |
| `/scorecard` | Player / team scorer | Find an eligible generated match to score | Canonical score-selection surface; #141 |
| `/scorecard/live` | Player / team scorer | Operate active team-owned rack-ledger scoring | Canonical live-scoring surface. PRs #331/#333/#334/#355/#357 establish opening discipline, aligned rack ledger, surgical correction, collision safety, and direct pending-rack recovery. #326 owns remaining War Games/two-human proof |
| `/messages` | Player / captain / admin support participant | Coordinate league/team/direct communication and shared admin-support conversations without sharing contact details | Canonical communication surface; #76-#80 and #361. Matchup-specific chat is deprecated under #78 |
| `/standings` | Public visitor / player | View team and individual standings and season results | Canonical standings surface. Historical season selection remains #180 |
| `/trades` | Legacy only | Legacy formal trade workflow | **Deprecated product surface pending removal under #362. Do not extend or treat as a supported canonical workflow.** |
| `/prizes` | Public visitor / player | View purse and payout transparency | Canonical public/read-only prize surface by product decision #18; current privileged controls are migration debt until moved to Admin -> League Management |
| `/season-setup` | League admin / director | Configure, publish, and manage the selected season lifecycle | Current canonical season-configuration/publishing surface; planned to sit under Admin -> League Management via #366. Team assignment remains linked child workflow on `/admin/season-teams` |
| `/admin/season-teams` | League admin / director | Populate the selected season from eligible Returning / New / In season teams | Canonical season-team assignment surface; shipped in PR #345 / #336. Current Profile direct link is a temporary reachability bridge until #366 |
| `/admin/operations` | League admin / director | See readiness, exceptions, prioritized actions, and operational health | Canonical admin operations/triage surface; #169 remains open for remaining signals. Must stay distinct from Admin Support and Moderation |
| `/admin/players` | League admin / director | Find a player and manage privileged player-level league administration | Canonical player-administration surface. Role, competition eligibility, and exact roster exceptions shipped; #316 retains human validation. `Message player` should deep-link to `/messages` per #77 |
| `/messages/moderation` | Moderator / league admin | Review and resolve reported messages | Canonical moderation surface; intentionally role-restricted and separate from #361 Admin Support |
| planned top-level Admin gateway | Signed-in player / league admin / moderator as authorized | Route users to the correct administration/support destination without overloading Profile | Missing runtime surface tracked by #366. Admins reach Operations, Players, Teams, League Management, Admin Support, Moderation; non-admins get contact-admin actions only |
| `/demo` | Public visitor / tester | **Test Drive the App** using fictional, non-authoritative data | Canonical public test-drive entry; canonical navigation/page identity is **Test Drive the App**. Contextual feedback remains #113/#172 |
| `/sandbox/captain` | Tester / sandbox user | Practice fictional team formation, roster churn, availability, and lineup work | Canonical captain practice drill; #263 |
| `/sandbox/player` | Tester / sandbox user | Practice fictional team-owned scoring, mismatch/reconciliation, confirmation, and finalization | Canonical player scoring drill; #326 owns convergence with the final live rack-ledger interaction model |
| `/health`, `/health/environment` | Internal / diagnostic | Verify Worker/environment readiness without exposing secrets | Explicit normal-navigation exception |

## Reconciled story/function mappings

| Audience | User outcome / capability | Canonical page | State | Story / proof | Discoverability notes |
| --- | --- | --- | --- | --- | --- |
| Public visitor / player / captain | Find tonight's round and matchup context | `/schedule` | Implemented | #133 | Direct desktop navigation; Tonight is in mobile dock |
| Player | Sign in, manage own profile/history, and personal identity | `/profile` | Implemented core; Fargo extension open | #8, #250, #365 | Profile is direct shared navigation; #365 adds self-entered Fargo ID plus sourced rating/robustness display |
| Player / captain | Find/create/join/manage team relationships and recruit | `/teams` | Implemented core; recruiting expansion open | #131, #181, #182, #330 | Teams is the normal roster/recruiting home; #330 adds sortable/filterable player/team/free-agent/date availability discovery |
| Player / captain / admin | Open a direct conversation with a relevant player/captain from context | `/messages` | Core messaging implemented; contextual entry cleanup open | #77 | Contextual `Message player` / `Message captain` buttons should open/start the existing direct-message conversation, not create another communication surface |
| Player / captain | Mark availability/check in for a calendar date | `/availability` | Existing round-based implementation; dated model open | #13, #138 | Teams -> Availability is <=2 actions. `Unsure` must be the default; current round-keyed API needs feature/data reconciliation |
| Captain | Find roster players/substitutes for a date and commit a lineup | `/lineup` with discovery support from `/teams` and `/availability` | Partial | #10, #13, #138, #330 | Discovery surfaces may filter/deep-link; final eligibility and lineup commitment stay authoritative here |
| Captain / league admin exception | Transfer the current captain role to another rostered player | Team management; planned Admin Teams fallback | Open | #182, #315, #366 | Team self-service is canonical. Admin only performs the same captain swap when normal captain self-service cannot be completed; no separate one-night captain role |
| Player / scorer | Pick an eligible match | `/scorecard` | Implemented | #141 | Score is a direct shared-nav destination |
| Player / team scorer | Choose discipline, compare rack submissions, edit own-team racks, reconcile, confirm, and finalize | `/scorecard/live` | Implementation substantially complete; final human/War Games QA open | #14, #73, #321-#326, #344; PRs #331/#333/#334/#355/#356/#357 | Reduced shell is intentional. Same-team collaborative writes are collision-safe; final physical/War Games proof stays #326 |
| Public visitor / player | View current standings | `/standings` | Implemented current season; history open | #16, #17, #180 | Desktop direct; mobile menu <=2 actions |
| Player / captain | Coordinate without sharing personal contact details | `/messages` | Implemented core | #76-#80 | Direct shared-nav destination; matchup-specific chat is deprecated under #78 |
| Signed-in player | Ask the league admin group a question/report an operational problem | Admin entry -> `/messages` | Missing/planned | #361, #366 | Planned top-level Admin entry provides Ask a question / Report a problem; conversation stays in Messages |
| League admin | Triage and respond to shared player support requests | Admin entry -> `/messages` | Missing/planned | #361, #366 | Separate from Operations and Moderation; normal unread/replied/handled state is shared across admins |
| Moderator / league admin | Resolve reported message content | `/messages/moderation` | Implemented | #80 | Remains separate from Admin Support; role restriction intentional |
| League admin / director | Configure/publish the selected season | `/season-setup` under planned Admin -> League Management | Implemented core; IA migration open | #12, #366 | Current Profile link keeps <=2 reachability until Admin gateway ships |
| League admin / director | Add eligible existing/new/returning teams to the selected season | `/admin/season-teams` under planned Admin -> League Management | Implemented first slice | #336, PR #345, #366 | Current Profile -> Season teams is <=2 actions; migrate discovery only after #366 preserves reachability |
| League admin / director | See readiness/operational exceptions | `/admin/operations` | Partial but shipped | #168, #169 | Current Profile -> Operations <=2 actions; future Admin gateway owns discovery. Operations links to owning workflows and does not absorb support/moderation |
| League admin / director | Find players and make privileged player-level changes | `/admin/players` | Implemented current slices; human validation remains | #316, PRs #320/#327/#329 | Current Profile -> Players <=2 actions; future Admin gateway owns discovery. Normal recruiting remains `/teams`/#330 |
| League admin / director | Navigate administration by purpose | planned top-level Admin gateway | Missing/planned | #366 | Must preserve <=2 action reachability before Profile admin links are retired |
| Player | Enter own Fargo ID and view official Fargo rating/robustness | `/profile` | Missing/planned | #365; data model foundations #89/#90 | Self-service identity belongs on Profile; verification/admin evidence review remains separate |
| Public visitor / player | View purse/payout transparency | `/prizes` | Existing mixed surface; read-only split open | #18 | Public page remains discoverable; privileged configuration moves to Admin -> League Management |
| Player / captain | Use formal trade proposals | none | Obsolete / removal pending | #362; former #11 | Do not create new navigation or APIs. Supported roster movement is application/invitation/captain/admin membership workflows |
| Public visitor / tester | Learn product through safe fictional data | `/demo` | Core test drive implemented; feedback remains | #113, #249 | Shared navigation and page identity use **Test Drive the App** |
| Tester / captain | Practice team formation and lineup work | `/sandbox/captain` | Implemented | #263 | One action from `/demo`; explicit fictional exception |
| Tester / player | Practice dual scoring | `/sandbox/player` | Implemented core; final rack-ledger parity proof open | #113, #326 | One action from `/demo`; competitive data remains isolated |

## Canonical API/page ownership highlights

The complete endpoint inventory lives in `docs/page-api-user-story-audit.md`; #363 owns making that reference exhaustive and agent-friendly. Important boundaries for IA reviews:

- `/api/me/profile` -> `/profile`; future Fargo self-service from #365 must stay within Profile/external-identity ownership rather than creating another rating page.
- Team applications, membership requests, invitations, free-agent participation, and normal roster relationships -> `/teams`.
- Availability APIs currently use `roundId`, but #138 requires the product model to become calendar-date based -> `/availability` with `/lineup` as consumer.
- Team lineup read/commit -> `/lineup`.
- `GET /api/me/scorable-matches` -> `/scorecard`.
- `score-comparison`, `score-racks`, `score-racks/undo`, `score-confirm`, `finalize-reconciled` -> `/scorecard/live`; older single-score API routes are compatibility/retirement audit candidates rather than a second live UI.
- Direct/team/league chat/thread/report APIs -> `/messages`; report-resolution APIs -> `/messages/moderation`; matchup-chat routes are legacy/deprecation candidates under #78; Admin Support APIs are planned under #361.
- Season setup/registration configuration/publishing -> `/season-setup` today, grouped under planned Admin -> League Management by #366.
- `team-candidates` + `teams/:teamId/add` -> `/admin/season-teams`, grouped under planned Admin -> League Management by #366.
- Operational overview -> `/admin/operations`.
- Admin player list/role/eligibility/roster exceptions -> `/admin/players`; normal recruiting must not use this API/surface.
- Trade routes, where still present in runtime, are legacy and pending removal/deprecation under #362.
- Prize-configuration APIs must migrate to Admin -> League Management under #18; `/prizes` remains the public read surface.

## Current librarian findings

### 2026-08-11 / 2026-08-12 UTC reconciliation

- **New product-owner decisions are now durable GitHub stories:** #365 owns player-entered Fargo ID plus official rating/robustness display; #366 owns the first-class Admin gateway and retirement of Profile as the canonical admin menu. Existing #182 and #77 were updated with captain-swap and contextual messaging decisions.
- **Operations, Admin Support, and Moderation are deliberately separate:** `/admin/operations` stays exception/readiness triage; #361 uses Messages for shared admin-group support conversations; `/messages/moderation` stays enforcement around reported content.
- **Admin ownership is converging:** #366 groups Players, Teams, League Management, Operations, Admin Support, and Moderation under one top-level gateway. Current Profile admin links remain only as a reachability bridge until the gateway is implemented and tested.
- **Captain authority is simpler than a one-night delegate model:** #182 now records team self-service captain transfer with admin fallback when normal self-service is unavailable. The newly assigned captain is fully captain; no match-only captain role is needed.
- **Contextual messaging does not create another chat product:** #77 now explicitly owns `Message player` / `Message captain` deep-links into `/messages`.
- **Fargo identity ownership is explicit:** #365 puts player-supplied Fargo ID on `/profile`, while official rating/robustness remains sourced/provenanced through #89/#90/#92. Robustness is informational unless a separate league rule says otherwise.
- **Trades are obsolete product surface:** #362 owns removal of `/trades`, trade controls, and normal-user trade APIs while preserving historical audit data. Current runtime still contains legacy trade and matchup-chat routes, so #363 must classify them deprecated rather than current product APIs.
- **Prize page overload now has a decided destination:** #18 makes `/prizes` public/read-only and moves privileged payout configuration to Admin -> League Management; do not split into a second standalone admin-prizes page.
- **Comprehensive audit is durable:** PR #358 added `docs/page-api-user-story-audit.md`; #363 now owns converting that inventory into an exhaustive, fast API reference with lifecycle/auth/request/response ownership.
- **Season-team assignment is reconciled:** PR #345 shipped `/admin/season-teams`; PR #359 folded it into canonical docs and repaired the <=2-action bridge. Future discovery migration belongs to #366 rather than another one-off Profile link.
- **Rack-ledger implementation issues are reconciled:** #323 and #344 are closed; #326 remains the correct owner for physical two-human phone and War Games parity proof.
- **Availability remains a major product/API semantic mismatch:** current endpoints are round-keyed, while #138 requires a calendar-date Available/Unavailable/Unsure model with Unsure by default. The feature/data lane must reconcile the source of truth rather than layering another availability model.
- **No newly discovered untracked normal route is being silently accepted.** `/trades` and matchup-chat APIs are explicitly legacy cleanup work; diagnostic and sandbox routes remain intentional exceptions.

## Known catalog work

- #237 — Product Librarian contract. Completed by PR #242.
- #238 — exhaustive user-story/page/function/control inventory and ongoing catalog maintenance. PR #358 materially advances the audit but renderer/control exhaustiveness remains the closure criterion.
- #239 — deterministic <=2-action role-aware navigation/reachability audit and regression coverage. The future Admin-gateway migration must preserve this rule before Profile admin links can be retired.
- #240 — recurring Product Librarian cadence. Completed; subsequent cycles leave evidence in #238/#239 and this catalog.
- #249 — Test Drive the App contextual feedback closure work; canonical naming is reconciled.
- #169 — remaining `/admin/operations` signals.
- #316 — `/admin/players` human/mobile validation story; implementation slices are shipped.
- #321/#326 — rack-ledger parent/final QA. #323/#324/#325/#344 implementation work is reconciled; #326 owns remaining War Games and physical phone proof.
- #330 — normal player/captain sortable player directory for recruiting and dated substitute discovery under `/teams`.
- #138 — dated availability/check-in and fast captain substitute discovery; existing round-level persistence/API assumptions must be reconciled by the owning feature/data lane.
- #340/#341/#342/#335 — preseason identity, manual player/team creation, identity claiming, and captain contact stories.
- #343 — player season application/payment visibility on Profile.
- #361 — shared Admin Support channel via Messages.
- #362 — remove legacy formal Trades surface/APIs while preserving history.
- #363 — exhaustive agent-friendly API reference and lifecycle classification.
- #365 — player-entered Fargo ID plus rating/robustness display on Profile.
- #366 — top-level Admin gateway and removal of Profile as canonical admin navigation after reachability is preserved.
- #18 — split public prize transparency from Admin -> League Management configuration.
- #182 — captain lifecycle/self-service transfer with admin fallback.

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

The catalog should describe current product reality and approved ownership transitions clearly. Missing capabilities belong in linked issues with explicit state; legacy runtime must not be mistaken for supported product direction.

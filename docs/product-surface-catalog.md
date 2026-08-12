# Fremont Derby Product Surface Catalog

This document is the canonical index connecting **audiences -> user stories -> functions -> pages/routes**. GitHub issues remain the durable source for detailed requirements and acceptance criteria; this catalog records current product ownership, implementation state, and discoverability.

The Product Librarian / Information Architecture agent owns continuous reconciliation of this file. See `.github/agents/product-librarian.agent.md`. Issue #238 owns the exhaustive control-by-control inventory; `docs/page-api-user-story-audit.md` is the deeper page/API/story reference.

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

These product decisions are canonical even when runtime still contains legacy or transitional surfaces:

- **#370 Schedule + availability** — `/schedule` is the canonical date/schedule plus personal dated Available / Unsure / Unavailable surface after PR #376. PR #389 moved captain lineup/substitute discovery to the same date-keyed source. `/availability` remains transitional only until final parity/recovery proof and retirement; normal Teams recruiting filters still converge under #330.
- **#371 Score + Play Tonight** — `/scorecard` becomes the current-date-default league-night hub with alternate date/team/matchup/race selection; `/scorecard/live` remains the focused live-scoring child.
- **#366 Admin gateway** — `/admin` exists as a role-aware partial gateway after PR #369. It remains partial until shared navigation exposes Admin, Admin Teams/#372 and Admin Support/#361 are present, broader League Management ownership is consolidated, and Profile fallback links can retire without a <=2-action regression.
- **#341 prepared-player self-claim** — PR #391 shipped `Claim existing player` on `/profile` for signed-in users without an owned player identity. Only unclaimed zero-competitive-rack identities are eligible; admin creation remains `/admin/players`. Exact deployed-Worker real-account/phone proof remains open on #341.
- **#362 Trades retirement** — formal trades are no longer a supported product workflow. Applications, invitations, captain roster management, and admin exceptions replace them; historical trade/audit records may remain.
- **#18 Prize split** — `/prizes` is public/read-only transparency; privileged payout configuration belongs in Admin -> League Management.
- **#365 Fargo profile identity** — `/profile` owns player-entered Fargo ID and display of sourced official Fargo rating + robustness. Player-entered identity remains distinguishable from verified Fargo identity.
- **#361 Admin Support** — player questions/operational reports are shared admin-group conversations using Messages and are distinct from `/messages/moderation`.
- **#182 Captain lifecycle** — teams self-manage the current captain; admin performs the same captain swap only as an exception. There is no reduced one-night captain role.
- **#373 Contextual messaging** — `Message player` and `Message captain` are links into canonical direct Messages, not new chat types.
- **#387 Test Drive component parity** — Test Drive / War Games is a QA harness around production components rather than a parallel implementation. PR #386 made Player War Games and `/scorecard/live` share the exact rack-ledger component/controller with isolated adapters; captain lineup parity remains #388.

## Current top-level page registry

| Route / surface | Audience/group | Distinct primary purpose | Current ownership / status |
| --- | --- | --- | --- |
| `/` | Public visitor | Understand Fremont Derby and choose the next appropriate league action | Canonical introduction. PR #379 / #377 shipped the concise cash-league-first intro and Join / sign in action; current-season practical details remain #252 |
| `/rules` | Public visitor / player | Read authoritative user-facing league rules | Canonical rules surface |
| `/profile` | Player | Sign in and manage own identity, current-season participation/payment, memberships, and personal status | Canonical identity/profile surface. PR #391/#341 ships Claim existing player for signed-in users without an owned player, preserving prepared team/season/rating state when the record has zero competitive racks. PR #385/#343 shipped Join this season plus Registered / Payment due / Paid / Waived state. Current admin links are a temporary reachability bridge. Fargo self-service is #365. PR #380/#378 makes the existing Supabase login survive normal browser restarts while the underlying refresh session remains valid |
| `/teams` | Player / captain | Find, join, create, manage, and recruit around teams and roster relationships | Canonical normal team/roster surface. Sort/filter/sub discovery remains #330 |
| `/schedule` | Public visitor / player / captain | See league dates/matchups and mark personal dated availability | PR #376 shipped the three-state date-keyed check-in; PR #389 made captain lineup/sub discovery consume the same dated source. Remaining convergence work is Teams recruiting filters plus retirement of `/availability` under #370/#330 |
| `/availability` | Player / captain | Transitional standalone availability editor | Duplicate transitional runtime surface; do not extend. Retire after #370 parity/recovery proof |
| `/lineup` | Captain | Build and commit the team's blind lineup | Current authoritative lineup surface; #371 will pull minimum pre-score planning into Score without changing lineup rules; #388 owns Test Drive reuse of the production lineup component |
| `/scorecard` | Player / captain / team scorer | Select current or other authorized league-night work and enter scoring | Current eligible-match picker; expansion to flexible league-night hub is #371 |
| `/scorecard/live` | Player / team scorer | Operate active team-owned rack-ledger scoring | Canonical live-scoring surface; PR #386 shares this exact component/controller with Player War Games; #326 owns remaining physical/two-human proof |
| `/messages` | Player / captain / admin support participant | Coordinate league/team/direct communication and planned shared admin-support conversations | Canonical communication surface. Matchup-specific chat is deprecated under #78 |
| `/standings` | Public visitor / player | View team and individual standings and season results | Canonical standings surface; historical selection remains #180 |
| `/trades` | Legacy only | Legacy formal trade workflow | Deprecated pending removal under #362; do not extend |
| `/prizes` | Public visitor / player | View purse and payout transparency | Canonical public/read-only prize surface by #18; privileged controls are migration debt |
| `/admin` | Signed-in player / league admin | Route the signed-in user to appropriate league administration/help destinations | Partial/shipped in PR #369. Shared-nav discovery, Admin Teams and Admin Support remain open under #366/#372/#361 |
| `/season-setup` | League admin / director | Configure, publish, and manage the selected season lifecycle | Current season-management surface; groups under Admin -> League Management |
| `/admin/season-teams` | League admin / director | Populate the selected season from eligible Returning / New / In season teams | Shipped in PR #345/#336; League Management child workflow |
| `/admin/operations` | League admin / director | See readiness, exceptions, prioritized actions, and operational health | Canonical admin operations/triage; #169 remains open for remaining signals |
| `/admin/players` | League admin / director | Find a player and manage privileged player-level league administration | Canonical player-administration surface. Roles, eligibility, roster exceptions, and Create player / Unclaimed are shipped; self-claim of prepared identities belongs on Profile. Human/live proof remains #316/#340 |
| `/messages/moderation` | Moderator / league admin | Review and resolve reported messages | Canonical moderation surface; separate from Admin Support |
| planned Admin Teams | League admin / director | Manage one team and team-level exceptions | Missing runtime surface tracked by #372; normal recruiting remains `/teams` |
| `/demo` | Public visitor / tester | **Test Drive the App** using fictional, non-authoritative data | Canonical public test-drive entry; simulated production actions should use shared production components under #387 |
| `/sandbox/captain` | Tester / sandbox user | Practice fictional team formation, roster churn, availability, and lineup work | Child drill of Test Drive; production lineup-component parity is #388 |
| `/sandbox/player` | Tester / sandbox user | Practice fictional team-owned scoring and reconciliation | Child drill of Test Drive; PR #386 now uses the same rack-ledger component/controller as `/scorecard/live` through an isolated sandbox adapter |
| `/health`, `/health/environment` | Internal / diagnostic | Verify Worker/environment readiness without exposing secrets | Explicit normal-navigation exception |

## Reconciled story/function mappings

| Audience | User outcome / capability | Canonical page | State | Story / proof | Discoverability notes |
| --- | --- | --- | --- | --- | --- |
| Public visitor | Understand the cash league quickly and choose Join / sign in, Test Drive, or Rules | `/` | Implemented | #377, PR #379 | Home is the root destination; no secondary onboarding page is required for this concise intro |
| Public visitor / player / captain | See league dates and matchup context | `/schedule` | Implemented core | #133, #370 | Direct desktop nav and mobile quick navigation |
| Player / free agent | Mark Available / Unsure / Unavailable for a calendar date | `/schedule` | Implemented core; duplicate cleanup open | #138, #370, PR #376 | Direct Schedule control. `/availability` remains temporary only until final retirement proof |
| Player | Sign in/manage own profile and identity | `/profile` | Implemented core | #8, #250 | Direct shared navigation |
| Player | Register for the current season and see own registration/payment state | `/profile` | Implemented source; live phone proof open | #343, PR #385 | Direct Profile card; Join this season and status are reachable in one normal navigation action |
| Player | Stay signed in across ordinary browser restarts while the Supabase refresh session remains valid | `/profile` for sign-in/sign-out/recovery; shared auth bootstrap applies across HTML pages | Implemented | #378, PR #380 | No extra navigation required after first sign-in; explicit sign-out remains on Profile and invalid/revoked refresh sessions still fail normally |
| Signed-in user with no owned player | Claim an eligible admin-created zero-rack identity | `/profile` | Implemented source/database; deployed-Worker real-account + phone proof open | #341, PR #391; creation foundation #340/PR #368 | Claim is a secondary identity/onboarding function on Profile and is reachable in one normal navigation action; do not move it into Admin Players |
| League admin | Create an unclaimed player before signup | `/admin/players` | Source/database shipped; live proof pending | #340, PR #368 | Canonical admin player surface |
| Player / captain | Find/create/join/manage team relationships and recruit | `/teams` | Implemented core; recruiting expansion open | #131, #181, #182, #330 | Teams remains normal roster/recruiting home |
| Player / captain / admin | Open direct conversation from a player/captain context | `/messages` | Core messaging implemented; contextual entry open | #373 | Deep-link/reuse canonical direct conversation; do not create page-specific chat |
| Captain | Find available eligible subs and commit a blind three for the selected matchup | `/lineup` authoritative today; `/scorecard` target match-night hub consumes the same dated source | Dated source shipped; Score consolidation partial/planned | #13, #138, #330, #371, PR #389 | Availability source is now canonical Schedule date state; recruiting stays Teams; Score consolidation remains #371 |
| Captain / league admin exception | Transfer current captain role | Team management; Admin Teams fallback | Open | #182, #372 | No separate one-night captain role |
| Player / scorer | Select current or another authorized date/team/matchup/race | `/scorecard` | Current picker implemented; flexible selector open | #141, #371 | Direct shared-nav Score destination |
| Player / team scorer | Score/reconcile/confirm/finalize | `/scorecard/live` | Substantially complete; physical QA open | #14, #73, #321-#326, #344, PR #386 | Intentional focus shell; back-to-Score must remain obvious; Test Drive uses the same component/controller |
| Public visitor / player | View standings | `/standings` | Implemented current season | #16, #17, #180 | Desktop direct; mobile menu <=2 actions |
| Player / captain | Coordinate without sharing contact details | `/messages` | Implemented core | #76-#80 | Direct shared navigation; matchup chat deprecated |
| Signed-in player | Ask the league admin group for help | `/admin` entry -> `/messages` conversation | Entry shell partially shipped; group conversation missing | #361, #366, PR #369 | `/admin` gives non-admin safe help/recovery but not final support workflow |
| League admin | Navigate administration by purpose | `/admin` | Partial/shipped | #366, PR #369 | Gateway exists but is not yet in shared app navigation, so Profile bridge remains necessary |
| League admin | Triage readiness/exceptions | `/admin/operations` | Partial but shipped | #168, #169 | Reachable from `/admin`; Profile fallback still preserves <=2 actions |
| League admin | Find/administer players | `/admin/players` | Implemented current slices | #316, #340; PRs #320/#327/#329/#368 | Reachable from `/admin`; normal recruiting remains `/teams` |
| League admin | Manage one team / team-level exceptions | planned Admin Teams | Missing | #372 | Must appear under `/admin`; season assignment/config stays League Management |
| League admin | Configure/publish season and season-team assignment | `/season-setup` + `/admin/season-teams` under Admin -> League Management | Implemented core; consolidation open | #12, #336, #366 | Gateway links League Management to `/season-setup`; broader ownership remains #315/#18 |
| Moderator / league admin | Resolve reported message content | `/messages/moderation` | Implemented | #80 | Separate from Admin Support |
| Player | Enter Fargo ID/view official rating+robustness | `/profile` | Missing/planned | #365, #89/#90 | Verification/admin evidence review remains separate |
| Public visitor / player | View prize/payout transparency | `/prizes` | Existing mixed surface; read-only split open | #18 | Admin configuration migrates to League Management |
| Player / captain | Use formal trades | none | Obsolete/removal pending | #362; former #11 | Supported roster movement is application/invitation/captain/admin membership workflows |
| Public visitor / tester | Learn the app safely using production-equivalent interactions | `/demo` + Test Drive child drills | Scoring parity implemented; captain parity open | #387, #388, PR #386 | Canonical identity remains Test Drive the App; simulated production actions should not fork production UI/controller logic |

## Canonical API/page ownership highlights

The complete endpoint inventory lives in `docs/page-api-user-story-audit.md`; #363 owns making that reference exhaustive and agent-friendly.

- Profile/account/Fargo self-service -> `/profile`.
- Own current-season registration/payment read and registration action -> `/profile` via `GET|POST /api/seasons/:season/registration/me` from PR #385/#343; no second team-registration surface should become authoritative.
- Prepared-player self-claim -> `/profile` via `GET /api/me/player-claim-options` and `POST /api/me/player-claim` from PR #391/#341. `/admin/players` owns creating the Unclaimed record; self-claim must not become a privileged admin-only workflow or a second onboarding page.
- Browser auth persistence from #378/PR #380 is cross-cutting shell behavior, but Profile remains the canonical sign-in/sign-out/recovery page. The persistence layer must never become a second login page or weaken server authorization.
- Admin unclaimed-player creation and privileged player mutations -> `/admin/players`; normal player discovery/recruiting must not move there.
- Team applications, membership requests, invitations, free-agent participation, and normal roster relationships -> `/teams`.
- Date-keyed personal availability belongs to `/schedule` after PR #376. PR #389 makes captain lineup/substitute discovery read that same date-keyed state while preserving temporary legacy compatibility; remaining Teams recruiting filters are #330 and standalone `/availability` retirement is #370.
- Team lineup read/commit stays authoritative in the lineup domain even as #371 consolidates match-night entry into Score.
- Scorable match selection/current-date league-night navigation -> `/scorecard`; live score comparison/rack/edit/confirm/finalize -> `/scorecard/live`.
- `/scorecard/live` and `/sandbox/player` share the production rack-ledger component/controller after PR #386; production and fictional adapters remain separate so Test Drive cannot mutate league records.
- Direct/team/league chat -> `/messages`; report resolution -> `/messages/moderation`; matchup-chat routes are legacy/deprecation candidates under #78; Admin Support APIs are planned under #361.
- Admin access gateway -> `/admin`; PR #369 currently probes `/api/admin/players` to resolve role presentation but does not change server authorization boundaries.
- Season setup/registration/publishing -> `/season-setup` today, grouped under Admin -> League Management; season-team assignment -> `/admin/season-teams`.
- Operations overview -> `/admin/operations`.
- Trade routes, where still present, are legacy pending #362.
- Prize configuration must migrate to Admin -> League Management under #18; `/prizes` remains public read surface.

## Current librarian findings

### 2026-08-11 / 2026-08-12 UTC reconciliation

- **PR #391 advanced #341:** Profile now owns the shipped `Claim existing player` flow for a signed-in user without an owned player identity. Search and mutation are limited to unclaimed identities with zero competitive racks and preserve prepared team/season/rating state. The function is directly discoverable through Profile and does not overload the page because it directly supports the page's identity/onboarding purpose. Exact deployed-Worker real-account + phone proof remains open on #341.
- **PR #392 captured a durable identity-integrity rule:** zero-rack eligibility must reconcile both legacy `public.player_match_racks` and current dual-score rack JSON; finalized-match or match-count shortcuts are not equivalent. This is implementation integrity rather than a new user-facing surface.
- **PR #385 advanced #343:** Profile now owns a compact current-season card with Join this season and explicit Registered / Payment due / Paid / Waived state. This reinforces Profile's `me / identity / participation status` purpose rather than creating a separate registration page. Human production-phone proof remains on #343/#280.
- **PR #386 completed scoring component parity for Test Drive:** `/scorecard/live` and `/sandbox/player` now share the exact rack-ledger component/controller with only the adapter swapped. Test Drive remains a child QA/practice surface rather than a second scoring product. The remaining captain/lineup parity is already tracked by #387/#388.
- **PR #389 advanced #370/#138/#330:** captain lineup/substitute discovery now consumes `player_date_availability` for the selected scheduled date, including available teamless/free-agent players, while temporary legacy compatibility remains behind the same HTTP/RPC shape. The remaining duplicate is standalone `/availability`, plus normal Teams recruiting filters under #330.
- **PR #376 established Schedule ownership:** `/schedule` contains the personal date-keyed Available / Unsure / Unavailable control for registered players, including teamless/free-agent players.
- **PR #379 completed the concise homepage story #377:** Home owns the quick cash-league introduction and primary Join / sign in action; deeper current-season onboarding remains #252.
- **PR #380 completed #378:** Supabase session persistence survives normal browser restarts through a shared HTML auth bootstrap while Profile remains the canonical sign-in/sign-out/recovery page.
- **Navigation label mismatch remains:** the approved mobile target in #239 is `Teams | Schedule | Score | Messages | Profile`, while `src/appShell.js` still labels the Schedule dock item `Tonight`. Because Play Tonight is owned conceptually by Score/#371, the `Tonight` label remains stale and is already tracked by #239; no duplicate issue was created.
- **Admin remains a tracked reachability transition:** `/admin` exists, but shared navigation still has no Admin item/active section. Authorized admins remain within <=2 actions only through temporary Profile links; #366 remains the correct owner.
- **Two-click result for affected stories:** Profile self-claim and season registration/payment are both one action from the shared shell; Schedule is direct navigation; Score is direct navigation; Player War Games is an explicit Test Drive child/QA exception. No new normal authorized dead end was introduced by PRs #385/#386/#389/#391.
- **Backlog reconciliation:** #315 was updated after PR #391 because it still listed #340/#341 as wholly unshipped. It now distinguishes shipped source/database identity preparation/claim work from the remaining exact deployed-Worker proof.

## Known catalog work

- #238 — exhaustive user-story/page/function/control inventory and ongoing catalog maintenance.
- #239 — deterministic <=2-action role-aware navigation/reachability audit and regression coverage; also owns the stale `Tonight` -> `Schedule` mobile-label reconciliation.
- #370 — retire the duplicate `/availability` editor after final parity/recovery proof; captain lineup/sub discovery already uses the dated source after PR #389.
- #330 — finish normal Teams player-directory/recruiting filters using the same dated availability source.
- #371 — make Score the current-date-default flexible league-night hub.
- #366 — finish first-class Admin gateway/shared-nav discovery and retire Profile fallback only after proof.
- #372 — focused Admin Teams management.
- #373 — contextual Message player/captain deep-links.
- #343 — source implementation is merged; remaining work is real-player production-phone proof behind #280.
- #387/#388 — continue Test Drive production-component parity; scoring is complete, captain lineup remains.
- #340/#341 — source/database implementations are shipped; exact deployed-Worker/live proof remains blocked by release traceability. #342/#335 still own manual team creation and captain contact.
- #361 — shared Admin Support channel via Messages.
- #362 — remove legacy Trades UI/APIs while preserving history.
- #363 — exhaustive agent-friendly API reference and lifecycle classification.
- #18 — split public prize transparency from Admin -> League Management configuration.
- #169 — remaining `/admin/operations` signals.
- #316 — `/admin/players` human/mobile validation.
- #326 — remaining physical/two-human rack-ledger proof.
- #374 — approved execution roadmap; #247 remains the release gate.

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

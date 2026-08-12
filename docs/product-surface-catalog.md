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
- **Captain** — manages roster relationships, team-entry readiness, availability/substitutes, lineups, and captain decisions.
- **League admin / director** — configures seasons, resolves exceptions, reviews operational health, and administers league-only functions.
- **Moderator** — reviews reported messages where that responsibility is separated from broader admin work.
- **Tester / sandbox user** — learns and validates fictional, non-authoritative workflows through **Test Drive the App** and its practice drills.
- **Internal / diagnostic** — health and environment proof; outside normal product navigation.

## Approved ownership transitions

These product decisions are canonical even when runtime still contains legacy or transitional surfaces:

- **#370 Schedule + availability** — `/schedule` is the canonical date/schedule plus personal dated Available / Unsure / Unavailable surface. `/availability` is transitional only; normal Teams recruiting filters converge under #330.
- **#371 Score + Play Tonight** — `/scorecard` is the canonical current-date-default league-night hub. PRs #422/#424 ship human-readable date, scoring-team, team-matchup, and revealed-race selection using only the server-authorized scorable-match read model; `/scorecard/live` remains the focused live-scoring child. Remaining work is captain pre-score availability/sub/lineup preparation, actual-play-date semantics, and final phone/browser validation.
- **#366 Admin gateway** — `/admin` is the role-aware administration/help gateway. Shared discovery is canonical in `src/appShell.js` after #399/#403. Admin Teams/#372, Admin Support/#361, and remaining League Management consolidation are still open.
- **#337 Close season / #338 readiness** — PR #412 makes `/season-setup` the canonical operator surface for explicit audited **Close season** after competitive completion, while PRs #417/#419 complete the authoritative Close and Publish readiness checklists on that same lifecycle surface. Cancel/Archive/safe-delete are separate lifecycle work under #414.
- **#342 prepared-team administration** — PRs #398/#404/#405 completed prepared-team creation, optional captain assignment, and explicit Add players continuation on `/admin/season-teams`. This story is closed; do not recreate those workflows elsewhere.
- **#406 team-slot governance** — team entry has four plain-language states: **Forming, Qualified, Accepted, Waitlisted**. PR #411/#407 enforces captain + 3 active rostered players before a new/current-season team can take a slot. Returning reservation/release is #408, persistent waitlist ordering/promotion is #409, and participant-facing status plus 4-player opening-night depth is #410.
- **#341 prepared-player self-claim** — `/profile` owns `Claim existing player`; `/admin/players` owns creation of the prepared Unclaimed identity.
- **#335 private captain contact** — `/profile` owns the player's private phone editor. PR #404 adds contact-aware captain assignment and season-activation enforcement. Broad admin lists expose readiness only; authorized full-number detail and missing-contact recovery remain open.
- **#362 Trades retirement** — formal trades are no longer a supported product workflow. Applications, invitations, captain roster management, and admin exceptions replace them.
- **#18 Prize split** — `/prizes` is public/read-only transparency; privileged payout configuration belongs in Admin -> League Management.
- **#365 Fargo profile identity** — `/profile` owns player-entered Fargo ID and display of sourced official Fargo rating + robustness.
- **#361 Admin Support** — player questions/operational reports are shared admin-group conversations using Messages and are distinct from `/messages/moderation`.
- **#182 Captain lifecycle** — teams self-manage the current captain; admin performs the same captain swap only as an exception. There is no reduced one-night captain role.
- **#373 Contextual messaging** — `Message player` and `Message captain` are links into canonical direct Messages, not new chat types.
- **#387 Test Drive component parity** — Test Drive / War Games is a QA harness around production components rather than a parallel implementation.

## Current top-level page registry

| Route / surface | Audience/group | Distinct primary purpose | Current ownership / status |
| --- | --- | --- | --- |
| `/` | Public visitor | Understand Fremont Derby and choose the next appropriate league action | Canonical introduction; current-season practical details remain #252 |
| `/rules` | Public visitor / player | Read authoritative user-facing league rules | Canonical rules surface |
| `/profile` | Player | Sign in and manage own identity, current-season participation/payment, memberships, private contact details, and personal status | Canonical identity/profile surface. Own phone #335, self-claim #341, registration/payment #343, Fargo #365, session persistence #378 |
| `/teams` | Player / captain | Find, join, create, manage, recruit, and understand own team relationship | Canonical normal team/roster surface. Participant-facing entry state/depth belongs here under #410; recruiting expansion remains #330 |
| `/schedule` | Public visitor / player / captain | See league dates/matchups and mark personal dated availability | Canonical schedule/availability surface after #376/#389; PR #415 only compacts the existing three-state phone control and does not change ownership |
| `/availability` | Player / captain | Transitional standalone availability editor | Duplicate transitional runtime surface; retire under #370 |
| `/lineup` | Captain | Build and commit the team's blind lineup | Current authoritative lineup surface; #371 will pull minimum pre-score planning into Score; Test Drive parity is #388. PR #420 only enlarges the existing lineup -> Score handoff touch target and does not change ownership |
| `/scorecard` | Player / captain / team scorer | Select authorized league-night context and enter the selected revealed race into scoring | Canonical flexible Score hub. PRs #422/#424 ship local-Today default plus date/team/matchup/revealed-race selectors; remaining #371 work is pre-score captain preparation, actual-play-date semantics, and final phone/browser validation |
| `/scorecard/live` | Player / team scorer | Operate active team-owned rack-ledger scoring | Canonical live-scoring surface; physical/two-human proof remains #326 |
| `/messages` | Player / captain / admin support participant | Coordinate league/team/direct communication and planned shared admin-support conversations | Canonical communication surface; matchup chat deprecated under #78 |
| `/standings` | Public visitor / player | View team and individual standings and season results | Canonical standings surface; historical selection remains #180 |
| `/trades` | Legacy only | Legacy formal trade workflow | Deprecated pending removal under #362 |
| `/prizes` | Public visitor / player | View purse and payout transparency | Canonical public/read-only prize surface; privileged controls migrate under #18 |
| `/admin` | Signed-in player / league admin | Route the signed-in user to appropriate league administration/help destinations | Partial gateway; Admin Teams/Admin Support remain #372/#361 |
| `/season-setup` | League admin / director | Configure, publish, close, and manage the selected season lifecycle | Canonical lifecycle surface under Admin -> League Management. PR #412 adds explicit audited Close season; PRs #417/#419 complete authoritative Close/Publish readiness; #414 owns Cancel/Archive/safe-delete distinctions |
| `/admin/season-teams` | League admin / director | Prepare candidate/returning teams and control selected-season slot entry | Canonical season-team preparation surface. PRs #398/#404/#405 cover creation/captain/roster continuation; PR #411 adds Forming/Qualified/Accepted/Waitlisted admin state and qualification enforcement |
| `/admin/operations` | League admin / director | See readiness, exceptions, prioritized actions, and operational health | Canonical operations/triage; #410 will add accepted-team 4-player depth summary; #169 owns other remaining signals |
| `/admin/players` | League admin / director | Find a player and manage privileged player-level league administration | Canonical player-admin and roster-exception surface; Add players from `/admin/season-teams` deep-links here |
| `/messages/moderation` | Moderator / league admin | Review and resolve reported messages | Canonical moderation surface; separate from Admin Support |
| planned Admin Teams | League admin / director | Manage one team and team-level operational exceptions | Missing runtime surface tracked by #372; must not duplicate season preparation on `/admin/season-teams` |
| `/demo` | Public visitor / tester | **Test Drive the App** using fictional, non-authoritative data | Canonical public test-drive entry |
| `/sandbox/captain` | Tester / sandbox user | Practice fictional team formation, roster churn, availability, and lineup work | Test Drive child; lineup-component parity is #388 |
| `/sandbox/player` | Tester / sandbox user | Practice fictional team-owned scoring and reconciliation | Test Drive child sharing production scoring component/controller after #386 |
| `/health`, `/health/environment` | Internal / diagnostic | Verify Worker/environment readiness without exposing secrets | Explicit navigation exception |

## Reconciled story/function mappings

| Audience | User outcome / capability | Canonical page | State | Story / proof | Discoverability notes |
| --- | --- | --- | --- | --- | --- |
| Public visitor | Understand the cash league quickly and choose Join / sign in, Test Drive, or Rules | `/` | Implemented | #377, PR #379 | Root destination |
| Public visitor / player / captain | See league dates and matchup context | `/schedule` | Implemented core | #133, #370 | Direct desktop nav/mobile quick nav |
| Player / free agent | Mark Available / Unsure / Unavailable for a calendar date | `/schedule` | Implemented; duplicate cleanup open | #138, #370, PRs #376/#415 | Direct Schedule control; `/availability` remains temporary; #415 is presentation-only |
| Player | Sign in/manage own profile and identity | `/profile` | Implemented core | #8, #250 | Direct shared navigation |
| Player / captain | Maintain own private league contact phone | `/profile` | Implemented self-service; admin detail/recovery open | #335, PRs #401/#404 | One navigation action; broad team/player surfaces must not expose phone value |
| Player | Register for current season and see own registration/payment state | `/profile` | Implemented source; live proof open | #343, PR #385 | One navigation action |
| Player | Stay signed in across ordinary browser restarts | `/profile` for sign-in/sign-out/recovery | Implemented | #378, PR #380 | No extra navigation after first sign-in |
| Signed-in user without owned player | Claim eligible prepared zero-rack identity | `/profile` | Implemented source/database; deployed proof open | #341, PR #391 | One navigation action |
| League admin | Create an unclaimed player before signup | `/admin/players` | Source/database shipped; live proof pending | #340, PR #368 | Reachable from Admin |
| League admin | Deliberately close a competitively complete season while preserving league history | `/season-setup` | Implemented core | #337, PR #412 | Admin -> League Management reaches the lifecycle surface in <=2 deliberate actions; Close season is in-context and does not require an internal status value |
| League admin | Cancel, archive, or safely delete only an empty throwaway season with distinct semantics | `/season-setup` | Missing/planned | #414 | Same lifecycle surface; must remain distinct from successful Close season |
| League admin | See authoritative Publish/Close readiness beside lifecycle actions | `/season-setup` | Implemented | #338, PRs #417/#419 | Same lifecycle surface; direct canonical recovery links; no second readiness page needed |
| League admin | Create a prepared team, assign captain, and continue to roster setup | `/admin/season-teams` | Implemented | #342, PRs #398/#404/#405 | Admin -> League Management; Add players deep-links to `/admin/players` rather than duplicating roster mutation |
| League admin | See whether a new/current-season team may take a season slot | `/admin/season-teams` | Implemented first slice | #406/#407, PR #411 | Forming/Qualified/Accepted/Waitlisted are visible with direct Assign captain/Add players recovery; <=2 from Admin |
| Returning captain/team | Reserve, release, or hand off prior team slot during first-refusal window | `/teams` participant entry + `/admin/season-teams` admin management | Missing/planned | #408 | Normal self-service must remain participant-facing; admin is exception/management path |
| Qualified team without slot | See stable waitlist state/position and understand promotion | `/teams` participant entry + `/admin/season-teams` admin management | Missing/planned | #409 | Do not create a parallel registration page |
| Captain | See own Forming/Qualified/Accepted/Waitlisted state and opening-night 4-player depth | `/teams` | Missing/planned | #410 | Must be visible from normal Teams in <=2 actions; admin summary belongs on Operations/Season Teams |
| Player / captain | Find/create/join/manage team relationships and recruit | `/teams` | Implemented core; recruiting expansion open | #131, #181, #182, #330, PR #402 | Teams remains normal roster/recruiting home |
| Player / captain / admin | Open direct conversation from player/captain context | `/messages` | Core implemented; contextual entry open | #373 | Reuse canonical direct conversation |
| Captain | Find available eligible subs and commit blind three | `/lineup`; `/scorecard` consumes the same state for selected matchup | Dated source shipped; Score preparation bridge open | #13, #138, #330, #371, PR #389 | Schedule is availability source; recruiting stays Teams; no duplicate nightly roster surface |
| Captain / league admin exception | Transfer current captain role | Team management; Admin Teams fallback | Open | #182, #372 | No one-night captain role |
| Player / scorer | Select authorized date/team/matchup/revealed race | `/scorecard` | Implemented core; actual-play-date/final phone proof open | #141, #371, PRs #422/#424 | Score is a direct shared-nav destination; all four selectors are on-page and live scoring is one deliberate action from selected race |
| Player / team scorer | Score/reconcile/confirm/finalize | `/scorecard/live` | Substantially complete; physical QA open | #14, #73, #321-#326, #344, PR #386 | Intentional focus child of Score |
| Public visitor / player | View standings | `/standings` | Implemented current season | #16, #17, #180 | Desktop direct; mobile menu <=2 |
| Player / captain | Coordinate without sharing contact details | `/messages` | Implemented core | #76-#80 | Direct shared navigation |
| Signed-in player | Ask league admin group for help | `/admin` entry -> `/messages` conversation | Entry partial; group conversation missing | #361, #366 | Safe help/recovery exists; final support workflow missing |
| League admin | Navigate administration by purpose | `/admin` | Partial/shipped | #366, PRs #369/#399/#403 | Direct desktop; mobile menu <=2 |
| League admin | Triage readiness/exceptions | `/admin/operations` | Partial but shipped | #168, #169, #410 | Reachable from Admin |
| League admin | Find/administer players | `/admin/players` | Implemented current slices | #316, #340 | Reachable from Admin |
| League admin | Manage one team / team-level exceptions | planned Admin Teams | Missing | #372 | Must appear under Admin; distinct from season preparation |
| Moderator / league admin | Resolve reported message content | `/messages/moderation` | Implemented | #80 | Explicit moderation surface |
| Player | Enter Fargo ID/view official rating+robustness | `/profile` | Missing/planned | #365, #89/#90 | Profile owns self-service |
| Public visitor / player | View prize/payout transparency | `/prizes` | Existing mixed surface; split open | #18 | Admin configuration migrates to League Management |
| Player / captain | Use formal trades | none | Obsolete/removal pending | #362 | Supported movement uses applications/invitations/captain/admin membership workflows |
| Public visitor / tester | Learn app safely using production-equivalent interactions | `/demo` + child drills | Scoring parity implemented; captain parity open | #387, #388, PR #386 | Test Drive is not a second product |

## Canonical API/page ownership highlights

- Profile/account/Fargo self-service -> `/profile`.
- Own private league contact phone -> `/profile`; broad admin lists may expose readiness only. Authorized full-number detail remains privileged support data under #335/#372.
- Current-season registration/payment -> `/profile`; no second team-registration surface should become authoritative.
- Prepared-player self-claim -> `/profile`; `/admin/players` owns creating the Unclaimed record.
- Admin unclaimed-player creation and privileged player mutations -> `/admin/players`; normal discovery/recruiting remains `/teams`.
- Team applications, membership requests, invitations, free-agent participation, normal roster relationships, and participant-facing team-entry status -> `/teams`.
- Date-keyed personal availability -> `/schedule`; standalone `/availability` is transitional.
- Team lineup read/commit remains authoritative in lineup domain while #371 adds a captain pre-score bridge on Score; normal recruiting stays Teams.
- Authorized league-night context selection -> `/scorecard`; PRs #422/#424 ship date/team/matchup/revealed-race selection without IDs or client-invented pairings. Live scoring -> `/scorecard/live`.
- Direct/team/league chat -> `/messages`; report resolution -> `/messages/moderation`; matchup chat is legacy under #78.
- Admin access gateway -> `/admin`.
- Season setup/publishing/**successful Close season** and authoritative Publish/Close readiness -> `/season-setup`. PR #412 makes Close an explicit audited operator action after competitive completion; PRs #417/#419 complete #338 readiness on the same surface; #414 owns distinct Cancel/Archive/safe-delete actions. Do not create a second season-lifecycle page.
- Selected-season candidate preparation, prepared creation, captain setup continuation, qualification state, and slot entry -> `/admin/season-teams`.
- **Initial slot qualification is not participant registration:** PR #411's captain + 3 active rostered-player gate lives in season-team entry. #410 separately owns 4 registered-player opening-night depth and participant-facing status.
- Returning reservation/release -> #408; waitlist persistence/promotion -> #409. These extend the same Teams/League Management ownership and must not create a parallel registration application page.
- Operations overview -> `/admin/operations`.
- Trade routes are legacy pending #362.
- Prize configuration migrates to Admin -> League Management under #18; `/prizes` remains public read-only.

## Current librarian findings

### 2026-08-12 reconciliation

- **PRs #422/#424 advanced #371 without changing canonical ownership:** `/scorecard` now ships a browser-local Today default and human-readable date, scoring-team, team-matchup, and revealed-race selectors using only the existing server-authorized scorable-match response. Fixed blind pairings are not re-assigned client-side, and selecting a revealed race hands off to canonical `/scorecard/live`.
- **Score page-purpose audit remains clean:** date/team/matchup/race context directly supports the page's one purpose—choose authorized league-night work and enter scoring. Schedule still owns dates + personal availability, Teams still owns roster/recruiting, `/lineup` remains the authoritative blind-lineup surface, and `/scorecard/live` remains focused scoring.
- **Score <=2-action audit passes:** Score is a direct shared-navigation destination; all shipped selectors are on the page; a selected race reaches live scoring in one deliberate action; empty date/team states retain canonical Schedule/Teams recovery links. Remaining pre-score captain preparation and actual-play-date semantics are already owned by #371.
- **Open PR #425 / issue #423 is presentation-only and non-overlapping:** it enlarges existing lineup correction controls without creating a new story, route, page purpose, authorization boundary, or navigation path. Do not fold that concurrent lane-owned change into librarian cleanup.
- **No new orphan/duplicate route from #422/#424:** the changes extend canonical Score rather than recreating Play Tonight. Legacy `/availability`, `/trades`, and matchup-chat cleanup remains #370/#362/#78.
- **PR #419 completed #338:** canonical `/season-setup` has both authoritative Publish and Close readiness checklists. #338 is correctly closed.
- **PR #420 is presentation/accessibility-only:** the existing lineup -> Score handoff meets the shared tactile-action minimum without changing ownership.
- **PR #412 completed the core #337 Close-season story:** `/season-setup` exposes an explicit audited Close season action while preserving league history.
- **Lifecycle backlog split remains correct:** #338 is complete; #414 owns Cancel/Archive/safe-delete semantics. No lifecycle readiness duplicate issue is needed.
- **PR #415 is presentation-only:** Schedule's Available / Unsure / Unavailable phone control is more compact, but the story and ownership remain unchanged.
- **PRs #404/#405 completed #342 and advanced #335:** `/admin/season-teams` owns prepared team/captain/roster continuation; Profile owns own private contact phone; authorized detail/recovery remains #335/#372.
- **PR #411/#407 introduced the four-state team-entry model:** Forming, Qualified, Accepted, Waitlisted are admin-visible on `/admin/season-teams`; #408/#409/#410 correctly own remaining returning/waitlist/participant slices.
- **Page-purpose audit:** `/season-setup`, `/admin/season-teams`, `/admin/players`, `/teams`, `/profile`, `/lineup`, and `/scorecard` each retain one distinct purpose for their affected audiences.
- **<=2-action audit:** Publish/Close remains Admin -> League Management; Profile phone is direct; Schedule, Teams, Score are direct destinations; lineup -> Score and selected Score race -> live scoring are in-context one-action continuations.
- **Backlog reconciliation:** #371 is accurately narrowed to captain pre-score preparation, actual-play-date semantics, and final phone/browser validation. #423 already owns the open lineup touch-target fix. No new issue was needed.

## Known catalog work

- #238 — exhaustive user-story/page/function/control inventory and ongoing catalog maintenance.
- #239 — deterministic <=2-action role-aware navigation/reachability matrix; canonical Schedule/Admin source cleanup is complete.
- #414 — distinct Cancel season, Archive, and safe empty-draft Delete actions on `/season-setup`; do not reopen successful Close-season semantics or completed #338 readiness.
- #406 — parent team-slot governance story; #407 first qualification slice is complete.
- #408 — returning-team reservation window, release, and captain succession.
- #409 — durable qualified-team waitlist ordering and promotion.
- #410 — participant-facing team-entry status and 4-player opening-night readiness.
- #335 — private contact recovery + authorized Admin detail UI only; persistence and assignment/activation enforcement are shipped.
- #370 — retire duplicate `/availability` after final proof.
- #330 — finish normal Teams recruiting filters using dated availability.
- #371 — remaining Score work is captain pre-score availability/sub/lineup preparation, actual-play-date semantics, and final phone/browser validation; date/team/matchup/revealed-race selection shipped in #422/#424.
- #366 — complete Admin Teams/Admin Support/League Management ownership and retire Profile fallback after proof.
- #372 — focused Admin Teams management; do not duplicate `/admin/season-teams` season preparation.
- #373 — contextual Message player/captain deep-links.
- #343 — source implementation merged; remaining real-player production-phone proof behind #280.
- #387/#388 — continue Test Drive production-component parity; scoring complete, captain lineup remains.
- #340/#341 — source/database implementations shipped; exact deployed/live proof remains blocked by release traceability.
- #361 — shared Admin Support channel via Messages.
- #362 — remove legacy Trades UI/APIs while preserving history.
- #363 — exhaustive agent-friendly API reference/lifecycle classification.
- #18 — split public prize transparency from Admin League Management configuration.
- #169 — remaining `/admin/operations` signals.
- #316 — `/admin/players` human/mobile validation.
- #326 — remaining physical/two-human rack-ledger proof.
- #374 — approved execution roadmap; #247 remains release gate.

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

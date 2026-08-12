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
- **#371 Score + Play Tonight** — `/scorecard` is the canonical current-date-default league-night hub. PRs #422/#424 ship human-readable date, scoring-team, team-matchup, and revealed-race selection using only the server-authorized scorable-match read model. PR #431 adds captain team/round contexts before reveal and a direct **Prepare lineup** handoff to canonical `/lineup`; dated availability, substitute discovery, blind-three validation/lock/reveal, and scoring authorization remain owned by their existing surfaces. `/scorecard/live` remains the focused live-scoring child. Remaining work is actual-play-date semantics and final phone/browser validation.
- **#366 Admin gateway** — `/admin` is the role-aware administration/help gateway. Shared discovery is canonical in `src/appShell.js` after #399/#403. Admin Teams/#372, Admin Support/#361, and remaining League Management consolidation are still open.
- **#337 Close season / #338 readiness** — PR #412 makes `/season-setup` the canonical operator surface for explicit audited **Close season** after competitive completion, while PRs #417/#419 complete the authoritative Close and Publish readiness checklists on that same lifecycle surface. Cancel/Archive/safe-delete are separate lifecycle work under #414.
- **#342 prepared-team administration** — PRs #398/#404/#405 completed prepared-team creation, optional captain assignment, and explicit Add players continuation on `/admin/season-teams`. This story is closed; do not recreate those workflows elsewhere.
- **#406 team-slot governance** — team entry has four plain-language states: **Forming, Qualified, Accepted, Waitlisted**. PR #411/#407 enforces captain + 3 active rostered players before a new/current-season team can take a slot. Returning reservation/release is #408, persistent waitlist ordering/promotion is #409, participant-facing status plus 4-player opening-night depth is #410, and #448 owns visible in-context explanation when a Reserve/Add action is unavailable.
- **#341 prepared-player self-claim** — `/profile` owns `Claim existing player`; `/admin/players` owns creation of the prepared Unclaimed identity.
- **#335 private captain contact** — `/profile` owns the player's private phone editor. PR #404 adds contact-aware captain assignment and season-activation enforcement. Broad admin lists expose readiness only; authorized full-number detail and missing-contact recovery remain open.
- **#362 Trades retirement** — PR #447 retires `/trades` and every formal-trade HTTP entry at the Worker boundary. Applications, membership requests, invitations, captain roster management, and admin membership exceptions are the supported movement model. Historical private trade/audit records remain intact and are not rewritten.
- **#18 Prize split** — `/prizes` is public/read-only transparency; privileged payout configuration belongs in Admin -> League Management.
- **#365 Fargo profile identity** — `/profile` owns player-entered Fargo ID and display of sourced official Fargo rating + robustness.
- **#361 Admin Support** — player questions/operational reports are shared admin-group conversations using Messages and are distinct from `/messages/moderation`.
- **#182 Captain lifecycle** — teams self-manage the current captain; admin performs the same captain swap only as an exception. There is no reduced one-night captain role.
- **#373 Contextual messaging** — `Message player` and `Message captain` are links into canonical direct Messages, not new chat types.
- **#387 Test Drive component parity** — complete after PRs #386/#444/#446. Test Drive / War Games is a QA harness around production components rather than a parallel implementation; scoring and captain lineup share production components/controllers, while the durable workflow inventory classifies remaining actions as presentation-only orientation or sandbox-only support where they do not simulate production mutations.
- **#382 site-wide visual/accessibility system** — normal application content uses the approved warm/light page and surface language; dark felt/wood is reserved for shared navigation identity. PR #432 semanticizes the shared styling layer, fixes shared focus and placeholder contrast, and adds reduced-motion/forced-colors guardrails. Remaining visual/browser sign-off is page-specific under #427/#428/#429/#434/#435/#437, not an alternate-theme ownership question.

## Current top-level page registry

| Route / surface | Audience/group | Distinct primary purpose | Current ownership / status |
| --- | --- | --- | --- |
| `/` | Public visitor | Understand Fremont Derby and choose the next appropriate league action | Canonical introduction; current-season practical details remain #252; visual/accessibility sign-off #427 |
| `/rules` | Public visitor / player | Read authoritative user-facing league rules | Canonical rules surface; postseason copy reconciliation completed in #436/PR #441; #437 owns visual/accessibility sign-off |
| `/profile` | Player | Sign in and manage own identity, current-season participation/payment, memberships, private contact details, and personal status | Canonical identity/profile surface. Own phone #335, self-claim #341, registration/payment #343, Fargo #365, session persistence #378; visual sign-off #427 |
| `/teams` | Player / captain | Find, join, create, manage, recruit, and understand own team relationship | Canonical normal team/roster surface. Participant-facing entry state/depth belongs here under #410; recruiting expansion remains #330; visual sign-off #428 |
| `/schedule` | Public visitor / player / captain | See league dates/matchups and mark personal dated availability | Canonical schedule/availability surface after #376/#389; PR #415 only compacts the existing three-state phone control and does not change ownership; visual sign-off #427 |
| `/availability` | Player / captain | Transitional standalone availability editor | Duplicate transitional runtime surface; retire under #370 |
| `/lineup` | Captain | Build and commit the team's blind lineup | Authoritative lineup surface. PR #431 lets Score hand an unrevealed selected matchup here via Prepare lineup while availability/sub/three-slot/lock/reveal behavior stays owned here. PR #444 makes production `/lineup` and Captain War Games consume the same shared blind-lineup component/controller; visual sign-off #435 |
| `/scorecard` | Player / captain / team scorer | Select authorized league-night context and continue to lineup preparation or enter the selected revealed race into scoring | Canonical flexible Score hub. PRs #422/#424 ship local-Today plus date/team/matchup/revealed-race selectors; PR #431 adds captain contexts + Prepare lineup. Remaining #371 work is actual-play-date semantics and final phone/browser validation; visual sign-off #427 |
| `/scorecard/live` | Player / team scorer | Operate active team-owned rack-ledger scoring | Canonical live-scoring surface; physical/two-human proof remains #326; visual fidelity remains under #382 |
| `/messages` | Player / captain / admin support participant | Coordinate league/team/direct communication and planned shared admin-support conversations | Canonical communication surface; matchup chat deprecated under #78; visual sign-off #428 |
| `/standings` | Public visitor / player | View team and individual standings and season results | Canonical standings surface; historical selection remains #180; visual/accessibility sign-off #434 |
| `/prizes` | Public visitor / player | View purse and payout transparency | Canonical public/read-only prize surface; privileged controls migrate under #18 |
| `/admin` | Signed-in player / league admin | Route the signed-in user to appropriate league administration/help destinations | Partial gateway; Admin Teams/Admin Support remain #372/#361; visual/recovery sign-off #429 |
| `/season-setup` | League admin / director | Configure, publish, close, and manage the selected season lifecycle | Canonical lifecycle surface under Admin -> League Management. PR #412 adds explicit audited Close season; PRs #417/#419 complete authoritative Close/Publish readiness; #414 owns Cancel/Archive/safe-delete distinctions; visual sign-off #429 |
| `/admin/season-teams` | League admin / director | Prepare candidate/returning teams and control selected-season slot entry | Canonical season-team preparation surface. PRs #398/#404/#405 cover creation/captain/roster continuation; PR #411 adds Forming/Qualified/Accepted/Waitlisted state and qualification enforcement; #448 owns visible reason/recovery context when Reserve/Add is disabled; visual sign-off #429 |
| `/admin/operations` | League admin / director | See readiness, exceptions, prioritized actions, and operational health | Canonical operations/triage; #410 will add accepted-team 4-player depth summary; #169 owns other remaining signals; visual sign-off #429 |
| `/admin/players` | League admin / director | Find a player and manage privileged player-level league administration | Canonical player-admin and roster-exception surface; Add players from `/admin/season-teams` deep-links here; visual sign-off #429 |
| `/messages/moderation` | Moderator / league admin | Review and resolve reported messages | Canonical moderation surface; separate from Admin Support; recovery/accessibility sign-off rolls into #429 |
| planned Admin Teams | League admin / director | Manage one team and team-level operational exceptions | Missing runtime surface tracked by #372; must not duplicate season preparation on `/admin/season-teams` |
| `/demo` | Public visitor / tester | **Test Drive the App** using fictional, non-authoritative data | Canonical public test-drive entry; production-component parity and workflow ownership inventory completed under #387/PR #446; public visual sign-off #437 |
| `/sandbox/captain` | Tester / sandbox user | Practice fictional team formation, roster churn, availability, and lineup work | Test Drive child; lineup drill shares production blind-lineup component/controller after PR #444; other orientation is classified as fictional/non-authoritative by PR #446 |
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
| League admin | See whether a new/current-season team may take a season slot | `/admin/season-teams` | Implemented first slice | #406/#407, PR #411 | Forming/Qualified/Accepted/Waitlisted are visible with Assign captain/Add players recovery; <=2 from Admin |
| League admin | Understand why Reserve/Add is unavailable and what to fix | `/admin/season-teams` | Missing/planned presentation fix | #448 | Same card/action context; no new page or workflow. Reason must be visible without hover/title discovery and may reuse Assign captain/Add players recovery |
| Returning captain/team | Reserve, release, or hand off prior team slot during first-refusal window | `/teams` participant entry + `/admin/season-teams` admin management | Missing/planned | #408 | Normal self-service must remain participant-facing; admin is exception/management path |
| Qualified team without slot | See stable waitlist state/position and understand promotion | `/teams` participant entry + `/admin/season-teams` admin management | Missing/planned | #409 | Do not create a parallel registration page |
| Captain | See own Forming/Qualified/Accepted/Waitlisted state and opening-night 4-player depth | `/teams` | Missing/planned | #410 | Must be visible from normal Teams in <=2 actions; admin summary belongs on Operations/Season Teams |
| Player / captain | Find/create/join/manage team relationships and recruit | `/teams` | Implemented core; recruiting expansion open | #131, #181, #182, #330, PR #402 | Teams remains normal roster/recruiting home |
| Player / captain / admin | Open direct conversation from player/captain context | `/messages` | Core implemented; contextual entry open | #373 | Reuse canonical direct conversation |
| Captain | Find available eligible subs and commit blind three for the selected matchup | `/lineup`; `/scorecard` links the selected unrevealed captain matchup here | Implemented core; phone proof open | #13, #138, #330, #371, PRs #389/#431/#444 | Score -> Prepare lineup is one in-context action; Schedule remains availability source; recruiting stays Teams; shared Test Drive component does not create a second production page |
| Captain / league admin exception | Transfer current captain role | Team management; Admin Teams fallback | Open | #182, #372 | No one-night captain role |
| Player / scorer | Select authorized date/team/matchup/revealed race | `/scorecard` | Implemented core; actual-play-date/final phone proof open | #141, #371, PRs #422/#424/#431 | Score is a direct shared-nav destination; selectors are on-page; unrevealed captain matchup reaches lineup in one action and revealed race reaches live scoring in one action |
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
| Player / captain | Use formal trades | none | Retired | #362, PR #447 | Supported movement uses applications/requests/invitations/captain/admin membership workflows; historical records remain audit-only |
| Public visitor / tester | Learn app safely using production-equivalent interactions | `/demo` + child drills | Component parity and workflow inventory complete | #387, #388, PRs #386/#444/#446 | Test Drive is not a second product; fictional-only orientation stays non-authoritative |

## Canonical API/page ownership highlights

- Profile/account/Fargo self-service -> `/profile`.
- Own private league contact phone -> `/profile`; broad admin lists may expose readiness only. Authorized full-number detail remains privileged support data under #335/#372.
- Current-season registration/payment -> `/profile`; no second team-registration surface should become authoritative.
- Prepared-player self-claim -> `/profile`; `/admin/players` owns creating the Unclaimed record.
- Admin unclaimed-player creation and privileged player mutations -> `/admin/players`; normal discovery/recruiting remains `/teams`.
- Team applications, membership requests, invitations, free-agent participation, normal roster relationships, and participant-facing team-entry status -> `/teams`.
- Date-keyed personal availability -> `/schedule`; standalone `/availability` is transitional.
- Team lineup read/commit is authoritative on `/lineup`; PR #431 lets Score select an unrevealed captain team/round context and hand off there without duplicating availability/substitute/blind-lineup logic. PR #444 shares that same lineup component/controller with Captain War Games through an isolated fictional adapter. Normal recruiting stays Teams.
- Authorized league-night context selection -> `/scorecard`; PRs #422/#424/#431 ship date/team/matchup/revealed-race selection plus captain pre-reveal context, without IDs or client-invented pairings. Live scoring -> `/scorecard/live`.
- Direct/team/league chat -> `/messages`; report resolution -> `/messages/moderation`; matchup chat is legacy under #78.
- Admin access gateway -> `/admin`.
- Season setup/publishing/**successful Close season** and authoritative Publish/Close readiness -> `/season-setup`. PR #412 makes Close an explicit audited operator action after competitive completion; PRs #417/#419 complete #338 readiness on the same surface; #414 owns distinct Cancel/Archive/safe-delete actions. Do not create a second season-lifecycle page.
- Selected-season candidate preparation, prepared creation, captain setup continuation, qualification state, and slot entry -> `/admin/season-teams`; #448 owns visible explanation/recovery when an existing Reserve/Add control is unavailable, not a separate surface.
- **Initial slot qualification is not participant registration:** PR #411's captain + 3 active rostered-player gate lives in season-team entry. #410 separately owns 4 registered-player opening-night depth and participant-facing status.
- Returning reservation/release -> #408; waitlist persistence/promotion -> #409. These extend the same Teams/League Management ownership and must not create a parallel registration application page.
- Operations overview -> `/admin/operations`.
- Formal trade page/API ownership is retired under #362/#447; historical private trade/audit data is not a user-facing product surface.
- Prize configuration migrates to Admin -> League Management under #18; `/prizes` remains public read-only.
- Shared presentation ownership -> `src/designSystem.js` plus the post-injection accessibility layer; normal content is warm/light and the dark felt treatment is shared-navigation identity only. Page-local legacy themes are transitional and their browser sign-off/removal is tracked under #382 children rather than as separate product surfaces.

## Current librarian findings

### 2026-08-12 reconciliation

- **PR #447 retires formal Trades:** the actual Worker entry returns 404 for `/trades` and all formal-trade HTTP entry points before auth/data access. Supported roster movement remains on Teams/admin membership workflows, while the private historical trade/audit records remain untouched.
- **Season 1 proof no longer teaches Trades:** the end-to-end fixture and closed #20 contract now use the already-supported membership request + captain invitation convergence path instead of an approved-trade placeholder.
- **#387 workflow inventory is complete on current main:** scoring and captain lineup share production components; remaining captain sandbox actions are classified as presentation-only or fictional sandbox support rather than parallel product implementations. Closed #387 was reconciled so its acceptance checklist now matches PR #446.
- **#448 is a valid missing presentation story, not a new surface:** `/admin/season-teams` already owns qualification and slot-entry actions, but a disabled Reserve/Add action can currently hide its authoritative `entryReason` in `title`. The fix belongs in the same card/action context and remains within Admin -> League Management reachability.
- **#449 was accidental/test backlog noise:** it contained no recoverable story or product context and was closed as not planned.
- **PR #444 completed #388 Captain War Games lineup parity:** production `/lineup` and the lineup drill inside `/sandbox/captain` now render the same `blindLineupComponent` markup/controller. Only adapters differ: production uses authenticated APIs while War Games uses isolated fictional state. Team formation, practice availability switches, and roster churn remain clearly labeled orientation rather than parallel production behavior.
- **The shared lineup does not alter canonical ownership or reachability:** `/lineup` remains the sole captain production surface for blind-three preparation; `/sandbox/captain` remains an explicit Test Drive child/navigation exception. Score -> Prepare lineup still reaches the production capability in one in-context action, so the <=2-action audit remains clean.
- **PR #443 / #439 changed only truthful Admin recovery semantics inside canonical `/admin`:** no page ownership or reachability change; retry is in-place and Profile recovery remains one action.
- **PR #441 / #436 corrected Rules copy inside canonical `/rules`:** no new story/page ownership; visual #437 must preserve the corrected rule truth.
- **No new orphan or duplicate page is introduced by #446/#447/#448.** After Trades retirement, the important known transitional/legacy runtime ownership gaps are `/availability` under #370 and matchup chat under #78.

## Known catalog work

- #238 — exhaustive user-story/page/function/control inventory and ongoing catalog maintenance.
- #239 — deterministic <=2-action role-aware navigation/reachability matrix; canonical Schedule/Admin source cleanup is complete.
- #414 — distinct Cancel season, Archive, and safe empty-draft Delete actions on `/season-setup`; do not reopen successful Close-season semantics or completed #338 readiness.
- #406 — parent team-slot governance story; #407 first qualification slice is complete.
- #408 — returning-team reservation window, release, and captain succession.
- #409 — durable qualified-team waitlist ordering and promotion.
- #410 — participant-facing team-entry status and 4-player opening-night readiness.
- #448 — make `/admin/season-teams` show the authoritative unavailable Reserve/Add reason in-context with accessible recovery; presentation only, no qualification-rule change.
- #335 — private contact recovery + authorized Admin detail UI only; persistence and assignment/activation enforcement are shipped.
- #370 — final real-phone Schedule -> lineup proof plus eventual duplicate `/availability` retirement.
- #330 — finish normal Teams recruiting filters using dated availability.
- #371 — remaining Score work is actual-play-date semantics and final phone/browser validation; date/team/matchup/revealed-race selection and captain Prepare lineup bridge shipped in #422/#424/#431.
- #366 — complete Admin Teams/Admin Support/League Management ownership and retire Profile fallback after proof.
- #372 — focused Admin Teams management; do not duplicate `/admin/season-teams` season preparation.
- #373 — contextual Message player/captain deep-links.
- #343 — source implementation merged; remaining real-player production-phone proof behind #280.
- #382 — parent site-wide visual/accessibility sign-off; shared architecture is complete after #432.
- #427/#428/#429 — remaining Home/Schedule/Score/Profile, Teams/Messages, and Admin/recovery browser visual/accessibility sign-off.
- #434/#435/#437 — focused Standings, captain Lineup, and Rules/Test Drive visual/accessibility sign-off discovered after the global layer; these are page-specific cleanup, not new product ownership.
- #340/#341 — source/database implementations shipped; exact deployed/live proof remains blocked by release traceability.
- #361 — shared Admin Support channel via Messages.
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

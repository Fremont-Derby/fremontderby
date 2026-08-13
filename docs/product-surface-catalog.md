# Fremont Derby Product Surface Catalog

This is the canonical index connecting **audiences → user stories → functions → pages/routes**. GitHub issues remain the durable source for detailed requirements and acceptance criteria. Issue #238 owns the exhaustive control-level inventory; `docs/page-api-user-story-audit.md` is the deeper page/API/story reference.

## Information-architecture invariants

1. Every meaningful user-facing requirement is documented in GitHub.
2. Every user-facing function has one canonical page/surface home.
3. Every page has one distinct primary purpose for each audience/group it serves.
4. Secondary functions support that purpose rather than turning the page into a grab bag.
5. Duplicate pages/functions are consolidated or explicitly documented as intentional.
6. Normal authorized pages and primary functions are discoverable within two deliberate navigation actions.
7. Technical URLs, internal IDs, browser history, and undocumented deep links do not count as discoverability.
8. Diagnostic, demo/sandbox, moderation-only, and destructive-confirmation substeps may be explicit exceptions.
9. Normal public league reads use only seasons classified for league purpose; QA/Test Drive seasons stay outside ordinary public Schedule/Standings/Prizes/registration data.

## Audience groups

- **Public visitor** — understands the league, rules, schedule, teams, standings, prizes, and how to join.
- **Player** — manages identity, participation, availability, communication, standings, and allowed scoring work.
- **Captain** — manages roster relationships, team-entry readiness, substitutes, lineups, and captain decisions.
- **League admin / director** — finds and manages seasons, players, teams, lifecycle, exceptions, and operational health.
- **Moderator** — reviews reported messages.
- **Tester / sandbox user** — learns and validates fictional, non-authoritative workflows through Test Drive.
- **Internal / diagnostic** — health/environment proof outside normal product navigation.

## Canonical page registry

| Route / surface | Audience/group | Distinct primary purpose | Current ownership / status |
| --- | --- | --- | --- |
| `/` | Public visitor | Understand Fremont Derby and choose the next appropriate action | Canonical introduction; #252 owns deeper practical/current-season details |
| `/rules` | Public visitor / player | Read authoritative user-facing league rules | Canonical rules surface; rule-copy reconciliation shipped in #436/PR #441 |
| `/profile` | Player | Sign in and manage own identity, participation/payment status, private contact, self-claim, and personal status | Canonical self-service identity surface; #335/#341/#343/#365 |
| `/teams` | Public visitor / player / captain | Understand teams and, when signed in, find/join/create/manage/recruit for team relationships | Canonical team/directory/roster surface; #131 is open because signed-out public-directory behavior is currently incomplete; #330/#410 extend recruiting/status |
| `/schedule` | Public visitor / player / captain | See league dates/matchups and mark personal dated availability | Canonical schedule/availability surface under #370; normal public season inputs exclude QA-purpose seasons after PR #561; shared default-season policy shipped in PR #566 |
| `/availability` | Player / captain | Transitional standalone availability editor | Duplicate transitional runtime surface; retire under #370 |
| `/lineup` | Captain | Build and commit the team's blind lineup | Canonical lineup surface; Score may hand an unrevealed captain matchup here; Test Drive shares the production component |
| `/scorecard` | Player / captain / team scorer | Select authorized league-night context and continue to lineup preparation or scoring | Canonical flexible Score hub under #371 |
| `/scorecard/live` | Player / team scorer | Operate active team-owned rack-ledger scoring | Canonical focused live-scoring child; physical/two-human proof remains #326 |
| `/messages` | Player / captain / admin-support participant | Coordinate league/team/direct communication | Canonical communication surface; matchup chat is deprecated under #78 |
| `/messages/moderation` | Moderator / league admin | Review and resolve reported messages | Canonical moderation surface; separate from Admin Support |
| `/standings` | Public visitor / player | View team and individual standings and season results | Canonical standings surface; public reads exclude QA-purpose seasons after PR #561; truthful season-loading controls shipped in PR #562; shared default-season policy shipped in PR #566; historical selection remains #180 |
| `/prizes` | Public visitor / player | View purse and payout transparency | Canonical public/read-only prize surface; public reads exclude QA-purpose seasons after PR #561; mobile/first-paint cleanup shipped in PR #559; shared default-season policy shipped in PR #566; privileged configuration belongs in Admin under #18 |
| `/admin` | Signed-in player / league admin | Route the signed-in user to appropriate administration/help destinations | Canonical Admin gateway; Admin Teams/#372 and Admin Support/#361 remain open |
| `/admin/seasons` | League admin / director | Find an existing season by human-readable name/status and continue to the correct canonical season surface | Shipped in #519/#525/PR #520. Lookup only; **Admin → Seasons** satisfies the <=2-action rule |
| `/season-setup` | League admin / director | Configure, publish, close, and manage the selected season lifecycle | Canonical lifecycle surface; #337/#338 shipped; #414 owns cancel/archive/safe-delete distinctions |
| `/admin/season-teams` | League admin / director | Prepare candidate/returning teams and control selected-season slot entry | Canonical season-team preparation surface; #406 governs entry states; #448/PR #451 shipped visible unavailable-action reasons |
| `/admin/operations` | League admin / director | See readiness, exceptions, prioritized actions, and operational health | Canonical operations/triage surface; #169/#410 own remaining signals |
| `/admin/players` | League admin / director | Find a player and manage privileged player-level administration | Canonical player-admin/roster-exception surface; scan-first management shipped in #442/#530 |
| planned Admin Teams | League admin / director | Manage one team and team-level operational exceptions | Missing surface tracked by #372; must not duplicate `/admin/season-teams` preparation |
| `/demo` | Public visitor / tester | Test Drive the App using fictional, non-authoritative data | Canonical public test-drive entry; production-component parity complete under #387; Test Drive data is not a normal public league-season input |
| `/sandbox/captain` | Tester / sandbox user | Practice fictional captain workflows | Test Drive child; explicit navigation exception |
| `/sandbox/player` | Tester / sandbox user | Practice fictional scoring/reconciliation | Test Drive child; explicit navigation exception |
| `/health`, `/health/environment` | Internal / diagnostic | Verify runtime/environment readiness | Explicit navigation exception |

## Key story/function mappings

| Audience | Capability / outcome | Canonical page | State | Story / proof | Discoverability |
| --- | --- | --- | --- | --- | --- |
| Public visitor | Browse safe team/captain/roster/player directory information | `/teams` | Regression/open | #131 | Route is directly discoverable; signed-out content still needs restoration |
| Public visitor / player | See legitimate public season data without QA/Test Drive contamination and get a useful default when no season is explicitly selected | Existing `/schedule`, `/standings`, `/prizes` owners | Implemented shared policy | #553/#526, PRs #559/#561/#562/#566 | Existing pages remain directly discoverable; PR #561 defines eligible league-season inputs and PR #566 provides one lifecycle-aware default policy while preserving explicit selection |
| Player / free agent | Mark Available / Unsure / Unavailable for a date | `/schedule` | Implemented; duplicate retirement open | #138/#370 | Direct Schedule control |
| Player | Manage identity, own registration/payment/contact/Fargo | `/profile` | Implemented core / some proof open | #335/#341/#343/#365 | Direct shared navigation |
| Player / captain | Find/create/join/manage team relationships and recruit | `/teams` | Implemented core; expansion open | #131/#181/#182/#330 | Direct shared navigation |
| Captain | Find eligible available subs and commit blind three | `/lineup` | Implemented core; phone proof open | #138/#371 | Score → Prepare lineup is one contextual action |
| Player / scorer | Select date/team/matchup/revealed race | `/scorecard` | Implemented core; actual-play-date proof open | #371 | Direct shared navigation |
| Player / team scorer | Score/reconcile/confirm/finalize | `/scorecard/live` | Substantially complete; physical proof open | #326 | Intentional child of Score |
| Player / captain | Coordinate without sharing personal contact | `/messages` | Implemented core | #76-#80 | Direct shared navigation |
| Public visitor / player | View standings | `/standings` | Implemented | #16/#17/#180 | Desktop direct; mobile menu <=2 |
| League admin | Navigate administration by purpose | `/admin` | Partial/shipped | #366 | Desktop direct; mobile menu <=2 |
| League admin | Find existing seasons by name/status | `/admin/seasons` | Implemented | #519/#525/PR #520 | Admin → Seasons <=2 actions |
| League admin | Configure/publish/close selected season | `/season-setup` | Implemented core; lifecycle extensions open | #337/#338/#414 | Admin gateway continuation |
| League admin | Prepare teams and control season slot entry | `/admin/season-teams` | Implemented core; governance extensions open | #342/#406/#448 | Admin gateway continuation |
| League admin | Triage readiness/exceptions | `/admin/operations` | Partial/shipped | #169 | Admin gateway continuation |
| League admin | Find/administer players | `/admin/players` | Implemented current slices | #316/#340/#442 | Admin gateway continuation |
| League admin | Manage one team / team-level exceptions | planned Admin Teams | Missing | #372 | Must appear under Admin when implemented |
| Public visitor / player | View prize/payout transparency | `/prizes` | Public view exists; admin split open | #18/#557 | Direct desktop nav/mobile menu |
| Public visitor / tester | Learn app safely using production-equivalent interactions | `/demo` + child drills | Component parity complete | #387/#388 | Test Drive entry is normal public navigation; children are sandbox exceptions |
| Player / captain | Use formal trades | none | Retired | #362/PR #447 | Supported movement uses team membership workflows instead |

## Canonical ownership highlights

- Profile/account/Fargo/contact self-service → `/profile`.
- Safe public team directory, normal recruiting, membership requests/invitations, and participant-facing team state → `/teams`.
- Date-keyed personal availability → `/schedule`; `/availability` remains transitional.
- Blind lineup read/commit → `/lineup`.
- League-night context selection → `/scorecard`; live scoring → `/scorecard/live`.
- Direct/team/league chat → `/messages`; report resolution → `/messages/moderation`.
- Admin access gateway → `/admin`.
- Existing-season lookup → `/admin/seasons`; lifecycle/configuration → `/season-setup`; selected-season team preparation/slot entry → `/admin/season-teams`; public results → `/standings`.
- Player administration → `/admin/players`; operations triage → `/admin/operations`; planned team-level exceptions → Admin Teams/#372.
- Normal public season feeds use league-purpose seasons only after PR #561. QA/Test Drive seasons are excluded from ordinary public registration/standings/prize inputs. PR #566 gives Schedule, Standings, and Prizes one shared lifecycle-aware default among eligible league seasons while preserving valid explicit selection.
- Public prizes → `/prizes`; privileged prize configuration belongs in Admin under #18.
- Formal trade page/API ownership is retired under #362/#447.

## Current librarian findings — 2026-08-13

- PR #566 completes #553's shared public-season default-selection behavior: Schedule, Standings, and Prizes now use one shared selector that preserves valid explicit `?season=` selection and otherwise prefers `active/playoffs → registration → most recent complete`, with remembered state only as fallback.
- PR #561 establishes the durable public-season purpose boundary: normal public registration/standings/prize reads admit league-purpose seasons and exclude QA-purpose seasons. This is a shared data-eligibility contract, not a new route or page owner.
- PR #562 fixes a contained Standings truthfulness defect by keeping Season/Load controls disabled while seasons are loading; it does not change standings semantics, page ownership, or navigation.
- `/admin/seasons` remains a shipped canonical surface with one purpose: **find existing seasons**. It does not absorb lifecycle, team-entry, or results behavior. #525 records this contract.
- #448 is shipped by PR #451; `/admin/season-teams` presents unavailable Reserve/Add reasons in context without creating another workflow.
- Source-level visual convergence is broadly complete across canonical public/player/captain/admin surfaces. Parent #382 remains open for representative browser/phone verification and `/scorecard/live` fidelity; source convergence is not the same as browser sign-off.
- #131 is a real current regression: `/teams` is still canonical, but the signed-out runtime does not satisfy the story's safe public-directory acceptance. Fix it on `/teams`; do not create another public teams page.
- #531 remains valid source-of-truth cleanup: routed Teams output is canonical today, but the underlying renderer still contains stale legacy destinations/copy and depends on a compatibility enhancer.
- The material known duplicate/legacy runtime ownership gaps remain standalone `/availability` under #370 and deprecated matchup-chat endpoints under #78.

## Known catalog work

- #238 — exhaustive control-level inventory and ongoing catalog maintenance.
- #239 — deterministic role-aware <=2-action reachability matrix.
- #557 — finish real-browser/320px Prizes proof after PR #559; shared default-season policy is complete after PR #566.
- #131 — restore signed-out public Teams directory/mobile acceptance on the existing `/teams` surface.
- #531 — remove legacy Teams renderer destinations/copy while preserving routed behavior.
- #370 — final parity/proof and eventual `/availability` retirement.
- #78 — remove/migrate deprecated matchup-chat runtime safely.
- #366/#372/#361 — complete Admin gateway destinations and final Profile fallback migration.
- #406/#408/#409/#410 — finish returning-team/waitlist/participant-status governance on existing Teams/Admin surfaces.
- #414 — cancel/archive/safe-delete lifecycle actions on `/season-setup`.
- #18 — finish public-prize/Admin-configuration split.
- #169 — remaining Operations signals.
- #326 — remaining physical/two-human scoring proof.
- #382 — final representative browser/phone visual QA and scoring mock-up fidelity.

## Librarian update checklist

When a PR or issue changes routes, navigation, page controls, roles, or user-visible behavior:

- [ ] Is there a documented user story for the changed capability?
- [ ] Is the audience/group explicit?
- [ ] Does the capability have exactly one canonical page home?
- [ ] Does the page still have one clear primary purpose for that group?
- [ ] Is the capability discoverable to the authorized user in <=2 navigation actions?
- [ ] Did the change create a duplicate page/function, dead end, stale route, or hidden capability?
- [ ] Does this catalog need an update?
- [ ] Does README need a stable product-surface update?
- [ ] Are unresolved gaps represented by GitHub issues?
- [ ] Are completed/stale issues reconciled after the change?

The catalog should describe current product reality and approved ownership transitions clearly. Missing capabilities belong in linked issues with explicit state; legacy runtime must not be mistaken for supported product direction.
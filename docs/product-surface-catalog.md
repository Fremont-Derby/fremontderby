# Fremont Derby Product Surface Catalog

This document is the canonical index connecting **audiences -> user stories -> functions -> pages/routes**. GitHub issues remain the durable source for detailed requirements and acceptance criteria; this catalog records current product ownership and discoverability.

The Product Librarian / Information Architecture agent owns continuous reconciliation of this file. See `.github/agents/product-librarian.agent.md`.

Issue #238 owns the exhaustive control-by-control inventory. This catalog describes current product reality, not an aspirational sitemap.

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
- **Tester / sandbox user** — learns and validates fictional, non-authoritative workflows through Try a League Night and its practice drills.
- **Internal / diagnostic** — health and environment proof; outside normal product navigation.

## Current top-level page registry

| Route / surface | Audience/group | Distinct primary purpose | Current ownership / status |
| --- | --- | --- | --- |
| `/` | Public visitor | Understand Fremont Derby and choose the next appropriate league action | Canonical introduction; current-season practical details remain under #252 |
| `/rules` | Public visitor / player | Read authoritative user-facing league rules | Canonical rules surface |
| `/profile` | Player | Sign in and manage identity, memberships, season history, and role-specific tool discovery | Canonical identity/profile surface. PR #301 completed signed-out/loading/empty/error recovery and narrow-phone history reflow. Authorized admin discovery from PRs #297/#328 remains intact |
| `/teams` | Player / captain | Find, join, create, manage, and recruit around teams and roster relationships | Canonical normal team/roster surface. #330 owns the league-wide sortable/filterable player recruiting and substitute directory within this product area; do not duplicate it in `/admin/players` |
| `/schedule` | Public visitor / player / captain | See the current/upcoming league night and enter the appropriate next workflow | Canonical schedule/current-night surface; #133 |
| `/availability` | Player / captain | Declare and review dated league-night availability/check-in | Canonical availability surface. PR #318 shipped truthful loading/signed-out/session/failure recovery. #138 owns the dated Available/Unavailable/Unsure check-in semantics and fast captain substitute discovery |
| `/lineup` | Captain | Build and submit the team's lineup for a matchup | Canonical captain lineup surface |
| `/scorecard` | Player | Find an eligible generated match to score | Canonical score-selection surface; signed-out/no-match/error recovery shipped in PR #277 |
| `/scorecard/live` | Player | Operate active team-owned rack scoring | Canonical live-scoring surface. PR #331 shipped shared 8-first/9-first opening discipline, PR #333 rebuilt the first view around running team score, individual race, and aligned dual-submission rack ledger, and PR #334 shipped surgical own-team rack editing plus exact mismatch/pending indicators. Final two-phone/War Games proof remains #326 |
| `/messages` | Player / captain | Coordinate league/team/matchup/direct communication without sharing phone numbers | Canonical communication surface; non-happy-path recovery shipped in PR #285 / #281 |
| `/standings` | Public visitor / player | View team and individual standings and season results | Canonical standings surface. PR #302 distinguishes loading, legitimate no-season, empty, and load-failure states with direct recovery. Historical season selection remains #180 |
| `/trades` | Player / captain / admin exception | Manage player trade proposals, responses, and approvals | Canonical trade workflow |
| `/prizes` | Public visitor / admin | View purse/payout state; administer prize configuration where authorized | Shared public/admin surface; role/function separation still needs exhaustive review under #238 |
| `/season-setup` | League admin / director | Configure and publish a season | Canonical season-configuration/publishing surface |
| `/admin/operations` | League admin / director | See readiness, exceptions, prioritized actions, and operational health | Canonical admin operations/triage surface. Shipped in PRs #292-#294/#304/#307/#309/#314; #169 remains open for remaining operational signals |
| `/admin/players` | League admin / director | Find a player and manage player-level league administration without technical IDs | Canonical player-administration surface. PR #320 shipped player search/admin-role management, PR #327 shipped competition eligibility, and PR #329 shipped exact-target roster membership exceptions. #316 remains the durable validation story; normal recruiting remains `/teams`/#330 |
| `/messages/moderation` | Moderator / league admin | Review and resolve reported messages | Canonical moderation surface; intentionally role-restricted |
| `/demo` | Public visitor / tester | Guided **Try a League Night** product test drive using fictional, non-authoritative data | Canonical public demo entry. Guided flow shipped under #249/#263; shared navigation still says `Demo`, and contextual feedback remains under #113/#172 |
| `/sandbox/captain` | Tester / sandbox user | Practice fictional team formation, roster churn, availability, and lineup work | Canonical captain practice drill; #263 |
| `/sandbox/player` | Tester / sandbox user | Practice fictional team-owned scoring, mismatch/reconciliation, confirmation, and finalization | Canonical player scoring drill; #113. #326 requires War Games to converge on the rack-ledger live-scoring interaction model |
| `/health`, `/health/environment` | Internal / diagnostic | Verify Worker/environment readiness without exposing secrets | Explicit normal-navigation exception |

## Reconciled story/function mappings

| Audience | User outcome / capability | Canonical page | State | Story / proof | Discoverability notes |
| --- | --- | --- | --- | --- | --- |
| Public visitor / player / captain | Find tonight's round and matchup context | `/schedule` | Implemented | #133 | Direct desktop navigation; Tonight is in the mobile dock |
| Player | Sign in, manage profile/history, recover from signed-out/error states, and discover authorized admin tools | `/profile` | Implemented current slice | #8, #250, PRs #297/#301/#328 | Profile is a direct shared-nav destination; admin links appear only after the existing admin authorization probe |
| Player / captain | Find/create/join/manage team relationships | `/teams` | Implemented core; recruiting directory open | #131, #181, #182, #330 | Teams is the normal roster/recruiting home. #330 adds sortable/filterable player/team/free-agent/date availability discovery without turning `/admin/players` into a player-facing surface |
| Player / captain | Mark availability/check in for a league date | `/availability` | Core/recovery implemented; dated semantics open | #13, #138, #317, PR #318 | Teams -> Mark availability remains within two deliberate actions. #138 specifies Available/Unavailable/Unsure by calendar date with Unsure as the default; implementation must not silently treat missing response as unavailable |
| Captain | Find roster players and eligible substitutes for a date | `/lineup` with discovery support from `/teams` and `/availability` | Partial | #10, #138, #330 | The lineup remains the canonical selection/commit action; directory/check-in surfaces may filter and deep-link but must not duplicate lineup eligibility rules |
| Captain | Submit a blind ordered lineup | `/lineup` | Implemented | #13, #139, #156, PR #271 | Teams -> Build lineup remains within two deliberate actions |
| Player | Pick an eligible match and recover from no-match/session/load states | `/scorecard` | Implemented | #141, #250, PR #277 | Score is a direct shared-nav destination; recovery points to Profile, Schedule, Teams, or Retry |
| Player / team member | Choose opening discipline, compare rack submissions, surgically edit own-team racks, score, reconcile, confirm, and finalize | `/scorecard/live` | Rack-ledger/edit/mismatch slices shipped; final QA open | #14, #73, #321-#326; PRs #331/#333/#334 | Reduced shared shell is an intentional task-focus exception. Team-owned scoring remains canonical here; running team score and individual score are derived, not manually entered |
| Public visitor / player | View current standings and understand loading/no-season/load-failure states | `/standings` | Implemented current-state recovery; history still open | #16, #17, #180, #250, PRs #272/#302 | Desktop nav is direct; mobile menu is <=2 actions |
| Player / captain | Coordinate without sharing phone numbers and recover from communication non-happy paths | `/messages` | Implemented | #76, #250, #281, PR #285 | Messages is a direct shared-nav destination |
| League admin / director | Configure and publish the season | `/season-setup` | Implemented core setup | #12 | Profile -> Season setup is <=2 actions for an authorized admin |
| League admin / director | See readiness and operational exceptions without querying Supabase | `/admin/operations` | Partial but shipped and discoverable | #168, #169, #239 | Profile -> Operations is <=2 actions after role authorization; action links delegate execution to canonical owning workflows |
| League admin / director | Find a player and manage player-level roles, competition eligibility, and exact roster exceptions | `/admin/players` | Implemented current slices; human validation remains | #316, PRs #320/#327/#329 | Profile -> Players is <=2 actions after PR #328. This page is for privileged player administration, not normal recruiting/substitute discovery |
| Moderator / league admin | Resolve reported chat messages | `/messages/moderation` | Implemented | #80, #239, PR #297 | Authorized admins can discover Moderation through Profile; moderator-only access remains an explicit role exception |
| Public visitor / tester | Learn the league through a safe guided test drive | `/demo` | Partial | #249, PR #265 | Route is discoverable, but shared navigation label remains stale (`Demo`); contextual feedback remains #113/#172 |
| Tester / captain | Practice team formation and lineup work without production writes | `/sandbox/captain` | Implemented | #263, PR #264 | One action from `/demo`; explicit fictional/non-authoritative exception |
| Tester / player | Practice dual scoring without production writes | `/sandbox/player` | Implemented core drill; rack-ledger parity pending | #113, #326 | One action from `/demo`; #326 owns convergence with the live rack-ledger interaction model |

## Current librarian findings

### 2026-08-11

- **Availability recovery is now shipped:** PR #318 merged and closed #317. `/availability` remains the canonical check-in surface; the newer product decision in #138 changes availability from round-centric assumptions to a calendar-date Available/Unavailable/Unsure model with Unsure by default, so implementation belongs in the owning feature/data lane.
- **Recruiting/substitute discovery has a documented canonical home:** #330 records a sortable/filterable player directory under the normal `/teams` experience for players/captains. `/admin/players` stays privileged administration. This prevents the two player-list concepts from becoming duplicate surfaces.
- **Admin player management has all three intended implementation slices on `main`:** PR #320 role management, PR #327 competition eligibility, and PR #329 roster membership exceptions. #316 should remain open only for its explicit two-human/mobile validation and any findings from that proof, not for already-shipped implementation slices.
- **Live scoring has a materially new first-view product shape:** PR #331 persisted shared 8-first/9-first discipline, PR #333 made the rack ledger, running team score, and aligned team-owned W/L submissions the canonical live scoring presentation, and PR #334 added direct per-rack own-team correction without undoing later racks plus exact mismatch/pending state indicators. This remains one `/scorecard/live` surface. #326 owns final War Games/two-phone proof.
- **Rack-ledger backlog needs state reconciliation:** #322 is complete/closed; #323 implementation is merged with remaining War Games parity delegated to #326; #324 implementation is merged in #334; #325's exact-column mismatch/pending presentation is substantially shipped in #333/#334 and should be reconciled against its remaining acceptance criteria; parent #321 should distinguish shipped slices from final QA instead of showing all children untouched.
- **Known navigation-copy gap remains:** current `src/appShell.js` still labels `/demo` as `Demo` while the canonical public product name is **Try a League Night**. #249 already owns this; do not create a duplicate issue.
- **Two-action reachability remains clean for the affected current-main surfaces:** `/admin/players` is directly discoverable from authorized Profile tools; `/scorecard` is direct navigation and leads into `/scorecard/live`; `/availability` remains reachable through Teams; #330 explicitly requires its recruiting directory to remain within the normal Teams reachability envelope.
- No newly merged change created an orphaned route or duplicate page. The principal duplication risk is semantic: normal recruiting/player discovery must remain `/teams`/#330 while privileged mutations remain `/admin/players`/#316.
- #238 remains open until every current renderer/control is mapped. #239 remains open until role-aware navigation reachability is represented by deterministic regression coverage rather than only spot checks.

## Known catalog work

- #237 — Product Librarian contract. Completed by PR #242.
- #238 — exhaustive user-story/page/function/control inventory and ongoing catalog maintenance.
- #239 — deterministic <=2-click role-aware navigation/reachability audit and regression coverage.
- #240 — recurring Product Librarian cadence. Completed; subsequent cycles leave evidence in #238/#239 and this catalog.
- #249 — Try a League Night shared-navigation naming plus contextual feedback closure work.
- #250 — original five-route state cleanup is shipped; final cross-route consistency/shared-pattern audit remains. PR #318 is now adjacent shipped Availability recovery evidence, not an open PR.
- #169 — remaining `/admin/operations` signals after availability, lineup-deadline, dual-score mismatch aging, started-match aging, and selected-player payment eligibility shipped.
- #316 — canonical `/admin/players` validation story. PRs #320/#327/#329 shipped role, eligibility, and roster-exception slices; retain only validation/findings that remain genuinely incomplete.
- #321 — rack-ledger live-scoring epic. #322 is complete; #323 implementation is on `main`; #324 shipped in PR #334; #325 should be reconciled against #333/#334; #326 owns final War Games/two-phone proof.
- #330 — normal player/captain sortable player directory for recruiting and dated substitute discovery under `/teams`.
- #138 — dated availability/check-in and fast captain substitute discovery; implementation must reconcile existing round-level assumptions rather than silently layering a second availability model.

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

The catalog should describe current product reality. Missing capabilities belong in linked issues with clear state.

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
| `/profile` | Player | Sign in and manage identity, memberships, season history, and role-specific tool discovery | Canonical identity/profile surface. PR #301 completed signed-out/loading/empty/error recovery and narrow-phone history reflow, closing #298 and #299. Authorized admin discovery from PR #297 remains intact |
| `/teams` | Player / captain | Find, join, create, and manage teams and roster relationships | Canonical team/roster surface; phone-width table reflow shipped in PR #290 / #131. Non-happy-path state cleanup remains focused in #305 |
| `/schedule` | Public visitor / player / captain | See the current/upcoming league night and enter the appropriate next workflow | Canonical schedule/current-night surface; #133 |
| `/availability` | Player / captain | Declare and review league-night availability | Canonical availability surface; substitute-discovery improvements remain under #138 |
| `/lineup` | Captain | Build and submit the team's lineup for a matchup | Canonical captain lineup surface |
| `/scorecard` | Player | Find an eligible generated match to score | Canonical score-selection surface; signed-out/no-match/error recovery shipped in PR #277 |
| `/scorecard/live` | Player | Operate active team-owned rack scoring | Canonical live-scoring surface; reduced navigation shell is an intentional task-focus exception |
| `/messages` | Player / captain | Coordinate league/team/matchup/direct communication without sharing phone numbers | Canonical communication surface; non-happy-path recovery shipped in PR #285 / #281 |
| `/standings` | Public visitor / player | View team and individual standings and season results | Canonical standings surface. PR #302 distinguishes loading, legitimate no-season, empty, and load-failure states with direct recovery. Historical season selection remains #180 |
| `/trades` | Player / captain / admin exception | Manage player trade proposals, responses, and approvals | Canonical trade workflow |
| `/prizes` | Public visitor / admin | View purse/payout state; administer prize configuration where authorized | Shared public/admin surface; role/function separation still needs exhaustive review under #238 |
| `/season-setup` | League admin / director | Configure and publish a season | Canonical season-configuration/publishing surface |
| `/admin/operations` | League admin / director | See readiness, exceptions, prioritized actions, and operational health | Canonical admin operations/triage surface. Shipped in PRs #292-#294; role-aware discovery from Profile shipped in PR #297; PR #304 added lineup-deadline warnings/critical actions; PR #307 added aged dual-score mismatch warning/critical actions. #169 remains open for remaining operational signals |
| `/messages/moderation` | Moderator / league admin | Review and resolve reported messages | Canonical moderation surface; intentionally role-restricted |
| `/demo` | Public visitor / tester | Guided **Try a League Night** product test drive using fictional, non-authoritative data | Canonical public demo entry. Guided flow shipped under #249/#263; shared navigation still says `Demo`, and contextual feedback remains under #113/#172 |
| `/sandbox/captain` | Tester / sandbox user | Practice fictional team formation, roster churn, availability, and lineup work | Canonical captain practice drill; #263 |
| `/sandbox/player` | Tester / sandbox user | Practice fictional team-owned scoring, mismatch/reconciliation, confirmation, and finalization | Canonical player scoring drill; #113 |
| `/health`, `/health/environment` | Internal / diagnostic | Verify Worker/environment readiness without exposing secrets | Explicit normal-navigation exception |

## Reconciled story/function mappings

| Audience | User outcome / capability | Canonical page | State | Story / proof | Discoverability notes |
| --- | --- | --- | --- | --- | --- |
| Public visitor / player / captain | Find tonight's round and matchup context | `/schedule` | Implemented | #133 | Direct desktop navigation; Tonight is in the mobile dock |
| Player | Sign in, manage profile/history, recover from signed-out/error states, and discover authorized admin tools | `/profile` | Implemented current slice | #8, #250, PRs #297/#301 | Profile is a direct shared-nav destination; admin links appear only after the existing admin authorization probe |
| Player / captain | Find/create/join/manage team relationships | `/teams` | Implemented core flow; recovery states partial | #131, #181, #182, #305, PR #290 | Teams remains the canonical roster/membership home; league-night links are secondary shortcuts; #305 owns signed-out/loading/empty/failure presentation |
| Player / captain | Mark league-night availability | `/availability` | Implemented | #13, #138, PR #274 | Teams -> Mark availability remains within two deliberate actions |
| Captain | Submit a blind ordered lineup | `/lineup` | Implemented | #13, #139, #156, PR #271 | Teams -> Build lineup remains within two deliberate actions |
| Player | Pick an eligible match and recover from no-match/session/load states | `/scorecard` | Implemented | #141, #250, PR #277 | Score is a direct shared-nav destination; recovery points to Profile, Schedule, Teams, or Retry |
| Player / team member | Enter, reconcile, confirm, and finalize rack scoring | `/scorecard/live` | Implemented core flow | #14, #73, #229 | Reduced shell is intentional during scoring; return path remains required |
| Public visitor / player | View current standings and understand loading/no-season/load-failure states | `/standings` | Implemented current-state recovery; history still open | #16, #17, #180, #250, PRs #272/#302 | Desktop nav is direct; mobile menu is <=2 actions; no-season recovery points to Rules and failures expose Retry |
| Player / captain | Coordinate without sharing phone numbers and recover from communication non-happy paths | `/messages` | Implemented | #76, #250, #281, PR #285 | Messages is a direct shared-nav destination |
| League admin / director | Configure and publish the season | `/season-setup` | Implemented core setup | #12 | Profile -> Season setup is <=2 actions for an authorized admin |
| League admin / director | See readiness and operational exceptions without querying Supabase | `/admin/operations` | Partial but shipped and discoverable | #168, #169, #239, PRs #292-#294/#297/#304/#307 | Profile -> Operations is <=2 actions after role authorization; lineup-deadline actions link to `/lineup`; mismatch-aging actions link directly to `/scorecard` |
| Moderator / league admin | Resolve reported chat messages | `/messages/moderation` | Implemented | #80, #239, PR #297 | Authorized admins can discover Moderation through Profile; moderator-only access remains an explicit role exception |
| Public visitor / tester | Learn the league through a safe guided test drive | `/demo` | Partial | #249, PR #265 | Route is discoverable, but shared navigation label remains stale (`Demo`); contextual feedback remains #113/#172 |
| Tester / captain | Practice team formation and lineup work without production writes | `/sandbox/captain` | Implemented | #263, PR #264 | One action from `/demo`; explicit fictional/non-authoritative exception |
| Tester / player | Practice dual scoring without production writes | `/sandbox/player` | Implemented core drill | #113 | One action from `/demo`; explicit fictional/non-authoritative exception |

## Current librarian findings

### 2026-08-11

- **Operations readiness expanded twice without changing page ownership:** PR #304 added current-round lineup counts plus warning/critical lineup-deadline action cards; PR #307 then added aged dual-score mismatch warnings/critical escalation. `/admin/operations` remains the canonical league-readiness/exception surface; direct links to `/lineup` and `/scorecard` preserve canonical execution ownership and satisfy the two-action discovery model rather than duplicating those workflows inside Operations.
- **Teams remains the one unfinished major route-state slice:** #305 owns signed-out/loading/empty/expired-session/failure presentation on `/teams`; no duplicate team or registration surface should be created for that work.
- **Known navigation-copy gap remains:** current `src/appShell.js` still labels `/demo` as `Demo` while the canonical public product name is **Try a League Night**. #249 already owns this; do not create a duplicate issue.
- **No new routes or duplicate surfaces** were introduced by PRs #304/#307.
- #238 remains open until every current renderer/control is mapped. #239 remains open until role-aware navigation reachability is represented by a deterministic regression graph/test rather than only spot checks.

## Known catalog work

- #237 — Product Librarian contract. Completed by PR #242.
- #238 — exhaustive user-story/page/function/control inventory and ongoing catalog maintenance.
- #239 — deterministic <=2-click role-aware navigation/reachability audit and regression coverage.
- #240 — recurring Product Librarian cadence. Completed; subsequent cycles leave evidence in #238/#239 and this catalog.
- #249 — Try a League Night shared-navigation naming plus contextual feedback closure work.
- #250 — route-state cleanup. Score, Messages, Profile, and Standings recovery slices are shipped; #305 owns the remaining Teams slice plus final shared-state consistency review.
- #169 — remaining `/admin/operations` signals after availability, lineup-deadline, and dual-score mismatch aging shipped.

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

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
- **Tester / sandbox user** — disposable War Games/demo behavior used for learning and validation, never authoritative production state.
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
| `/schedule` | Public visitor / player / captain | See the current/upcoming league night, round, matchup, date/table context, and enter the appropriate next workflow | Canonical current-night/schedule home; added by #133 / commit `cb57d3a` |
| `/availability` | Player / captain | Declare and review league-night availability | Canonical availability surface; captain substitute-discovery improvements tracked by #138 |
| `/lineup` | Captain | Build and submit the team's lineup for a matchup | Canonical captain lineup surface |
| `/scorecard` | Player | Find an eligible generated match to score | Canonical score-selection surface |
| `/scorecard/live` | Player | Operate the active team-owned rack scoring flow | Canonical live scoring surface; reduced navigation shell is intentional during scoring |
| `/messages` | Player / captain | Coordinate league/team/matchup/direct communication without phone-number sharing | Canonical communication surface |
| `/standings` | Public visitor / player | View team and individual competitive standings | Canonical standings surface; season selection/history tracked by #180 |
| `/trades` | Player / captain / admin exception | Manage player trade proposals, responses, and approvals | Canonical trade workflow |
| `/prizes` | Public visitor / admin | View purse/payout state; administer prize configuration where authorized | Shared public/admin surface; role/function separation still requires audit under #238 |
| `/season-setup` | League admin / director | Configure and publish a season | Canonical season-configuration/publishing surface |
| `/messages/moderation` | Moderator / league admin | Review and resolve reported messages | Canonical moderation surface; intentionally role-restricted |
| `/demo`, `/sandbox/*` | Tester / sandbox user | Practice and validate disposable league workflows | Explicit non-authoritative product exception; tester stories live under #113/#249 |
| `/health`, `/health/environment` | Internal/diagnostic | Verify Worker/environment readiness without exposing secrets | Explicit normal-navigation exception |

### Planned / in-flight surfaces

Do not catalog a proposed route as shipped until it reaches `main`.

| Proposed route | Intended audience | Intended canonical purpose | Current state |
| --- | --- | --- | --- |
| `/admin/operations` | League admin / director | League readiness, exception triage, action queue, and operational health | Draft PR #179 / story #169. Librarian review requires a role-aware Admin entry within <=2 navigation actions rather than hiding it behind Messages -> Moderation |

## Reconciled story/function mappings

This table is intentionally incremental. #238 expands it until all meaningful stories and controls are represented.

| Audience | User outcome / capability | Canonical page | State | Story / proof | Discoverability notes |
| --- | --- | --- | --- | --- | --- |
| Public visitor / player / captain | Find tonight's round and matchup context quickly | `/schedule` | Complete initial slice | #133, commit `cb57d3a` | Desktop primary navigation exposes Schedule; mobile dock exposes Tonight |
| Player / captain | Find/create/join/manage team relationships | `/teams` | Partial / actively evolving | #131, #181, #182 | Teams is the canonical roster/membership home; league-night shortcuts are secondary links only |
| Player / captain | Mark league-night availability | `/availability` | Implemented, UX still evolving | #13, #138 | Reachable from Teams/current-night flows; should remain a distinct function rather than being absorbed into Teams |
| Captain | Submit a blind ordered three-player lineup | `/lineup` | Implemented | #13, #139, #156 | Human-readable matchup selection; canonical captain action |
| Player | Pick an eligible generated match without technical IDs/tokens | `/scorecard` | Implemented | #141 | One-tap Score destination in shared navigation |
| Player / team member | Enter, reconcile, confirm, and finalize rack scoring | `/scorecard/live` | Implemented core flow | #14, #73, #229 | Reduced shell is an intentional task-focus exception; clear return path required |
| Public visitor / player | Switch quickly between team and individual standings | `/standings` | Implemented current view; history still open | #16, #17, #180 | Canonical standings page; no separate team/player standings pages should be created |
| Player / captain | Coordinate without sharing phone numbers | `/messages` | Implemented core communication | #76 and children | Canonical communication page; moderation remains separate by role |
| League admin / director | Configure and publish the season | `/season-setup` | Implemented core setup | #12 | Admin-only canonical configuration page; operational triage should not accumulate here |
| League admin / director | See what needs attention across the running league | `/admin/operations` | In flight | #168, #169, draft PR #179 | Must become canonical admin home and satisfy <=2-click admin discoverability before story is considered complete |

## Current librarian findings

### 2026-08-11 review cycle

- **Resolved during the cycle:** Schedule/current-night had no canonical page and `/teams` had temporarily become the league-night hub. Another implementation lane delivered `/schedule` on current `main` via #133 while this review was in progress. The catalog now restores canonical ownership: Teams owns team/roster relationships; Schedule owns current-night context; Availability, Lineup, Score, and Messages keep their own functional homes.
- **Open / in-flight:** draft PR #179 proposes `/admin/operations` but initially makes it reachable through chat moderation. That path can exceed the two-click rule. A librarian review comment requests one role-aware Admin entry/group and makes Operations the canonical admin home instead of scattering operational functions across Moderation and Season Setup.
- **Backlog hygiene:** no duplicate Schedule issue was created because #133 already owned the missing capability and was completed during the audit.
- **Next exhaustive work:** #238 must continue through every renderer/control and #239 must formalize the navigation graph/regression check so future routes cannot silently become unreachable.

## Known catalog work

- #237 — establish the Product Librarian continuous information-architecture loop. Completed by PR #242.
- #238 — perform the first exhaustive user-story/page/function inventory and populate this catalog.
- #239 — build/enforce the <=2-click navigation/reachability audit.
- #240 — wire the Product Librarian into recurring autonomous review and prove repeated cycles.

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

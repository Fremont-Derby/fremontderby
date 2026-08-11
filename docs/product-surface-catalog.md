# Fremont Derby Product Surface Catalog

This document is the canonical index connecting **audiences -> user stories -> functions -> pages/routes**. GitHub issues remain the durable source for individual story requirements and acceptance criteria; this catalog makes the overall product shape inspectable.

The Product Librarian / Information Architecture agent owns continuous reconciliation of this file. See `.github/agents/product-librarian.agent.md`.

> Baseline note: this scaffold establishes the catalog contract and current top-level route registry. Issue #238 owns the first exhaustive function-by-function and story-by-story inventory.

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

- **Public visitor** — can understand the league, rules, public teams/standings/prizes, and how to join.
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

This is the initial route-level classification from the current README/product structure. #238 must validate each row against `src/router.js`, page renderers, controls, and live behavior, then add function-level mappings and story links.

| Route / surface | Audience/group | Distinct primary purpose | Catalog status |
| --- | --- | --- | --- |
| `/` | Public visitor | Understand Fremont Derby and find the next appropriate league action | Needs exhaustive story/function audit (#238) |
| `/rules` | Public visitor / player | Read the authoritative user-facing league rules | Needs exhaustive story/function audit (#238) |
| `/profile` | Player | Sign in and manage the player's own identity/profile state | Needs exhaustive story/function audit (#238) |
| `/teams` | Player / captain | Find/join/manage teams and roster relationships | Needs overload/function audit (#238) |
| `/availability` | Player / captain | Declare and review league-night availability | Needs exhaustive story/function audit (#238) |
| `/lineup` | Captain | Build and submit the team's lineup for a matchup | Needs exhaustive story/function audit (#238) |
| `/scorecard` | Player | Find an eligible match to score | Needs exhaustive story/function audit (#238) |
| `/scorecard/live` | Player | Operate the active team-owned rack scoring flow | Needs exhaustive story/function audit (#238) |
| `/messages` | Player / captain | Coordinate league/team/matchup/direct communication without phone-number sharing | Needs exhaustive story/function audit (#238) |
| `/standings` | Public visitor / player | View team and individual competitive standings | Needs exhaustive story/function audit (#238) |
| `/trades` | Player / captain / admin exception | Manage player trade proposals, responses, and approvals | Needs exhaustive story/function audit (#238) |
| `/prizes` | Public visitor / admin | View purse/payout state; administer prize configuration where authorized | Needs role/function separation audit (#238) |
| `/season-setup` | League admin / director | Configure and publish a season | Needs exhaustive story/function audit (#238) |
| `/messages/moderation` | Moderator / league admin | Review and resolve reported messages | Needs route/navigation audit (#238, #239) |
| `/demo`, `/sandbox/*` | Tester / sandbox user | Practice and validate disposable league workflows | Explicit non-authoritative product exception; still document tester stories |
| `/health`, `/health/environment` | Internal/diagnostic | Verify Worker/environment readiness without exposing secrets | Explicit normal-navigation exception |

## Known catalog work

- #237 — establish the Product Librarian continuous information-architecture loop.
- #238 — perform the first exhaustive user-story/page/function inventory and populate this catalog.
- #239 — build/enforce the <=2-click navigation/reachability audit.
- #240 — wire the Product Librarian into recurring autonomous review.

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

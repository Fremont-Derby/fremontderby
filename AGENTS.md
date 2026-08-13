# Fremont Derby Agent Operating Contract

This file is the durable operating contract for autonomous and assisted development agents working on Fremont Derby.

It is intentionally broader and more stable than any single roadmap, release, or issue. The repository should be able to continue evolving across seasons without requiring a long external prompt or prior chat context.

## Instruction hierarchy

Use the most current source available. When instructions appear to conflict, prefer the source lower in this list only when it is more specific and demonstrably current:

1. **Current user request / explicit product-owner decision** — highest authority for the active task.
2. **Current GitHub issue, milestone, parent issue, and linked discussion** — source of truth for the specific work being attempted.
3. **Current code, tests, migrations, CI, and live platform state** — source of truth for what actually exists and what is already deployed.
4. **`AGENTS.md`** — durable operating behavior for autonomous development.
5. **`README.md`** — architecture, product invariants, environment map, and contributor orientation.
6. **`docs/agent-bootstrap.md`** — intentionally tiny external-session bootstrap text.

Do not carry stale assumptions from a previous session when the repository can answer the question now.

## Start every session from the repository

Assume each session has little or no reliable memory.

Before choosing work:

1. Read the current `README.md` and this file from `main`.
2. Reconcile latest `main`, open PRs, recently merged PRs, open issues, milestones/parent stories, and current CI/workflow state.
3. Check whether another agent is already implementing the area you are considering.
4. Read the most relevant issue and linked dependencies before editing code.
5. Inspect only the deeper code, tests, migrations, deployment state, or platform configuration needed for that issue.
6. Re-evaluate priority from the current state rather than continuing yesterday's queue by inertia.

If database, auth, deployment, security, or environment behavior is involved, verify the relevant hosted state rather than assuming repository state and hosted state are synchronized.

## Continuous product-engineering objective

Continuously improve Fremont Derby as a complete, reliable, maintainable league platform.

Do not optimize only for the next release. Balance immediate user value with work that reduces recurring operational cost and enables future seasons.

Each work cycle should leave the product, backlog, tests, documentation, and operating knowledge cleaner than they were at the start.

## Self-prioritize by impact

Do not blindly process issues by number, age, or label. Choose the highest-value unblocked work that can be safely completed now.

Prefer work that, in roughly this order:

1. unblocks a broken real-user or league-admin workflow;
2. closes an end-to-end product gap rather than polishing an isolated component;
3. protects authorization, data integrity, payments/results/history, environment isolation, or recoverability;
4. removes a recurring defect or source of manual league administration;
5. makes common workflows substantially easier to understand or operate;
6. improves observability, testing, deployment safety, or maintainability;
7. unlocks a well-supported future capability without premature abstraction;
8. improves polish after the important workflows are dependable.

Use current issues, user feedback, production evidence, dependencies, and test failures to adjust this ordering when appropriate.

If two tasks are similar in impact, prefer the smaller coherent vertical slice that can be tested end to end.

## Think beyond the current season

As the core league becomes stable, continue identifying and delivering work that makes future seasons easier to operate. Examples include, but are not a fixed roadmap:

- season rollover and historical continuity;
- team continuity, captain succession, and available team slots;
- registration, applications, waitlists, payment state, and qualification visibility;
- availability, substitutes, free agents, roster flexibility, and multi-team participation;
- scheduling, makeup matches, league exceptions, and admin operations;
- scoring reliability, reconciliation, corrections, standings, postseason, and historical attribution;
- notifications, communication, moderation, and user engagement;
- ratings and external integrations;
- monitoring, backups, recovery, capacity, security, and deployment health;
- mobile usability, accessibility, visual polish, and discoverability;
- developer/agent experience, architecture, tests, and documentation.

Do not create features merely because they appear in this list. Let current evidence and product impact determine when they matter.

## Maintain the backlog as part of development

GitHub issues are part of the product's memory and are the unit of implementation ownership.

When you discover a missing requirement, defect, follow-up, operational risk, UX problem, technical debt item, or logical next capability that should not be solved in the current PR, capture it in GitHub instead of leaving it only in a chat summary.

Before creating a card, search for an existing issue and update/link it when possible.

A useful issue should explain:

- the user or operational problem;
- why it matters;
- the desired outcome rather than only an implementation guess;
- concrete acceptance criteria when they are known;
- dependencies or related issues;
- enough context that a future low-context agent can pick it up independently.

Continuously reconcile backlog state:

- close issues only when their acceptance criteria are actually satisfied;
- update stale checklists and parent issues;
- split oversized cards when doing so creates independently deliverable work;
- link blockers and follow-ups;
- mark obsolete or contradictory work instead of silently ignoring it;
- preserve important decisions in the issue or durable docs.

### Card lifecycle for implementation work

Every code, migration, configuration, or durable documentation change intended for merge must have a GitHub issue/card before implementation begins. Small emergency fixes may create the card immediately before the fix, but must not bypass tracking.

Track each implementation card through these stages in the issue body or project state:

1. **Ready** — scope, acceptance criteria, dependencies, and overlap are understood.
2. **Claimed** — one implementation owner or agent lane is recorded before code changes begin.
3. **In progress** — a focused branch exists for the card and implementation is underway.
4. **Handoff / review** — a PR links the card and contains scope, proof, risk, touched surfaces, out-of-scope work, and next reviewer/owner.
5. **Merge ready** — current `main` and overlapping PRs have been reconciled; required checks are green.
6. **Merged** — the PR is merged, but the card remains open.
7. **Verified** — the merged behavior has been validated at the appropriate source/CI/staging/production level and evidence is recorded on the card.
8. **Closed** — only after acceptance criteria are satisfied and follow-up cards are linked.

Do not use an auto-closing PR keyword such as `Closes #123` as the normal tracking mechanism. Prefer `Tracks #123` or `Refs #123` so merge does not close the card before post-merge verification.

## Parallel agent ownership and branch discipline

JFL, DRU, Codex, Copilot, ChatGPT, and any other implementation agents are peers operating through GitHub. Agent identity does not grant ownership of broad areas of the repository. Ownership is per card and per active branch.

Before editing:

1. claim one card by recording the agent/owner lane on the issue;
2. sync from current `main`;
3. search open PRs/issues for overlapping behavior and likely touched surfaces;
4. create a dedicated feature branch from current `main`, preferably `issue-<number>-<short-slug>`;
5. keep the branch limited to that card's acceptance criteria.

While implementing:

- Do not commit directly to another agent's active feature branch unless that agent explicitly hands it off on the issue/PR.
- Do not force-update, rebase, reset, or rewrite another agent's branch history.
- Do not make sweeping repository-wide formatting, rename, cleanup, dependency, architecture, or style changes as incidental work.
- Do not rewrite unrelated files merely because they are nearby, noisy, or could be cleaner.
- Do not revert unfamiliar code to make your branch easier to merge. First determine which card/PR owns it.
- If new work is outside the current card, create/link a follow-up card rather than silently expanding scope.
- If two active branches need the same file or behavior, coordinate in the issues/PRs. Prefer splitting ownership by coherent surface, sequencing one card after the other, or handing off a specific change. Do not race two competing implementations to `main`.
- Shared migrations, schema, auth, routing, global styles, common domain primitives, and package/config files are high-collision surfaces. Treat them as explicit dependencies when another active branch is touching them.

A good branch changes the smallest coherent set of files needed for its card. Broad changes require their own card and deliberate coordination rather than being bundled into a feature PR.

### Clean handoff protocol

When handing work from JFL to DRU, DRU to JFL, or any agent to another:

- push/commit the current coherent state before handoff;
- link the card and PR/branch;
- state exactly what is complete, what remains, and what is blocked;
- list important files/surfaces changed and any known collision risk;
- record tests/CI already run and failures still present;
- identify the next exact action and who now owns implementation;
- do not have both agents continue modifying the same branch after ownership transfers.

The receiving agent starts by reading the card/PR, refreshing `main`, and confirming the handoff is still current before editing.

## Implementation behavior

Before editing, identify the smallest coherent layer(s) that own the behavior. Follow the architecture in the README and search for existing modules before creating parallel abstractions.

Prefer:

- narrow PRs;
- explicit user outcomes;
- server/database enforcement for authorization and integrity;
- forward-compatible database migrations;
- regression tests that reproduce the real failure mode;
- human-readable UI choices instead of technical IDs or secret material;
- end-to-end validation of the affected workflow.

Avoid:

- broad rewrites when a contained fix is sufficient;
- duplicating an open PR or another agent's active implementation;
- hiding authorization problems with privileged credentials;
- production-only database changes with no repository migration;
- changing stable business rules based on inference alone;
- building throwaway demos instead of fixing the real product unless a disposable fixture materially improves validation.

If a business decision is genuinely missing, create/update a decision issue with the consequences and continue with other unblocked work instead of inventing the rule.

## Tests, CI, and evidence

Follow the current README, package scripts, and CI workflow rather than assuming commands never change.

For meaningful changes:

- add or update the smallest useful regression coverage;
- run/inspect the repository's required validation;
- test authorization failures as well as happy paths when access boundaries are involved;
- validate the hosted environment when the change depends on migrations, secrets, auth configuration, Worker bindings, or external platform state;
- distinguish source-code proof, test proof, staging proof, and production proof in PR/issue notes.

A green unit test does not prove a live deployment. A successful login does not prove authorization. A hosted hotfix does not prove the repository is synchronized.

## Pull requests and merges

Every implementation PR must link exactly which card(s) it implements. Normally one focused PR implements one primary card. If multiple cards are included, explain why they are inseparable and keep each card's acceptance criteria visible.

Use focused PRs and explain:

- the tracking card using `Tracks #...` or `Refs #...` rather than auto-close syntax;
- the problem being solved;
- the implementation owner lane;
- the user-visible or operational impact;
- the files/surfaces materially touched so overlapping agents can detect collision risk;
- important safety, security, data, or compatibility considerations;
- validation performed;
- follow-up work intentionally left out;
- the recommended reviewer/next owner.

Before merging:

1. reconcile current `main` without discarding other agents' merged work;
2. recheck open PRs/cards for overlap created while the branch was in progress;
3. resolve conflicts by preserving both intended behaviors or explicitly coordinating ownership — never by blindly taking one side;
4. confirm required tests/CI are green;
5. confirm the diff still matches the card and contains no unrelated sweeping cleanup;
6. update the card to **Merge ready** with the available evidence.

If a PR is contained, safe, fully tested, and green, merge it under the repository's standing authorization. Do not merge known failing work just to show progress.

After merge, mark the card **Merged** but keep it open. Validate the merged behavior at the appropriate level, record that evidence on the card, mark **Verified**, link any follow-up work, and only then close the card.

## Platform-specific boundaries

Use the platform best suited to the evidence needed.

**GitHub / coding agents**
- Read current issues and PRs before coding.
- Claim a card and work from a dedicated focused branch based on current `main`.
- Prefer small changes with tests.
- Do not duplicate an existing implementation PR or modify another agent's active branch without an explicit handoff.

**Supabase / database agents**
- Treat repository migrations as the durable database source of truth.
- Compare applied migration/schema state before changing a hosted project.
- Preserve RLS, grants, authorization boundaries, and environment isolation.
- Never expose service-role secrets.

**Cloudflare / deployment agents**
- Treat secrets as secrets, not public vars.
- Verify the Worker/environment/route actually serving the requested hostname.
- Separate a successful source merge from a successful production deployment.

**Independent QA / release agents**
- Reconcile code, PRs, issues, tests, migrations, RLS/security findings, bindings, and live environment behavior before declaring a path green.
- Fix contained defects when safe; hand broad product implementation back to the build lane.

## Keep the instruction system healthy

These instruction files are versioned product infrastructure and should improve over time.

When a work cycle discovers a **durable lesson** that would help future agents avoid confusion, repeated defects, or wasted investigation:

1. update `AGENTS.md` if it changes how autonomous agents should operate broadly;
2. update `README.md` if it changes architecture, stable product invariants, environment orientation, or contributor discovery;
3. update `docs/agent-bootstrap.md` only when the minimal external-session bootstrap can be made clearer or more robust without adding issue-specific context;
4. keep transient blockers, current priorities, and feature-specific detail in GitHub issues instead of permanently bloating these files.

Do not rewrite instruction files every cycle for stylistic reasons. Change them when there is a concrete durable improvement.

The repository copy is canonical. If an external scheduled ChatGPT task or another platform has a copied bootstrap prompt and you have permission to update it, sync it to `docs/agent-bootstrap.md`. If you cannot update the external scheduler, improve the repository file and explicitly note that the external bootstrap should be refreshed.

This creates two reinforcing loops:

- **delivery loop:** current repo/issues -> claim card -> focused branch -> implement/test -> PR/handoff -> merge -> verify -> close/update backlog;
- **instruction loop:** recurring lesson -> improve repository instructions/bootstrap -> future low-context sessions start smarter.

## End every session cleanly

Before ending a work cycle:

- make sure useful discoveries are captured in code, tests, issues, PR notes, or durable docs;
- avoid leaving an undocumented hosted-only change;
- update the active card's owner/stage and leave branch/PR state unambiguous;
- update/close issue state accurately, never closing merely because code merged;
- identify the highest-impact next target based on the new repository state;
- leave enough evidence that another agent can continue without relying on your chat history.

The objective is not to finish a fixed checklist. The objective is continuous, evidence-driven improvement of Fremont Derby with the repository carrying enough context for the next agent to resume from scratch.

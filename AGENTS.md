## Do work!

When directed to **Do work!**, follow `docs/do-work-protocol.md` (canaries first, verified ships only).

# Fremont Derby Agent Operating Contract

This file is the durable operating contract for autonomous and assisted development agents working on Fremont Derby.

It is intentionally broader and more stable than any single roadmap, release, or issue. The repository should be able to continue evolving across seasons without requiring a long external prompt or prior chat context.

## Instruction hierarchy

Use the highest-authority current source available. A more specific source may add narrower requirements, but it must not silently override or weaken a higher-authority source:

1. **Current user request / explicit product-owner decision** — highest authority for the active task.
2. **Current GitHub issue, milestone, parent issue, and linked discussion** — source of truth for the specific work being attempted.
3. **Current code, tests, migrations, CI, and live platform state** — source of truth for what actually exists and what is already deployed.
4. **`AGENTS.md`** — authoritative repository-owned operating contract for every autonomous development agent.
5. **`.github/agents/*.agent.md` and `.github/instructions/*.instructions.md`** — role-, lane-, or surface-specific additions that must remain consistent with `AGENTS.md`.
6. **`README.md`** — architecture, product invariants, environment map, and contributor orientation.
7. **`docs/agent-bootstrap.md`** — intentionally tiny external-session bootstrap text.

If a lane or specialist guide conflicts with `AGENTS.md`, follow `AGENTS.md` and record the conflict for correction. Do not carry stale assumptions from a previous session when the repository can answer the question now.

## Start every session from the repository

Assume each session has little or no reliable memory.

Before choosing work:

1. Read the current `AGENTS.md` and `README.md` from `main`. If operating as JFL or DRU, also read both `.github/agents/jfl.agent.md` and `.github/agents/dru.agent.md`; the peer guide is required reading, not optional reference material.
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

### Card label contract

Labels make ownership and lifecycle state filterable across the backlog; the issue body and comments remain the evidence. Every open implementation card must carry:

- exactly one `agent:*` label: current implementation owner, or `agent:unclaimed`;
- exactly one `stage:*` label matching the lifecycle above;
- exactly one `priority:p0` through `priority:p3`;
- at least one `area:*` label;
- optional coordination flags such as `blocked`, `collision-risk`, `human-required`, or `handoff:*`.

New implementation cards start with `agent:unclaimed`, `stage:ready`, and `priority:p2`. Before coding, replace `agent:unclaimed` with the accepting owner, set the correct priority and area, then advance `stage:claimed` to `stage:in-progress` when the focused branch exists.

**Human-required exception:** cards labeled `human-required` are owned by a human/project author for dashboard-only work (Cloudflare, Supabase SQL editor, identity provider consoles). They still need `stage:*`, `priority:*`, and `area:*`. They do **not** require an `agent:*` implementation owner while blocked on a human. Agents may automate steps only when repository secrets and workflows already allow it; otherwise leave exact steps on the card and do not close it.

Lifecycle labels are mutually exclusive. Replace the previous `stage:*` label when state changes; never stack several stages or owner labels. Use `stage:merged` after merge, `stage:verified` only after evidence is recorded, and `stage:closed` immediately before closing the issue. PRs reference the card but do not duplicate its lifecycle labels.

The canonical names, colors, and descriptions live in `.github/collaboration-labels.json` and are synchronized by `.github/workflows/sync-collaboration-labels.yml`. Agents may not invent near-duplicate owner or stage labels. Change the manifest through a tracked governance PR when the system needs to evolve.

Do not use an auto-closing PR keyword such as `Closes #123` as the normal tracking mechanism. Prefer `Tracks #123` or `Refs #123` so merge does not close the card before post-merge verification.

## Parallel agent ownership and branch discipline

JFL, DRU, Codex, Copilot, ChatGPT, and any other implementation agents are peers operating through GitHub. Agent identity does not grant ownership of broad areas of the repository. Ownership is per card and per active branch.

Before editing:

1. claim one card by recording the agent/owner lane on the issue;
2. sync from current `main`;
3. search open PRs/issues for overlapping behavior and likely touched surfaces;
4. create a dedicated feature branch from current `main`; JFL uses `jfl/issue-<number>-<short-slug>`, DRU uses `dru/issue-<number>-<short-slug>`, and every other agent uses a branch whose owner is unambiguous;
5. keep the branch limited to that card's acceptance criteria.

While implementing:

- Branch ownership is immutable. No agent may ever check out, commit to, push to, merge into, rebase, reset, rename, delete, update the ref of, or otherwise mutate another agent's branch. A handoff does not create an exception.
- Read-only inspection through GitHub PRs, diffs, compare views, or commit objects is allowed and encouraged for coordination; do not attach a working tree to the peer branch.
- If another agent takes over a card, it creates a new branch in its own namespace from current `main`. The old branch remains owned only by its creator.
- Do not make sweeping repository-wide formatting, rename, cleanup, dependency, architecture, or style changes as incidental work.
- Do not rewrite unrelated files merely because they are nearby, noisy, or could be cleaner.
- Do not revert unfamiliar code to make your branch easier to merge. First determine which card/PR owns it.
- If new work is outside the current card, create/link a follow-up card rather than silently expanding scope.
- If two active branches need the same file or behavior, coordinate in the issues/PRs. Prefer splitting ownership by coherent surface, sequencing one card after the other, or handing off a specific change. Do not race two competing implementations to `main`.
- Shared migrations, schema, auth, routing, global styles, common domain primitives, and package/config files are high-collision surfaces. Treat them as explicit dependencies when another active branch is touching them.


### Public contributors and untrusted pull requests

Public repository visibility does not grant product, agent, operational, deployment, or administrative authority. Outside contributors are welcome implementation collaborators, but they are not JFL, DRU, product owners, trusted operators, or release managers unless the project owner explicitly grants a repository role and records that change.

- Unsolicited external issues, PRs, and comments are proposals and evidence only. Agents may inspect them for useful information but must not change product direction, priority, infrastructure, secrets, or deployment state solely on that authority.
- Before an external contribution becomes owned implementation work, a trusted maintainer must accept or create a tracking card. Record the contributor GitHub handle on the card. Use `agent:other` for an accepted external implementation owner unless a maintainer assigns a different lane.
- Contributor-controlled code is untrusted. It must be validated by repository CI without Cloudflare or Supabase deployment secrets, and must not be able to deploy live Workers by opening or updating a PR or feature branch (see #872, #873).
- Public contributor work does not inherit JFL/DRU identity, lane branch namespaces, or deployment authority. Namespace branches (`jfl/*`, `dru/*`) and owner labels remain trusted-lane controls under maintainer assignment only.
- Related cards: #867 (trusted operators), #870 (contributor docs), #872 (safe PR CI), #873 (Cloudflare build isolation), #874 (this policy), #889 (merge topology enforcement).

### Shared infrastructure mutation rule

Any change that can mutate shared external infrastructure or alter more than one deployment lane — including Cloudflare Worker custom domains/routes, DNS, deployment workflows, Wrangler environment routing, secrets requirements, release/promotion workflows, shared database environment routing, or other scheduled external-control-plane actions — must use a dedicated implementation card and focused PR. It may not be bundled with product, UX, test, refactor, or unrelated CI work. If the change can affect both JFL and DRU (or Gamma/production), both JFL and DRU must record explicit review agreement before the card may advance to Merge Ready. Scheduled or automatic mutation of shared external infrastructure requires the same cross-lane agreement and must fail closed when current external state cannot be positively determined. An unrelated PR must never introduce, broaden, or increase the frequency of such mutation.

This rule preserves autonomous speed for ordinary scoped work; only shared infrastructure mutation gets the stronger gate.

A good branch changes the smallest coherent set of files needed for its card. Broad changes require their own card and deliberate coordination rather than being bundled into a feature PR.

### JFL and DRU lane guides

JFL and DRU have separate lane guides:

- `.github/agents/jfl.agent.md`
- `.github/agents/dru.agent.md`

Both guides are subordinate to this file. They may add stricter lane-specific habits but may not redefine product rules, relax safety requirements, claim broad repository ownership, or override this operating contract.

JFL and DRU must read both lane guides before claiming work. Cross-reading exists to find useful practices and detect drift, not to create shared ownership. A useful peer practice may be followed immediately only when it is compatible with this file and the active card; it does not become a repository-wide rule until adopted through the joint proposal process below.

Agent identity and deployment lanes are different concepts. The permanent `fremontderby-jfl` and `fremontderby-dru` branches exist to deploy their named test environments. They are owned exclusively by JFL and DRU respectively, are not general-purpose implementation branches, and are never shared mutable workspaces. JFL must never mutate `fremontderby-dru`; DRU must never mutate `fremontderby-jfl`. Normal JFL implementation uses `jfl/issue-<number>-<short-slug>` and normal DRU implementation uses `dru/issue-<number>-<short-slug>`, each created from current `main`.

### Joint JFL/DRU practice proposals

Neither JFL nor DRU may unilaterally promote its lane-specific preference into `AGENTS.md`.

1. One agent records a candidate practice in the relevant issue or PR with the problem, concrete evidence, proposed rule, and expected benefit.
2. The peer agent reviews it against `AGENTS.md`, current repository behavior, and its own lane experience, then records explicit agreement or disagreement in GitHub.
3. When both agents explicitly agree, they submit a dedicated `[AGENT-PRACTICE]` proposal card containing:
   - the problem and repeated evidence;
   - exact proposed `AGENTS.md` wording;
   - scope, tradeoffs, and risks;
   - links to JFL's and DRU's recorded agreement;
   - migration or enforcement changes, if any.
4. Adoption uses its own claimed governance card, focused branch, review, merge, and verification lifecycle. The proposal is not authoritative until the resulting `AGENTS.md` change is merged and verified.
5. If the agents disagree, keep the practice lane-local when allowed, document the disagreement, and continue without changing the top-level contract.

Do not bundle top-level instruction promotion into an unrelated feature PR.

### Clean handoff protocol

A handoff is explicit and accepted; silence never transfers ownership.

The outgoing agent must:

1. commit and push a coherent state;
2. set `stage:handoff` and add `handoff:jfl`, `handoff:dru`, or `handoff:review` as appropriate;
3. retain its current `agent:*` owner label until an incoming implementation owner accepts;
4. leave a GitHub issue or PR comment containing:
   - outgoing owner;
   - requested incoming owner or reviewer;
   - card and branch/PR;
   - completed work;
   - remaining work;
   - touched files/surfaces;
   - proof run and known failures;
   - risks, blockers, and collision concerns;
   - exact next action.

For an ownership transfer, the incoming agent reads the current card/PR and repository state through read-only GitHub views, posts explicit acceptance, replaces the outgoing `agent:*` label with its own, removes the `handoff:*` label, and creates a new branch in its own namespace from current `main` before editing. Any still-needed work is reproduced or selectively applied onto the new branch without checking out or updating the outgoing branch. The issue comment must record both the retired outgoing branch and the new incoming branch.

Branch ownership never transfers and is never transferred back. The outgoing branch remains exclusively owned by its creator even after the card owner changes. For review-only handoffs, the implementation owner label does not change; the reviewer inspects through the PR/diff, records findings and completion, and never checks out or mutates the owner's branch.

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

## Test-driven development: mandatory inner loop

For behavior-bearing code, configuration, migrations, and automation, use **RED → GREEN → REFACTOR**. The detailed contract lives in `docs/test-driven-development.md` and the card/PR templates enforce its evidence.

Before implementation or before changing production behavior:

1. identify the smallest observable behavior owned by the card;
2. add or modify the narrowest meaningful automated test or executable guard;
3. run it and prove it **fails for the expected reason** rather than syntax, fixture, environment, or unrelated failure;
4. record RED evidence in the card/PR;
5. make the smallest coherent implementation change that reaches GREEN;
6. run the focused proof and relevant regression suite;
7. REFACTOR only while the focused and regression proof remain green.

Use the test boundary that owns the behavior: **domain rules** use domain/unit tests; **authorization** uses positive/negative contract or integration tests; **API/HTTP** uses request/response tests; **database/migration** behavior uses migration/integration proof; **UI/browser** behavior uses rendered/browser/accessibility interaction tests where practical; **config/deployment** behavior uses executable guards, fixtures, dry-runs, lane assertions, or canaries that fail closed.

Do not manufacture meaningless tests. A justified exception may be recorded for **docs-only** or documentation-only edits, copy-only changes with no behavior change, purely visual polish with no stable executable assertion, or urgent live containment where delaying the safety action would increase risk. Use the narrowest meaningful substitute validation, and for emergency behavior changes add regression coverage before the card can become Verified/Closed. “Tests are inconvenient” is not an exception.

Human onion validation is the **outer acceptance loop**, not a replacement for TDD. Automated RED/GREEN/REFACTOR proves the implementation; the relevant onion gate later proves a human can actually understand and use the released behavior.

## Tests, CI, and evidence

Follow the current README, package scripts, and CI workflow rather than assuming commands never change.

For meaningful changes:

- add or update the smallest useful regression coverage;
- record RED evidence before implementation, GREEN evidence after the minimum change, and relevant regression evidence, or a justified TDD exception;
- run/inspect the repository's required validation;
- test authorization failures as well as happy paths when access boundaries are involved;
- validate the hosted environment when the change depends on migrations, secrets, auth configuration, Worker bindings, or external platform state;
- distinguish source-code proof, test proof, staging proof, and production proof in PR/issue notes.

A green unit test does not prove a live deployment. A successful login does not prove authorization. A hosted hotfix does not prove the repository is synchronized.

### Live platform verification (non-negotiable for lane/infra cards)

When the card touches hostnames, Worker envs, auth bypass, or Supabase migrations:

1. **Probe the live hostname**, not only CI. Record `/health/environment` (or equivalent) showing the expected `environment` value.
2. **DNS exists is not success.** A resolving host that reports `environment=production` on a beta/DRU/JFL URL is still failing the card.
3. **Merge is not apply.** A merged migration file on `main` does not close data cards until it is applied to the **target** database (DRU/JFL/gamma/prod as named) and re-probed.
4. **Open-auth cards** must prove an authenticated API without a bearer where intended, and must prove production/gamma still require a bearer.
5. Prefer GitHub Actions workflows that use existing `CLOUDFLARE_*` (or similar) repository secrets for domain/Worker automation over asking a human to click the same API-capable step. Inventory what secrets Actions already has before cutting a human card.
7. See `docs/platform-capabilities.md` for the current inventory of automatable vs human-only platform actions.
6. If a custom domain is attached via API, re-check public DNS and health a few minutes later; attachment acknowledgements can race propagation or wrong-Worker routing.

Close platform cards only after these live checks match acceptance criteria.

## Pull requests and merges


### Release merge topology (Gamma gate)

Normal product promotion is fail-closed:

1. Trusted implementation work merges to `fremontderby-gamma` only from JFL/DRU lane branches (`jfl/*`, `dru/*`) with an open tracking card owned by the matching lane.
2. `main` accepts normal implementation merges only from `fremontderby-gamma`.
3. Forks and unsolicited public PRs must not merge directly to `main` or claim JFL/DRU namespace authority without maintainer reassignment.

Enforcement is the required check `Release source policy / validate` plus repository rulesets (#889). Agents must not bypass this topology with force-pushes, alternate production publishers, or “temporary” direct-to-main feature merges.

Until Gamma promotion is fully required in rulesets, same-repo implementation PRs to `main` may still merge (forks remain blocked). Set `STRICT_RELEASE_SOURCE_POLICY=1` on the workflow when `main` must accept only `fremontderby-gamma`.


Every implementation PR must link exactly which card(s) it implements.

# Specialist Agent Collaboration

This document complements `AGENTS.md`. It describes how specialized agents collaborate through GitHub without requiring shared chat memory.

## Core lanes

- **Orchestrator / TPM** — reconcile state, prioritize, split/link issues, prevent duplicate work, and route work.
- **UX / Product Experience** — mobile/browser usability, accessibility, discoverability, and task completion.
- **League Admin / Ops** — season operations, registration/admin workflows, exceptions, and reduced manual administration.
- **Rules Referee** — rule consistency, edge cases, decision gaps, and rule-facing test/review work.
- **Core League / Data** — durable domain/data behavior, scoring, standings, scheduling, rosters, postseason, and integrity.
- **QA / Release / Security** — independent E2E, CI, authorization, RLS, migration, environment, and release proof.
- **Platform / SRE** — Cloudflare/Supabase infrastructure, secrets, deployment, monitoring, recovery, and capacity.
- **Public Relations / Comms** — onboarding, announcements, FAQs, help copy, release notes, and feedback synthesis.

Optional/on-demand lanes:

- **Analytics / Product Insights** — evidence-backed prioritization, workflow friction, operational metrics, and product signals.
- **Integrations / Research** — Fargo/external APIs, imports/exports, identity/provider research, and isolated integration work.

Profiles live in `.github/agents/` and refine, but do not replace, `AGENTS.md`.

## JFL and DRU are parallel peers, not shared editors

JFL and DRU may work at the same time, but they must not behave like two cursors editing the same working tree. The same rule applies to every pair of implementation agents.

Each active implementation has:

1. one GitHub card as the source of scope;
2. one recorded implementation owner or lane;
3. one focused feature branch based on current `main`;
4. one PR/handoff trail carrying proof and context forward.

No agent owns a broad repository area merely because it worked there previously. Ownership is temporary and card-specific.

## Card-first work lifecycle

Implementation begins from a card, not from a vague backlog sweep.

Use this lifecycle on every implementation card:

- [ ] **Ready** — outcome, acceptance criteria, dependencies, and overlap are understood.
- [ ] **Claimed** — one agent/owner lane is named on the card before code changes begin.
- [ ] **In progress** — focused branch created from current `main`; implementation limited to this card.
- [ ] **Handoff / review** — PR links the card and records scope, touched surfaces, proof, risk, out-of-scope work, and next owner/reviewer.
- [ ] **Merge ready** — branch reconciled with current `main`; overlapping PRs rechecked; required checks green; diff still narrow.
- [ ] **Merged** — PR merged; card intentionally stays open.
- [ ] **Verified** — merged result validated at the appropriate level and evidence recorded on the card.
- [ ] **Closed** — acceptance criteria satisfied and follow-up work linked; only now close the card.

Use `Tracks #123` or `Refs #123` in PRs. Do not normally use `Closes #123`, because the merge itself is not the final verification stage.

## Collaboration label contract

Use labels as the backlog index and the card body/comments as the durable evidence.

| Family | Cardinality | Purpose |
|---|---:|---|
| `agent:*` | Exactly one | Current implementation owner, including `agent:unclaimed` |
| `stage:*` | Exactly one | Current lifecycle stage |
| `priority:*` | Exactly one | P0 through P3 ordering |
| `area:*` | One or more | Product or technical surface |
| Coordination flags | Optional | Blocker, collision, human action, or pending handoff |

Replace mutually exclusive owner/stage/priority labels instead of stacking them. Existing cards adopt the contract when next touched; new cards default to `agent:unclaimed`, `stage:ready`, and `priority:p2`. The label manifest is repository-owned in `.github/collaboration-labels.json`; the sync workflow creates missing definitions and updates drift without deleting unrelated labels.

## Claim before code

Before JFL, DRU, or another agent starts implementation:

1. refresh current `main`;
2. inspect the target card and linked dependencies;
3. search open PRs and issues for overlap;
4. record the owner/agent lane on the card;
5. check the **Ready** and **Claimed** stages;
6. create a branch such as `issue-123-short-slug` from current `main`;
7. check **In progress**.

If another agent already owns the same behavior, do not start a competing implementation. Review it, split the card, sequence a dependent card, or request an explicit handoff.

## Branch discipline

Feature branches are work boundaries.

- One primary card per branch and PR unless multiple cards are genuinely inseparable.
- Prefer branch names that include the issue number, for example `issue-382-shared-design-tokens`.
- Start from current `main`; do not build new feature work on another agent's feature branch unless the issue explicitly records that dependency.
- Do not commit directly to another agent's active branch without a recorded handoff.
- Do not force-push, reset, rebase, or rewrite another agent's branch history.
- Do not keep long-lived personal branches containing unrelated work.
- Do not use a feature PR as a vehicle for repository-wide cleanup.

If the card grows beyond a coherent reviewable slice, split the work into linked cards and branches instead of widening the branch indefinitely.

## Collision prevention

Before touching a shared or high-churn surface, inspect active work first. High-collision surfaces include:

- Supabase migrations/schema/RLS;
- authentication and identity flows;
- routing/navigation shells;
- global/shared styles and design tokens;
- common domain primitives and scoring rules;
- shared API clients/data access helpers;
- package/config/workflow files;
- large generated or canonical data files.

If JFL and DRU both need the same surface, choose one of these patterns:

1. **Split by coherent surface** — each card owns different files/behavior with an explicit integration point.
2. **Sequence** — one card merges first; the dependent card refreshes from `main` afterward.
3. **Handoff** — current owner commits/pushes a coherent state and transfers ownership in the card/PR.
4. **Single shared card** — only when the work truly cannot be separated; still keep one branch owner at a time.

Do not solve collisions by racing two alternatives to merge or by overwriting whichever branch is older.

## No sweeping incidental changes

Agents should leave unrelated code alone.

Do not bundle these into a feature branch unless the card explicitly calls for them:

- broad formatting or lint churn;
- mass renames;
- unrelated refactors;
- dependency upgrades;
- global CSS cleanup;
- architecture rearrangement;
- repository-wide documentation rewrites;
- opportunistic fixes discovered nearby.

For useful unrelated discoveries, create/link a follow-up card. This keeps reviews understandable and prevents one agent from accidentally erasing assumptions another branch depends on.

## Clean handoff protocol

A handoff is an ownership transfer or review request, not an invitation for two agents to edit concurrently.

### Outgoing handoff

The outgoing agent commits and pushes a coherent state, sets `stage:handoff`, adds the target `handoff:*` label, and leaves a new issue or PR comment using this structure:

```markdown
### Agent handoff

- Outgoing owner:
- Requested incoming owner/reviewer:
- Card:
- Branch/PR:
- Completed:
- Remaining:
- Touched surfaces:
- Proof and known failures:
- Risks/blockers/collision concerns:
- Exact next action:
```

During an ownership transfer, the outgoing `agent:*` label remains until acceptance. For review-only work, the implementation owner never changes.

### Incoming acceptance

The incoming implementation owner must:

1. read the current card, PR, and relevant repository state;
2. verify the handoff remains current;
3. post an explicit acceptance comment;
4. replace the outgoing `agent:*` label with its own;
5. remove the `handoff:*` label and set `stage:in-progress`;
6. only then edit the handed-off branch.

After acceptance, the outgoing agent stops editing unless ownership is transferred back. A reviewer instead records findings/completion without changing the implementation owner label.

## GitHub is the communication bus

Do not depend on agent-to-agent chat history. Persist useful context in:

1. GitHub issues for current outcomes, owners, lifecycle stage, blockers, dependencies, and follow-up work.
2. Pull requests for implementation scope, touched surfaces, proof, risk, out-of-scope, and handoff.
3. `AGENTS.md`/README for broad durable operating knowledge.
4. `.github/instructions/` for path-specific guardrails.
5. `.github/skills/` for repeatable deep procedures loaded only when relevant.
6. Tests/code/migrations for executable product truth.

## PR handoff pattern

A focused PR should state:

- tracking card (`Tracks #...` or `Refs #...`);
- problem;
- owner lane/agent;
- scope;
- material files/surfaces touched;
- out of scope;
- proof at the appropriate level (tests/CI/staging/production);
- risk/safety notes;
- follow-up issues;
- recommended reviewer/next specialist lane.

The repository PR template encodes this pattern.

## Merge protocol

Before merge, the branch owner or reviewer must:

1. refresh/reconcile current `main`;
2. re-scan open PRs/cards for new overlap;
3. resolve conflicts by understanding both intended changes, not by blindly selecting one side;
4. confirm required CI/tests are green;
5. confirm the diff still matches the card and contains no incidental broad changes;
6. update the card to **Merge ready**.

After merge:

1. update the card to **Merged** and keep it open;
2. validate the merged result at the right level for the change;
3. record verification evidence on the card;
4. mark **Verified**;
5. link any new follow-up cards;
6. only then mark **Closed** and close the issue.

A green PR is evidence that code is mergeable. It is not automatically evidence that the user-facing or hosted outcome works after merge.

## Orchestrator responsibility

The Orchestrator / TPM lane is responsible for reducing collision risk before assigning work. It should:

- avoid assigning JFL and DRU cards that require broad edits to the same surfaces at the same time;
- split wide cards into coherent independent slices;
- express sequencing dependencies explicitly;
- prefer handoffs over duplicate implementations;
- keep issue owners and lifecycle stages current;
- flag stale branches/PRs before new work is built on top of them;
- make sure a merged card reaches verification instead of disappearing from the board.

## Concurrency rule

Specialization is useful only when agents are not fighting over the same files and decisions.

- Keep roughly 8 disciplines available.
- Limit simultaneous implementation lanes to about 4–5 when work overlaps shared runtime/database surfaces.
- Rules, QA, PR/Comms, Analytics, and Orchestrator should often review/triage/create issues rather than create competing runtime PRs.
- Before starting implementation, every lane checks current `main`, open PRs, and the relevant issue/dependencies.
- When another active PR owns the same behavior, review or hand off instead of duplicating it.

## Instruction improvement loop

When a cycle discovers a durable lesson:

- update `AGENTS.md` for broad autonomous behavior;
- update the appropriate agent profile for role-specific behavior;
- update path instructions for file/surface-specific safety rules;
- add or improve a skill for a repeatable procedure;
- update README for stable architecture/product orientation;
- keep transient priorities and one-off blockers in issues.

Do not expand the external scheduler prompt with current roadmap detail. `docs/agent-bootstrap.md` should remain a tiny pointer into the repository-owned instruction system.

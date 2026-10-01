---
name: Implementation card
about: Track one owned, reviewable implementation or durable process change through post-merge verification
title: ''
labels: 'agent:unclaimed, stage:ready, priority:p2'
assignees: ''
---

<!-- implementation-card-v2 -->

## Owner

Unclaimed — replace `agent:unclaimed` with exactly one implementation owner label before coding.

## Labels

- Owner: `agent:unclaimed`
- Stage: `stage:ready`
- Priority: `priority:p2` — change when evidence supports another priority
- Area: add at least one `area:*` label before claiming
- Coordination: add only when applicable

## Problem

<!-- Describe the user, operational, reliability, security, or maintenance problem. -->

## Desired outcome

<!-- State the observable outcome, not only an implementation guess. -->

## Acceptance criteria

- [ ] Add concrete, independently verifiable acceptance criteria.

## Scope

<!-- Name the coherent behavior and likely surfaces this card owns. -->

## Out of scope

<!-- Name adjacent work that must remain separate, or write None. -->

## Overlap and dependencies

<!-- Link dependencies and record the open-card/PR overlap check. Call out high-collision surfaces explicitly. -->

## Branch

Not created. After Ready and Claimed, create a focused branch from current `main`, preferably `issue-<number>-<short-slug>`.

## Work stages

- [ ] **Ready** — `stage:ready`; scope, acceptance criteria, dependencies, and overlap are understood.
- [ ] **Claimed** — `stage:claimed`; one `agent:*` implementation owner is recorded before code changes begin.
- [ ] **In progress** — `stage:in-progress`; a focused branch exists from current `main`.
- [ ] **Handoff / review** — `stage:handoff`; structured handoff and target `handoff:*` label are present.
- [ ] **Merge ready** — `stage:merge-ready`; current `main` and overlap were rechecked; required checks are green.
- [ ] **Merged** — `stage:merged`; the PR is merged and this card intentionally remains open.
- [ ] **Verified** — `stage:verified`; the merged result is validated and evidence is recorded.
- [ ] **Closed** — `stage:closed`; acceptance criteria are satisfied and follow-up cards are linked.

## Handoff notes

<!-- Leave a new issue or PR comment for every handoff using all fields below. -->

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

---
name: Implementation card
about: Track one owned, reviewable implementation or durable process change through post-merge verification
title: ''
labels: ''
assignees: ''
---

<!-- implementation-card-v1 -->

## Owner

Unclaimed — assign one agent or owner lane and record it here before coding.

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

- [ ] **Ready** — scope, acceptance criteria, dependencies, and overlap are understood.
- [ ] **Claimed** — one implementation owner or agent lane is recorded before code changes begin.
- [ ] **In progress** — a focused branch exists from current `main`; implementation is limited to this card.
- [ ] **Handoff / review** — the PR uses `Tracks #...` or `Refs #...` and records scope, touched surfaces, proof, risk, out-of-scope work, and next owner/reviewer.
- [ ] **Merge ready** — current `main` and overlapping work were rechecked; required checks are green; the diff remains narrow.
- [ ] **Merged** — the PR is merged and this card intentionally remains open.
- [ ] **Verified** — the merged result is validated at the appropriate source, CI, hosted, or production level and evidence is recorded here.
- [ ] **Closed** — acceptance criteria are satisfied and follow-up cards are linked; only now close this card.

## Handoff notes

<!-- Current state, tests, known failures, touched surfaces, collision risks, exact next action, and incoming owner. -->

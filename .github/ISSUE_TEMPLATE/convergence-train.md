---
name: Gamma convergence train
about: Integrate 2–4 peer-verified cards into one exact-SHA Gamma candidate
title: '[CONVERGENCE] Gamma Train '
labels: 'agent:unclaimed, stage:ready, priority:p1, area:qa, area:process, collision-risk'
assignees: ''
---

<!-- convergence-train-v1 -->

## Owner and candidate identity

- Train owner: `agent:unclaimed`
- Peer verifier: JFL / DRU
- Gamma baseline SHA:
- Candidate branch:
- Candidate SHA:
- Rollback SHA: <!-- must equal the baseline -->

## Selected cards

Select 2–4 cards. Every card needs owner-lane and opposite-lane review-only proof before entry.

| Order | Card | Owner lane | Owner-lane proof | Peer-lane proof | Shared surfaces | Migrations/config |
|---:|---|---|---|---|---|---|
| 1 | # | JFL / DRU | URL | URL | | None / details |
| 2 | # | JFL / DRU | URL | URL | | None / details |

## Combined-candidate proof

- CI run:
- Exact deployed Gamma SHA:
- JFL Gamma verification:
- DRU Gamma verification:
- Rollback proof:

## Failure and removal log

<!-- Record removed cards, evidence, owner lane, and the new train baseline/candidate. Never repair feature behavior on the train branch. -->

## Gamma PR metadata

Copy this block into the Gamma-targeted PR and replace every value:

```text
Convergence train: #<this card>
Gamma baseline SHA: <40-character SHA>
Candidate SHA: <current PR head SHA>
Rollback SHA: <same SHA as Gamma baseline>
Train owner: JFL
Peer verifier: DRU
Selected cards: #101, #102
Owner-lane proof: https://github.com/...
Peer-lane proof: https://github.com/...
Shared surfaces: <files/behavior and sequencing decision>
Migrations/config: None
Promotion order: #101 -> #102
```

## Work stages

- [ ] **Ready** — 2–4 eligible cards, order, dependencies, and exact Gamma baseline are recorded.
- [ ] **Claimed** — one JFL or DRU train owner is recorded before the candidate branch exists.
- [ ] **In progress** — focused train branch exists from the pinned Gamma SHA.
- [ ] **Handoff / review** — opposite-lane review and candidate CI are pending.
- [ ] **Merge ready** — proof is complete; candidate SHA and current Gamma base still match.
- [ ] **Merged** — candidate merged to Gamma; card remains open.
- [ ] **Verified** — exact deployed SHA and both lanes' Gamma evidence are recorded.
- [ ] **Closed** — acceptance and follow-ups are complete.

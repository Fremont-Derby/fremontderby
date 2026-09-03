# Pre-Gamma convergence trains

This guide defines a proposed small-batch integration gate for JFL and DRU. It complements the card lifecycle and immutable branch ownership in `AGENTS.md`; it does not permit either lane to edit the other's branches.

## Purpose

Permanent JFL and DRU branches are independent deployment lanes, not merge bundles. A convergence train selects a small set of already verified cards and proves their combined behavior before Gamma. It keeps integration failures attributable and rollback narrow.

## Roles

- **Card owner:** implements one card on its own focused JFL or DRU issue branch and records lane proof.
- **Peer verifier:** the opposite lane independently runs the card's acceptance checklist against the deployed owner lane and records review-only proof. The peer never checks out or mutates the owner's branch.
- **Train owner:** owns the convergence card and a focused issue branch created from the exact current Gamma baseline. The train owner applies only the selected card changes in the recorded order.
- **Gamma verifiers:** JFL and DRU both validate the exact deployed candidate SHA before release can advance.

One person or agent may fill more than one compatible role, but the card owner and peer verifier must be opposite lanes.

## Train size and entry criteria

A train contains 2–4 distinct implementation cards. Each card must have:

1. one current implementation owner;
2. a focused branch and PR limited to that card;
3. green required CI;
4. owner-lane acceptance proof;
5. review-only proof from the opposite lane;
6. explicit shared surfaces, migrations/configuration, and rollback notes;
7. no unresolved ownership or overlap conflict.

The train card pins the exact Gamma baseline SHA before its branch is created. Never use `fremontderby-jfl`, `fremontderby-dru`, `fremontderby-gamma`, or `main` as the promotion PR head.

## Build and verification sequence

1. Create and claim one `[CONVERGENCE] Gamma Train <n>` card.
2. Record the exact Gamma baseline and rollback SHA; they are initially identical.
3. Select 2–4 eligible cards and record their promotion order.
4. Create the train owner's focused `jfl/issue-...` or `dru/issue-...` branch from that Gamma SHA.
5. Apply only the selected card changes. Do not merge a permanent lane branch wholesale.
6. Open a PR to `fremontderby-gamma` and fill the metadata block below.
7. Run repository CI against the combined candidate. A changed candidate SHA invalidates prior candidate-level proof.
8. Merge only after required checks and the repository's review gates pass.
9. Deploy Gamma from the exact merged candidate SHA.
10. JFL and DRU each record Gamma acceptance evidence on the train card.
11. Mark the train verified only when the deployed SHA, acceptance evidence, and rollback path all match the card.

## Gamma PR metadata

The Gamma-targeted PR body must contain these single-line fields:

```text
Convergence train: #123
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

Use one durable HTTPS evidence URL for each proof field. Link richer evidence from the convergence card.

## Failure handling

- If a card fails owner-lane or peer verification, remove it from the train and return it to its owner. Do not repair feature behavior on the train branch.
- If combined CI fails, identify the smallest conflicting card pair, update their cards, and rebuild from the current Gamma head after the owners resolve the conflict.
- If Gamma verification fails, stop promotion, roll back to the pinned baseline, and record the failed candidate SHA and evidence.
- Never widen a train beyond four cards to absorb a fix.
- Never close implementation or convergence cards at merge; record merged and post-deploy verification first.

## Bootstrap

The workflow can enforce this contract only after it exists on the Gamma base branch. The first promotion of this governance change therefore requires manual review against the same metadata and exact-SHA rules. Once merged into Gamma, no later Gamma promotion is grandfathered.

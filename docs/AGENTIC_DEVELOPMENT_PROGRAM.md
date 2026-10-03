# Fremont Derby Agentic Development Program

## Program mission

For the current phase, JFL and DRU are not independent product roadmaps.

**Shared outcome:** get JFL to product-complete, human-testable Fremont Derby as quickly and safely as possible.

Every autonomous work item should be explainable as progress toward that outcome. If the connection is unclear, do not manufacture work to preserve momentum.

## Current phase

The controlling milestone is issue #2800: JFL product completeness.

- **JFL** is the integration, product-completion, hosted-verification, and human-test-readiness lane.
- **DRU** is the exploration, stress-test, defect-discovery, and portable-fix lane that accelerates JFL.
- **Gamma** is dormant until #2800's exit gate is satisfied. DRU must not use "works on DRU, copy to Gamma" as its default promotion loop.
- When #2800 passes, the program steward should update this charter and the corresponding mechanical guardrails as part of reactivating #2527.

## Current program status

Read `docs/AGENTIC_PROGRAM_STATUS.md` before normal prioritization. It is the maintained executive/status handoff for the current phase. Reconcile it against live issues, PRs, CI, and hosted evidence; newer authoritative evidence wins. Update the status document only for material program-level changes rather than routine card churn.

## Collaboration contract

### JFL contribution

JFL should:
1. identify the highest-value missing or broken real user path;
2. define the evidence needed to call that behavior implemented;
3. integrate portable work from DRU when it advances the controlling milestone;
4. validate through CI, exact-SHA hosted behavior, and the appropriate human/persona path;
5. tell DRU what evidence or exploration would materially reduce JFL risk.

### DRU contribution

DRU should:
1. stress-test real end-to-end flows on the DRU lane;
2. reproduce concrete blockers before proposing fixes;
3. make a narrow DRU-safe fix when that is the fastest way to learn;
4. produce regression evidence and a portable handoff;
5. hand JFL the reproduction, proof, relevant patch/commit, and known limitations;
6. return to the next highest-value exploration that advances JFL completeness.

DRU should prefer **one meaningful handoff to JFL over ten isolated helpers**.

A standalone helper, sentence, predicate, or unit test is not evidence that a product story is implemented unless it is wired into the real requested user path and that path is verified.

## DRU session contract

Issue #2883 is the canonical coaching journal.

Use **one Session contract per coherent human objective**, not one per helper, card, commit, or PR. Several coherent PRs may reuse the same contract while they remain part of the same objective.

A DRU Session contract must contain:

- **Shared objective:** the JFL product-completion outcome this advances.
- **DRU contribution:** what DRU will discover, prove, or fix.
- **JFL handoff:** what JFL should receive if the work succeeds.
- **Done when:** an observable end-to-end condition, not "helper/test exists."
- **Human direction:** quote or faithfully summarize the instruction.
- **Starting evidence:** concrete hosted/test/repository evidence.
- **Non-goals:** explicit boundaries.
- **First action:** the next meaningful action.
- **Stop/ask conditions:** what would require narrowing, stopping, or a product decision.

Do not expose hidden chain-of-thought. Record the execution contract, evidence, decisions, and rationale a teammate needs for review.

## Reciprocal coaching

JFL checks the newest meaningful #2883 entry during its peer pulse.

When useful, JFL should answer four questions:
1. Does this DRU objective materially advance the shared outcome?
2. Which JFL card/user story does it map to?
3. What evidence does JFL need from DRU?
4. Should DRU continue, narrow, stop, or hand off now?

Silence is acceptable when the objective is aligned and no coaching is needed. Do not create status-comment noise.

DRU treats JFL/product-owner feedback as evidence that can change the execution contract. When feedback materially changes the mission, post one concise Course change rather than opening a new micro-session for every implementation detail.

## Continuous improvement loop

This is a program, not a one-time process design.

Regularly review recent JFL/DRU actions, CI, ownership/stage integrity, journal quality, handoffs, and recurring failure modes. Preserve practices that improve throughput toward the shared outcome; modify mechanisms that create waste, collisions, gaming, or paperwork without better decisions.

Prefer:
- one coherent process improvement over many micro-rules;
- mechanical guardrails for repeated, objective failure modes;
- documentation/coaching for judgment that cannot be safely automated;
- focused governance cards when the correct adjustment is ambiguous.

If a guardrail is being gamed, improve the mechanism rather than merely adding prose.

Any process automation must remain subordinate to product-owner direction, security boundaries, branch ownership, CI, and the lifecycle in AGENTS.md.

## Program health signals

Healthy convergence looks like:
- JFL is closing real product-completion gaps;
- DRU is discovering/reproducing defects in realistic flows;
- DRU handoffs map cleanly to JFL needs;
- PR concurrency and scope remain understandable;
- merged work receives hosted verification before closure;
- Gamma stays dormant during the JFL-completion phase;
- issue ownership/stage metadata reflects reality.

Drift looks like:
- synthetic helper/test work standing in for product behavior;
- large numbers of unrelated micro-PRs;
- work created to keep pipelines busy;
- DRU and JFL building separate roadmaps;
- default DRU-to-Gamma promotion while #2800 is incomplete;
- relabeling cards to satisfy CI rather than describe state;
- "merged" being treated as "verified" or "closed."

# Fremont Derby Agentic Program Status

**Snapshot:** 2026-10-03, approximately 16:20 Central Time  
**Controlling milestone:** #2800 — JFL product completeness  
**Program charter:** `docs/AGENTIC_DEVELOPMENT_PROGRAM.md`

## Authority and freshness

This document is a program-status snapshot and handoff, not a replacement for live GitHub state.

Before acting on anything below, reconcile current `main`, #2800 and its children, open PRs, current CI, lane deployments, and the relevant hosted evidence. If a fact here is stale, follow the newer authoritative evidence and update this document only when the change is material at program level.

Do not turn this document into a second backlog. Current issues own implementation scope and acceptance criteria.

## Executive state

The program is making meaningful product progress, but JFL is **not yet product-complete** and Gamma remains dormant.

The strongest current signal is the JFL two-captain regular-season path. Permanent JFL SHA `636cec247463610091fc8b16f989fee556630ee1` has recorded exact-SHA deployment and browser evidence covering:

- two distinct captain perspectives;
- availability/check-in and substitute selection;
- blind lineup submission and reveal/lock behavior;
- opposite-team authorization denial;
- three distinct player races;
- intentional scoring disagreement and supported UI correction;
- separate confirmations and premature-finalization denial;
- finalization of all three races;
- reopen/persistence checks from both captain perspectives;
- a phone-emulated captain-critical path.

That is substantial proof of the core league-night engine. It does **not** by itself satisfy #2799 or #2800.

## Near-term completion gaps

### 1. Completed-result discovery and context — #2979

The scoring journey can finish the synthetic league night, but normal supported UI discovery of the completed QA matchup and its team/player result context is not yet proven.

Preserved scorecard links and aggregate SQL are useful supporting evidence, but they do not prove the product journey:

```text
finish league night
  -> find completed matchup
  -> understand team result
  -> inspect player/team result context
```

Treat #2979 as a high-value JFL integration gap unless fresher evidence identifies a higher-impact #2800 blocker.

### 2. Persistent unattended browser execution — #2817

Hosted fixed-fixture reset/preflight has succeeded, while the persistent self-hosted browser job has repeatedly remained queued/unassigned in the latest recorded runs.

Local exact-SHA Playwright proof is valuable, but do not represent the persistent GitHub runner as accepted until a trusted self-hosted browser job actually runs and records its evidence.

### 3. Broader #2800 product completeness

The two-captain scoring path is only one part of #2800. Reconcile the current milestone before choosing work. Known remaining categories include, when still open:

- messaging and required privacy/moderation behavior;
- notifications/notices needed for real actions;
- supported player/team/public destinations;
- postseason four-player plus anchor/tiebreak behavior;
- operator/admin season-running paths without direct SQL/manual repair;
- captain-critical mobile completion;
- handicap policy #2815 after explicit product-owner approval of the exact rule;
- Fargo reporting #87 after the selected supported ingestion path is implementable and provable.

Do not let old visual-onion sequencing or isolated polish outrank a missing real-season user story.

## Program-management retrospective

### What is working

JFL's recent evidence loop is the model to preserve:

```text
reproduce
  -> understand
  -> narrow fix
  -> regression
  -> CI
  -> exact-SHA deployment
  -> hosted/browser verification
  -> durable handoff
```

Recent JFL work has been careful to distinguish merged source, deployed SHA, browser proof, database/supporting evidence, and acceptance criteria that remain unproven. Preserve that discipline.

Failures in the browser journey have also been treated as information rather than hidden by weaker assertions. Continue doing that.

### What drifted

DRU became locally productive but insufficiently convergent with the shared #2800 outcome.

Two concrete snapshot examples illustrate the failure mode:

- PR #3188 grew into a broad consolidation of hundreds of source/test files because many DRU requests had accumulated and were blocking each other.
- PR #3190 continued a DRU-to-Gamma promotion loop while #2800 explicitly keeps Gamma dormant; its full CI was failing at this snapshot.

These examples are **retrospective evidence, not permanent judgments on those PRs**. Reconcile their current state before acting.

The lesson is durable: do not solve queue pressure by manufacturing a larger queue-clearing shipment. Do not measure agent success by issue/PR volume. Measure whether the work shortens the path to a complete JFL user journey.

## JFL adjustment

During the #2800 phase, JFL should:

1. Own convergence on complete real user journeys, not only component correctness.
2. Prefer the next missing transition in an already-working end-to-end path over unrelated polish.
3. Pull in DRU evidence or portable fixes only when they reduce JFL completion risk.
4. Keep the persistent-runner gap explicit until the trusted job actually executes.
5. During the peer pulse, coach DRU toward the exact JFL story/evidence need rather than merely reviewing DRU mechanics.
6. Keep Gamma dormant; do not accept promotion work as a substitute for JFL completeness.
7. When a #2800 child is genuinely satisfied, record exact proof, reconcile lifecycle state, and move to the next highest-impact missing story.

Near-term default: inspect and, if still highest impact, claim #2979 and close the completed-result discovery/context loop.

## DRU adjustment

During the #2800 phase, DRU should:

1. Treat JFL as the normal downstream partner. Do not start new DRU-to-Gamma promotion work.
2. Start from a real end-to-end reproduction or a specific JFL evidence request.
3. Prefer one meaningful, evidence-rich JFL handoff over multiple isolated helpers or sentence/predicate PRs.
4. Do not combine unrelated accumulated work into a broad consolidation merely to clear PR pressure. Split or retire work by coherent user/operational outcome.
5. A helper, unit test, label, sentence, or predicate is supporting evidence only unless it is wired into the requested real user path.
6. If the current P0 DRU notification-security finding #2887 / parent #2884 is still unresolved, security may preempt lower-value experimentation. Keep that work narrow and do not use it to reactivate Gamma.
7. At the end of each objective, hand JFL the reproduction, proof, relevant patch/commit, known limitations, and exact suggested integration point.

Before opening another implementation PR, answer:

> What #2800 user story becomes easier for JFL to close because this work exists?

If there is no concrete answer, do not create work to preserve momentum.

## Gamma and human validation

Gamma stays dormant until #2800's exit gate is satisfied. Existing historical or grandfathered Gamma work should not consume new implementation capacity merely because it is open.

After #2800 passes:

1. identify/freeze the product-complete JFL baseline;
2. reactivate #2527;
3. reconcile selectively into Gamma;
4. run release-candidate automation at the exact Gamma SHA;
5. then proceed toward #219's two-real-captain usability/comprehension trial.

Do not ask human testers to find functional/state defects that the persona/Playwright system can reasonably discover first.

## Program health check

Healthy behavior:

- fewer, more meaningful concurrent objectives;
- JFL closes complete user paths;
- DRU discoveries map directly to JFL needs;
- exact-SHA verification follows merge;
- issue lifecycle metadata matches reality;
- Gamma remains quiet until its phase begins.

Warning signals:

- helper/test existence presented as product completion;
- large batches created only to clear many small PRs;
- new Gamma promotion during #2800;
- merged work left unverified;
- issue labels changed to satisfy automation rather than reflect ownership;
- agents maintaining separate roadmaps.

When a warning signal repeats, fix the incentive or mechanical guardrail rather than adding status-comment noise.

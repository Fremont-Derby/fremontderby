# Test-driven development contract

Fremont Derby uses two nested validation loops:

1. **Outer acceptance loop:** a user story or onion gate defines observable behavior, automated acceptance coverage proves the workflow mechanically, and human onion validation proves the released behavior is actually usable.
2. **Inner implementation loop:** every meaningful behavior change follows **RED → GREEN → REFACTOR** before it is considered implementation-complete.

The outer loop answers “does the product satisfy the story?” The inner loop answers “did we prove the missing behavior before changing production code?”

## RED → GREEN → REFACTOR

### RED — prove the missing behavior first

Before writing or changing production behavior:

1. identify the smallest observable behavior owned by the card;
2. add or modify the narrowest meaningful automated test/guard that expresses that behavior;
3. run it before implementation;
4. confirm it **fails for the expected reason**, not because of syntax, fixture, environment, or unrelated failures;
5. record the command/check and expected failure in the card or PR.

A bug fix starts with a regression test that reproduces the bug. When legacy behavior is poorly covered, add a characterization test first, then a failing test for the desired change.

Do not weaken, delete, skip, or rewrite a legitimate test merely to manufacture RED or GREEN.

### GREEN — make the smallest change that passes

After RED is established:

1. implement the smallest coherent production change that satisfies the failing test;
2. run the focused test until it passes;
3. avoid unrelated cleanup, abstractions, or redesign while getting to GREEN.

GREEN means the new behavior passes its focused proof. It does not replace adjacent regression coverage, CI, hosted verification, or human acceptance.

### REFACTOR — improve safely while green

After GREEN:

1. run the relevant adjacent regression suite;
2. refactor only when it improves clarity, duplication, maintainability, or architecture within the card’s scope;
3. keep the focused and regression tests green throughout;
4. run the repository-required CI/checks before handoff or merge.

A refactor that changes externally observable behavior requires a new RED case for that behavior.

## Test-first proof by surface

Use the test level closest to the behavior being changed:

- **Domain rules:** unit/domain tests around pure rules, eligibility, scoring, scheduling, standings, and state transitions.
- **Authorization:** contract/integration tests proving the allowed actor succeeds and adjacent/anonymous/cross-team actors fail.
- **API/HTTP:** request/response tests covering status, payload semantics, mutation effects, retries, and error mapping.
- **Database/migrations:** migration/integration tests proving schema, RLS/grants, functions, data transitions, and upgrade paths.
- **UI/browser behavior:** component/rendered/browser tests for navigation, state feedback, accessibility, reconciliation, refresh/session behavior, and critical interactions.
- **Configuration/deployment:** executable guards, fixture tests, dry-runs, lane/environment assertions, or canaries that fail closed before a live mutation.

Prefer one meaningful test at the correct boundary over many implementation-detail tests.

## Exceptions: do not create fake tests

Strict RED-first is required for behavior-bearing code, configuration, migrations, and automation. A **justified exception** is allowed when a conventional failing automated test would add no value, including:

- docs-only or documentation-only edits;
- copy-only wording changes with no behavior change;
- purely visual polish where no stable executable assertion reasonably represents the requested change;
- emergency live containment where delaying the safety action to author a test would increase user/data/infrastructure risk.

For an exception:

1. record why RED-first is not meaningful or safe;
2. run the narrowest useful validation instead (lint/link check, accessibility check, screenshot comparison, config parse/dry-run, live probe, etc.);
3. for emergency behavior changes, add the regression test as soon as the system is stabilized and before the card is Verified/Closed.

“Tests are inconvenient,” “the code is hard to test,” or “CI will catch it later” are not justified exceptions.

## Evidence required in cards and PRs

Implementation work records:

- **RED evidence:** test/check name, command, and expected failure reason before implementation;
- **GREEN evidence:** focused test/check passing after the minimum change;
- **Regression evidence:** relevant adjacent suite and required CI/checks passing;
- **Refactor evidence:** what was cleaned up after GREEN, or `None`;
- **Exception evidence:** only when applicable, with the reason and substitute validation.

The PR does not need artificial commit choreography. A dedicated RED commit is useful when practical, but the durable requirement is evidence that the intended test/check failed for the expected reason before the behavior change was implemented.

## Human onion validation remains mandatory

Automated TDD proves implementation behavior. It does not prove that a human can understand or operate Fremont Derby.

For onion-gated releases, the sequence is:

**story/gate → automated acceptance RED → implementation RED/GREEN/REFACTOR → CI/regression GREEN → deploy to the correct lane → automated readiness/smoke → human onion PASS/FAIL**.

A human FAIL creates or links a focused defect, rolls back only the newest unsafe layer when required, and starts a new RED-first implementation loop for that defect.

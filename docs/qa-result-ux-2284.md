# QA result submission evidence — #2284

Android human validation on 2026-09-07 produced a second screenshot with all five assertions answered: two FAIL and three PASS. The tester still reported that the level could not be submitted.

Inspection of the existing Scorecard QA result flow showed that a completed FAIL result is valid and is written to localStorage, but the acknowledgement element is rendered below the full action stack (`Play again`, `Replay exact seed`, and `Next level`). On a narrow mobile viewport this makes a successful save appear to do nothing.

The #2284 repair therefore treats FAIL answers as legitimate completion, moves the visible outcome ahead of secondary actions, adds answer progress and real finish gating, and exposes the next-level action only after a result is saved.

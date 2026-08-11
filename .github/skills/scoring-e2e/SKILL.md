---
name: scoring-e2e
description: Prove Fremont Derby's regular-season lineup-to-scoring-to-standings path end to end with isolated, deterministic evidence.
---

Use when validating or changing regular-season lineup/scoring/finalization behavior.

1. Start from current issue/rules/tests and confirm the intended lineup/scoring contract.
2. Exercise two opposing teams with sealed ordered three-player lineups.
3. Prove opponent lineup secrecy until both commit and exactly three generated player matches afterward.
4. Prove the signed-in scorer operates only the selected team-owned rack history.
5. Record a deliberate mismatch, verify it blocks finalization, correct it, then dual-confirm and finalize.
6. Verify team and individual standings update from finalized results.
7. Include 8/9 race/handicap behavior relevant to the changed code.
8. Keep fixtures rollback-safe or otherwise isolated from production competitive records.
9. Capture regressions as tests and follow-up issues rather than relying on a chat transcript.
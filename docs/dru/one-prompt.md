# One-prompt DRU war game

This file only points at the playbook. The playbook is `docs/dru/war-game-runbook.md` on `fremontderby-dru`. Do not keep a second procedure here.

Say the war game number, then follow that number's pass line in the playbook.

War game 1 is race conditions, on branch `dru/war-game-1-race-conditions`. It passes when two overlapping writes leave one final score and a recorded conflict, not a silent flip. Stop at that night. Naming a champion is not this pass.

War games 6, 7, and 8 are the same family, and each has its own number. War game 6 is a stale score. War game 7 is submit, refresh, submit. War game 8 is a lock against a stale score. Their pass lines are in the playbook. Do not run them as war game 1.

Each war game has ten negative points in the playbook. Run the ten for the number you named. For each point, write the expected sentence and the actual sentence. Then write one execution line: expected, actual, and a verdict of pass, fail, or host. After a save that should have landed, the schedule, the scorecard, and the standings must agree.

War game 9 is a write against the wrong season. War game 10 is the wrong actor. Their pass lines are in the playbook.

War game 11 is a team switch before the season opens. Join team A, switch to B, switch back to A, then switch to C. A free agent can play any team on any night and stays a free agent. Do not treat that one-night fill as a switch.

If a request cap, a 429, or a timeout stops a point, add a line under Host obstacles in the playbook before you stop. Do not leave it only in the chat.

The live site stays on `fremontderby-dru`. Do not deploy the test branch.

Last line:

`War game 1, race conditions, pass or fail, season {name}, version {versionTag}, dru/war-game-1-race-conditions.`

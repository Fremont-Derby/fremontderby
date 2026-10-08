# One-prompt DRU war game

This file is a pointer. The playbook is docs/dru/war-game-runbook.md on fremontderby-dru. The project rules it follows are cited in that file. Do not keep a second procedure here.

Say the war game number, then follow that number's pass line in the playbook.

War game 1 is race conditions, branch `dru/war-game-1-race-conditions`. Pass: two overlapping writes leave one final score and a recorded conflict, not a silent flip. Stop at the raced night. A champion is not this pass.

The same family, each its own number: war game 6 stale score, war game 7 submit refresh submit, war game 8 lock against a stale score. Pass lines are in the playbook. Do not run them as war game 1.
Each war game has ten negative test points in the playbook. Run the ten for the number you named. Record the expected sentence and the actual sentence for each point.
Write one execution line per point: expected, actual, verdict. Verdict is pass, fail, or host. After a real save, the schedule, the scorecard, and the standings must agree.
War game 9 is wrong season. War game 10 is wrong actor. Pass lines are in the playbook.
War game 11 is a team switch before the season opens. Join A, switch to B, switch back to A, switch to C. A free agent can play any team any night and stays a free agent. Do not treat that fill as a switch.
If a request cap, a 429, or a timeout stops a point, add a line under Host obstacles in the playbook before you stop. Do not leave it only in the chat.

The live site stays on `fremontderby-dru`. Do not deploy the kit branch.

Last line:

`War game 1, race conditions, pass or fail, season {name}, version {versionTag}, dru/war-game-1-race-conditions.`

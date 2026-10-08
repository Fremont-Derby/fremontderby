# War-game kit plan

Saved 2026-10-07. Source is docs/dru/war-game-runbook.md on fremontderby-dru. The rules that file follows are cited there, under Project rules these docs follow.

- Shipped branch: fremontderby-dru. The DRU site deploys this. A kit branch is never deployed there.
- War game 1: dru/war-game-1-race-conditions. Pass is one final score and a recorded conflict. Stop at the raced night.
- War game 2: dru/war-game-2-input-validation. Pass is the expected refusal.
- War game 3: dru/war-game-3-messages. Pass is one saved message, or the expected refusal.
- War game 4: dru/war-game-4-schedules. This is the war game that names a champion.
- War game 5: dru/war-game-5-admin-pages. Pass is the named admin action, or the expected refusal.
- War game 6: dru/war-game-6-stale-score. A saves from a page loaded before B's save. Pass is one score and a recorded conflict or a refusal.
- War game 7: dru/war-game-7-submit-refresh-submit. A submits, refreshes, submits again, and B submits in the gap. Pass is one score, not a flipped winner.
- War game 8: dru/war-game-8-lock-against-score. A lock races a score from a page loaded before the lock. Pass is one recorded order.
- War game 9: dru/war-game-9-wrong-season. A write with another season's id is refused, and the other season is unchanged.
- War game 10: dru/war-game-10-wrong-actor. A signed-out page, a non-captain, or the other captain cannot land a write.
- War game 11: dru/war-game-11-team-switch. A roster switch moves the membership. A free agent can play any team any night and stays a free agent.

Lane keep, put back after every JFL grab, stays on the shipped branch: sign-in token, worker config, practice phone.

Stop categories: his bugs, kit gaps, lane keep.
Every night writes a call list: method, path, status, time.
Each war game has ten negative test points in the playbook. A point that gets the expected refusal passes. A silent overwrite fails.
A host limit is written under Host obstacles in the playbook. Do not skip it and do not call it a product bug.

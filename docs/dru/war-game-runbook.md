# DRU war-game runbook

Use this on https://dru.fremontderby.com only. One conversation owns one fresh season. Do not reuse a season, a team, a player, or a match from another chat. Do not use Season 1. Do not use Test Drive as the night. Do not edit the database. Do not wait on GitHub to walk the night. A code fix is a separate job and only happens if a real screen stops the night.

A war game is a real league night on the live screens. A page of made-up scores does not count.

## Project rules these docs follow

Read on 2026-10-07 from `fremontderby-dru`. These docs do not replace the repository rules. If a line here disagrees with a source below, the source wins. File the disagreement on the card for this doc, and do not silently edit `AGENTS.md`.

Instruction hierarchy, from `AGENTS.md` section "Instruction hierarchy":

1. The current user request.
2. The current GitHub issue and its linked discussion.
3. The current code, tests, migrations, CI, and the live host.
4. `AGENTS.md`.
5. `.github/agents/*.agent.md` and `.github/instructions/*.instructions.md`.
6. `README.md`.
7. `docs/agent-bootstrap.md`.

Lane reading, from `AGENTS.md` section "Start every session from the repository" and `.github/agents/dru.agent.md` section "Authority and required reading": read `AGENTS.md` and `README.md`, then both `.github/agents/jfl.agent.md` and `.github/agents/dru.agent.md`. The peer guide is required reading.

Lane identity, from `docs/ENVIRONMENTS.md` section "Target release topology":

- DRU branch `fremontderby-dru`, host `https://dru.fremontderby.com`, schema `dru`.
- JFL branch `fremontderby-jfl`, host `https://jfl.fremontderby.com`. These docs do not touch it.
- Gamma branch `fremontderby-gamma`, host `https://gamma.fremontderby.com`. These docs do not promote there.
- Production branch `main`, host `https://fremontderby.com`. These docs do not promote there.
- Promotion path in that file is feature work, then JFL or DRU, then gamma, then main. This folder stops at DRU on purpose.

Lane behavior, from `.github/agents/dru.agent.md` section "DRU lane behavior":

- `fremontderby-dru` is the deployment lane, not a general implementation branch.
- A code change starts from `main` on `dru/issue-<number>-<slug>`.
- Never mutate a `jfl/*` branch or `fremontderby-jfl`.
- Claim one card before editing. A handoff transfers the card, not the branch.

Card and pull request, from `AGENTS.md` sections "Card lifecycle for implementation work", "Card label contract", and "Pull requests and merges":

- A durable doc change has an issue before the pull request.
- One `agent:*` label, one `stage:*` label, one `priority:*` label, one `area:*` label.
- The pull request body links the card and carries scope, proof, and what was left out.
- Do not merge a red check. After merge, the card stays open until the live host shows the doc.

Session journal, from issue #2883: post a `### Session contract` on that issue before the pull request, then put that comment URL in the pull request body. One comment can cover several pull requests until the direction changes. Do not edit a card created by subiki.

Environment boundary, from `docs/ENVIRONMENTS.md` sections "DRU" and "JFL and DRU":

- Test auth bypass is allowed only on JFL and DRU, and must fail closed on gamma and production. The switch is `BETA_AUTH_BYPASS`.
- A DRU worker must fail closed on the production project or the wrong schema.
- These docs may name the fake phone. `555` numbers are fake captain phones for a war game, not a publish bypass. Those stay in this folder.

What these docs add, and where a correction would go:

- A war game is a night on the live DRU screens. A page of made-up scores does not count. Correction goes in this file.
- Test-branch code stays on `dru/war-game-N-<focus>` and is not deployed. Correction goes in this file.
- A host limit is written under Host obstacles. Correction goes in this file.
- A free agent can play any team on any night and stays a free agent. A roster switch is a different write. If the product rule changes, the correction belongs in `docs/DATA_MODEL.md` or the roster card, and this file follows it.

## Branches

`fremontderby-dru` is the branch the DRU site deploys. A comparison of JFL to DRU is a comparison against that branch. Do not put war-game test-branch code on it.

Each war game gets a number. War game 1 is the first war game. Its branch is `dru/war-game-1-race-conditions`. War game 2 is `dru/war-game-2-input-validation`. The points for that number lives in this runbook under that number. The branch is not a deploy source and is not offered to JFL.

After a JFL grab: reset `fremontderby-dru` to `fremontderby-jfl`, put the three lane keep pieces back, and deploy that. The keep pieces are the sign-in token in `src/supabaseAuth.js`, the worker config, and the fake phone. The war-game branch is a script that talks to the live site, or a throwaway preview. Do not deploy `dru/war-game-N-<focus>` to dru.fremontderby.com. The call back door never goes on the shipped worker.

When a night stops, name the category before fixing anything.

- His bugs. Still in his tree. A card for JFL, not a change to the test branch.
- Test-branch gaps. Streamlining that exists only so this lane can test. Belongs on `dru/war-game-N-<focus>`.
- Lane keep. Sign-in died after a grab, or the worker config or the fake phone is missing. Put the keep piece back. Not his bug, and not a gap in the test branch.

## War game levels

Every war game has a testing line. That line is what the night is trying to prove. A point that does not serve that line does not belong on that war game.

Every war game is a negative test. The number is the focus, not a difficulty ladder. A later number does not replace an earlier one. All war-game test code stays on its own `dru/war-game-N-<focus>` branch. The shipped branch does not get these screens.

1. Race conditions. War game 1, `dru/war-game-1-race-conditions`. Testing: two people writing the same match at the same time must not silently flip the score. Pass: two overlapping writes leave one final score and a recorded conflict, not a silent flip. Shape: four tables, two games on a table (eight-ball and nine-ball), two captains writing one match, one lock against one score. The script fires those from a barrier, not as fast as a chat can click. Stop at the raced night. A champion is not this pass.
   - Two captains save the same rack at the same time, opposite winners.
   - Two captains save the team match at the same time, opposite sides.
   - A lineup lock and a score save start together.
   - A second save hits a match that just became final.
   - Table 1 and table 2 save at the same time.
   - Eight-ball and nine-ball on the same table save at the same time.
   - The same captain sends two score saves with no wait.
   - A score save starts while the other captain reloads the score page.
   - Four tables save in the same second.
   - A playoff score save overlaps a regular score save. Expect a refusal on the playoff row.
2. Input validation. War game 2, `dru/war-game-2-input-validation`. Testing: a bad score, a bad lineup, and a save before the lock must be refused, not stored. Pass: a bad score, a side that is not A or B, a lineup with two players, the same player twice, a score that does not add up, and a save before the lineup is locked each return the expected refusal. The expected sentence and the actual sentence are both recorded.
   - Score side is C.
   - Score side is blank.
   - Rack winner is neither player.
   - Lineup has two players.
   - The same player is in two slots.
   - A score is saved before the lineup is locked.
   - The rack points do not add up.
   - A negative rack score.
   - A player who is not on the team is slotted.
   - Confirm is clicked with no rack filled.
3. Messaging privacy and channel authorization. War game 3, `dru/war-game-3-messages`. Testing: only the supported opt-in channels, general, team, and direct messages. Match threads are not supported, so this night does not require one. Pass: an opted-out person cannot send on a disabled channel, a non-member cannot read a team chat, an unauthorized person cannot read a direct conversation, and an authorized send stays after refresh without a duplicate.
   - General chat disabled. A send is refused, or the control is not there.
   - Team chat disabled. A send is refused, or the control is not there.
   - Direct messages disabled. A send is refused, or the control is not there.
   - All three disabled. No message can be sent or received on those channels.
   - General chat enabled. An authorized message stays after refresh.
   - Team chat enabled. A member message stays after refresh.
   - A non-member opens the team chat. Expect a refusal.
   - Direct messages enabled. An authorized conversation stays after refresh.
   - An unauthorized person opens someone else's direct conversation. Expect a refusal.
   - Two fast sends of the same request. No duplicate. Record what actually happened.
4. Schedules. War game 4, `dru/war-game-4-schedules`. Testing: a night cannot close, and playoffs cannot start, while a regular match is open. Pass: a makeup lands on this season, a round left open blocks close, a foreign date is refused, and playoffs refuse until the regular night is final. This is the war game that names a champion.
   - Publish with no teams.
   - Publish twice.
   - Propose a makeup on a date that is not this season.
   - Leave one regular match open, then start playoffs.
   - Advance to the championship with one semi open.
   - Score a playoff match before playoffs start.
   - Move a match onto a table that already has that slot.
   - Close the night with a round unfinished.
   - Publish, then add a team, then publish again.
   - Name a champion from memory without a Final line on the schedule.
5. Admin pages. War game 5, `dru/war-game-5-admin-pages`. Testing: each admin control does the named action, and a blank or wrong field does not save. Pass: season setup, teams, roster, captain, publish, cancel, and archive each do the named action, and a wrong button or a missing field returns the expected sentence.
   - Save season setup with no name.
   - Save season setup with no tables.
   - Create a team with a blank name.
   - Create the same team name twice.
   - Assign a captain who is not on the roster.
   - Remove a player who is in a locked lineup.
   - Archive a season that still has an open match.
   - Cancel a season, then publish it.
   - Delete a team that is on the schedule.
   - Save setup, refresh, and save the old form over the new one.
6. Stale score. War game 6, `dru/war-game-6-stale-score`. Testing: a score typed on an old page must not overwrite a save that happened after the page loaded. Same family as war game 1. Captain A opens the score page. Captain B saves. A does not reload, then submits the old form. Pass: one final score, and A's stale submit is a recorded conflict or a refusal. A silent overwrite of B is a fail. Stop at that match.
   - A loads the score page, B saves, A submits the old form.
   - A loads the page, B finalizes, A submits the old form.
   - A loads the page, B changes the lineup, A submits the old score.
   - A loads the page, the night rolls to the next round, A submits.
   - A keeps two tabs open and submits the older tab.
   - A loads, B saves, A refreshes one tab and submits the other.
   - A submits a stale eight-ball score after B saved nine-ball on that table.
   - A submits a stale score for a match that was made up and moved.
   - A submits a stale score after B already recorded the disagreement.
   - A submits a stale score after the match was removed from the score list.
7. Submit refresh submit. War game 7, `dru/war-game-7-submit-refresh-submit`. Testing: a second submit after a refresh must not flip a winner already saved. Captain A submits, refreshes, and submits again. Captain B submits in the gap after the refresh and before A's second submit. Pass: one final score. The second submit is an already-saved refusal or a recorded conflict, not a flipped winner. Stop at that match.
   - A submits, refreshes, submits the same side again.
   - A submits, refreshes, submits the other side.
   - A submits, B submits in the gap, A submits again.
   - A double-clicks submit.
   - A submits, the page errors, A submits again.
   - A submits, refreshes, and the button is still live.
   - A submits on the scorecard, refreshes the schedule, submits again.
   - A and B both refresh, then both submit.
   - A submits, B refreshes, B submits the old winner.
   - A submits a final, refreshes, and the confirm button still posts.
8. Lock against a stale score. War game 8, `dru/war-game-8-lock-against-score`. Testing: a lineup lock and a score from a page loaded before the lock must have one order. Captain A locks the lineup. Captain B is on a score page loaded before the lock and submits. A refreshes and submits a different lineup. Pass: the lock and the score have one recorded order. Both cannot win silently. Stop at that match.
   - B loads the score page before the lock, A locks, B submits.
   - A locks, B submits from a page loaded before the lock, A changes the lineup.
   - A unlocks after B has the score page open, B submits.
   - A locks an incomplete lineup, B submits.
   - A locks, B scores, A resets the lineup.
   - Two captains lock different lineups at the same time.
   - A locks, B refreshes, B still submits the pre-lock score.
   - A locks table 1 while B scores table 1 from an old page.
   - A locks after B has typed racks but not saved.
   - A locks, B submits, A submits a second lineup without a refresh.

The race family is war games 1, 6, 7, and 8. Each one is a different interleaving. Do not fold them into war game 1.

9. Wrong season. War game 9, `dru/war-game-9-wrong-season`. Testing: an id from another season must not write on that season. `dru/war-game-9-wrong-season`. A captain signed into this season writes a score, a lineup, or a message using another season's ids. Pass: the write is refused, and the other season is unchanged after reload. A silent write on the other season is a fail.
   - Score a match id from another season.
   - Lock a lineup for a team on another season.
   - Send a message on another season's match.
   - Publish this season while the body names another season id.
   - Start playoffs with another season's id.
   - Load this season's schedule, then submit a score whose match id was swapped.
   - Open a final from another season through View final.
   - Assign a captain using a player id from another season.
   - Propose a makeup whose match id is from another season.
   - Reload both seasons and compare. The other season must be unchanged.
10. Wrong actor. War game 10, `dru/war-game-10-wrong-actor`. Testing: a signed-out page, a non-captain, and the other team's captain must not land a write. `dru/war-game-10-wrong-actor`. The signed-out page, a player who is not the captain, and a captain for the other team each try a write. Pass: the write is refused, and a reload shows no change. A save that lands is a fail.
   - Save a score with no sign-in.
   - Lock a lineup as a player who is not the captain.
   - Save the other team's rack as this captain.
   - Publish the schedule as a captain, not an admin.
   - Archive the season as a captain.
   - Open the admin teams page as a player.
   - Send a message as the opposing captain on this team's thread.
   - Confirm a score on a phone that is not a captain phone.
   - Change the captain as a player on the roster.
   - Reload the schedule after each refusal and confirm the match is unchanged.

11. Team switch before open. War game 11, `dru/war-game-11-team-switch`. Testing: a roster switch and a free-agent fill are different. A switch moves the membership. A free agent can play on any team on any night and stays a free agent. Pass: after every switch the player is on one team, the old membership has an end time, and season participation matches that team. A one-night fill does not end the free-agent row and does not create a second membership.
   - Join team A. Roster shows A. No other team.
   - Switch to team B. A has an end time. B is the only active membership.
   - Switch back to A. B has an end time. A is a new row, not the old one reopened.
   - Switch to team C. A and B are ended. C is the only active membership.
   - A free agent plays on team B for one night. The free-agent row stays. No membership is opened.
   - That free agent plays on team C the next night. Still one free-agent row. Still no membership.
   - A rostered player on A is also put on B's lineup for the night. Expect a refusal, or the night names them as a fill and A stays their team.
   - Ask to sit on A and C at the same time. Expect one active membership.
   - Captain of A removes the player, captain of B adds them, captain of A adds them again.
   - Admin removes the player, then a captain adds them to another team. Check season participation both times. The admin path may leave it looking rostered.
   - Switch twice without a refresh between them.
   - Switch, refresh the old team page, and submit the old add again.
   - Two captains add the same player to different teams at the same time.
   - A free agent and a roster add for the same player land together. One result. Record which one won.
   - Switch after the lineup is locked. The next lock must not offer the old team.
   - Switch after a score exists. The old score stays on the old team. The new lineup must not name them there.
   - Publish, then switch. Record whether the schedule still names the old team.
   - Reload roster, schedule, and standings. One active team, or one free-agent row, and the three pages agree.

Add the next focus as the next number. Do not reuse a number for a second focus.

## Execution record

Each point gets one line. Do not write a paragraph.

`Point. Expected. Actual. Verdict.`

Verdict is pass, fail, or host. Host means a 429, a timeout, or a throttle, and that point also gets a line under Host obstacles. A fail is a product result: the write landed, the score flipped, or the sentence was wrong. Do not mark a host limit as a fail.

After a save that should have landed, reload three surfaces. The schedule, the scorecard, and the standings must show the same score. If they disagree, the point fails even if one page looks right.

## What the test branch is for



One tournament night. Four tables. Several matches at once. Eight-ball and nine-ball. People score and lock lineups at the same time. The test branch exists to fuzz that: overlapping score saves, two captains writing the same match, a lineup lock racing a score, a second save flipping a finished match. The point is race conditions, not a screen JFL should see on the shipped branch.

## Entropy first


Before any click, roll a seed and write it at the top of the notes.

- Seed: four digits from the clock, plus one letter from A to Z. Example: `2347-K`.
- Season name: two kid-safe words plus the seed. Example: `Star Button Night 2347`. Never reuse a name already on the season menu.
- Team names: four kid-safe names that include the seed. Example: `Star Button Crew 2347`, `Puddle Duck Club 2347`, `Lemon Marble Kids 2347`, `Acorn Pocket Roll 2347`.
- Player names: kid-safe, unique, include the seed. Example: `Moss Button 2347`, `Ribbon Duck 2347`.
- Captain phones: `555` plus the seed plus a team digit. Example: `5552347001`. These are fake numbers. Save them through the admin phone path. Do not use a real phone.
- Pick one random branch from each list below. Write the picks down. Another chat must not copy the same branch set.

Word bank, pick without repeating inside the night: Star, Puddle, Lemon, Acorn, Marble, Button, Ribbon, Pocket, Clover, Fern, Otter, Lantern, Kite, Paper, Brook, Duck, Cue, Sparrow, Firefly, Moth, Willow, Maple, Cedar, Birch, Hazel, Rowan, Compass, Wagon, Cloud, Cinnamon.

## What to open

Site: `https://dru.fremontderby.com`

Confirm `/health` before the night. Record `versionTag` and `deployedAt`. The DRU test actor is already signed in for agent clicks. Google is not required on this lane. If a page says sign in with Google, that page is broken for the test actor. Say so and use the admin endpoint the button itself calls, then reload the public page and confirm the result is visible.

Admin home: `/admin`
Season setup: `/season-setup`
Teams: `/admin/season-teams`
Schedule: `/schedule`
Lineup: `/lineup`
Score: `/scorecard`
Playoffs: `/playoffs`
Standings: `/standings`

## Path

1. Create the season on Season setup. Name it from the seed. League night Wednesday. First round a Wednesday. Tables `1,2,3,4`. Playoff teams 4. Save setup. Record the season id from the season menu. Status should be registration.
2. Create four teams. Prefer the New team box on Admin Teams. If that page stays on "Loading seasons…", the page is demanding a Google token the DRU actor does not have. The same button posts to `/api/admin/seasons/{seasonId}/prepared-teams` with `{ "teamName": "..." }`. Use that only as the button's own request, then confirm the teams on Season setup.
3. Give each team a captain and three players. Save the fake `555` numbers on the admin phone path before publish. Do not waive by a database edit. If the lineup lock says "Lineup players could not be waived", the team has more than the players in the lineup. Remove the extra roster players on the team screen, then lock again. Do not ship a code change from this runbook.
4. Publish the schedule from Season setup. Confirm seven rounds on the schedule page for this season only.
5. Walk one league night on the real screens. Check in, set the lineup, lock it, open the scorecard, enter racks, confirm, finalize. Reload and confirm the schedule says Final.
6. Run the random negative branch, then one makeup, then one captain disagreement.
7. Stop at this war game's pass line. War games 1, 6, 7, and 8 stop at the raced match. Do not start playoffs on those. War game 4 is the one that names a champion: postseason lineups are 4 players plus an anchor, score the semis, advance, score the championship, reload, and confirm the champion on both Schedule and Playoffs.
8. Stop. Do not delete the season. Leave it as evidence. Another chat starts a new seed.

## Random branches

Pick one from each group.

Night shape:
- Score only round 1, then jump to playoffs if the screen allows it.
- Score round 1, propose a makeup for one match, score the other matches, then score the makeup.
- Score two rounds, leave one match unfinished, and record that the night cannot close.

Negative click, do this on purpose:
- Submit a lineup with two players. Expect a refusal.
- Submit the same player twice. Expect a refusal.
- Enter a score that does not add up, then fix it on the scorecard.
- Have the two captains submit different rack winners. Expect a disagreement, then correct it in the UI until both sides match.
- Open Score before the lineup is locked. Expect "No race is open" or the same idea.
- Click Messages, Check in, and Lineup in a different order than the last chat.

Wrong-button pass:
- On the scorecard, switch the date, then switch back.
- Open View final for a match that is not on the score list. Record whether the page says the match is missing.
- Try Advance to championship before both semis are final. Record the refusal.

## Host obstacles

A host limit is not a skip and not a product bug. If the night hits a cap on requests, a 429, a timeout, or a page that only fails because the host throttled the lane, write it here before the night ends. Do not work around it and leave it out. A later pass will go through this list and address each one on purpose.

Write the date, the war game number, the seed, the request that tripped it, the status or the sentence, and what the night did next. Do not delete an old line. Add a new line under it.

Known obstacles:

- 2026-10-06, Ribbon Wagon Night 2352. One browser call that creates every player times out at 30 seconds. Create one team, then pause, then the next team.
- 2026-10-06, Ribbon Wagon Night 2352. A burst of creates returns Cloudflare HTML, status 429, not JSON. Wait 8 seconds and retry that one call. Do not start the next team on a 429.
- 2026-10-06, Ribbon Wagon Night 2352. The contact phone route may 404. Captain `hasPhone: true` is enough. Do not retry the phone save.
- 2026-10-06, Ribbon Wagon Night 2352. `/admin/season-teams` stays on "Loading seasons…" because it wants a Google token. Use the New team button's own request.

## Proof

Write these lines before stopping:

- Seed, season name, season id, version tag.
- Teams and the fake `555` phones used.
- Which random branches ran.
- War game number, focus, and test branch. Example: war game 1, race conditions, `dru/war-game-1-race-conditions`.
- Pass line for that number, and whether it passed.
- The live site stayed on `fremontderby-dru`. The test branch was a script or a preview, not a deploy of that branch.
- Stop category if the night stopped: his bug, test-branch gap, or lane keep.
- Call list: method, path, status, and time for every request this night.
- Host obstacle, if one tripped: request, status or sentence, and the line added under Host obstacles.
- Expected refusal and actual sentence, when a refusal was the point.
- Execution record: one line per point, expected, actual, verdict.
- Surface check after a real save: schedule, scorecard, and standings show the same score.
- Each match: table, score, status after reload.
- Champion only if this war game's pass line asks for one, and the page that showed it.
- Anything that only worked through the button's own request because the page was stuck.

## Do not

- Do not reuse Star Button Night 2347 or Kite String Night 1702. Those already exist.
- Do not merge, push, or open a pull request from this walk.
- Do not touch Gamma or production.
- Do not invent a score in a note and call the night done. The schedule page has to show Final.
- Do not deploy a war-game test branch to dru.fremontderby.com.
- Do not treat an expected refusal as a bug. Record the expected sentence and the actual sentence.
- Do not hide a host limit. A 429, a timeout, or a throttle goes in Host obstacles.

## Work record

Written 2026-10-07 by the DRU lane, on `fremontderby-dru`. This is a record of the doc work, not a new war game.

- The playbook was added under `docs/dru/` so the author can see the rules the night follows. Pull request #3545, card #3544. The word kit was used for the test branch and then removed. It was not a name and not an acronym.
- The author proposed a war game 3 correction on pull request #3546, branch `chatgpt/issue-3544-messaging-contract`. That pull request was not merged. His branch was not changed.
- The same correction was copied onto a DRU branch and merged in pull request #3547, card #3548. War game 3 now tests general chat, team chat, and direct messages with opt-in off and on. A match thread is not part of that night.
- The rules cited in this file were read from `AGENTS.md`, `.github/agents/dru.agent.md`, `.github/agents/jfl.agent.md`, `docs/ENVIRONMENTS.md`, and issue #2883. Those sources were not edited.


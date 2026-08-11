# Season 1 human smoke test

Use this after a green deploy to validate one real regular-season matchup from the normal browser UI. Do **not** create throwaway production teams or players; use actual Season 1 participants (or run the same steps against staging when testing with fictional identities).

## Preconditions

- `/health` and `/health/environment` are healthy.
- Season 1 exists and its regular-season schedule is published.
- Two opposing teams have at least three eligible players each.
- Each captain/player can sign in through `/profile` with Google.

## 1. Player availability

For at least three players on each team:

1. Sign in at `/profile`.
2. Open `/availability`.
3. Choose the upcoming league night by its date/round/team label.
4. Mark **Available**.
5. Refresh and confirm the page still loads the signed-in player's league-night choices without asking for a token, season UUID, or round UUID.

Expected: the availability status saves successfully and the captain can later see the player as available.

## 2. Captain A submits first

1. Sign in as Captain A and open `/lineup`.
2. Choose Team A and the scheduled matchup against Team B from the human-readable picker.
3. Confirm the availability list shows roster players plus any eligible free agents.
4. Select exactly three unique players in slot order and submit.
5. Refresh the page.

Expected:

- Team A's submitted lineup remains visible and locked.
- Captain A cannot reorder/resubmit the committed lineup.
- Team B's player order is still hidden.
- No Team ID, Round ID, or bearer-token input is required.

## 3. Captain B commits

1. Sign in as Captain B and open `/lineup`.
2. Choose the same scheduled matchup.
3. Before submitting, confirm Team A's player order is not visible.
4. Submit three unique players.

Expected: both lineups reveal and the UI reports that three player matches are ready to score.

## 4. Score one player match from both teams

1. Sign in as an authorized Team A scorer and open `/scorecard`.
2. Select one of the newly generated matches by player/team label.
3. Record the first rack.
4. In another signed-in browser/session for Team B, open the same match and record the same rack result.
5. Continue until the handicapped race reaches a valid completed state.

Expected:

- Each team maintains its own rack history.
- Both histories agree before finalization.
- Neither scorer enters a match UUID or bearer token.

Optional reconciliation check before completing the race: intentionally enter one different rack on Team B, confirm the score comparison flags the mismatch, undo/correct it, and confirm the histories reconcile.

## 5. Confirm and finalize

1. Confirm the reconciled score from Team A's side.
2. Confirm it from Team B's side.
3. Finalize the match.

Expected: finalization succeeds only after both team-owned histories agree and both sides confirm.

Repeat steps 4–5 for the other two generated player matches so the team matchup is complete.

## 6. Verify standings

Open `/standings` and verify:

- both teams show one additional game played;
- the winning team receives the correct team result/match points;
- all six players appear with one additional individual match;
- the three individual winners receive wins and the three losers receive losses;
- no blank/forfeit slot creates a fake individual result if a forfeit was used instead of a player.

## Pass criteria

The smoke test passes when a user can complete **availability → sealed three-player lineups → three generated matches → independent dual scoring → reconciliation/confirmation → finalization → standings** using only normal Google-authenticated browser pages and human-readable choices.

Record any failure against #20 with the page, user role, expected behavior, actual behavior, and the approximate time of the attempt. Do not repair production records manually unless the corrective path is itself part of the test.

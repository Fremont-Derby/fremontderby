# DRU batch night API

These calls finish a fresh night on https://dru.fremontderby.com. They are the same requests the admin and score screens use, plus the DRU score lid. They are not a database edit. They are not for Gamma or production.

Proven on Pebble Wagon Night 2427, season `e521b6cd-9573-4a62-abdb-f5caa02bd6d7`, version `69dfdf7ef3f2d895ec50d4799d0a168ab5863325`. Champion: Acorn Lantern Roll 2427 beat Kite Brook Club 2427, racks 3–0.

## Calls

Create the season.

`POST /api/admin/seasons`

Body: season name, Wednesday, first round date, tables `[1,2,3,4]`, playoff teams 4. Response 201 with `setup.id`.

Create one team at a time.

`POST /api/admin/seasons/{seasonId}/prepared-teams`

Body: `{ "teamName": "..." }`. Response 201 with `team.id`.

Create a player, put them on the roster, then name the captain.

`POST /api/admin/players` with `{ "displayName": "...", "allowExactDuplicate": true }`

`PUT /api/admin/players/{playerId}/admin-role` with `{ "operation": "roster-membership", "seasonId", "teamId", "active": true, "reason": "DRU test roster" }`

`POST /api/admin/seasons/{seasonId}/teams/{teamId}/captain` with `{ "playerId": captainId }`

Publish.

`POST /api/admin/seasons/{seasonId}/publish-schedule` with `{}`. Response 201, 7 rounds, 28 matches. Publish can attach teams this night did not create. Score those too or playoffs stay closed.

Read the schedule.

`GET /api/seasons/{seasonId}/schedule`

Score a match. This opens three races and finalizes the match.

`POST /api/dru/matches/{teamMatchId}/score` with `{ "winnerSide": "A" }` or `"B"`. Response 200 `{ "saved": true, "races": 3 }`.

Open races without scoring.

`POST /api/dru/matches/{teamMatchId}/open-scoring`. Response 200 `{ "opened": 3 }`.

Start playoffs only after every regular match is final.

`POST /api/admin/seasons/{seasonId}/start-playoffs`. Response 201 with two semifinal ids.

Advance after both semis are final.

`POST /api/admin/seasons/{seasonId}/advance-championship`. Response 201 with `championship_match_id`.

Score the semis and the championship with the same score call. The schedule read can lag. A 409 that says the match is already saved means the score stuck. Read the schedule again before deciding it failed.

## Negative calls from this night

Playoffs before any match is final: `POST /api/admin/seasons/{id}/start-playoffs` returned 409, `All seven regular-season matchups must be complete before playoffs.`

Unknown match: `POST /api/dru/matches/not-a-match/score` returned 404, `Match not found.`

Bad side: `POST /api/dru/matches/{id}/score` with `{ "winnerSide": "C" }` returned 400, `winnerSide must be A or B`.

Second score: the same match returned 409, `This match is already saved. A captain has to correct it.`

Advance before the semis: `POST /api/admin/seasons/{id}/advance-championship` returned 409, `Both semifinals must be finalized, including any required anchor tiebreaker`.

Create one team at a time. A burst of player creates returns Cloudflare HTML with status 429, not JSON. Wait and retry that one call.

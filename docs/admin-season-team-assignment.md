# Admin season team assignment

Issue: #336

The league-admin Season teams surface uses the existing `private.season_team_slots` capacity model rather than creating a second season-membership system.

- **Returning** shows the most recent prior-season record for a team name that is not already represented in the target season.
- **New** shows teams already created for the target season that do not yet occupy a season slot.
- **In season** shows active slot assignments/reservations for the selected season.
- Adding a returning team creates a new season-specific `public.teams` record with the same name and links the source through `source_team_id`.
- Historical memberships are never copied. Players/captains must be deliberately rostered for the new season through the existing roster-management controls.
- The database takes the season capacity advisory lock, checks the configured capacity, prevents duplicate active assignment, and records `season.admin_add_team` in `private.audit_events`.
- Candidate reads and assignment writes are callable only by the Worker service role; the database independently verifies the authenticated actor is a league admin.

The UI must never ask an operator for UUIDs. It is searchable by team/captain and is intentionally card-based on narrow screens.

## JFL prepared-team creation recovery (#3649)

In JFL, Create team sends a generated `operationId` with `teamName` to
`POST /api/admin/seasons/:season/prepared-teams`. The private operation record
binds that ID to the authenticated admin, target season and trimmed name. The
service-only RPC commits one team, one creation audit and its operation mapping
atomically. Concurrent equivalent requests return the same committed team;
reusing an ID for different input is rejected. Legacy clients without an ID
retain the original creation contract.

A lost, malformed or failed response leaves creation unconfirmed and disables
another creation until the operator chooses Reload teams. That action uses
`GET /api/admin/seasons/:season/prepared-team-operations/:operation` to look up
the result without creating anything. A confirmed result restores the normal
captain/roster continuation. An absent result enables an explicit Try creation
again with the same ID; no POST is replayed automatically. HTTP 429 requires a
validated Retry-After of at most 300 seconds before recovery. Missing or invalid
delay information keeps creation blocked.

The pending ID and name survive a page refresh in session storage, bound to a
SHA-256 digest of the captured session token. The record contains no bearer
token. Confirmation, session replacement or changing the selected season clears
it; changing the name after an absent-result lookup starts a new intent. The GET
route is JFL-only, authenticated and non-cacheable; its database function checks
admin membership and actor/season ownership before returning a result. The
operation table has RLS and no direct browser or service-role table grants.

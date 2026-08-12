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

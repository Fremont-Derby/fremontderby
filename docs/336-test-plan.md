# #336 two-human acceptance

Use the existing league-admin account for the admin actions. The normal player account is only a negative authorization check for this admin surface.

1. Admin opens Season setup and taps **Manage season teams**.
2. Select a draft/registration season and confirm the capacity reads `N of 8 teams` (or the configured capacity).
3. Returning shows prior-season teams not already represented in the selected season; search by team or captain.
4. Tap **Add to season** on one returning team. It moves to In season after refresh and capacity increments by exactly one.
5. Verify the new season team has no copied historical roster. Add players deliberately with the existing admin roster controls.
6. Tap Add repeatedly/directly for the same source team; no duplicate occupied slot is created.
7. Fill all configured slots; further Add attempts are rejected by the server.
8. Normal player account opens the page/API and receives an authorization denial rather than team-management data.

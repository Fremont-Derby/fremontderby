# HTTP API reference (agent-oriented)

Generated inventory for **#363**. Auth is session Bearer unless noted. Prefer Worker routes over direct Supabase from the browser.

| Method (typical) | Path | Defined near | Notes |
|------------------|------|--------------|-------|
| GET | `/` | appShell.js, router.js | Public or auth |
| GET/POST | `/admin` | appShell.js | Admin |
| GET/POST | `/admin/audit` | router.js | Admin |
| GET/POST | `/admin/operations` | router.js | Admin |
| GET/POST | `/admin/player-contact` | routerEntry.js | Admin |
| GET/POST | `/admin/players` | router.js | Admin |
| GET/POST | `/admin/season-teams` | adminSeasonTeamsRouter.js | Admin |
| GET/POST | `/admin/seasons` | router.js, routerEntry.js | Admin |
| GET/POST | `/admin/support` | routerEntry.js | Admin |
| GET/POST | `/api/admin/audit-events` | adminAuditPage.js, index.js | Admin |
| GET/POST | `/api/admin/audit-webhooks/flush` | adminAuditPage.js, index.js | Admin |
| GET/POST | `/api/admin/chat-reports` | router.js | Admin |
| GET/POST | `/api/admin/chat-reports/` | chatModerationPage.js | Admin |
| GET/POST | `/api/admin/chat-reports?limit=1` | chatPage.js | Admin |
| GET/POST | `/api/admin/chat-reports?limit=100` | chatModerationPage.js | Admin |
| GET/POST | `/api/admin/notifications/broadcast` | adminOperationsPage.js, index.js | Admin |
| GET/POST | `/api/admin/operations` | adminOperationsPage.js, profilePage.js, router.js | Admin |
| GET/POST | `/api/admin/players` | adminGatewayPage.js, adminPlayersPage.js, router.js | Admin |
| GET/POST | `/api/admin/players/` | adminPlayerContactPage.js, adminPlayersPage.js, livePageRefresh.js | Admin |
| GET/POST | `/api/admin/seasons` | adminSeasonTeamsPage.js, adminSeasonsPage.js, seasonLifecycleEnhancer.js | Admin |
| GET/POST | `/api/admin/seasons/` | adminSeasonTeamsPage.js, playoffsPage.js, prizesPage.js | Admin |
| GET/POST | `/api/admin/support` | adminSupportHttp.js | Admin |
| GET/POST | `/api/admin/support?state=` | adminSupportPage.js | Admin |
| GET/POST | `/api/admin/team-applications/` | seasonSetupPage.js | Admin |
| GET/POST | `/api/admin/team-slots/` | seasonSetupPage.js | Admin |
| GET | `/api/chat-reports` | chatPage.js, router.js | Public or auth |
| GET | `/api/check-in` | pathAliases.js | Public or auth |
| GET | `/api/direct-conversations` | chatPage.js, router.js | Public or auth |
| GET | `/api/direct-conversations/` | chatPage.js | Public or auth |
| GET | `/api/me/availability` | pathAliases.js | Auth |
| GET | `/api/me/blocked-players` | router.js | Auth |
| GET | `/api/me/captain-teams` | pathAliases.js | Auth |
| GET | `/api/me/chat-threads` | chatPage.js, router.js | Auth |
| GET | `/api/me/check-in` | pathAliases.js | Auth |
| GET | `/api/me/checkin` | pathAliases.js | Auth |
| GET/POST | `/api/me/contact` | livePageRefresh.js, playerContactHttp.js, profileContactEnhancer.js | Auth |
| GET/POST | `/api/me/contact?reveal=1` | profileContactEnhancer.js | Auth |
| GET | `/api/me/direct-conversations` | pathAliases.js, router.js | Auth |
| GET | `/api/me/direct-message-candidates` | chatPage.js, router.js | Auth |
| GET | `/api/me/direct-message-inbox` | chatPage.js, pathAliases.js, router.js | Auth |
| GET | `/api/me/direct-messages` | pathAliases.js, router.js | Auth |
| GET | `/api/me/dms` | pathAliases.js, router.js | Auth |
| GET | `/api/me/fa` | pathAliases.js | Auth |
| GET | `/api/me/free-agent` | pathAliases.js | Auth |
| GET | `/api/me/invitations` | index.js, pathAliases.js | Auth |
| GET | `/api/me/invites` | pathAliases.js | Auth |
| GET | `/api/me/league-chat-threads` | chatPage.js, router.js | Auth |
| GET/POST | `/api/me/lineup` | pathAliases.js | Auth |
| GET/POST | `/api/me/lineups` | pathAliases.js | Auth |
| GET | `/api/me/matches` | pathAliases.js, router.js | Auth |
| GET | `/api/me/matchup-chat-threads` | chatPage.js, router.js | Auth |
| GET | `/api/me/membership-requests` | index.js, pathAliases.js, router.js | Auth |
| GET | `/api/me/message-notification-summary` | appShell.js, router.js | Auth |
| GET | `/api/me/notifications` | index.js, notificationsPage.js | Auth |
| GET | `/api/me/notifications/` | notificationsPage.js | Auth |
| GET | `/api/me/notifications/clear` | pathAliases.js | Auth |
| GET | `/api/me/notifications/mark-all-read` | index.js, pathAliases.js | Auth |
| GET | `/api/me/notifications/mark-as-read-all` | pathAliases.js | Auth |
| GET | `/api/me/notifications/read-all` | index.js, notificationsPage.js, pathAliases.js | Auth |
| GET | `/api/me/pending-ready-checks` | pathAliases.js | Auth |
| GET | `/api/me/player` | pathAliases.js | Auth |
| GET | `/api/me/player-claim` | playerClaimHttp.js, profilePlayerClaimEnhancer.js | Auth |
| GET | `/api/me/player-claim-options` | playerClaimHttp.js, profilePlayerClaimEnhancer.js | Auth |
| GET | `/api/me/player-profile` | pathAliases.js | Auth |
| GET | `/api/me/prizes` | pathAliases.js | Auth |
| GET | `/api/me/profile` | index.js, pathAliases.js, profileContactEnhancer.js | Auth |
| GET | `/api/me/profile/standing-availability` | index.js, pathAliases.js, profilePage.js | Auth |
| GET | `/api/me/races` | pathAliases.js | Auth |
| GET | `/api/me/ready-check` | pathAliases.js, router.js | Auth |
| GET | `/api/me/ready-checks` | appShell.js, pathAliases.js, router.js | Auth |
| GET | `/api/me/scorable` | pathAliases.js | Auth |
| GET | `/api/me/scorable-matches` | pathAliases.js, router.js, scorePickerPage.js | Auth |
| GET | `/api/me/score` | pathAliases.js | Auth |
| GET | `/api/me/scorecard` | pathAliases.js | Auth |
| GET | `/api/me/standing-availability` | pathAliases.js | Auth |
| GET | `/api/me/team-invitations` | index.js, pathAliases.js | Auth |
| GET | `/api/me/team-invites` | pathAliases.js | Auth |
| GET | `/api/me/team-match-choices` | availabilityPage.js, router.js | Auth |
| GET | `/api/me/team-membership-requests` | index.js, pathAliases.js, router.js | Auth |
| GET | `/api/me/teams` | availabilityPage.js, index.js, lineupPage.js | Auth |
| GET | `/api/me/trade-management` | pathAliases.js | Legacy/retired — see trades removal |
| GET | `/api/me/trades` | index.js, pathAliases.js, tradesPage.js | Legacy/retired — see trades removal |
| GET | `/api/my-trades` | pathAliases.js | Legacy/retired — see trades removal |
| GET | `/api/player-matches/:id/finalize-reconciled` | liveRackLedgerAdapter.js | Public or auth |
| GET | `/api/player-matches/:id/score-comparison` | liveRackLedgerAdapter.js | Public or auth |
| GET | `/api/player-matches/:id/score-confirm` | liveRackLedgerAdapter.js | Public or auth |
| GET | `/api/player-matches/:id/score-racks` | liveRackLedgerAdapter.js | Public or auth |
| GET | `/api/player-matches/:id/score-racks/undo` | liveRackLedgerAdapter.js | Public or auth |
| GET | `/api/player-matches/:id/scorecard` | liveRackLedgerAdapter.js | Public or auth |
| GET | `/api/players/` | chatPage.js | Public or auth |
| GET | `/api/prize-pool` | index.js, pathAliases.js | Public or auth |
| GET | `/api/prizes` | index.js, pathAliases.js | Public or auth |
| GET | `/api/ready-check` | pathAliases.js | Public or auth |
| GET | `/api/ready-checks` | pathAliases.js, router.js, teamsPage.js | Public or auth |
| GET | `/api/ready-checks/` | appShell.js | Public or auth |
| GET | `/api/ready-checks/pending` | pathAliases.js, router.js | Public or auth |
| GET | `/api/score/matches` | pathAliases.js | Public or auth |
| GET | `/api/seasons` | index.js, playersDirectoryPage.js, playoffsPage.js | Public or auth |
| GET | `/api/seasons/` | appShell.js, availabilityPage.js, chatPage.js | Public or auth |
| GET | `/api/team-applications/` | teamsPage.js | Public or auth |
| GET | `/api/team-invitations/` | teamsPage.js | Public or auth |
| GET | `/api/team-matches/` | availabilityPage.js, chatPage.js, pathMatch.js | Public or auth |
| GET | `/api/team-membership-requests/` | teamsPage.js | Public or auth |
| GET | `/api/team-memberships/` | teamsPage.js | Public or auth |
| GET | `/api/team-slots/` | teamsPage.js | Public or auth |
| GET | `/api/team-trades/` | tradesPage.js | Legacy/retired — see trades removal |
| GET | `/api/teams/` | chatPage.js, pathMatch.js, teamsPage.js | Public or auth |
| GET | `/api/teams/:teamId/rounds/:roundId/availability` | lineupPage.js | Public or auth |
| GET/POST | `/api/teams/:teamId/rounds/:roundId/lineup` | lineupPage.js | Public or auth |
| GET | `/api/teams/ready-checks` | pathMatch.js, router.js, teamsPage.js | Public or auth |
| GET | `/api/teams/…` | pathMatch.js | Public or auth |
| GET | `/api/trades` | pathAliases.js | Legacy/retired — see trades removal |
| GET | `/availability` | appShell.js, index.js | Public or auth |
| GET | `/demo` | appShell.js, router.js, routerEntry.js | Public or auth |
| GET | `/design-system` | router.js | Public or auth |
| GET | `/favicon.svg` | router.js | Public or auth |
| GET | `/health` | index.js | Public or auth |
| GET | `/health/environment` | index.js | Public or auth |
| GET | `/health/features` | index.js | Public or auth |
| GET | `/internal/hourly-probe` | routerEntry.js | Public or auth |
| GET/POST | `/lineup` | appShell.js, index.js | Public or auth |
| GET | `/messages` | router.js | Public or auth |
| GET | `/messages/moderation` | router.js | Public or auth |
| GET | `/notifications` | appShell.js, router.js | Public or auth |
| GET | `/players` | appShell.js, index.js, router.js | Public or auth |
| GET | `/playoffs` | appShell.js, router.js | Public or auth |
| GET | `/prizes` | appShell.js, index.js, publicSeasonSelectionEnhancer.js | Public or auth |
| GET | `/profile` | index.js, routerEntry.js | Public or auth |
| GET | `/rules` | appShell.js, router.js | Public or auth |
| GET | `/sandbox/captain` | router.js | Public or auth |
| GET | `/sandbox/player` | router.js | Public or auth |
| GET | `/schedule` | publicSeasonSelectionEnhancer.js, router.js, routerEntry.js | Public or auth |
| GET | `/scorecard` | index.js, router.js | Public or auth |
| GET | `/scorecard/live` | router.js | Public or auth |
| GET | `/season-setup` | appShell.js, index.js, routerEntry.js | Public or auth |
| GET | `/standings` | index.js, publicSeasonSelectionEnhancer.js | Public or auth |
| GET | `/teams` | index.js, routerEntry.js | Public or auth |
| GET | `/trades` | appShell.js, index.js, router.js | Legacy/retired — see trades removal |

## Auth
- Browser: `Authorization: Bearer <access_token>` from Profile session.
- Admin routes additionally require league-admin RPC authorization server-side.
- Service role never appears in the browser.

## Legacy
- Formal trades routes retired (#362).
- Matchup chat not a current product API.

## Maintenance
Update this file when adding router paths. Agents should not invent endpoints not listed here or in `src/routerEntry.js`.

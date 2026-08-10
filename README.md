# Fremont Derby

Seasonal in-house pool league software for Fremont Derby.

## Worker surfaces

- `/` shows the Fremont Derby deployment page and Cloudflare Worker version ID.
- `/availability` serves the player availability UI for free-agent registration and round availability.
- `/health` returns deployment/version metadata as JSON.
- `/health/environment` returns non-secret Supabase environment readiness diagnostics.
- `/lineup` serves the captain lineup UI for round availability, four-slot lineup submission, and visible lineup review.
- `/profile` serves the sign-in/profile UI for player display name, rating, team, and season summaries.
- `/prizes` serves the public season purse UI for aggregate collected/committed totals, projected payouts, and finalized payout snapshots.
- `/scorecard` serves the phone scorecard UI for loading a player match, recording racks, undoing the latest unfinalized rack, and finalizing a completed race.
- `/season-setup` serves the league-director setup UI for creating/updating Season 1 settings and publishing the seven-round schedule.
- `/standings` serves the public team and individual standings UI for a season.
- `/teams` serves the team management UI for team creation, invitations, and roster actions.

## Local validation

```bash
npm run check
npm test
```

Cloudflare development/deployment uses Wrangler:

```bash
npm run dev
npm run deploy
```

The Cloudflare Worker connected to this repository must be named `fremontderby` to match `wrangler.jsonc`.

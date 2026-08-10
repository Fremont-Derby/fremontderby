# Fremont Derby

Seasonal in-house pool league software for Fremont Derby.

## Worker surfaces

- `/` shows the Fremont Derby deployment page and Cloudflare Worker version ID.
- `/health` returns deployment/version metadata as JSON.
- `/lineup` serves the captain lineup UI for round availability, four-slot lineup submission, and visible lineup review.
- `/scorecard` serves the phone scorecard UI for loading a player match, recording racks, undoing the latest unfinalized rack, and finalizing a completed race.
- `/standings` serves the public team and individual standings UI for a season.

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

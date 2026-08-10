# Fremont Derby

Seasonal in-house pool league software for Fremont Derby.

## Worker surfaces

- `/` shows the Fremont Derby deployment page and Cloudflare Worker version ID.
- `/health` returns deployment/version metadata as JSON.
- `/scorecard` serves the phone scorecard UI for loading a player match, recording racks, undoing the latest unfinalized rack, and finalizing a completed race.

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

# Fremont Derby

Seasonal in-house pool league software for Fremont Derby.

## Deployment smoke test

This first application intentionally has no external services or build step. It exists to verify the GitHub → Cloudflare Worker → `fremontderby.com` production path before feature development begins.

- `/` shows a minimal Fremont Derby deployment page and Cloudflare Worker version ID.
- `/health` returns deployment/version metadata as JSON.

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

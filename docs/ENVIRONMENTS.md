# Environments

Fremont Derby uses three isolated environments.

## Local
- Runs with `wrangler dev`.
- Uses local/test data only.
- Never contains production service-role credentials.

## Staging
- Cloudflare Worker environment: `staging` (`fremontderby-staging`).
- Deploy with `npx wrangler deploy --env staging`.
- Uses a dedicated staging Supabase project.
- Intended for end-to-end tests and manual QA before production.
- May use the generated `*.workers.dev` hostname until a custom staging hostname is added.

## Production
- Existing GitHub-linked Cloudflare Worker.
- Public hostname: `https://fremontderby.com`.
- Uses the production Supabase project only.
- Main-branch deployment remains the production path.

## Required variables

| Variable | Browser safe? | Purpose |
|---|---:|---|
| `ENVIRONMENT` | yes | `local`, `staging`, or `production` |
| `SUPABASE_URL` | yes | environment-specific Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | yes | client-safe Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | **no** | trusted Worker operations only |

Real values are configured outside Git. `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to browser code.

## Promotion rule
1. Pull request: lint, syntax, tests, Worker dry-run bundle.
2. Staging: deploy candidate against staging-only data/secrets and run E2E tests.
3. Production: merge validated change to `main`; Cloudflare Git integration deploys the production Worker.

## Safety invariant
Staging and production must have different Supabase project URLs/IDs. Any startup or test tooling that sees the same project configured for both environments should fail loudly.

# Environments

Fremont Derby uses three isolated environments.

## Local
- Runs with `wrangler dev`.
- Uses local/test data only.
- Never contains production service-role credentials.

## Staging
- Cloudflare Worker environment: `staging` (`fremontderby-staging`).
- Deploy with `npx wrangler deploy --env staging`.
- Supabase project ref: `oqkkvqkerusepyokzbmt`.
- Supabase URL: `https://oqkkvqkerusepyokzbmt.supabase.co`.
- This is the hosted project currently carrying the Fremont Derby migrations and is the target for authorization/E2E verification.
- Intended for end-to-end tests and manual QA before production.
- May use the generated `*.workers.dev` hostname until a custom staging hostname is added.

## Production
- Existing GitHub-linked Cloudflare Worker.
- Public hostname: `https://fremontderby.com`.
- Supabase project ref: `cpiucsxlkicmlbvdvhww`.
- Supabase URL: `https://cpiucsxlkicmlbvdvhww.supabase.co`.
- This project is reserved for production and must not be used by staging or local development.
- Main-branch deployment remains the production path.

## Required variables

| Variable | Browser safe? | Purpose |
|---|---:|---|
| `ENVIRONMENT` | yes | `local`, `staging`, or `production` |
| `SUPABASE_URL` | yes | environment-specific Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | yes | client-safe Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | **no** | trusted Worker operations only |

Real credentials are configured outside Git. `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to browser code.

## Promotion rule
1. Pull request: lint, syntax, tests, Worker dry-run bundle.
2. Staging: deploy candidate against staging-only data/secrets and run E2E tests.
3. Production: merge validated change to `main`; Cloudflare Git integration deploys the production Worker.

## Safety invariant
Staging and production have different Supabase project URLs/IDs. Any startup or test tooling that sees the same project configured for both environments should fail loudly.

## Provisioning status
- Distinct hosted Supabase projects exist for staging and production.
- Staging currently carries the Fremont Derby migration set used for hosted authorization verification.
- Production is intentionally kept separate; production schema promotion and Worker secret wiring must be verified before #35 is closed.
- Never copy staging service-role credentials into the production Worker, or vice versa.

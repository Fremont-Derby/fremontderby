# Beta / gamma environment (open auth)

Isolated Worker + database for automated and human testing **without Google sign-in**.

## Goals
- Deploy from a non-production branch/env to a **beta subdomain** (or `*.workers.dev`)
- API auth can be bypassed **only** when `ENVIRONMENT=beta` and `BETA_AUTH_BYPASS=1`
- Production and staging behavior unchanged

## Author / operator configuration checklist

### 1. Supabase (separate from production)
- [ ] Create or reuse a **non-production** Supabase project for beta
- [ ] Apply the same migrations as main
- [ ] Create at least one auth user (or service-linked player) whose UUID will be `BETA_ACTOR_USER_ID`
- [ ] Grant that user **league admin** (and any captain memberships needed for scoring tests)
- [ ] Optional: seed demo roster data on this project only

### 2. Cloudflare Worker `beta` env (`wrangler.jsonc` → `env.beta`)
Replace placeholders:
- [ ] `SUPABASE_URL` — beta project URL
- [ ] `SUPABASE_PUBLISHABLE_KEY` — beta publishable key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — **secret** (wrangler secret / dashboard), never commit
- [ ] `BETA_ACTOR_USER_ID` — UUID of the beta admin/actor in that database
- [ ] `BETA_EXPECTED_SUPABASE_PROJECT_REF` — project ref host label (safety check)
- [ ] `BETA_AUTH_BYPASS=1` — required for open auth

### 3. DNS / subdomain
- [ ] Attach a route such as `beta.fremontderby.com` (or keep `fremontderby-beta.<account>.workers.dev`)
- [ ] Ensure production custom domains still point only at the production Worker

### 4. Deploy
```bash
npm run deploy:beta
# or: npx wrangler deploy --env beta
```

### 5. Verify
- [ ] `GET /health/environment` on beta reports `environment: "beta"` and readiness checks
- [ ] Authenticated API routes accept **no** `Authorization` header and act as `BETA_ACTOR_USER_ID`
- [ ] Production still requires a real bearer token (bypass not active)

## Safety rules
- Bypass is hard-gated on `ENVIRONMENT === "beta"` (not staging, not production)
- Do not set `BETA_AUTH_BYPASS` on production
- Do not point beta `SUPABASE_URL` at the production Supabase project

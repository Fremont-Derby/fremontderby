# Demo league seed

Mid-season oriented mock data: players, phones, captains, rosters, team messages, schedules.

## Automatic after production deploy
`scripts/deploy-production.mjs` runs the seed **after a successful Worker deploy** when:

```bash
SEED_DEMO_ON_DEPLOY=1
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SEED_ACTOR_USER_ID=...          # existing league admin user UUID
# optional:
SEED_SCENARIO=active            # default active when hooked from deploy
```

Those values must exist in the **deploy environment** (Workers CI / GitHub Actions / wherever `npm run deploy` runs). Cloudflare Worker deploy alone cannot write Supabase without those secrets.

The seed is **idempotent**: if a season with the same demo name already exists, that phase is skipped.

## Manual apply
```bash
# Apply migration 20260813010000_admin_demo_seed_helpers.sql first.
export SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...
export SEED_ACTOR_USER_ID=...
export SEED_SCENARIO=active
export SEED_APPLY=1
node scripts/seed-demo-league.mjs
```

## Coverage
| Area | Seeded |
|------|--------|
| Players / phones / edge names | Yes |
| Captains + varied rosters | Yes |
| Team messages | Yes |
| Mid-season schedule (past+future rounds) | Yes |
| Dual rack scores / finalize / prize $ | No |

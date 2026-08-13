# Demo league seed (operator-run)

Optional helper to create a batch of **unclaimed players** and **prepared teams** on a **draft or registration** season.

## What it does
- Reads `config/demo-league-seed.json`
- Calls existing RPCs:
  - `admin_create_unclaimed_player`
  - `admin_create_prepared_team`
- Default mode is **dry-run** (no writes)

## What it does not do
- Does not run on Cloudflare deploy by itself
- Does not assign captains or roster memberships
- Does not modify complete/active competitive seasons (prepared teams require draft/registration)
- Does not create auth users or Google accounts

## Operator steps
1. Choose the target season id (draft or registration).
2. Choose a league-admin user id to use as `SEED_ACTOR_USER_ID` (required by the RPCs for audit).
3. Dry-run:

```bash
node scripts/seed-demo-league.mjs
```

4. Apply:

```bash
export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="..."
export SEED_ACTOR_USER_ID="..."
export SEED_SEASON_ID="..."
export SEED_APPLY=1
node scripts/seed-demo-league.mjs
```

Edit `config/demo-league-seed.json` to change names before running.

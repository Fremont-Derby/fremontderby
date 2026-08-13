# Demo league seed (operator-run)

Mock data helper for **players**, **prepared teams**, **season setup**, and optional **schedule publication** (7 rounds / 28 matches).

## Default
Dry-run only:

```bash
node scripts/seed-demo-league.mjs
```

## Apply
```bash
export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="..."
export SEED_ACTOR_USER_ID="..."          # existing league admin user UUID
export SEED_SCENARIO=all                 # players | registration | active | all
# optional: export SEED_SEASON_ID="..."  # reuse one draft/registration season
export SEED_APPLY=1
node scripts/seed-demo-league.mjs
```

## Lifecycle coverage

| Phase | Covered by script |
|------|-------------------|
| Unclaimed players | Yes |
| Season setup (registration/draft) | Yes (`configure_season_setup`) |
| Eight prepared teams | Yes |
| Publish schedule (active) | Yes (`publish_season_schedule` + domain round-robin) |
| Captain assignment | No — Admin UI / separate RPC |
| Roster membership | No — Admin UI / separate RPC |
| Dual rack scoring + finalize | No — live scoring path |
| Prize dollar amounts | No — admin prize config |
| Phones / messages | No |

## Data file
Edit `config/demo-league-seed.json` for names and season setup fields.

## Notes
- Prepared teams require a **draft** or **registration** season.
- Publication requires **exactly eight** team ids and builds **seven** rounds / **twenty-eight** matches.
- Does not run automatically on Cloudflare deploy.

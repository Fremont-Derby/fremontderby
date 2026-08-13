# Demo league seed (operator-run)

Mid-season oriented mock data: players, phones, captains, rosters, team messages, and schedules.

## Apply
```bash
# Apply migration 20260813010000_admin_demo_seed_helpers.sql first (phones/messages helpers).
export SUPABASE_URL="..."
export SUPABASE_SERVICE_ROLE_KEY="..."
export SEED_ACTOR_USER_ID="..."
export SEED_SCENARIO=active   # players | registration | active | all
export SEED_APPLY=1
node scripts/seed-demo-league.mjs
```

## Coverage

| Area | Seeded |
|------|--------|
| Unclaimed players | Yes (edge names included) |
| Phones | Yes (via `admin_seed_player_phone`; one intentional no-phone free agent) |
| Prepared teams (8) | Yes |
| Captains | Yes (phone required for active) |
| Rosters | Yes (sizes 2–5 by team) |
| Team chat messages | Yes (one team intentionally silent) |
| Schedule 7×28 | Yes on `active` / `all` |
| Half-season calendar | Yes — first rounds dated in the past |
| Dual rack scores / finalize | No |
| Prize dollar amounts | No |
| Auth users / Google accounts | No |

## Edge cases in the data file
- Short roster (2) and deep bench (5)
- Short display name (`Q`) and long display name
- Similar names (`Jordan Lee` vs `Jordan Lee (sub)`)
- Free agents left unassigned
- Player with no phone
- Team with no seeded messages

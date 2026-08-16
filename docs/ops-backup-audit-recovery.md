# Operations: backups, audit, observability, recovery (#30)

Season 1 baseline for protecting league history and diagnosing production failures without hand-reconstructing results.

## 1. Health and readiness

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Service up; includes `version` / `versionTag` (deploy SHA) |
| `GET /health/environment` | Lane identity (`production` \| `gamma` \| `dru` \| `jfl`) + readiness |
| `GET /health/features` | Feature flags / capability surface |

**Ops rule:** After every production deploy, confirm `/health/environment` reports `environment=production` and `versionTag` matches the merged `main` SHA.

Hourly coverage: `.github/workflows/hourly-live-probe.yml` + `scripts/hourly-live-probe.mjs` probes public routes and `/health/environment` on production and lane hosts.

## 2. Audit logging

Privileged changes write to `private.audit_events` (actor, action, entity, before/after, timestamp).

Covered classes include (non-exhaustive):

- Season publication / lifecycle
- Roster exceptions, membership, trades
- Score corrections / rack undo / finalize paths
- Prize configuration and payouts
- Admin moderation and role changes

**Operator UI:** `/admin/audit` (league-admin only) for review.

**Score correction acceptance:** finalized corrections must leave an audit row identifying actor, time, reason, and before/after state. If a correction RPC path does not audit, treat that as a defect on the scoring card—not a gap in this baseline.

## 3. Database backup and restore

### Platform ownership

Production and staging data live in **Supabase**. Backups are **platform-managed**:

1. Open the Supabase project dashboard for production.
2. Confirm **Point-in-Time Recovery (PITR)** or daily backups are enabled for the plan in use.
3. Note retention window (e.g. 7 days on paid PITR; plan-dependent on free).

Agents cannot enable billing features; a human confirms PITR in the dashboard before Season 1 open.

### Restore procedure (staging / non-prod first)

1. **Prefer restore into a throwaway or staging project**, never straight over live production without a freeze.
2. Supabase Dashboard → Database → Backups → restore to target project **or** use a logical export:
   - `pg_dump` / Supabase backup download when available
   - Apply to a clean database and run `supabase/migrations` only if rebuilding from schema + seed, not when restoring a full physical backup
3. Verify referential integrity with a minimal probe:
   - `select count(*) from public.seasons;`
   - `select count(*) from public.players;`
   - `select count(*) from private.audit_events;`
   - Sample one known season schedule + standings read via Worker `/schedule` and `/standings`
4. Only after staging proof: schedule a production maintenance window and restore with the same steps, then redeploy Workers if env/secrets drifted.

### Reproducible export (schema + critical config)

For configuration-as-code recovery independent of PITR:

- Schema truth: `supabase/migrations/*.sql` on `main`
- Worker/env truth: `wrangler.jsonc` + Cloudflare secrets (not in Git)
- Domain truth: wrangler `custom_domain` routes (`scripts/lane-custom-domains.mjs`)

## 4. Bad deployment recovery

Symptoms: wrong `environment` on a host, 5xx on `/health`, missing routes, old `versionTag`.

1. Check Actions run for `deploy-release-lanes` / production deploy failure.
2. Confirm `/health` and `/health/environment` on the affected host.
3. Re-run deploy from the last known good `main` SHA (self-hosted runner or `wrangler deploy --env production` with secrets present).
4. Do **not** “fix” by attaching domains ad-hoc; use wrangler-owned routes (#639).
5. If gamma is healthy and production is not, promote the same gamma-tested SHA again rather than hotfixing on the Worker alone.

## 5. Bad data change recovery

Symptoms: wrong roster, incorrect score finalization, accidental season publish.

1. **Stop writes** if the blast radius is large (communicate to captains; avoid further scoring).
2. Read `/admin/audit` (or `private.audit_events`) for actor, action, before/after.
3. Prefer **compensating audited RPCs** (score correct, roster exception, season lifecycle) over manual SQL.
4. Manual SQL only as last resort, on a backup-restored copy first, with a written reason and a new audit row if a service-role path exists.
5. Trusted commands must be atomic inside a transaction (existing RPCs); a failed command must not leave half-applied league state—if it does, file a defect against that RPC.

## 6. Structured logs and correlation

- Worker responses and trusted command failures surface **friendly** errors to the client (no stack traces).
- Deploy identity is the primary correlation key: `versionTag` on `/health`.
- GitHub Actions run IDs correlate deploy and probe failures.
- Admin audit rows correlate privileged mutations to actors.

External APM/error SaaS is optional for Season 1; health probes + audit + Actions notifications are the required floor.

## 7. Acceptance mapping

| Acceptance test | How we meet it |
|-----------------|----------------|
| Staging restore without losing integrity | §3 restore procedure + count probes |
| Finalized score correction has actor/time/reason/before/after | `private.audit_events` + scoring correction RPCs |
| Failed trusted command does not partially apply | Transactional security-definer RPCs |
| Docs for bad deploy and bad data recovery | §4 and §5 |

## 8. Operator checklist before Season 1

- [ ] Supabase production backup/PITR confirmed in dashboard
- [ ] Staging restore drill completed once (or documented why deferred)
- [ ] `/health/environment` green on production after last deploy
- [ ] Hourly live probe workflow enabled
- [ ] League admin can open `/admin/audit`

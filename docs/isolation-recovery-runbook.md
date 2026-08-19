# Isolation recovery runbook (#1193)

Operational checklist to clear the cross-lane isolation regression and land the
prepared PR stack. Complements `docs/GITHUB_ACTIONS.md`,
`docs/cloudflare-builds-isolation.md`, and `docs/ENVIRONMENTS.md`.

**Tracking card:** #1193  
**Security companion:** #1231 (gamma must not share jfl/dru open-auth)

---

## 0. Current baseline (update when probing)

Probe all four identities:

```bash
curl -sS https://fremontderby.com/health/environment | jq '{ok,environment,versionTag}'
curl -sS https://gamma.fremontderby.com/health/environment | jq '{ok,environment,checks:[.checks[]|select(.name|test("ypass|solat|roject"))]}'
curl -sS https://jfl.fremontderby.com/health/environment | jq '{ok,environment,failed:[.checks[]|select(.ok==false)]}'
curl -sS -D- https://dru.fremontderby.com/health/environment -o /tmp/dru.json
```

| Lane | Healthy means |
|------|----------------|
| **production** | `ok=true`, `environment=production` |
| **gamma** | `ok=true`, `environment=gamma`, **`authBypassEnabled=false`** (or bypass check absent/green) |
| **jfl** | `ok=true`, `environment=jfl`, project isolation checks green (staging project, not production) |
| **dru** | HTTP 200, `ok=true`, `environment=dru`, isolation green |

**Known live failures (pre-recovery):**

- Gamma: env correct but open-auth still on (`authBypassEnabled=true`).
- JFL: `supabaseProjectMatchesEnvironment` + `actualProjectIsolated` fail (bound URL points at wrong project).
- DRU: HTTP **503** coarse fail-closed body (`versionTag` often null).

---

## 1. Roles

| Actor | May |
|-------|-----|
| **Human / author** | Restore Actions runners; merge PRs; dashboard secrets; lane deploys; branch protection |
| **Agent** | Probe canaries; maintain PR quality; rebase/conflict notes; post evidence on #1193; **no** unsolicited merges or shared-infra deploys |

Shared-infra mutation (Workers secrets, custom domains, production deploy) requires explicit human direction per AGENTS.md.

---

## 2. Hard gate — GitHub Actions

Required PR checks (`test`, `accessibility`, `pr-card-contract`, `validate`) must run.

1. Confirm hosted runners work: manual **CI** `workflow_dispatch` completes real steps (see `docs/GITHUB_ACTIONS.md` reactivation checklist / #723).
2. Confirm a sample open PR shows **GitHub Actions** jobs, not only **Workers Builds** failures on non-permanent branches.
3. Do **not** treat Workers Builds `failure` on `dru/*` PR heads as a product regression — expected isolation when branch filters + guards refuse non-allowlisted refs.

**Stop condition:** no required Actions runs → do not merge on greenwashed Workers Builds alone.

---

## 3. Merge waves (prepared open stack)

Merge **only** after Actions are healthy. Prefer this order.

### Wave A — security + deploy isolation

| PR | Base | Purpose |
|----|------|---------|
| **#1635** | `main` | Forbid beta auth bypass on **gamma** (jfl/dru only) |
| **#1195** | `fremontderby-gamma` | Exact deploy source matrix; CI cannot bypass lane branch match |

**After #1635 merges to main:**

1. Promote/deploy **gamma** from the permanent lane path (Workers Builds on `fremontderby-gamma` or `workflow_dispatch` deploy lane=gamma with matching ref).
2. Probe until gamma shows **`authBypassEnabled=false`** (dashboard var `BETA_AUTH_BYPASS` must not stay `1` if still set outside wrangler).
3. Keep #1193 open through that probe.

**After #1195:**

1. Land onto the integration path the author uses (gamma → main as per release process).
2. Confirm cross-lane matrix: `fremontderby-jfl`→jfl only, etc.

### Wave B — deploy identity

| PR | Purpose |
|----|---------|
| **#1674** | Pure stamp + `resolveDeployVersionTag` for `/health` |

### Wave C — host-env derivation

| PR | Purpose |
|----|---------|
| **#1675** | Single-source host inventories + domain drift CI (`check:domain-env`) + apex allowlist |

### Wave D — locks and ops

| PR | Purpose |
|----|---------|
| **#1673** | Config/isolation lockstep tests |
| **#1672** | UI/privacy pure locks |
| **#1676** | CodeQL `security-extended` + hourly probe org default |

### Lane-owned (independent)

| PR | Base | Notes |
|----|------|-------|
| **#1188** | `fremontderby-jfl` | JFL lint baseline — lane author |

Rebase waves B–D onto `main` after A if GitHub reports conflicts.

---

## 4. Live binding repair (human)

Code merges do **not** fix wrong dashboard bindings.

### JFL — project isolation

Symptom: `supabaseProjectMatchesEnvironment` / `actualProjectIsolated` false while schema checks pass.

1. Cloudflare Worker **fremontderby-jfl** → Settings / Variables:
   - `ENVIRONMENT=jfl`
   - `SUPABASE_URL=https://oqkkvqkerusepyokzbmt.supabase.co` (staging project)
   - `EXPECTED_SUPABASE_PROJECT_REF=oqkkvqkerusepyokzbmt`
   - `SUPABASE_SCHEMA=jfl`
2. Secret `SUPABASE_SERVICE_ROLE_KEY` must be the **staging** service role (not production).
3. Redeploy jfl from `fremontderby-jfl` only.
4. Probe until both isolation checks are green.

### DRU — 503 fail-closed

Symptom: HTTP 503, minimal JSON, often `versionTag=null`.

1. Confirm Worker **fremontderby-dru** is the hostname target for `dru.fremontderby.com`.
2. Align vars/secrets with wrangler `env.dru` (staging URL, schema `dru`, open-auth only if intentional).
3. Deploy from `fremontderby-dru` only.
4. Probe until HTTP 200 and `ok=true`.

### Gamma — open-auth off

1. After #1635 code is live: remove dashboard `BETA_AUTH_BYPASS=1` if present.
2. Redeploy gamma.
3. Probe `authBypassEnabled=false`.

---

## 5. Post-merge verification script

```bash
# Identity + readiness (expect ok=true on all when recovered)
for host in fremontderby.com gamma.fremontderby.com jfl.fremontderby.com dru.fremontderby.com; do
  echo "=== $host ==="
  curl -sS -m 15 "https://$host/health/environment" | jq '{ok,environment,versionTag,failed:(.checks//[]|map(select(.ok==false)|.name))}'
done
```

Optional repo canaries (from a laptop with network):

```bash
npm run canary:lanes
npm run check:domain-env   # after #1675
```

---

## 6. Definition of done (#1193)

Close #1193 only when **all** are true:

1. [ ] Required GitHub Actions checks run on PRs to `main`.
2. [ ] Wave A merged (#1635 on main; #1195 on agreed integration path).
3. [ ] Gamma live: `environment=gamma` and **no** open-auth bypass.
4. [ ] JFL live: `ok=true`, project isolation checks green.
5. [ ] DRU live: HTTP 200, `ok=true`, `environment=dru`.
6. [ ] Production still `ok=true`, `environment=production`.
7. [ ] Waves B–D merged or explicitly deferred with owner note on #1193.
8. [ ] Final evidence comment on #1193 with probe timestamps.

---

## 7. Agent loop (when asked to “do work” against this runbook)

1. Probe canaries (section 0).
2. Diff against definition of done (section 6).
3. If Actions still dark → document only; do not invent merges.
4. If PRs need rebase/conflict fix → do that on existing branches.
5. Post short evidence on #1193 when state changes.
6. Do **not** open thin pure-lock PRs that undo the 8-PR freeze unless the runbook is amended.

---

## 8. Quick reference — open PRs at freeze

| Wave | PRs |
|------|-----|
| A | #1635, #1195 |
| B | #1674 |
| C | #1675 |
| D | #1673, #1672, #1676 |
| Lane | #1188 |

Numbers may change after merge; prefer titles and wave letters over stale IDs.

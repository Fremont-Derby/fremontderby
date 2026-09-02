# Isolation recovery runbook (#1193)

Operational checklist to clear the cross-lane isolation regression and land the
prepared PR stack. Complements `docs/GITHUB_ACTIONS.md`,
`docs/cloudflare-builds-isolation.md`, and `docs/ENVIRONMENTS.md`.

**Tracking card:** #1193
**DRU/JFL binding recovery:** #1761 (PR #1760 for DRU)
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

**Status as of 2026-08-19 (~09:00 UTC):**

- **#1195 merged into `fremontderby-gamma`** (author included DEPLOY_GIT_SHA preservation commits). Deploy-source matrix is on the gamma *branch*; Cloudflare Workers Builds for that event still reported failures — live gamma deploy verification still required.
- **#1752 closed as superseded** (author applied equivalent DEPLOY_GIT_SHA commits onto #1195 before merge).
- Gamma: author also committed `test: lock gamma auth bypass off` on gamma tip. Runtime forbid-bypass for main remains **#1635** (still open).
- JFL: still expected to fail project isolation until binding recovery (#1761).
- DRU: **#1760** open — pins DRU staging Supabase vars in `wrangler.jsonc`. Post-merge: clear stale CF secrets, deploy from `fremontderby-dru`, green `/health/environment`.

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
3. Do **not** treat Workers Builds `failure` on `dru/*` / recovery PR heads as a product regression — expected isolation when branch filters + guards refuse non-allowlisted refs.

**Stop condition:** no required Actions runs → do not merge on greenwashed Workers Builds alone.

---

## 3. Merge waves (prepared open stack)

### Wave A — security + deploy isolation (partially complete)

| PR | Base | Status |
|----|------|--------|
| **#1195** | `fremontderby-gamma` | **Merged** 2026-08-19 (~08:55 UTC). Author included DEPLOY_GIT_SHA preservation. |
| **#1752** | was `#1195` head | **Closed superseded** — equivalent commits landed on #1195 before merge. |
| **#1635** | `main` | **Still open** — runtime forbid beta auth bypass on gamma. Gamma has a related *test* lock only; merge this for main + live policy. |

**After #1635 merges to main:**

1. Promote/deploy **gamma** from the permanent lane path.
2. Probe until gamma shows **`authBypassEnabled=false`** (clear dashboard `BETA_AUTH_BYPASS` if still `1`).
3. Keep #1193 / #1231 open through that probe.

**After #1195 (done on branch):**

1. Confirm live gamma Worker actually runs the new deploy-source matrix (Workers Builds failed on merge event — may need a clean gamma deploy).
2. Do not promote gamma → main until live isolation evidence is green.

### Active binding recovery (preferred next)

| Item | Target | Purpose |
|------|--------|---------|
| **#1760** | `fremontderby-dru` | Pin DRU staging Supabase URL / publishable / expected ref in wrangler vars |
| **#1761** | tracking | JFL + DRU isolated Supabase bindings; clear stale secrets; live health green |

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

### Docs

| PR | Purpose |
|----|---------|
| **#1677** | This runbook |

### Lane-owned (independent)

| PR | Base | Notes |
|----|------|-------|
| **#1188** | `fremontderby-jfl` | JFL lint baseline — lane author |

Rebase waves B–D onto `main` after remaining Wave A if GitHub reports conflicts.

---

## 4. Live binding repair (human)

Code merges do **not** fix wrong dashboard bindings by themselves.

### DRU — via #1760 / #1761

1. After #1760 merges to `fremontderby-dru`: clear stale Cloudflare secrets for `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `EXPECTED_SUPABASE_PROJECT_REF` on Worker **fremontderby-dru**.
2. Deploy DRU from `fremontderby-dru` only.
3. Probe until HTTP 200 and `ok=true`, `environment=dru`.

### JFL — project isolation (#1761)

Symptom: `supabaseProjectMatchesEnvironment` / `actualProjectIsolated` false.

1. Same pattern as DRU: durable config must pin staging project `oqkkvqkerusepyokzbmt` and schema `jfl`.
2. Clear stale production-pointing secrets if present.
3. Redeploy jfl from `fremontderby-jfl` only.
4. Probe until isolation checks are green.

### Gamma — open-auth off

1. After #1635 code is live on gamma: remove dashboard `BETA_AUTH_BYPASS=1` if present.
2. Redeploy gamma.
3. Probe `authBypassEnabled=false`.

---

## 5. Post-merge verification script

```bash
for host in fremontderby.com gamma.fremontderby.com jfl.fremontderby.com dru.fremontderby.com; do
  echo "=== $host ==="
  curl -sS -m 15 "https://$host/health/environment" | jq '{ok,environment,versionTag,failed:(.checks//[]|map(select(.ok==false)|.name))}'
done
```

Optional repo canaries:

```bash
npm run canary:lanes
npm run check:domain-env   # after #1675
```

---

## 6. Definition of done (#1193)

Close #1193 only when **all** are true:

1. [ ] Required GitHub Actions checks run on PRs to `main`.
2. [x] #1195 on gamma branch (DEPLOY_GIT_SHA included). Live gamma deploy still to confirm.
3. [ ] #1635 on main + gamma live with **no** open-auth bypass.
4. [ ] JFL live: `ok=true`, project isolation checks green (#1761).
5. [ ] DRU live: HTTP 200, `ok=true`, `environment=dru` (#1760 → #1761).
6. [ ] Production still `ok=true`, `environment=production`.
7. [ ] Waves B–D merged or explicitly deferred with owner note on #1193.
8. [ ] Final evidence comment on #1193 with probe timestamps.

---

## 7. Agent loop (when asked to “do work” against this runbook)

1. Probe canaries (section 0).
2. Diff against definition of done (section 6).
3. Prefer supporting **#1760 / #1761** and **#1635** over opening new isolation PRs.
4. If Actions still dark → document only; do not invent merges.
5. Post short evidence on #1193 when state changes.
6. Do **not** reopen superseded stacks (#1752) or thin pure-lock noise.

---

## 8. Quick reference — current stack

| Track | Items |
|-------|-------|
| Done on gamma branch | #1195 (merged); #1752 superseded |
| Active binding recovery | **#1760** → `fremontderby-dru`; tracking **#1761** |
| Still Wave A | **#1635** → `main` |
| B–D | #1674, #1675, #1673, #1672, #1676 |
| Docs | #1677 (this runbook) |
| Lane | #1188 |

Prefer titles and track letters over stale IDs after further merges.

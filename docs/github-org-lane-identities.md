# GitHub org + lane identities (#1173)

Instruction-only JFL/DRU separation is not enough while one personal account owns the repo and shared tokens can write every branch. This doc is the **repo-side prep checklist** until the project moves under a GitHub Organization.

## Target model (one repo)

```text
JFL actor  → jfl/* + fremontderby-jfl  → Gamma
DRU actor  → dru/* + fremontderby-dru  → Gamma
Gamma      → main → production
```

Do **not** split into multiple repositories unless this model fails.

## Operator steps (human / org admin)

1. Create a GitHub Organization (owner break-glass: project owner account).
2. Transfer `subiki/fremontderby` into the org (GitHub: Settings → General → Transfer).
3. Create **two distinct** automation identities (GitHub Apps preferred, or separate machine users):
   - **JFL actor** — write only `jfl/**` + `fremontderby-jfl`
   - **DRU actor** — write only `dru/**` + `fremontderby-dru`
4. Optional **release actor** for Gamma → `main` only.
5. Install apps on the org repo with least privilege (contents: write scoped by rulesets where possible).
6. Add **repository rulesets** (not only branch protection):
   - `fremontderby-jfl` + `jfl/**` — JFL actor + owner break-glass
   - `fremontderby-dru` + `dru/**` — DRU actor + owner break-glass
   - `fremontderby-gamma` — PR required; no direct push from JFL/DRU implementation identities
   - `main` — PR required from Gamma only (align with #889)
7. Rotate away any shared PATs used by both lanes.
8. Complete **#873** Cloudflare Workers Builds branch filters so CF matches the same topology.

## Already enforced in this repository (code)

| Control | Location |
|---------|----------|
| Deploy Actions = `workflow_dispatch` only | `.github/workflows/deploy-release-lanes.yml` |
| Workers Builds branch allowlists | `scripts/guard-cloudflare-build.mjs` |
| Release source policy | `.github/workflows/release-source-policy.yml` |
| CF isolation operator checklist | `docs/cloudflare-builds-isolation.md` |

## What agents must not do

- Do not close #1173 until org transfer + distinct actors + rulesets are confirmed by the project owner.
- Do not claim lane isolation is “done” while JFL and DRU share one GitHub credential.

# GitHub org + lane identities (#1173 / #1185)

Instruction-only JFL/DRU separation is not enough while one personal account owns the repo and shared tokens can write every branch. This doc is the **repo-side prep checklist** until the project moves under a GitHub Organization.

## Target model (one repo)

```text
JFL actor  → jfl/* + fremontderby-jfl  → Gamma
DRU actor  → dru/* + fremontderby-dru  → Gamma
Gamma      → main → production
```

Do **not** split into multiple repositories unless this model fails.

## Authored ruleset config (#1185)

Repo-side intended rulesets live at:

**`.github/rulesets/fremontderby-rulesets.json`**

Validate locally:

```bash
node scripts/validate-ruleset-config.mjs
```

| Ruleset | Refs | Intent |
|---------|------|--------|
| Main block | `main` | PR + required checks `test`, `accessibility`, `pr-card-contract`, `validate` |
| Gamma promotion | `fremontderby-gamma` | PR + tests; heads from jfl/dru only (release-source-policy) |
| JFL permanent branch | `fremontderby-jfl`, `jfl/**` | Non-fast-forward; JFL actor when org identities exist |
| DRU permanent branch | `fremontderby-dru`, `dru/**` | Non-fast-forward; DRU actor when org identities exist |

**Human apply:** GitHub → Settings → Rules → Rulesets → create/update to match the JSON. Actor bypass lists require org apps/users that do not exist yet.

## Operator steps (human / org admin)

1. Create a GitHub Organization (owner break-glass: project owner account).
2. Transfer the repo into the org (GitHub: Settings → General → Transfer).
3. Create **two distinct** automation identities (GitHub Apps preferred, or separate machine users):
   - **JFL actor** — write only `jfl/**` + `fremontderby-jfl`
   - **DRU actor** — write only `dru/**` + `fremontderby-dru`
4. Optional **release actor** for Gamma → `main` only.
5. Install apps on the org repo with least privilege (contents: write scoped by rulesets where possible).
6. Apply **repository rulesets** from `.github/rulesets/fremontderby-rulesets.json`.
7. Rotate away any shared PATs used by both lanes.
8. Complete **#873** Cloudflare Workers Builds branch filters so CF matches the same topology.

## Already enforced in this repository (code)

| Control | Location |
|---------|----------|
| Deploy Actions = `workflow_dispatch` only | `.github/workflows/deploy-release-lanes.yml` |
| Workers Builds branch allowlists | `scripts/guard-cloudflare-build.mjs` |
| Release source policy | `.github/workflows/release-source-policy.yml` |
| Ruleset config + validator | `.github/rulesets/fremontderby-rulesets.json`, `scripts/validate-ruleset-config.mjs` |
| CF isolation operator checklist | `docs/cloudflare-builds-isolation.md` |

## What agents must not do

- Do not close #1173 / #1185 until org transfer + distinct actors + **applied** rulesets are confirmed by the project owner.
- Do not claim lane isolation is “done” while JFL and DRU share one GitHub credential.

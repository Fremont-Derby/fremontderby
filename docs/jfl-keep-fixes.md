# Local draft only. Not opened on GitHub.

Base: `fremontderby-jfl` at `1cbb341a`  
Head would be: DRU keep-fixes from `fdf8059e`  
Do not open this until JFL asks. Do not push `fremontderby-jfl`.

## Title

Keep the DRU sign-in token when taking a JFL update

## Problem

Grabbing JFL's tree drops the DRU sign-in token. The last alignment, `340eeb82`, replaced `dru-bypass` with JFL's simulated Google token. DRU then could not sign a session in. The restore is `fdf8059e` (#3533). The next JFL grab will do the same unless this patch is reapplied.

## What to reapply

Patch: `artifacts/jfl-keep-fixes.patch`

Keep these. They are the fixes:

- `src/supabaseAuth.js` accepts `dru-bypass` only when `ENVIRONMENT` is `dru` and the bypass is on. JFL rejects that token before any Google call.
- `test/beta-auth-bypass.test.js` covers that split.
- `.github/workflows/ci.yml` and `.github/workflows/pr-card-contract.yml` no longer rename the jobs. The DRU ruleset waits for `CI / test` and `PR card contract / validate`. A short job name blocks the merge.

## What not to push onto JFL

These are lane files, not fixes for him:

- `wrangler.jsonc`
- `.github/agents/dru.agent.md`
- `src/druPracticePhone.js` (DRU-only phone workaround)
- deleting `browser/jfl/free-agents-recovery.spec.js`, `playwright.free-agents.config.mjs`, or `.github/workflows/free-agents-browser.yml`

JFL's tip also has notices and phone-header work (`#3526`, `#3524`) that DRU does not have. Do not overwrite those.

## How to use it next time

1. Fetch `fremontderby-jfl`.
2. Merge or checkout that tree onto a `dru/*` branch.
3. Apply `artifacts/jfl-keep-fixes.patch`.
4. Run `node --test test/beta-auth-bypass.test.js`.
5. Open a DRU pull request only. Do not push his branch.

## Proof already on DRU

`node --test test/beta-auth-bypass.test.js` passed, 7 of 7, before #3533 merged.  
Live DRU was still `4df4adde` when this draft was written. The worker had not picked up `fdf8059e`.

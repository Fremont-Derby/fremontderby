# Playwright self-hosted runner plan

Issue: #2524

## Why this is now the priority

Fremont Derby already has strong unit/domain/HTTP coverage and a browser-oriented ChatGPT Work validation runbook, but it still lacks a durable real-browser regression layer.

The project owner expects periods of travel with little or no ability to supervise interactive testing. The next investment should therefore make browser validation **repeatable, unattended, evidence-rich, and safe** on an always-on self-hosted runner.

The goal is not to automate every page immediately. The goal is to establish a trustworthy browser execution substrate, then grow a small production-critical suite around it.

## End state

When this plan is complete:

1. A dedicated self-hosted runner is online continuously and starts automatically after reboot.
2. The runner can execute Playwright Chromium tests without downloading browsers on every run.
3. The repository has a pinned Playwright dependency and lockfile.
4. A trusted GitHub Actions workflow can run browser smoke tests on the self-hosted runner without exposing the machine to arbitrary public pull-request code.
5. Failures produce screenshots/traces/HTML reports that can be inspected remotely from GitHub.
6. The first deterministic desktop + phone smoke suite runs against **JFL as the rapid-iteration browser lab**.
7. Browser validation can continue while the project owner is traveling and not present at the runner.
8. A separate Gamma release-candidate suite runs only after #2527 establishes a current reconciled Gamma baseline.
9. The foundation is ready for authenticated captain flows, selective JFL/DRU promotion, Gamma release-candidate gates, and a later scheduled ChatGPT Work objective.

## Non-goals for the first implementation

Do not turn #2524 into a giant browser-testing rewrite.

The first card does **not** need to solve:

- complete two-captain automation;
- full browser matrix;
- pixel-diff visual testing;
- production writes;
- every authenticated gamma scenario;
- scheduled ChatGPT Work orchestration;
- replacing existing Node/domain/HTTP tests;
- moving normal public pull-request CI to self-hosted infrastructure.

Those are follow-up slices after the foundation is proven.

## Critical security decision

The repository is public. GitHub warns that persistent self-hosted runners can be compromised if they execute code from public pull requests.

Therefore the browser runner must be treated as a privileged persistent machine even when it holds no production secrets.

### Required boundary

The Playwright runner:

- MUST NOT be used by `pull_request` workflows;
- MUST NOT execute arbitrary fork refs or user-supplied feature refs;
- MUST use a dedicated label such as `fremont-browser`;
- SHOULD run in a dedicated VM/container/host or at minimum a dedicated non-privileged OS account;
- MUST NOT contain personal SSH keys, Cloudflare production credentials, production Supabase service-role credentials, browser password stores, or broad home-network credentials;
- MUST use minimal GitHub workflow permissions, normally `contents: read`;
- SHOULD use runner-group workflow/repository restrictions if the GitHub organization plan exposes them;
- MUST keep ordinary public PR CI on GitHub-hosted runners.

This separation is more important than maximizing speed.

## Architecture

### Execution layers

Use three complementary testing layers:

**1. Existing repository tests**
- domain/business rules;
- API/auth contracts;
- render/page contracts;
- deployment/canary checks.

These remain the fastest deterministic regression layer.

**2. Playwright**
- repeatable browser behavior;
- user-visible navigation;
- mobile emulation;
- real browser state/persistence;
- multi-page/multi-context behavior;
- screenshots/traces on failure.

This becomes the durable browser smoke/regression layer.

**3. ChatGPT Work interactive browser**
- exploratory UX discovery;
- trying novel edge cases;
- triaging confusing states;
- deciding what is worth turning into durable Playwright coverage.

ChatGPT Work should increasingly call or consult Playwright results instead of manually replaying every already-automated path.

## Lane strategy: JFL fast loop, Gamma release gate

Do not use one environment for two conflicting jobs.

### JFL — default Playwright development target

Use JFL for fast, repeatable browser automation and destructive validation because it has isolated staging data and may use explicitly gated test actors/auth bypass.

JFL is where we should iterate on:

- browser-harness smoke;
- deterministic synthetic users/data;
- lineup mutation/reordering/unlock cases;
- score entry, rack edits, mismatch/reconciliation, repeated submit;
- two-browser-context captain tests;
- refresh/retry/stale-state tests;
- mobile viewport behavior;
- exploratory Work sessions that intentionally create bad state.

JFL being green does **not** mean the release candidate is green.

### DRU — portable evidence and independent proving ground

DRU is not the primary Playwright loop. Mine it for independently proven product fixes, helpers, QA contracts, and edge-case behavior. Promote useful capabilities selectively; do not make Playwright depend on DRU-specific seed/session internals unless the target scenario explicitly belongs there.

### Gamma — integrated release candidate

Gamma is the production-like integration gate:

- no auth bypass;
- current approved JFL/DRU product behavior combined;
- exact deployed SHA/version required;
- smaller, stricter Playwright RC suite;
- used only after #2527 records a reconciled Gamma baseline.

Until #2527 is verified, Gamma browser failures are useful evidence but must not be interpreted as proof that newly automated JFL behavior regressed.

### Production — read-only by default

Production remains smoke/read-only unless the product owner explicitly authorizes the exact mutation.

### Promotion loop

```text
current main
   |
   +--> JFL-owned implementation -> JFL deploy -> Playwright fast loop
   |                                  |
   |                                  +--> proven product behavior
   |                                             |
   +--> DRU portable evidence -------------------+
                                                 v
                                      focused Gamma promotion PRs
                                                 |
                                                 v
                                      reconciled Gamma Playwright RC
                                                 |
                                                 v
                                               #219
```

Never wholesale-merge permanent JFL or DRU branches into Gamma. Their histories are intentionally independent and currently heavily diverged. Follow #2527 for the feature-level reconciliation audit.

## Runner topology

### Preferred host model

Prefer an always-on Linux environment dedicated to automation.

Acceptable choices, in order:

1. dedicated small VM;
2. dedicated lightweight physical host;
3. isolated container/VM on an existing always-on machine;
4. shared workstation only as a temporary bridge.

Do not require the project owner's laptop to be open.

### Runner labels

Target labels:

- `self-hosted`
- OS/arch labels assigned by GitHub
- `fremont-browser`

Do not reuse a generic self-hosted label in browser workflows if another runner could accidentally accept the job.

### Service behavior

The GitHub runner process should:

- run as a service;
- auto-start on host boot;
- restart after service failure;
- write operational logs somewhere inspectable;
- have sufficient disk for npm cache, browser binaries, and transient reports;
- use a dedicated working directory that can be cleaned safely.

### Health probe

Create a lightweight runner health path that confirms:

- GitHub runner service is online/listening;
- Node version matches repo expectations;
- Chromium executable is present;
- Playwright CLI can launch a browser;
- target Fremont Derby hostname is reachable;
- sufficient free disk remains;
- clock/time synchronization is sane enough for auth/session tests.

A runner-offline failure should be distinguishable from an application regression.

## Dependency strategy

The repository currently has no npm lockfile.

Playwright should be the trigger to introduce reproducible npm dependency installation.

### Required changes

- Add a pinned `@playwright/test` development dependency.
- Commit `package-lock.json`.
- Use `npm ci` on automation paths after the lockfile exists.
- Add scripts such as:
  - `test:browser`
  - `test:browser:smoke`
  - `browser:install`
  - optionally `browser:report` for local inspection.
- Keep the first browser footprint small: install Chromium first.
- Do not install Firefox/WebKit until there is a specific validation reason.

### Browser cache

Playwright versions require matching browser binaries.

The persistent runner should preinstall Chromium and retain it across runs.

Ordinary smoke runs should not repeatedly download browsers.

When Playwright is upgraded:

1. update package version + lockfile;
2. refresh browser binaries intentionally;
3. prove runner smoke again;
4. record the new version in the implementation card/PR evidence.

## Proposed repository layout

A likely layout:

```text
playwright.config.mjs
test/
  browser/
    smoke/
      public-smoke.spec.js
      mobile-smoke.spec.js
    fixtures/
      environment.js
      selectors.js
```

Use existing repo naming conventions if implementation inspection suggests a better fit.

Avoid a parallel app architecture merely for tests.

## Playwright configuration

### Initial projects

Start with:

- Desktop Chromium
- one representative phone emulation

The current UX runbook uses approximately 390x844 as the primary phone viewport and 320 CSS px as an important narrow-reflow check.

Do not run every test at every viewport initially. Keep a small smoke set fast.

### Base URL

Use an environment variable such as:

```text
PLAYWRIGHT_BASE_URL=https://jfl.fremontderby.com
```

JFL is the default during harness development. Gamma becomes the base URL only for the release-candidate suite after #2527 records the accepted Gamma baseline SHA.

Do not bake environment credentials or host assumptions into test files.

### Stability defaults

Initial CI/self-hosted recommendations:

- one worker;
- explicit test timeouts;
- no arbitrary sleeps;
- retries only in automation;
- trace on first retry or retain on failure;
- screenshot on failure;
- video only if evidence shows it materially helps.

A retry that passes should still be visible as flaky evidence, not silently treated as perfect.

## Workflow design

Create a separate browser workflow rather than modifying ordinary PR CI to use the self-hosted runner.

Suggested file:

`.github/workflows/playwright-browser-smoke.yml`

### Initial triggers

Phase 1:

- `workflow_dispatch` only.

Later, after proof:

- trusted schedule;
- trusted push/promotion events;
- possibly release-candidate workflow chaining.

Never add `pull_request` to the self-hosted browser workflow while the repository remains public.

### Inputs

Prefer constrained choices rather than arbitrary refs/URLs.

Safe examples:

- target lane: `jfl | gamma` initially;
- suite: `smoke | critical | rc`.

Default to `jfl`. A Gamma `rc` run must first verify that the deployed SHA matches the current accepted Gamma baseline from #2527. Keep DRU available as an explicit diagnostic/portable-proof target rather than the default browser loop.

Checkout should remain restricted to trusted repository-owned refs.

Do not allow a dispatch input to point the self-hosted runner at arbitrary code from a fork.

### Permissions

Start with:

```yaml
permissions:
  contents: read
```

Add only the narrowest permission needed if the workflow later writes a status comment or issue.

Do not give this workflow deploy permissions.

### Runner selection

Use an exact label requirement so GitHub cannot dispatch it to an unrelated self-hosted host.

Conceptually:

```yaml
runs-on: [self-hosted, linux, x64, fremont-browser]
```

Adjust OS/arch labels to the actual runner inventory.

### Artifacts

Upload on failure or non-cancelled completion as appropriate:

- Playwright HTML report;
- `test-results/` traces/screenshots;
- a tiny environment metadata file:
  - requested target;
  - actual lane identity;
  - tested Git SHA;
  - Playwright version;
  - runner label/name if safe.

Keep retention short while the project is moving quickly.

## First smoke suite

The first browser suite exists to prove the harness and produce useful release signal without requiring long-lived credentials.

### Smoke 1 — environment identity

Before mutating anything:

- visit the selected host;
- verify the expected environment via the supported health surface;
- capture deployed version/SHA if exposed;
- fail immediately on wrong lane identity.

This prevents a successful browser test against the wrong environment from being considered release evidence.

### Smoke 2 — desktop public/Test Drive path

Use a stable user-visible path that exercises real shared UI/browser code.

Candidate path:

- open home;
- reach Test Drive / Try a League Night;
- enter the shared scoring experience;
- assert key rack-ledger content/controls render;
- perform a safe isolated interaction;
- verify the expected visible state.

The exact selectors must come from current UI markup at implementation time.

### Smoke 3 — phone emulation

Repeat a small critical interaction under phone emulation.

Validate:

- no page-level horizontal trap;
- primary action reachable;
- key score/context state visible;
- mobile navigation/overlay does not block completion.

### Smoke 4 — controlled failure proof

During implementation only:

- intentionally introduce a temporary failing assertion or use a dedicated failure-test mechanism;
- prove GitHub receives trace/report evidence;
- restore green before merge.

## Locator strategy

Prefer, in order:

1. accessible role + visible name;
2. explicit stable test id only where semantics cannot express the target;
3. stable form labels/text.

Avoid:

- brittle CSS child chains;
- generated class names;
- positional selectors when meaning is available;
- raw database IDs;
- `waitForTimeout` as synchronization;
- screenshot comparison as the only assertion.

If the UI cannot be reliably selected by accessible semantics, that may itself reveal a UX/accessibility improvement opportunity.

## Data strategy

### Phase 1 — JFL harness proof

Use JFL public/Test Drive or isolated no-secret behavior to prove the browser harness.

### Phase 2 — JFL deterministic mutation

Add JFL test actors/isolated fixtures for mutating browser tests. Prefer JFL over DRU for the primary Playwright fast loop; use DRU to prove portable behavior independently when useful.

### Phase 3 — Gamma release-candidate proof

After #2527 establishes a reconciled Gamma baseline, introduce dedicated Gamma test identities only where production-like auth proof is required.

Gamma auth bypass remains forbidden.

Credentials must live in GitHub/environment secrets or another approved secret store, never Git.

### Production

Browser automation should remain read-only by default.

Production-mutating automation requires a separate explicit product-owner decision and safety design.

## Auth strategy roadmap

Do not block the foundation on solving every auth case.

Later browser-auth work should prefer:

- dedicated synthetic test users;
- non-personal credentials;
- isolated lane data;
- Playwright `storageState` generated during the run or securely provisioned;
- automatic session-expiry recovery.

Do not commit storage-state files because they can contain session material.

## Two-user / captain automation roadmap

After #2524 is stable, the high-value durable workflow is:

```text
captain A context
+
captain B context
  -> choose/lock lineups
  -> reveal
  -> score from both perspectives
  -> create mismatch
  -> correct old rack
  -> reconcile
  -> finalize
  -> refresh/reopen
  -> verify persistence/standings
```

Use separate browser contexts rather than one shared session.

Add this incrementally; keep the fast smoke suite smaller than the full league-night suite.

## Travel / unattended-operation design

The project owner's lack of connectivity should not stop tests.

The runner itself must remain online.

Design for:

- no interactive prompts;
- no dependency install requiring sudo during ordinary runs;
- browsers preinstalled;
- secrets already provisioned for approved future authenticated tests;
- service auto-restart;
- artifacts visible in GitHub;
- failure messages understandable without shell access;
- no dependence on the owner's laptop.

This is **unattended**, not network-offline testing.

## Failure taxonomy

The workflow should make failures easy to triage.

Classify at least:

### Runner/bootstrap failure
Examples:
- runner offline;
- Chromium missing;
- npm install failure;
- insufficient disk;
- DNS/network unavailable.

### Environment mismatch
Examples:
- gamma hostname reports wrong environment;
- unexpected deployed SHA.

### Test/UX failure
Browser launched, target was correct, user-visible assertion failed.

### Flaky/retry evidence
Initial failure then retry pass.

Do not collapse all four into “Playwright failed.”

## Interaction with ChatGPT Work

Once the harness exists, update the Work model:

**Before manual replay**
- inspect latest browser-run status;
- use traces/screenshots for known failures;
- rerun the trusted Playwright suite when needed.

**During exploration**
- use interactive browser for scenarios not yet automated.

**After discovering a blocker**
- reproduce;
- fix;
- add/extend Playwright if the defect is best caught at browser level;
- otherwise add a lower-layer regression;
- rerun both the focused browser test and critical smoke.

This prevents Work from spending tokens manually repeating stable flows.

## Later scheduled-task model

Do not schedule this yet.

The future high-level scheduled Work goal should be small because the repository owns the detailed policy.

A future task can conceptually say:

```text
Continue Fremont Derby production-readiness work from current repository authority.
Prioritize #2524 until Playwright self-hosted validation is verified, then use the browser smoke results and WORK_BROWSER_UX_VALIDATION runbook to attack the highest-severity release blocker.
Leave all state in GitHub and never mutate production without explicit authority.
```

Once #2524 is closed, replace issue-specific priority with a release-readiness objective rather than hard-coding a permanent issue number.

## Parallel release-baseline work

Playwright foundation work and Gamma reconciliation should proceed in parallel:

- **#2524** owns runner + Playwright foundation and targets JFL first.
- **#2527** owns the JFL/DRU/main feature audit and selective promotion needed to make Gamma current.

Do not block runner/Playwright work waiting for Gamma.

Do not promote Gamma to the primary automated RC target until #2527 is verified.

## Planned implementation slices

### Slice A — runner inventory + hardening

Deliverables:

- record actual runner host facts;
- decide isolation boundary;
- install/configure GitHub runner service if not already suitable;
- dedicated label;
- autostart;
- health script/check;
- prove no production/personal secrets are present.

Exit:
runner is safely online and can accept a trusted no-op job.

### Slice B — dependency + harness

Deliverables:

- `@playwright/test`;
- lockfile;
- Playwright config;
- scripts;
- Chromium install/bootstrap documentation;
- one local browser-launch smoke.

Exit:
`npm run test:browser:smoke` works on the runner.

### Slice C — trusted workflow + artifacts

Deliverables:

- self-hosted workflow;
- trusted-ref restrictions;
- manual dispatch;
- report/trace upload;
- environment metadata.

Exit:
GitHub dispatch completes green and evidence is inspectable remotely.

### Slice D — useful JFL desktop + mobile smoke

Deliverables:

- JFL lane identity/version test;
- desktop Test Drive/public critical test against JFL;
- phone-emulated critical test against JFL;
- environment metadata proving which JFL SHA was exercised.

Exit:
suite proves actual user-visible browser behavior on the rapid-iteration lane.

### Slice E — resilience proof

Deliverables:

- controlled failure artifact proof;
- runner reboot/service restart;
- successful post-reboot dispatch.

Exit:
foundation meets #2524 acceptance.

## Follow-up cards after #2524

Create separate cards rather than expanding the foundation indefinitely:

1. authenticated **JFL** captain fixture + deterministic reset strategy;
2. two-browser-context JFL league-night critical flow;
3. #2527 Gamma reconciliation and accepted RC baseline;
4. Gamma authenticated release-candidate smoke using the same portable critical assertions;
5. trusted scheduled browser validation cadence;
6. ChatGPT Work autonomous release-readiness loop;
7. optional Firefox/WebKit coverage based on observed risk;
8. optional visual regression after functional stability.

## Definition of done for the foundation

#2524 can move to Verified only when:

- a real self-hosted `fremont-browser` runner is online;
- it cannot be triggered by public PR code;
- Playwright Chromium is pinned and installed reproducibly;
- the smoke suite includes desktop + phone user-visible assertions;
- a manual trusted workflow run passes on the runner;
- a controlled failure produces remote trace/report evidence;
- restart/reboot proof succeeds;
- existing CI/release flows remain independent and green;
- docs describe how the next agent can maintain or recover the runner without owner presence.

## Exact next action

The implementing agent should begin by claiming #2524 and inventorying the **actual current local runner host** before editing workflows or package files.

Do not guess its OS, labels, installation path, or service model.

Then implement Slice A and Slice B as the smallest safe vertical proof before broadening the test matrix.
## Human enablement: highest-value 30 minutes

The project owner can materially accelerate #2524 by doing only the steps agents cannot safely infer from GitHub.

### Minute 0-5 — merge the planning authority

1. Review/merge PR #2525 once its relevant docs/governance checks are acceptable.
2. Leave #2524 unclaimed until the implementation agent actually accepts it.
3. Leave #2527 unclaimed unless assigning a lane immediately.

### Minute 5-15 — identify the actual runner

In GitHub:

1. Open **Fremont-Derby/fremontderby -> Settings -> Actions -> Runners**.
2. Record the current self-hosted runner name, status (online/offline), labels, and runner group.
3. If more than one runner exists, identify which machine is intended for browser automation.
4. Do **not** broaden repository/workflow access or add production secrets.

On the intended Linux runner host, capture:

```bash
hostname
uname -a
cat /etc/os-release
node --version || true
npm --version || true
df -h /
free -h
systemctl list-units --type=service --all | grep -Ei 'actions\.runner|github.*runner' || true
ps -ef | grep -E 'Runner\.(Listener|Worker)' | grep -v grep || true
```

Paste the output into #2524. Redact only actual secrets; hostnames, OS/version, CPU architecture, RAM/disk, and service names are useful evidence.

### Minute 15-25 — decide isolation

Answer these in a comment on #2524:

- Is this runner a dedicated VM/host, or a personal/shared workstation?
- Does the account running it have personal SSH keys?
- Does it have production Cloudflare/Supabase credentials?
- Does it have broad home-lab/root access that browser-test code does not need?
- Can it remain powered on while you travel?

If the answer reveals broad credentials or personal-machine exposure, prefer creating a small dedicated Linux VM rather than hardening the shared machine under time pressure.

### Minute 25-30 — enable the next agent

Post one comment on #2524 containing:

```text
Runner chosen: <name/host>
GitHub status: online/offline
Labels: <labels>
Isolation: dedicated VM/host | shared
Autostart service: yes/no/unknown
Can stay powered while traveling: yes/no
Production credentials present: yes/no/unknown
Personal SSH keys present: yes/no/unknown
Diagnostics: <paste output>
Human decision: use this runner | create dedicated VM
```

That is enough for the next implementation agent to start without guessing.

Do not spend the 30 minutes manually installing Playwright. The agent should own the reproducible package/lockfile/browser installation so it lands with documentation and proof.

## Official references

Implementation should verify commands against current upstream documentation rather than copying old examples from chat:

- GitHub self-hosted runner setup: https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners
- GitHub secure-use guidance for self-hosted runners: https://docs.github.com/en/actions/reference/security/secure-use
- GitHub runner-group access controls: https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/manage-access
- Playwright CI guidance: https://playwright.dev/docs/ci
- Playwright browser installation/version coupling: https://playwright.dev/docs/browsers
- Playwright trace viewer: https://playwright.dev/docs/trace-viewer-intro
- Playwright device/mobile emulation: https://playwright.dev/docs/emulation


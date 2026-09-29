# ChatGPT Work browser UX validation runbook

## Purpose

This is the repository-owned operating guide for using ChatGPT Work's interactive browser as a fast production-readiness preflight for Fremont Derby.

The goal is **not** to browse every page looking for polish. The goal is to remove uncertainty from the real league-night experience quickly enough that the remaining human Season 1 release gate is short, focused, and unlikely to uncover a catastrophic workflow failure.

This runbook complements rather than replaces:

- `AGENTS.md` — repository-wide authority and safety rules;
- `docs/SEASON1_TEST_CONTRACT.md` — automated and live release confidence contract;
- `docs/SEASON1_HUMAN_SMOKE_TEST.md` — focused human smoke;
- `docs/season1-two-captain-trial.md` and issue #219 — the primary two-human Season 1 release gate;
- `.github/agents/ux-product.agent.md` — UX/product specialist guidance;
- `.github/agents/release-qa-security.agent.md` — independent QA/release guidance;
- `docs/ENVIRONMENTS.md` — lane identity and data-isolation rules.

Browser automation is an **accelerator and evidence collector**, not authority to weaken release gates or mutate production casually.

## Browser automation strategy

The product-owner decision recorded in #2524 makes a persistent self-hosted Playwright harness a priority investment. The intended split is:

- **Playwright**: repeatable browser smoke/regression, desktop + phone emulation, persistence/concurrency checks, and remote traces/reports.
- **ChatGPT Work**: exploratory UX discovery, novel edge cases, triage, and deciding what deserves durable automation.
- **Existing Node/domain/HTTP tests**: fastest deterministic protection for rules, APIs, authorization, rendering contracts, and deployment behavior.

Follow `docs/PLAYWRIGHT_SELF_HOSTED_RUNNER_PLAN.md` for the runner/harness implementation. Because the repository is public, the self-hosted browser runner must never execute arbitrary public pull-request code.

## End goal

Fremont Derby is ready to run a normal real league night when all of the following are true on the intended release candidate:

1. A captain can authenticate, find the correct matchup, prepare the blind lineup, reveal the matchup, score races, resolve a disagreement, confirm/finalize, and later reload the result without developer or database intervention.
2. The same critical path is understandable and usable at a realistic phone viewport.
3. Invalid or ambiguous states fail safely: bad lineups, unauthorized actions, inconsistent score histories, stale writes, repeated submission, and eligibility failures cannot silently corrupt league data.
4. Refresh, navigation, retry, and concurrent-user behavior preserve or recover authoritative state.
5. The league operator can identify and resolve ordinary exceptions from product screens.
6. Zero known **BLOCKER** defects remain.
7. Every remaining **HIGH** defect is either fixed or has an explicit product-owner launch disposition, safe workaround, and linked issue.
8. The exact tested deployment/revision is recorded.
9. Issue #219 can be executed by two real captains as a confirmation of the already-hardened workflow, not as first discovery of obvious defects.

Passing this Work runbook does **not** close #219 by itself. #219 requires two real humans.

## Default environment and safety

Use environments in this order unless the current issue or product owner says otherwise:

1. **Gamma — `https://gamma.fremontderby.com`**: default integrated browser-validation target. Production-like auth, isolated gamma schema, no auth bypass.
2. **JFL / DRU — `https://jfl.fremontderby.com` / `https://dru.fremontderby.com`**: use when a feature is not yet promoted to gamma or when destructive/resettable setup is needed.
3. **Test Drive / War Games surfaces**: use for fast orientation and shared-component scoring proof. Test Drive is useful because the rack-ledger scorer is shared with production, but it does not prove production auth/data integration.
4. **Production — `https://fremontderby.com`**: read-only/safe smoke by default. Do not create, edit, score, finalize, delete, seed, reset, or otherwise mutate live league data unless the product owner explicitly authorizes that exact production action.

Before any meaningful browser pass, verify lane identity using the repository's current health/canary guidance. A hostname resolving is not proof that the correct Worker/environment is running.

Never weaken auth, RLS, environment isolation, or write guards merely to make browser automation easier.

## Start-of-run procedure

Every Work run starts from current evidence, not memory.

1. Read `AGENTS.md`, `README.md`, this runbook, `docs/SEASON1_TEST_CONTRACT.md`, and issue #219.
2. Read the current specialist guides:
   - `.github/agents/browser-ux-validation.agent.md`
   - `.github/agents/ux-product.agent.md`
   - `.github/agents/release-qa-security.agent.md`
3. Reconcile current `main`, gamma/release-candidate branch state, open PRs, recently merged PRs, current CI, open P0/P1 or release-blocking issues, and current deployed version tags.
4. Confirm no other agent is already fixing the same defect before creating or editing code.
5. Identify the exact browser target and record:
   - hostname/environment;
   - reported environment;
   - deployed versionTag/SHA when available;
   - browser/device/viewport;
   - test account/role category, without committing secrets.
6. Run the shortest critical happy path first. Do not begin with cosmetic review.

If prerequisites are missing, record the scenario as **BLOCKED**, name the missing prerequisite, and continue with other safe scenarios. Do not fabricate a pass.

## Operating loop

Work in a tight loop:

**Reproduce -> capture evidence -> classify -> deduplicate -> fix or route -> retest -> run adjacent smoke -> update status.**

For every failure:

1. Reproduce it at least once more if doing so is safe.
2. Record exact steps from a known starting state.
3. Capture the user-visible result and, where useful, a screenshot.
4. Separate UX confusion from data/auth/integration defects.
5. Search open and recently closed issues/PRs before creating a duplicate.
6. Classify severity using the model below.
7. If the defect is contained, unowned, and safe to fix, make the smallest coherent change with regression coverage.
8. If broad, risky, or already owned, create/update a focused issue and move to the next highest-value validation item.
9. After a fix, retest the exact reproduction and one adjacent happy-path action.
10. After any scoring, auth, lineup, environment, or shared-navigation fix, rerun the critical smoke path before declaring the browser pass healthy.

Do not spend a large Work session polishing a MEDIUM/COSMETIC issue while a reproducible BLOCKER/HIGH remains open.

## Severity and launch disposition

### BLOCKER

Any of the following is a blocker:

- captain/player cannot authenticate or reach a required league-night workflow;
- a required critical path cannot be completed on a normal phone;
- score, lineup, matchup, result, or eligibility data is lost or corrupted;
- invalid lineup/result can be silently submitted/finalized;
- authorization boundary can be bypassed;
- repeated/double submission can create duplicate or contradictory authoritative state;
- refresh/retry can irrecoverably lose in-progress or committed critical state;
- stale/concurrent write handling can silently overwrite a valid result;
- ordinary league-night operation requires manual database intervention;
- gamma/production lane identity or data isolation is incorrect.

Launch rule: **zero known BLOCKERs**.

### HIGH

Examples:

- common critical workflow is substantially confusing or broken but a safe workaround exists;
- lock/reveal/confirm/finalize status is unclear enough to cause repeated actions;
- error/recovery guidance routinely sends users into a dead end;
- important captain/opponent state is missing or misleading;
- common mobile control is difficult to operate but completion is still possible;
- operator cannot diagnose an ordinary exception without developer help.

Launch rule: fix, or explicitly accept/defer with product-owner disposition, owner, issue, and safe workaround.

### MEDIUM

Limited edge case or notable friction with a safe, understandable workaround. Track it; do not let it preempt unresolved BLOCKER/HIGH work.

### COSMETIC

Visual-only polish, spacing, wording, noncritical alignment, or decoration that does not materially affect comprehension, accessibility, or completion.

Accessibility failures that prevent completion or understanding are not cosmetic.

## Browser profiles

At minimum, validate critical flows at:

- **Phone primary:** approximately 390 x 844 CSS px.
- **Narrow reflow check:** 320 CSS px width for changed/at-risk surfaces, matching the existing UX contract.
- **Desktop primary:** approximately 1440 x 900 CSS px.

Use real mobile emulation/device mode when available, not merely a narrow desktop window. Check touch targets, sticky/fixed navigation, keyboard/input behavior, dialogs, drawers, and the visible next action.

Do not attempt a full browser/OS compatibility matrix during blocker-first preflight unless a concrete defect suggests one.

## Production-critical scenario matrix

Record PASS / FAIL / BLOCKED / NOT-APPLICABLE plus evidence for each scenario.

### A. Identity, auth, navigation

**UX-A01 — signed-out entry**
- Open the public site.
- Confirm public navigation works and protected actions clearly lead to sign-in.
- Expected: no broken redirect loop; no protected mutation exposed.

**UX-A02 — captain sign-in and session**
- Sign in as a captain.
- Navigate away, refresh, and perform a normal browser restart/session-resume check when practical.
- Expected: session behavior matches current product contract; user lands somewhere understandable and recoverable.

**UX-A03 — authorization negative**
- As a non-authorized role, attempt a captain/admin mutation through normal UI/navigation.
- Expected: action is absent or rejected clearly; no hidden successful write.

**UX-A04 — find tonight/selected matchup**
- From normal navigation, find the relevant date/team/matchup without UUIDs or developer guidance.
- Expected: human-readable selections and a clear next action.

### B. Availability and lineup

**UX-B01 — dated availability**
- Mark Available / Unsure / Unavailable for the relevant league date.
- Refresh and revisit.
- Expected: dated state persists and is visible where captain lineup discovery consumes it.

**UX-B02 — substitute discovery**
- Use the supported captain path to identify an eligible available substitute.
- Expected: no roster churn/database intervention required for an ordinary sub case.

**UX-B03 — blind three setup**
- Choose and order the required lineup.
- Reorder before lock.
- Expected: ordering is clear and persists as designed.

**UX-B04 — duplicate/illegal participant prevention**
- Attempt a lineup state prohibited by current repo-defined rules, including the dual-team scenario where applicable.
- Expected: unsafe state cannot be silently committed; recovery guidance preserves valid selections.

**UX-B05 — lock/reveal**
- Submit/lock both sides through the real blind-lineup workflow.
- Expected: state transition is unmistakable; revealed fixed pairings are correct and cannot be client-invented.

### C. Score hub and rack-ledger scoring

**UX-C01 — Score hub context**
- Open `/scorecard`.
- Confirm date/team/matchup/race context is human-readable and the next action is obvious.
- Before reveal, captain should be routed to the canonical lineup path rather than a duplicate workflow.

**UX-C02 — scorer first view**
- Open a revealed race.
- Expected: both players, targets/context, team score, current individual score, ledger/history, and primary next action are understandable without hunting.

**UX-C03 — 9-ball -> 8-ball discipline**
- Exercise the current repo-defined rack/game order, including the 9-ball-to-8-ball transition.
- Expected: UI and persisted history match the business rules already encoded by the application/tests.

**UX-C04 — mismatch**
- From opposing team perspectives, intentionally create a disagreement.
- Expected: mismatch is obvious without color alone; neither side can accidentally finalize an inconsistent authoritative result.

**UX-C05 — old-rack correction**
- Enter later racks, then correct an earlier disputed rack.
- Expected: later valid history remains intact; both views converge after refresh/reconciliation.

**UX-C06 — confirm/finalize**
- Bring histories into agreement, confirm, and finalize.
- Expected: finalization is clear, authorized, idempotent, and reflected to both sides.

**UX-C07 — duplicate action**
- Double-click/repeat the final/critical action where safe.
- Expected: no duplicate rack/result/submission and no contradictory state.

### D. Recovery and concurrency

**UX-D01 — refresh mid-lineup**
- Refresh while lineup is partially prepared.
- Expected: documented persistence/recovery behavior; no silent impossible state.

**UX-D02 — refresh mid-score**
- Refresh after at least one scoring action.
- Expected: authoritative history rehydrates correctly and next action remains clear.

**UX-D03 — leave and return**
- Navigate away, use back/forward, then reopen the matchup/race.
- Expected: no stale phantom state; user can recover without developer guidance.

**UX-D04 — stale same-team collision**
- Use two sessions/devices for the same scoring team where setup allows.
- Create a stale-write situation.
- Expected: one write wins, stale client is told to refresh/reconcile, no phantom rack is created.

**UX-D05 — two-sided visibility**
- Keep both team perspectives open.
- Expected: meaningful remote changes become visible through the designed refresh/recovery model and neither side silently overwrites the other.

**UX-D06 — transient failure**
- Where practical in the browser, simulate/reproduce a temporary failed request or offline/retry edge.
- Expected: valid entries are preserved when designed; error is visible near the current task; retry does not duplicate a write.

### E. Eligibility and league rules

Use current code/issues/rule docs as authority; do not hard-code remembered rules when repository truth differs.

**UX-E01 — eligibility display/enforcement**
- Exercise an ineligible-player case relevant to the current season.
- Expected: user sees why the player cannot be used and cannot silently commit an invalid match state.

**UX-E02 — team participation / anti-ringer rule**
- Validate the current rule requiring the applicable minimum team participation before postseason use where implemented.
- Expected: behavior matches current repo/domain tests and UI explains rejection/recovery.

**UX-E03 — season qualification window**
- Validate the current appearance/eligibility window used by the season where applicable (including the existing 5-of-7 concept only if it remains current repo truth).
- Expected: UI/domain behavior agree; do not substitute old chat memory for current implementation.

**UX-E04 — postseason four-player lineup and 2-2 anchor tiebreaker**
- Use the isolated supported test flow.
- Expected: four-player postseason lineup and anchor/tiebreak logic are understandable and correct.

**UX-E05 — team cap / skill-level constraints**
- Validate only constraints actually present in current repo/domain authority.
- Expected: illegal combinations fail explicitly rather than through a mysterious submit error.

### F. Mobile completion

**UX-F01 — captain phone path**
- On phone viewport: sign in -> find matchup -> availability -> lineup -> lock/reveal.
- Expected: no page-level horizontal trap, obscured primary action, unreachable modal, or unusable touch target.

**UX-F02 — scorer phone path**
- On phone viewport: open race -> score multiple racks -> create/resolve mismatch -> confirm/finalize.
- Expected: user can understand current score/history and act without repeated long scrolls or hidden controls.

**UX-F03 — timestamps/status**
- Check required timestamps and captain/opponent/status indicators.
- Expected: relevant state remains visible and understandable at phone width.

**UX-F04 — keyboard/forms/overlays**
- Exercise inputs, menus, dialogs/drawers, sticky header, and mobile dock.
- Expected: keyboard or overlay does not hide the action/recovery path.

### G. Admin/operator smoke

**UX-G01 — player/team lookup**
- Operator can locate the relevant player/team/season from canonical admin surfaces.

**UX-G02 — ordinary correction/exception**
- Exercise one currently supported non-destructive admin correction or readiness exception.
- Expected: operator can understand cause and action without DB access.

**UX-G03 — destructive action safety**
- Inspect confirmations and consequences for any relevant destructive UI; use isolated data only if executing.
- Expected: action is deliberate and does not orphan match/history unexpectedly.

### H. Messaging smoke

**UX-H01 — send and receive**
- Send a normal coordination message on the current canonical messaging surface.
- Expected: recipient sees unread/preview behavior as designed.

**UX-H02 — moderation/reporting**
- If current role/setup supports it, verify report/moderation path loads and can act on isolated test content.
- Messaging polish is not a launch blocker unless it breaks core navigation, security, or league-night coordination required by #219.

### I. Accessibility/legibility spot checks

**UX-I01 — keyboard/focus**
- Critical controls have visible focus and a logical path.

**UX-I02 — color-independent state**
- mismatch/error/success/selected state remains understandable without color alone.

**UX-I03 — narrow reflow**
- Critical changed/at-risk surfaces reflow at 320 CSS px without page-level two-dimensional scrolling unless genuinely necessary.

**UX-I04 — zoom/readability**
- Spot-check zoom/reflow and key text/control contrast consistent with `.github/agents/ux-product.agent.md`.

## Fast execution phases

### Phase 0 — 10-minute reconnaissance

Goal: know what exact build and environment are being tested.

- reconcile repo/PR/issue/CI state;
- verify gamma identity and deployed revision;
- confirm usable test accounts/data;
- identify any already-known BLOCKER/HIGH issue that makes later scenarios pointless.

Exit: target and build recorded, or blocker documented.

### Phase 1 — desktop critical path

Run A02/A04 -> B01/B03/B05 -> C01/C02/C03/C06 -> D02/D03.

If any BLOCKER appears, stop broad exploration, fix/route it, and retest.

Exit: one complete captain-to-final-result path works on desktop.

### Phase 2 — phone critical path

Run F01/F02 plus the highest-risk parts of C04/C06.

Exit: critical path is completable and understandable on phone.

### Phase 3 — adversarial state

Run B04, C04/C05/C07, D01-D06, and authorization negative A03.

Exit: invalid/stale/repeated actions fail safely.

### Phase 4 — rules

Run E01-E05 using current repository truth and isolated data.

Exit: UI and rule/domain behavior agree for launch-critical cases.

### Phase 5 — operator and messaging smoke

Run G01-G03, H01-H02, and targeted accessibility checks.

Exit: ordinary league operations do not require hidden developer intervention.

### Phase 6 — release-candidate rerun

After blocker/high fixes are promoted to the intended release candidate:

- rerun the critical desktop path;
- rerun the critical phone path;
- rerun the exact reproduction for every fixed BLOCKER/HIGH;
- run required repo CI/contracts/canaries;
- record exact versionTag/SHA;
- produce launch-readiness summary.

## Evidence format

For every FAIL/BLOCKED and every important PASS, use this compact record:

```text
Scenario: UX-C04 mismatch
Environment: gamma
Host: https://gamma.fremontderby.com
Version/SHA: <exact value>
Role/session: captain, Team A / captain, Team B
Viewport: 390x844
Preconditions: <known state>

Steps:
1. ...
2. ...
3. ...

Expected:
...

Actual:
...

Severity: BLOCKER | HIGH | MEDIUM | COSMETIC
Evidence: screenshot/trace/log/link
Existing issue/PR: #...
Retest: PASS | FAIL | NOT YET
Notes: smallest useful technical observation; avoid speculation
```

If a screenshot contains private user information, do not attach it publicly. Prefer isolated/synthetic test data.

## GitHub issue rules

Before opening a new defect:

1. search open issues by the exact symptom, route, and key error/state words;
2. search recently closed issues/PRs if it may be a regression;
3. update the existing card when it owns the same root problem;
4. create a focused issue only when no current card owns it.

For a new BLOCKER/HIGH issue, include:

- severity in the title;
- exact browser reproduction;
- expected vs actual;
- affected environment/build;
- screenshot/evidence where safe;
- likely canonical surface/owner;
- launch impact;
- acceptance criteria that are observable in the browser;
- link to #219 when it blocks the two-captain trial.

Do not create one giant “UX bugs” issue containing unrelated defects.

## Fixing defects discovered by Work

The browser operator may fix a defect when all are true:

- no active PR already owns it;
- root cause is understood;
- fix is a small coherent slice;
- authorization/data/env rules remain unchanged unless the owning issue explicitly requires them;
- regression coverage can be added at the appropriate existing layer;
- relevant tests can be run.

Prefer the lowest reliable regression layer. Existing Node/domain/render/HTTP contract tests remain the default for business rules, APIs, auth, rendering contracts, and deployment behavior.

**Playwright is now an explicit project priority under issue #2524 and `docs/PLAYWRIGHT_SELF_HOSTED_RUNNER_PLAN.md`.** Once that foundation is available, use Playwright for browser-level regressions that materially depend on real navigation, viewport/touch behavior, browser persistence, multi-context state, or other user-visible browser behavior. Do not recreate a browser scenario manually in every Work run when a trustworthy Playwright test already covers it.

Until #2524 is verified, Work may continue manual browser validation rather than blocking release discovery on the harness implementation.

## Regression rule

Every fixed BLOCKER should receive durable regression protection whenever technically practical.

Choose the lowest reliable layer that catches the real bug:

- domain/business rule test;
- HTTP/repository/auth contract;
- render/page contract;
- shared controller/component test;
- deployment/canary check.

Browser evidence proves the symptom is fixed; repo tests protect it from coming back.

## Time-pressure rules

When time is short:

1. Run the full critical path before inspecting secondary pages.
2. Fix data integrity/auth/scoring/lineup failures before navigation friction.
3. Fix completion-blocking mobile issues before desktop polish.
4. Prefer one small verified fix over a broad refactor.
5. Defer MEDIUM/COSMETIC findings with a linked issue instead of expanding scope.
6. Do not repeatedly retest low-risk pages after unrelated changes.
7. After a shared component change, retest the component family it can affect.
8. Keep the status current enough that another agent can resume immediately.

## Status / handoff format

At the end of every Work run, update the active execution issue or handoff comment with:

- exact environment and version tested;
- scenarios newly passed;
- scenarios failed/blocked;
- BLOCKER/HIGH issues created or updated;
- fixes/PRs made and their CI/retest state;
- any unsafe or unavailable test prerequisite;
- the single highest-priority next action.

Do not bury launch status only in chat.

## Launch-readiness summary

A final Work preflight should end with a concise repository/GitHub record:

```text
Release candidate: <SHA/version>
Environment: gamma
Date:
Critical desktop path: PASS/FAIL
Critical phone path: PASS/FAIL
Concurrency/recovery: PASS/FAIL/BLOCKED
Eligibility/rules: PASS/FAIL/BLOCKED
Operator smoke: PASS/FAIL/BLOCKED
Messaging smoke: PASS/FAIL/BLOCKED
Known BLOCKERs: <count + links>
Known HIGHs: <count + links + disposition>
Blocked scenarios: <list + prerequisite>
Required CI/canaries: PASS/FAIL
Two-human #219 gate: READY TO RUN | NOT READY
Next action: ...
```

The Work preflight may say **READY TO RUN #219**. It must not claim the two-human gate itself passed without two real captains completing it.

## Copy/paste bootstrap for ChatGPT Work

Use this when launching the browser-validation session:

```text
Continue Fremont Derby production-readiness UX validation from the current repository state.

Repository: https://github.com/Fremont-Derby/fremontderby

Start from current main, not memory. Read AGENTS.md, README.md, docs/WORK_BROWSER_UX_VALIDATION.md, docs/SEASON1_TEST_CONTRACT.md, issue #219, and the browser/UX/release specialist guides under .github/agents.

Use the interactive browser to execute the runbook against the correct current release-candidate environment, normally gamma. Verify lane identity and exact deployed revision before testing. Prioritize the real captain league-night path and phone completion over cosmetic review.

Operate blocker-first:
reproduce -> capture evidence -> classify -> deduplicate -> fix or route -> retest -> adjacent smoke -> update GitHub status.

Do not mutate production unless the product owner explicitly authorizes the exact production action. Do not weaken auth/RLS/environment isolation. Do not invent passes or replace the two-human #219 release gate.

Fix only contained unowned defects with the smallest safe change and appropriate regression coverage. Treat #2524 as the owned path for establishing Playwright infrastructure; once the harness is verified, add focused browser regressions there when the defect genuinely requires a real-browser assertion rather than a lower-layer test.

End with exact environment/SHA tested, scenario status, linked blocker/high issues and PRs, and one clear next action. The desired outcome is READY TO RUN #219 with zero known blockers.
```

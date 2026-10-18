# Agentic Development 12-Hour Executive Review

This is the durable 12-hour retro and velocity scoreboard for the Fremont Derby agentic-development program. It evaluates the delivery system and lane behavior, never individual-agent effectiveness. Activity volume is not success.

**Shared objective:** get JFL to a product-complete, human-testable Fremont Derby as quickly and safely as possible. JFL owns product completion/integration/verification. DRU owns exploration and stress testing that produces reproducible evidence and portable fixes for JFL. Gamma remains dormant until the JFL-completion milestone explicitly permits it.

## Scoreboard definitions

Track only signals supported by repository evidence.

- **Product-flow advancement:** user stories or slices materially closer to end-to-end JFL verification; merge alone is not verified completion.
- **Verified completion:** required regression plus hosted/exact-SHA or human proof where applicable.
- **DRU discovery value:** real workflow failures found through adversarial/live journeys.
- **DRU -> JFL portability:** confirmed DRU findings that are independently qualified against JFL and handed over as reproducible product evidence.
- **Rework/consolidation:** duplicated, superseded, reverted, collision-driven, or stale-lane work.
- **CI/process friction:** governance, runner, environment, lifecycle, or workflow failures distinct from product regressions.
- **Convergence:** whether both lanes shorten the same product-completion loop rather than build separate roadmaps.

PR, commit, issue, and journal counts are context only, never velocity scores.

## Resolution-first review rule

A review should reduce an actual blocker, not merely rediscover it. Choose at most one highest-impact unresolved program constraint and classify the **next action**, not the agent: **safe fix now**, **awaiting required proof/review**, or **requires an explicit product-owner/authority decision**. Prefer an allowed correction on the existing card/PR over a new issue or status comment. Record the owner, exact acceptance evidence, and changed state only when this materially affects execution. Never count a green unit test, merged PR, or DRU-only result as completed JFL human acceptance.

If the same finding has not changed, reuse its canonical GitHub record and do not re-report it as progress. If a write or CI rerun is blocked, distinguish that tooling limitation from product-policy ambiguity; do not relabel or bypass checks to manufacture closure. Preserve the P0 security and lane boundaries even when a quick process fix would make a check green.

**2026-10-13 execution check:** #3290's neutral steward owner text was corrected after its last failed PR-card run (38141964628); that historical run rejected descriptive JFL/DRU words as dual ownership and then demanded a DRU journal link. A fresh trusted validation is required before changing the validator. This report-only update is a normal PR synchronization, not proof of check success; verify the resulting checks before merge.


## Baseline — 2026-10-05

The initial inspection found positive JFL product flow and valuable DRU discoveries, but excess DRU WIP, DRU-only scoring conveniences, and weak discovery-to-JFL portability. Governance corrections established trusted-main validation, DRU mentoring/journal expectations, shared mission guidance, and a release-source boundary that keeps DRU out of Gamma/production.

The baseline ideal loop is:

**DRU live failure -> reproducible handoff -> JFL independent reproduction/remediation -> regression proof -> JFL hosted/human verification -> DRU adversarial retest.**

## 2026-10-06 00:00 CT review

### Executive signal

**Direction: accelerating and beginning to converge, but cross-lane cycle time remains the primary constraint.**

JFL has recently completed a coherent operator/season-management chain rather than fragmenting into unrelated micro-work: season-context isolation/recovery, registration-failure recovery, distinct next-season creation, and edge-error recovery. This is meaningful product advancement toward #2800.

DRU has materially improved from the baseline. It resumed a real championship journey (Foxglove Night 3536) and found #3341: a released team still counted against practice-night publish readiness. #3342 is a focused DRU fix with regression coverage. This is preferable to speculative backlog generation or synthetic-shell expansion because the defect emerged from an end-to-end product journey.

The remaining convergence gap is portability. #3341 now carries explicit steward guidance: after DRU verifies the live fix, independently determine whether current JFL shares the defect. If yes, hand JFL exact reproducible evidence and the behavioral contract; if not, record why it is DRU-only. Do not blindly copy DRU helpers into JFL.

### Objective velocity / flow scoreboard

| Dimension | Current signal | Trend from baseline |
| --- | --- | --- |
| JFL product-flow advancement | **Positive** | Improving: recent work forms a coherent operator workflow rather than unrelated PR volume. |
| Verified product completion | **Improving but incomplete** | More regression/browser evidence is flowing, but full human-testable league-night completion remains the terminal goal. |
| DRU discovery value | **Positive / recovering** | Improved materially: live championship traversal is again generating concrete blockers. |
| DRU -> JFL portability | **Mixed, with mechanism corrected** | Still not a completed loop; #3341 now explicitly requires JFL qualification after live DRU proof. |
| Rework / stale inventory | **Improving** | Obsolete Gamma-oriented DRU work #3271 and #2968 was closed as not planned; broad historical DRU cleanup was intentionally avoided. |
| Governance health | **Healthy** | Existing rules are sufficient; observed problems are increasingly execution/work-selection issues rather than missing policy. |
| Lane-boundary health | **Strong** | Gamma remains dormant; stale Gamma-promotion work has been removed from active DRU selection. |
| JFL P0 pull-through | **At risk** | #3288 scorekeeper claim/pass remains an aging P0 and must not be indefinitely displaced by tractable P1 work. |
| Independent privacy acceptance | **Outstanding** | #3311 remains the required DRU adversarial acceptance for three-channel consent/matchup retirement. |
| JFL <-> DRU convergence | **Improving** | DRU is again attacking real journeys, but a full DRU->JFL->verify->DRU-retest cycle has not yet completed. |

### Practices to preserve

- JFL's recent vertical slicing: reproduce/qualify -> focused remediation -> regression proof -> integration/verification.
- DRU driving a real season/championship journey until product behavior blocks it.
- One focused card per live blocker rather than speculative issue generation.
- Distinguishing DRU exploration helpers from portable Fremont Derby product behavior.
- Closing obsolete work-selection traps instead of adding more governance prose.
- Keeping merged, verified, and closed as distinct lifecycle states.

### Waste / risks to control

1. **P0 starvation:** #3288 scorekeeper resilience has aged while later P1 work flowed. The next useful JFL sequence is claim primitive reconciliation -> bind ordinary scoring mutations -> takeover/pass UI -> two-person browser proof -> DRU adversarial handoff.
2. **Unconsumed privacy handoff:** #3311 remains unclaimed. DRU's championship journey is useful and should not be interrupted mechanically, but #3311 must be consumed at a natural boundary rather than disappear behind endless exploration.
3. **DRU-only terminal fixes:** a live DRU fix is discovery infrastructure until its relevance to JFL is explicitly qualified. Every completed DRU blocker should answer: **does this defect exist in current JFL?**
4. **Historical DRU inventory noise:** many older synthetic-shell cards remain open. Do not bulk relabel or close them. Reconcile each against current live behavior when that surface is encountered.
5. **Reporting theater:** this artifact only matters if lane behavior changes or decisions reference the evidence. Do not update it merely because 12 hours elapsed; update only when material evidence changes the trend.

### Durable adaptations this cycle

- #3341 received explicit portability/handoff guidance requiring JFL qualification after DRU live verification.
- #3271 (Review the shared DRU work for Gamma) was closed as not planned because Gamma is dormant.
- #2968 (Promote shared DRU product work to Gamma) was closed as not planned for the same reason.
- No new validator or governance mechanism was added. Existing policy already describes the desired behavior.

### Guidance until the next material review

**DRU:** continue the live championship journey. When a blocker is fixed and proven in DRU, immediately qualify whether the same behavior fails in current JFL. Hand JFL reproducible evidence only when demonstrated. Do not build a parallel DRU product and do not touch Gamma.

**JFL:** continue coherent product-completion slices, but prioritize the aging #3288 P0 once the current coherent slice reaches its boundary. The intended sequence is server claim/handoff reconciliation -> mutation enforcement -> scorecard takeover/pass UI -> two-person browser proof. Keep #3311 visible for independent DRU privacy acceptance.

**Program:** optimize cross-lane cycle time, not PR count. The success signal is repeated completion of the ideal loop, ideally multiple times per day.

### Next thing to watch

The strongest next evidence would be:

1. #3342 clears and the Foxglove championship journey continues.
2. #3341 is explicitly qualified against current JFL and, if reproducible there, becomes a portable JFL handoff.
3. JFL resumes #3288 through mutation enforcement and UI/browser proof.
4. DRU consumes #3311 at the next natural journey boundary.
5. A repaired JFL behavior is adversarially retested by DRU.

**Convergence judgment:** improving materially, but not yet a closed flywheel. JFL is converging on product completeness and DRU has returned to useful live exploration. The next acceleration step is reducing the time from DRU discovery to JFL verified remediation and DRU retest.


## 2026-10-06 08:00 CT review

### Executive signal

**Direction: JFL flow accelerated; DRU discovery throughput exploded into queue/WIP overload, so system convergence regressed despite useful findings.**

JFL produced multiple source-to-exact-deployed acceptance loops and closed six focused acceptances in its latest recorded run (#2311, #1813, #3520, #3523, #2796, #3525). It also independently reviewed #3288 and found a stale-requester eligibility defect before acceptance, preserving the P0 contract instead of rubber-stamping a green primitive.

DRU continued real-night exploration and found many concrete defects, but the journal records **56 open DRU pull requests** targeting the permanent DRU lane and an emergency consolidation because the publish pipeline could only serialize them. That is direct evidence that discovery/implementation arrival rate exceeded lane verification/deployment capacity. The resulting batch is rework/consolidation, not product velocity. The prior review's one-focused-card / portability guidance was not consumed strongly enough to prevent queue explosion.

### Objective velocity / flow scoreboard

| Dimension | Current signal | Trend from prior review |
| --- | --- | --- |
| JFL product-flow advancement | **Strong** | Improved: six focused acceptances plus exact deployed/browser evidence. |
| Verified product completion | **Improving** | JFL is closing bounded acceptance slices; #2800 remains open and terminal two-captain/human proof is incomplete. |
| DRU discovery value | **High** | Real-night negative testing is surfacing many concrete user-visible defects. |
| DRU -> JFL portability | **Weak** | No completed DRU→JFL→verified→DRU-retest loop was found; #3311 remains unclaimed. |
| Rework / consolidation | **Severe** | 56 open DRU PRs required a special consolidation ship because serialized deployment could not absorb them. |
| CI / process friction | **Material** | Serial permanent-lane publishing became a bottleneck; docs/process-only fan-out remains separately tracked in #3345. |
| Lane-boundary health | **Good** | No evidence of DRU→Gamma/production promotion; JFL/DRU branch boundaries remain respected. |
| JFL P0 pull-through | **Improving but blocked** | #3288 received independent review; a stale-recipient transfer defect must be remediated before acceptance. |
| Independent privacy acceptance | **Stalled** | #3311 is still unclaimed despite being P0/handoff:dru. |
| JFL ↔ DRU convergence | **Regressed** | Both lanes are product-oriented, but DRU output is accumulating faster than it is qualified/consumed by JFL. |

### Representative end-to-end evidence

**JFL acceptance loop:** recent #2800 evidence records exact deployed SHAs, green CI, controlled browser checks, real supported persona/API checks, rollback-only SQL where appropriate, and explicit limits on what was *not* proven. #2796 was closed only after populated/search/signed-out acceptance. #3525 closed after phone-width verification. This is the verification discipline to preserve.

**JFL P0 protection:** read-only review of #3288 identified that expired/Release takeover paths could transfer ownership to a requester who became ineligible after requesting. That finding maps directly to the product contract and blocks false completion. It is not yet a completed ideal-loop instance because remediation/browser proof/DRU adversarial retest remain outstanding.

**DRU queue failure:** #2883's newest session contract explicitly says 56 open PRs were the same night's fixes and that publishing them individually would keep the lane busy all night. The human authorized a one-time combined ship. This is strong evidence of WIP/flow-control failure: useful discovery was converted into more implementation inventory than the serialized lane could validate/deploy. Consolidation is a recovery action, not evidence that the 56 slices independently reached verified completion.

### Prior-review consumption

JFL behavior materially reflects the prior review: it returned attention to #3288, used independent qualification, and continued exact-SHA hosted acceptance rather than counting merges. No ceremonial acknowledgment is required.

DRU behavior only partially reflects it. Real-night exploration continued as requested, but the prior warning against PR fragmentation and the request to qualify portable findings did not prevent 56 concurrent PRs. #3311 also remains unconsumed. The report therefore risks becoming theater for DRU unless work selection changes at the next natural boundary.

### Durable adaptation

No new validator is justified yet. Existing policy already says one primary card, one coherent objective, prefer one evidence-rich JFL handoff over many micro-PRs, and ask whether work advances the product or feeds the pipeline. The failure is execution/flow control, not missing prose.

The smallest durable adjustment is operational: **after the current DRU consolidation recovery, stop opening implementation PRs faster than the permanent DRU lane can verify/deploy them. Keep discovery evidence on cards and convert only the highest-value blocker into implementation until lane WIP drains.** At the next natural boundary, consume #3311 or hand JFL one demonstrated portable blocker. Do not add another mechanical rule unless this failure repeats after the explicit correction.

### Risks / next thing to watch

1. Whether the 56-PR DRU batch actually drains to a small verified inventory rather than merely becoming one large unverified merge.
2. Whether DRU converts a demonstrated live failure into a JFL-qualified handoff and completes the first full ideal loop.
3. Whether #3311 is accepted and executed instead of remaining a permanent P0 handoff.
4. Whether #3288 remediates stale-recipient eligibility and proceeds through mutation enforcement, browser proof, and independent DRU attack.
5. Whether JFL's high verification discipline remains focused on #2800 core paths rather than drifting into an endless tail of phone/polish defects.

**Convergence judgment: temporarily drifting apart at the system level.** JFL is accelerating verified product completion and DRU is generating valuable real-product evidence, but DRU's implementation arrival rate has overwhelmed its serialized verification/deployment path and has not yet shortened JFL's cycle time. Convergence resumes when DRU WIP drains and repeated discoveries terminate in JFL-qualified, verified, adversarially retested outcomes.


## 2026-10-10 evening CT review — material new evidence

### Executive signal

**DRU is rebuilding test inventory and has shipped a staged admin-phone migration, but the cross-lane product flywheel remains stalled. A new P0 workflow trust-boundary problem now outranks documentation/test-volume improvements.**

Compared with the 2026-10-10 prior review, four recent DRU-targeted PRs merged: #3552 (restored tests), #3554 (structural tests), #3555 (admin-phone RPC/application path), and #3556 (human-readable war-game docs). JFL permanent SHA remains `1cbb341a8ea57c9daee85f4b4879e5b27806d1fb` (2026-10-06); main remains `9f1ef8adf3a8adfebca5142a3148a11c930828fa`. No new terminal JFL #2800 acceptance or complete DRU→JFL→DRU loop was found. Gamma remains dormant.

### Objective flow scoreboard

| Dimension | Evidence | Trend |
| --- | --- | --- |
| Verified JFL product completion | No new exact-deployed JFL SHA or accepted #2800 exit slice since 2026-10-06 | Flat |
| DRU product discovery | No newly evidenced JFL-qualified DRU defect or cross-lane handoff | Flat |
| DRU staging/data advancement | #3555 created/applied DRU-only admin phone RPC; service-role grant verification and migration history recorded; application UI/publish replay not yet proven | Positive but partial |
| DRU test inventory | #3552 restored 154 tests and eight suite files; #3554 added structural tests; PR body reports 3,034 tests, not a real user journey | Up; verification value unqualified |
| DRU implementation PR WIP | Four new DRU PRs merged; none of these is an open implementation PR at inspection | Low concurrency, but work still unverified |
| Rework/consolidation | #3530 deleted hundreds of tests and security controls; #3552/#3554 partially rebuild tests while #2887 remediation remains absent | Still material |
| Independent privacy acceptance | #3311 P0 remains ready/unclaimed | Stalled |
| JFL scorekeeper and browser gates | #3288/#3289 blocked on eligibility and PR-card proof; #2817 hosted reset succeeded but browser job cancelled | Stalled |
| Monitoring | sampled scheduled runs 38051885515, 38041359193, 38037768768 ended cancelled; no execution evidence from them | Coverage unhealthy |
| Lane boundary | No new DRU→Gamma or JFL peer-branch mutation found | Preserved |
| Ideal complete loop | 0 confirmed in this review window | Stalled |

### End-to-end representative traces

**DRU admin-phone #2886 → #3555.** The issue documented the schema decision before applying, choosing `dru.set_admin_player_phone` with `service_role` only and private contact storage. PR #3555 merged 2026-10-10 19:33 UTC. PR-triggered workflows [38080163670](https://github.com/Fremont-Derby/fremontderby/actions/runs/38080163670) and [38080163674](https://github.com/Fremont-Derby/fremontderby/actions/runs/38080163674) successfully ran staging apply steps; issue #2886 records version 20261010191200 and denied anon/authenticated EXECUTE. This is stronger than merely having a migration file. It does **not** prove the deployed DRU UI PUT, live admin phone save, original publish prerequisite, or removal of the 555 workaround. The card correctly remains open.

**Regression in workflow trust boundary (new P0).** `.github/workflows/dru-db-probe.yml` is named a read-only probe but now includes a privileged migration apply step and runs on `pull_request`. `.github/workflows/dru-apply-admin-phone.yml` also applies PR-checked-out SQL under a staging-management credential on `pull_request`. Even docs-only PR #3556 caused the probe's apply step to run successfully ([38084647363](https://github.com/Fremont-Derby/fremontderby/actions/runs/38084647363)). This is an actual unwanted side effect of routine PR validation, not proof of secret exfiltration. Fork PRs normally do not receive repository secrets, but same-repo PR content is not a trusted DDL source. Separate secretless read-only PR validation from approved exact-SHA permanent-lane/manual apply; preserve required checks and explicit non-production project scoping. Do not rerun migrations merely to prove this point.

**DRU security-source regression #2887 persists.** Current `fremontderby-dru` still lacks the two notification RLS migrations and `test/dru-notification-rls.test.js` that exist on `dru-backup-6-october-2026`; #3530 deleted the corresponding apply workflow/script. The new admin-phone migration is not a replacement for notification RLS. Live `dru.user_notifications` grants/RLS remain unverified, so do not claim a fresh exposure result or remediation.

**Test-recovery PR scope.** #3552 merged 162 test/suite files with no application code. #3554 reported new tests only but its 81-file diff also introduced `dru-db-probe.yml` and modified `seed-jfl-two-captain.yml` in DRU source. #3555 then extended the probe into a mutating workflow. This is a demonstrated review-scope mismatch; do not infer intentional validator gaming. PR checks passing are not evidence of absent side effects.

### Governance and coaching

Main `AGENTS.md`, JFL/DRU guides, and `docs/AGENTIC_DEVELOPMENT_PROGRAM.md` still require one coherent objective, JFL-qualified portability, and exact deployed proof. DRU permanent-branch guide is shorter than the main guide and lacks the mentoring-journal section; agents must use main as authoritative. The DRU war-game runbook still instructs resetting the permanent DRU branch to JFL while restoring only three lane-keep pieces, a repeatable way to lose security-sensitive migrations/tests. It also says not to edit a card created by a named author, inconsistent with accepted-card ownership; no evidence of intentional evasion.

The latest #2883 entries are session contracts for restored tests, structural tests, and #3555. They document bounded scope but do not include the charter's explicit Shared objective/DRU contribution/JFL handoff/Done when fields, nor a completed Session result for the new work. No new observable JFL consumption or independent #3311 acceptance was found. The previous retro's anti-fragmentation message is reflected in low open implementation WIP, but not yet in completed shared-product outcomes. Do not reward test counts or documentation volume as velocity.

### Minimal corrective action and watch

1. **P0 workflow safety:** remove privileged SQL apply from PR-triggered DRU workflows, retain secretless PR validation, and require trusted reviewed SHA/explicit approval for staging DDL. This is a focused security/process card, not a broad governance rewrite.
2. Restore/verify #2887 notification RLS migration, tests, apply path and live grants/policies; preserve existing security invariants during any DRU/JFL alignment.
3. Complete #2886 through deployed UI and publish replay, not merely staging DDL and source tests.
4. Restore trusted scheduled runner execution, and unblock #2817, #3288, and #3311 with actual evidence.
5. Measure the next complete DRU discovery → JFL remediation → hosted verification → DRU adversarial retest, rather than number of PRs or tests.

**Convergence judgment: coordination boundaries are holding, but delivery-system convergence is still stalled.** DRU's new work is locally useful; none of it has yet reduced the remaining JFL product-completion gate. The PR-triggered database mutation defect is a regression in safety/verification design and needs correction before treating this activity as acceleration.

**Evidence:** [#2886](https://github.com/Fremont-Derby/fremontderby/issues/2886), [#2887](https://github.com/Fremont-Derby/fremontderby/issues/2887), [#2883](https://github.com/Fremont-Derby/fremontderby/issues/2883), [#3552](https://github.com/Fremont-Derby/fremontderby/pull/3552), [#3554](https://github.com/Fremont-Derby/fremontderby/pull/3554), [#3555](https://github.com/Fremont-Derby/fremontderby/pull/3555), [#3556](https://github.com/Fremont-Derby/fremontderby/pull/3556), [#3290](https://github.com/Fremont-Derby/fremontderby/pull/3290), [#2800](https://github.com/Fremont-Derby/fremontderby/issues/2800), [#3311](https://github.com/Fremont-Derby/fremontderby/issues/3311).


## 2026-10-11 morning CT review — monitoring execution root cause and safety follow-through

### Freshness, source and change boundary
Read-only GitHub inspection at approximately 2026-10-11 13:00 UTC: `main` = `9f1ef8adf3a8adfebca5142a3148a11c930828fa`, permanent JFL = `1cbb341a8ea57c9daee85f4b4879e5b27806d1fb`, permanent DRU = `e06fbcf5026265c8e47173313104e69540d19804`, permanent Gamma = `dbd1d29af539aa5c21f3352436ebb24f479d83cb`. No new JFL/DRU/main product commit or merged PR after the prior evening review. The latest DRU merge remains #3556 at 2026-10-10 20:45 UTC. The last JFL permanent push remains 2026-10-06 09:15 UTC. The retro PR #3290 is unmerged, so this report is **PR-branch evidence, not mainline policy**.

### Comparable outcome/flow scoreboard (since previous material review)
| Signal | 2026-10-11 observation | Trend versus 2026-10-10 evening |
| --- | --- | --- |
| New verified JFL #2800 core-story acceptance | 0; #2800 still open, exact permanent JFL SHA unchanged | Flat |
| New JFL product merges | 0 | Flat |
| New DRU merges / qualified JFL handoffs | 0 / 0 since last review | Flat |
| Open DRU implementation PRs | 0; seven open repository PRs include legacy proposals and #3290, but no open DRU-owned implementation PR | Controlled WIP, not verified progress |
| End-to-end DRU failure → JFL reproduce/fix → regression → hosted/human proof → DRU retest | 0 confirmed | Flat |
| P0 independent messaging acceptance | #3311 still `agent:unclaimed` / `stage:ready`; no adversarial proof | Stalled |
| JFL scorekeeper/browser gates | #3288/#3289 still blocked on stale takeover-recipient eligibility; #2817 trusted reset passed but browser job cancelled | Stalled |
| DRU notification security | #2887 still `stage:claimed`; RLS source/apply/test recovery and live access verification absent | Open P0, not freshly measured exposure |
| Monitoring execution | Five newly created scheduled runs since 2026-10-11 01:00 UTC: two cancelled, three queued; zero executed check jobs | Still blind; root cause now identified in source |
| Gamma product work | No recent permanent Gamma push (last observed 2026-10-04); #2527 remains deferred | Boundary preserved |

### New diagnostic evidence: scheduled health workflows are configured to starve
The three *current main* workflow files `.github/workflows/hourly-live-probe.yml`, `lane-health-monitor.yml`, and `public-surface-canary.yml` each select `runs-on: ${{ github.event.inputs.runner_target || 'self-hosted' }}` for scheduled runs, specify `shell: cmd`, and set `concurrency.cancel-in-progress: true`. Their manual-dispatch runner choices include `ubuntu-latest`, but a simple runner switch is not sufficient because `cmd` is a Windows shell and their scripts/diagnostics must be assessed for portability. The latest runs [38140128077](https://github.com/Fremont-Derby/fremontderby/actions/runs/38140128077), [38122743348](https://github.com/Fremont-Derby/fremontderby/actions/runs/38122743348), and [38118007418](https://github.com/Fremont-Derby/fremontderby/actions/runs/38118007418) have queued/unassigned jobs; predecessors [38115347153](https://github.com/Fremont-Derby/fremontderby/actions/runs/38115347153) and [38102695039](https://github.com/Fremont-Derby/fremontderby/actions/runs/38102695039) were cancelled before performing checks. This is direct source/configuration plus run evidence of a self-hosted runner assignment and cancellation failure, **not evidence that production endpoints are down**. Ordinary GitHub-hosted PR CI still succeeds. The smallest safe follow-up is a focused portability/runner-availability design that keeps scheduled probes executing without giving untrusted code secrets or disabling useful monitoring. Do not change runner labels or shell blindly.

### PR database-mutation evidence strengthened, but defect is not new
Both permanent DRU workflows `.github/workflows/dru-db-probe.yml` and `.github/workflows/dru-apply-admin-phone.yml` still execute write-capable Supabase management SQL from `pull_request` workflows. The supposed probe applies `20261010191200_dru_set_admin_player_phone.sql` and inserts its migration-history version on **every PR**. On the docs-only #3556, [run 38084647363](https://github.com/Fremont-Derby/fremontderby/actions/runs/38084647363) actually logged `apply http 201` and `history http 201`; the apply job also succeeded in [run 38080163674](https://github.com/Fremont-Derby/fremontderby/actions/runs/38080163674). `contents: read` does not make a supplied database-management token read-only. This is a confirmed PR/DB trust-boundary defect, not evidence of secret theft. The focused corrective decision and non-production guardrails were already recorded on [parent #2884](https://github.com/Fremont-Derby/fremontderby/issues/2884#issuecomment-6105945233); do **not** create a duplicate generic governance initiative. A focused implementation card is appropriate if repository safety permits. Do not directly mutate DRU-owned branches from the steward lane.

### Lifecycle, journal, and governance findings
- #2886, #3551, and #3553 remain open with `stage:merge-ready` despite their associated DRU PRs having merged. This is stale lifecycle metadata; merge does **not** satisfy hosted/product verification, and bulk relabeling would obscure rather than repair it.
- #3554 described new test files only but changed `.github/workflows/dru-db-probe.yml` and `seed-jfl-two-captain.yml`. #3555 reused the `dru/issue-3553-structural-tests` branch for unrelated admin-phone work. Both are observable scope/review-friction signals, not evidence of intentional gaming. PR #3530's 1,632-file sync removed security source controls; #3552/#3554 test recovery has not restored #2887.
- #2883's most recent DRU entries remain bounded **Session contract** notes for restored tests, structural tests, and admin-phone shipping, without a corresponding verified result or explicit JFL receiving proof. Earlier JFL messaging coaching was visibly consumed in #3547, but no JFL/DRU comment, reference, or delivered behavior yet demonstrates consumption of the **latest** retro's safety/verification priority. Do not demand ceremonial acknowledgment; watch whether next DRU work selection changes.
- #3290 required CI, release-source and Gamma-RC checks passed, but [PR-card-contract run 38100271543](https://github.com/Fremont-Derby/fremontderby/actions/runs/38100271543) failed explicitly: `Owner lane / agent must name only one of JFL or DRU.` Tracking card #3291 legitimately has `agent:chatgpt` and `stage:handoff`. Do not impersonate either product lane or bypass the check. Neutral steward ownership needs a focused governance decision if this retro is to reach main.

### System-level judgment and next proof
**Convergence remains stalled.** JFL's exact-SHA discipline and DRU's lower implementation WIP are worth preserving, but no completed cross-lane product-acceptance loop has emerged. The new value of this review is a precise monitoring-execution root cause and independent log-level confirmation of a previously reported P0 PR/database side effect, not a claim of additional shipped product. Prioritize safe PR/migration separation and #2887 RLS recovery, then restore genuinely executing scheduled checks and #2817 trusted browser verification; use #3311 as the next DRU independent JFL-facing acceptance. No new validator, branch sync, Gamma activity, or relabel sweep is warranted.

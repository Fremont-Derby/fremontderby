---
name: JFL implementation lane
description: Lane-specific operating instructions for the JFL development agent. AGENTS.md remains authoritative.
---

# JFL Agent Instructions

## Authority and required reading

`AGENTS.md` is the authoritative operating contract. This guide adds JFL-specific discipline and may not override or weaken it.

Before claiming or continuing work, read in this order:

1. `AGENTS.md` from current `main`;
2. this JFL guide;
3. `.github/agents/dru.agent.md`;
4. the active issue, parent/dependency issues, open overlapping PRs, and current CI or hosted evidence relevant to the task.

If this guide or the DRU guide conflicts with `AGENTS.md`, follow `AGENTS.md` and open or update a governance card describing the conflict.

## Peer pulse before normal prioritization

Before claiming or continuing ordinary implementation work, JFL performs one concise GitHub peer pulse:

1. Check open items labeled `handoff:jfl` and open `[AGENT-PRACTICE-CANDIDATE]` cards that explicitly request a JFL vote.
2. Review DRU's **up to three highest-priority active cards** (`agent:dru` at Claimed, In Progress, Handoff, or Merge Ready), DRU's open PRs, and DRU's newest durable issue/PR handoff even when it names another reviewer.
3. Compare the peer work's declared or touched surfaces with the intended JFL card before claiming or editing.

Apply the pulse efficiently:

- Treat `priority:p0` safety, infrastructure, governance, and `collision-risk` handoffs as immediate intake.
- When planned work depends on a hosted lane, also check related `human-required` blockers and current hostname/environment health. Do not claim hosted UI or QA work against a known NXDOMAIN, wrong environment, or unavailable lane; sequence the blocker or choose independent work.
- Record an explicit `AGREE` or `DISAGREE` with rationale on the canonical joint-practice card when JFL's vote is requested.
- If work overlaps, do not start a competing implementation. Record the collision on the canonical card and choose read-only review, a coherent split, explicit sequencing, or an accepted card handoff.
- The pulse never transfers branch ownership. Inspect DRU branches and PRs read-only and continue only on a JFL-owned branch.
- Add a compact `### Peer pulse` issue/PR note only when the check changes the plan, exposes a collision or dependency, answers a handoff/vote, or produces a reusable lesson. Link what was checked and record the overlap decision, lesson candidate, and exact next action. Do not add routine “no change” comments.
- A compatible peer lesson may become a stricter JFL habit immediately. It remains lane-local unless both agents explicitly approve promotion through the existing `[AGENT-PRACTICE]` process.

After the pulse, resume normal impact-based prioritization.

## JFL lane behavior

- JFL identifies the agent lane, not permanent ownership of a product area, file set, or branch.
- Claim exactly one primary implementation card before editing and record JFL as the implementation owner.
- Start normal work from current `main` on a focused `jfl/issue-<number>-<short-slug>` branch.
- Treat `fremontderby-jfl` as JFL's permanent deployment lane, not as a general implementation branch or shared mutable workspace.
- Never check out, commit to, push to, merge into, rebase, reset, rename, delete, update, or otherwise mutate a `dru/*` branch or `fremontderby-dru`. No handoff creates an exception.
- Inspect DRU work only through read-only PR, diff, compare, or commit views. If JFL accepts a DRU card handoff, create a new `jfl/*` branch from current `main` and continue there.
- Declare important files and high-collision surfaces before implementation. Coordinate rather than race when DRU owns an overlap.
- Keep changes within the card. Capture unrelated discoveries as linked follow-up cards.
- Use the full lifecycle in `AGENTS.md`; merge is not completion.

## Cloudflare configuration and admin-access boundary

For JFL, Cloudflare desired state is **configuration as code**. Repository-owned configuration, workflows, scripts, tests, and infrastructure definitions are the durable source of truth; dashboard or API mutations are never the normal deployment mechanism or a substitute for codified state.

- Prefer repository-owned `wrangler` configuration and focused automation that declares the exact JFL Worker, route, hostname, variables, secret requirements, and deployment behavior.
- Read-only Cloudflare inspection is allowed when needed to diagnose an active JFL card, but inspect only the minimum account surfaces needed to answer the question.
- JFL does **not** self-authorize manual or privileged Cloudflare mutation, even when broad admin access is technically available. Admin capability is not authority.
- When repository-owned configuration cannot complete a required Cloudflare control-plane action, stop the mutation path and require a **DRU-originated admin-related card** that explicitly requests JFL execution. The card must name the exact resource/hostname/action, explain why config-as-code is insufficient for that step, define expected outcome and verification, and identify rollback or safe-stop behavior when applicable.
- JFL must review that DRU request and record explicit `AGREE` before executing the requested admin action. If the request is ambiguous, broader than necessary, or conflicts with `AGENTS.md`, JFL does not execute it and records the concern instead.
- A DRU-originated admin card authorizes **only** the named control-plane action. It never transfers branch ownership and never grants permission to mutate a DRU implementation branch, unrelated DRU resources, Gamma, production, secrets, data, or other infrastructure outside the exact approved scope.
- If the requested action can affect multiple deployment lanes or shared external infrastructure, the shared-infrastructure mutation rule in `AGENTS.md` still applies in full. A DRU request does not bypass the required cross-lane review gate.
- If a JFL branch or deployment succeeds because of an approved Cloudflare admin action, treat the result as incomplete until the successful desired state is represented in repository-owned config/automation/tests wherever Cloudflare supports codifying it and hosted verification proves JFL still serves the intended state.
- When Cloudflare does not expose a practical config-as-code mechanism for an unavoidable admin-only setting, record the exception on the card with exact current state, reason it cannot be codified, verification evidence, and the trigger for revisiting it. Hidden dashboard drift is not acceptable operating knowledge.
- Never use admin access to “click around until it works,” explore unrelated resources, inspect secrets unnecessarily, repair another lane opportunistically, or broaden a successful JFL fix into cross-lane mutation.

When DRU raises a properly scoped admin request based on evidence from a successful JFL change, review it promptly. If it satisfies the rules above, record JFL approval and execute only the approved action safely, then return to config-as-code as the durable source of truth.

## Learn from DRU without creating drift

Read the DRU guide and its recent durable handoffs for methods that reduce collisions, improve proof, or make work easier to resume. JFL may use a compatible stricter practice locally, but must not treat DRU's preferences as repository-wide authority.

When a DRU practice looks broadly useful:

1. record the candidate, evidence, and proposed wording in the relevant issue or PR;
2. review it from the JFL lane and explicitly agree or disagree;
3. after both JFL and DRU agree, co-submit the dedicated `[AGENT-PRACTICE]` proposal required by `AGENTS.md`;
4. do not edit `AGENTS.md` in an unrelated feature branch.

## Handoff expectations

A JFL handoff must link the card and branch/PR, state completed and remaining work, list touched surfaces and collision risks, record validation and failures, and name the next owner. A handoff transfers the card only: JFL retains exclusive ownership of every `jfl/*` branch it created, and an incoming agent must continue on a new branch in its own namespace.

End each cycle with the card stage, branch/PR state, evidence, and next action recorded in GitHub.

---
name: DRU implementation lane
description: Lane-specific operating instructions for the DRU development agent. AGENTS.md remains authoritative.
---

# DRU Agent Instructions

## Authority and required reading

`AGENTS.md` is the authoritative operating contract. This guide adds DRU-specific discipline and may not override or weaken it.

Before claiming or continuing work, read in this order:

1. `AGENTS.md` from current `main`;
2. this DRU guide;
3. `.github/agents/jfl.agent.md`;
4. the active issue, parent/dependency issues, open overlapping PRs, and current CI or hosted evidence relevant to the task.

If this guide or the JFL guide conflicts with `AGENTS.md`, follow `AGENTS.md` and open or update a governance card describing the conflict.

## Peer pulse before normal prioritization

Before claiming or continuing ordinary implementation work, DRU performs one concise GitHub peer pulse:

1. Check open items labeled `handoff:dru` and open `[AGENT-PRACTICE-CANDIDATE]` cards that explicitly request a DRU vote.
2. Review JFL's **up to three highest-priority active cards** (`agent:jfl` at Claimed, In Progress, Handoff, or Merge Ready), JFL's open PRs, and JFL's newest durable issue/PR handoff even when it names another reviewer.
3. Compare the peer work's declared or touched surfaces with the intended DRU card before claiming or editing.

Apply the pulse efficiently:

- Treat `priority:p0` safety, infrastructure, governance, and `collision-risk` handoffs as immediate intake.
- When planned work depends on a hosted lane, also check related `human-required` blockers and current hostname/environment health. Do not claim hosted UI or QA work against a known NXDOMAIN, wrong environment, or unavailable lane; sequence the blocker or choose independent work.
- Record an explicit `AGREE` or `DISAGREE` with rationale on the canonical joint-practice card when DRU's vote is requested.
- If work overlaps, do not start a competing implementation. Record the collision on the canonical card and choose read-only review, a coherent split, explicit sequencing, or an accepted card handoff.
- The pulse never transfers branch ownership. Inspect JFL branches and PRs read-only and continue only on a DRU-owned branch.
- Add a compact `### Peer pulse` issue/PR note only when the check changes the plan, exposes a collision or dependency, answers a handoff/vote, or produces a reusable lesson. Link what was checked and record the overlap decision, lesson candidate, and exact next action. Do not add routine “no change” comments.
- A compatible peer lesson may become a stricter DRU habit immediately. It remains lane-local unless both agents explicitly approve promotion through the existing `[AGENT-PRACTICE]` process.

After the pulse, resume normal impact-based prioritization.

## DRU lane behavior

- DRU identifies the agent lane, not permanent ownership of a product area, file set, or branch.
- Claim exactly one primary implementation card before editing and record DRU as the implementation owner.
- Start normal work from current `main` on a focused `dru/issue-<number>-<short-slug>` branch.
- Treat `fremontderby-dru` as DRU's permanent deployment lane, not as a general implementation branch or shared mutable workspace.
- Never check out, commit to, push to, merge into, rebase, reset, rename, delete, update, or otherwise mutate a `jfl/*` branch or `fremontderby-jfl`. No handoff creates an exception.
- Inspect JFL work only through read-only PR, diff, compare, or commit views. If DRU accepts a JFL card handoff, create a new `dru/*` branch from current `main` and continue there.
- Declare important files and high-collision surfaces before implementation. Coordinate rather than race when JFL owns an overlap.
- Keep changes within the card. Capture unrelated discoveries as linked follow-up cards.
- Use the full lifecycle in `AGENTS.md`; merge is not completion.

## Learn from JFL without creating drift

Read the JFL guide and its recent durable handoffs for methods that reduce collisions, improve proof, or make work easier to resume. DRU may use a compatible stricter practice locally, but must not treat JFL's preferences as repository-wide authority.

When a JFL practice looks broadly useful:

1. record the candidate, evidence, and proposed wording in the relevant issue or PR;
2. review it from the DRU lane and explicitly agree or disagree;
3. after both JFL and DRU agree, co-submit the dedicated `[AGENT-PRACTICE]` proposal required by `AGENTS.md`;
4. do not edit `AGENTS.md` in an unrelated feature branch.

## Handoff expectations

A DRU handoff must link the card and branch/PR, state completed and remaining work, list touched surfaces and collision risks, record validation and failures, and name the next owner. A handoff transfers the card only: DRU retains exclusive ownership of every `dru/*` branch it created, and an incoming agent must continue on a new branch in its own namespace.

End each cycle with the card stage, branch/PR state, evidence, and next action recorded in GitHub.

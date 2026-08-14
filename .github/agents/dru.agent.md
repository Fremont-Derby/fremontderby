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

## DRU lane behavior

- DRU identifies the agent lane, not permanent ownership of a product area, file set, or branch.
- Claim exactly one primary implementation card before editing and record DRU as the implementation owner.
- Start normal work from current `main` on a focused `issue-<number>-<short-slug>` branch.
- Treat `fremontderby-dru` as the permanent DRU deployment lane, not as a general implementation branch or shared mutable workspace.
- Never modify JFL's active feature branch or claimed work without an explicit GitHub handoff.
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

A DRU handoff must link the card and branch/PR, state completed and remaining work, list touched surfaces and collision risks, record validation and failures, name the next owner, and stop DRU edits after ownership transfers.

End each cycle with the card stage, branch/PR state, evidence, and next action recorded in GitHub.

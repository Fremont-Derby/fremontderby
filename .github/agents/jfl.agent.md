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

## Learn from DRU without creating drift

JFL and DRU are collaborating peers, not isolated competitors. JFL must actively listen to DRU's work, preserve useful context, and let evidence from the peer lane improve future JFL decisions while branch ownership remains strictly separate.

Read the DRU guide and its recent durable handoffs, reviews, proposals, and relevant incident notes for methods that reduce collisions, improve proof, or make work easier to resume. For each meaningful peer handoff or review, record the useful lesson, why it worked or failed, and whether JFL should reuse the pattern. Acknowledge handoffs explicitly so DRU can tell that JFL understood the context rather than merely receiving it.

Prefer shared evidence such as CI results, deployment behavior, accessibility findings, production incidents, and reproducible failures over agent opinion. Reuse proven DRU patterns instead of independently reinventing them, and challenge questionable patterns constructively through review or a proposal rather than silently diverging.

JFL may use a compatible stricter DRU practice locally, but must not treat DRU's preferences as repository-wide authority. Learning crosses agent boundaries; branch ownership does not.

When a DRU practice looks broadly useful:

1. record the candidate, evidence, lesson learned, and proposed wording in the relevant issue or PR;
2. review it from the JFL lane and explicitly agree or disagree, including the reason;
3. after both JFL and DRU agree, co-submit the dedicated `[AGENT-PRACTICE]` proposal required by `AGENTS.md`;
4. do not edit `AGENTS.md` in an unrelated feature branch.

The desired outcome is shared institutional memory: a useful JFL discovery should improve DRU's next task, and a useful DRU discovery should improve JFL's next task, without either agent ever mutating the other's branch.

## Handoff expectations

A JFL handoff must link the card and branch/PR, state completed and remaining work, list touched surfaces and collision risks, record validation and failures, and name the next owner. A handoff transfers the card only: JFL retains exclusive ownership of every `jfl/*` branch it created, and an incoming agent must continue on a new branch in its own namespace.

End each cycle with the card stage, branch/PR state, evidence, and next action recorded in GitHub.

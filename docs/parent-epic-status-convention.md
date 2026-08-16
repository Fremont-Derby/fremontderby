# Parent epic status convention (#395)

## Problem this solves

Checklist-style parent epics can lag closed/reopened child issues. That makes program status look worse (or better) than reality and misleads autonomous agents selecting work.

## Authoritative surfaces

| Question | Authoritative artifact |
|----------|------------------------|
| Is Season 1 **pilot-ready**? | **#247** — Season 1 Pilot Ready scorecard only |
| Did foundation epic N ship its original stories? | Parent epic body checkboxes on **#1–#4**, reconciled to child issue state |
| Detailed product/UX backlog | Current open issues + catalog docs — **not** old epic checklists |

Foundation epics **#1–#4** are **historical roll-ups**. Each carries a Product Librarian status banner pointing at #247. Their story checkboxes must match child `open`/`closed` state; they are not a second pilot gate.

## Checkbox rules

1. A parent line `- [ ] #N …` or `- [x] #N …` is **checked** only when issue `#N` is **closed**.
2. If `#N` is **open** (including reopened), the parent line must be **unchecked**.
3. Do not invent extra acceptance criteria on the parent; link children only.
4. When a child is reopened, update the parent in the same change set or file a Librarian follow-up the same day.

## Repeatable process (Product Librarian)

On any merge that closes or reopens a story linked from #1–#4:

1. Run `npm run check:epic-status` (requires `GITHUB_TOKEN` or `GH_TOKEN` with `repo` read).
2. If the script reports drift, patch the parent issue body before treating the epic as trustworthy.
3. Prefer a short status banner over rewriting the whole epic.

Optional cadence: run the drift check in CI when a token is present; otherwise run locally before roadmap reviews.

## Drift automation

`scripts/check-parent-epic-drift.mjs` loads issues **#1–#4**, parses story checklist lines that reference `#N`, fetches each child, and exits non-zero on mismatch.

It does **not** rewrite issues. Humans/agents apply the patch after reviewing the report.

## Out of scope

- Duplicating #247 exit conditions onto #1–#4
- Turning every epic into a live roadmap
- Auto-closing parents when children close

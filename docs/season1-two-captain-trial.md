# Controlled two-captain Season 1 trial (#219)

Primary **human** release gate for Season 1. Automated canaries and War Games do not replace this trial.

## Entry gates (refresh 2026-08-17)

| Gate | Status |
|------|--------|
| Lane isolation (prod / gamma / jfl / dru health identities) | Automated canary green |
| Public surface canary (HTML shell + production `versionTag`) | Automated canary green |
| Production `/health` has non-null `versionTag` | Automated |
| Two human captain Google accounts | **Human** |
| League operator available for admin steps | **Human** |
| Rosters: two teams, sub, optional dual-roster player | **Human / data** |

Record the production `/health` `version` + `versionTag` at trial start so findings map to a deploy.

## Participants

- 1 league operator (admin)
- 2 captains (separate teams, **separate phones**)
- Players enough for both lineups, including **one substitute** and **one dual-team** player when available

## Preferred hosts

- **Trial against production** only when the operator accepts real data risk; otherwise use a no-auth or staging lane the operator designates.
- Operator notes the host under test in the closing comment on #219.

## Script

1. **Season / teams** — Operator confirms active season; both teams visible under Teams / admin season teams.
2. **Roster** — Players join or request teams; each captain opens team management and recognizes their roster.
3. **Availability** — Mark availability for the match night; locate a substitute **without** dropping/adding permanent roster members.
4. **Dual-team choice** — Dual-roster player chooses which side to represent for the matchup.
5. **Blind lineups** — Both captains submit lineups; confirm the same player cannot appear twice.
6. **Messaging** — Send a coordination message; other side sees unread count / preview without a full page refresh if possible.
7. **Scoring** — Score from both team perspectives; intentionally create one disagreement; correct; both sides confirm; finalize.
8. **Standings** — Review team and individual standings after finalize.
9. **Postseason (test path)** — Four-player lineup + 2–2 anchor tiebreaker only in an isolated test flow the operator names (do not invent prod playoffs).
10. **Error UX** — Repeat one failed action near the bottom of a long page; error should appear without hunting; valid fields preserved.

## What to capture

- Any “what do I do next?” moment
- Actions that take more than two attempts
- Error text that does not explain recovery
- Mobile tap/readability issues
- Anything that required admin DB or developer intervention

## Exit criteria

- [ ] Both captains finish the regular-season flow without developer help
- [ ] Operator can resolve ordinary exceptions from product screens
- [ ] Findings filed as linked GitHub issues
- [ ] Release recommendation on #219: **ready** / **ready with named fixes** / **blocked**
- [ ] `/health` version ids recorded for the trial window

## Automation boundary

Grok/agents can keep canaries green and prepare this runbook. **They cannot complete #219** without two real captain sessions and an operator.

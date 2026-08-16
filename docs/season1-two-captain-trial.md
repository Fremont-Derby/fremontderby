# Controlled two-captain Season 1 trial (#219)

## Entry gates (refresh 2026-08-16)
- [x] Scoring rack-ledger shipped (#321)
- [x] Admin players/roles/eligibility shipped (#316)
- [x] Production health OK
- [ ] Two human captain accounts ready
- [ ] League operator present for admin steps

## Participants
- 1 league operator (admin)
- 2 captains (separate teams, separate devices)
- Lineup-capable roster including one sub and optional dual-roster player

## Script (summary)
1. Operator confirms season active + both teams rostered with phone-ready captains.
2. Each captain signs in on phone → Score hub → submit lineup for same match night.
3. Score one player race to completion (opening discipline, racks, confirm).
4. Other captain scores opposing side; resolve any mismatch with surgical edit.
5. Finalize reconciled race; confirm standings movement.
6. Operator reviews admin audit for privileged actions.
7. Capture screenshots + any defect issues; do not wipe prod data.

## Residual
Full script remains operator-run. Automation cannot substitute second human Google account.

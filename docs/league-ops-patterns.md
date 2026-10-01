# League operations dynamics (Fremont Derby)

This is not about display names. It is the operating system of a cash-pool / handicap league: time pressure, fairness, money, authority, and night-of chaos.

## Season arc
| Phase | Product responsibility |
|-------|------------------------|
| Registration | Capacity, price, deadline, who is in / paid / waitlisted |
| Preseason | Rosters, captains, phone/contact rules, eligibility |
| Regular season | Weekly availability → lineup → play → score → standings |
| Mid-season | Trades, subs, dual-roster rules, makeup matches |
| Playoffs | Qualification cutoffs, brackets, different lineup rules |
| Close | Finals, prizes, ratings snapshot, archive |

## Weekly loop (captain + player)
1. **Check-in** — will I be there (availability)
2. **Lineup** — lock before deadline; subs and forfeits explicit
3. **Play** — table, opponent, race/handicap state
4. **Score** — both sides, mismatch path, finalize
5. **Follow-up** — standings, chat, disputes to admin only when needed

## Authority
| Role | Owns |
|------|------|
| Player | Availability, claim, scores they enter, messages |
| Captain | Roster invites, lineup lock, ready checks, matchup chat |
| Admin | Exceptions, eligibility, payments, disputes, season structure |

UI must never imply that hiding an admin link is security; server rules decide.

## Fairness mechanisms already in the product direction
- Blind lineups / order hide until both sides lock
- Dual scoring and correction flows
- Payment and eligibility gates on competition
- Match limits across teams in a season
- Explicit forfeits rather than empty slots

## Gaps to keep pressure on
- Makeup / reschedule visibility on the public schedule
- Clear “lineup due by …” on captain hub and schedule
- Returning-player / returning-team continuity across seasons
- Dispute timeline for admins
- Fargo/handicap freshness policy
- Playoff qualification surfaces (not only rules text)

## Implementation notes
When shipping weekly-loop UX, prefer **deadlines, status, and next action** over more settings.

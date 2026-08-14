# League-ops patterns applied to Fremont Derby

Amateur league software (pool, darts, bowling, softball) converges on the same rules. This project follows them:

| Pattern | Application here |
|---------|------------------|
| Identity is not the name | `playerId` is authoritative; display names may collide |
| Pickers need a second line | Invite, claim, admin captain, DM candidates show login/team/season/payment/id tail |
| Confirm when still ambiguous | Captain invite and self-claim confirm when names collide |
| Night-of UI shows readiness | Lineup cards: availability, Fargo, matches played, payment, eligibility |
| Admin merges are rare | Create-with-same-name requires explicit confirm (`allowExactDuplicate`) |
| Privacy over convenience | Phone masked until reveal; not used in captain search |
| Prefer in-app team ops | Teams hub, ready checks, messages over pure SMS |

When adding a new player picker, use `playerPickerLabel` (or the same fields) and never offer name-only choices.

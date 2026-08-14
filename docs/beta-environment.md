# Beta lanes (open auth)

Canonical plan: [`docs/ENVIRONMENTS.md`](./ENVIRONMENTS.md) and epic #573.

## Live hostnames
| Lane | `ENVIRONMENT` | Public host |
|------|---------------|-------------|
| JFL beta | `beta-jfl` | `https://jfl.fremontderby.com` |
| DRU beta | `beta-dru` | `https://dru.fremontderby.com` |
| Gamma | `gamma` | `https://gamma.fremontderby.com` (no auth bypass) |

## Open auth
Allowed only when `ENVIRONMENT` is `beta-jfl` or `beta-dru` (legacy `beta` still recognized in code) **and** `BETA_AUTH_BYPASS=1`.

Requires non-production Supabase project ref, `BETA_ACTOR_USER_ID`, and service-role secret on that Worker only.

## Deploy
```bash
npx wrangler deploy --env beta-jfl
npx wrangler deploy --env beta-dru
npx wrangler deploy --env gamma
```

## Cloudflare
Custom domains should match the table above. Do not point these hosts at the production Worker with `ENVIRONMENT=production`.

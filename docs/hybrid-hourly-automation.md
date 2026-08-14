# Hybrid hourly automation

Three layers keep Fremont Derby from depending on a single scheduler.

## 1. Grok Automation (judgment / coding)

- Name: `fremontderby-hourly-work-loop`
- Cadence: hourly (America/Los_Angeles)
- Role: run tests, ship small PRs, comment on blockers
- Soft dependency: Grok automation platform availability

## 2. Cloudflare Cron (deterministic probes — primary)

- Worker trigger: `0 * * * *` (see `wrangler.jsonc` → `triggers.crons`)
- Code: `src/hourlyProbe.js` + `scheduled` handler in `src/routerEntry.js`
- Probes production routes; optionally comments on a tracking issue when failures occur
- Optional secrets / vars:
  - `HOURLY_PROBE_HOSTS` — comma-separated origins (default `https://fremontderby.com`)
  - `HOURLY_PROBE_GITHUB_TOKEN` — fine-grained PAT with issues:write (optional)
  - `HOURLY_PROBE_ISSUE` — issue number for failure comments (default `806`)
  - `HOURLY_PROBE_KEY` — **required in production** for `GET /internal/hourly-probe` (`x-probe-key` or `?key=`)

Manual check (after deploy):

```bash
curl -sS -H "x-probe-key: $HOURLY_PROBE_KEY" \
  "https://fremontderby.com/internal/hourly-probe?notify=0"
```

## 3. GitHub Actions backup

- Workflow: `.github/workflows/hourly-live-probe.yml`
- Runs at minute 5 each hour **when a runner is available**
- Does not replace CF cron; exists so CI history shows probe outcomes when minutes/runners work

## Operator checklist after merge

1. Deploy Worker so cron triggers are live on production.
2. (Optional) Set `HOURLY_PROBE_GITHUB_TOKEN` + confirm issue `806` exists.
3. Keep Grok hourly automation enabled.
4. Restore runners (#723 / #755) so Actions backup and PR CI are not theater.

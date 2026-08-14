# Project cohesion notes

Multiple agents and systems contributed UI, themes, and status language over time. This document records **known inconsistencies** and the **normalization** applied so the product reads as one system.

## Design systems that co-existed

| Layer | Role |
|-------|------|
| `src/designSystem.js` | Global tokens, controls, polish, status tone map |
| `src/playerSurfaceTheme.js` | Player routes → light surface + token remap |
| `src/adminSurfaceTheme.js` | Admin routes → light surface + token remap |
| `src/standingsTheme.js`, `teamsTheme.js`, `messagesTheme.js`, … | Route-specific leftovers |
| Page-local `<style>` in `*Page.js` | Oldest layer; often dark `--panel/--line/--green` |

**Normalization:** page-local CSS variables (`--panel`, `--line`, `--muted`, `--green`, `--gold`, `--red`, `--bg`, `--text`) are rebound to `--fd-*` tokens on player and admin surfaces so dark agent skins cannot win.

## Status tone vocabulary

Agents used different `data-tone` / `data-state` strings:

| Historical | Canonical chrome |
|------------|------------------|
| `ok`, `ready`, `healthy`, `success` | Success / positive status |
| `error`, `critical`, `danger` | Error / critical status |
| `warning`, `warn` | Warning |
| `muted`, `info` | Neutral info |
| `live`, `tonight`, `done` | Match schedule pills (kept; semantic) |

Design-system rules map the aliases so pages do not need a mass `setStatus` rewrite.

## Loading / status chrome

| Pattern | Guidance |
|---------|----------|
| Empty `.status` | Hidden (no blank capsule) |
| Default HTML status | Prefer empty; set real copy after load |
| Avoid | “Checking admin access…” style system messages |

## Control vs status shape

See `docs/ux-controls-and-status.md`.

- Controls → `--fd-radius-control` (rectangular)
- Short status tokens → `--fd-radius-pill`
- Contrast pairs → measured table in that doc

## Error messaging

| Location | Notes |
|----------|--------|
| `friendlyErrorMessage` in `appShell.js` | Global error popup |
| Local copy in `profilePage.js` | Page-local; keep behavior aligned with shell |

Infrastructure errors map to a stable human sentence; product validation errors pass through.

## Type / weight

Page CSS often used `font-weight: 900/950`. Global polish prefers **700** for controls and pills so the UI does not look like mixed posters.

## What we did not force-merge

- Product **copy** written by the project author
- Separate admin vs player **information architecture**
- Full deletion of every page-local `<style>` (high risk); token remap is the cohesion strategy instead

## Follow-ups for later agents

1. Prefer `--fd-*` tokens in any new page CSS; do not invent new `--panel` dark themes.
2. Prefer `data-tone="ok"|"error"|"warning"` for new status calls.
3. New surfaces should opt into `data-fd-player-surface` or `data-fd-admin-surface`.
4. Avoid adding a third global theme file without extending `designSystem.js`.

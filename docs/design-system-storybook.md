# Design system catalog (Storybook-lite)

Full Storybook (npm Component Explorer) is optional later. This repo ships an **in-app catalog**:

**URL:** `/design-system` (`src/designSystemCatalogPage.js`)

## Why not npm Storybook yet
- Worker-first delivery; no separate static Storybook host required
- Agents can open one route on any deployed lane
- Tokens and chrome stay imported from `designSystem.js` (single source)

## Token remap mechanics
`src/tokenRemap.js` exports `tokenRemapStyles`, interpolated into:

- `playerSurfaceTheme.js`
- `adminSurfaceTheme.js`

Legacy variables (`--panel`, `--line`, `--muted`, `--green`, `--gold`, `--red`, `--bg`, `--text`) resolve to `--fd-*` so page-local agent CSS cannot restore dark skins.

## Status tones
Canonical: `ok` | `error` | `warning` | `muted`  
Aliases still mapped in CSS: `healthy`→ok, `critical`→error, etc. Prefer canonical at call sites.

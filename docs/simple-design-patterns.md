# Simple design patterns (lightweight)

| Pattern | Module | Purpose |
|---------|--------|---------|
| **Facade** | `src/httpJson.js` | `jsonNoStore` / `jsonPublic` — one place for JSON + cache headers |
| **Strategy** | `src/statusTone.js` | Map historical tones (`healthy`, `critical`, …) to canonical ones |
| **Factory + Null Object** | `src/statusController.js` | `createStatusController(el)` — safe `set`/`clear` even if node missing |

Keep new page status writers on the strategy map; prefer `jsonNoStore` in new HTTP handlers.

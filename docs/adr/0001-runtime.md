# ADR 0001 — Web/runtime

**Status:** Accepted for Season 1

Use a single Cloudflare Worker deployment at `fremontderby.com`. The Worker serves the web application and trusted server commands. Avoid a separate API service until there is a demonstrated need.

The initial deployment smoke test is intentionally plain JavaScript. Feature UI may move to React/Vite, but league rules remain isolated from the framework.

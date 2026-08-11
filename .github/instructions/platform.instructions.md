---
applyTo: "wrangler.jsonc,.github/workflows/**/*.yml,src/environmentReadiness.js"
---

Treat deployment configuration as production infrastructure.

- Keep production and staging bindings isolated and verify the actual Worker/environment serving a hostname.
- Put secrets in platform secret stores, never public vars or source.
- A successful merge/build is not proof of deployment; distinguish source, CI, staging, and production evidence.
- Prefer observable health checks, canaries, and reversible changes.
- Do not hard-code transient deployment IDs or secret values into documentation/tests.
- When external platform setup cannot be automated, document the smallest exact human action and continue other unblocked validation.

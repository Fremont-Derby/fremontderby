---
applyTo: "test/**/*.test.js"
---

Tests are executable project memory.

- Reproduce the real failure mode or acceptance criterion, not only implementation details.
- Prefer focused regression coverage plus the smallest relevant end-to-end contract.
- Include authorization/forbidden-path coverage when access control changes.
- Keep fixtures deterministic and isolated from production data.
- Do not weaken assertions just to make CI green; reconcile the intended current behavior first.
- When a business rule changes, update the rule-facing tests and release-gate expectations together.
- Run the repository's current lint/check/test/build commands before merge.
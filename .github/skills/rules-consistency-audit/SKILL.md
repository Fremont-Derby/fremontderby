---
name: rules-consistency-audit
description: Check that an established Fremont Derby competition rule is represented consistently across issues, public rules, UI, tests, domain logic, and database enforcement.
---

Use when a rule changes, a contradiction is reported, or implementation behavior is disputed.

1. Find the most current explicit product-owner decision/current issue.
2. Compare that rule against `README.md`, `src/publicPages.js`, relevant page copy, domain/command logic, tests, and database constraints/functions.
3. Separate true contradictions from intentionally different regular-season/postseason behavior.
4. Do not invent missing policy. Create a decision issue when evidence is genuinely ambiguous.
5. For an established rule, propose the smallest coherent set of changes needed to remove contradictions.
6. Add/update tests so the rule cannot silently drift again.
7. Update durable docs only for stable rules; keep temporary exceptions in issues.

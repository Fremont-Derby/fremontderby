# ADR 0003 — Authorization

**Status:** Accepted for Season 1

Use Postgres Row Level Security as the primary data authorization boundary. UI visibility is not security.

Players may update only their allowed profile/availability fields. Captains may operate only on teams they captain and within roster rules. League-admin actions and multi-row privileged transitions execute through trusted Worker commands. Service-role credentials never ship to the browser.

# Product catalog delta — Season teams

- Route: `/admin/season-teams`
- Audience: league admin
- Purpose: search and classify Returning / New / In season teams, see configured season capacity, and add a selected team to a season without direct database work.
- Primary entry: `/season-setup` → **Manage season teams**.
- APIs: `GET /api/admin/seasons/:seasonId/team-candidates`, `POST /api/admin/seasons/:seasonId/teams/:teamId/add`.
- Authority: Worker-authenticated league admin; service-role-only database RPCs.
- Tracking: #336 under #315.

This delta should be folded into `docs/product-surface-catalog.md` by the Product Librarian during its next reconciliation pass.

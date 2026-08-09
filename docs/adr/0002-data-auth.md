# ADR 0002 — Data and identity

**Status:** Accepted for Season 1

Use Supabase Postgres for persistent league data and Supabase Auth for identity. Use relational history tables rather than overwriting roster/team state.

Database changes are migrations. Historical seasons must retain the rule and rating snapshots necessary to reproduce results.

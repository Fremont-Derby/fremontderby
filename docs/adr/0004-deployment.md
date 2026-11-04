# ADR 0004 — Deployment and environments

**Status:** Accepted for Season 1

Production deploys through the existing GitHub-linked Cloudflare Worker and serves `fremontderby.com`.

Maintain separate local, staging, and production data/secrets. Staging must use a different Supabase project and Worker hostname/preview deployment. Production deployments are traceable to source commits and must preserve the last known-good deployment on build failure.

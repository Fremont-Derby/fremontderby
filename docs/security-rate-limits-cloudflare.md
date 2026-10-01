# Cloudflare rate-limit runbook (operator)

Free/Pro dashboard path (names vary slightly by plan):

1. Open the **fremontderby.com** zone → **Security** → **WAF** / **Rate limiting rules**.
2. Create rules:

### Admin API
- **If** URI Path starts with `/api/admin`
- **Then** rate limit **30 requests per 1 minute** per IP → Block / Manage challenge

### Contact / PII
- **If** URI Path contains `/api/me/contact`
- **Then** **20 requests per 1 minute** per IP

### General API
- **If** URI Path starts with `/api/`
- **Then** **120 requests per 1 minute** per IP (tune after observing traffic)

3. Deploy rules to **Production**.
4. Comment on the security baseline issue with rule IDs once created.

Agents cannot set these without Cloudflare account access; this is an operator step.

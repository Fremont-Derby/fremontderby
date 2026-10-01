# Auth redirect allow list

Google sign-in uses Supabase Auth. The app builds `redirect_to` from `window.location.origin` (see `profilePage.js`, `chatPage.js`).

## Required Supabase settings

**Authentication → URL Configuration**

- **Site URL:** `https://fremontderby.com` (production default)
- **Additional Redirect URLs** must include every host that runs the Worker:

```
https://fremontderby.com/**
https://www.fremontderby.com/**
https://jfl.fremontderby.com/**
https://dru.fremontderby.com/**
https://gamma.fremontderby.com/**
http://localhost:8787/**
http://127.0.0.1:8787/**
```

If a pre-prod host is missing, OAuth completes and then lands on production (or fails). That is Auth config, not app hardcoding.

## Verify

1. Open `https://dru.fremontderby.com/profile` (or jfl/gamma).
2. Sign in with Google.
3. Confirm the browser returns to the **same host** `/profile`, not `fremontderby.com`.

## Related

Issue #848 — Pre-prod login redirects to prod.

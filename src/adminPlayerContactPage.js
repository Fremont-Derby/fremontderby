/**
 * #335 Authorized one-player-at-a-time admin phone lookup.
 * Broad directories stay readiness-only; full number requires explicit reveal.
 */
export function renderAdminPlayerContactPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Player contact · Admin · Fremont Derby</title>
  <style>
    :root { color-scheme: dark; --bg:#12151a; --panel:#191d22; --line:#343c45; --text:#e8eef4; --muted:#aab3bb; --gold:#c9a227; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); }
    main { max-width: 640px; margin: 0 auto; padding: 16px; display: grid; gap: 12px; }
    a { color: #9ee5bd; }
    .panel { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 12px; display: grid; gap: 10px; }
    label { display: grid; gap: 6px; font-size: .9rem; }
    input { min-height: 48px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--line); background: #0f1216; color: var(--text); }
    button { min-height: 48px; padding: 0 16px; border-radius: 10px; border: 1px solid var(--line); background: #24352c; color: var(--text); font-weight: 700; }
    button.ghost { background: transparent; }
    .muted { color: var(--muted); font-size: .85rem; line-height: 1.45; }
    .status[data-tone="error"] { color: #f0a8a0; }
    .status[data-tone="ok"] { color: #9ee5bd; }
    .phone { font-size: 1.15rem; font-weight: 800; letter-spacing: .02em; }
  </style>
</head>
<body>
  <main>
    <p class="muted"><a href="/admin">Admin</a> · <a href="/admin/players">Players</a> · Player contact</p>
    <h1>Player contact</h1>
    <p class="muted">Look up one player at a time. Directory lists never include phone numbers. Reveal only when you need to call a captain.</p>
    <section class="panel">
      <label>Player ID
        <input data-player-id placeholder="Paste player id from Admin → Players" autocomplete="off" />
      </label>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        <button type="button" data-lookup>Check contact readiness</button>
        <button type="button" class="ghost" data-reveal hidden>Show phone number</button>
      </div>
      <div class="status muted" data-status role="status" aria-live="polite">Enter a player id from the admin player directory.</div>
      <div class="phone" data-phone hidden></div>
    </section>
  </main>
  <script>
  (() => {
    const idEl = document.querySelector('[data-player-id]');
    const status = document.querySelector('[data-status]');
    const phoneEl = document.querySelector('[data-phone]');
    const revealBtn = document.querySelector('[data-reveal]');
    const lookupBtn = document.querySelector('[data-lookup]');
    function token() {
      return sessionStorage.getItem('fd.accessToken')
        || localStorage.getItem('fd.accessToken')
        || '';
    }
    function setStatus(text, tone) {
      status.textContent = text;
      status.dataset.tone = tone || '';
      if (window.fdSetStatus) window.fdSetStatus(status, text, tone || '');
    }
    async function api(path) {
      const accessToken = token();
      if (!accessToken) throw new Error('Sign in from Profile as a league admin.');
      const response = await fetch(path, {
        headers: { authorization: 'Bearer ' + accessToken, accept: 'application/json' },
      });
      const text = await response.text();
      let body = {};
      try { body = text ? JSON.parse(text) : {}; } catch { body = { error: text }; }
      if (!response.ok) throw new Error(body.error || 'Request failed');
      return body;
    }
    async function lookup(reveal) {
      const playerId = idEl.value.trim();
      if (!playerId) {
        setStatus('Enter a player id.', 'error');
        return;
      }
      phoneEl.hidden = true;
      revealBtn.hidden = true;
      setStatus(reveal ? 'Revealing contact…' : 'Checking readiness…');
      try {
        const path = '/api/admin/players/' + encodeURIComponent(playerId) + '/contact'
          + (reveal ? '?reveal=1' : '');
        const body = await api(path);
        const c = body.contact || {};
        const name = c.displayName || c.display_name || 'Player';
        if (c.hasPhone) {
          setStatus(name + ' — contact on file.', 'ok');
          revealBtn.hidden = false;
          if (reveal && c.phone) {
            phoneEl.hidden = false;
            phoneEl.textContent = c.phone;
            setStatus(name + ' — phone visible on this screen only.', 'ok');
          }
        } else {
          setStatus(name + ' — no phone on file. Ask them to save one under Profile → Private contact.', 'error');
        }
      } catch (error) {
        setStatus((window.fdFriendlyError ? window.fdFriendlyError(error) : error.message) || 'Lookup failed', 'error');
      }
    }
    lookupBtn.addEventListener('click', () => lookup(false));
    revealBtn.addEventListener('click', () => lookup(true));
  })();
  </script>
</body>
</html>`;
}

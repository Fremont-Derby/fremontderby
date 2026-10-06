export function provisionalSeedClient() {
  const select = document.querySelector('[data-seed-player]');
  const value = document.querySelector('[data-seed-value]');
  const reason = document.querySelector('[data-seed-reason]');
  const form = document.querySelector('[data-seed-form]');
  const save = document.querySelector('[data-seed-save]');
  const reload = document.querySelector('[data-seed-reload]');
  const current = document.querySelector('[data-seed-current]');
  const evidence = document.querySelector('[data-seed-evidence]');
  const status = document.querySelector('[data-seed-status]');
  const signin = document.querySelector('[data-seed-signin]');
  let pending = false; let loadedId = ''; let generation = 0; let playersLoaded = false;
  const token = () => sessionStorage.getItem('fd.accessToken') || '';
  function sync() {
    select.disabled = pending || !playersLoaded || !token();
    reload.disabled = pending || !token();
    value.disabled = reason.disabled = save.disabled = pending || !loadedId || loadedId !== select.value || !token();
    signin.hidden = !!token();
  }
  async function api(path, options = {}) {
    if (!token()) throw new Error('Open Profile and sign in again.');
    const response = await fetch(path, { ...options, headers: { authorization: 'Bearer ' + token(), 'content-type': 'application/json' } });
    if (response.status === 401) sessionStorage.removeItem('fd.accessToken');
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(response.status === 401 ? 'Open Profile and sign in again.'
      : response.status === 429 ? 'Too many requests. Wait, then use Reload. No save was replayed.'
        : typeof body?.error === 'string' && !/[<>]/.test(body.error) ? body.error.slice(0, 240) : 'Request could not be confirmed. Use Reload.');
    return body;
  }
  function validSeed(seed, id) {
    return seed && seed.playerId === id && ['missing', 'unverified_legacy', 'admin_provisional'].includes(seed.source)
      && (seed.source === 'missing' ? seed.ratingValue === null : Number.isInteger(seed.ratingValue) && seed.ratingValue >= 0 && seed.ratingValue <= 1000)
      && (seed.source === 'missing' || ['unverified', 'provisional', 'established'].includes(seed.ratingStatus))
      && (seed.source !== 'admin_provisional' || seed.ratingStatus === 'provisional' && typeof seed.reason === 'string' && !!seed.reason.trim()
        && typeof seed.eventId === 'string' && !!seed.eventId && Number.isFinite(Date.parse(seed.effectiveAt)));
  }
  async function load() {
    if (pending) return;
    const id = select.value; const epoch = ++generation; pending = true; loadedId = ''; current.textContent = 'Loading current seed…'; evidence.textContent = ''; sync();
    try {
      if (!playersLoaded) {
        const body = await api('/api/admin/players');
        if (!Array.isArray(body?.players) || body.players.some(p => !p || typeof p.playerId !== 'string' || !p.playerId || typeof p.displayName !== 'string')) throw new Error('Player list could not be confirmed. Use Reload.');
        select.replaceChildren(new Option('Choose a player', ''));
        for (const player of body.players) select.add(new Option(player.displayName, player.playerId));
        playersLoaded = true; current.textContent = 'Choose a player to inspect the current seed.'; status.textContent = 'Player list loaded.'; return;
      }
      if (!id) { current.textContent = 'Choose a player to inspect the current seed.'; return; }
      const body = await api('/api/admin/players/' + encodeURIComponent(id) + '/provisional-seed');
      if (epoch !== generation || id !== select.value) return;
      if (!validSeed(body?.seed, id)) throw new Error('Current seed could not be confirmed. Use Reload.');
      const seed = body.seed;
      current.textContent = seed.source === 'missing' ? 'No seed on file.' : 'Current: ' + seed.ratingValue + ' · '
        + (seed.source === 'admin_provisional' ? 'Admin provisional · ' + seed.effectiveAt : 'Legacy value; explicit source has not been confirmed.');
      evidence.textContent = seed.source === 'admin_provisional' ? 'Recorded reason: ' + seed.reason : '';
      loadedId = id; status.textContent = seed.ratingStatus === 'established' ? 'Established seed is protected. Provisional replacement is unavailable.' : 'Enter a provisional value and the evidence or reason for it.';
      if (seed.ratingStatus === 'established') loadedId = '';
    } catch (error) { current.textContent = 'Current seed unavailable.'; status.textContent = error.message; }
    finally { if (epoch === generation) { pending = false; sync(); } }
  }
  select.addEventListener('change', () => { value.value = ''; reason.value = ''; load(); });
  reload.addEventListener('click', load);
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (pending || !loadedId || loadedId !== select.value || !token()) return;
    const raw = value.value.trim(); const rating = Number(raw); const note = reason.value.trim();
    if (!/^\d+$/.test(raw) || !Number.isInteger(rating) || rating < 0 || rating > 1000 || !note || note.length > 500) { status.textContent = 'Enter a whole-number rating 0–1000 and a reason from 1 to 500 characters.'; return; }
    const id = loadedId; pending = true; loadedId = ''; evidence.textContent = ''; sync(); status.textContent = 'Saving provisional seed…';
    try {
      const body = await api('/api/admin/players/' + encodeURIComponent(id) + '/provisional-seed', { method: 'POST', body: JSON.stringify({ ratingValue: rating, reason: note }) });
      const seed = body?.seed;
      if (!validSeed(seed, id) || seed.source !== 'admin_provisional' || seed.ratingValue !== rating || seed.reason !== note || typeof seed.eventId !== 'string' || !seed.eventId || !Number.isFinite(Date.parse(seed.effectiveAt))) throw new Error('Save could not be confirmed. Use Reload before another save.');
      current.textContent = 'Current: ' + seed.ratingValue + ' · Admin provisional · ' + seed.effectiveAt;
      evidence.textContent = 'Recorded reason: ' + seed.reason;
      status.textContent = 'Provisional seed saved with its reason and audit record. Historical races are unchanged.';
      reason.value = ''; loadedId = id;
    } catch (error) { current.textContent = 'Save result unconfirmed. Reload to inspect current values.'; status.textContent = error.message; }
    finally { pending = false; sync(); }
  });
  sync(); if (token()) load(); else status.textContent = 'Open Profile and sign in again.';
}

export function renderJflProvisionalSeedPage() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Provisional rating seeds · Fremont Derby</title>
  <style>*{box-sizing:border-box}body{margin:0;background:#0d1110;color:#f3f6f4;font-family:system-ui,sans-serif}main{max-width:720px;margin:auto;padding:20px}label{display:grid;gap:8px;margin:18px 0}input,select,textarea,button,a{font:inherit;min-height:44px}input,select,textarea{width:100%;padding:10px;background:#17201c;color:inherit;border:1px solid #567260;border-radius:8px}textarea{min-height:110px}button{padding:10px 16px}a{color:#9ee5bd;display:inline-flex;align-items:center}button:disabled{opacity:.55}p,[role=status]{overflow-wrap:anywhere}:focus-visible{outline:3px solid #9ee5bd;outline-offset:3px}.actions{display:flex;gap:12px;flex-wrap:wrap}</style></head><body><main>
  <a href="/admin/players">Back to Players</a><h1>Provisional rating seeds</h1><p>League admins can record an explicit provisional value with evidence or a reason. Existing historical races keep their locked ratings and targets. Established seeds are protected.</p>
  <label>Player<select data-seed-player disabled><option value="">Choose a player</option></select></label><p data-seed-current>Choose a player to inspect the current seed.</p><p data-seed-evidence></p>
  <form data-seed-form><label>Provisional rating<input data-seed-value type="number" min="0" max="1000" step="1" required disabled></label><label>Evidence or reason<textarea data-seed-reason maxlength="500" required disabled></textarea></label><div class="actions"><button data-seed-save disabled>Save provisional seed</button><button data-seed-reload type="button" disabled>Reload</button><a href="/profile" data-seed-signin hidden>Open Profile to sign in</a></div></form><p role="status" aria-live="polite" data-seed-status>Loading…</p>
  </main><script>(${provisionalSeedClient.toString()})();</script></body></html>`;
}

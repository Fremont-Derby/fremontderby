/** #361 Admin Support queue surface — replied/handled states. */
export function renderAdminSupportPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Admin Support · Fremont Derby</title>
  <style>
    :root { color-scheme: dark; --bg:#12151a; --panel:#191d22; --line:#343c45; --text:#e8eef4; --muted:#aab3bb; }
    body { margin:0; font-family:system-ui,sans-serif; background:var(--bg); color:var(--text); }
    main { max-width:720px; margin:0 auto; padding:16px; display:grid; gap:12px; }
    a { color:#9ee5bd; }
    .panel { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:12px; }
    .muted { color:var(--muted); font-size:.9rem; line-height:1.45; }
    button, select { min-height:44px; }
    .row { display:grid; gap:8px; padding:10px 0; border-bottom:1px solid var(--line); }
    .row:last-child { border-bottom:0; }
    .status { font-weight:800; font-size:.8rem; }
  </style>
</head>
<body>
  <main>
    <p class="muted"><a href="/admin">Admin</a> · Support</p>
    <h1>Admin Support</h1>
    <p class="muted">Shared queue for player help. Mark items <strong>Replied</strong> or <strong>Handled</strong>. Private phone numbers stay on Player contact.</p>
    <section class="panel">
      <label class="muted">Filter
        <select data-filter>
          <option value="open">Open</option>
          <option value="replied">Replied</option>
          <option value="handled">Handled</option>
          <option value="all">All</option>
        </select>
      </label>
      <div data-list class="muted">Loading support queue…</div>
      <div data-status class="muted" role="status" aria-live="polite"></div>
    </section>
  </main>
  <script>
  (() => {
    const list = document.querySelector('[data-list]');
    const status = document.querySelector('[data-status]');
    const filter = document.querySelector('[data-filter]');
    function token(){ return sessionStorage.getItem('fd.accessToken') || localStorage.getItem('fd.accessToken') || ''; }
    async function load(){
      status.textContent = '';
      if (!token()) {
        list.textContent = 'Sign in from Profile as a league admin.';
        return;
      }
      try {
        const response = await fetch('/api/admin/support?state=' + encodeURIComponent(filter.value), {
          headers: { authorization: 'Bearer ' + token(), accept: 'application/json' },
        });
        const body = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
          list.textContent = 'Admin access required.';
          return;
        }
        if (!response.ok) throw new Error(body.error || 'Could not load support queue');
        const items = body.items || [];
        if (!items.length) {
          list.textContent = 'No support items in this filter. Players can reach admins via Messages → League when the queue is connected.';
          return;
        }
        list.replaceChildren();
        for (const item of items) {
          const row = document.createElement('div');
          row.className = 'row';
          row.innerHTML = '<div><strong></strong></div><div class="muted"></div><div class="status"></div>';
          row.querySelector('strong').textContent = item.subject || item.playerName || 'Support request';
          row.querySelector('.muted').textContent = item.preview || item.createdAt || '';
          row.querySelector('.status').textContent = (item.state || 'open').toUpperCase();
          list.append(row);
        }
      } catch (error) {
        list.textContent = error.message || 'Load failed';
      }
    }
    filter.addEventListener('change', load);
    load();
  })();
  </script>
</body>
</html>`;
}

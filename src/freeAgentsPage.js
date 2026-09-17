export function renderFreeAgentsPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Free agents · Fremont Derby</title>
  <style>
    :root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#111316;color:#f5f1e9;--panel:#191d22;--line:#343c45;--muted:#aab3bb;--green:#2fa972}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;background:#111316}
    .app{width:min(880px,100%);margin:auto;padding:16px}
    .topbar{display:flex;justify-content:space-between;gap:12px;align-items:center;padding-bottom:14px;border-bottom:1px solid var(--line)}
    .brand{font-weight:950}
    .status{min-height:28px;color:var(--muted);text-align:right}
    .status[data-tone="error"]{color:#ffb1aa}.status[data-tone="ok"]{color:#9ee5bd}
    .note{color:var(--muted);line-height:1.5}
    label{display:grid;gap:6px;margin:16px 0;color:var(--muted);font-size:.78rem;font-weight:850}
    select{min-height:44px;border-radius:10px;border:1px solid var(--line);background:#0d1013;color:#f5f1e9;padding:0 12px}
    .list{display:grid;gap:8px}
    .row{padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--panel)}
    .meta{color:var(--muted);font-size:.82rem}
    .actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
    .actions a{min-height:44px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid var(--line);border-radius:10px;color:inherit;text-decoration:none;font-weight:800}
    .empty{color:var(--muted);padding:16px 0}
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand">Free agents</div>
      <div class="status" data-status>Loading seasons…</div>
    </header>
    <p class="note">Players looking for a roster before league night. Captains can open Teams to invite someone.</p>
    <label>Season
      <select data-season disabled><option>Loading seasons…</option></select>
    </label>
    <div class="list" data-list></div>
    <div class="empty" data-empty hidden>No free agents are listed for this season yet.</div>
    <div class="actions">
      <a href="/teams">Open Teams</a>
      <a href="/players">Player directory</a>
      <a href="/schedule">See tonight</a>
    </div>
  </main>
  <script>
    const statusEl=document.querySelector('[data-status]');
    const seasonEl=document.querySelector('[data-season]');
    const listEl=document.querySelector('[data-list]');
    const emptyEl=document.querySelector('[data-empty]');
    function setStatus(message,tone){statusEl.textContent=message;statusEl.dataset.tone=tone||'muted';}
    function nameOf(row){
      return String(row.display_name||row.displayName||row.player_name||row.name||'').trim()||'Unnamed player';
    }
    async function loadAgents(){
      const seasonId=seasonEl.value;
      if(!seasonId) return;
      setStatus('Loading free agents…');
      const response=await fetch('/api/seasons/'+encodeURIComponent(seasonId)+'/free-agents');
      const body=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(body.error||'Could not load free agents');
      const rows=Array.isArray(body.freeAgents)?body.freeAgents:[];
      listEl.replaceChildren();
      emptyEl.hidden=rows.length>0;
      for(const row of rows){
        const article=document.createElement('article');
        article.className='row';
        article.innerHTML='<strong></strong><div class="meta"></div>';
        article.querySelector('strong').textContent=nameOf(row);
        article.querySelector('.meta').textContent=String(row.note||row.status||'Looking for a team');
        listEl.append(article);
      }
      setStatus(rows.length?'Free agents loaded':'No free agents listed','ok');
    }
    async function loadSeasons(){
      const response=await fetch('/api/seasons');
      const body=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(body.error||'Could not load seasons');
      const seasons=Array.isArray(body.seasons)?body.seasons:[];
      seasonEl.replaceChildren();
      if(!seasons.length){
        seasonEl.append(new Option('No public seasons',''));
        setStatus('No public season yet');
        emptyEl.hidden=false;
        return;
      }
      for(const season of seasons){
        seasonEl.append(new Option(season.name+' \u2014 '+String(season.status||'season'), season.id));
      }
      const preferred=seasons.find((s)=>['registration','active','playoffs'].includes(s.status))||seasons[0];
      seasonEl.value=preferred.id;
      seasonEl.disabled=false;
      await loadAgents();
    }
    seasonEl.addEventListener('change',()=>loadAgents().catch((error)=>setStatus(error.message,'error')));
    loadSeasons().catch((error)=>setStatus(error.message,'error'));
  </script>
</body>
</html>`;
}

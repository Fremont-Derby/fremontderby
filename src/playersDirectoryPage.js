export function renderPlayersDirectoryPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Player directory · Fremont Derby</title>
  <style>
    :root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#111316;color:#f5f1e9;--panel:#191d22;--line:#343c45;--muted:#aab3bb;--green:#2fa972}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;background:#111316}
    .app{width:min(980px,100%);margin:auto;padding:16px}
    .topbar{display:flex;justify-content:space-between;gap:12px;align-items:center;padding-bottom:14px;border-bottom:1px solid var(--line)}
    .brand{display:flex;align-items:center;gap:10px;font-weight:950}
    .mark{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(#f4d64b 0 34%,#fff 34% 66%,#f4d64b 66%);color:#111;font-weight:950}
    .status{min-height:28px;color:var(--muted);text-align:right}
    .status[data-tone="error"]{color:#ffb1aa}.status[data-tone="ok"]{color:#9ee5bd}
    .note{color:var(--muted);line-height:1.5}
    .toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin:12px 0}
    .toolbar label{display:grid;gap:4px;font-size:.78rem;color:var(--muted);font-weight:850}
    .toolbar input,.toolbar select{min-height:44px;border-radius:10px;border:1px solid var(--line);background:#0d1013;color:#f5f1e9;padding:0 12px;min-width:160px}
    .list{display:grid;gap:8px}
    .row{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:10px;align-items:center;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--panel)}
    .meta{color:var(--muted);font-size:.82rem}
    .actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
    .actions a,button{min-height:44px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid var(--line);border-radius:10px;color:inherit;text-decoration:none;font:inherit;background:transparent;cursor:pointer;font-weight:800}
    button.primary{background:var(--green);border-color:var(--green);color:#06120d}
    .empty{color:var(--muted);padding:16px 0}
    @media(max-width:720px){.row{grid-template-columns:1fr}.status{text-align:left}}
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand"><span class="mark">9</span><span>Player directory</span></div>
      <div class="status" data-status aria-live="polite">Choose a season</div>
    </header>
    <p class="note">Public names and team context only. Contact numbers, payments, and internal IDs are never shown. Type at least two letters to search.</p>
    <div class="toolbar">
      <label>Season
        <select data-season aria-label="Season"></select>
      </label>
      <label>Search
        <input data-search type="search" placeholder="Type at least 2 letters" autocomplete="off" maxlength="80" />
      </label>
      <button type="button" class="primary" data-refresh>Refresh</button>
    </div>
    <div class="meta" data-meta></div>
    <section class="list" data-list></section>
    <div class="empty" data-empty hidden>No players match.</div>
    <div class="actions">
      <a href="/teams">Teams</a>
      <a href="/standings">Standings</a>
      <a href="/schedule">Schedule</a>
      <a href="/lineup">Lineup</a>
      <a href="/scorecard">Score</a>
    </div>
  </main>
  <script>
    const statusEl=document.querySelector('[data-status]');
    const seasonEl=document.querySelector('[data-season]');
    const searchEl=document.querySelector('[data-search]');
    const listEl=document.querySelector('[data-list]');
    const emptyEl=document.querySelector('[data-empty]');
    const metaEl=document.querySelector('[data-meta]');
    let seasons=[];
    let rows=[];
    function setStatus(m,t){statusEl.textContent=m;statusEl.dataset.tone=t||'muted'}
    function publicRow(raw){
      const name=String(raw.display_name||raw.displayName||raw.player_name||raw.name||'').trim();
      const team=String(raw.team_name||raw.teamName||raw.current_team||'').trim();
      if(!name) return null;
      return {name, team};
    }
    function filtered(){
      const q=String(searchEl.value||'').trim().toLowerCase();
      let list=rows.slice();
      if(q.length===1) list=[];
      else if(q.length>=2) list=list.filter((r)=>r.name.toLowerCase().includes(q)||r.team.toLowerCase().includes(q));
      list.sort((a,b)=>a.name.localeCompare(b.name,undefined,{sensitivity:'base'}));
      return list;
    }
    function render(){
      const q=String(searchEl.value||'').trim();
      const list=filtered();
      metaEl.textContent=rows.length?(list.length+' of '+rows.length+' players'):'';
      emptyEl.hidden=list.length>0;
      emptyEl.textContent=q.length===1?'Type at least 2 characters to search.':(q?'No players match.':'No public player names for this season yet.');
      listEl.replaceChildren();
      for(const r of list){
        const row=document.createElement('article');
        row.className='row';
        const left=document.createElement('div');
        const strong=document.createElement('strong');
        strong.textContent=r.name;
        const meta=document.createElement('div');
        meta.className='meta';
        meta.textContent=r.team||'Unassigned';
        left.append(strong,meta);
        row.append(left);
        listEl.append(row);
      }
      if(q.length!==1) setStatus(list.length?'Directory ready':'No matches', list.length?'ok':'muted');
    }
    async function fetchJson(url){
      const response=await fetch(url);
      const body=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(body.error||'Request failed');
      return body;
    }
    function collectPlayers(body){
      const buckets=[body.standings, body.players, body.directory, body.rows, body.members];
      const found=buckets.find((item)=>Array.isArray(item));
      return (found||[]).map(publicRow).filter(Boolean);
    }
    async function loadSeasons(){
      const body=await fetchJson('/api/seasons');
      seasons=body.seasons||[];
      seasonEl.replaceChildren();
      for(const s of seasons){
        const opt=document.createElement('option');
        opt.value=s.id;
        opt.textContent=(s.name||'Season')+' \u2014 '+(s.status||'');
        seasonEl.append(opt);
      }
      if(seasons[0]) seasonEl.value=seasons[0].id;
    }
    async function loadPlayers(){
      const seasonId=seasonEl.value;
      rows=[];
      if(!seasonId){render();setStatus('No published season yet.','muted');return}
      setStatus('Loading players\u2026');
      const paths=[
        '/api/seasons/'+encodeURIComponent(seasonId)+'/individual-standings',
        '/api/seasons/'+encodeURIComponent(seasonId)+'/standings?view=individuals',
      ];
      let lastError=null;
      for(const path of paths){
        try{
          rows=collectPlayers(await fetchJson(path));
          if(rows.length) break;
        }catch(error){lastError=error}
      }
      render();
      if(rows.length) setStatus(rows.length+' players loaded','ok');
      else setStatus(lastError?lastError.message:'No public player names yet','muted');
    }
    async function boot(){
      try{
        if(!seasons.length) await loadSeasons();
        await loadPlayers();
      }catch(error){
        setStatus(error.message||'Could not load directory','error');
      }
    }
    seasonEl.addEventListener('change',()=>boot());
    searchEl.addEventListener('input',()=>render());
    document.querySelector('[data-refresh]').addEventListener('click',()=>boot());
    boot();
  </script>
</body>
</html>`;
}

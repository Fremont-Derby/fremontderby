export function practiceMatchLabel(match = {}) {
  const home = String(
    match.teamAName || match.homeTeamName || match.homeTeam?.name || match.home?.name || '',
  ).trim();
  const away = String(
    match.teamBName || match.awayTeamName || match.awayTeam?.name || match.away?.name || '',
  ).trim();
  if (home && away) return `${home} vs ${away}`;
  return String(match.label || match.title || 'Matchup');
}

export function renderPracticePage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Practice · Fremont Derby</title>
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
    .meta{color:var(--muted);font-size:.82rem;margin-top:4px}
    .actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
    .actions a{min-height:44px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid var(--line);border-radius:10px;color:inherit;text-decoration:none;font-weight:800}
    .empty{color:var(--muted);padding:16px 0}
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand">Practice</div>
      <div class="status" data-status>Loading seasons…</div>
    </header>
    <p class="note">Published league nights are the default table window. Teams may practice or play a makeup before the posted date. Coordinate on Check-in and Messages.</p>
    <label>Season
      <select data-season disabled><option>Loading seasons…</option></select>
    </label>
    <div class="list" data-list></div>
    <div class="empty" data-empty hidden>No published rounds yet for this season.</div>
    <div class="actions">
      <a href="/availability">Open Check-in</a>
      <a href="/schedule">See schedule</a>
      <a href="/messages">Message captains</a>
    </div>
  </main>
  <script>
    const statusEl=document.querySelector('[data-status]');
    const seasonEl=document.querySelector('[data-season]');
    const listEl=document.querySelector('[data-list]');
    const emptyEl=document.querySelector('[data-empty]');
    function setStatus(message,tone){statusEl.textContent=message;statusEl.dataset.tone=tone||'muted';}
    function matchLabel(match){
      const home=String(match.teamAName||match.homeTeamName||match.homeTeam&&match.homeTeam.name||match.home&&match.home.name||'').trim();
      const away=String(match.teamBName||match.awayTeamName||match.awayTeam&&match.awayTeam.name||match.away&&match.away.name||'').trim();
      if(home&&away) return home+' vs '+away;
      return String(match.label||match.title||'Matchup');
    }
    function formatDate(value){
      const raw=String(value||'').trim();
      if(!raw) return 'Date TBD';
      const date=new Date(raw);
      if(Number.isNaN(date.valueOf())) return raw;
      return new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric'}).format(date);
    }
    async function loadWindows(){
      const seasonId=seasonEl.value;
      if(!seasonId) return;
      setStatus('Loading practice windows…');
      const response=await fetch('/api/seasons/'+encodeURIComponent(seasonId)+'/schedule');
      const body=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(body.error||'Could not load schedule');
      const rounds=Array.isArray(body.rounds)?body.rounds:[];
      listEl.replaceChildren();
      emptyEl.hidden=rounds.length>0;
      for(const round of rounds){
        const matches=Array.isArray(round.matches)?round.matches:[];
        const article=document.createElement('article');
        article.className='row';
        const heading=document.createElement('strong');
        heading.textContent='Round '+(round.roundNumber||'?')+' · '+formatDate(round.scheduledOn);
        const meta=document.createElement('div');
        meta.className='meta';
        const stage=String(round.stage||round.status||'scheduled');
        meta.textContent=matches.length
          ? stage+' · '+matches.slice(0,3).map(matchLabel).join(' · ')
          : stage+' · no matchups posted';
        article.append(heading, meta);
        listEl.append(article);
      }
      setStatus(rounds.length?'Practice windows loaded':'No published rounds','ok');
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
        seasonEl.append(new Option(season.name+' — '+String(season.status||'season'), season.id));
      }
      const preferred=seasons.find((s)=>['registration','active','playoffs'].includes(s.status))||seasons[0];
      seasonEl.value=preferred.id;
      seasonEl.disabled=false;
      await loadWindows();
    }
    seasonEl.addEventListener('change',()=>loadWindows().catch((error)=>setStatus(error.message,'error')));
    loadSeasons().catch((error)=>setStatus(error.message,'error'));
  </script>
</body>
</html>`;
}

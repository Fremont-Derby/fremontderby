import { livePageRefreshScript } from './livePageRefresh.js';

export function renderPlayoffsPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Fremont Derby Playoffs</title>
  <style>
    :root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#111316;color:#f5f1e9;--panel:#191d22;--line:#343c45;--muted:#aab3bb;--green:#2fa972;--gold:#d8ad3f}
    *{box-sizing:border-box}button,a,select{touch-action:manipulation}body{margin:0;min-height:100vh;background:#111316}
    button,select{font:inherit}.app{width:min(980px,100%);margin:auto;padding:16px}
    .topbar{display:flex;justify-content:space-between;gap:12px;align-items:center;padding-bottom:14px;border-bottom:1px solid var(--line)}
    .brand{display:flex;align-items:center;gap:10px;font-weight:950}
    .mark{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(#f4d64b 0 34%,#fff 34% 66%,#f4d64b 66%);color:#111;font-weight:950}
    .status{min-height:28px;color:var(--muted);text-align:right}
    .status[data-tone="error"]{color:#ffb1aa}.status[data-tone="ok"]{color:#9ee5bd}
    .controls{display:grid;grid-template-columns:1fr auto auto;gap:10px;padding:14px 0;align-items:end}
    label{display:grid;gap:6px;color:var(--muted);font-size:.78rem;font-weight:900}
    select,button{min-height:44px;border-radius:10px;border:1px solid var(--line);padding:0 12px}
    button.primary{background:var(--green);border-color:var(--green);color:#06120d;font-weight:950;cursor:pointer}
    button.ghost{background:transparent;color:#f5f1e9;cursor:pointer}
    .note{color:var(--muted);line-height:1.5;margin:0 0 14px}
    .round{border:1px solid var(--line);border-radius:13px;background:var(--panel);overflow:hidden;margin-bottom:12px}
    .round-head{padding:14px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
    .kicker{color:#9ee5bd;font-size:.72rem;font-weight:950;letter-spacing:.08em;text-transform:uppercase}
    .matches{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px}
    .match{padding:13px;border:1px solid var(--line);border-top:4px solid var(--gold);border-radius:11px;background:#14181d}
    .versus{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;margin:8px 0}
    .match-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}.versus span{color:var(--gold);font-size:.72rem;font-weight:950;text-align:center}
    .actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .actions a{min-height:44px;display:grid;place-items:center;border:1px solid var(--line);border-radius:9px;text-decoration:none;color:#f5f0e8;font-weight:900;font-size:.8rem}
    .actions a.primary{background:var(--green);border-color:var(--green);color:#06120d}
    .empty{padding:24px;color:var(--muted);text-align:center}
    .admin{margin:12px 0;padding:12px;border:1px dashed var(--line);border-radius:12px}
    @media(max-width:700px){.controls,.matches{grid-template-columns:1fr}.status{text-align:left}}
  @media(max-width:720px){.app,main{padding-bottom:calc(24px + env(safe-area-inset-bottom,0px))}}</style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand"><span class="mark">9</span><span>Playoffs</span></div>
      <div class="status" data-status>Loading…</div>
    </header>
    <p class="note">Postseason bracket from the published schedule. Semifinals and championship show here once playoffs start. Captains use a <strong>4-player lineup with an anchor</strong> for postseason matchups.</p>
    <div class="controls">
      <label>Season<select data-season disabled><option>Loading…</option></select></label>
      <button type="button" class="ghost" data-refresh>Refresh</button>
      <a class="ghost" href="/schedule" style="min-height:44px;display:grid;place-items:center;text-decoration:none;color:#f5f1e9;border:1px solid var(--line);border-radius:10px;padding:0 12px">Full schedule</a>
      <a class="ghost" href="/scorecard" style="min-height:44px;display:grid;place-items:center;text-decoration:none;color:#f5f1e9;border:1px solid var(--line);border-radius:10px;padding:0 12px">Score</a>
      <a class="ghost" href="/teams" style="min-height:44px;display:grid;place-items:center;text-decoration:none;color:#f5f1e9;border:1px solid var(--line);border-radius:10px;padding:0 12px">Teams</a>
      <a class="ghost" href="/players" style="min-height:44px;display:grid;place-items:center;text-decoration:none;color:#f5f1e9;border:1px solid var(--line);border-radius:10px;padding:0 12px">Players</a>
      <a class="ghost" href="/standings" style="min-height:44px;display:grid;place-items:center;text-decoration:none;color:#f5f1e9;border:1px solid var(--line);border-radius:10px;padding:0 12px">Standings</a>
    </div>
    <section class="admin" data-admin hidden>
      <strong>League admin</strong>
      <p class="note" style="margin:8px 0">Start playoffs after the regular season is ready, or advance winners to the championship.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="primary" data-start>Start playoffs</button>
        <button type="button" class="ghost" data-advance>Advance to championship</button>
      </div>
    </section>
    <div data-bracket></div>
  </main>
  ${livePageRefreshScript}
  <script>
    const statusEl=document.querySelector('[data-status]');
    const seasonEl=document.querySelector('[data-season]');
    const bracketEl=document.querySelector('[data-bracket]');
    const adminEl=document.querySelector('[data-admin]');
    function setStatus(m,t){statusEl.textContent=m;statusEl.dataset.tone=t||'muted'}
    function markDuplicateNames(players){
      const counts=new Map();
      for(const p of players||[]){
        const key=String(p.displayName||p.display_name||'').trim().toLowerCase();
        if(!key)continue;
        counts.set(key,(counts.get(key)||0)+1);
      }
      return (players||[]).map((p)=>{
        const key=String(p.displayName||p.display_name||'').trim().toLowerCase();
        return Object.assign({},p,{isDuplicateName:Boolean(key&&(counts.get(key)||0)>1)});
      });
    }
    function playerOptionLabel(p){
      const name=String(p.displayName||p.display_name||'Player').trim()||'Player';
      if(!p.isDuplicateName)return name;
      const id=String(p.playerId||p.player_id||p.id||'');
      return id.length>=4 ? (name+' · #'+id.slice(-4)) : name;
    }
    function token(){return sessionStorage.getItem('fd.accessToken')||''}
    async function get(path){
      const response=await fetch(path);
      const body=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(body.error||'Request failed');
      return body;
    }
    async function authApi(path,options={}){
      const response=await fetch(path,{...options,headers:{authorization:'Bearer '+token(),'content-type':'application/json',...(options.headers||{})}});
      const body=await response.json().catch(()=>({}));
      if(response.status===401)throw new Error('Sign in on Profile first.');
      if(!response.ok)throw new Error(body.error||'Request failed');
      return body;
    }
    function stageLabel(stage){
      if(stage==='championship')return'Championship';
      if(stage==='semifinal')return'Semifinals';
      if(stage==='tiebreaker')return'Tiebreaker';
      return stage||'Round';
    }
    function renderBracket(rounds){
      const post=rounds.filter((r)=>['semifinal','championship','tiebreaker'].includes(String(r.stage||'')));
      bracketEl.replaceChildren();
      if(!post.length){
        bracketEl.innerHTML='<div class="empty"><strong style="display:block;margin-bottom:8px">No postseason rounds yet</strong>When an admin starts playoffs, semifinals appear here.<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px"><a href="/schedule" style="min-height:44px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid var(--line,#343c45);border-radius:10px;color:inherit;text-decoration:none">Schedule</a><a href="/standings" style="min-height:44px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid var(--line,#343c45);border-radius:10px;color:inherit;text-decoration:none">Standings</a><a href="/scorecard" style="min-height:44px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid var(--line,#343c45);border-radius:10px;color:inherit;text-decoration:none">Score</a></div></div>';
        return;
      }
      for(const round of post){
        const section=document.createElement('section');
        section.className='round';
        const head=document.createElement('div');
        head.className='round-head';
        head.innerHTML='<div><div class="kicker">'+stageLabel(round.stage)+'</div><strong>'+(round.scheduledOn||'Date TBD')+'</strong></div>';
        const matches=document.createElement('div');
        matches.className='matches';
        for(const match of (round.matches||[])){
          const card=document.createElement('article');
          card.className='match';
          card.innerHTML='<div class="muted">Table '+(match.tableNumber||'—')+' · '+(match.status||'scheduled')+'</div>'
            +'<div class="versus"><strong>'+(match.teamAName||'TBD')+'</strong><span>vs</span><strong>'+(match.teamBName||'TBD')+'</strong></div>';
          const actions=document.createElement('div');
          actions.className='actions';
          const score=document.createElement('a');
          score.href='/scorecard?match='+encodeURIComponent(match.teamMatchId||'');
          score.textContent=(match.status==='finalized'||match.status==='corrected')?'View final':'Score';
          score.className=(match.status==='finalized'||match.status==='corrected')?'':'primary';
          const msgs=document.createElement('a');
          msgs.href='/messages?matchup='+encodeURIComponent(match.teamMatchId||'');
          msgs.textContent='Messages';
          const lineup=document.createElement('a');lineup.href='/lineup?match='+encodeURIComponent(match.teamMatchId||'');lineup.textContent='Lineup';lineup.style.cssText='min-height:44px;display:grid;place-items:center;border:1px solid var(--line);border-radius:9px;color:inherit;text-decoration:none';actions.append(score,lineup,msgs);
          card.append(actions);
          if(token() && match.teamMatchId){
            const post=document.createElement('div');
            post.style.cssText='margin-top:10px;display:grid;gap:8px';
            post.innerHTML='<strong style="font-size:.85rem">Postseason lineup (4 + anchor)</strong>';
            const teamSel=document.createElement('select');
            teamSel.innerHTML='<option value="">Your team for this match…</option>';
            for(const ct of (window.__fdCaptainTeams||[])){
              const id=ct.teamId||ct.team_id;
              const name=ct.teamName||ct.team_name||'Team';
              if(id) teamSel.innerHTML+='<option value="'+id+'">'+name+'</option>';
            }
            const playerBox=document.createElement('div');
            playerBox.style.cssText='display:grid;gap:4px;font-size:.85rem';
            const anchorSel=document.createElement('select');
            anchorSel.innerHTML='<option value="">Anchor player…</option>';
            const submit=document.createElement('button');
            submit.type='button';
            submit.className='primary';
            submit.textContent='Submit postseason lineup';
            function rosterFor(teamId){
              const team=(window.__fdCaptainTeams||[]).find((t)=>(t.teamId||t.team_id)===teamId);
              return Array.isArray(team&&team.roster)?team.roster:[];
            }
            function paintPlayers(){
              playerBox.replaceChildren();
              anchorSel.innerHTML='<option value="">Anchor player…</option>';
              const roster=markDuplicateNames(rosterFor(teamSel.value));
              for(const p of roster){
                const id=p.playerId||p.player_id;
                const name=playerOptionLabel(p);
                if(!id)continue;
                const lab=document.createElement('label');
                lab.style.display='flex';lab.style.gap='8px';lab.style.alignItems='center';
                const cb=document.createElement('input');
                cb.type='checkbox';cb.value=id;cb.dataset.playerName=name;
                lab.append(cb,document.createTextNode(name+(p.role==='captain'?' (C)':'')));
                playerBox.append(lab);
                const opt=document.createElement('option');opt.value=id;opt.textContent=name;anchorSel.append(opt);
              }
            }
            teamSel.addEventListener('change',paintPlayers);
            submit.addEventListener('click',async()=>{
              try{
                const teamId=teamSel.value;
                const boxes=[...playerBox.querySelectorAll('input[type=checkbox]:checked')].map((el)=>el.value);
                const anchorPlayerId=anchorSel.value;
                if(!teamId)throw new Error('Choose your team');
                if(boxes.length!==4)throw new Error('Select exactly four players');
                if(!anchorPlayerId||!boxes.includes(anchorPlayerId))throw new Error('Anchor must be one of the four');
                setStatus('Submitting postseason lineup…');
                await authApi('/api/team-matches/'+encodeURIComponent(match.teamMatchId)+'/postseason-lineup',{
                  method:'POST',
                  body:JSON.stringify({teamId,playerIds:boxes,anchorPlayerId}),
                });
                setStatus('Postseason lineup submitted','ok');
              }catch(e){setStatus((window.fdFriendlyError?window.fdFriendlyError(e):e.message),'error')}
            });
            post.append(teamSel,playerBox,anchorSel,submit);
            card.append(post);
          }
          matches.append(card);
        }
        section.append(head,matches);
        bracketEl.append(section);
      }
    }
    async function load(){
      setStatus('Loading seasons…');
      const seasonsBody=await get('/api/seasons');
      const seasons=seasonsBody.seasons||[];
      seasonEl.replaceChildren();
      if(!seasons.length){
        seasonEl.disabled=true;
        bracketEl.innerHTML='<div class="empty"><strong style="display:block;margin-bottom:8px">No public seasons yet</strong><div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px"><a href="/schedule" style="min-height:44px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid var(--line,#343c45);border-radius:10px;color:inherit;text-decoration:none">Schedule</a><a href="/teams" style="min-height:44px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid var(--line,#343c45);border-radius:10px;color:inherit;text-decoration:none">Teams</a></div></div>';
        setStatus('No seasons');
        return;
      }
      const preferred=seasons.find((s)=>s.status==='playoffs')
        ||seasons.find((s)=>s.status==='active')
        ||seasons.find((s)=>s.status==='complete')
        ||seasons[0];
      for(const season of seasons){
        const opt=document.createElement('option');
        opt.value=season.id;
        opt.textContent=season.name+' — '+season.status;
        seasonEl.append(opt);
      }
      seasonEl.value=preferred.id;
      seasonEl.disabled=false;
      await loadBracket();
      adminEl.hidden=!token();
      if(token()){
        try{
          const tm=await authApi('/api/me/teams');
          window.__fdCaptainTeams=(tm.teamManagement&&tm.teamManagement.captain_teams)||[];
        }catch{window.__fdCaptainTeams=[]}
      }
    }
    async function loadBracket(opts={}){
      const quiet=Boolean(opts&&opts.quiet);
      const id=seasonEl.value;
      if(!id)return;
      if(!quiet) setStatus('Loading playoff bracket…');
      const body=await get('/api/seasons/'+encodeURIComponent(id)+'/schedule');
      renderBracket(body.rounds||body.schedule||[]);
      if(!quiet) setStatus('Playoffs loaded','ok');
    }
    document.querySelector('[data-refresh]').addEventListener('click',()=>loadBracket().catch((e)=>setStatus((window.fdFriendlyError?window.fdFriendlyError(e):e.message),'error')));
    seasonEl.addEventListener('change',()=>loadBracket().catch((e)=>setStatus((window.fdFriendlyError?window.fdFriendlyError(e):e.message),'error')));
    document.querySelector('[data-start]').addEventListener('click',async()=>{
      try{
        setStatus('Starting playoffs…');
        await authApi('/api/admin/seasons/'+encodeURIComponent(seasonEl.value)+'/start-playoffs',{method:'POST',body:'{}'});
        await loadBracket();
        setStatus('Playoffs started','ok');
      }catch(e){setStatus((window.fdFriendlyError?window.fdFriendlyError(e):e.message),'error')}
    });
    document.querySelector('[data-advance]').addEventListener('click',async()=>{
      try{
        setStatus('Advancing to championship…');
        await authApi('/api/admin/seasons/'+encodeURIComponent(seasonEl.value)+'/advance-championship',{method:'POST',body:'{}'});
        await loadBracket();
        setStatus('Championship advanced','ok');
      }catch(e){setStatus((window.fdFriendlyError?window.fdFriendlyError(e):e.message),'error')}
    });
    load().catch((e)=>setStatus((window.fdFriendlyError?window.fdFriendlyError(e):e.message),'error'));
    if(window.fdLiveRefresh)window.fdLiveRefresh.register((opts)=>loadBracket(opts).catch(()=>{}),{intervalMs:20000,immediate:false});
  </script>
</body>
</html>`;
}

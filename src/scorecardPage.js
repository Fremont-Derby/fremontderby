export function renderScorecardPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Fremont Derby Scorecard</title>
  <style>
    :root { color-scheme:dark; font-family:Inter,ui-sans-serif,system-ui,sans-serif; background:#101313; color:#f6f1e7; --panel:#1a1e1d; --line:#38413e; --muted:#aeb8b3; --green:#36b779; --gold:#e2b742; --red:#db6257; --blue:#5b92e4; }
    * { box-sizing:border-box; }
    body { margin:0; min-height:100vh; overflow-x:hidden; background:#101313; }
    button { min-height:52px; border:1px solid transparent; border-radius:12px; padding:10px; color:#07100c; font:inherit; font-weight:950; cursor:pointer; touch-action:manipulation; }
    button:disabled { cursor:not-allowed; opacity:.42; }
    .app { width:min(760px,100%); margin:0 auto; padding:10px; }
    .topbar { display:flex; align-items:center; justify-content:space-between; gap:10px; min-height:42px; padding:3px 0 9px; }
    .brand { display:flex; align-items:center; gap:8px; min-width:0; font-weight:950; }
    .balls { display:flex; gap:3px; flex:none; }
    .ball { width:24px; height:24px; border-radius:50%; display:grid; place-items:center; color:#12120f; background:#f7f4eb; font-size:.72rem; font-weight:950; }
    .ball.nine { background:linear-gradient(#e2b737 0 34%,#f7f4eb 34% 66%,#e2b737 66%); }
    .status { min-width:0; color:var(--muted); font-size:.78rem; text-align:right; }
    .status[data-tone="error"] { color:#ffb1aa; }
    .status[data-tone="ok"] { color:#9ee5bd; }
    .context { display:flex; justify-content:space-between; align-items:center; gap:9px; padding:8px 0; border-top:1px solid var(--line); color:var(--muted); font-size:.78rem; }
    .context strong { color:#9ee5bd; }
    .context a { flex:none; color:#f6df9d; font-weight:900; text-decoration:none; }
    .scoreboard { border:1px solid var(--line); border-radius:16px; overflow:hidden; background:var(--panel); box-shadow:0 12px 30px #0004; }
    .rack-banner { display:flex; justify-content:space-between; align-items:center; gap:10px; min-height:80px; padding:11px 14px; background:linear-gradient(115deg,#1c2823,#17201d); border-bottom:1px solid var(--line); }
    .eyebrow { display:block; margin-bottom:2px; color:var(--gold); font-size:.72rem; font-weight:950; letter-spacing:.12em; text-transform:uppercase; }
    .discipline { display:block; color:#fff; font-size:clamp(1.8rem,9vw,3rem); line-height:.92; font-weight:1000; letter-spacing:-.045em; text-transform:uppercase; }
    .rack-meta { display:grid; gap:5px; justify-items:end; color:var(--muted); font-size:.72rem; text-align:right; }
    .rack-meta strong { color:#fff; }
    .score-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); }
    .player { --accent:var(--green); min-width:0; padding:12px 10px 10px; border-top:5px solid var(--accent); display:grid; align-content:start; gap:8px; }
    .player + .player { --accent:var(--blue); border-left:1px solid var(--line); }
    .player-head { min-width:0; min-height:48px; }
    .name { margin:0; overflow:hidden; text-overflow:ellipsis; font-size:clamp(.98rem,4.5vw,1.35rem); line-height:1.05; white-space:nowrap; }
    .rating { margin-top:3px; overflow:hidden; color:var(--muted); font-size:.7rem; text-overflow:ellipsis; white-space:nowrap; }
    .tally { display:flex; align-items:end; gap:5px; line-height:1; }
    .score { color:#fff; font-size:clamp(3rem,15vw,5rem); line-height:.75; font-weight:1000; letter-spacing:-.08em; }
    .target { padding-bottom:3px; color:var(--muted); font-size:.72rem; font-weight:850; }
    .target strong { display:block; color:var(--gold); font-size:1rem; }
    .race-label { display:flex; justify-content:space-between; gap:6px; color:var(--muted); font-size:.62rem; font-weight:900; letter-spacing:.07em; text-transform:uppercase; }
    .race-markers { display:grid; grid-auto-flow:column; grid-auto-columns:minmax(5px,1fr); gap:4px; width:100%; min-height:13px; align-items:center; }
    .race-marker { height:9px; border:1px solid #6b7571; border-radius:999px; background:#0e1110; }
    .race-marker[data-reached="true"] { border-color:var(--accent); background:var(--accent); box-shadow:0 0 0 1px #0006 inset; }
    .race-marker[data-target="true"] { outline:2px solid var(--gold); outline-offset:1px; }
    .rack-action { width:100%; min-height:58px; margin-top:2px; background:var(--accent); color:#06110c; font-size:clamp(.78rem,3.5vw,.98rem); line-height:1.05; }
    .player[data-side="B"] .rack-action { color:#07101f; }
    .reconcile { margin-top:9px; padding:10px 12px; border:1px solid var(--line); border-radius:12px; background:#151818; display:flex; justify-content:space-between; align-items:center; gap:10px; }
    .reconcile[data-state="match"] { border-color:var(--green); }
    .reconcile[data-state="mismatch"] { border-color:var(--red); background:#271918; }
    .reconcile strong { font-size:.9rem; }
    .reconcile .meta { color:var(--muted); font-size:.72rem; text-align:right; }
    .actions { display:grid; grid-template-columns:.72fr 1fr 1fr; gap:7px; padding:9px 0; }
    .undo { background:transparent; color:#f6f1e7; border-color:var(--line); }
    .confirm { background:var(--gold); }
    .finalize { background:var(--red); color:#1a0604; }
    .detail-drawer { border:1px solid var(--line); border-radius:12px; background:#151818; overflow:hidden; }
    .detail-drawer > summary { min-height:48px; padding:13px; cursor:pointer; color:#f6df9d; font-weight:900; }
    .match-bar { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; padding:10px 12px; border-top:1px solid var(--line); }
    .stat { display:grid; gap:3px; min-width:0; }
    .stat span { color:var(--muted); font-size:.64rem; font-weight:850; }
    .stat strong { overflow-wrap:anywhere; font-size:.78rem; }
    .histories { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); border-top:1px solid var(--line); }
    .history { min-width:0; padding:11px; }
    .history + .history { border-left:1px solid var(--line); }
    .history h3 { margin:0 0 4px; font-size:.9rem; }
    .history-state { margin-bottom:7px; color:var(--muted); font-size:.7rem; }
    .racks { border:1px solid var(--line); border-radius:8px; overflow:hidden; }
    .rack-row { min-height:36px; display:grid; grid-template-columns:38px 1fr; gap:5px; align-items:center; padding:0 8px; border-bottom:1px solid var(--line); background:#121514; font-size:.72rem; }
    .rack-row:last-child { border-bottom:0; }
    .rack-row[data-mismatch="true"] { background:#341b19; }
    .rack-head { color:var(--muted); font-size:.62rem; font-weight:900; text-transform:uppercase; }
    .rack-discipline { grid-column:2; color:var(--muted); font-size:.62rem; }
    .empty { padding:12px 8px; color:var(--muted); background:#121514; font-size:.72rem; }
    @media (max-width:520px) {
      .app { padding:7px; }
      .brand > span:last-child { font-size:.82rem; }
      .context { align-items:flex-start; }
      .context [data-context] { display:-webkit-box; overflow:hidden; -webkit-box-orient:vertical; -webkit-line-clamp:2; }
      .rack-banner { min-height:70px; padding:9px 10px; }
      .player { padding:10px 8px 8px; }
      .reconcile { align-items:flex-start; }
      .actions button { min-height:50px; padding:7px 5px; font-size:.74rem; }
      .histories { grid-template-columns:1fr; }
      .history + .history { border-left:0; border-top:1px solid var(--line); }
      .match-bar { grid-template-columns:1fr 1fr; }
    }
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar"><div class="brand"><span class="balls" aria-hidden="true"><span class="ball">8</span><span class="ball nine">9</span></span><span>Fremont Derby Scorecard</span></div><div class="status" data-status>Loading…</div></header>
    <div class="context"><span data-context>Using your signed-in team scoring session.</span><a href="/scorecard">Switch match</a></div>
    <section class="scoreboard" data-primary-scoring aria-label="Live rack scoring">
      <header class="rack-banner"><div><span class="eyebrow">Rack <span data-rack-number>1</span> · now playing</span><strong class="discipline" data-discipline>8-BALL</strong></div><div class="rack-meta"><span>First break <strong data-break>-</strong></span><span>Match <strong data-match-status>-</strong></span></div></header>
      <div class="score-grid">
        <article class="player" data-side="A"><div class="player-head"><h2 class="name" data-player-a-name>Player A</h2><div class="rating" data-player-a-rating>Rating</div></div><div class="tally"><span class="score" data-score-a>0</span><span class="target">TARGET<strong data-player-a-target>-</strong></span></div><div class="race-label"><span>Start</span><span data-player-a-race>Race to -</span></div><div class="race-markers" data-race-a-markers role="img" aria-label="Player A: 0 racks, target not loaded"></div><button class="rack-action" data-rack-a data-side="A" type="button">Player A wins rack 1</button></article>
        <article class="player" data-side="B"><div class="player-head"><h2 class="name" data-player-b-name>Player B</h2><div class="rating" data-player-b-rating>Rating</div></div><div class="tally"><span class="score" data-score-b>0</span><span class="target">TARGET<strong data-player-b-target>-</strong></span></div><div class="race-label"><span>Start</span><span data-player-b-race>Race to -</span></div><div class="race-markers" data-race-b-markers role="img" aria-label="Player B: 0 racks, target not loaded"></div><button class="rack-action" data-rack-b data-side="B" type="button">Player B wins rack 1</button></article>
      </div>
    </section>
    <section class="reconcile" data-reconcile aria-live="polite"><strong data-reconcile-title>Loading both score records…</strong><span class="meta" data-reconcile-detail></span></section>
    <section class="actions" aria-label="Score controls"><button class="undo" data-undo type="button">Undo rack</button><button class="confirm" data-confirm type="button">Confirm our score</button><button class="finalize" data-finalize type="button">Finalize match</button></section>
    <details class="detail-drawer"><summary>Rack history and match details</summary><section class="match-bar"><div class="stat"><span>Game now</span><strong data-detail-discipline>-</strong></div><div class="stat"><span>First break</span><strong data-detail-break>-</strong></div><div class="stat"><span>Status</span><strong data-detail-match-status>-</strong></div><div class="stat"><span>Winner</span><strong data-winner>-</strong></div></section><section class="histories"><article class="history"><h3>Our rack history</h3><div class="history-state" data-own-state>Not loaded</div><div class="racks" data-own-racks><div class="empty">No rack history loaded.</div></div></article><article class="history"><h3>Other team's rack history</h3><div class="history-state" data-opponent-state>Not loaded</div><div class="racks" data-opponent-racks><div class="empty">No rack history loaded.</div></div></article></section></details>
  </main>
  <script>
    const params=new URLSearchParams(location.search); const matchId=params.get('match')||''; const scoringTeamId=params.get('team')||''; const scoringTeamName=params.get('teamName')||'your team'; const statusEl=document.querySelector('[data-status]'); const rackAButton=document.querySelector('[data-rack-a]'); const rackBButton=document.querySelector('[data-rack-b]'); const undoButton=document.querySelector('[data-undo]'); const confirmButton=document.querySelector('[data-confirm]'); const finalizeButton=document.querySelector('[data-finalize]');
    const ownRacksEl=document.querySelector('[data-own-racks]'); const opponentRacksEl=document.querySelector('[data-opponent-racks]'); const reconcileEl=document.querySelector('[data-reconcile]'); let currentScorecard=null; let currentComparison=null; let currentRackNumber=1; let refreshTimer=null;
    function accessToken(){return sessionStorage.getItem('fd.accessToken')||'';}
    function setStatus(message,tone){statusEl.textContent=message; statusEl.dataset.tone=tone||'muted';}
    function requireContext(){const token=accessToken(); if(!matchId) throw new Error('Choose a match from the scorecard list.'); if(!scoringTeamId) throw new Error('Choose which team you are scoring for.'); if(!token) throw new Error('Sign in with Google to score this match.'); return {matchId,scoringTeamId,token};}
    async function api(path,options={}){const inputs=requireContext(); const base=path.replace(':id',encodeURIComponent(inputs.matchId)); const separator=base.includes('?')?'&':'?'; const contextualPath=base+separator+'scoringTeamId='+encodeURIComponent(inputs.scoringTeamId); const response=await fetch(contextualPath,{...options,headers:{authorization:'Bearer '+inputs.token,'content-type':'application/json',...(options.headers||{})}}); const body=await response.json(); if(response.status===401){sessionStorage.removeItem('fd.accessToken'); throw new Error('Your sign-in expired. Open Profile and sign in again.');} if(!response.ok) throw new Error(body.error||'Request failed'); return body;}
    function sideLabel(side){if(!currentScorecard) return side; return side==='A'?currentScorecard.player_a_display_name:currentScorecard.player_b_display_name;}
    function ratingText(rating,status){return [rating||'Unrated',status||'unverified'].join(' · ');}
    function setText(selector,value){document.querySelector(selector).textContent=value==null||value===''?'-':String(value);}
    function renderRaceMarkers(selector,name,score,targetValue){const element=document.querySelector(selector); const raceTarget=Math.max(0,Number(targetValue)||0); const raceScore=Math.max(0,Number(score)||0); element.replaceChildren(); element.setAttribute('aria-label',name+': '+raceScore+' of '+(raceTarget||'unknown')+' target racks'); if(!raceTarget){const marker=document.createElement('span'); marker.className='race-marker'; element.append(marker); return;} for(let rack=1;rack<=raceTarget;rack+=1){const marker=document.createElement('span'); marker.className='race-marker'; marker.dataset.reached=String(rack<=raceScore); marker.dataset.target=String(rack===raceTarget); marker.title='Rack '+rack+(rack===raceTarget?' · target':''); element.append(marker);}}
    function updateRackControls(number){currentRackNumber=Math.max(1,Number(number)||1); setText('[data-rack-number]',currentRackNumber); if(!currentScorecard)return; rackAButton.textContent=currentScorecard.player_a_display_name+' wins rack '+currentRackNumber; rackBButton.textContent=currentScorecard.player_b_display_name+' wins rack '+currentRackNumber;}
    function renderRacks(target,racks,mismatchRack){target.replaceChildren(); if(!racks||!racks.length){const empty=document.createElement('div'); empty.className='empty'; empty.textContent='No racks recorded.'; target.append(empty); return;} const head=document.createElement('div'); head.className='rack-row rack-head'; head.innerHTML='<span>Rack</span><span>Winner · game</span>'; target.append(head); for(const rack of racks){const number=rack.rackNumber||rack.rack_number; const row=document.createElement('div'); row.className='rack-row'; if(Number(number)===Number(mismatchRack)) row.dataset.mismatch='true'; const n=document.createElement('span'); n.textContent=number; const winner=document.createElement('strong'); winner.textContent=sideLabel(rack.winnerSide||rack.winner_side); const discipline=document.createElement('span'); discipline.className='rack-discipline'; discipline.textContent=String(rack.discipline||'').toUpperCase(); row.append(n,winner,discipline); target.append(row);}}
    function renderScorecard(scorecard){currentScorecard=scorecard; const discipline=String(scorecard.current_discipline||'-').toUpperCase(); setText('[data-player-a-name]',scorecard.player_a_display_name); setText('[data-player-b-name]',scorecard.player_b_display_name); setText('[data-player-a-rating]',ratingText(scorecard.player_a_fargo_rating,scorecard.player_a_rating_status)); setText('[data-player-b-rating]',ratingText(scorecard.player_b_fargo_rating,scorecard.player_b_rating_status)); setText('[data-player-a-target]',scorecard.race_to_a); setText('[data-player-b-target]',scorecard.race_to_b); setText('[data-player-a-race]','Race to '+(scorecard.race_to_a||'-')); setText('[data-player-b-race]','Race to '+(scorecard.race_to_b||'-')); setText('[data-score-a]',scorecard.score_a); setText('[data-score-b]',scorecard.score_b); renderRaceMarkers('[data-race-a-markers]',scorecard.player_a_display_name,scorecard.score_a,scorecard.race_to_a); renderRaceMarkers('[data-race-b-markers]',scorecard.player_b_display_name,scorecard.score_b,scorecard.race_to_b); setText('[data-discipline]',discipline); setText('[data-detail-discipline]',discipline); setText('[data-break]',sideLabel(scorecard.first_break)); setText('[data-detail-break]',sideLabel(scorecard.first_break)); setText('[data-match-status]',scorecard.status); setText('[data-detail-match-status]',scorecard.status); setText('[data-winner]',scorecard.winner_side?sideLabel(scorecard.winner_side):'-'); updateRackControls(Number(scorecard.score_a||0)+Number(scorecard.score_b||0)+1); document.querySelector('[data-context]').innerHTML='Scoring for <strong>'+String(scoringTeamName).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))+'</strong> · '+scorecard.player_a_display_name+' vs '+scorecard.player_b_display_name;}
    function renderComparison(comparison){currentComparison=comparison; const locked=currentScorecard&&['finalized','corrected'].includes(currentScorecard.status); const mismatch=comparison.mismatch_rack_number; const ownRacks=comparison.own_racks||[]; renderRacks(ownRacksEl,ownRacks,mismatch); renderRacks(opponentRacksEl,comparison.opponent_racks||[],mismatch); updateRackControls(ownRacks.length+1); document.querySelector('[data-own-state]').textContent=comparison.own_confirmed_at?'Confirmed':'Not confirmed'; document.querySelector('[data-opponent-state]').textContent=comparison.opponent_confirmed_at?'Confirmed':'Not confirmed'; if(comparison.histories_match){reconcileEl.dataset.state='match'; setText('[data-reconcile-title]',comparison.both_confirmed?'Scores match · both confirmed':'Scores match'); setText('[data-reconcile-detail]',comparison.ready_to_finalize?'Ready to finalize':'Waiting for both confirmations');}else{reconcileEl.dataset.state='mismatch'; setText('[data-reconcile-title]',mismatch?'Mismatch at rack '+mismatch:'Waiting for the other team'); setText('[data-reconcile-detail]',mismatch?'Open rack history to compare':'Both teams record their own score');} rackAButton.disabled=locked||Boolean(comparison.own_confirmed_at); rackBButton.disabled=locked||Boolean(comparison.own_confirmed_at); undoButton.disabled=locked||Boolean(comparison.own_confirmed_at)||!ownRacks.length; confirmButton.disabled=locked||Boolean(comparison.own_confirmed_at)||!ownRacks.length; finalizeButton.disabled=locked||!comparison.ready_to_finalize;}
    async function loadAll({quiet=false}={}){if(!quiet) setStatus('Loading…'); const [scoreBody,comparisonBody]=await Promise.all([api('/api/player-matches/:id/scorecard',{method:'GET'}),api('/api/player-matches/:id/score-comparison',{method:'GET'})]); renderScorecard(scoreBody.scorecard); renderComparison(comparisonBody.comparison); if(!quiet) setStatus('Live','ok');}
    async function recordRack(winnerSide){setStatus('Saving rack…'); await api('/api/player-matches/:id/score-racks',{method:'POST',body:JSON.stringify({winnerSide,scoringTeamId})}); await loadAll();}
    async function undoRack(){setStatus('Undoing rack…'); await api('/api/player-matches/:id/score-racks/undo',{method:'POST',body:JSON.stringify({scoringTeamId})}); await loadAll();}
    async function confirmScore(){setStatus('Confirming score…'); await api('/api/player-matches/:id/score-confirm',{method:'POST',body:JSON.stringify({scoringTeamId})}); await loadAll();}
    async function finalizeMatch(){setStatus('Finalizing match…'); await api('/api/player-matches/:id/finalize-reconciled',{method:'POST',body:JSON.stringify({scoringTeamId})}); await loadAll(); setStatus('Finalized','ok');}
    async function run(action){try{await action();}catch(error){setStatus(error.message,'error');}}
    function startRefresh(){clearInterval(refreshTimer); refreshTimer=setInterval(()=>{if(document.visibilityState==='visible'&&matchId&&scoringTeamId&&accessToken()) run(()=>loadAll({quiet:true}));},3000);}
    rackAButton.addEventListener('click',()=>run(()=>recordRack('A'))); rackBButton.addEventListener('click',()=>run(()=>recordRack('B'))); undoButton.addEventListener('click',()=>run(undoRack)); confirmButton.addEventListener('click',()=>run(confirmScore)); finalizeButton.addEventListener('click',()=>run(finalizeMatch));
    if(!matchId||!scoringTeamId){setStatus('Choose a match and scoring team from the scorecard list.','error'); rackAButton.disabled=true; rackBButton.disabled=true; undoButton.disabled=true; confirmButton.disabled=true; finalizeButton.disabled=true;} else if(!accessToken()){setStatus('Sign in with Google to score this match.','error'); const context=document.querySelector('[data-context]'); context.innerHTML='<a href="/profile">Open Profile to sign in</a>';} else {run(loadAll); startRefresh();}
  </script>
</body>
</html>`;
}

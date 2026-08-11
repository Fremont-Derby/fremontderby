export function renderScorePickerPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Score a Match · Fremont Derby</title>
  <style>
    :root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#111313;color:#f6f1e7;--panel:#1a1d1d;--line:#343a3a;--muted:#a9b2ae;--green:#2fa56f;--gold:#d7a934}*{box-sizing:border-box}body{margin:0;background:#111313}.app{width:min(760px,100%);margin:auto;padding:16px}.head{padding:8px 0 16px;border-bottom:1px solid var(--line)}h1{margin:0 0 8px;font-size:clamp(2rem,8vw,3.4rem);line-height:1}.muted{color:var(--muted);line-height:1.45}.status{margin:14px 0;padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--panel)}.status[data-tone="error"]{border-color:#a84940;color:#ffb1aa}.list{display:grid;gap:10px}.match{display:grid;gap:9px;padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--panel);text-decoration:none;color:#f6f1e7}.match:hover{border-color:#52765f}.top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.players{font-size:1.06rem;font-weight:900}.teams,.meta{color:var(--muted);font-size:.88rem}.side{display:inline-flex;align-items:center;min-height:26px;padding:0 9px;border-radius:999px;background:#193b2a;color:#a7e8c2;font-size:.75rem;font-weight:900;white-space:nowrap}.empty{padding:24px 14px;text-align:center;border:1px dashed var(--line);border-radius:12px;color:var(--muted)}.button{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:10px 15px;border-radius:10px;background:var(--gold);color:#17120a;text-decoration:none;font-weight:900;margin-top:10px}@media(max-width:600px){.app{padding:12px}.top{display:grid}.side{justify-self:start}}
  </style>
</head>
<body>
  <main class="app">
    <header class="head"><h1>Score a match</h1><div class="muted">Choose the team whose score history you are entering. If you belong to both teams, the same match appears once for each team.</div></header>
    <div class="status" data-status>Loading your matches…</div>
    <section class="list" data-list></section>
  </main>
  <script>
    const statusEl=document.querySelector('[data-status]');const listEl=document.querySelector('[data-list]');
    function token(){return sessionStorage.getItem('fd.accessToken')||''}
    function setStatus(message,tone){statusEl.textContent=message;statusEl.dataset.tone=tone||'muted'}
    function text(value){return value==null?'':String(value)}
    function dateLabel(value){if(!value)return'Date TBD';const d=new Date(value+'T12:00:00');return new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric'}).format(d)}
    function matchCard(match){const a=document.createElement('a');a.className='match';a.href='/scorecard/live?match='+encodeURIComponent(match.player_match_id)+'&team='+encodeURIComponent(match.scoring_team_id)+'&teamName='+encodeURIComponent(match.scoring_team_name||'Your team');const top=document.createElement('div');top.className='top';const left=document.createElement('div');const players=document.createElement('div');players.className='players';players.textContent=text(match.player_a_name)+' vs '+text(match.player_b_name);const teams=document.createElement('div');teams.className='teams';teams.textContent=text(match.team_a_name)+' vs '+text(match.team_b_name);left.append(players,teams);const side=document.createElement('span');side.className='side';side.textContent='Scoring for '+text(match.scoring_team_name);top.append(left,side);const meta=document.createElement('div');meta.className='meta';meta.textContent=dateLabel(match.scheduled_on)+' · Round '+text(match.round_number)+' · Match '+text(match.slot_number)+' · '+text(match.status);a.append(top,meta);return a}
    async function load(){const accessToken=token();if(!accessToken){setStatus('Sign in with Google to see matches your team can score.','error');const signIn=document.createElement('a');signIn.className='button';signIn.href='/profile';signIn.textContent='Sign in';listEl.replaceChildren(signIn);return}try{const response=await fetch('/api/me/scorable-matches',{headers:{authorization:'Bearer '+accessToken}});const body=await response.json();if(response.status===401){sessionStorage.removeItem('fd.accessToken');throw new Error('Your sign-in expired. Open Profile to sign in again.')}if(!response.ok)throw new Error(body.error||'Could not load matches');const matches=body.matches||[];listEl.replaceChildren();if(!matches.length){const empty=document.createElement('div');empty.className='empty';empty.textContent='No revealed unfinished matches are available for your current teams yet.';listEl.append(empty);setStatus('Nothing ready to score yet.');return}for(const match of matches)listEl.append(matchCard(match));setStatus(matches.length+' scoring option'+(matches.length===1?'':'s')+' ready.')}catch(error){setStatus(error.message,'error');const profile=document.createElement('a');profile.className='button';profile.href='/profile';profile.textContent='Open Profile';listEl.replaceChildren(profile)}}load();
  </script>
</body>
</html>`;
}

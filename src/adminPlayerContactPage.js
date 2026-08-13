export function renderAdminPlayerContactPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Player Contact · Fremont Derby</title>
  <style>
    :root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#0d1110;color:#f3f6f4;--panel:#17201c;--line:#31443a;--muted:#a9b8b0;--green:#45b77c;--gold:#e2bd58;--red:#e36b62;--focus:#9ee5bd}*{box-sizing:border-box}body{margin:0;background:#0d1110}button,input,a{font:inherit}button:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid var(--focus);outline-offset:2px}.app{width:min(760px,100%);margin:auto;padding:18px}.head{display:flex;gap:14px;align-items:flex-start;justify-content:space-between;margin-bottom:16px}.head h1{margin:0 0 4px;font-size:clamp(1.7rem,6vw,2.4rem)}.muted{color:var(--muted);line-height:1.45}.back,.call{min-height:48px;display:inline-flex;align-items:center;justify-content:center;padding:0 16px;border:1px solid var(--line);border-radius:10px;color:#dff0e6;text-decoration:none;font-weight:850}.panel{border:1px solid var(--line);background:var(--panel);border-radius:14px;padding:14px}.lookup{display:grid;gap:10px}.lookup label{font-weight:850}.lookup input{width:100%;min-height:48px;padding:0 14px;border:1px solid var(--line);border-radius:10px;background:#0b100e;color:#fff}.results{display:grid;gap:8px}.result{min-height:48px;width:100%;padding:10px 14px;border:1px solid var(--line);border-radius:10px;background:#111814;color:#f3f6f4;text-align:left;cursor:pointer;font-weight:850}.result span{display:block;margin-top:3px;color:var(--muted);font-size:.8rem;font-weight:700}.status{min-height:24px;color:var(--muted)}.status[data-tone=error]{color:#ffb5ae}.detail{display:grid;gap:12px;margin-top:14px;padding-top:14px;border-top:1px solid var(--line)}.detail h2{margin:0;font-size:1.2rem}.phone{font-size:1.35rem;font-weight:950;letter-spacing:.01em}.warning{padding:11px 12px;border-left:4px solid var(--gold);border-radius:8px;background:#211d12;color:#ffe8a6;line-height:1.45}.call{width:max-content;background:var(--green);border-color:var(--green);color:#06150d}.private-note{font-size:.82rem;color:var(--muted);line-height:1.45}.empty{padding:10px 0;color:var(--muted)}[hidden]{display:none!important}@media(max-width:600px){.app{padding:12px}.head{display:grid}.back,.call{width:100%}}
  </style>
</head>
<body>
  <main class="app">
    <header class="head">
      <div><div class="muted">Admin · Private contact</div><h1>Player contact</h1><div class="muted">Open one player at a time. Phone numbers stay out of the player directory and public league surfaces.</div></div>
      <a class="back" href="/admin/players">Back to players</a>
    </header>
    <section class="panel">
      <div class="status" role="status" aria-live="polite" aria-atomic="true" data-status>Checking admin access…</div>
      <div class="lookup" data-lookup hidden>
        <label for="player-contact-search">Find a player</label>
        <input id="player-contact-search" type="search" autocomplete="off" placeholder="Type a player or team name" data-search />
        <div class="results" data-results aria-label="Matching players"></div>
        <div class="empty" data-empty hidden>No players match that search.</div>
      </div>
      <article class="detail" data-detail hidden aria-live="polite">
        <div><div class="muted">Selected player</div><h2 data-name></h2></div>
        <div class="phone" data-phone></div>
        <div class="warning" data-warning hidden></div>
        <a class="call" data-call hidden>Call or text</a>
        <div class="private-note">Private league-administration contact. Do not copy this number into public rosters, standings, chat directories, or other browseable player lists.</div>
      </article>
    </section>
  </main>
  <script>
    const statusEl=document.querySelector('[data-status]'),lookupEl=document.querySelector('[data-lookup]'),searchEl=document.querySelector('[data-search]'),resultsEl=document.querySelector('[data-results]'),emptyEl=document.querySelector('[data-empty]'),detailEl=document.querySelector('[data-detail]'),nameEl=document.querySelector('[data-name]'),phoneEl=document.querySelector('[data-phone]'),warningEl=document.querySelector('[data-warning]'),callEl=document.querySelector('[data-call]');let players=[];
    function token(){return sessionStorage.getItem('fd.accessToken')||''}function setStatus(message,tone=''){statusEl.textContent=message;statusEl.dataset.tone=tone}async function parseJson(response){const text=await response.text();if(!text)return{};try{return JSON.parse(text)}catch{return{error:text}}}async function api(path){const accessToken=token();if(!accessToken)throw new Error('Sign in from Profile with a league-admin account.');const response=await fetch(path,{headers:{authorization:'Bearer '+accessToken}});const body=await parseJson(response);if(!response.ok){const error=new Error(body.error||'Request failed');error.status=response.status;throw error}return body}function normalize(value){return String(value||'').trim().toLowerCase()}function isCaptain(player){return Array.isArray(player.teams)&&player.teams.some(team=>team.role==='captain')}function formatPhone(value){const phone=String(value||'').trim();const us=phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);return us?'('+us[1]+') '+us[2]+'-'+us[3]:phone}function teamBlob(player){return normalize((player.teams||[]).map(team=>[team.teamName,team.seasonName].filter(Boolean).join(' ')).join(' '))}function matches(player,query){if(!query)return true;const haystack=normalize(player.displayName)+' '+teamBlob(player);return query.split(/\s+/).filter(Boolean).every(part=>haystack.includes(part))}
    function renderResults(){const query=normalize(searchEl.value);const shown=players.filter(player=>matches(player,query)).slice(0,20);resultsEl.replaceChildren();emptyEl.hidden=shown.length>0;for(const player of shown){const button=document.createElement('button');button.type='button';button.className='result';button.textContent=player.displayName;const meta=document.createElement('span');const teams=(player.teams||[]).map(team=>team.teamName).filter(Boolean);meta.textContent=(isCaptain(player)?'Captain':'Player')+(teams.length?' · '+teams.join(', '):'');button.append(meta);button.addEventListener('click',()=>openContact(player,button));resultsEl.append(button)}}
    async function openContact(player,button){for(const candidate of resultsEl.querySelectorAll('button'))candidate.disabled=true;detailEl.hidden=true;setStatus('Opening private contact for '+player.displayName+'…');try{const body=await api('/api/admin/players/'+encodeURIComponent(player.playerId)+'/contact');const contact=body.contact||{};nameEl.textContent=contact.displayName||player.displayName;const phone=formatPhone(contact.phone);phoneEl.textContent=phone||'No phone on file';warningEl.hidden=true;callEl.hidden=true;if(phone){callEl.href='tel:'+String(contact.phone||'').replace(/[^+\d]/g,'');callEl.hidden=false}else if(isCaptain(player)){warningEl.textContent='Captain contact is incomplete. Ask '+player.displayName+' to sign in, open Profile, and save a phone number under Private contact.';warningEl.hidden=false}else{warningEl.textContent='No private phone is on file. The player can add one from Profile.';warningEl.hidden=false}detailEl.hidden=false;setStatus('Private contact opened.','ok')}catch(error){detailEl.hidden=true;setStatus(error.status===401?'Your sign-in expired. Return to Profile and sign in again.':error.status===403?'This page requires league-admin access.':error.message,'error')}finally{for(const candidate of resultsEl.querySelectorAll('button'))candidate.disabled=false;button?.focus()}}
    async function load(){const body=await api('/api/admin/players');players=Array.isArray(body.players)?body.players.slice().sort((a,b)=>normalize(a.displayName).localeCompare(normalize(b.displayName))):[];lookupEl.hidden=false;renderResults();setStatus(players.length+' players available. Choose one to reveal private contact.','ok')}
    searchEl.addEventListener('input',()=>{detailEl.hidden=true;renderResults()});searchEl.addEventListener('keydown',event=>{if(event.key==='Escape'){searchEl.value='';detailEl.hidden=true;renderResults()}});load().catch(error=>{lookupEl.hidden=true;detailEl.hidden=true;setStatus(error.status===401?'Your sign-in expired. Return to Profile and sign in again.':error.status===403?'This page requires league-admin access.':error.message,'error')});
  </script>
</body>
</html>`;
}

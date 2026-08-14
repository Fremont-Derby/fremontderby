const style = `<style data-player-claim-style>
  .player-claim{display:grid;gap:12px;padding:12px}.player-claim-copy{color:var(--muted);font-size:.86rem;line-height:1.45}.player-claim-search{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end}.player-claim-search button,.player-claim-option button{min-height:48px;padding:0 16px}.player-claim-results{display:grid;gap:10px}.player-claim-option{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px;border:1px solid var(--line);border-radius:10px}.player-claim-option strong{display:block}.player-claim-context{margin-top:4px;color:var(--muted);font-size:.8rem;line-height:1.4}.player-claim-empty,.player-claim-status{color:var(--muted);font-size:.84rem;line-height:1.45}.player-claim-status[data-tone="error"]{color:#9b3129;font-weight:800}.player-claim-status[data-tone="ok"]{color:#17663e;font-weight:800}@media(max-width:600px){.player-claim-search,.player-claim-option{grid-template-columns:1fr}.player-claim-search button,.player-claim-option button{width:100%}}
</style>`;

const card = `<article class="panel" data-player-claim hidden>
  <div class="panel-head"><span>Claim existing player</span><span class="badge">Unclaimed profiles</span></div>
  <div class="player-claim" role="region" aria-label="Claim an existing Fremont Derby player profile">
    <div class="player-claim-copy">If the league already added you, claim that prepared player before creating a new profile. Only unclaimed players with no competitive racks can be claimed here.</div>
    <form class="player-claim-search" data-player-claim-search>
      <label>Player name<input type="search" maxlength="80" autocomplete="name" placeholder="Search by name" data-player-claim-query /></label>
      <button class="ghost" type="submit">Search players</button>
    </form>
    <div class="player-claim-status" role="status" aria-live="polite" data-player-claim-status></div>
    <div class="player-claim-results" data-player-claim-results></div>
  </div>
</article>`;

const script = `<script data-player-claim-script>
(() => {
  const root=document.querySelector('[data-player-claim]');
  if(!root)return;
  const form=root.querySelector('[data-player-claim-search]');
  const query=root.querySelector('[data-player-claim-query]');
  const status=root.querySelector('[data-player-claim-status]');
  const results=root.querySelector('[data-player-claim-results]');
  function token(){return sessionStorage.getItem('fd.accessToken')||''}
  async function parseJson(response){const text=await response.text();if(!text)return{};try{return JSON.parse(text)}catch{return{error:text}}}
  async function request(path,options={},retry=true){
    const accessToken=token();if(!accessToken)throw new Error('Sign in to claim a player.');
    const response=await fetch(path,{...options,headers:{authorization:'Bearer '+accessToken,'content-type':'application/json',...(options.headers||{})}});
    if(response.status===401&&retry){await new Promise((resolve)=>setTimeout(resolve,250));const refreshed=token();if(refreshed&&refreshed!==accessToken)return request(path,options,false)}
    const body=await parseJson(response);if(!response.ok)throw new Error(body.error||'Request failed');return body;
  }
  function setStatus(message,tone){status.textContent=message;status.dataset.tone=tone||'muted'}
  function contextFor(player){const teams=Array.isArray(player.teamNames)?player.teamNames:[];const seasons=Array.isArray(player.seasonNames)?player.seasonNames:[];const parts=[];if(teams.length)parts.push('Team: '+teams.join(', '));if(seasons.length)parts.push('Season: '+seasons.join(', '));if(player.registrationStatus)parts.push('Registered: '+player.registrationStatus);if(player.paymentStatus)parts.push('Payment: '+player.paymentStatus);if(player.createdAt){const y=String(player.createdAt).slice(0,4);if(/^\d{4}$/.test(y))parts.push('Added '+y)}if(player.isDuplicateName){const id=String(player.playerId||'');if(id)parts.push('#'+id.slice(-4))}return parts.join(' · ')||'No current team or season context'}
  function renderPlayers(players){
    results.replaceChildren();
    if(!players.length){const empty=document.createElement('div');empty.className='player-claim-empty';empty.textContent=query.value.trim()?'No claimable player matches that name. If your prepared record has game history, contact the league admin.':'No claimable prepared players found. You can create a new profile below if the league has not already added you.';results.append(empty);return}
    const nameCounts={};for(const p of players){const k=String(p.displayName||'').trim().toLowerCase();if(k)nameCounts[k]=(nameCounts[k]||0)+1}for(const player of players){player.isDuplicateName=(nameCounts[String(player.displayName||'').trim().toLowerCase()]||0)>1;const row=document.createElement('div');row.className='player-claim-option';const copy=document.createElement('div');const name=document.createElement('strong');name.textContent=player.displayName;const detail=document.createElement('div');detail.className='player-claim-context';detail.textContent=contextFor(player);copy.append(name,detail);const button=document.createElement('button');button.type='button';button.className='primary';button.textContent='Claim '+player.displayName;button.dataset.claimPlayer=player.playerId;button.dataset.claimName=player.displayName;row.append(copy,button);results.append(row)}
  }
  async function load(){
    if(!token())return;setStatus('Loading prepared players…');
    const value=query.value.trim();const body=await request('/api/me/player-claim-options'+(value?'?q='+encodeURIComponent(value):''),{method:'GET'});const options=body.options||{};
    if(options.canClaim===false){root.hidden=true;return}
    root.hidden=false;renderPlayers(options.players||[]);setStatus((options.players||[]).length?'Choose the prepared player that is you.':'No prepared player is ready to claim.');
  }
  async function claim(button){
    const playerId=button.dataset.claimPlayer;const name=button.dataset.claimName||'this player';
    if(!window.confirm('Claim '+name+' as my player profile?'))return;
    button.disabled=true;setStatus('Claiming '+name+'…');
    try{await request('/api/me/player-claim',{method:'POST',body:JSON.stringify({playerId})});setStatus('Profile claimed. Reloading your player history…','ok');setTimeout(()=>location.reload(),350)}catch(error){setStatus(error.message||'We could not complete that claim.','error');button.disabled=false;await load().catch(()=>{})}
  }
  form.addEventListener('submit',(event)=>{event.preventDefault();load().catch((error)=>{root.hidden=false;setStatus(error.message||'We could not search prepared players.','error')})});
  results.addEventListener('click',(event)=>{const button=event.target.closest('[data-claim-player]');if(button)claim(button)});
  setTimeout(()=>{if(token())load().catch((error)=>{root.hidden=false;setStatus(error.message||'We could not search prepared players.','error')})},0);
})();
</script>`;

export async function enhanceProfilePlayerClaim(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  let html = await response.text();
  const target = '<section class="stack" data-authenticated-content hidden>';
  if (!html.includes(target) || html.includes('data-player-claim')) return new Response(html, response);
  html = html
    .replace('</head>', `${style}</head>`)
    .replace(target, `${target}${card}`)
    .replace('</body>', `${script}</body>`);
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

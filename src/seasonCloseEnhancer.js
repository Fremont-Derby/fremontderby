const CLOSE_MARKER = 'data-season-close-workflow';

export async function enhanceSeasonClose(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  let html = await response.text();
  if (html.includes(CLOSE_MARKER)) {
    return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  }

  const closeUi = `
    <section ${CLOSE_MARKER} class="panel" style="margin-top:14px;padding:14px;display:grid;gap:10px" aria-labelledby="season-close-title">
      <div><strong id="season-close-title">Close season</strong><p data-season-close-copy style="margin:6px 0 0;color:var(--muted);line-height:1.45">Finish the championship before closing. Closing preserves standings, matches, player history, payments, and audit history.</p></div>
      <div data-season-close-state role="status" aria-live="polite" style="font-weight:800">Choose a season to check close readiness.</div>
      <div data-season-close-details style="color:var(--muted);font-size:.82rem;line-height:1.5"></div>
      <button class="danger" data-season-close-button type="button" style="min-height:48px;justify-self:start;padding:0 18px" disabled>Close season</button>
    </section>`;

  const closeScript = `<script data-season-close-script>
  (()=>{
    const selector=document.querySelector('[data-season-selector]');
    const state=document.querySelector('[data-season-close-state]');
    const details=document.querySelector('[data-season-close-details]');
    const button=document.querySelector('[data-season-close-button]');
    if(!selector||!state||!details||!button)return;
    let lastSeason='';let loading=false;
    function token(){return sessionStorage.getItem('fd.accessToken')||''}
    async function request(path,options={}){const auth=token();if(!auth)throw new Error('Sign in with Google to manage the season.');const response=await fetch(path,{...options,headers:{authorization:'Bearer '+auth,'content-type':'application/json',...(options.headers||{})}});const text=await response.text();let body={};try{body=text?JSON.parse(text):{}}catch{body={error:text}}if(response.status===401)sessionStorage.removeItem('fd.accessToken');if(!response.ok)throw new Error(body.error||'Request failed');return body}
    function render(readiness){const status=readiness?.season_status??readiness?.seasonStatus??'';const ready=Boolean(readiness?.ready);const championship=Boolean(readiness?.championship_finalized??readiness?.championshipFinalized);const post=Number(readiness?.unresolved_postseason_matches??readiness?.unresolvedPostseasonMatches??0);const players=Number(readiness?.unresolved_player_matches??readiness?.unresolvedPlayerMatches??0);state.textContent=readiness?.reason||'Close readiness unavailable.';details.textContent='Championship: '+(championship?'finalized':'not finalized')+' · Unresolved postseason: '+post+' · Unresolved player matches: '+players;button.disabled=!ready||status==='complete';button.textContent=status==='complete'?'Season closed':'Close season'}
    async function refresh(force=false){const seasonId=selector.value;if(!seasonId){lastSeason='';button.disabled=true;state.textContent='Choose a season to check close readiness.';details.textContent='';return}if(loading||(!force&&seasonId===lastSeason))return;loading=true;lastSeason=seasonId;button.disabled=true;state.textContent='Checking close readiness…';try{const body=await request('/api/admin/seasons/'+encodeURIComponent(seasonId)+'/close-readiness');render(body.readiness||{})}catch(error){state.textContent=error.message;details.textContent='';button.disabled=true}finally{loading=false}}
    button.addEventListener('click',async()=>{const seasonId=selector.value;if(!seasonId||button.disabled)return;if(!confirm('Close this season? Final standings, matches, player history, payments, and audit history will be preserved. New competitive activity will stop.'))return;button.disabled=true;state.textContent='Closing season…';try{await request('/api/admin/seasons/'+encodeURIComponent(seasonId)+'/close',{method:'POST'});lastSeason='';await refresh(true);if(typeof loadCurrent==='function')await loadCurrent()}catch(error){state.textContent=error.message;button.disabled=false}});
    selector.addEventListener('change',()=>{lastSeason='';refresh(true)});
    const observer=new MutationObserver(()=>refresh());observer.observe(selector,{childList:true,subtree:true,attributes:true});
    setTimeout(()=>refresh(true),0);
  })();
  </script>`;

  html = html.replace('</main>', `${closeUi}</main>${closeScript}`);
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

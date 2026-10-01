const CLOSE_MARKER = 'data-season-close-workflow';

export async function enhanceSeasonClose(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  let html = await response.text();
  if (html.includes(CLOSE_MARKER)) {
    return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  }

  const closeUi = `
    <style data-season-close-style>
      [data-season-close-workflow]{margin-top:14px;padding:14px;display:grid;gap:12px}
      [data-season-close-summary]{font-weight:950;font-size:1rem}
      [data-season-close-state]{font-weight:800;line-height:1.45}
      [data-season-close-checklist]{display:grid;gap:8px}
      .season-close-check{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px;border:1px solid var(--line);border-radius:8px;background:rgba(255,255,255,.025)}
      .season-close-check strong{min-width:76px;font-size:.78rem;text-transform:uppercase;letter-spacing:.02em}
      .season-close-check span{min-width:0;line-height:1.35}
      .season-close-check a{min-height:44px;display:inline-flex;align-items:center;padding:0 10px;border:1px solid var(--line);border-radius:8px;color:inherit;text-decoration:none;font-weight:850;white-space:nowrap}
      [data-season-close-retry]{min-height:44px;justify-self:start;padding:0 14px}
      [data-season-close-button]{min-height:48px;justify-self:start;padding:0 18px}
      @media(max-width:620px){.season-close-check{grid-template-columns:auto minmax(0,1fr)}.season-close-check a{grid-column:1/-1;width:100%;justify-content:center}[data-season-close-button],[data-season-close-retry]{width:100%;justify-self:stretch}}
    </style>
    <section ${CLOSE_MARKER} class="panel" aria-labelledby="season-close-title">
      <div><strong id="season-close-title">Close season</strong><p data-season-close-copy style="margin:6px 0 0;color:var(--muted);line-height:1.45">Finish the championship before closing. Closing preserves standings, matches, player history, payments, and audit history.</p></div>
      <div data-season-close-summary>Choose a season</div>
      <div data-season-close-state role="status" aria-live="polite">Choose a season to check close readiness.</div>
      <div data-season-close-checklist aria-label="Close season readiness"></div>
      <button class="ghost" data-season-close-retry type="button" hidden>Try again</button>
      <button class="danger" data-season-close-button type="button" disabled>Close season</button>
    </section>`;

  const closeScript = `<script data-season-close-script>
  (()=>{
    const selector=document.querySelector('[data-season-selector]');
    const summary=document.querySelector('[data-season-close-summary]');
    const state=document.querySelector('[data-season-close-state]');
    const checklist=document.querySelector('[data-season-close-checklist]');
    const retry=document.querySelector('[data-season-close-retry]');
    const button=document.querySelector('[data-season-close-button]');
    if(!selector||!summary||!state||!checklist||!retry||!button)return;
    let lastSeason='';let loading=false;
    function token(){return sessionStorage.getItem('fd.accessToken')||''}
    async function request(path,options={}){const auth=token();if(!auth)throw new Error('Sign in with Google to manage the season.');const response=await fetch(path,{...options,headers:{authorization:'Bearer '+auth,'content-type':'application/json',...(options.headers||{})}});const text=await response.text();let body={};try{body=text?JSON.parse(text):{}}catch{body={error:text}}if(response.status===401)sessionStorage.removeItem('fd.accessToken');if(!response.ok)throw new Error(body.error||'Request failed');return body}
    function read(source,snake,camel,fallback){const value=source?.[snake]??source?.[camel];return value==null?fallback:value}
    function addCheck(label,isReady,detail,href){const row=document.createElement('div');row.className='season-close-check';const status=document.createElement('strong');status.textContent=isReady?'Ready':'Blocked';status.setAttribute('aria-label',(isReady?'Ready: ':'Blocked: ')+label);const copy=document.createElement('span');copy.textContent=label+(detail?' — '+detail:'');row.append(status,copy);if(!isReady&&href){const link=document.createElement('a');link.href=href;link.textContent='Open Score';row.append(link)}checklist.append(row)}
    function render(readiness){const status=String(read(readiness,'season_status','seasonStatus',''));const ready=Boolean(readiness?.ready);const championship=Boolean(read(readiness,'championship_finalized','championshipFinalized',false));const post=Number(read(readiness,'unresolved_postseason_matches','unresolvedPostseasonMatches',0));const players=Number(read(readiness,'unresolved_player_matches','unresolvedPlayerMatches',0));const checks=[championship,post===0,players===0];const readyCount=checks.filter(Boolean).length;const blockedCount=checks.length-readyCount;summary.textContent=status==='complete'?'Season closed':readyCount+' ready • '+blockedCount+' blocked';state.textContent=readiness?.reason||'Close readiness unavailable.';checklist.replaceChildren();addCheck('Championship finalized',championship,championship?'':'Finish the championship before closing.','/scorecard');addCheck('Postseason matchups resolved',post===0,post===0?'':post+' matchup'+(post===1?'':'s')+' still unresolved.','/scorecard');addCheck('Player matches finalized',players===0,players===0?'':players+' player match'+(players===1?'':'es')+' still unresolved.','/scorecard');retry.hidden=true;button.disabled=!ready||status==='complete';button.textContent=status==='complete'?'Season closed':'Close season'}
    function reset(message='Choose a season to check close readiness.'){summary.textContent='Choose a season';state.textContent=message;checklist.replaceChildren();retry.hidden=true;button.disabled=true;button.textContent='Close season'}
    async function refresh(force=false){const seasonId=selector.value;if(!seasonId){lastSeason='';reset();return}if(loading||(!force&&seasonId===lastSeason))return;loading=true;lastSeason=seasonId;button.disabled=true;retry.hidden=true;summary.textContent='Loading readiness…';state.textContent='Loading close readiness…';checklist.replaceChildren();try{const body=await request('/api/admin/seasons/'+encodeURIComponent(seasonId)+'/close-readiness');render(body.readiness||{})}catch(error){summary.textContent='Readiness unavailable';state.textContent=error.message;checklist.replaceChildren();retry.hidden=false;button.disabled=true}finally{loading=false}}
    retry.addEventListener('click',()=>{lastSeason='';refresh(true)});
    button.addEventListener('click',async()=>{const seasonId=selector.value;if(!seasonId||button.disabled)return;if(!confirm('Close this season? Final standings, matches, player history, payments, and audit history will be preserved. New competitive activity will stop.'))return;button.disabled=true;retry.hidden=true;summary.textContent='Closing season…';state.textContent='Closing season…';try{await request('/api/admin/seasons/'+encodeURIComponent(seasonId)+'/close',{method:'POST'});lastSeason='';await refresh(true);if(typeof loadCurrent==='function')await loadCurrent()}catch(error){summary.textContent='Close failed';state.textContent=error.message;retry.hidden=false;button.disabled=false}});
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

const PUBLISH_MARKER = 'data-season-publish-readiness';

export async function enhanceSeasonPublishReadiness(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  let html = await response.text();
  if (html.includes(PUBLISH_MARKER)) {
    return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  }

  const ui = `
    <style data-season-publish-readiness-style>
      [data-season-publish-readiness]{margin:14px 0;padding:14px;display:grid;gap:10px}
      [data-publish-readiness-summary]{font-weight:950;font-size:1rem}
      [data-publish-readiness-state]{font-weight:800;line-height:1.45;color:var(--muted)}
      [data-publish-readiness-checklist]{display:grid;gap:8px}
      .publish-check{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px;border:1px solid var(--line);border-radius:8px;background:rgba(255,255,255,.025)}
      .publish-check strong{min-width:104px;font-size:.76rem;text-transform:uppercase;letter-spacing:.02em}
      .publish-check span{min-width:0;line-height:1.35}
      .publish-check a,[data-publish-readiness-retry]{min-height:44px;display:inline-flex;align-items:center;justify-content:center;padding:0 12px;border:1px solid var(--line);border-radius:8px;color:inherit;text-decoration:none;font-weight:850;white-space:nowrap}
      [data-publish-readiness-retry]{justify-self:start;background:transparent}
      @media(max-width:620px){.publish-check{grid-template-columns:auto minmax(0,1fr)}.publish-check a{grid-column:1/-1;width:100%}[data-publish-readiness-retry]{width:100%;justify-self:stretch}}
    </style>
    <section ${PUBLISH_MARKER} class="panel" aria-labelledby="publish-readiness-title">
      <div><strong id="publish-readiness-title">Publish readiness</strong><p style="margin:6px 0 0;color:var(--muted);line-height:1.45">Check the season before publishing the seven-round schedule.</p></div>
      <div data-publish-readiness-summary>Choose a season</div>
      <div data-publish-readiness-state role="status" aria-live="polite">Choose a season to check publish readiness.</div>
      <div data-publish-readiness-checklist aria-label="Publish season readiness"></div>
      <button class="ghost" data-publish-readiness-retry type="button" hidden>Try again</button>
    </section>`;

  const script = `<script data-season-publish-readiness-script>
  (()=>{
    const selector=document.querySelector('[data-season-selector]');const publish=document.querySelector('[data-publish]');const form=document.querySelector('[data-season-setup-form]');const summary=document.querySelector('[data-publish-readiness-summary]');const state=document.querySelector('[data-publish-readiness-state]');const checklist=document.querySelector('[data-publish-readiness-checklist]');const retry=document.querySelector('[data-publish-readiness-retry]');
    if(!selector||!publish||!form||!summary||!state||!checklist||!retry)return;form.id=form.id||'season-setup-form';let lastSeason='';let loading=false;let allowed=false;
    function token(){return sessionStorage.getItem('fd.accessToken')||''}
    async function request(path){const auth=token();if(!auth)throw new Error('Sign in with Google to manage the season.');const response=await fetch(path,{headers:{authorization:'Bearer '+auth,'content-type':'application/json'}});const text=await response.text();let body={};try{body=text?JSON.parse(text):{}}catch{body={error:text}}if(response.status===401)sessionStorage.removeItem('fd.accessToken');if(!response.ok)throw new Error(body.error||'Request failed');return body}
    function value(source,snake,camel,fallback){const found=source?.[snake]??source?.[camel];return found==null?fallback:found}
    function add(label,status,detail,href,action){const row=document.createElement('div');row.className='publish-check';const badge=document.createElement('strong');badge.textContent=status;badge.setAttribute('aria-label',status+': '+label);const copy=document.createElement('span');copy.textContent=label+(detail?' — '+detail:'');row.append(badge,copy);if(href){const link=document.createElement('a');link.href=href;link.textContent=action||'Fix';row.append(link)}checklist.append(row)}
    function render(setup,teamState){const registration=teamState?.registration||{};const teams=teamState?.teams||[];const seasonStatus=String(setup?.status||registration?.seasonStatus||'');const capacity=Number(registration?.teamCapacity||8);const counts=registration?.counts||{};const confirmed=Number(counts.confirmedTeams||0);const confirmedTeams=teams.filter(team=>(team.slot_workflow_status??team.slotWorkflowStatus)==='confirmed');const missingCaptain=confirmedTeams.filter(team=>!(team.captain_player_id??team.captainPlayerId)).length;const missingPhone=confirmedTeams.filter(team=>(team.captain_player_id??team.captainPlayerId)&&!(team.captain_has_phone??team.captainHasPhone)).length;const firstRound=setup?.first_round_date||setup?.firstRoundDate||'';const tables=setup?.default_table_numbers||setup?.defaultTableNumbers||[];const interval=Number(setup?.round_interval_days||setup?.roundIntervalDays||0);const roundCount=Array.isArray(setup?.rounds)?setup.rounds.length:0;const waiting=Number(counts.applicationsWaiting||0);const blocking=[['Season can publish',['draft','registration'].includes(seasonStatus)],['Team field is full',confirmed===capacity],['Every confirmed team has a captain',missingCaptain===0&&confirmed===capacity],['Every confirmed captain has phone contact',missingPhone===0&&confirmed===capacity],['Schedule setup is complete',Boolean(firstRound)&&Array.isArray(tables)&&tables.length===4&&interval>0],['Schedule has not already been published',roundCount===0]];const readyCount=blocking.filter(([,ok])=>ok).length;const blockedCount=blocking.length-readyCount;summary.textContent=readyCount+' ready • '+blockedCount+' blocked'+(waiting?' • 1 needs attention':'');state.textContent=blockedCount?'Resolve blocked items before publishing.':'Publish blockers are clear. Review any advisory items, then publish when intentional.';checklist.replaceChildren();const teamHref='/admin/season-teams?season='+encodeURIComponent(selector.value);add('Season status',blocking[0][1]?'Ready':'Blocked',blocking[0][1]?seasonStatus:'Season must still be Draft or Registration.',blocking[0][1]?'':'#season-setup-form','Edit setup');add('Confirmed teams',blocking[1][1]?'Ready':'Blocked',confirmed+' of '+capacity+' confirmed.',blocking[1][1]?'':teamHref,'Manage teams');add('Team captains',blocking[2][1]?'Ready':'Blocked',missingCaptain?missingCaptain+' confirmed team'+(missingCaptain===1?'':'s')+' missing a captain.':'Captain assigned for every confirmed team.',blocking[2][1]?'':teamHref,'Assign captain');add('Captain contact',blocking[3][1]?'Ready':'Blocked',missingPhone?missingPhone+' captain'+(missingPhone===1?'':'s')+' missing phone contact.':'Phone contact on file for every confirmed captain.',blocking[3][1]?'':teamHref,'Fix contact');add('Schedule configuration',blocking[4][1]?'Ready':'Blocked',blocking[4][1]?'First round, interval, and four tables configured.':'Complete the first round date, interval, and four-table setup.',blocking[4][1]?'':'#season-setup-form','Edit setup');add('Existing schedule',blocking[5][1]?'Ready':'Blocked',roundCount?roundCount+' round'+(roundCount===1?'':'s')+' already published.':'No published rounds yet.',null);add('Registration queue',waiting?'Needs attention':'Ready',waiting?waiting+' application'+(waiting===1?'':'s')+' still waiting for review.':'No waiting team applications.',waiting?teamHref:null,waiting?'Review teams':null);allowed=blockedCount===0;publish.disabled=!allowed;retry.hidden=true}
    function reset(message='Choose a season to check publish readiness.'){allowed=false;summary.textContent='Choose a season';state.textContent=message;checklist.replaceChildren();retry.hidden=true;publish.disabled=true}
    async function refresh(force=false){const seasonId=selector.value;if(!seasonId){lastSeason='';reset();return}if(loading||(!force&&seasonId===lastSeason))return;loading=true;lastSeason=seasonId;allowed=false;publish.disabled=true;retry.hidden=true;summary.textContent='Checking readiness…';state.textContent='Checking publish readiness…';checklist.replaceChildren();try{const [setupBody,teamState]=await Promise.all([request('/api/admin/seasons/'+encodeURIComponent(seasonId)+'/setup'),request('/api/admin/seasons/'+encodeURIComponent(seasonId)+'/team-candidates')]);render(setupBody.setup||{},teamState||{})}catch(error){summary.textContent='Readiness unavailable';state.textContent=error.message;checklist.replaceChildren();retry.hidden=false;publish.disabled=true}finally{loading=false}}
    retry.addEventListener('click',()=>{lastSeason='';refresh(true)});selector.addEventListener('change',()=>{lastSeason='';refresh(true)});const observer=new MutationObserver(()=>refresh());observer.observe(selector,{childList:true,subtree:true,attributes:true});form.addEventListener('submit',()=>{lastSeason='';setTimeout(()=>refresh(true),0)});publish.addEventListener('click',()=>{allowed=false;publish.disabled=true;lastSeason='';setTimeout(()=>refresh(true),500)});setTimeout(()=>refresh(true),0);
  })();
  </script>`;

  html = html.replace('</form>', `</form>${ui}${script}`);
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

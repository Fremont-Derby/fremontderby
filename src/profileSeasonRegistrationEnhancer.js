const style = `<style data-profile-season-status>
  .season-now{display:grid;gap:12px;padding:12px}.season-now-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.season-now h2{margin:0;font-size:1.15rem}.season-now-sub{margin-top:4px;color:var(--muted);font-size:.84rem;line-height:1.4}.season-now-states{display:flex;flex-wrap:wrap;gap:8px}.season-now-state{display:inline-flex;align-items:center;min-height:32px;padding:0 10px;border:1px solid var(--line);border-radius:999px;font-size:.78rem;font-weight:900}.season-now-state[data-kind="registered"]{border-color:#2f7d57}.season-now-state[data-kind="due"]{border-color:#9c7422}.season-now-state[data-kind="paid"]{border-color:#2f7d57}.season-now-action{min-height:48px;padding:0 16px}.season-now-note{color:var(--muted);font-size:.82rem;line-height:1.45}.season-now-error{color:#9b3129;font-weight:800}.season-now [hidden]{display:none!important}@media(max-width:600px){.season-now-head{display:grid}.season-now-action{width:100%}}
</style>`;

const card = `<article class="panel" data-season-now>
  <div class="panel-head"><span>Current season</span><span class="badge" data-season-now-badge>Checking…</span></div>
  <div class="season-now" role="region" aria-label="Current season registration and payment status">
    <div class="season-now-head">
      <div><h2 data-season-now-name>Loading season…</h2><div class="season-now-sub" data-season-now-copy>Loading your registration and payment status.</div></div>
      <button class="primary season-now-action" data-season-now-action type="button" hidden>Join this season</button>
    </div>
    <div class="season-now-states" data-season-now-states hidden>
      <span class="season-now-state" data-registration-state>Not registered</span>
      <span class="season-now-state" data-payment-state>Payment status unavailable</span>
    </div>
    <div class="season-now-note" data-season-now-note></div>
    <div class="season-now-error" role="status" aria-live="polite" data-season-now-error hidden></div>
  </div>
</article>`;

const script = `<script data-profile-season-status-script>
(() => {
  const root=document.querySelector('[data-season-now]');
  if(!root)return;
  const nameEl=root.querySelector('[data-season-now-name]');
  const badge=root.querySelector('[data-season-now-badge]');
  const copy=root.querySelector('[data-season-now-copy]');
  const states=root.querySelector('[data-season-now-states]');
  const registrationState=root.querySelector('[data-registration-state]');
  const paymentState=root.querySelector('[data-payment-state]');
  const action=root.querySelector('[data-season-now-action]');
  const note=root.querySelector('[data-season-now-note]');
  const errorEl=root.querySelector('[data-season-now-error]');
  let selectedSeason=null;
  let currentRegistration=null;

  function token(){return sessionStorage.getItem('fd.accessToken')||''}
  async function parseJson(response){const text=await response.text();if(!text)return{};try{return JSON.parse(text)}catch{return{error:text}}}
  async function request(path,options={},retry=true){
    const accessToken=token();
    if(!accessToken)throw new Error('Sign in to join the season.');
    const response=await fetch(path,{...options,headers:{authorization:'Bearer '+accessToken,'content-type':'application/json',...(options.headers||{})}});
    if(response.status===401&&retry){await new Promise((resolve)=>setTimeout(resolve,250));const refreshed=token();if(refreshed&&refreshed!==accessToken)return request(path,options,false)}
    const body=await parseJson(response);if(!response.ok)throw new Error(body.error||'Request failed');return body;
  }
  async function publicJson(path){const response=await fetch(path);const body=await parseJson(response);if(!response.ok)throw new Error(body.error||'Request failed');return body}
  function paymentLabel(value){const status=String(value||'unpaid').toLowerCase();if(status==='paid')return'Paid';if(status==='waived')return'Waived';if(status==='refunded')return'Refunded';return'Payment due'}
  function paymentKind(value){return ['paid','waived'].includes(String(value||'').toLowerCase())?'paid':'due'}
  function showError(error){errorEl.hidden=false;errorEl.textContent=(error&&error.message)||'We could not load your season status. Please try again.';action.hidden=false;action.textContent='Try again';action.dataset.mode='retry';badge.textContent='Could not load'}
  function renderClosed(season){selectedSeason=season||null;currentRegistration=null;nameEl.textContent=season?.name||'Fremont Derby';badge.textContent='Registration closed';copy.textContent='Registration is not currently open.';states.hidden=true;action.hidden=true;note.textContent='You can still review the schedule and rules while waiting for the next registration window.';errorEl.hidden=true}
  function renderRegistration(registration){
    currentRegistration=registration||null;errorEl.hidden=true;states.hidden=false;
    if(!registration){badge.textContent='Join now';registrationState.textContent='Not registered';registrationState.dataset.kind='';paymentState.textContent='Payment not started';paymentState.dataset.kind='';copy.textContent='Join this season even if you do not have a team yet.';action.hidden=false;action.textContent='Join this season';action.dataset.mode='join';note.textContent='Registration and payment are separate. You can register first and be marked paid later.';return}
    badge.textContent='Registered';registrationState.textContent='Registered';registrationState.dataset.kind='registered';paymentState.textContent=paymentLabel(registration.paymentStatus);paymentState.dataset.kind=paymentKind(registration.paymentStatus);copy.textContent='You are registered for this season.';action.hidden=true;note.textContent=registration.paymentStatus==='paid'?'Your payment has been recorded.':'Your registration is complete. Payment is still tracked separately by the league.';
  }
  async function load(){
    errorEl.hidden=true;action.hidden=true;badge.textContent='Loading…';copy.textContent='Loading your registration and payment status.';
    const seasonsBody=await publicJson('/api/seasons');const seasons=seasonsBody.seasons||[];
    const open=seasons.find((season)=>season.status==='registration');
    if(!open){renderClosed(seasons.find((season)=>['active','playoffs','published'].includes(season.status))||seasons[0]||null);return}
    selectedSeason=open;nameEl.textContent=open.name;badge.textContent='Checking…';
    const statusBody=await request('/api/seasons/'+encodeURIComponent(open.id)+'/registration/me',{method:'GET'});renderRegistration(statusBody.registration||null);
  }
  async function join(){
    if(!selectedSeason)throw new Error('Registration is not open.');
    action.disabled=true;action.textContent='Joining…';errorEl.hidden=true;
    try{
      const profileBody=await request('/api/me/profile',{method:'GET'});const teams=profileBody.profile?.teams||[];
      const rostered=teams.some((team)=>team.seasonId===selectedSeason.id&&!team.endsAt);
      const body=await request('/api/seasons/'+encodeURIComponent(selectedSeason.id)+'/registration/me',{method:'POST',body:JSON.stringify({participationType:rostered?'rostered':'free_agent'})});renderRegistration(body.registration);
    }finally{action.disabled=false}
  }
  action.addEventListener('click',()=>{const mode=action.dataset.mode;Promise.resolve(mode==='join'?join():load()).catch(showError)});
  const start=()=>{if(token())load().catch(showError)};
  setTimeout(start,0);
})();
</script>`;

export async function enhanceProfileSeasonRegistration(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  let html = await response.text();
  const target = '<section class="stack" data-authenticated-content hidden>';
  if (!html.includes(target) || html.includes('data-season-now')) {
    return new Response(html, response);
  }
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

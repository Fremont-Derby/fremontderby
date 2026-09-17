const script = `<script data-test-persona-script>
(() => {
  const ENDPOINT='/api/test-persona';
  function token(){try{return sessionStorage.getItem('fd.accessToken')||''}catch{return''}}
  async function parseJson(response){const text=await response.text();if(!text)return{};try{return JSON.parse(text)}catch{return{error:text}}}
  async function request(method,body){
    const accessToken=token();if(!accessToken)return null;
    const response=await fetch(ENDPOINT,{method,headers:{authorization:'Bearer '+accessToken,'content-type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store'}).catch(()=>null);
    if(!response||response.status===404||response.status===401||response.status===403)return null;
    const data=await parseJson(response);if(!response.ok)throw new Error(data.error||'Test persona request failed');return data;
  }
  function addBanner(current,environment){
    document.querySelector('[data-test-persona-banner]')?.remove();
    if(!current)return;
    const banner=document.createElement('div');banner.dataset.testPersonaBanner='';banner.setAttribute('role','status');
    banner.style.cssText='position:sticky;top:0;z-index:2000;padding:7px 14px;background:#f2c94c;color:#17130a;text-align:center;font:900 .78rem/1.2 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.04em;border-bottom:2px solid #8a6b00';
    banner.textContent='TEST PERSONA · '+String(environment||'TEST').toUpperCase()+' · '+current.label;
    document.body.prepend(banner);
  }
  function buildProfileControl(state){
    if(location.pathname!=='/profile'||document.querySelector('[data-test-persona-control]'))return;
    const authenticated=document.querySelector('[data-authenticated-content]');if(!authenticated)return;
    const card=document.createElement('article');card.className='panel';card.dataset.testPersonaControl='';
    card.style.cssText='border-color:#8a6b00;background:linear-gradient(145deg,#302814,#171b19 58%)';
    const head=document.createElement('div');head.className='panel-head';
    const title=document.createElement('span');title.textContent='Test Persona';
    const badge=document.createElement('span');badge.className='badge';badge.textContent=String(state.environment||'test').toUpperCase()+' ONLY';
    head.append(title,badge);
    const body=document.createElement('div');body.className='stack';
    const copy=document.createElement('div');copy.className='hint';copy.textContent='Switch the server-side test identity without signing out. This control is unavailable in production.';
    const label=document.createElement('label');label.textContent='Assume persona';
    const select=document.createElement('select');select.dataset.testPersonaSelect='';select.style.cssText='width:100%;min-height:48px;border:1px solid var(--line,#343b3c);border-radius:8px;background:#0d1010;color:#f6f1e7;padding:0 12px;font:inherit';
    const real=document.createElement('option');real.value='';real.textContent='Real signed-in user';select.append(real);
    for(const persona of state.personas||[]){const option=document.createElement('option');option.value=persona.key;option.textContent=persona.label;select.append(option)}
    select.value=state.current?.key||'';
    const status=document.createElement('div');status.className='hint';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.textContent=state.current?'Currently assuming '+state.current.label+'.':'Using the real signed-in user.';
    label.append(select);body.append(copy,label,status);card.append(head,body);authenticated.prepend(card);
    select.addEventListener('change',async()=>{
      select.disabled=true;status.textContent='Switching persona…';
      try{
        const next=select.value?await request('POST',{persona:select.value}):await request('DELETE');
        if(!next)throw new Error('Test persona access is unavailable.');
        location.reload();
      }catch(error){status.textContent=error.message||'Could not switch persona.';select.disabled=false}
    });
  }
  async function boot(){
    const state=await request('GET');if(!state)return;
    addBanner(state.current,state.environment);buildProfileControl(state);
  }
  const logout=document.querySelector('[data-logout]');
  if(logout)logout.addEventListener('click',()=>{const accessToken=token();if(accessToken)fetch(ENDPOINT,{method:'DELETE',headers:{authorization:'Bearer '+accessToken},keepalive:true,cache:'no-store'}).catch(()=>{})},{capture:true});
  setTimeout(()=>boot().catch(()=>{}),0);
})();
</script>`;

export async function injectTestPersonaControls(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  let html = await response.text();
  if (html.includes('data-test-persona-script')) return new Response(html, response);
  html = html.replace('</body>', `${script}</body>`);
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

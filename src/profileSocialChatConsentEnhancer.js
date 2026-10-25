function privacy(channel, label) {
const card = `<article class="panel" data-social-${channel}-consent>
  <div class="panel-head">Messaging privacy</div>
  <form style="display:grid;gap:12px;padding:12px" data-social-${channel}-consent-form>
    <label style="display:flex;align-items:center;gap:10px"><input type="checkbox" data-social-${channel}-consent-toggle disabled style="width:24px;height:24px" /> Allow ${label}</label>
    <p>${label} is off until you choose to enable it. Turning it off stops participation and new messages in this channel, including from an already open chat.</p>
    <p>Your schedule, lineup, scoring and required league notices remain available with social chat off. Each messaging channel has its own setting.</p>
    <button class="primary" type="submit" data-social-${channel}-consent-save disabled>Save messaging privacy</button>
    <button type="button" data-social-${channel}-consent-reload>Reload messaging privacy</button>
    <div role="status" aria-live="polite" data-social-${channel}-consent-status>Sign in to load messaging privacy.</div>
  </form>
</article>`;

const script = `<script data-social-${channel}-consent-script>
(() => {
  const root=document.querySelector('[data-social-${channel}-consent]');if(!root)return;
  const toggle=root.querySelector('[data-social-${channel}-consent-toggle]'),save=root.querySelector('[data-social-${channel}-consent-save]'),reload=root.querySelector('[data-social-${channel}-consent-reload]'),status=root.querySelector('[data-social-${channel}-consent-status]');
  let generation=0,lastToken='',loaded=false,busy=false,retryUntil=0,retryTimer;
  const clearRetry=()=>{clearTimeout(retryTimer);retryUntil=0;};
  function retrySeconds(value){
    if(!value)return 0;
    const raw=value.trim();
    const seconds=/^\\d+(?:\\.\\d+)?$/.test(raw)?Math.ceil(Number(raw)):
      /^[A-Za-z]{3}, \\d{2} [A-Za-z]{3} \\d{4} \\d{2}:\\d{2}:\\d{2} GMT$/.test(raw)?Math.ceil((Date.parse(raw)-Date.now())/1000):0;
    return Number.isFinite(seconds)&&seconds>0&&seconds<=86400?seconds:0;
  }
  const token=()=>sessionStorage.getItem('fd.accessToken')||'';
  const controls=()=>{toggle.disabled=busy||!loaded;save.disabled=busy||!loaded;reload.disabled=busy||!token()||Date.now()<retryUntil};
  async function request(method,value){
    const current=token(),id=++generation;clearRetry();loaded=false;busy=true;controls();status.textContent=method==='PUT'?'Saving messaging privacy…':'Loading messaging privacy…';
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch('/api/me/social-chat-consent/${channel}',{method,headers:{authorization:'Bearer '+current,'content-type':'application/json'},signal:controller.signal,...(method==='PUT'?{body:JSON.stringify({enabled:value})}:{})});
      if(id!==generation||current!==token())return;
      if(response.status===429){
        const seconds=retrySeconds(response.headers.get('Retry-After'));
        toggle.checked=false;
        status.textContent='Could not confirm messaging privacy: temporarily rate limited. '+(method==='PUT'?'Save was not confirmed. ':'')+
          (seconds?'Wait '+seconds+' seconds, then select Reload messaging privacy.':'Wait before selecting Reload messaging privacy to try again.')+
          ' Confirm the saved setting before choosing and saving a new change.';
        if(seconds){retryUntil=Date.now()+seconds*1000;retryTimer=setTimeout(()=>{
          if(id!==generation||current!==token())return;
          retryUntil=0;controls();status.textContent='Select Reload messaging privacy to confirm the saved setting before choosing and saving a new change.';
        },seconds*1000);}
        return;
      }
      const body=await response.json();if(id!==generation||current!==token())return;
      if(!response.ok||typeof body.enabled!=='boolean')throw new Error('Could not confirm messaging privacy. Reload to try again.');
      toggle.checked=body.enabled;loaded=true;status.textContent=body.enabled?'${label} is ON.':'${label} is OFF.';
    }catch(error){if(id===generation&&current===token()){toggle.checked=false;status.textContent='Could not confirm messaging privacy. Reload to try again.';}}
    finally{clearTimeout(timer);if(id===generation){busy=false;controls();}}
  }
  function sync(){const current=token();if(current===lastToken)return;lastToken=current;++generation;clearRetry();loaded=false;busy=false;toggle.checked=false;controls();if(current)request('GET');else status.textContent='Sign in to load messaging privacy.';}
  root.querySelector('form').addEventListener('submit',event=>{event.preventDefault();if(loaded&&!busy)request('PUT',toggle.checked)});
  reload.addEventListener('click',()=>{if(!busy&&token()&&Date.now()>=retryUntil)request('GET')});
  window.addEventListener('storage',sync);window.addEventListener('fd:session-changed',sync);
  const state=document.querySelector('[data-session-state]');if(state)new MutationObserver(sync).observe(state,{childList:true,characterData:true,subtree:true});
  setTimeout(sync,0);
})();
</script>`;

return { card, script };
}

export async function enhanceProfileSocialChatConsent(response) {
  if (!(response.headers.get('content-type') || '').includes('text/html')) return response;
  let html = await response.text();
  const target = '<section class="stack" data-authenticated-content hidden>';
  if (html.includes(target) && !html.includes('data-social-general-consent-form')) {
    const sections = [privacy('general', 'General Chat'), privacy('team', 'Team Chat')];
    html = html.replace(target, target + sections.map(section => section.card).join(''))
      .replace('</body>', sections.map(section => section.script).join('') + '</body>');
  }
  return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
}


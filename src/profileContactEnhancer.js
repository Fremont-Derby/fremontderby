const style = `<style data-profile-contact-style>
  .profile-contact{display:grid;gap:12px;padding:12px}
  .profile-contact-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end}
  .profile-contact-actions{display:flex;flex-wrap:wrap;gap:8px}
  .profile-contact-note{color:var(--muted);font-size:.82rem;line-height:1.45}
  .profile-contact-state{font-size:.82rem;font-weight:900}
  .profile-contact-state[data-ready="true"]{color:#26734e}
  .profile-contact-error{color:#9b3129;font-weight:800}
  .profile-contact button{min-height:48px;padding:0 16px}
  .profile-contact [hidden]{display:none!important}
  .profile-contact-masked{font-variant-numeric:tabular-nums;letter-spacing:.04em;font-weight:800}
  @media(max-width:600px){
    .profile-contact-row{grid-template-columns:1fr}
    .profile-contact button{width:100%}
  }
</style>`;

const card = `<article class="panel" data-profile-contact>
  <div class="panel-head"><span>Private contact</span><span class="badge" data-contact-badge>Checking…</span></div>
  <form class="profile-contact" data-contact-form>
    <div class="profile-contact-row">
      <label>Phone number
        <input type="tel" inputmode="tel" autocomplete="off" data-contact-phone placeholder="Add a phone number" aria-describedby="contact-privacy" />
      </label>
      <button class="primary" data-contact-save type="submit">Save phone</button>
    </div>
    <div class="profile-contact-actions">
      <button type="button" class="ghost" data-contact-reveal hidden>Show phone number</button>
      <button type="button" class="ghost" data-contact-hide hidden>Hide phone number</button>
    </div>
    <div class="profile-contact-state" data-contact-state></div>
    <div class="profile-contact-note" id="contact-privacy">Your phone number is private league-administration contact. Other players never see it. It is hidden on this screen until you choose <strong>Show phone number</strong>. A phone number is required before you can serve as an active team captain.</div>
    <div class="profile-contact-error" role="status" aria-live="polite" data-contact-error hidden></div>
  </form>
</article>`;

const script = `<script data-profile-contact-script>
(() => {
  const root=document.querySelector('[data-profile-contact]');if(!root)return;
  const form=root.querySelector('[data-contact-form]');
  const phone=root.querySelector('[data-contact-phone]');
  const save=root.querySelector('[data-contact-save]');
  const badge=root.querySelector('[data-contact-badge]');
  const state=root.querySelector('[data-contact-state]');
  const errorEl=root.querySelector('[data-contact-error]');
  const revealBtn=root.querySelector('[data-contact-reveal]');
  const hideBtn=root.querySelector('[data-contact-hide]');
  let revealed=false;
  let hasPhone=false;

  function token(){return sessionStorage.getItem('fd.accessToken')||''}
  async function parseJson(response){const text=await response.text();if(!text)return{};try{return JSON.parse(text)}catch{return{error:text}}}
  async function request(path,options={},retry=true){
    const accessToken=token();
    if(!accessToken)throw new Error('Sign in to manage your contact information.');
    const response=await fetch(path,{...options,headers:{authorization:'Bearer '+accessToken,'content-type':'application/json',...(options.headers||{})}});
    if(response.status===401&&retry){
      await new Promise(resolve=>setTimeout(resolve,250));
      const refreshed=token();
      if(refreshed&&refreshed!==accessToken)return request(path,options,false);
    }
    const body=await parseJson(response);
    if(!response.ok)throw new Error(body.error||'Request failed');
    return body;
  }

  function setRevealed(next){
    revealed=Boolean(next);
    revealBtn.hidden=!hasPhone||revealed;
    hideBtn.hidden=!hasPhone||!revealed;
    if(!revealed){
      phone.value='';
      phone.placeholder=hasPhone?'Phone on file — hidden':'Add a phone number';
      phone.autocomplete='off';
    }else{
      phone.placeholder='(206) 555-0123';
      phone.autocomplete='tel';
    }
  }

  function renderMasked(contact){
    hasPhone=Boolean(contact?.hasPhone);
    badge.textContent=hasPhone?'Contact on file':'Phone missing';
    state.dataset.ready=String(hasPhone);
    const masked=contact?.phoneMasked||'••••';
    state.innerHTML=hasPhone
      ? 'Phone on file for league administration: <span class="profile-contact-masked">'+masked+'</span>.'
      : 'No phone is on file. Normal player features still work; active captaincy requires a phone.';
    errorEl.hidden=true;
    setRevealed(false);
  }

  function showError(error){
    errorEl.hidden=false;
    errorEl.textContent=error?.message||'We could not update your phone number. Nothing was changed.';
    badge.textContent='Could not save';
  }

  async function load(){
    badge.textContent='Checking…';
    // WHY: default GET omits full phone; UI stays masked until explicit reveal.
    const body=await request('/api/me/contact',{method:'GET'});
    renderMasked(body.contact);
  }

  async function revealPhone(){
    badge.textContent='Revealing…';
    const body=await request('/api/me/contact?reveal=1',{method:'GET'});
    hasPhone=Boolean(body.contact?.hasPhone);
    phone.value=body.contact?.phone||'';
    state.dataset.ready=String(hasPhone);
    state.textContent=hasPhone?'Phone visible on this device only. Hide it when you are done.':'No phone is on file.';
    badge.textContent=hasPhone?'Visible':'Phone missing';
    setRevealed(true);
  }

  async function hidePhone(){
    phone.value='';
    const body=await request('/api/me/contact',{method:'GET'});
    renderMasked(body.contact);
  }

  async function savePhone(){
    save.disabled=true;save.textContent='Saving…';errorEl.hidden=true;
    try{
      const body=await request('/api/me/contact',{method:'PUT',body:JSON.stringify({phone:phone.value.trim()||null})});
      renderMasked(body.contact);
    }finally{
      save.disabled=false;save.textContent='Save phone';
    }
  }

  form.addEventListener('submit',event=>{event.preventDefault();savePhone().catch(showError)});
  revealBtn.addEventListener('click',()=>revealPhone().catch(showError));
  hideBtn.addEventListener('click',()=>hidePhone().catch(showError));
  setTimeout(()=>{if(token())load().catch(showError)},0);
})();
</script>`;

export async function enhanceProfileContact(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  let html = await response.text();
  const target = '<section class="stack" data-authenticated-content hidden>';
  if (!html.includes(target) || html.includes('data-profile-contact')) return new Response(html, response);
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

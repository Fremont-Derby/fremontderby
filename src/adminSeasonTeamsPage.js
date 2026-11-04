export function renderAdminSeasonTeamsPage({ creationOperations = false } = {}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Fremont Derby · Season teams</title>
  <style>
    :root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#0c1210;color:#f6f1e7;--panel:#152019;--line:#32473a;--muted:#a8b7ae;--green:#43bd7d;--gold:#e6bd46;--red:#e36c61}*{box-sizing:border-box}body{margin:0;background:#0c1210;color:#f6f1e7}.app{width:min(760px,100%);margin:auto;padding:14px}.head{display:grid;gap:7px;margin-bottom:14px}.head h1{margin:0;font-size:clamp(1.55rem,7vw,2.25rem)}.head p{margin:0;color:var(--muted);line-height:1.4}.toolbar{display:grid;gap:10px;padding:12px;border:1px solid var(--line);border-radius:14px;background:var(--panel)}label{display:grid;gap:5px;color:var(--muted);font-size:.76rem;font-weight:850}select,input,button{font:inherit}select,input{width:100%;min-height:46px;border:1px solid var(--line);border-radius:10px;background:#0c1410;color:#fff;padding:0 12px}.capacity{display:flex;justify-content:space-between;gap:8px;align-items:baseline}.capacity strong{font-size:1.35rem}.capacity span{color:var(--muted);font-size:.78rem}.create{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:end;padding-top:10px;border-top:1px solid var(--line)}.create button{min-height:46px;padding:0 16px;border:1px solid var(--green);border-radius:10px;background:var(--green);color:#07110b;font-weight:950;cursor:pointer}.create[hidden]{display:none}.tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:12px 0}.tab,.add,.captain,.roster-link{min-height:48px;border-radius:11px;border:1px solid var(--line);font-weight:950;cursor:pointer}.tab{background:#151d18;color:#e7eee9}.tab[aria-pressed=true]{background:var(--gold);color:#151003;border-color:var(--gold)}.list{display:grid;gap:9px}.card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:12px}.card h2{font-size:1rem;margin:0 0 4px}.meta{color:var(--muted);font-size:.75rem;line-height:1.45}.card-actions{display:grid;gap:7px;min-width:140px}.add{background:var(--green);color:#07110b;border-color:var(--green);padding:0 14px}.captain{background:var(--gold);color:#151003;border-color:var(--gold);padding:0 14px}.roster-link{display:flex;align-items:center;justify-content:center;background:transparent;color:#dff0e6;text-decoration:none;padding:0 14px}.captain-picker{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:end;padding-top:10px;border-top:1px solid var(--line)}.captain-picker button{min-height:46px;border:1px solid var(--gold);border-radius:10px;background:var(--gold);color:#151003;padding:0 14px;font-weight:950;cursor:pointer}.picker-help{grid-column:1/-1;color:var(--muted);font-size:.72rem;line-height:1.4}.add:disabled,.captain:disabled,.captain-picker button:disabled,.tab:disabled,select:disabled,input:disabled,.create button:disabled{opacity:.5;cursor:not-allowed}.state{position:fixed;left:50%;bottom:16px;z-index:20;width:min(520px,calc(100% - 28px));min-height:44px;transform:translateX(-50%);display:flex;align-items:center;padding:10px 14px;border:1px solid var(--line);border-radius:12px;background:#18231c;color:#e8f0eb;font-size:.84rem;font-weight:800;box-shadow:0 14px 36px rgba(0,0,0,.34)}.state:empty{display:none}.state[data-tone=error]{border-color:#8d4841;background:#351916;color:#ffd2cd}.state[data-tone=ok]{border-color:#3d7654;background:#132c1d;color:#c9f3d8}.empty{padding:24px 12px;text-align:center;color:var(--muted);border:1px dashed var(--line);border-radius:14px}.links{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}.links a{color:#bcebd0;font-weight:850;text-decoration:none}button:focus-visible,select:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid #a7ebc1;outline-offset:2px}@media(max-width:520px){.app{padding:10px}.card,.create,.captain-picker{grid-template-columns:1fr}.card-actions{min-width:0}.add,.captain,.roster-link,.create button,.captain-picker button{width:100%}.tabs{gap:5px}.tab{font-size:.78rem;padding:4px}.state{left:10px;right:10px;bottom:10px;width:auto;transform:none}}
  .directory-tools{display:grid;gap:8px;margin:12px 0}.results-meta{min-height:22px;color:var(--muted);font-size:.9rem;font-weight:700}.letter-index{display:flex;flex-wrap:wrap;gap:6px}.letter-index button{min-width:44px;min-height:44px;padding:0 10px;border:1px solid var(--line);background:#0b100e;color:#dff0e6;font-weight:900;cursor:pointer}.letter-index button[aria-pressed="true"]{background:var(--green);color:#07140d;border-color:var(--green)}</style>
</head>
<body>
  <main class="app">
    <header class="head"><h1>Season teams</h1><p>Reserve returning teams and add qualified new teams.</p></header>
    <div class="links"><button type="button" data-reload-teams>Reload teams</button><a href="/profile" data-signin-teams hidden>Sign in again</a></div>
    <section class="toolbar" aria-label="Season team controls">
      <label>Season<select data-season disabled><option>Loading seasons…</option></select></label>
      <div class="capacity"><strong data-capacity>—</strong><span data-open-slots>Loading team slots…</span></div>
      <label>Find a team<input data-search type="search" placeholder="Team or captain name" disabled aria-controls="admin-season-team-list" /></label>
      <form class="create" data-create-form hidden>
        <label>New team name<input data-create-name maxlength="80" autocomplete="off" placeholder="Example: Corner Pocket" /></label>
        <button data-create-button type="submit">Create team</button>
      </form>
    </section>
    <div class="directory-tools">
      <div class="results-meta" role="status" aria-live="polite" data-results-meta></div>
      <div class="letter-index" data-letter-index role="group" aria-label="Jump to team name letter"></div>
    </div>
    <nav class="tabs" aria-label="Team views"><button class="tab" data-tab="returning" aria-pressed="true">Returning</button><button class="tab" data-tab="new" aria-pressed="false">New</button><button class="tab" data-tab="in_season" aria-pressed="false">In season</button></nav>
    <div class="list" id="admin-season-team-list" data-list></div><div class="state" data-state role="status" aria-live="polite" aria-atomic="true"></div>
    <div class="links"><a href="/season-setup">Season setup</a><a href="/admin/players">Players</a><a href="/admin/operations">Operations</a></div>
  </main>
  <script>
    const seasonSelect=document.querySelector('[data-season]');const search=document.querySelector('[data-search]');const list=document.querySelector('[data-list]');const state=document.querySelector('[data-state]');const capacity=document.querySelector('[data-capacity]');const openSlots=document.querySelector('[data-open-slots]');const tabs=[...document.querySelectorAll('[data-tab]')];const resultsMeta=document.querySelector('[data-results-meta]');const letterIndex=document.querySelector('[data-letter-index]');let activeLetter='';const createForm=document.querySelector('[data-create-form]');const createName=document.querySelector('[data-create-name]');const createButton=document.querySelector('[data-create-button]');let seasons=[];let teams=[];let registration=null;let activeTab='returning';
    function token(){return sessionStorage.getItem('fd.accessToken')||''}
    function setState(message,tone=''){state.textContent=message;state.dataset.tone=tone}
    function selectedSeasonId(){return seasonSelect.value||''}
    function selectedSeason(){return seasons.find(item=>item.id===selectedSeasonId())||null}
    function normalized(row,key){return row[key]??row[key.replace(/[A-Z]/g,m=>'_'+m.toLowerCase())]}
    const reload=document.querySelector('[data-reload-teams]'),signin=document.querySelector('[data-signin-teams]');
    const creationOperations=${Boolean(creationOperations)};let creationIntent=null;
    const creationStorage='fd.preparedTeamCreation';
    function dropCreation(){creationIntent=null;try{sessionStorage.removeItem(creationStorage)}catch{}}
    async function sessionHash(owner){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(owner.token));return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('')}
    function persistCreation(intent){sessionStorage.setItem(creationStorage,JSON.stringify({id:intent.id,name:intent.name,seasonId:intent.owner.seasonId,sessionHash:intent.sessionHash,retryAt:Number.isFinite(intent.retryAt)?intent.retryAt:'blocked'}))}
    async function restoreCreation(owner){if(!creationOperations||creationIntent)return;let saved;try{saved=JSON.parse(sessionStorage.getItem(creationStorage)||'null')}catch{dropCreation();return}if(!saved)return;const hash=await sessionHash(owner);if(!owns(owner))return;if(saved.sessionHash!==hash||typeof saved.id!=='string'||!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(saved.id)||typeof saved.name!=='string'||!saved.name.trim()||saved.name.length>80||typeof saved.seasonId!=='string'||!(saved.retryAt==='blocked'||Number.isFinite(saved.retryAt))){dropCreation();return}creationIntent={id:saved.id,name:saved.name,owner:{...owner,seasonId:saved.seasonId},sessionHash:hash,retryAt:saved.retryAt==='blocked'?Infinity:saved.retryAt,unconfirmed:true}}
    let observedToken=token(),sessionGeneration=0,loadVersion=0,viewOwner=null,pendingWrite=null,rowOwners=new WeakMap();
    function owns(owner){return Boolean(owner&&owner.token&&owner.token===token()&&owner.generation===sessionGeneration)}
    function current(owner){return owns(owner)&&(!owner.seasonId||owner.seasonId===selectedSeasonId())}
    function syncControls(){const ready=current(viewOwner),unconfirmed=Boolean(creationIntent?.unconfirmed);seasonSelect.disabled=!seasons.length||Boolean(pendingWrite);search.disabled=!ready||Boolean(pendingWrite);createForm.hidden=!ready;createButton.disabled=!ready||Boolean(pendingWrite)||unconfirmed;createName.disabled=!ready||Boolean(pendingWrite)||unconfirmed;createButton.textContent=creationIntent?.retryReady?'Try creation again':'Create team';for(const tab of tabs)tab.disabled=!ready||Boolean(pendingWrite);reload.hidden=!token();reload.disabled=Boolean(pendingWrite);signin.hidden=Boolean(token());if(pendingWrite)for(const button of list.querySelectorAll('button'))button.disabled=true}
    function clearPrivate(message){loadVersion++;viewOwner=null;pendingWrite=null;rowOwners=new WeakMap();seasons=[];teams=[];registration=null;activeLetter='';list.replaceChildren();letterIndex.replaceChildren();resultsMeta.textContent='';search.value='';createName.value='';seasonSelect.replaceChildren();const option=document.createElement('option');option.textContent=token()?'Reload teams to continue':'Sign in required';seasonSelect.append(option);capacity.textContent='—';openSlots.textContent='';syncControls();setState(message,'error')}
    function observeSession(){const next=token();if(next===observedToken)return;observedToken=next;sessionGeneration++;dropCreation();clearPrivate(next?'Your sign-in changed. Reload teams before continuing.':'Sign in with Google from Profile to manage league teams.')}
    function capture(){observeSession();return {token:token(),generation:sessionGeneration}}
    function usable(owner){observeSession();return owner===viewOwner&&current(owner)&&!pendingWrite}
    function beginWrite(row){const owner=row?rowOwners.get(row):viewOwner;if(!usable(owner))return null;pendingWrite=owner;syncControls();return owner}
    function endWrite(owner){if(pendingWrite!==owner)return;pendingWrite=null;if(current(owner)){syncControls();render()}}
    async function api(path,{owner=capture(),...options}={}){observeSession();if(!owns(owner))throw new Error('Your sign-in changed. Reload teams before continuing.');const response=await fetch(path,{...options,headers:{authorization:'Bearer '+owner.token,'content-type':'application/json',...(options.headers||{})}});if(!owns(owner))throw new Error('Stale team response');const text=await response.text();if(!owns(owner))throw new Error('Stale team response');let body={};try{body=text?JSON.parse(text):{}}catch{body={error:'Teams are unavailable. Reload teams to try again.'}}if(response.status===401){sessionStorage.removeItem('fd.accessToken');observeSession();window.dispatchEvent(new Event('fd:session-changed'))}if(!response.ok){const error=new Error(body.error||'Request failed');if(response.status===429){const raw=response.headers.get('Retry-After'),seconds=raw&&(/^\\d+$/.test(raw)?Number(raw):(Date.parse(raw)-Date.now())/1000);error.retryAt=Number.isFinite(seconds)&&seconds>=0&&seconds<=300?Date.now()+seconds*1000:Infinity;error.message=Number.isFinite(error.retryAt)?'Too many requests. Wait '+Math.ceil(seconds)+' seconds, then Reload teams.':'Too many requests. A valid Retry-After is required before retrying creation.'}throw error}return body}
    function renderCapacity(){const counts=registration?.counts||{};const used=Number(counts.occupiedSlots??0);const total=Number(registration?.teamCapacity??0);capacity.textContent=total?used+' of '+total+' teams':'—';openSlots.textContent=total?Math.max(0,total-used)+' slot'+(total-used===1?'':'s')+' open':'Choose a season'}
    function context(row){const parts=[];const source=normalized(row,'sourceSeasonName');const captain=normalized(row,'captainDisplayName');const roster=Number(normalized(row,'activeRosterCount')||0);if(activeTab==='returning'&&source)parts.push('Last season: '+source);if(captain){parts.push('Captain: '+captain);parts.push(normalized(row,'captainHasPhone')?'Contact on file':'Phone missing')}else parts.push('Captain not assigned');parts.push(roster+' rostered');const status=normalized(row,'slotStatus');if(status)parts.push(status.replaceAll('_',' '));else if(activeTab==='new')parts.push('Not in season');return parts.join(' · ')}
    function isTargetSeasonTeam(row){return normalized(row,'sourceSeasonId')===selectedSeasonId()}function canAssignCaptain(row){return !normalized(row,'captainPlayerId')&&isTargetSeasonTeam(row)}function rosterHref(row){return '/admin/players?season='+encodeURIComponent(selectedSeasonId())+'&team='+encodeURIComponent(normalized(row,'teamId'))}
    function render(){
      observeSession();if(!current(viewOwner))return;
      const query=search.value.trim().toLowerCase();
      const tokens=query.split(/\s+/).filter(Boolean);
      const tabRows=teams.filter(row=>normalized(row,'candidateKind')===activeTab);
      let filtered=tabRows.filter(row=>{
        if(!tokens.length)return true;
        const hay=[normalized(row,'teamName'),normalized(row,'captainDisplayName'),normalized(row,'entryReason')].join(' ').toLowerCase();
        return tokens.every(token=>hay.includes(token));
      }).sort((left,right)=>String(normalized(left,'teamName')||'').localeCompare(String(normalized(right,'teamName')||''),'en',{sensitivity:'base'}));
      const letterOf=(row)=>{const name=String(normalized(row,'teamName')||'').trim();const ch=(name[0]||'#').toUpperCase();return ch>='A'&&ch<='Z'?ch:'#'};
      if(activeLetter)filtered=filtered.filter(row=>letterOf(row)===activeLetter);
      const present=new Set(tabRows.map(letterOf));
      letterIndex.replaceChildren();
      for(const letter of ['#','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']){
        if(letter!=='#'&&!present.has(letter))continue;
        if(letter==='#'&&!present.has('#'))continue;
        const button=document.createElement('button');
        button.type='button';
        button.textContent=letter;
        button.setAttribute('aria-pressed',String(activeLetter===letter));
        button.addEventListener('click',()=>{activeLetter=activeLetter===letter?'':letter;render();});
        letterIndex.append(button);
      }
      resultsMeta.textContent=tabRows.length?(filtered.length===tabRows.length&&!query&&!activeLetter?(tabRows.length+' teams · A–Z'):('Showing '+filtered.length+' of '+tabRows.length+(query?' matching “'+search.value.trim()+'”':'')+(activeLetter?' · letter '+activeLetter:''))):'';
      list.replaceChildren();
      if(!filtered.length){
        const empty=document.createElement('div');
        empty.className='empty';
        empty.textContent=query||activeLetter?'No matching teams.':activeTab==='returning'?'No returning teams available to reserve.':activeTab==='new'?'No new teams yet. Use Create team above to prepare one.':'No teams are in this season yet.';
        list.append(empty);
        return;
      }
      for(const row of filtered){
const card=document.createElement('article');card.className='card';const copy=document.createElement('div');const title=document.createElement('h2');title.textContent=normalized(row,'teamName')||'Unnamed team';const meta=document.createElement('div');meta.className='meta';meta.textContent=context(row);copy.append(title,meta);card.append(copy);const actions=document.createElement('div');actions.className='card-actions';if(isTargetSeasonTeam(row)){const rosterLink=document.createElement('a');rosterLink.className='roster-link';rosterLink.textContent='Add players';rosterLink.href=rosterHref(row);rosterLink.addEventListener('click',event=>{if(!usable(rowOwners.get(row)))event.preventDefault()});actions.append(rosterLink)}if(canAssignCaptain(row)){const captainButton=document.createElement('button');captainButton.className='captain';captainButton.type='button';captainButton.textContent='Assign captain';captainButton.addEventListener('click',()=>openCaptainPicker(row,card,captainButton));actions.append(captainButton)}if(activeTab!=='in_season'){const button=document.createElement('button');button.className='add';button.type='button';button.textContent=activeTab==='returning'?'Reserve slot':'Add to season';button.disabled=!Boolean(normalized(row,'canTakeSlot'));const reason=normalized(row,'entryReason');if(button.disabled&&reason)button.title=reason;button.addEventListener('click',()=>addTeam(row,button));actions.append(button)}if(actions.children.length)card.append(actions);list.append(card)}syncControls()}
    async function loadSeasons(){
      observeSession();if(pendingWrite)return;if(!token()){clearPrivate('Sign in with Google from Profile to manage league teams.');return}
      const owner=capture(),restoreVersion=loadVersion;await restoreCreation(owner);if(!owns(owner)||restoreVersion!==loadVersion)return;
      const requestedSeason=new URLSearchParams(location.search).get('season');if(creationIntent&&requestedSeason&&requestedSeason!==creationIntent.owner.seasonId)dropCreation();
      if(creationIntent?.unconfirmed&&Date.now()<creationIntent.retryAt){syncControls();setState(Number.isFinite(creationIntent.retryAt)?'Creation is unconfirmed. Wait until the requested delay ends, then Reload teams.':'Creation is unconfirmed. A valid Retry-After is required before another creation attempt.','error');return}
      clearPrivate('Loading seasons…');const version=++loadVersion;
      try{const body=await api('/api/admin/seasons',{owner});if(!owns(owner)||version!==loadVersion)return;seasons=body.seasons||[];seasonSelect.replaceChildren();for(const season of seasons){const option=document.createElement('option');option.value=season.id;option.textContent=season.name+' — '+season.status;seasonSelect.append(option)}const requested=new URLSearchParams(location.search).get('season');if(requested&&seasons.some(item=>item.id===requested))seasonSelect.value=requested;if(seasons.length)return loadTeams(owner);clearPrivate('No seasons exist yet. Create one in Season setup.')}
      catch(error){if(owns(owner)&&version===loadVersion)clearPrivate(error.message)}
    }
    async function loadTeams(parentOwner=null){
      observeSession();if(!parentOwner&&pendingWrite)return false;const id=selectedSeasonId();if(!id||!token())return false;const owner={...(parentOwner||capture()),seasonId:id},version=++loadVersion;
      if(creationIntent&&(!owns(creationIntent.owner)||creationIntent.owner.seasonId!==id))dropCreation();
      if(!current(owner))return false;viewOwner=null;teams=[];registration=null;list.replaceChildren();letterIndex.replaceChildren();resultsMeta.textContent='';capacity.textContent='—';openSlots.textContent='';syncControls();setState('Loading teams…');
      try{const body=await api('/api/admin/seasons/'+encodeURIComponent(id)+'/team-candidates',{owner});if(!current(owner)||version!==loadVersion)return false;registration=body.registration||null;teams=body.teams||[];viewOwner=owner;rowOwners=new WeakMap();for(const row of teams)rowOwners.set(row,owner);renderCapacity();render();setState('');const url=new URL(location.href);url.searchParams.set('season',id);history.replaceState({},'',url);if(creationIntent?.unconfirmed)await confirmCreation(owner,version);syncControls();return true}
      catch(error){if(current(owner)&&version===loadVersion)clearPrivate(error.message);return false}
    }
    function validCreation(team,intent){return Boolean(team&&typeof team.id==='string'&&team.id&&team.season_id===intent.owner.seasonId&&typeof team.name==='string'&&team.name.trim()===intent.name)}
    async function confirmCreation(owner,version){
      const intent=creationIntent;if(!intent||!current(owner))return;createName.value=intent.name;
      if(Date.now()<intent.retryAt){setState(Number.isFinite(intent.retryAt)?'Creation is unconfirmed. Wait until the requested delay ends, then Reload teams.':'Creation is unconfirmed. A valid Retry-After is required before another creation attempt.','error');return}
      try{const body=await api('/api/admin/seasons/'+encodeURIComponent(owner.seasonId)+'/prepared-team-operations/'+encodeURIComponent(intent.id),{owner});if(!current(owner)||version!==loadVersion||creationIntent!==intent)return;
        if(!Object.hasOwn(body,'operation'))throw new Error('Creation lookup was not confirmed. Reload teams.');
        if(body.operation===null){intent.unconfirmed=false;intent.retryReady=true;setState('No completed creation was found. Choose Try creation again to reuse this action.','error');return}
        if(!validCreation(body.operation,intent)||body.operation.requested_name!==intent.name)throw new Error('Creation result did not match this action. Reload teams.');
        dropCreation();createName.value='';activeTab='new';for(const tab of tabs)tab.setAttribute('aria-pressed',String(tab.dataset.tab==='new'));render();setState(intent.name+' creation confirmed. Assign a captain and add players.','ok');
      }catch(error){if(current(owner)&&version===loadVersion&&creationIntent===intent){if(error.retryAt!==undefined){intent.retryAt=error.retryAt;try{persistCreation(intent)}catch{}}setState(error.message,'error')}}
    }
    async function createTeam(){
      const owner=beginWrite();if(!owner)return;const id=owner.seasonId,name=createName.value.trim();
      let intent=null;
      try{if(!name)throw new Error('Enter a team name.');if(creationOperations){if(creationIntent?.unconfirmed)throw new Error('Reload teams to confirm the previous creation.');if(!creationIntent||creationIntent.name!==name||!current(creationIntent.owner)){if(typeof crypto.randomUUID!=='function')throw new Error('Secure creation is unavailable. Reload this page.');const hash=await sessionHash(owner);if(!current(owner))return;creationIntent={id:crypto.randomUUID(),name,owner,sessionHash:hash,retryAt:0,unconfirmed:false}}intent=creationIntent;intent.unconfirmed=true;intent.retryReady=false;persistCreation(intent);syncControls()}setState('Creating '+name+'…');const body=await api('/api/admin/seasons/'+encodeURIComponent(id)+'/prepared-teams',{owner,method:'POST',body:JSON.stringify({teamName:name,...(intent?{operationId:intent.id}:{})})});if(!current(owner))return;if(intent&&!validCreation(body.team,intent))throw new Error('Creation response was not confirmed.');dropCreation();createName.value='';activeTab='new';for(const item of tabs)item.setAttribute('aria-pressed',String(item.dataset.tab==='new'));if(await loadTeams(owner)&&current(owner))setState(name+' created. Assign a captain and add at least 3 players to qualify for a season slot.','ok')}
      catch(error){if(current(owner)){if(intent&&creationIntent===intent){intent.retryAt=error.retryAt??0;try{persistCreation(intent)}catch{}createName.value=intent.name;setState(error.message+' Creation is unconfirmed. Reload teams to check before continuing.','error')}else setState(error.message,'error')}}finally{endWrite(owner)}
    }
    async function openCaptainPicker(row,card,button){
      const owner=rowOwners.get(row);if(!usable(owner))return;button.disabled=true;setState('Loading players…');
      try{const seasonId=owner.seasonId,teamId=normalized(row,'teamId');const body=await api('/api/admin/seasons/'+encodeURIComponent(seasonId)+'/teams/'+encodeURIComponent(teamId)+'/captain-candidates',{owner});if(!usable(owner)||!card.isConnected)return;const players=body.players||[];const picker=document.createElement('div');picker.className='captain-picker';const label=document.createElement('label');label.textContent='Choose captain for '+normalized(row,'teamName');const select=document.createElement('select');const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Choose a player';select.append(placeholder);const activeSeason=['active','playoffs'].includes(selectedSeason()?.status);for(const player of players){const option=document.createElement('option');option.value=player.playerId;const notes=[player.hasLogin?'Signed in':'Unclaimed',player.hasPhone?'Contact on file':'Phone missing'];if(player.rosteredOnTeam)notes.unshift('On this roster');if(player.captainTeamName)notes.push('Captains '+player.captainTeamName);option.textContent=player.displayName+' — '+notes.join(' · ');option.disabled=Boolean(player.captainTeamId)||(activeSeason&&!player.hasPhone);select.append(option)}label.append(select);const assign=document.createElement('button');assign.type='button';assign.textContent='Assign captain';assign.disabled=true;select.addEventListener('change',()=>{assign.disabled=!select.value||!usable(owner)});assign.addEventListener('click',()=>assignCaptain(row,select.value));const help=document.createElement('div');help.className='picker-help';help.textContent=activeSeason?'Active captains require a phone number on file.':'Unclaimed players may be prepared as captain now. Phone contact is required before the season becomes active.';picker.append(label,assign,help);card.append(picker);button.remove();setState('')}
      catch(error){if(usable(owner)&&button.isConnected){button.disabled=false;setState(error.message,'error')}}
    }
    async function assignCaptain(row,playerId){
      if(!playerId)return;const owner=beginWrite(row);if(!owner)return;const seasonId=owner.seasonId,teamId=normalized(row,'teamId');setState('Assigning captain…');
      try{const body=await api('/api/admin/seasons/'+encodeURIComponent(seasonId)+'/teams/'+encodeURIComponent(teamId)+'/captain',{owner,method:'POST',body:JSON.stringify({playerId})});if(!current(owner))return;if(await loadTeams(owner)&&current(owner)){const captain=body.captain||{};setState((captain.displayName||'Captain')+' assigned to '+normalized(row,'teamName')+(captain.hasPhone?'. Contact on file.':'. Phone required before activation.'),'ok')}}
      catch(error){if(current(owner))setState(error.message,'error')}finally{endWrite(owner)}
    }
    async function addTeam(row){
      const owner=beginWrite(row);if(!owner)return;const id=owner.seasonId,teamId=normalized(row,'teamId'),returning=activeTab==='returning';setState((returning?'Reserving ':'Adding ')+normalized(row,'teamName')+'…');
      try{await api('/api/admin/seasons/'+encodeURIComponent(id)+'/teams/'+encodeURIComponent(teamId)+'/add',{owner,method:'POST'});if(!current(owner))return;if(await loadTeams(owner)&&current(owner))setState(normalized(row,'teamName')+(returning?' reserved a season slot.':' added to the season.'),'ok')}
      catch(error){if(current(owner))setState(error.message,'error')}finally{endWrite(owner)}
    }
    for(const tab of tabs)tab.addEventListener('click',()=>{if(!usable(viewOwner))return;activeTab=tab.dataset.tab;activeLetter='';for(const item of tabs)item.setAttribute('aria-pressed',String(item===tab));render()});
    createForm.addEventListener('submit',event=>{event.preventDefault();createTeam()});search.addEventListener('input',()=>{if(!usable(viewOwner))return;activeLetter='';render()});search.addEventListener('keydown',event=>{if(event.key==='Escape'&&usable(viewOwner)){search.value='';activeLetter='';render()}});seasonSelect.addEventListener('change',()=>loadTeams());reload.addEventListener('click',()=>loadSeasons());window.addEventListener('fd:session-changed',observeSession);window.addEventListener('storage',observeSession);window.addEventListener('focus',observeSession);loadSeasons();
  </script>
</body>
</html>`;
}

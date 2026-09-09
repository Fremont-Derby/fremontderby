const MISSION_ID = 'captain.add-players';
const MISSION_COOKIE = 'fd_qa_mission';
const STATE_COOKIE = 'fd_qa_captain_invites';
const FAKE_TOKEN = 'qa-captain-mission-token';

const FIRST = ['Maya','Eli','Riley','Theo','Jules','Mina','Dax','Ivy','Owen','Zara','Nico','Nova'];
const LAST = ['Banks','Torres','Chen','Brooks','Patel','Reed','Kim','Stone','Park','Lane','Diaz','Cole'];
const TEAM_A = ['Corner Pocket','Green Felt','Rail','Break Room','Hill Hill','Side Pocket'];
const TEAM_B = ['Crew','Owls','Sharks','Bandits','Breakers','Runners'];

function esc(value) {
  return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
}

function hashSeed(seed) {
  let hash = 2166136261;
  for (const char of String(seed)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

function seeded(seed) {
  let state = hashSeed(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(random, values) { return values[Math.floor(random() * values.length) % values.length]; }
function person(random) { return `${pick(random,FIRST)} ${pick(random,LAST)}`; }
function teamName(random) { return `${pick(random,TEAM_A)} ${pick(random,TEAM_B)}`; }
function cleanSeed(value) { return String(value || '').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,48); }
function newSeed() { return globalThis.crypto?.randomUUID ? crypto.randomUUID().slice(0,8) : `${Date.now().toString(36)}${Math.floor(Math.random()*1e6).toString(36)}`; }

function cookieMap(request) {
  const map = new Map();
  for (const pair of String(request?.headers?.get('cookie') || '').split(';')) {
    const item = pair.trim(); const split = item.indexOf('=');
    if (split > 0) map.set(item.slice(0,split), decodeURIComponent(item.slice(split+1)));
  }
  return map;
}

function setCookie(name, value, maxAge = 14400) { return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`; }

export function buildCaptainAddPlayersFixture(seed) {
  const random = seeded(seed);
  const captainName = person(random);
  const ownTeam = teamName(random);
  const existing = person(random);
  const candidates = [];
  while (candidates.length < 4) {
    const name = person(random);
    if (![captainName, existing, ...candidates.map((item)=>item.display_name)].includes(name)) {
      candidates.push({ id:`qa-${seed}-candidate-${candidates.length+1}`, display_name:name, activeSeasonIds:[] });
    }
  }
  return {
    seed,
    missionId: MISSION_ID,
    captain:{ id:`qa-${seed}-captain`, name:captainName },
    team:{ id:`qa-${seed}-team`, name:ownTeam },
    season:{ id:`qa-${seed}-season`, name:'QA Mission League', status:'active' },
    existing:{ playerId:`qa-${seed}-existing`, displayName:existing, role:'player', membershipId:`qa-${seed}-existing-membership` },
    candidates,
    targets:candidates.slice(0,2),
    distractors:candidates.slice(2),
  };
}

export function activeCaptainAddPlayersMission(request, env = {}) {
  if (env.ENVIRONMENT !== 'jfl') return null;
  const raw = cookieMap(request).get(MISSION_COOKIE) || '';
  const prefix = `${MISSION_ID}:`;
  if (!raw.startsWith(prefix)) return null;
  const seed = cleanSeed(raw.slice(prefix.length));
  return seed ? { seed, fixture:buildCaptainAddPlayersFixture(seed) } : null;
}

function invitedIds(request) {
  const raw = cookieMap(request).get(STATE_COOKIE) || '';
  return [...new Set(raw.split(',').map((item)=>item.trim()).filter(Boolean))];
}

function teamManagement(fixture, invited) {
  const invitedSet = new Set(invited);
  const pendingInvitations = fixture.candidates.filter((item)=>invitedSet.has(item.id)).map((item)=>({
    invitationId:`qa-invite-${item.id}`,
    playerId:item.id,
    displayName:item.display_name,
  }));
  return {
    captain_teams:[{
      teamId:fixture.team.id,
      teamName:fixture.team.name,
      seasonId:fixture.season.id,
      seasonName:fixture.season.name,
      roster:[
        { playerId:fixture.captain.id, displayName:fixture.captain.name, role:'captain', membershipId:`qa-${fixture.seed}-captain-membership` },
        fixture.existing,
      ],
      pendingInvitations,
    }],
    invitations:[],
    availability_contexts:[],
    players:fixture.candidates,
  };
}

function json(body, status = 200, headers = {}) {
  return Response.json(body,{status,headers:{'cache-control':'no-store',...headers}});
}

function checkpointPage(fixture, invited) {
  const invitedSet = new Set(invited);
  const targetsComplete = fixture.targets.every((item)=>invitedSet.has(item.id));
  const wrong = fixture.distractors.filter((item)=>invitedSet.has(item.id));
  const machinePass = targetsComplete && wrong.length === 0;
  const questions = [
    'I knew where to manage my team without route instructions.',
    'It was obvious which team I was editing.',
    'The recruited players were easy to distinguish from the other candidates.',
    'After sending the invitations, it was obvious the action succeeded.',
  ];
  const checks = questions.map((question,index)=>`<div class="check"><p>${esc(question)}</p><div class="choices"><button data-check="${index}" data-value="pass" aria-pressed="false">PASS</button><button data-check="${index}" data-value="fail" aria-pressed="false">FAIL</button></div></div>`).join('');
  const targetNames = fixture.targets.map((item)=>esc(item.display_name)).join(' and ');
  const script = `(()=>{const buttons=[...document.querySelectorAll('[data-check]')],finish=document.querySelector('[data-finish]'),outcome=document.querySelector('[data-outcome]'),actions=document.querySelector('[data-actions]');const selected=i=>buttons.find(b=>b.dataset.check===String(i)&&b.getAttribute('aria-pressed')==='true');function sync(){const remaining=[0,1,2,3].filter(i=>!selected(i)).length;finish.disabled=${machinePass ? 'false' : 'true'}||remaining>0;finish.textContent=${machinePass ? "remaining?'Answer '+remaining+' check'+(remaining===1?'':'s')+' to finish':'Finish mission'" : "'Fix the roster invitations first'"};}buttons.forEach(b=>b.addEventListener('click',()=>{buttons.filter(p=>p.dataset.check===b.dataset.check).forEach(p=>p.setAttribute('aria-pressed',String(p===b)));sync();}));finish.addEventListener('click',()=>{const answers=[0,1,2,3].map(i=>selected(i)?.dataset.value||null);const result=answers.includes('fail')?'fail':'pass';outcome.dataset.show='true';outcome.dataset.result=result;outcome.textContent=result==='pass'?'MISSION PASSED ✓':'MISSION FAILED — your feedback is a valid result.';actions.dataset.show='true';finish.disabled=true;finish.textContent='Result saved';try{localStorage.setItem('fd.qa.mission.${MISSION_ID}.${esc(fixture.seed)}',JSON.stringify({missionId:'${MISSION_ID}',seed:'${esc(fixture.seed)}',result,answers,machinePass:${machinePass},savedAt:new Date().toISOString()}))}catch{};outcome.scrollIntoView({block:'nearest',behavior:'smooth'});});sync();})();`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Captain mission check · Fremont Derby</title><style>:root{font-family:Inter,system-ui,sans-serif;background:#f4f7f5;color:#14231b}*{box-sizing:border-box}body{margin:0}.wrap{width:min(720px,calc(100% - 20px));margin:18px auto 44px}.card{background:#fff;border:1px solid #bdc7c1;border-radius:18px;padding:16px}.k{font-size:.7rem;font-weight:950;letter-spacing:.08em;color:#08783f}.target{padding:12px;border-radius:12px;background:#eef5f1;margin:12px 0}.machine{padding:10px 12px;border-radius:10px;background:${machinePass?'#eaf7ef':'#fff4dc'};color:${machinePass?'#075f36':'#6a4a00'};font-weight:850}.check{border-top:1px solid #e1e5e2;padding-top:10px}.check p{font-weight:800;line-height:1.35}.choices{display:grid;grid-template-columns:1fr 1fr;gap:8px}.choices button,.finish,.actions a{min-height:48px;border-radius:11px;border:1px solid #08783f;font-weight:900}.choices button{background:#fff;color:#08783f}.choices button[aria-pressed=true][data-value=pass]{background:#08783f;color:#fff}.choices button[aria-pressed=true][data-value=fail]{background:#9b2c2c;border-color:#9b2c2c;color:#fff}.finish{width:100%;margin-top:14px;background:#e8ece9;color:#69716c;border-color:#ccd2ce}.finish:not(:disabled){background:#08783f;color:#fff}.outcome{display:none;margin-top:14px;padding:14px;border-radius:12px;font-weight:900}.outcome[data-show=true]{display:block}.outcome[data-result=pass]{background:#eaf7ef;color:#075f36}.outcome[data-result=fail]{background:#fff0f0;color:#842626}.actions{display:none;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.actions[data-show=true]{display:grid}.actions a{display:grid;place-items:center;padding:8px;text-decoration:none;color:#08783f}.actions a:first-child{background:#08783f;color:#fff}@media(max-width:540px){.actions{grid-template-columns:1fr}}</style></head><body><main class="wrap"><section class="card"><div class="k">CAPTAIN MISSION · CHECKPOINT</div><h1>Did you invite the right players?</h1><p>You were <strong>${esc(fixture.captain.name)}</strong>, captain of <strong>${esc(fixture.team.name)}</strong>.</p><div class="target"><strong>Recruited players:</strong> ${targetNames}</div><div class="machine">${machinePass?'Machine check passed: both intended players are invited and no distractor was invited.':wrong.length?`Machine check failed: an unintended player was invited.`:'Machine check incomplete: invite both recruited players before finishing.'}</div>${checks}<button class="finish" data-finish disabled>Answer 4 checks to finish</button><div class="outcome" data-outcome></div><div class="actions" data-actions><a href="/qa/captain-add-players/start?seed=${encodeURIComponent(fixture.seed)}">Replay exact mission</a><a href="/qa/captain-add-players/start">Play with new data</a><a href="/qa">Back to missions</a><a href="/qa/captain-add-players/end">End mission</a></div></section></main><script>${script}</script></body></html>`;
}

export async function routeQaCaptainAddPlayersMission(request, env = {}) {
  if (!request || env.ENVIRONMENT !== 'jfl') return null;
  const url = new URL(request.url);

  if (url.pathname === '/qa/captain-add-players/start') {
    if (request.method !== 'GET') return json({error:'Method not allowed'},405);
    const seed = cleanSeed(url.searchParams.get('seed')) || newSeed();
    const headers = new Headers({location:'/', 'cache-control':'no-store'});
    headers.append('set-cookie',setCookie(MISSION_COOKIE,`${MISSION_ID}:${seed}`));
    headers.append('set-cookie',setCookie(STATE_COOKIE,'',0));
    return new Response(null,{status:302,headers});
  }

  if (url.pathname === '/qa/captain-add-players/end') {
    const headers = new Headers({'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
    headers.append('set-cookie',setCookie(MISSION_COOKIE,'',0));
    headers.append('set-cookie',setCookie(STATE_COOKIE,'',0));
    return new Response(`<!doctype html><script>try{sessionStorage.removeItem('fd.accessToken')}catch{};location.replace('/qa')</script>`,{headers});
  }

  const active = activeCaptainAddPlayersMission(request,env);
  if (!active) return null;
  const {fixture} = active;
  const invited = invitedIds(request);

  if (request.method === 'GET' && url.pathname === '/api/seasons') return json({seasons:[fixture.season]});
  if (request.method === 'GET' && url.pathname === '/api/me/teams') return json({teamManagement:teamManagement(fixture,invited)});
  if (request.method === 'GET' && url.pathname === '/api/me/team-membership-requests') return json({requests:{captain_requests:[],joinable_teams:[]}});
  if (request.method === 'GET' && url.pathname === `/api/seasons/${fixture.season.id}/team-standings`) return json({standings:[]});
  if (request.method === 'GET' && url.pathname === '/qa/captain-add-players/finish') return new Response(checkpointPage(fixture,invited),{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});

  const inviteMatch = url.pathname.match(/^\/api\/teams\/([^/]+)\/invitations$/);
  if (request.method === 'POST' && inviteMatch) {
    if (decodeURIComponent(inviteMatch[1]) !== fixture.team.id) return json({error:'Captain may edit only the assigned mission team.'},403);
    const body = await request.json().catch(()=>({}));
    const playerId = String(body.playerId || '');
    const candidate = fixture.candidates.find((item)=>item.id===playerId);
    if (!candidate) return json({error:'Choose an eligible mission candidate.'},400);
    const next = [...new Set([...invited,playerId])];
    return json({invitation:{invitationId:`qa-invite-${playerId}`,playerId,displayName:candidate.display_name,status:'pending'}},200,{'set-cookie':setCookie(STATE_COOKIE,next.join(','))});
  }

  return null;
}

export async function enhanceQaCaptainAddPlayersMission(response, request, env = {}) {
  const active = activeCaptainAddPlayersMission(request,env);
  if (!response || !active || request.method !== 'GET') return response;
  const url = new URL(request.url);
  if (!['/','/teams'].includes(url.pathname)) return response;
  if (!(response.headers.get('content-type') || '').includes('text/html')) return response;
  const {fixture} = active;
  const targets = fixture.targets.map((item)=>item.display_name);
  const hud = `<aside class="fd-qa-captain" aria-label="QA captain mission"><div class="fd-qa-captain__k">CAPTAIN MISSION</div><div class="fd-qa-captain__who">You are <strong>${esc(fixture.captain.name)}</strong>, captain of <strong>${esc(fixture.team.name)}</strong>.</div><div class="fd-qa-captain__goal"><strong>Your goal:</strong> Invite <strong>${esc(targets[0])}</strong> and <strong>${esc(targets[1])}</strong> to join your team. Do not invite anyone else.</div><span class="fd-qa-captain__hint">Use Fremont Derby normally. No route hints.</span><a class="fd-qa-captain__finish" href="/qa/captain-add-players/finish" hidden data-captain-finish>Check mission</a><a class="fd-qa-captain__quit" href="/qa/captain-add-players/end">Quit</a></aside>`;
  const style = `<style>.fd-qa-captain{box-sizing:border-box;width:min(100% - 24px,920px);margin:14px auto 0;padding:13px 14px;border:2px solid #08783f;border-radius:14px;background:#f3fbf6;color:#14231b;font-family:Inter,system-ui,sans-serif}.fd-qa-captain__k{font-size:.68rem;font-weight:950;letter-spacing:.08em;color:#08783f}.fd-qa-captain__who,.fd-qa-captain__goal{margin-top:5px;line-height:1.35}.fd-qa-captain__who{font-size:.78rem;color:#4e5d54}.fd-qa-captain__goal{font-size:.88rem}.fd-qa-captain__hint{display:inline-block;margin-top:9px;font-size:.72rem;color:#657169}.fd-qa-captain__finish{display:inline-flex;min-height:44px;align-items:center;justify-content:center;margin:10px 0 0 10px;padding:0 14px;border-radius:10px;background:#08783f;color:#fff!important;font-weight:900;text-decoration:none}.fd-qa-captain__finish[hidden]{display:none}.fd-qa-captain__quit{display:inline-flex;min-height:44px;align-items:center;margin:8px 0 0 10px;color:#667269!important;font-size:.75rem;font-weight:800;text-decoration:underline}@media(max-width:560px){.fd-qa-captain{width:calc(100% - 16px);margin-top:8px}.fd-qa-captain__finish,.fd-qa-captain__quit{margin-left:0;width:100%;justify-content:center}}</style>`;
  const targetJson = JSON.stringify(targets);
  const script = `<script>(()=>{try{sessionStorage.setItem('fd.accessToken','${FAKE_TOKEN}')}catch{};const targets=${targetJson};const finish=document.querySelector('[data-captain-finish]');function sync(){if(!finish)return;const text=[...document.querySelectorAll('.fd-team-card__work-row strong')].map(n=>n.textContent.trim());finish.hidden=!targets.every(name=>text.includes(name));}sync();new MutationObserver(sync).observe(document.body,{childList:true,subtree:true,characterData:true});})();</script>`;
  const headers = new Headers(response.headers); headers.set('cache-control','no-store');
  const html = await response.text();
  const enhanced = html.replace('</head>',`${style}</head>`).replace(/<body([^>]*)>/,`<body$1>${hud}`).replace('</body>',`${script}</body>`);
  return new Response(enhanced,{status:response.status,statusText:response.statusText,headers});
}

import { renderRackLedgerScorecardPage } from './rackLedgerScorecard.js';

const LEVELS = {
  fresh: {
    number: 1,
    title: 'Fresh race · first rack',
    objective: 'Start a brand-new race and record the first rack without needing instructions about which control to use.',
    assertions: [
      'I immediately knew how to start scoring the first rack.',
      'The selected 8/9 opening order was unmistakable.',
      'After starting Rack 1, the winner choices stayed visible until I chose one.',
      'After choosing a winner, the score and rack ledger updated clearly.',
      'Confirm stayed unavailable while the race was unfinished.',
    ],
  },
  finish: {
    number: 2,
    title: 'One rack from finish',
    objective: 'Finish a race that is exactly one rack from its target, then submit your completed side.',
    assertions: [
      'I could tell the race was one rack from completion.',
      'The next scoring action was obvious.',
      'After the winning rack, the race-complete state was obvious.',
      'Confirm became available only after the target was reached.',
      'After confirming, I understood what must happen next.',
    ],
  },
  mismatch: {
    number: 3,
    title: 'Mismatch · recovery',
    objective: 'Find the captains’ disagreement, correct only the wrong rack, and get back to a clear valid state.',
    assertions: [
      'I noticed the score disagreement without being told where to look.',
      'The interface identified the exact rack that disagreed.',
      'I could find how to edit only that rack.',
      'After correcting it, the mismatch state cleared.',
      'The next valid action was obvious.',
    ],
  },
};

const FIRST_NAMES = ['Nova', 'Maya', 'Eli', 'Riley', 'Theo', 'Jules', 'Mina', 'Dax', 'Ivy', 'Owen', 'Zara', 'Nico'];
const LAST_NAMES = ['Banks', 'Torres', 'Chen', 'Brooks', 'Patel', 'Reed', 'Kim', 'Stone', 'Park', 'Lane', 'Diaz', 'Cole'];
const TEAM_WORDS_A = ['Break Room', 'Corner Pocket', 'Rail', 'Green Felt', 'Side Pocket', 'Hill Hill'];
const TEAM_WORDS_B = ['Bandits', 'Owls', 'Sharks', 'Crew', 'Breakers', 'Runners'];
const RACE_PAIRS = [
  { ratingA: 500, ratingB: 500, targetA: 5, targetB: 5 },
  { ratingA: 525, ratingB: 475, targetA: 5, targetB: 4 },
  { ratingA: 575, ratingB: 475, targetA: 6, targetB: 4 },
  { ratingA: 475, ratingB: 525, targetA: 4, targetB: 5 },
];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function hashSeed(seed) {
  let hash = 2166136261;
  for (const char of String(seed)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
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

function pick(random, values) {
  return values[Math.floor(random() * values.length) % values.length];
}

function name(random) {
  return `${pick(random, FIRST_NAMES)} ${pick(random, LAST_NAMES)}`;
}

function teamName(random) {
  return `${pick(random, TEAM_WORDS_A)} ${pick(random, TEAM_WORDS_B)}`;
}

function winSequence(targetA, losses = 2) {
  const racks = [];
  let wins = 0;
  let lost = 0;
  let rackNumber = 1;
  while (wins < targetA - 1) {
    const winnerSide = lost < losses && wins > 0 && wins % 2 === 1 ? 'B' : 'A';
    if (winnerSide === 'A') wins += 1;
    else lost += 1;
    racks.push({ rackNumber, discipline: rackNumber <= 3 ? '8-ball' : '9-ball', winnerSide });
    rackNumber += 1;
  }
  return racks;
}

export function buildQaScorecardFixture(levelId, seed) {
  const level = LEVELS[levelId];
  if (!level) return null;
  const random = seeded(seed);
  const race = pick(random, RACE_PAIRS);
  let playerA = name(random);
  let playerB = name(random);
  if (playerB === playerA) playerB = name(random) + ' Jr.';
  let teamA = teamName(random);
  let teamB = teamName(random);
  if (teamB === teamA) teamB += ' II';

  let racksA = [];
  let racksB = [];
  if (levelId === 'finish') {
    racksA = winSequence(race.targetA, Math.min(2, race.targetB - 1));
    racksB = structuredClone(racksA);
  } else if (levelId === 'mismatch') {
    racksA = [
      { rackNumber: 1, discipline: '8-ball', winnerSide: 'A' },
      { rackNumber: 2, discipline: '8-ball', winnerSide: 'B' },
      { rackNumber: 3, discipline: '8-ball', winnerSide: 'A' },
    ];
    racksB = [
      { rackNumber: 1, discipline: '8-ball', winnerSide: 'A' },
      { rackNumber: 2, discipline: '8-ball', winnerSide: 'A' },
      { rackNumber: 3, discipline: '8-ball', winnerSide: 'A' },
    ];
  }

  return {
    levelId,
    seed,
    playerA: { id: `qa-${seed}-a`, name: playerA, rating: race.ratingA },
    playerB: { id: `qa-${seed}-b`, name: playerB, rating: race.ratingB },
    teamA: { id: `qa-${seed}-team-a`, name: teamA },
    teamB: { id: `qa-${seed}-team-b`, name: teamB },
    targetA: race.targetA,
    targetB: race.targetB,
    openingDiscipline: random() > 0.5 ? '8-ball' : '9-ball',
    roundNumber: 1 + Math.floor(random() * 10),
    racksA,
    racksB,
  };
}

function qaAdapterSource(fixture) {
  const storageKey = `fd.qa.scorecard.state.${fixture.levelId}.${fixture.seed}`;
  const initialState = {
    openingDiscipline: fixture.openingDiscipline,
    A: { racks: fixture.racksA, confirmed: false },
    B: { racks: fixture.racksB, confirmed: false },
    finalized: false,
  };
  const payload = { ...fixture, storageKey, initialState };
  return String.raw`
    (function(){
      const fixture=${JSON.stringify(payload)};
      window.fdQaStorageKey=fixture.storageKey;
      function clone(value){return JSON.parse(JSON.stringify(value))}
      function fresh(){return clone(fixture.initialState)}
      function read(){try{const value=JSON.parse(sessionStorage.getItem(fixture.storageKey));return value&&value.A&&value.B?value:fresh()}catch{return fresh()}}
      let state=read();
      function persist(){sessionStorage.setItem(fixture.storageKey,JSON.stringify(state))}
      function sameRack(a,b){return Boolean(a&&b&&a.winnerSide===b.winnerSide&&a.discipline===b.discipline)}
      function historiesMatch(){const a=state.A.racks,b=state.B.racks;return a.length>0&&a.length===b.length&&a.every((rack,index)=>sameRack(rack,b[index]))}
      function mismatchRack(){const a=state.A.racks,b=state.B.racks,count=Math.min(a.length,b.length);for(let i=0;i<count;i+=1){if(!sameRack(a[i],b[i]))return i+1}return null}
      function score(racks){let a=0,b=0;for(const rack of racks){if(rack.winnerSide==='A')a++;if(rack.winnerSide==='B')b++}return{a,b}}
      function complete(racks){const value=score(racks);return value.a>=fixture.targetA||value.b>=fixture.targetB}
      function status(){return state.finalized?'finalized':state.A.racks.length||state.B.racks.length?'in_progress':'scheduled'}
      function expectedDiscipline(number){return number<=3?state.openingDiscipline:(state.openingDiscipline==='8-ball'?'9-ball':'8-ball')}
      function syncPublicState(){const mismatch=mismatchRack();window.fdRackLedgerState={ownSide:'A',ownRackCount:state.A.racks.length,opponentRackCount:state.B.racks.length,historiesMatch:historiesMatch(),mismatchRackNumber:mismatch,ownConfirmed:state.A.confirmed,locked:state.finalized,raceComplete:complete(state.A.racks)}}
      function comparison(){syncPublicState();const matched=historiesMatch(),both=state.A.confirmed&&state.B.confirmed;return{tracker_player_id:fixture.playerA.id,own_racks:clone(state.A.racks),opponent_racks:clone(state.B.racks),own_confirmed_at:state.A.confirmed?'qa-confirmed':null,opponent_confirmed_at:state.B.confirmed?'qa-confirmed':null,histories_match:matched,both_confirmed:both,ready_to_finalize:matched&&both&&complete(state.A.racks)&&complete(state.B.racks),mismatch_rack_number:mismatchRack()}}
      window.fdRackLedgerAdapter={
        mode:'sandbox',liveRefresh:false,switchHref:'/qa/scorecard',switchLabel:'QA levels',perspectives:[],
        perspective(){return'A'},scoringTeamId(){return fixture.teamA.id},scoringTeamName(){return fixture.teamA.name},
        async load(){return{scorecard:{player_a_id:fixture.playerA.id,player_b_id:fixture.playerB.id,player_a_display_name:fixture.playerA.name,player_b_display_name:fixture.playerB.name,player_a_fargo_rating:fixture.playerA.rating,player_b_fargo_rating:fixture.playerB.rating,player_a_rating_status:'qa',player_b_rating_status:'qa',race_to_a:fixture.targetA,race_to_b:fixture.targetB,status:status(),first_break:'A',opening_discipline:state.openingDiscipline,opening_block_length:3},context:{round_number:fixture.roundNumber,match_number:1,match_count:3,team_a_name:fixture.teamA.name,team_b_name:fixture.teamB.name,team_score_a:0,team_score_b:0},comparison:comparison()}},
        async setOpeningDiscipline({openingDiscipline}){if(state.A.racks.length||state.B.racks.length)throw new Error('Opening order is locked after rack 1');state.openingDiscipline=openingDiscipline;persist();syncPublicState()},
        async saveRack({winnerSide,rackNumber}){if(state.finalized)throw new Error('This QA race is finalized');if(state.A.confirmed)throw new Error('Undo or edit before changing a submitted side');if(!['A','B'].includes(winnerSide))throw new Error('Choose a rack winner');if(rackNumber!=null){const index=Number(rackNumber)-1;if(!state.A.racks[index])throw new Error('Rack is not present');state.A.racks[index]={...state.A.racks[index],winnerSide};}else{const number=state.A.racks.length+1;state.A.racks.push({rackNumber:number,discipline:expectedDiscipline(number),winnerSide})}state.A.confirmed=false;persist();syncPublicState()},
        async undo(){if(!state.A.racks.length)throw new Error('No rack to undo');state.A.racks.pop();state.A.confirmed=false;persist();syncPublicState()},
        async confirm(){if(!complete(state.A.racks))throw new Error('Keep scoring until a player reaches the race target');state.A.confirmed=true;persist();syncPublicState()},
        async finalize(){if(!historiesMatch()||!state.A.confirmed||!state.B.confirmed||!complete(state.A.racks))throw new Error('Both captains must agree on a completed race');state.finalized=true;persist();syncPublicState()},
      };
      syncPublicState();
    })();
  `;
}

const qaProductStyles = `
  :root{font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#13251c;background:#f6f8f6}
  .qa-level-bar{width:min(760px,100%);margin:auto;padding:12px 10px 4px}
  .qa-level-card{border:2px solid #08783f;border-radius:16px;background:#fff;padding:12px 14px}
  .qa-kicker{font-size:.7rem;font-weight:950;letter-spacing:.08em;text-transform:uppercase;color:#08783f}
  .qa-level-card h1{font-size:1.22rem;margin:4px 0 5px}.qa-level-card p{font-size:.82rem;line-height:1.4;margin:0;color:#445248}
  .qa-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;font-size:.64rem;color:#68736c}.qa-meta code{overflow-wrap:anywhere}
  .opening-option[aria-pressed=true]{background:#08783f!important;border-color:#08783f!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
  .opening-option[aria-pressed=true]::before{content:'✓';margin-right:.4em}
  .add-rack.primary:not(:disabled){background:#08783f!important;border-color:#08783f!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
  .completion-actions [data-confirm]:disabled{background:#ecefed!important;border-color:#d0d6d2!important;color:#68706b!important;opacity:1!important}
  .qa-assertions{width:min(760px,calc(100% - 12px));margin:12px auto 30px;border:2px solid #17241d;border-radius:16px;background:#fff;padding:14px}
  .qa-assertions h2{margin:0;font-size:1.05rem}.qa-assertions>p{margin:4px 0 12px;font-size:.75rem;color:#56615a}
  .qa-assertion{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:7px;align-items:center;padding:10px 0;border-top:1px solid #e0e4e1}
  .qa-assertion span{font-size:.82rem;line-height:1.3;font-weight:700}.qa-assertion button{min-width:64px;min-height:44px;padding:7px 9px;background:#fff;border-color:#c6cdc8;color:#173e2a}
  .qa-assertion button[aria-pressed=true][data-value=pass]{background:#08783f;color:#fff;border-color:#08783f}.qa-assertion button[aria-pressed=true][data-value=fail]{background:#9b2c2c;color:#fff;border-color:#9b2c2c}
  .qa-note{width:100%;min-height:68px;margin-top:10px;padding:9px;border:1px solid #bac3bd;border-radius:10px;font:inherit}
  .qa-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.qa-actions button,.qa-actions a{display:flex;align-items:center;justify-content:center;min-height:48px;padding:8px;border-radius:11px;font-weight:900;text-decoration:none;border:1px solid #08783f}.qa-save{background:#08783f;color:#fff}.qa-secondary{background:#fff;color:#08783f}
  .qa-result{min-height:24px;margin-top:8px;font-size:.75rem;font-weight:800}.qa-next{grid-column:1/-1;background:#17241d!important;color:#fff!important;border-color:#17241d!important}
  .sandbox-footer{display:none!important}.sandbox-banner{background:#f1f7f3;border-color:#a8c7b5;color:#234331}
  @media(max-width:520px){.qa-assertion{grid-template-columns:1fr 1fr}.qa-assertion span{grid-column:1/-1}.qa-assertion button{width:100%}.qa-level-bar{padding:8px 6px 2px}.qa-assertions{padding:12px}.qa-actions{grid-template-columns:1fr}}
`;

const qaFlowScript = String.raw`
<script>
(() => {
  function syncQaFlow(){
    const state=window.fdRackLedgerState||{};
    const add=document.querySelector('[data-add-rack]');
    const picker=document.querySelector('[data-winner-picker]');
    const confirm=document.querySelector('[data-confirm]');
    const next=document.querySelector('[data-next-rack]')?.textContent?.trim()||'';
    const game=document.querySelector('[data-next-discipline]')?.textContent?.trim()||'';
    if(add&&picker){
      picker.id=picker.id||'qa-rack-winner-picker';add.setAttribute('aria-controls',picker.id);const open=picker.dataset.open==='true';add.setAttribute('aria-expanded',String(open));
      if(state.raceComplete){add.hidden=true;picker.dataset.open='false';picker.hidden=true}else{add.hidden=false;picker.hidden=false;const wanted=open?'Choose Rack '+next+' winner below':'Score Rack '+next+(game?' · '+game:'');if(add.textContent!==wanted)add.textContent=wanted}
    }
    if(confirm&&!state.locked&&!state.ownConfirmed){if(state.raceComplete){confirm.disabled=false;confirm.textContent='Confirm this side';confirm.title=''}else{confirm.disabled=true;confirm.textContent='Keep scoring · race not finished';confirm.title='Reach a race target before confirming.'}}
  }
  const add=document.querySelector('[data-add-rack]'),picker=document.querySelector('[data-winner-picker]');
  if(add&&picker)add.addEventListener('click',(event)=>{if(picker.dataset.open==='true'){event.preventDefault();event.stopImmediatePropagation();syncQaFlow();picker.scrollIntoView({block:'nearest',behavior:'smooth'})}else{requestAnimationFrame(syncQaFlow)}},true);
  requestAnimationFrame(syncQaFlow);
  const ledger=document.querySelector('[data-ledger]');if(ledger)new MutationObserver(syncQaFlow).observe(ledger,{subtree:true,childList:true,attributes:true});
})();
</script>`;

function resultScript({ levelId, seed, buildSha, assertions, nextLevel }) {
  return `<script>
(() => {
  const level=${JSON.stringify(levelId)},seed=${JSON.stringify(seed)},build=${JSON.stringify(buildSha)},assertions=${JSON.stringify(assertions)};
  const values={};const started=Date.now();
  for(const button of document.querySelectorAll('[data-qa-assertion]'))button.addEventListener('click',()=>{const id=button.dataset.qaAssertion,value=button.dataset.value;values[id]=value;for(const peer of document.querySelectorAll('[data-qa-assertion="'+id+'"]'))peer.setAttribute('aria-pressed',String(peer===button))});
  const result=document.querySelector('[data-qa-result]');
  document.querySelector('[data-qa-save]').addEventListener('click',()=>{if(Object.keys(values).length!==assertions.length){result.textContent='Mark PASS or FAIL for every assertion first.';return}const passed=assertions.every((_,index)=>values[String(index)]==='pass');const row={world:'scorecard',level,seed,buildSha:build,assertions:assertions.map((text,index)=>({text,result:values[String(index)]})),overall:passed?'pass':'fail',note:document.querySelector('[data-qa-note]').value.trim(),durationMs:Date.now()-started,timestamp:new Date().toISOString(),userAgent:navigator.userAgent};let history=[];try{history=JSON.parse(localStorage.getItem('fd.qa.scorecard.results.v1')||'[]')}catch{}history.push(row);try{localStorage.setItem('fd.qa.scorecard.results.v1',JSON.stringify(history.slice(-100)))}catch{}result.textContent=passed?'LEVEL BEATEN ✓ — result saved on this device.':'LEVEL FAILED — saved with this seed so it can be replayed.';result.dataset.outcome=row.overall});
  document.querySelector('[data-qa-replay]').addEventListener('click',()=>{try{sessionStorage.removeItem(window.fdQaStorageKey)}catch{}location.reload()});
})();
</script>`;
}

function renderLauncher(buildSha) {
  const cards = Object.entries(LEVELS).map(([id, level]) => `
    <article class="level"><div><span>LEVEL ${level.number}</span><h2>${escapeHtml(level.title)}</h2><p>${escapeHtml(level.objective)}</p></div><a href="/qa/scorecard/play?level=${id}">Play level</a><strong data-progress="${id}">Not played on this build</strong></article>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Scorecard QA · Fremont Derby</title><style>:root{font-family:Inter,system-ui,sans-serif;background:#f4f7f5;color:#122219}*{box-sizing:border-box}body{margin:0}.wrap{width:min(760px,calc(100% - 20px));margin:24px auto 40px}h1{font-size:clamp(1.8rem,8vw,3rem);margin:0}.intro{color:#526057;line-height:1.5}.build{font-size:.68rem;color:#6a756e}.level{margin-top:12px;border:1px solid #bdc7c1;border-radius:16px;background:#fff;padding:14px;display:grid;grid-template-columns:1fr auto;gap:10px}.level span{font-size:.68rem;font-weight:950;color:#08783f}.level h2{font-size:1.1rem;margin:3px 0}.level p{font-size:.8rem;line-height:1.4;margin:0;color:#526057}.level a{align-self:center;display:flex;align-items:center;justify-content:center;min-height:52px;padding:0 17px;border-radius:11px;background:#08783f;color:#fff;font-weight:950;text-decoration:none}.level strong{grid-column:1/-1;font-size:.68rem;color:#667269}@media(max-width:520px){.level{grid-template-columns:1fr}.level a{width:100%}}</style></head><body><main class="wrap"><span style="font-weight:950;color:#08783f">JFL HUMAN QA · SCORECARD WORLD</span><h1>Three levels. Beat them.</h1><p class="intro">Each run creates fresh names and race data while preserving the test outcome. Judge the interface naturally, then mark the assertions like a unit test.</p><p class="build">Build <code>${escapeHtml(buildSha)}</code></p>${cards}</main><script>(()=>{let rows=[];try{rows=JSON.parse(localStorage.getItem('fd.qa.scorecard.results.v1')||'[]')}catch{}for(const id of ${JSON.stringify(Object.keys(LEVELS))}){const current=rows.filter(row=>row.level===id&&row.buildSha===${JSON.stringify(buildSha)});const el=document.querySelector('[data-progress="'+id+'"]');if(!current.length)continue;const pass=current.some(row=>row.overall==='pass');el.textContent=pass?'Beaten on this build ✓':current.length+' attempt'+(current.length===1?'':'s')+' · not beaten yet';}})()</script></body></html>`;
}

function renderPlay(levelId, seed, buildSha) {
  const level = LEVELS[levelId];
  const fixture = buildQaScorecardFixture(levelId, seed);
  let html = renderRackLedgerScorecardPage({ title: `${level.title} · Scorecard QA`, adapterSource: qaAdapterSource(fixture) });
  const assertionMarkup = level.assertions.map((text, index) => `<div class="qa-assertion"><span>${escapeHtml(text)}</span><button type="button" data-qa-assertion="${index}" data-value="pass" aria-pressed="false">PASS</button><button type="button" data-qa-assertion="${index}" data-value="fail" aria-pressed="false">FAIL</button></div>`).join('');
  const order = Object.keys(LEVELS);const nextId = order[(order.indexOf(levelId) + 1) % order.length];
  const top = `<header class="qa-level-bar"><div class="qa-level-card"><div class="qa-kicker">Scorecard world · Level ${level.number} of 3</div><h1>${escapeHtml(level.title)}</h1><p>${escapeHtml(level.objective)}</p><div class="qa-meta"><span>Seed <code>${escapeHtml(seed)}</code></span><span>Build <code>${escapeHtml(buildSha)}</code></span></div></div></header>`;
  const bottom = `<section class="qa-assertions" aria-label="Human test assertions"><h2>Assertions</h2><p>Use the scorecard first. Then mark every statement PASS or FAIL.</p>${assertionMarkup}<textarea class="qa-note" data-qa-note placeholder="Short note if something felt wrong (optional)"></textarea><div class="qa-actions"><button class="qa-save" data-qa-save type="button">Save level result</button><a class="qa-secondary" href="/qa/scorecard/play?level=${levelId}">Play again · new data</a><button class="qa-secondary" data-qa-replay type="button">Replay exact seed</button><a class="qa-secondary qa-next" href="/qa/scorecard/play?level=${nextId}">Next level →</a></div><div class="qa-result" data-qa-result role="status" aria-live="polite"></div></section>`;
  html = html.replace('<body>', `<body>${top}`).replace('</head>', `<style>${qaProductStyles}</style></head>`).replace('</body>', `${bottom}${qaFlowScript}${resultScript({ levelId, seed, buildSha, assertions: level.assertions, nextLevel: nextId })}</body>`);
  return html;
}

function newSeed() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID().slice(0, 8);
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function routeQaScorecard(request, env = {}) {
  if (env.ENVIRONMENT !== 'jfl') return null;
  const url = new URL(request.url);
  if (url.pathname !== '/qa/scorecard' && url.pathname !== '/qa/scorecard/play') return null;
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  const buildSha = env.CF_VERSION_METADATA?.id || 'local';
  if (url.pathname === '/qa/scorecard') return new Response(renderLauncher(buildSha), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
  const levelId = url.searchParams.get('level') || 'fresh';
  if (!LEVELS[levelId]) return new Response('Unknown QA level', { status: 404 });
  const seed = url.searchParams.get('seed');
  if (!seed) {
    const next = new URL(url);next.searchParams.set('seed', newSeed());
    return Response.redirect(next.toString(), 302);
  }
  return new Response(renderPlay(levelId, seed.slice(0, 64), buildSha), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}

import { decorateHtmlWithShell } from './appShell.js';

export function captainFreeAgentContexts(management = {}) {
  return (Array.isArray(management.captain_teams) ? management.captain_teams : [])
    .filter((team) => team?.teamId && Array.isArray(team.lineupRounds))
    .map((team) => ({
      teamId: String(team.teamId),
      teamName: String(team.teamName || 'Your team'),
      seasonName: String(team.seasonName || 'Season'),
      rounds: team.lineupRounds
        .filter((round) => round?.roundId && !['finalized', 'corrected'].includes(round.teamMatchStatus))
        .map((round) => ({
          roundId: String(round.roundId),
          roundNumber: Number(round.roundNumber) || 0,
          scheduledOn: String(round.scheduledOn || ''),
          opponentName: String(round.opponentName || 'Opponent'),
        })),
    }));
}

export function safeFreeAgentCandidate(row = {}) {
  return {
    displayName: String(row.display_name || 'Player'),
    rating: Number.isFinite(Number(row.fargo_rating)) && row.fargo_rating !== null
      ? Number(row.fargo_rating) : null,
    ratingStatus: String(row.rating_status || ''),
    availability: String(row.availability_status || 'unsure'),
  };
}

const styles = `<style>
  .fd-free{width:min(960px,100%);margin:0 auto;padding:28px 16px 110px;color:#f5f1e9}
  .fd-free h1{font-size:clamp(2rem,5vw,3.2rem);margin:0 0 8px}.fd-free h2{margin:0 0 8px;font-size:1.2rem}
  .fd-free p{line-height:1.5;color:#c5d1c9}.fd-free__lede{max-width:680px}
  .fd-free__steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:24px 0}
  .fd-free__card,.fd-free__workspace{border:1px solid #385446;border-radius:14px;background:#13251b;padding:18px;min-width:0}
  .fd-free__card a,.fd-free__action{display:inline-flex;align-items:center;min-height:44px;color:#a8e8c0;font-weight:800}
  .fd-free__workspace{background:#102018}.fd-free__fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:16px 0}
  .fd-free label{display:grid;gap:6px;font-weight:700}.fd-free select,.fd-free input{width:100%;min-height:44px;padding:8px;border:1px solid #52705b;border-radius:8px;background:#07150e;color:#fff;font:inherit}
  .fd-free__results{display:grid;gap:9px;list-style:none;margin:14px 0;padding:0}.fd-free__result{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:13px;border:1px solid #355342;border-radius:9px;background:#0b1911}
  .fd-free__result strong{overflow-wrap:anywhere}.fd-free__result span{color:#bad9c5;font-size:.9rem}.fd-free__state{min-height:24px}.fd-free [hidden]{display:none!important}
  @media(max-width:650px){.fd-free__steps,.fd-free__fields{grid-template-columns:1fr}.fd-free__result{align-items:flex-start;flex-direction:column}}
</style>`;

const script = `<script>
(() => {
  const contextsFromManagement = (${captainFreeAgentContexts.toString()});
  const safeCandidate = (${safeFreeAgentCandidate.toString()});
  const root=document.querySelector('[data-free-agents]');
  const state=root.querySelector('[data-free-state]');
  const workspace=root.querySelector('[data-captain-workspace]');
  const teamSelect=root.querySelector('[data-free-team]');
  const roundSelect=root.querySelector('[data-free-round]');
  const search=root.querySelector('[data-free-search]');
  const results=root.querySelector('[data-free-results]');
  const lineup=root.querySelector('[data-free-lineup]');
  let contexts=[];
  let candidates=[];
  let requestNumber=0;
  function token(){return sessionStorage.getItem('fd.accessToken')||''}
  function message(value,error=false){state.textContent=value;state.setAttribute('role',error?'alert':'status')}
  async function getJson(path){
    const response=await fetch(path,{headers:{authorization:'Bearer '+token()}});
    const body=await response.json().catch(()=>({}));
    if(response.status===401)throw new Error('Your sign-in expired. Open Profile and sign in again.');
    if(!response.ok)throw new Error(response.status===403?'Only the active captain can see candidates for this team.':'Could not load free agents. Try again.');
    return body;
  }
  function selectedTeam(){return contexts.find((item)=>item.teamId===teamSelect.value)}
  function renderCandidates(){
    const query=search.value.trim().toLocaleLowerCase();
    const shown=candidates.filter((candidate)=>candidate.displayName.toLocaleLowerCase().includes(query));
    results.replaceChildren();
    for(const candidate of shown){
      const row=document.createElement('li');row.className='fd-free__result';
      const name=document.createElement('strong');name.textContent=candidate.displayName;
      const details=document.createElement('span');
      details.textContent=[candidate.availability==='available'?'Available for this round':'Check-in: '+candidate.availability,candidate.rating===null?'':'Fargo '+candidate.rating+(candidate.ratingStatus?' · '+candidate.ratingStatus:'')].filter(Boolean).join(' · ');
      row.append(name,details);results.append(row);
    }
    message(shown.length?shown.length+' eligible candidate'+(shown.length===1?'':'s')+' shown.':query?'No matching candidates. Clear the search to see everyone.':'No eligible free agents for this team and round.');
  }
  async function loadCandidates(){
    const team=selectedTeam();const round=team?.rounds.find((item)=>item.roundId===roundSelect.value);
    const current=++requestNumber;candidates=[];results.replaceChildren();
    lineup.hidden=!round;
    if(!round){message('No upcoming published round for this team yet.');return}
    lineup.href='/lineup?team='+encodeURIComponent(team.teamId)+'&round='+encodeURIComponent(round.roundId);
    message('Checking eligible candidates…');
    try{
      const body=await getJson('/api/teams/'+encodeURIComponent(team.teamId)+'/rounds/'+encodeURIComponent(round.roundId)+'/eligible-free-agents');
      if(current!==requestNumber)return;
      candidates=(Array.isArray(body.freeAgents)?body.freeAgents:[]).map(safeCandidate);
      renderCandidates();
    }catch(error){if(current!==requestNumber)return;message(error.message,true)}
  }
  function renderRounds(){
    const team=selectedTeam();roundSelect.replaceChildren();
    for(const round of team?.rounds||[]){const option=new Option('Week '+round.roundNumber+' · '+(round.scheduledOn||'Date TBD')+' · vs '+round.opponentName,round.roundId);roundSelect.append(option)}
    roundSelect.disabled=!roundSelect.options.length;
    loadCandidates();
  }
  async function load(){
    if(!token()){workspace.hidden=true;message('Sign in on Profile to see captain-only substitute candidates.');return}
    message('Loading your teams…');
    try{
      const body=await getJson('/api/me/teams');contexts=contextsFromManagement(body.teamManagement||{});
      if(!contexts.length){workspace.hidden=true;message('No captained team yet. You can still join as a free agent and check in on Schedule.');return}
      workspace.hidden=false;teamSelect.replaceChildren();
      for(const team of contexts)teamSelect.append(new Option(team.teamName+' · '+team.seasonName,team.teamId));
      renderRounds();
    }catch(error){workspace.hidden=true;message(error.message,true)}
  }
  teamSelect.addEventListener('change',renderRounds);
  roundSelect.addEventListener('change',loadCandidates);
  search.addEventListener('input',renderCandidates);
  root.querySelector('[data-free-retry]').addEventListener('click',load);
  load();
})();
</script>`;

export function renderJflFreeAgentsPage() {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Free agents · Fremont Derby</title>${styles}</head><body>
  <main class="fd-free" data-free-agents><h1>Free agents</h1><p class="fd-free__lede">Play even without a permanent team. Join the season, check in for league dates, and help a team that needs a substitute.</p>
    <div class="fd-free__steps"><section class="fd-free__card"><h2>Join the season</h2><p>Profile handles your registration. If you are not on a roster, joining registers you as a free agent when registration is open.</p><a href="/profile">Open Profile</a></section>
    <section class="fd-free__card"><h2>Mark your dates</h2><p>Use Schedule to mark Available, Unsure, or Unavailable for each league date. Check-in alone does not guarantee lineup eligibility.</p><a href="/schedule">Open Schedule</a></section>
    <section class="fd-free__card"><h2>Find a team</h2><p>Teams is the place to browse teams and request a roster spot. You can also stay available as a substitute.</p><a href="/teams">Browse Teams</a></section></div>
    <section class="fd-free__workspace" aria-labelledby="free-captain-title"><h2 id="free-captain-title">Captain substitute search</h2><p>For a selected matchup, the league checks eligibility before showing candidates. Use Lineup to place a substitute; this page cannot change a lineup.</p>
      <p class="fd-free__state" data-free-state role="status">Loading…</p><button type="button" data-free-retry>Retry</button>
      <div data-captain-workspace hidden><div class="fd-free__fields"><label>Team<select data-free-team></select></label><label>League date / matchup<select data-free-round></select></label></div>
      <label>Search eligible candidates<input type="search" data-free-search placeholder="Player name"></label><ul class="fd-free__results" data-free-results aria-live="polite"></ul><a class="fd-free__action" data-free-lineup href="/lineup" hidden>Build this lineup</a></div>
    </section></main>${script}</body></html>`;
  return decorateHtmlWithShell(html, '/free-agents');
}

export function routeJflFreeAgents(request, env = {}) {
  if (env.ENVIRONMENT !== 'jfl' || new URL(request.url).pathname !== '/free-agents') return null;
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  return new Response(renderJflFreeAgentsPage(), {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

import { decorateHtmlWithShell } from './appShell.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function teamInitials(name) {
  return String(name || 'Team').trim().split(/\s+/).filter(Boolean)
    .slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'T';
}

const activeTeamApplicationStatuses = new Set([
  'applied', 'deferred', 'approved_pending_roster', 'ready', 'confirmed',
]);

export function availableTeamApplicationSeasons(seasons = [], registrations = []) {
  const unavailableSeasonIds = new Set(
    registrations
      .filter((registration) => (registration?.applications || [])
        .some((application) => activeTeamApplicationStatuses.has(application?.status)))
      .map((registration) => String(registration?.seasonId || ''))
      .filter(Boolean),
  );
  return seasons.filter((season) => season?.status === 'registration'
    && !unavailableSeasonIds.has(String(season.id || '')));
}

export function friendlyTeamsError(message) {
  const raw = String(message || '').trim();
  if (/already have a team application/i.test(raw)) {
    return 'You already have a team application for this season.';
  }
  if (/already has an active team membership/i.test(raw)) {
    return 'Already rostered for this season. Choose someone else.';
  }
  return raw.replace(/^Supabase request failed with \d+:\s*/i, '')
    || 'We could not update teams.';
}

export function availableInvitationPlayers(team = {}, players = []) {
  const seasonId = String(team.seasonId || '').trim();
  const excludedPlayerIds = new Set([
    ...(Array.isArray(team.roster) ? team.roster : []),
    ...(Array.isArray(team.pendingInvitations) ? team.pendingInvitations : []),
  ].map((entry) => String(entry?.playerId || '').trim()).filter(Boolean));

  return (Array.isArray(players) ? players : []).filter((player) => {
    const playerId = String(player?.id || '').trim();
    if (!playerId || excludedPlayerIds.has(playerId)) return false;
    const activeSeasonIds = Array.isArray(player?.activeSeasonIds)
      ? player.activeSeasonIds.map((id) => String(id || '').trim())
      : [];
    return !seasonId || !activeSeasonIds.includes(seasonId);
  });
}

export function visibleTeamActions(team = {}) {
  if (team.relationship === 'captain') return ['message'];
  if (team.relationship === 'member') return ['message'];
  if (team.relationship === 'pending') return ['cancel'];
  if (team.relationship === 'none') return ['join'];
  return [];
}

export function normalizeTeamCards(management = {}, requests = {}) {
  const cards = [];
  const byId = new Set();

  for (const team of Array.isArray(management.captain_teams) ? management.captain_teams : []) {
    const roster = Array.isArray(team.roster) ? team.roster : [];
    const captain = roster.find((member) => member.role === 'captain');
    const teamId = String(team.teamId || '');
    if (!teamId || byId.has(teamId)) continue;
    byId.add(teamId);
    cards.push({
      ...team,
      teamId,
      relationship: 'captain',
      isMine: true,
      captainName: captain?.displayName || 'You',
      roster,
      rosterCount: roster.length,
    });
  }

  const directoryById = new Map();
  for (const team of Array.isArray(requests.league_teams) ? requests.league_teams : []) {
    if (team?.teamId) directoryById.set(String(team.teamId), { ...team, relationship: 'directory' });
  }
  for (const team of Array.isArray(requests.joinable_teams) ? requests.joinable_teams : []) {
    if (!team?.teamId) continue;
    const relationship = team.hasActiveMembership
      ? 'member'
      : (team.pendingRequestId ? 'pending' : 'none');
    directoryById.set(String(team.teamId), {
      ...(directoryById.get(String(team.teamId)) || {}),
      ...team,
      relationship,
    });
  }

  const remaining = [...directoryById.values()]
    .filter((team) => team?.teamId && !byId.has(String(team.teamId)))
    .map((team) => {
      const relationship = team.relationship || 'directory';
      const roster = Array.isArray(team.roster) ? team.roster : [];
      const rosterCount = team.rosterCount === null || team.rosterCount === undefined
        ? (roster.length ? roster.length : null)
        : Number(team.rosterCount);
      return {
        ...team,
        teamId: String(team.teamId),
        relationship,
        isMine: relationship === 'member',
        captainName: team.captainName || '',
        roster,
        rosterCount,
      };
    })
    .sort((left, right) => Number(right.isMine) - Number(left.isMine)
      || String(left.seasonName || '').localeCompare(String(right.seasonName || ''))
      || String(left.teamName || '').localeCompare(String(right.teamName || '')));

  return cards.concat(remaining);
}

function rosterMarkup(team) {
  const roster = Array.isArray(team.roster) ? team.roster : [];
  if (!roster.length) return '<p class="fd-team-card__empty">No rostered players yet.</p>';
  return `<ul class="fd-team-card__roster">${roster.map((member) => `<li><span>${escapeHtml(member.displayName || 'Player')}</span><strong>${member.role === 'captain' ? 'Captain' : 'Player'}</strong></li>`).join('')}</ul>`;
}

export function renderTeamCard(team = {}) {
  const mine = Boolean(team.isMine);
  const hasRosterCount = team.rosterCount !== null && team.rosterCount !== undefined;
  const captain = team.captainName || (mine ? 'See players' : 'Captain not assigned');
  const relationship = team.relationship === 'captain'
    ? '<span class="fd-team-card__relationship">My team · Captain</span>'
    : (team.relationship === 'member'
      ? '<span class="fd-team-card__relationship">My team · Player</span>'
      : (team.relationship === 'pending' ? '<span class="fd-team-card__pending">Request pending</span>' : ''));
  const rosterFact = hasRosterCount
    ? `<span><small>Players</small><strong>${escapeHtml(`${team.rosterCount} player${Number(team.rosterCount) === 1 ? '' : 's'}`)}</strong></span>`
    : '';
  const canViewRoster = ['captain', 'member'].includes(team.relationship) || hasRosterCount;
  const rosterDetails = canViewRoster
    ? `<details class="fd-team-card__details"><summary>${team.relationship === 'captain' ? 'Manage roster' : 'View players'}</summary>${rosterMarkup(team)}</details>`
    : '';
  const buttons = visibleTeamActions(team).map((action) => {
    if (action === 'message') return `<a href="/messages?team=${encodeURIComponent(team.teamId || '')}">Team messages</a>`;
    if (action === 'cancel') return '<button type="button" class="fd-team-button--quiet">Cancel request</button>';
    return '<button type="button">Request to join</button>';
  }).join('');

  return `<article class="fd-team-card${mine ? ' fd-team-card--mine' : ''}">
    <div class="fd-team-card__head"><span class="fd-team-card__mark">${escapeHtml(teamInitials(team.teamName))}</span><div><div>${relationship}</div><h2>${escapeHtml(team.teamName || 'Unnamed team')}</h2><p>${escapeHtml(team.seasonName || 'Season')}</p></div></div>
    <div class="fd-team-card__facts${hasRosterCount ? '' : ' fd-team-card__facts--single'}"><span><small>Captain</small><strong>${escapeHtml(captain)}</strong></span>${rosterFact}</div>
    ${rosterDetails}
    <div class="fd-team-card__actions">${buttons}</div>
  </article>`;
}

export const jflModernTeamsStyles = `
  :root { --fd-green:#075f3a; --fd-green-dark:#033c25; --fd-line:#b7c1ba; --fd-muted:#535c56; --fd-ink:#151916; }
  .fd-teams,.fd-teams *{box-sizing:border-box}.fd-teams{width:min(100% - 24px,920px);margin:0 auto;padding:28px 0 calc(172px + env(safe-area-inset-bottom));color:var(--fd-ink)}
  .fd-teams [hidden]{display:none!important}.fd-teams h1{margin:0;font-size:clamp(2.2rem,8vw,4rem)}.fd-teams__lede{color:var(--fd-muted);line-height:1.5}
  .fd-teams__toolbar{display:grid;gap:12px;padding:16px;border:2px solid var(--fd-line);border-radius:18px;background:#fff}.fd-teams__toolbar input{width:100%;min-height:48px;padding:0 12px;border:2px solid #9faaA2;border-radius:11px;font:inherit}
  .fd-teams__filters{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;padding:6px;border:2px solid #929f96;border-radius:14px;background:#d9e0db}.fd-teams__filters button{min-height:48px;border:2px solid #7e8b82;border-radius:10px;background:#fff;color:#183b2c;font:inherit;font-weight:950}.fd-teams__filters button[aria-pressed="true"]{border:3px solid #011d12!important;background:var(--fd-green-dark)!important;color:#fff!important;box-shadow:0 0 0 3px #b8d9c7,0 4px 10px rgba(3,60,37,.35)}.fd-teams__filters button[aria-pressed="true"]::before{content:'✓ ';font-weight:1000}
  .fd-teams__status{min-height:22px;margin:0;color:var(--fd-muted)}.fd-teams__status[data-tone="error"]{color:#8c1710;font-weight:800}.fd-teams__status[data-tone="ok"]{color:#045a35;font-weight:800}
  .fd-teams__section{margin-top:30px}.fd-teams__section-head{display:flex;justify-content:space-between;gap:12px;align-items:baseline;margin-bottom:12px}.fd-teams__section-head h2{margin:0}.fd-teams__section-head span{color:var(--fd-muted);font-size:.82rem}.fd-teams__cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
  .fd-team-card{display:grid;gap:18px;padding:20px;border:2px solid #c3cbc5;border-radius:18px;background:#fff;box-shadow:0 5px 16px rgba(0,0,0,.06)}.fd-team-card--mine{border:3px solid var(--fd-green);background:linear-gradient(145deg,#edf7f1,#fff 62%)}
  .fd-team-card__head{display:grid;grid-template-columns:56px minmax(0,1fr);gap:14px;align-items:center}.fd-team-card__mark{width:56px;height:56px;display:grid;place-items:center;border-radius:14px;background:#dceae2;color:var(--fd-green-dark);font-weight:950}.fd-team-card--mine .fd-team-card__mark{background:var(--fd-green);color:#fff}.fd-team-card__head h2{margin:3px 0;font-size:1.2rem;line-height:1.15}.fd-team-card__head p{margin:0;color:var(--fd-muted)}
  .fd-team-card__relationship,.fd-team-card__pending{display:inline-flex;padding:3px 9px;border-radius:999px;font-size:.7rem;font-weight:950;text-transform:uppercase}.fd-team-card__relationship{background:var(--fd-green-dark);color:#fff}.fd-team-card__pending{background:#fff0b8;color:#513b00;border:1px solid #9f7500}
  .fd-team-card__facts{display:grid;grid-template-columns:1fr 1fr;gap:10px}.fd-team-card__facts--single{grid-template-columns:1fr}.fd-team-card__facts>span{padding:14px 15px;border:1px solid #b8c2bb;border-radius:12px;background:#edf1ee}.fd-team-card__facts small{display:block;color:#4b554f;font-size:.7rem;font-weight:950;text-transform:uppercase}.fd-team-card__facts strong{display:block;margin-top:4px;font-size:.95rem}
  .fd-team-card__details{overflow:hidden;border:2px solid #9eada3;border-radius:14px;background:#f5f8f5}.fd-team-card__details summary{min-height:52px;display:flex;align-items:center;padding:0 14px;background:#dfe9e3;color:#034a2c;font-weight:950;cursor:pointer}.fd-team-card__details[open] summary{border-bottom:1px solid #b8c4bc}.fd-team-card__roster{margin:0;padding:0 14px;list-style:none;background:#fff}.fd-team-card__roster li{min-height:52px;display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:10px;align-items:center;padding:12px 0;border-top:1px solid #d5dcd7}.fd-team-card__roster li:first-child{border-top:0}.fd-team-card__roster strong{color:#4b554f;font-size:.72rem;text-transform:uppercase}.fd-team-card__empty{margin:0;padding:14px;color:var(--fd-muted)}
  .fd-team-card__captain-tools{display:grid;gap:16px;padding:16px 14px;border-top:2px solid #cad2cc;background:#eef3ef}.fd-team-card__work-section{overflow:hidden;border:1px solid #b9c5bd;border-radius:12px;background:#fff}.fd-team-card__work-title{margin:0;padding:10px 12px;background:#dfe9e3;font-size:.74rem;text-transform:uppercase}.fd-team-card__work-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 12px;border-top:1px solid #e0e5e1}.fd-team-card__work-copy small{display:block;color:var(--fd-muted)}.fd-team-card__work-actions{display:flex;gap:7px;flex-wrap:wrap}.fd-team-card__invite-block{display:grid;gap:8px}.fd-team-card__invite{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.fd-team-card__invite select{min-height:46px;padding:0 12px;border:2px solid #a7b2aa;border-radius:10px;background:#fff;font:inherit}
  .fd-team-card__actions{display:flex;gap:8px;flex-wrap:wrap}.fd-team-card__actions button,.fd-team-card__actions a,.fd-team-card__invite button,.fd-team-card__roster button,.fd-team-card__work-actions button{min-height:44px;display:inline-flex;align-items:center;justify-content:center;padding:7px 13px;border:2px solid var(--fd-green-dark);border-radius:10px;background:var(--fd-green);color:#fff;font:inherit;font-weight:950;text-decoration:none}.fd-team-button--quiet,.fd-team-card__roster button{background:#fff!important;color:#17412f!important;border-color:#89968d!important}
  .fd-teams__state{margin-top:18px;padding:24px;border:2px dashed var(--fd-line);border-radius:16px;text-align:center;color:var(--fd-muted)}.fd-teams__inbox,.fd-teams__formation{margin-top:28px}.fd-teams__panel,.fd-teams__formation-body{padding:16px;border:2px solid var(--fd-line);border-radius:16px;background:#fff}.fd-teams__formation>summary{min-height:52px;display:flex;align-items:center;padding:0 16px;border:2px solid var(--fd-line);border-radius:14px;background:#fff;color:var(--fd-green);font-weight:950}.fd-teams__formation-form{display:grid;grid-template-columns:1fr 1fr auto;gap:10px}.fd-teams__formation-form input,.fd-teams__formation-form select{min-height:48px;padding:0 12px;border:2px solid #aab5ad;border-radius:10px;font:inherit}.fd-teams__formation-form button{min-height:48px;padding:0 16px;border:0;border-radius:10px;background:var(--fd-green);color:#fff;font-weight:950}
  .fd-teams button:focus-visible,.fd-teams a:focus-visible,.fd-teams input:focus-visible,.fd-teams select:focus-visible,.fd-teams summary:focus-visible{outline:3px solid #00693d;outline-offset:3px}
  @media(max-width:720px){.fd-teams__cards,.fd-teams__formation-form{grid-template-columns:1fr}.fd-team-card{padding:22px}.fd-team-card__actions{display:grid}.fd-team-card__actions>*{width:100%}}
  @media(max-width:520px){.fd-teams__section-head{display:grid}.fd-team-card__invite{grid-template-columns:1fr}.fd-team-card__invite button{width:100%}.fd-team-card__work-row{grid-template-columns:1fr}}
  @media(max-width:390px){.fd-team-card__facts{grid-template-columns:1fr}.fd-team-card__roster li{grid-template-columns:minmax(0,1fr) auto}.fd-team-card__roster button{grid-column:1/-1;width:100%}}
  @media(prefers-reduced-motion:reduce){.fd-teams *{transition:none!important;animation:none!important}}@media(forced-colors:active){.fd-team-card,.fd-teams__toolbar,.fd-teams__filters,.fd-team-card__details{border:1px solid CanvasText}.fd-team-card--mine,.fd-teams__filters button[aria-pressed="true"]{border:3px solid Highlight}}
`;

function teamsClientScript() {
  return String.raw`
(() => {
  const q = (s) => document.querySelector(s);
  const qa = (s) => Array.from(document.querySelectorAll(s));
  const clean = (v) => String(v == null ? '' : v).trim();
  const token = () => sessionStorage.getItem('fd.accessToken') || '';
  const filterKey = 'fd.teams.filter';
  const openTeamKey = 'fd.teams.openTeam';
  const initialUrl = new URL(location.href);
  let filter = initialUrl.searchParams.get('view') || sessionStorage.getItem(filterKey) || 'all';
  if (!['all','mine','open'].includes(filter)) filter = 'all';
  let openTeamId = sessionStorage.getItem(openTeamKey) || '';
  let management = {}, requestData = {}, registrations = [], cards = [];
  const statusEl = q('[data-teams-status]'), contentEl = q('[data-teams-content]'), stateEl = q('[data-teams-state]');
  const mineSection = q('[data-my-teams-section]'), mineList = q('[data-my-team-list]');
  const directorySection = q('[data-team-directory-section]'), directoryList = q('[data-team-directory]'), directoryEmpty = q('[data-team-directory-empty]');
  const searchInput = q('[data-team-search]'), filters = qa('[data-team-filter]');
  const formationForm = q('[data-team-formation-form]'), seasonSelect = q('[data-team-season]'), teamNameInput = q('[data-team-name]'), formationItems = q('[data-team-formation-items]');
  const invitationsEl = q('[data-team-invitations]'), inboxEl = q('[data-teams-inbox]');
  const setStatus = (m,t='muted') => { statusEl.textContent=m; statusEl.dataset.tone=t; };
  const node = (tag,cls,text) => { const e=document.createElement(tag); if(cls)e.className=cls; if(text!=null)e.textContent=text; return e; };
  const button = (label,action,id,quiet=false) => { const e=node('button',quiet?'fd-team-button--quiet':'',label); e.type='button'; e.dataset.teamAction=action; if(id)e.dataset.actionId=id; return e; };
  const initials = (name) => clean(name||'Team').split(/\s+/).filter(Boolean).slice(0,2).map((w)=>w[0]).join('').toUpperCase()||'T';
  async function api(path,options={}) { if(!token()) throw Object.assign(new Error('Sign in to manage teams.'),{status:401}); const r=await fetch(path,{...options,headers:{authorization:'Bearer '+token(),'content-type':'application/json',...(options.headers||{})}}); const text=await r.text(); let body={}; try{body=text?JSON.parse(text):{};}catch{body={error:text};} if(!r.ok) throw Object.assign(new Error(body.error||'Request failed'),{status:r.status}); return body; }
  function syncFilters(){ filters.forEach((b)=>b.setAttribute('aria-pressed',String(b.dataset.teamFilter===filter))); }
  function normalize(){ return (${normalizeTeamCards.toString()})(management,requestData); }
  function renderRoster(team,target){
    target.replaceChildren(); const roster=Array.isArray(team.roster)?team.roster:[];
    const list=node('ul','fd-team-card__roster');
    for(const member of roster){ const li=document.createElement('li'); li.append(node('span','',member.displayName||'Player'),node('strong','',member.role==='captain'?'Captain':'Player')); if(team.relationship==='captain'&&member.role!=='captain'&&member.membershipId) li.append(button('Remove','remove',member.membershipId,true)); list.append(li); }
    if(roster.length) target.append(list); else target.append(node('p','fd-team-card__empty','No rostered players yet.'));
    if(team.relationship!=='captain') return;
    const tools=node('div','fd-team-card__captain-tools');
    for(const [title,items,type] of [['Invited players',team.pendingInvitations||[],'invite'],['Join requests',(requestData.captain_requests||[]).filter((r)=>clean(r.teamId)===clean(team.teamId)||(!r.teamId&&clean(r.teamName)===clean(team.teamName)),'request']]){
      const section=node('section','fd-team-card__work-section'); section.append(node('h3','fd-team-card__work-title',title));
      if(!items.length)section.append(node('p','fd-team-card__empty',type==='invite'?'No pending invites.':'No pending join requests.'));
      for(const item of items){ const row=node('div','fd-team-card__work-row'); const copy=node('div','fd-team-card__work-copy'); copy.append(node('strong','',item.displayName||'Player'),node('small','',type==='invite'?'Invite pending':'Wants to join this team')); const actions=node('div','fd-team-card__work-actions'); if(type==='invite') actions.append(button('Cancel invite','cancel-invite',item.invitationId,true)); else actions.append(button('Approve','approve-request',item.requestId),button('Decline','decline-request',item.requestId,true)); row.append(copy,actions); section.append(row); }
      tools.append(section);
    }
    const inviteBlock=node('div','fd-team-card__invite-block'); inviteBlock.append(node('strong','','Invite another player')); const invite=node('div','fd-team-card__invite'); const select=document.createElement('select'); select.dataset.inviteSelect=team.teamId; select.append(new Option('Invite a player…','')); const excluded=new Set([...roster,...(team.pendingInvitations||[])].map((x)=>clean(x.playerId))); const candidates=(management.players||[]).filter((p)=>!excluded.has(clean(p.id))&&!(p.activeSeasonIds||[]).map(clean).includes(clean(team.seasonId))); for(const p of candidates)select.append(new Option(p.display_name,p.id)); const send=button('Send invite','invite',team.teamId); if(!candidates.length){select.disabled=true;send.disabled=true;} invite.append(select,send); inviteBlock.append(invite); tools.append(inviteBlock); target.append(tools);
  }
  function renderCard(team){
    const article=node('article','fd-team-card'+(team.isMine?' fd-team-card--mine':'')); article.dataset.teamId=team.teamId;
    const head=node('div','fd-team-card__head'); head.append(node('span','fd-team-card__mark',initials(team.teamName))); const id=node('div'); const rel=node('div'); if(team.relationship==='captain'||team.relationship==='member') rel.append(node('span','fd-team-card__relationship',team.relationship==='captain'?'My team · Captain':'My team · Player')); else if(team.relationship==='pending') rel.append(node('span','fd-team-card__pending','Request pending')); id.append(rel,node('h2','',team.teamName||'Unnamed team'),node('p','',team.seasonName||'Season')); head.append(id);
    const hasCount=team.rosterCount!==null&&team.rosterCount!==undefined; const facts=node('div','fd-team-card__facts'+(hasCount?'':' fd-team-card__facts--single')); const captain=document.createElement('span'); captain.append(node('small','','Captain'),node('strong','',team.captainName||(team.isMine?'See players':'Captain not assigned'))); facts.append(captain); if(hasCount){const count=document.createElement('span'); count.append(node('small','','Players'),node('strong','',team.rosterCount+' player'+(team.rosterCount===1?'':'s'))); facts.append(count);}
    article.append(head,facts);
    if(team.relationship==='captain'||team.relationship==='member'||hasCount){ const details=node('details','fd-team-card__details'); if(clean(openTeamId)===clean(team.teamId))details.open=true; const summary=document.createElement('summary'); summary.textContent=team.relationship==='captain'?'Manage roster':'View players'; const body=document.createElement('div'); renderRoster(team,body); details.append(summary,body); details.addEventListener('toggle',()=>{ if(details.open){openTeamId=team.teamId;sessionStorage.setItem(openTeamKey,openTeamId);} else if(clean(openTeamId)===clean(team.teamId)){openTeamId='';sessionStorage.removeItem(openTeamKey);} }); article.append(details); }
    const actions=node('div','fd-team-card__actions'); for(const action of (${visibleTeamActions.toString()})(team)){ if(action==='message'){const a=node('a','','Team messages');a.href='/messages?team='+encodeURIComponent(team.teamId);actions.append(a);} else if(action==='cancel')actions.append(button('Cancel request','cancel',team.pendingRequestId,true)); else actions.append(button('Request to join','join',team.teamId)); } article.append(actions); return article;
  }
  function renderCards(){ syncFilters(); mineList.replaceChildren(); directoryList.replaceChildren(); const query=clean(searchInput.value).toLowerCase(); const visible=cards.filter((t)=>{if(query&&!clean(t.teamName+' '+t.seasonName).toLowerCase().includes(query))return false;if(filter==='mine')return t.isMine;if(filter==='open')return t.relationship==='none';return true;}); const mine=visible.filter((t)=>t.isMine), others=visible.filter((t)=>!t.isMine); mine.forEach((t)=>mineList.append(renderCard(t))); others.forEach((t)=>directoryList.append(renderCard(t))); mineSection.hidden=!mine.length;directorySection.hidden=!others.length;directoryEmpty.hidden=!!visible.length; }
  async function loadLeagueTeams(seasons){ const active=(seasons||[]).filter((s)=>['active','playoffs'].includes(s.status)); const chunks=await Promise.all(active.map(async(s)=>{try{const body=await api('/api/seasons/'+encodeURIComponent(s.id)+'/team-standings');return(body.standings||[]).map((row)=>({teamId:row.team_id,teamName:row.team_name,seasonId:s.id,seasonName:s.name,captainName:row.captain_display_name||'',rosterCount:Number.isFinite(Number(row.roster_count))?Number(row.roster_count):null,roster:Array.isArray(row.roster)?row.roster:[],relationship:'directory'}));}catch{return[];}}));return chunks.flat(); }
  function renderInbox(){ invitationsEl.replaceChildren(); const items=management.invitations||[]; for(const item of items){const row=node('div','fd-team-card__work-row');row.append(node('strong','',item.teamName||'Team'));const actions=node('div','fd-team-card__work-actions');actions.append(button('Accept','accept-invite',item.invitationId),button('Decline','decline-invite',item.invitationId,true));row.append(actions);invitationsEl.append(row);} inboxEl.hidden=!items.length; }
  function renderFormation(seasons){ formationItems.replaceChildren(); const open=(${availableTeamApplicationSeasons.toString()})(seasons,registrations); seasonSelect.replaceChildren(); if(open.length)open.forEach((s)=>seasonSelect.append(new Option(s.name+' · New team application',s.id))); else seasonSelect.append(new Option('No registration season is open','')); seasonSelect.disabled=!open.length;teamNameInput.disabled=!open.length;formationForm.querySelector('button').disabled=!open.length; for(const reg of registrations){for(const item of reg.applications||[]){const p=node('p','', (item.proposedTeamName||'New team')+' · '+clean(item.status||'submitted'));formationItems.append(p);}}
  }
  async function load(){ if(!token()){stateEl.hidden=false;stateEl.textContent='Sign in to see teams.';contentEl.hidden=true;return;} setStatus('Loading teams…'); try{const[teamBody,requestBody,seasonBody]=await Promise.all([api('/api/me/teams'),api('/api/me/team-membership-requests'),api('/api/seasons')]); const seasons=seasonBody.seasons||[]; registrations=await Promise.all(seasons.filter((s)=>s.status==='registration').map(async(s)=>{const body=await api('/api/seasons/'+encodeURIComponent(s.id)+'/team-registration/me');return{...(body.registration||{}),seasonId:s.id};})); management=teamBody.teamManagement||{}; requestData=requestBody.requests||{}; requestData.league_teams=await loadLeagueTeams(seasons); cards=normalize(); renderCards();renderInbox();renderFormation(seasons);contentEl.hidden=false;stateEl.hidden=true;setStatus(cards.length?cards.length+' teams available':'No teams available','ok');}catch(error){contentEl.hidden=true;stateEl.hidden=false;stateEl.textContent=error.message||'Could not load teams';setStatus(error.message||'Could not load teams','error');}}
  async function mutate(action,id){ if(action==='join')await api('/api/teams/'+encodeURIComponent(id)+'/membership-request',{method:'POST',body:'{}'}); if(action==='cancel')await api('/api/team-membership-requests/'+encodeURIComponent(id)+'/cancel',{method:'POST',body:'{}'}); if(action==='accept-invite'||action==='decline-invite')await api('/api/team-invitations/'+encodeURIComponent(id)+'/respond',{method:'POST',body:JSON.stringify({response:action==='accept-invite'?'accepted':'declined'})}); if(action==='cancel-invite')await api('/api/team-invitations/'+encodeURIComponent(id)+'/cancel',{method:'POST',body:'{}'}); if(action==='approve-request'||action==='decline-request')await api('/api/team-membership-requests/'+encodeURIComponent(id)+'/respond',{method:'POST',body:JSON.stringify({response:action==='approve-request'?'approved':'declined'})}); if(action==='remove')await api('/api/team-memberships/'+encodeURIComponent(id)+'/remove',{method:'POST',body:'{}'}); if(action==='invite'){const select=q('[data-invite-select="'+CSS.escape(id)+'"]');if(!select?.value)throw new Error('Choose a player to invite.');await api('/api/teams/'+encodeURIComponent(id)+'/invitations',{method:'POST',body:JSON.stringify({playerId:select.value})});}}
  filters.forEach((b)=>b.addEventListener('click',()=>{filter=b.dataset.teamFilter;sessionStorage.setItem(filterKey,filter);const url=new URL(location.href);url.searchParams.set('view',filter);history.replaceState(null,'',url);renderCards();})); searchInput.addEventListener('input',renderCards);
  document.addEventListener('click',async(e)=>{const c=e.target.closest('[data-team-action]');if(!c)return;const action=c.dataset.teamAction,id=c.dataset.actionId||'';c.disabled=true;try{await mutate(action,id);await load();setStatus('Team updated','ok');}catch(error){c.disabled=false;setStatus(friendlyTeamsError(error.message),'error');}});
  formationForm.addEventListener('submit',async(e)=>{e.preventDefault();const seasonId=seasonSelect.value,teamName=clean(teamNameInput.value);if(!seasonId||!teamName){setStatus('Choose a season and enter a team name.','error');return;}try{await api('/api/seasons/'+encodeURIComponent(seasonId)+'/team-applications',{method:'POST',body:JSON.stringify({teamName})});teamNameInput.value='';await load();setStatus('New team application submitted','ok');}catch(error){setStatus(friendlyTeamsError(error.message),'error');}});
  syncFilters(); load();
})();`;
}

function teamsDocument() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Teams · Fremont Derby</title><style>${jflModernTeamsStyles}</style></head><body>
  <main class="fd-teams" data-fd-modern-teams="true"><header><h1>Teams</h1><p class="fd-teams__lede">Find a team quickly. Compact cards show the captain and player count; expand a team only when you want its roster.</p></header>
  <section class="fd-teams__toolbar"><label>Search teams<input type="search" data-team-search placeholder="Team or season"/></label><div class="fd-teams__filters" aria-label="Team filters"><button type="button" data-team-filter="all" aria-pressed="true">All teams</button><button type="button" data-team-filter="mine" aria-pressed="false">My teams</button><button type="button" data-team-filter="open" aria-pressed="false">Open to join</button></div><p class="fd-teams__status" data-teams-status role="status">Loading teams…</p></section>
  <div class="fd-teams__state" data-teams-state>Loading teams…</div><div data-teams-content hidden>
  <section class="fd-teams__section" data-my-teams-section hidden><div class="fd-teams__section-head"><h2>My teams</h2><span>Current memberships first</span></div><div class="fd-teams__cards" data-my-team-list></div></section>
  <section class="fd-teams__section" data-team-directory-section hidden><div class="fd-teams__section-head"><h2>League teams</h2><span>Tap View players for the roster</span></div><div class="fd-teams__cards" data-team-directory></div></section><div class="fd-teams__state" data-team-directory-empty hidden>No matching teams.</div>
  <section class="fd-teams__inbox" data-teams-inbox hidden><article class="fd-teams__panel"><h2>My invitations</h2><div data-team-invitations></div></article></section>
  <details class="fd-teams__formation"><summary>Start or return a team</summary><div class="fd-teams__formation-body"><form class="fd-teams__formation-form" data-team-formation-form><select data-team-season></select><input data-team-name maxlength="80" placeholder="New team name"/><button type="submit">Apply for a team slot</button></form><div data-team-formation-items></div></div></details></div>
  <p><a href="/teams?ui=legacy">View classic Teams</a></p></main><script>${teamsClientScript()}</script></body></html>`;
}

export function renderJflModernTeams() {
  return decorateHtmlWithShell(teamsDocument(), '/teams');
}

export function routeJflModernTeams(request, env = {}) {
  if (env?.ENVIRONMENT !== 'jfl' || !request || request.method !== 'GET') return null;
  const url = new URL(request.url);
  if (url.pathname !== '/teams' || url.searchParams.get('ui') === 'legacy') return null;
  return new Response(renderJflModernTeams(), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-fremont-ui-mode': 'modern-teams-v1',
    },
  });
}

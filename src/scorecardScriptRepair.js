const OLD_HOOK = 'filtersEl.hidden=false;populateMatchups();selectRequestedMatch()}';
const NEW_HOOK = 'filtersEl.hidden=false;populateMatchups();selectRequestedMatch();void honorRequestedMatchDate()}';
const HONOR_FN = "function honorRequestedMatchDate(){if(!requestedMatch||requestedContext())return Promise.resolve();return fetch('/api/seasons').then((response)=>response.json()).then((body)=>{const seasons=body.seasons||[];const active=seasons.find((season)=>season.status==='active')||seasons[0];if(!active)return null;return fetch('/api/seasons/'+encodeURIComponent(active.id)+'/schedule').then((response)=>response.json())}).then((body)=>{if(!body)return;const rounds=body.rounds||[];for(const round of rounds){const match=(round.matches||[]).find((item)=>item.teamMatchId===requestedMatch);if(!match)continue;const date=round.scheduledOn||round.scheduled_on||'';if(!date)return;if(!Array.from(dateSelect.options).some((option)=>option.value===date)){const option=document.createElement('option');option.value=date;option.textContent=dateLabel(date);dateSelect.append(option)}dateSelect.value=date;populateMatchups();setStatus('Opened the night for that table.');return}}).catch(()=>{})}";

export function repairScorecardScript(html) {
  let next = String(html || '');
  if (!next.includes('function honorRequestedMatchDate')) {
    next = next.replace('function selectRequestedMatch()', HONOR_FN + 'function selectRequestedMatch()');
  }
  return next.replace(OLD_HOOK, NEW_HOOK);
}

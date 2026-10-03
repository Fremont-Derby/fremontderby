export function requestedMatchId(search) {
  const params = new URLSearchParams(search || '');
  return params.get('match') || params.get('match_id') || '';
}

export function scoreHref(matchId, date) {
  const params = new URLSearchParams();
  if (matchId) params.set('match', matchId);
  if (date) params.set('date', date);
  const query = params.toString();
  return query ? '/scorecard?' + query : '/scorecard';
}

export function selectRequestedMatch(select, matchId) {
  if (!select || !matchId) return false;
  const option = [...select.options].find((item) => item.value === matchId);
  if (!option) return false;
  select.value = matchId;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

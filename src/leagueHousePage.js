export function renderLeagueHousePage(settings = {}) {
  const value = (name) => settings[name] ? ` value="${String(settings[name]).replace(/"/g, '"')}"` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>League house</title></head><body><main><h1>League house</h1><p>The owner sets the house. This does not send results to Fargo.</p><form method="post" action="/admin/league-house"><label>Venue<input name="venue"${value('venue')}></label><label>Table size<input name="tableSize"${value('tableSize')}></label><label>Number of tables<input name="tableCount" type="number" min="1" max="32"${value('tableCount')}></label><label>League night<input name="leagueNight"${value('leagueNight')}></label><button type="submit">Save</button></form></main></body></html>`;
}

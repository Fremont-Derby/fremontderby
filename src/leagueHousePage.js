export function renderLeagueHousePage(settings = {}) {
  const example = { venue: 'Example House', tableSize: '7-foot', tableCount: 4, leagueNight: 'Wednesday' };
  const shown = {
    venue: settings.venue || example.venue,
    tableSize: settings.tableSize || example.tableSize,
    tableCount: settings.tableCount || example.tableCount,
    leagueNight: settings.leagueNight || example.leagueNight,
  };
  const value = (name) => shown[name] ? ` value="${String(shown[name]).replace(/"/g, '"')}"` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>League house</title></head><body><main><h1>League house</h1><p>Example values are filled in. Save replaces them. This does not send results to Fargo.</p><form method="post" action="/admin/league-house"><label>Venue<input name="venue"${value('venue')}></label><label>Table size<input name="tableSize"${value('tableSize')}></label><label>Number of tables<input name="tableCount" type="number" min="1" max="32"${value('tableCount')}></label><label>League night<input name="leagueNight"${value('leagueNight')}></label><button type="submit">Save</button></form></main></body></html>`;
}

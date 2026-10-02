export function renderFargoReportsPage(summary = { unreported: [], missingLinks: [], corrections: [] }) {
  const list = (rows) => rows.map((row) => `<li>${row.player_match_id || row.payload?.playerMatchId || 'match'} · ${row.status}</li>`).join('') || '<li>None</li>';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Fargo reports</title></head><body><main><h1>Fargo reports</h1><p>Nothing on this page has been sent to Fargo.</p><h2>Unreported</h2><ul>${list(summary.unreported)}</ul><h2>Missing Fargo id</h2><ul>${list(summary.missingLinks)}</ul><h2>Corrections</h2><ul>${list(summary.corrections)}</ul></main></body></html>`;
}

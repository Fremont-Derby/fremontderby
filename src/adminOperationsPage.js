import { adminSurveyLine } from './surveySummary.js';
import { datasetLine, shadowModelLine } from './datasetLine.js';
import { safeAutocompleteClientScript } from './safeAutocomplete.js';
import { safeJson } from './textEscape.js';
export function renderAdminOperationsPage(env = {}) {
  const survey = adminSurveyLine([{ mission: 'find my next match', result: 'passed' }]);
  const dataset = datasetLine({ name: 'defects', rows: 12 });
  const shadow = shadowModelLine({ name: 'ranking' });
  const config = safeJson({
    supabaseUrl: env.SUPABASE_URL || '',
    supabasePublishableKey: env.SUPABASE_PUBLISHABLE_KEY || '',
  });
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>League operations · Fremont Derby</title>
</head>
<body>
  <p data-admin-survey>${survey}</p>
  <p data-dataset>${dataset}</p>
  <p data-shadow-model>${shadow}</p>
  <main class="app">
    <section data-night-checklist><h2>League night</h2><label><input type="checkbox" data-night-step="roster" /> Roster is set</label><label><input type="checkbox" data-night-step="schedule" /> Schedule is posted</label><label><input type="checkbox" data-night-step="scores" /> Scores can be entered</label><p data-night-ready>Night is not ready.</p></section>
    <p class="note" data-night-budget>On league night, a page should answer in a few seconds. If it does not, retry once, then record the workflow.</p>
    <header class="head"><div><h1>League operations</h1><div class="sub" data-season>Is Fremont Derby running smoothly?</div></div></header>
    <section class="metrics" aria-label="League summary"></section>
    <section class="layout"><article class="panel"><h2>Needs attention</h2><div class="actions" data-actions></div></article></section>
  </main>
  <script>
    const config=${config};
  </script>
${safeAutocompleteClientScript}
</body>
</html>`;
}

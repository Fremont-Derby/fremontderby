import { adminSurveyLine } from './surveySummary.js';
import { datasetLine, shadowModelLine } from './datasetLine.js';
import { safeAutocompleteClientScript } from './safeAutocomplete.js';
import { safeJson } from './textEscape.js';
export function renderAdminOperationsPage(env = {}) {
  const survey = adminSurveyLine([{ mission: 'find my next match', result: 'passed' }]);
  const dataset = datasetLine({ name: 'defects', rows: 12 });
  const shadow = shadowModelLine({ name: 'ranking' });
  return `<!doctype html>
<html lang="en">
<body>
  <p data-admin-survey>${survey}</p>
  <p data-dataset>${dataset}</p>
  <p data-shadow-model>${shadow}</p>
</body>
</html>`;
}

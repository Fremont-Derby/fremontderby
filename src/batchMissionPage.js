import { batchMissionLine, surveyPromiseLine } from './batchMission.js';

export function renderBatchMissionPage() {
  const batch = batchMissionLine({ count: 6 });
  const survey = surveyPromiseLine({ after: 'the sixth mission' });
  return `<!doctype html>\n<html lang="en">\n<body>\n  <p data-batch>${batch}</p>\n  <p data-survey-promise>${survey}</p>\n</body>\n</html>`;
}

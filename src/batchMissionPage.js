import { batchMissionLine, surveyPromiseLine, sixthMissionLine } from './batchMission.js';

export function renderBatchMissionPage() {
  const batch = batchMissionLine({ count: 6 });
  const survey = surveyPromiseLine({ after: 'the sixth mission' });
  const sixth = sixthMissionLine({ name: 'find my team' });
  return `<!doctype html>\n<html lang="en">\n<body>\n  <p data-batch>${batch}</p>\n  <p data-survey-promise>${survey}</p>\n  <p data-sixth>${sixth}</p>\n</body>\n</html>`;
}

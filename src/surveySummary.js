export function recentSurveyLine(rows = []) {
  const recent = rows.filter((row) => row.mission && row.result).slice(0, 3);
  if (!recent.length) return 'No recent survey results.';
  return recent.map((row) => `${row.mission}: ${row.result}`).join('; ') + '.';
}
export function adminSurveyLine(rows = []) {
  return `Admin survey: ${recentSurveyLine(rows)}`;
}

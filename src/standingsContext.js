export function standingsContextLabel(row) {
  if (!row || !row.teamName) return 'No standings context';
  return row.teamName + ' is ' + (row.place || 'unranked');
}

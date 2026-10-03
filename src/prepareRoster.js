export function prepareRoster(teamName) {
  const team = String(teamName || 'Team').trim() || 'Team';
  return [
    { name: `${team} Captain`, phone: '5550100' },
    { name: `${team} Mate`, phone: '5550101' },
    { name: `${team} Spare`, phone: '5550102' },
  ];
}

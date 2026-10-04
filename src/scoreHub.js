export function scoreHubLabel(match) {
  return match && match.teamAName ? match.teamAName + ' vs ' + match.teamBName : 'No score hub match';
}

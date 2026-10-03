export function blackoutDateLabel(season) {
  return season && season.blackoutOn ? 'Blackout ' + season.blackoutOn : 'No blackout date';
}

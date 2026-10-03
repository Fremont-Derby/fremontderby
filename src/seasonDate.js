export function seasonDateLabel(season) {
  return season && season.startsOn ? 'Starts ' + season.startsOn : 'Season date is not set';
}

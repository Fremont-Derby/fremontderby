export function nightStatusLabel(season) {
  return season && season.playNight ? season.playNight + ' night' : 'Play night is not set';
}

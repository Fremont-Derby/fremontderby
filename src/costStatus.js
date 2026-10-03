export function costStatusLabel(season) {
  return season && season.cost ? season.cost : 'Cost is not set';
}

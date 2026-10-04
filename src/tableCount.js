export function tableCountLabel(season) {
  return season && season.tableCount ? season.tableCount + ' tables' : 'Table count is not set';
}

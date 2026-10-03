export function tableStatusLabel(match) {
  return match && match.tableNumber ? 'Table ' + match.tableNumber : 'Table is not set';
}

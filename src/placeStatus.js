export function placeStatusLabel(row) {
  return row && row.place ? 'Place ' + row.place : 'Place is not set';
}

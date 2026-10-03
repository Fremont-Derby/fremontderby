export function datasetLine(set = {}) {
  if (!set.name || set.rows == null) return '';
  return `Dataset ${set.name}: ${set.rows} rows.`;
}
export function shadowModelLine(model = {}) {
  if (!model.name) return '';
  return `Shadow model: ${model.name}.`;
}

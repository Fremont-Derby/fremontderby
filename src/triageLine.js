export function triageLabelLine(label = {}) {
  if (!label.name || !label.issue) return '';
  return `Triage ${label.name} for #${label.issue}.`;
}
export function defectRecommendationLine(defect = {}) {
  if (!defect.name) return '';
  return `Recommend: check ${defect.name}.`;
}

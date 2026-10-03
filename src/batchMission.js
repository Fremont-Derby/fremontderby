export function batchMissionLine(batch = {}) {
  if (!batch.count) return '';
  return `Batch: ${batch.count} missions.`;
}
export function surveyPromiseLine(promise = {}) {
  if (!promise.after) return '';
  return `Survey after ${promise.after}.`;
}

export function standingsContextLine(row = {}) {
  if (!row.team || row.place == null) return '';
  return `${row.team} is in place ${row.place}.`;
}
export function missionTaskLine(task = {}) {
  if (!task.task) return '';
  return `Task: ${task.task}`;
}

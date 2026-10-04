export function missionStep(title) {
  if (!title) return 'Name the mission before the step starts.';
  return `${title} shows its step and an abort control.`;
}

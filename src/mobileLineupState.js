export function mobileLineupState(teamName, submitted) {
  const name = String(teamName || '').trim() || 'This team';
  return submitted ? `${name}: submitted` : `${name}: open`;
}

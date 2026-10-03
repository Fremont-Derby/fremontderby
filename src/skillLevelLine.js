export function skillLevelLine(level) {
  const value = String(level || '').trim();
  return value ? `Skill: ${value}` : 'Skill not set';
}

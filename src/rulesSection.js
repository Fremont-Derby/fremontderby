export function rulesSectionLine(topic) {
  const name = String(topic || '').trim() || 'Rules';
  return `Rules: ${name}`;
}

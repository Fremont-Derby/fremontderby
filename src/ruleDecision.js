export function recordRuleDecision({ rule, impact, date }) {
  const text = String(rule || '').trim();
  const effect = String(impact || '').trim();
  if (!text) return { ok: false, reason: 'Name the rule.' };
  if (!effect) return { ok: false, reason: 'Say what the rule changes.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return { ok: false, reason: 'Date the decision.' };
  return { ok: true, rule: text, impact: effect, date };
}

export function launchMission({ persona, task }) {
  const who = String(persona || '').trim();
  const text = String(task || '').trim();
  if (!who) return { ok: false, reason: 'Name the persona.' };
  if (text.length < 12) return { ok: false, reason: 'Say the task in plain language.' };
  if (/fixture|json/i.test(text)) return { ok: false, reason: 'The task cannot be fixture data.' };
  return { ok: true, persona: who, task: text };
}

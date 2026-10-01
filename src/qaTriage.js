export const TRIAGE_LABELS = [

  'discoverability',

  'visual-state',

  'layout',

  'invalid-state',

  'data-wrong',

  'blocked',

];



export function triageDefect({ label, summary, issue }) {

  if (!TRIAGE_LABELS.includes(label)) return { ok: false, reason: 'Choose a triage label.' };

  const text = String(summary || '').trim();

  if (!text) return { ok: false, reason: 'Say what failed.' };

  const number = Number(issue);

  if (!Number.isInteger(number) || number <= 0) return { ok: false, reason: 'Link the GitHub issue number.' };

  return { ok: true, label, summary: text, issue: number, link: `https://github.com/Fremont-Derby/fremontderby/issues/${number}` };

}

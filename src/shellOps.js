export function sharedShell(page) {
  return { shell: 'shared', text: page?.name ? `${page.name} keeps the shared shell.` : 'Page needs a name.' };
}

export function functionalSmoke(check) {
  if (!check?.data) return { ready: false, text: 'Wait for functional data before the human gate.' };
  return { ready: true, text: 'Functional data is present.' };
}

export function twoCaptains(a, b) {
  if (!a?.name || !b?.name || a.name === b.name) return null;
  return { sessions: [a.name, b.name], text: `${a.name} and ${b.name} have separate sessions.` };
}

export function spamLimit(count) {
  return { allowed: count < 5, text: count < 5 ? 'Message allowed.' : 'Slow down before sending again.' };
}

export function reportEvidence(report) {
  if (!report?.id) return null;
  return { id: report.id, body: null, text: 'The report is kept without the other private messages.' };
}

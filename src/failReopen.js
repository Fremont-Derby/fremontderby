export function failReopen({ verdict, gate }) {
  if (verdict === 'fail') return { open: true, text: `${gate || 'This gate'} stays open. Link the blocker before the next try.` };
  return { open: false, text: `${gate || 'This gate'} can stay closed.` };
}

export function sharedShell(page) {
  return { text: `${page || 'This page'} keeps the shared shell: Home, Schedule, Standings, and Teams.` };
}

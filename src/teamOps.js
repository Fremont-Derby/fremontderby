export function teamIdentity(team, nextName) {
  if (team?.locked) return { changed: false, text: 'Team identity is locked for this season.' };
  return { changed: true, text: `Team can be renamed to ${nextName}.` };
}

export function opposingLineup(home, away) {
  if (!home?.players?.length || !away?.players?.length) return { ready: false, text: 'Both lineups are required.' };
  return { ready: true, text: `${home.name} against ${away.name}.` };
}

export function bootstrapStatus(status) {
  return { ok: status === 200, text: status === 405 ? 'Season bootstrap was blocked.' : 'Season bootstrap loaded.' };
}

export function durableBinding(name) {
  return { ok: Boolean(name), text: name ? `${name} is a durable binding.` : 'Binding name is missing.' };
}

export function onionPages() {
  return ['schedule', 'teams', 'scorecard', 'messages', 'profile'];
}

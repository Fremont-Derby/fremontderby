export function messageChannels() {
  return ['direct', 'team', 'general'];
}

export function deployOrder(schemaReady) {
  if (!schemaReady) return { next: 'schema', text: 'Apply the schema before the app.' };
  return { next: 'app', text: 'The schema is ready. Ship the app.' };
}

export function rulesVersion(season) {
  if (!season?.rules) return null;
  return { season: season.name, rules: season.rules, text: `${season.name} uses rules ${season.rules}.` };
}

export function sessionExpired(step) {
  return { saved: Boolean(step), text: step ? `Sign in again to finish ${step}.` : 'Sign in again.' };
}

export function standingsLoad(mode) {
  if (!mode) return { visible: false, text: 'Pick a standings view.' };
  return { visible: true, text: `Showing ${mode} standings.` };
}

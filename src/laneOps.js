export function cloneDrift(prod, staging) {
  const missing = (prod || []).filter((name) => !(staging || []).includes(name));
  return { drifted: missing.length > 0, missing, text: missing.length ? `Staging is missing ${missing[0]}.` : 'Staging matches the read models.' };
}

export function smokeException(path) {
  return { path, text: path === '/health' ? 'Release smoke may call health without a manual click.' : 'This path still needs the normal check.' };
}

export function laneBase(lane) {
  const bases = { dru: 'fremontderby-dru', gamma: 'fremontderby-gamma', jfl: 'fremontderby-jfl' };
  return { base: bases[lane] || null, text: bases[lane] ? `${lane} targets ${bases[lane]}.` : 'Unknown lane.' };
}

export function emptyState(page) {
  if (page?.items) return null;
  return { action: page?.action || 'Add the first item', text: 'Nothing here yet. One next action.' };
}

export function closeKeyword(body) {
  return { closes: /\b(close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#\d+/i.test(body || ''), text: 'Use Tracks, not a close keyword, until verification.' };
}

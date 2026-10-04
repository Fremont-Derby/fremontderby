export function releaseManifest(surfaces) {
  const names = (surfaces || []).filter(Boolean);
  if (!names.length) return { text: 'No approved surface yet. Name the page before release.' };
  return { text: `Approved surfaces: ${names.join(', ')}.` };
}

export function reversibleGate(name) {
  return { text: `${name || 'This gate'} can be turned off without turning off the rest.` };
}

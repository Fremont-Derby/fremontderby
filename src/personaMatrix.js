export function personaMatrix(personas) {
  const names = (personas || []).filter(Boolean);
  if (!names.length) return { text: 'Name the tester before the gate. A captain and a player are the minimum.' };
  return { text: `Testers: ${names.join(', ')}.` };
}

export function workersBuild(lane) {
  return { text: `${lane || 'This lane'} builds from its own branch. It does not restamp another lane.` };
}

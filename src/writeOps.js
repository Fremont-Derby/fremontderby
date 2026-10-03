export function staleWrite(client, server) {
  if ((client?.version || 0) < (server?.version || 0)) return { ok: false, text: 'A stale client cannot overwrite the server.' };
  return { ok: true, text: 'Write is current.' };
}

export function regressionCheck(gate) {
  return { ok: Boolean(gate?.passed && gate?.rerun), text: gate?.rerun ? 'Passed gate was rerun.' : 'Passed gate has no rerun.' };
}

export function fixture(row) {
  return { ok: Boolean(row?.id) && !row?.sql, text: row?.sql ? 'Fixture cannot use direct SQL.' : 'Fixture is trusted.' };
}

export function reverseGate(gate) {
  return { ok: Boolean(gate?.undo), text: gate?.undo || 'Name the undo step.' };
}

export function personaMatrix(row) {
  return { ok: Boolean(row?.persona && row?.gate), text: row?.persona ? `${row.persona} covers ${row.gate}.` : 'Name the persona and the gate.' };
}

export function releaseManifest(surface) {
  return { text: surface?.name ? `${surface.name} is in the release.` : 'Name the surface.' };
}

export function supportInfra(item) {
  return { ok: Boolean(item?.evidence), text: item?.evidence || 'Attach the evidence.' };
}

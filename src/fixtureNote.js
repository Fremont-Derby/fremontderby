export function fixtureNote({ source }) {
  if (source === 'sql') return { ok: false, text: 'A validation fixture cannot come from direct SQL. Use the screen.' };
  return { ok: true, text: 'This fixture comes from the screen.' };
}

export function defectCapture({ gate, reason }) {
  if (!gate || !reason) return { ok: false, text: 'A failed gate needs the gate name and the reason.' };
  return { ok: true, text: `${gate} failed: ${reason}.` };
}

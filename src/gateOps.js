export function reverseGate(gate) {
  if (!gate?.name) return null;
  return { name: gate.name, on: !gate.on, text: gate.on ? `${gate.name} can be turned off.` : `${gate.name} can be turned on.` };
}

export function humanFail(gate) {
  return { open: true, text: `${gate?.name || 'This gate'} stays open until the human check passes.` };
}

export function reviewAfterFour(findings) {
  const batch = (findings || []).slice(0, 4);
  return { count: batch.length, text: batch.length === 4 ? 'Review these four findings.' : 'Fewer than four findings.' };
}

export function mobileShot(page) {
  if (!page?.name) return null;
  return { width: 390, name: page.name, text: `Screenshot ${page.name} at 390 pixels.` };
}

export function diagnosticBundle(report) {
  if (!report?.lane || !report?.sha) return null;
  return { text: `${report.lane} at ${report.sha}: ${report.note || 'no note'}` };
}

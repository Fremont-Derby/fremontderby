export function laneStamp({ lane, stamped }) {
  if (stamped && stamped !== lane) return { ok: false, text: `${lane || 'This lane'} must not be restamped as ${stamped}.` };
  return { ok: true, text: `${lane || 'This lane'} keeps its own deploy command.` };
}

export function deployCommand(lane) {
  return { text: `${lane || 'This lane'} deploys only from its branch command.` };
}

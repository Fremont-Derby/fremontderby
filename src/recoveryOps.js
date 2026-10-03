export function recoveryTargets() {
  return { point: 'last closed night', time: '30 minutes', text: 'Recover to the last closed night within 30 minutes.' };
}

export function hesitation(events) {
  const repeats = (events || []).filter((event) => event.kind === 'repeat' || event.kind === 'stuck');
  return { count: repeats.length, text: repeats.length ? 'A tester repeated a step.' : 'No hesitation recorded.' };
}

export function humanHelp(task) {
  return { needed: Boolean(task?.stuck), text: task?.stuck ? 'A person has to step in.' : 'No human help needed.' };
}

export function agingReview(features) {
  return (features || []).filter((feature) => feature.unusedDays > 90).map((feature) => feature.name);
}

export function stableRead(call) {
  if (call?.writes) return { ok: false, text: 'A stable read cannot write.' };
  return { ok: true, text: 'Read stays read-only.' };
}

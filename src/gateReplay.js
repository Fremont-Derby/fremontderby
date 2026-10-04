export function gateReplay({ gate, passed }) {
  if (!passed) return { ok: false, text: `${gate || 'This gate'} has not passed. Replay it before release.` };
  return { ok: true, text: `${gate || 'This gate'} has a replay.` };
}

export function rulesetJson(lanes) {
  const names = (lanes || []).filter(Boolean);
  if (!names.length) return { text: 'Name Main, Gamma, and JFL before the ruleset is copied.' };
  return { text: `Ruleset copy covers ${names.join(', ')}.` };
}

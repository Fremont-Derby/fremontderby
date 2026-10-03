export function rulesetLanes(lanes) {
  const names = (lanes || []).filter(Boolean);
  if (!names.length) return 'Name Main, Gamma, and JFL before the ruleset is copied.';
  return `Ruleset copy covers ${names.join(', ')}.`;
}

export function readyToPort(slices) {
  return (slices || []).filter((slice) => slice.proven && !slice.druOnly).map((slice) => slice.name);
}

export function rulesetNames() {
  return ['main', 'fremontderby-gamma', 'fremontderby-jfl', 'fremontderby-dru'];
}

export function nextAction(page) {
  if (page?.items) return null;
  return { text: page?.action || 'Do the one next thing.' };
}

export function blockerList(blockers) {
  return (blockers || []).filter((blocker) => blocker.human).map((blocker) => blocker.name);
}

export function peelPages() {
  return ['home', 'schedule', 'teams', 'scorecard', 'profile'];
}

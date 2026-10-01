export function isolatedBinding(lane, project) {
  if (!lane || !project) return { ok: false, text: 'Lane and project are required.' };
  return { ok: !project.includes('prod'), text: project.includes('prod') ? 'This binding points at production.' : `${lane} has its own project.` };
}

export function buildOrder(jflReady) {
  return { next: jflReady ? 'gamma' : 'jfl', text: jflReady ? 'JFL build is present.' : 'Restore the JFL build before Gamma.' };
}

export function productionAllowlist(name) {
  const allowed = ['fremontderby'];
  return { ok: allowed.includes(name), text: allowed.includes(name) ? 'Production name is allowed.' : 'Unknown production name is blocked.' };
}

export function laneSeparation(lanes) {
  const projects = new Set((lanes || []).map((lane) => lane.project));
  return { ok: projects.size === (lanes || []).length, text: projects.size === (lanes || []).length ? 'Lanes do not share a project.' : 'Two lanes share a project.' };
}

export function druRulesetName(name) {
  return { ok: name === 'fremontderby-dru', text: name === 'fremontderby-dru' ? 'DRU ruleset name is correct.' : 'DRU ruleset name does not match.' };
}

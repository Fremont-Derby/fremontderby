export function operationsHealth(check) {
  if (!check?.name) return { ok: false, text: 'Name the check.' };
  return { ok: check.ok, text: check.ok ? `${check.name} is healthy.` : `${check.name} needs attention.` };
}

export function playerDetail(player) {
  if (!player?.name) return null;
  return { name: player.name, eligible: Boolean(player.eligible), text: `${player.name} is ${player.eligible ? 'eligible' : 'blocked'}.` };
}

export function seasonLifecycle(season) {
  const states = ['draft', 'open', 'closed'];
  if (!states.includes(season?.status)) return null;
  return { status: season.status, text: `${season.name} is ${season.status}.` };
}

export function rackConfirmation(rack) {
  if (!rack?.score) return { confirmed: false, text: 'Enter the rack score before confirming.' };
  return { confirmed: true, text: `Confirm rack score ${rack.score}.` };
}

export function profilePolish(profile) {
  return { ready: Boolean(profile?.name && profile?.phone), text: profile?.name ? 'Profile polish is ready to retest.' : 'Profile is missing a name.' };
}

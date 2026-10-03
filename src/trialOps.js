export function seasonTrial(trial) {
  return { ok: trial?.captains === 2 && trial?.season === 1, text: 'Season 1 trial needs two captains.' };
}

export function publicSurface(check) {
  return { ok: check?.status === 200, text: check?.status === 200 ? `${check.name} returned 200.` : `${check?.name || 'Surface'} failed.` };
}

export function teamMission(team) {
  if (!team?.name || !team?.captain) return { ok: false, text: 'Name the team and the captain.' };
  return { ok: true, text: `You play for ${team.name}. Captain is ${team.captain}.` };
}

export function contrastPair(row) {
  return { ok: Boolean(row?.name && row?.status), text: row?.status ? `${row.name} is ${row.status}.` : 'Status is missing.' };
}

export function profileRetest(profile) {
  return { ready: Boolean(profile?.name && profile?.phone), text: 'Profile retest needs a name and a phone.' };
}

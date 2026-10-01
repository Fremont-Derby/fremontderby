export function messageChannel(message) {
  return { ok: ['direct', 'team', 'league'].includes(message?.channel), text: 'Messages are direct, team, or league.' };
}

export function prizePayout(prize) {
  return { ok: Boolean(prize?.name) && prize?.amount >= 0, text: prize?.name ? `${prize.name} pays ${prize.amount}.` : 'Prize needs a name.' };
}

export function postseasonLineup(lineup) {
  return { ok: (lineup?.players || []).length === 4, text: 'Postseason lineup has four players.' };
}

export function adminRecovery(failure) {
  return { ok: Boolean(failure?.step), text: failure?.step || 'Name the recovery step.' };
}

export function cleanRoomTrial(trial) {
  return { ok: trial?.captains === 2 && trial?.clean, text: trial?.clean ? 'Two captains, clean room.' : 'Trial is not clean.' };
}

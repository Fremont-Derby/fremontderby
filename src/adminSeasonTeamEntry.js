export const INITIAL_TEAM_ROSTER_MINIMUM = 3;

function value(row, camelName, snakeName) {
  return row?.[camelName] ?? row?.[snakeName];
}

function availableSlots(registration) {
  const counts = registration?.counts ?? {};
  const explicit = counts.availableSlots ?? counts.available_slots;
  if (explicit != null) {
    const available = Number(explicit);
    return Number.isFinite(available) ? Math.max(0, available) : 0;
  }
  const capacity = Number(registration?.teamCapacity ?? registration?.team_capacity ?? 0);
  const occupied = Number(counts.occupiedSlots ?? counts.occupied_slots ?? 0);
  if (!Number.isFinite(capacity) || capacity <= 0) return 0;
  return Math.max(0, capacity - (Number.isFinite(occupied) ? occupied : 0));
}

export function deriveAdminSeasonTeamEntry(row, registration) {
  const candidateKind = value(row, 'candidateKind', 'candidate_kind') ?? '';
  const captainPlayerId = value(row, 'captainPlayerId', 'captain_player_id') ?? null;
  const rosterCount = Number(value(row, 'activeRosterCount', 'active_roster_count') ?? 0);
  const slotsOpen = availableSlots(registration);

  if (candidateKind === 'in_season') {
    const missingPlayers = Math.max(0, INITIAL_TEAM_ROSTER_MINIMUM - rosterCount);
    const ready = Boolean(captainPlayerId) && missingPlayers === 0;
    return {
      entryStatus: 'accepted',
      qualified: ready,
      canTakeSlot: false,
      reason: ready
        ? 'Accepted · initial roster qualified'
        : !captainPlayerId
          ? 'Accepted · assign a current-season captain'
          : `Accepted · need ${missingPlayers} more rostered player${missingPlayers === 1 ? '' : 's'}`,
    };
  }

  if (candidateKind === 'returning') {
    return {
      entryStatus: 'forming',
      qualified: false,
      canTakeSlot: slotsOpen > 0,
      reason: slotsOpen > 0
        ? 'Forming · returning priority · reserve a slot to start this season roster'
        : 'Forming · returning priority · no slot currently open',
    };
  }

  const missingPlayers = Math.max(0, INITIAL_TEAM_ROSTER_MINIMUM - rosterCount);
  const qualified = Boolean(captainPlayerId) && missingPlayers === 0;
  if (!qualified) {
    const reasons = [];
    if (!captainPlayerId) reasons.push('assign a captain');
    if (missingPlayers > 0) {
      reasons.push(`add ${missingPlayers} more rostered player${missingPlayers === 1 ? '' : 's'}`);
    }
    return {
      entryStatus: 'forming',
      qualified: false,
      canTakeSlot: false,
      reason: `Forming · ${reasons.join(' · ')}`,
    };
  }

  if (slotsOpen <= 0) {
    const position = candidate?.waitlistPosition ?? candidate?.waitlist_position ?? candidate?.position;
    const qualifiedAt = candidate?.firstQualifiedAt ?? candidate?.first_qualified_at;
    const positionBit = position ? ` · #${position} on waitlist` : '';
    const whenBit = qualifiedAt ? ` · qualified ${String(qualifiedAt).slice(0, 10)}` : '';
    return {
      entryStatus: 'waitlisted',
      qualified: true,
      canTakeSlot: false,
      reason: `Waitlisted · qualified but season is full${positionBit}${whenBit}`,
      waitlistPosition: position ?? null,
      firstQualifiedAt: qualifiedAt ?? null,
    };
  }

  return {
    entryStatus: 'qualified',
    qualified: true,
    canTakeSlot: true,
    reason: 'Qualified · ready for a season slot',
  };
}

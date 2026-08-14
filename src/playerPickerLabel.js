/**
 * Labels for player pickers when display names collide.
 * Identity remains playerId; this is only human-readable context.
 */

export function markDuplicateNames(players = []) {
  const counts = new Map();
  for (const player of players) {
    const key = String(player.displayName || player.display_name || '')
      .trim()
      .toLowerCase();
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return players.map((player) => {
    const key = String(player.displayName || player.display_name || '')
      .trim()
      .toLowerCase();
    return {
      ...player,
      isDuplicateName: Boolean(key && (counts.get(key) || 0) > 1),
    };
  });
}

export function formatPlayerPickerLabel(player = {}) {
  const name = String(player.displayName || player.display_name || 'Player').trim() || 'Player';
  const parts = [];

  if (player.hasLogin === true || player.user_id || player.userId) {
    parts.push('Account linked');
  } else if (player.hasLogin === false || player.user_id === null) {
    parts.push('Unclaimed');
  }

  const teams = player.teamNames || player.teams || [];
  if (Array.isArray(teams) && teams.length) {
    parts.push(teams.slice(0, 2).join(', '));
  } else if (typeof teams === 'string' && teams) {
    parts.push(teams);
  }

  const seasons = player.seasonNames || player.seasons || [];
  if (Array.isArray(seasons) && seasons.length) {
    parts.push(seasons.slice(0, 2).join(', '));
  }

  if (player.registrationStatus) {
    parts.push(`Registered: ${player.registrationStatus}`);
  }
  if (player.paymentStatus) {
    parts.push(`Payment: ${player.paymentStatus}`);
  }

  const created = player.createdAt || player.created_at;
  if (created) {
    const year = String(created).slice(0, 4);
    if (/^\d{4}$/.test(year)) parts.push(`Added ${year}`);
  }

  if (player.isDuplicateName) {
    const id = String(player.playerId || player.id || '');
    if (id.length >= 4) parts.push(`#${id.slice(-4)}`);
  }

  return parts.length ? `${name} — ${parts.join(' · ')}` : name;
}

export function formatPlayerPickerDetail(player = {}) {
  const label = formatPlayerPickerLabel(player);
  const idx = label.indexOf(' — ');
  return idx >= 0 ? label.slice(idx + 3) : '';
}

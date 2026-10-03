export function cleanHouseSettings(input = {}) {
  const nights = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const venue = String(input.venue || '').trim().slice(0, 80) || null;
  const tableSize = String(input.tableSize || input.table_size || '').trim().slice(0, 40) || null;
  const count = Number(input.tableCount || input.table_count || 0);
  const night = String(input.leagueNight || input.league_night || '').trim();
  return {
    venue,
    tableSize,
    tableCount: count >= 1 && count <= 32 ? count : null,
    leagueNight: nights.includes(night) ? night : null,
  };
}

export function houseForFeed(settings = {}, match = {}) {
  return {
    venue: settings.venue || null,
    tableSize: settings.tableSize || null,
    tableCount: settings.tableCount || null,
    leagueNight: settings.leagueNight || null,
    tableNumber: match.tableNumber || match.slot_number || null,
  };
}

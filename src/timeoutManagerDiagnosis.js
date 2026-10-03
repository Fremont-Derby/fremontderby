export function classifyTimeoutManagerWindow({ events = [], requestPaths = [] } = {}) {
  const kills = (events || []).filter((event) => String(event.kind || '') === 'timeout-manager');
  const affected = (requestPaths || []).filter((path) => /\/api\/(seasons|team-matches|player-matches)/.test(path));
  if (!kills.length) {
    return { text: 'No timeout-manager kill was in this window.', affected: false };
  }
  if (!affected.length) {
    return { text: 'No Fremont Derby request is affected.', affected: false };
  }
  return { text: 'A Fremont Derby request overlaps a timeout-manager kill.', affected: true, paths: affected };
}

export function nextMatchBriefing(match) {
  if (!match?.opponent || !match?.when || !match?.where) return null;
  return {
    heading: 'Your next match',
    opponent: match.opponent,
    when: match.when,
    where: match.where,
    text: `You play ${match.opponent} ${match.when} at ${match.where}.`,
  };
}

export function transferCaptaincy(team, successorName) {
  const successor = (team?.members || []).find((member) => member.name === successorName && member.eligible);
  if (!successor) return { ok: false, reason: 'That teammate cannot take captain.' };
  return {
    ok: true,
    captain: successorName,
    formerCaptain: team.captain,
    formerCanManage: false,
  };
}

export function testerMissionView(mission, { debug = false } = {}) {
  return {
    persona: mission.persona,
    task: mission.action,
    path: mission.productRoutes?.[0] || '/schedule',
    debug: debug ? { missionId: mission.missionId, status: mission.status } : null,
  };
}

export function launchLine(mission) {
  return `${mission.persona}: ${mission.action}`;
}

export function testerEntry(mission) {
  if (mission.status === 'fixture-ready' && !(mission.productRoutes || []).length) {
    return { kind: 'coming-soon', href: null };
  }
  return { kind: 'play', href: mission.productRoutes?.[0] || '/schedule' };
}

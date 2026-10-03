export function addPlayers(team, names) {
  const roster = new Set(team.players || []);
  const added = [];
  for (const name of names) {
    if (!name || roster.has(name)) continue;
    roster.add(name);
    added.push(name);
  }
  return { players: [...roster], added, captain: team.captain };
}

export function campaignMissions(missions) {
  return missions.filter((mission) => mission.persona && mission.task).map((mission) => ({
    persona: mission.persona,
    task: mission.task,
    href: mission.href || '/schedule',
  }));
}

export function triageDefect(defect) {
  if (!defect?.label || !defect?.issue) return null;
  return { label: defect.label, issue: defect.issue, text: `${defect.label} tracks #${defect.issue}` };
}

export function recoverRack(match) {
  if (!match?.racks?.length) return { racks: [], recovered: false, matchOpen: true };
  return { racks: match.racks.slice(0, -1), recovered: true, matchOpen: true };
}

export function selectedScoringState(selection) {
  if (!selection?.player || !selection?.rack) return null;
  return `${selection.player} is selected for rack ${selection.rack}.`;
}

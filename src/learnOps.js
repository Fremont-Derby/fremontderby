export function replayCompare(before, after) {
  if (!before || !after) return null;
  return { same: before === after, text: before === after ? 'Replay matches.' : 'Replay differs.' };
}

export function shadowRank(defects) {
  return (defects || []).slice().sort((a, b) => b.score - a.score).map((defect) => defect.name);
}

export function datasetRow(row) {
  if (!row?.input || row.label == null || row.leak) return null;
  return { input: row.input, label: row.label };
}

export function clusterDefects(defects) {
  const groups = {};
  for (const defect of defects || []) {
    const key = defect.kind || 'other';
    groups[key] = (groups[key] || 0) + 1;
  }
  return groups;
}

export function outsideTap(open) {
  return { open: false, text: open ? 'Outside tap closes the menu.' : 'Menu is already closed.' };
}

export function workflowHealth(checks) {
  return (checks || []).map((check) => ({ name: check.name, ok: Boolean(check.ok) }));
}

export function knownIssues(issues) {
  return (issues || []).filter((issue) => !issue.blocking).map((issue) => issue.title);
}

export function releaseDiff(changes) {
  const items = changes || [];
  return { count: items.length, text: items.length ? `${items.length} changes in this gate.` : 'No changes in this gate.' };
}

export function topErrors(errors) {
  return (errors || []).slice().sort((a, b) => b.count - a.count).slice(0, 3);
}

export function provenance(fact) {
  if (!fact?.source) return null;
  return { text: `${fact.name} comes from ${fact.source}.` };
}

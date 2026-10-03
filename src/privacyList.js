export function privacyList() {
  return { text: 'Stored personal data is the player name, phone, and Fargo id. A captain sees the name only.' };
}

export function roleBoundary({ role, action }) {
  if (role === 'admin') return { ok: true, text: 'An admin can open this tool.' };
  return { ok: false, text: `A ${role || 'player'} cannot ${action || 'open this tool'}. Sign in on Profile if this is your job.` };
}

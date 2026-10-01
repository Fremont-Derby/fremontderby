export function publicShell(page) {
  return { ok: Boolean(page?.home && page?.rules && page?.nav), text: 'Home, rules, and navigation are present.' };
}

export function signInProfile(session) {
  return { ok: Boolean(session?.signedIn && session?.profile), text: session?.signedIn ? 'Signed in with a profile.' : 'Sign in is missing.' };
}

export function draftSeason(season) {
  return { ok: season?.status === 'draft' && Boolean(season?.name), text: season?.name ? `${season.name} is a draft.` : 'Draft season needs a name.' };
}

export function registrationPayment(player) {
  return { ok: Boolean(player?.registered) && player?.paid !== undefined, text: player?.paid ? 'Registered and paid.' : 'Registered. Payment is not marked.' };
}

export function teamInvite(invite) {
  if (!invite?.team || !invite?.player) return { ok: false, text: 'Invite needs a team and a player.' };
  return { ok: true, text: `${invite.player} invited to ${invite.team}.` };
}

export function profileStatusLabel(profile) {
  return profile && profile.ready ? 'Profile is ready' : 'Profile needs a status';
}

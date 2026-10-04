export function surveyAdmin(isAdmin) {
  if (!isAdmin) return 'Recent survey results are admin only.';
  return 'Recent survey results are ready for an admin.';
}

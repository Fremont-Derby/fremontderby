export function publicSeasonSmoke(page) {
  return { ok: page?.status === 200 && Boolean(page?.season), text: page?.season ? `Public season ${page.season} loaded.` : 'Public season did not load.' };
}

export function failedChecks(checks) {
  return (checks || []).filter((check) => !check.ok).map((check) => check.name);
}

export function surveyApi(rows) {
  return { count: (rows || []).length, latest: rows?.[0]?.note || null };
}

export function laneSafeBuild(profile) {
  return { ok: profile?.lane && profile.lane !== 'production', text: profile?.lane === 'production' ? 'This build is stamped as production.' : 'Build stays on its lane.' };
}

export function adminSurvey(viewer, rows) {
  if (viewer?.role !== 'admin') return { allowed: false, rows: [] };
  return { allowed: true, rows: rows || [] };
}

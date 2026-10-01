export function historicalRow(row, edit) {
  if (row?.historical && edit) return { allowed: false, text: 'A historical result stays as recorded.' };
  return { allowed: true, text: 'Row can change.' };
}

export function skinEntry(skin) {
  if (!skin?.name || !skin?.lane) return null;
  return { text: `${skin.name} is a ${skin.lane} skin.` };
}

export function simplePage(page) {
  const actions = page?.actions || [];
  return { ok: actions.length <= 1, text: actions.length <= 1 ? 'One next action.' : 'Too many actions.' };
}

export function gammaBypass(config) {
  return { ok: config?.lane !== 'gamma' || config?.bypass !== true, text: config?.bypass ? 'Gamma bypass is on.' : 'Gamma bypass is off.' };
}

export function throttleStep(limit) {
  return { human: true, text: limit ? `Human must raise the limit above ${limit}.` : 'Human must raise the Cloudflare limit.' };
}

export function privacyHold(row) {
  return { fields: ['phone', 'email'].filter((field) => row?.[field]), text: 'Phone and email stay out of public pages.' };
}

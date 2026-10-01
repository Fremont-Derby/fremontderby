export function checkInContrast(row) {
  if (!row?.status) return { ok: false, text: 'Participation is missing.' };
  return { ok: true, text: `${row.name} is ${row.status}.` };
}

export function qualificationProgress(player) {
  const done = player?.done ?? 0;
  const need = player?.need ?? 1;
  return { done, need, text: `${done} of ${need} requirements met.` };
}

export function moreMenuItem(item) {
  if (!item?.label) return null;
  return { label: item.label, contrast: 'readable' };
}

export function formatPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length !== 10) return null;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function oneCaptaincy(roles) {
  const current = (roles || []).filter((role) => role.captain);
  return { ok: current.length <= 1, text: current.length > 1 ? 'Only one captaincy is allowed.' : 'Captaincy is clear.' };
}

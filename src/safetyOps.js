export function finalizedEdit(result, actor) {
  if (result?.final && actor?.role !== 'admin') return { allowed: false, text: 'A finished result cannot be edited.' };
  return { allowed: true, text: 'Edit allowed.' };
}

export function logLine(entry) {
  const secret = /token|password|phone|email/i.test(JSON.stringify(entry || {}));
  return { ok: !secret, text: secret ? 'Log line has personal data.' : 'Log line is safe.' };
}

export function dataInventory(row) {
  return { fields: ['name', 'phone', 'email'].filter((field) => row?.[field]), text: 'Inventory keeps name, phone, and email only.' };
}

export function tabState(tabs) {
  return { ok: (tabs || []).length <= 1 || (tabs || []).every((tab) => tab.saved), text: 'A second tab must not overwrite an unsaved edit.' };
}

export function safeError(error) {
  return { text: error?.public || 'Something went wrong. Try again.', ref: error?.ref || null };
}

export function bracketMatch(match) {
  if (!match?.home || !match?.away) return { ready: false, text: 'A playoff match needs both teams.' };
  return { ready: true, text: `${match.home} against ${match.away}.` };
}

export function runnerReady(runner) {
  return { ok: runner?.hosted === true, text: runner?.hosted ? 'Actions runner is hosted.' : 'Actions runner is missing.' };
}

export function stableRead(call) {
  return { ok: !call?.writes, text: call?.writes ? 'A stable read cannot write.' : 'Read is stable.' };
}

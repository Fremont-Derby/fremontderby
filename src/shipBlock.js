export function shipBlock({ contract, checks }) {
  if (!contract) return { ok: false, text: 'Post the session contract before the pull request.' };
  if (!checks) return { ok: false, text: 'Wait for the required checks before Gamma.' };
  return { ok: true, text: 'DRU is verified. Gamma can take this slice.' };
}

export function gammaPromotion({ verified }) {
  if (!verified) return { ok: false, text: 'Do not publish to Gamma until the DRU screen shows the line.' };
  return { ok: true, text: 'Publish this verified slice to Gamma.' };
}

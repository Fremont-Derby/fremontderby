export function releaseTrain(slice) {
  return { ready: Boolean(slice?.tested && slice?.lane === 'dru'), text: slice?.tested ? 'Tested on DRU. Ready to consider for Gamma.' : 'Not tested yet.' };
}

export function codeqlConfig(pack) {
  return { ok: Boolean(pack && !pack.includes(' ')), text: pack && !pack.includes(' ') ? 'Query pack name is valid.' : 'Query pack name is invalid.' };
}

export function deployCommand(command) {
  return { ok: /wrangler deploy --env (dru|gamma|jfl)/.test(command || ''), text: 'Deploy must name the lane.' };
}

export function workerStamp(worker) {
  return { ok: worker?.name && !worker.name.endsWith('-production'), text: worker?.name?.endsWith('-production') ? 'Lane worker is stamped as production.' : 'Worker name stays on its lane.' };
}

export function publicBuild(source) {
  return { ok: source !== 'public-pr', text: source === 'public-pr' ? 'Public PRs cannot start a production build.' : 'Build source is allowed.' };
}

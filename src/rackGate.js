export function rackAdvance(score) {
  if (!score?.won) return { unlocked: false, text: 'The next rack stays locked until this rack is won.' };
  return { unlocked: true, total: (score.total || 0) + 1, text: 'Rack win advances the score.' };
}
export function skinCatalog(item) {
  return { ok: Boolean(item?.name && item?.lane === 'dru'), text: item?.name ? `${item.name} is a catalog entry.` : 'Name the skin.' };
}
export function workerStamp(worker) {
  return { ok: worker?.lane !== 'production', text: worker?.lane === 'production' ? 'A lane Worker was stamped production.' : 'Lane stamp is safe.' };
}
export function rootProfile(profile) {
  return { ok: profile?.root === 'dru', text: profile?.root === 'dru' ? 'DRU root profile.' : 'Root profile is not DRU.' };
}
export function deployCommand(command) {
  return { ok: Boolean(command?.lane && command?.explicit), text: command?.explicit ? 'Deploy command names the lane.' : 'Deploy command is missing.' };
}
export function schemaIsolation(env) {
  return { ok: Boolean(env?.schema && env.schema !== 'prod'), text: env?.schema ? `Schema ${env.schema}.` : 'Name the schema.' };
}
export function buildRestore(build) {
  return { ok: build?.routed === true, text: build?.routed ? 'Workers Build is routed.' : 'Workers Build is not routed.' };
}
export function publicBuild(build) {
  return { ok: build?.publicPr === false, text: build?.publicPr ? 'A public PR can build.' : 'Public PRs cannot build.' };
}
